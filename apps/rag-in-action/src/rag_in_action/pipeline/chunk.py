"""Chunk step: split a document body into `Chunk`s with exact character offsets.

Every strategy returns chunks whose `text == body[start:end]`, so the UI can highlight
them in place and show overlaps. Semantic chunking takes an `embed` callable so this
module stays independent of any model.
"""

import re
from collections.abc import Callable
from dataclasses import dataclass, field

import numpy as np

from rag_in_action.pipeline.load import Document

Embed = Callable[[list[str]], np.ndarray]


@dataclass(frozen=True)
class Chunk:
    id: str
    doc_id: str
    index: int
    start: int
    end: int
    text: str
    #: Heading trail at `start`, e.g. ("Shipping SLAs", "Service credits").
    section: tuple[str, ...] = ()
    meta: dict = field(default_factory=dict)


@dataclass(frozen=True)
class Strategy:
    key: str
    label: str
    description: str
    params: dict  # name -> (default, min, max, step)


STRATEGIES: dict[str, Strategy] = {
    s.key: s
    for s in (
        Strategy(
            "fixed_chars",
            "Fixed size · characters",
            "Cut every N characters, with an overlap. Simple, but it cuts words and sentences.",
            {"size": (400, 100, 2000, 50), "overlap": (50, 0, 500, 10)},
        ),
        Strategy(
            "fixed_tokens",
            "Fixed size · tokens",
            "Cut every N tokens (words and punctuation), with an overlap. Respects word edges.",
            {"size": (80, 20, 400, 10), "overlap": (10, 0, 100, 5)},
        ),
        Strategy(
            "recursive",
            "Recursive separators",
            "Split on headings, then paragraphs, then sentences, until each piece fits.",
            {"size": (500, 100, 2000, 50), "overlap": (0, 0, 300, 10)},
        ),
        Strategy(
            "markdown",
            "Markdown headers",
            "One chunk per section; the heading path travels with it as metadata.",
            {"max_level": (3, 1, 3, 1)},
        ),
        Strategy(
            "sentence_window",
            "Sentence window",
            "Groups of N sentences, sliding by a stride. Small, precise chunks.",
            {"window": (3, 1, 10, 1), "stride": (2, 1, 10, 1)},
        ),
        Strategy(
            "semantic",
            "Semantic",
            "Embed every sentence; start a new chunk where neighbours stop being similar.",
            {"threshold": (0.25, 0.0, 1.0, 0.05), "max_sentences": (8, 2, 20, 1)},
        ),
    )
}

_HEADING = re.compile(r"^(#{1,6})\s+(.+?)\s*$", re.MULTILINE)
_TOKEN = re.compile(r"\w+|[^\w\s]")
_SENTENCE = re.compile(r"[^\n.!?]+(?:[.!?]+|\n|$)")


def headings(body: str) -> list[tuple[int, int, str]]:
    """(offset, level, title) for each Markdown heading."""
    return [(m.start(), len(m.group(1)), m.group(2)) for m in _HEADING.finditer(body)]


def section_at(heads: list[tuple[int, int, str]], offset: int) -> tuple[str, ...]:
    trail: list[tuple[int, str]] = []
    for start, level, title in heads:
        if start > offset:
            break
        trail = [t for t in trail if t[0] < level] + [(level, title)]
    return tuple(t for _, t in trail)


def _trim(body: str, start: int, end: int) -> tuple[int, int]:
    while start < end and body[start].isspace():
        start += 1
    while end > start and body[end - 1].isspace():
        end -= 1
    return start, end


def _spans_fixed_chars(body: str, size: int, overlap: int) -> list[tuple[int, int]]:
    step = max(1, size - min(overlap, size - 1))
    return [(i, min(i + size, len(body))) for i in range(0, len(body), step)]


def _spans_fixed_tokens(body: str, size: int, overlap: int) -> list[tuple[int, int]]:
    tokens = [m.span() for m in _TOKEN.finditer(body)]
    step = max(1, size - min(overlap, size - 1))
    return [
        (tokens[i][0], tokens[min(i + size, len(tokens)) - 1][1])
        for i in range(0, len(tokens), step)
    ]


