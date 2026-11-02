"""Retrieve step: dense (FAISS), keyword (BM25 + keyword index) and hybrid (RRF) ranking."""

import math
import re
from collections import Counter
from dataclasses import dataclass, field

import numpy as np

from rag_in_action.pipeline.store import VectorStore

_WORD = re.compile(r"[a-z0-9€%]+")
_STOP = frozenset(
    "a an and are as at be by do does for from how i if in is it of on or the to what when "
    "which who why with you your my we our can".split()
)
RRF_K = 60


def words(text: str) -> list[str]:
    return [w for w in _WORD.findall(text.lower()) if w not in _STOP]


@dataclass(frozen=True)
class Hit:
    row: int
    record: dict
    score: float
    #: dense | keyword | hybrid | link
    source: str
    detail: dict = field(default_factory=dict)


@dataclass(frozen=True)
class RetrieveOptions:
    method: str = "dense"
    top_k: int = 4
    min_score: float = 0.0
    departments: tuple[str, ...] = ()
    follow_links: bool = False


class BM25:
    def __init__(self, texts: list[str], k1: float = 1.5, b: float = 0.75) -> None:
        self.docs = [Counter(words(t)) for t in texts]
        self.lengths = [sum(d.values()) for d in self.docs]
        self.avg = (sum(self.lengths) / len(self.lengths)) if self.lengths else 0
        df = Counter(w for d in self.docs for w in d)
        n = len(self.docs)
        self.idf = {w: math.log(1 + (n - f + 0.5) / (f + 0.5)) for w, f in df.items()}
        self.k1, self.b = k1, b

    def scores(self, query: str) -> tuple[np.ndarray, list[set[str]]]:
        terms = words(query)
        out = np.zeros(len(self.docs))
        matched: list[set[str]] = [set() for _ in self.docs]
        for i, (d, length) in enumerate(zip(self.docs, self.lengths, strict=True)):
            for t in terms:
                if t in d:
                    tf = d[t]
                    norm = tf + self.k1 * (1 - self.b + self.b * length / (self.avg or 1))
                    out[i] += self.idf[t] * tf * (self.k1 + 1) / norm
                    matched[i].add(t)
        return out, matched


def _allowed(record: dict, options: RetrieveOptions) -> bool:
    return not options.departments or record.get("department") in options.departments


def _rank(scores: np.ndarray) -> list[int]:
    return [int(i) for i in np.argsort(-scores, kind="stable")]


def retrieve(
    query: str,
    query_vector: np.ndarray,
    store: VectorStore,
    bm25: BM25,
    keyword_index: dict[str, list[str]],
    options: RetrieveOptions,
) -> tuple[list[Hit], dict]:
    """Top hits plus a trace of every chunk's dense/keyword score for the UI."""
    dense = np.full(store.size, -1.0)
    for row, score in store.search(query_vector, store.size):
        dense[row] = score
    keyword, matched = bm25.scores(query)
    lowered = query.lower()
    index_terms = [t for t in keyword_index if t in lowered]
    boosted = {d for t in index_terms for d in keyword_index[t]}
    for i, r in enumerate(store.records):
        if r["doc_id"] in boosted:
            keyword[i] *= 1.25
    allowed = [i for i, r in enumerate(store.records) if _allowed(r, options)]

    def ordered(scores: np.ndarray) -> list[int]:
        return [i for i in _rank(scores) if i in set(allowed)]

    dense_order, keyword_order = ordered(dense), ordered(keyword)
    if options.method == "dense":
        order, final = dense_order, dense
    elif options.method == "keyword":
        order, final = [i for i in keyword_order if keyword[i] > 0], keyword
    else:
        final = np.zeros(store.size)
        for rank, i in enumerate(dense_order):
            final[i] += 1 / (RRF_K + rank + 1)
        for rank, i in enumerate(i for i in keyword_order if keyword[i] > 0):
            final[i] += 1 / (RRF_K + rank + 1)
        order = ordered(final)
    threshold = options.min_score if options.method == "dense" else -math.inf

    def detail(i: int) -> dict:
        return {"dense": float(dense[i]), "bm25": float(keyword[i]), "terms": sorted(matched[i])}

    hits = [
        Hit(i, store.records[i], float(final[i]), options.method, detail(i))
        for i in order
        if final[i] >= threshold
    ][: options.top_k]
    if options.follow_links:
        seen_docs = {h.record["doc_id"] for h in hits}
        linked = [d for h in hits for d in h.record.get("related", [])]
        for doc_id in dict.fromkeys(linked):
            if doc_id in seen_docs:
                continue
            best = next((i for i in dense_order if store.records[i]["doc_id"] == doc_id), None)
            if best is not None:
                hits.append(
                    Hit(best, store.records[best], float(dense[best]), "link", detail(best))
                )
                seen_docs.add(doc_id)
            if len(hits) >= options.top_k * 2:
                break
    trace = {"dense": dense, "keyword": keyword, "index_terms": index_terms, "boosted": boosted}
    return hits, trace
