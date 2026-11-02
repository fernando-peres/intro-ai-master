"""Load step: parse each corpus Markdown file into a `Document` (frontmatter, body, links)."""

import re
from dataclasses import dataclass
from pathlib import Path

import yaml

CORPUS_DIR = Path(__file__).resolve().parents[3] / "corpus"

_FRONTMATTER = re.compile(r"\A---\n(.*?)\n---\n", re.DOTALL)
_MD_LINK = re.compile(r"\[([^\]]+)\]\(([\w.-]+)\.md\)")


@dataclass(frozen=True)
class Link:
    text: str
    target: str


@dataclass(frozen=True)
class Document:
    id: str
    title: str
    path: str
    metadata: dict
    #: Markdown after the frontmatter; chunk offsets index into this string.
    body: str
    links: tuple[Link, ...]

    @property
    def related(self) -> tuple[str, ...]:
        """Ids from `related:` plus inline link targets, deduplicated, in order."""
        ids = [*self.metadata.get("related", []), *(link.target for link in self.links)]
        return tuple(dict.fromkeys(i for i in ids if i != self.id))


def parse(text: str, path: str) -> Document:
    """Raises `ValueError` when the frontmatter is missing or has no `id`."""
    match = _FRONTMATTER.match(text)
    if not match:
        raise ValueError(f"{path}: missing YAML frontmatter")
    meta = yaml.safe_load(match.group(1)) or {}
    if "id" not in meta:
        raise ValueError(f"{path}: frontmatter has no id")
    meta = {k: str(v) if k == "updated" else v for k, v in meta.items()}
    body = text[match.end() :]
    links = tuple(Link(m.group(1), m.group(2)) for m in _MD_LINK.finditer(body))
    return Document(meta["id"], meta.get("title", meta["id"]), path, meta, body, links)


def load_corpus(directory: Path = CORPUS_DIR) -> list[Document]:
    """Every `*.md` file in `directory`, sorted by file name."""
    return [parse(p.read_text("utf-8"), p.name) for p in sorted(directory.glob("*.md"))]


def load_keyword_index(directory: Path = CORPUS_DIR) -> dict[str, list[str]]:
    """The hand-written `_index.yml`: lowercase term → document ids."""
    raw = yaml.safe_load((directory / "_index.yml").read_text("utf-8")) or {}
    return {str(term).lower(): list(ids) for term, ids in raw.items()}
