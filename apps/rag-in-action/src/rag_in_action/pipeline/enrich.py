"""Enrich step: attach metadata to each chunk and build the exact text that gets embedded."""

from dataclasses import dataclass, field

from rag_in_action.pipeline.chunk import Chunk
from rag_in_action.pipeline.load import Document


@dataclass(frozen=True)
class EnrichOptions:
    #: Prefix "Document / Section" so a chunk like "It lasts 21 days." keeps its subject.
    header: bool = True
    keywords: bool = True
    links: bool = True
    tags: bool = True


@dataclass(frozen=True)
class Enriched:
    chunk: Chunk
    #: What the embedder sees; `chunk.text` is what the LLM sees.
    embed_text: str
    meta: dict = field(default_factory=dict)


def matched_terms(text: str, index: dict[str, list[str]]) -> list[str]:
    lowered = text.lower()
    return [term for term in index if term in lowered]


def enrich(
    chunks: list[Chunk],
    docs: dict[str, Document],
    index: dict[str, list[str]],
    options: EnrichOptions,
) -> list[Enriched]:
    out = []
    for c in chunks:
        doc = docs[c.doc_id]
        trail = c.section[1:] if c.section[:1] == (doc.title,) else c.section
        meta: dict = {
            "chunk_id": c.id,
            "doc_id": c.doc_id,
            "title": doc.title,
            "section": " › ".join(trail),
            "chars": len(c.text),
        }
        if options.tags:
            meta |= {
                "department": doc.metadata.get("department"),
                "tags": list(doc.metadata.get("tags", [])),
                "updated": doc.metadata.get("updated"),
            }
        if options.keywords:
            meta["keywords"] = matched_terms(c.text, index)
        if options.links:
            meta["related"] = list(doc.related)
        text = c.text
        if options.header:
            text = f"Document: {doc.title}\nSection: {meta['section'] or '—'}\n\n{c.text}"
        out.append(Enriched(c, text, meta))
    return out