def _sentences(body: str) -> list[tuple[int, int]]:
    spans = [_trim(body, *m.span()) for m in _SENTENCE.finditer(body)]
    return [(s, e) for s, e in spans if e - s > 1]


_SEPARATORS = (r"\n(?=#{1,3} )", r"\n\s*\n", r"(?<=[.!?])\s+", r"\s+")


def _spans_recursive(body: str, size: int, overlap: int) -> list[tuple[int, int]]:
    def split(start: int, end: int, level: int) -> list[tuple[int, int]]:
        if end - start <= size or level == len(_SEPARATORS):
            return [(start, end)]
        inner = (start + m.end() for m in re.finditer(_SEPARATORS[level], body[start:end]))
        cuts = [start, *(c for c in inner if start < c < end), end]
        pieces = list(zip(cuts, cuts[1:], strict=False))
        merged: list[tuple[int, int]] = []
        for a, b in pieces:
            if merged and b - merged[-1][0] <= size:
                merged[-1] = (merged[-1][0], b)
            else:
                merged.append((a, b))
        return [s for a, b in merged for s in split(a, b, level + 1)]

    spans = split(0, len(body), 0)
    if overlap:
        spans = [(max(0, a - overlap) if i else a, b) for i, (a, b) in enumerate(spans)]
    return spans


def _spans_markdown(body: str, max_level: int) -> list[tuple[int, int]]:
    cuts = [0, *(s for s, level, _ in headings(body) if level <= max_level), len(body)]
    cuts = sorted(set(cuts))
    return list(zip(cuts, cuts[1:], strict=False))


def _spans_sentence_window(body: str, window: int, stride: int) -> list[tuple[int, int]]:
    sents = _sentences(body)
    spans = []
    for i in range(0, len(sents), stride):
        group = sents[i : i + window]
        spans.append((group[0][0], group[-1][1]))
        if i + window >= len(sents):
            break
    return spans


def _spans_semantic(
    body: str, threshold: float, max_sentences: int, embed: Embed | None
) -> list[tuple[int, int]]:
    if embed is None:
        raise ValueError("Semantic chunking needs an embedder")
    sents = _sentences(body)
    if len(sents) < 2:
        return sents
    vectors = embed([body[s:e] for s, e in sents])
    sims = (vectors[:-1] * vectors[1:]).sum(axis=1)
    spans, first, count = [], 0, 1
    for i, sim in enumerate(sims, start=1):
        if sim < threshold or count >= max_sentences:
            spans.append((sents[first][0], sents[i - 1][1]))
            first, count = i, 1
        else:
            count += 1
    spans.append((sents[first][0], sents[-1][1]))
    return spans


def chunk_document(
    doc: Document, strategy: str, params: dict, *, embed: Embed | None = None
) -> list[Chunk]:
    """Chunks of `doc.body`; empty spans are dropped. Raises `KeyError` for an unknown strategy."""
    body = doc.body
    fn = {
        "fixed_chars": lambda: _spans_fixed_chars(body, params["size"], params["overlap"]),
        "fixed_tokens": lambda: _spans_fixed_tokens(body, params["size"], params["overlap"]),
        "recursive": lambda: _spans_recursive(body, params["size"], params["overlap"]),
        "markdown": lambda: _spans_markdown(body, params["max_level"]),
        "sentence_window": lambda: _spans_sentence_window(body, params["window"], params["stride"]),
        "semantic": lambda: _spans_semantic(
            body, params["threshold"], params["max_sentences"], embed
        ),
    }[strategy]
    heads = headings(body)
    chunks: list[Chunk] = []
    for raw_start, raw_end in fn():
        start, end = _trim(body, raw_start, raw_end)
        if end - start < 2:
            continue
        i = len(chunks)
        chunks.append(
            Chunk(f"{doc.id}#{i}", doc.id, i, start, end, body[start:end], section_at(heads, start))
        )
    return chunks


def chunk_corpus(
    docs: list[Document], strategy: str, params: dict, *, embed: Embed | None = None
) -> list[Chunk]:
    return [c for d in docs for c in chunk_document(d, strategy, params, embed=embed)]
