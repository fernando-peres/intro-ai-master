import numpy as np
import pytest

from rag_in_action.pipeline.chunk import STRATEGIES, chunk_corpus, chunk_document, section_at
from rag_in_action.pipeline.enrich import EnrichOptions, enrich
from rag_in_action.pipeline.generate import build_messages, citations
from rag_in_action.pipeline.load import load_corpus, load_keyword_index, parse
from rag_in_action.pipeline.retrieve import BM25, Hit, RetrieveOptions, retrieve
from rag_in_action.pipeline.store import VectorStore

DOCS = load_corpus()
INDEX = load_keyword_index()
BY_ID = {d.id: d for d in DOCS}


def _fake_embed(texts: list[str]) -> np.ndarray:
    rows = np.array([[len(t) % 7 + 1, t.count("e") + 1, 1.0] for t in texts])
    return rows / np.linalg.norm(rows, axis=1, keepdims=True)


def test_corpus_metadata_links_and_index():
    assert len(DOCS) == 10
    for d in DOCS:
        assert {"id", "title", "department", "updated", "tags", "related"} <= d.metadata.keys()
        assert all(r in BY_ID for r in d.related), d.id
    assert all(i in BY_ID for ids in INDEX.values() for i in ids)
    assert "pricing-tiers" in BY_ID["returns-policy"].related


def test_parse_rejects_missing_frontmatter():
    with pytest.raises(ValueError):
        parse("# no frontmatter", "x.md")


@pytest.mark.parametrize("strategy", list(STRATEGIES))
def test_every_strategy_returns_exact_offsets(strategy):
    params = {k: v[0] for k, v in STRATEGIES[strategy].params.items()}
    chunks = chunk_corpus(DOCS, strategy, params, embed=_fake_embed)
    assert chunks
    for c in chunks:
        assert c.text == BY_ID[c.doc_id].body[c.start : c.end]
        assert c.text == c.text.strip()


def test_fixed_chars_overlap_and_size():
    chunks = chunk_document(BY_ID["shipping-slas"], "fixed_chars", {"size": 200, "overlap": 50})
    assert all(len(c.text) <= 200 for c in chunks)
    assert any(b.start < a.end for a, b in zip(chunks, chunks[1:], strict=False))


def test_recursive_respects_size():
    chunks = chunk_document(BY_ID["pricing-tiers"], "recursive", {"size": 300, "overlap": 0})
    assert max(len(c.text) for c in chunks) <= 300


def test_markdown_chunks_keep_heading_path():
    chunks = chunk_document(BY_ID["shipping-slas"], "markdown", {"max_level": 3})
    sections = [c.section for c in chunks]
    assert ("Shipping SLAs", "Service credits") in sections
    assert section_at([(0, 1, "A"), (10, 2, "B"), (20, 2, "C")], 25) == ("A", "C")


def test_semantic_needs_an_embedder():
    with pytest.raises(ValueError):
        chunk_document(BY_ID["glossary"], "semantic", {"threshold": 0.5, "max_sentences": 4})


def test_enrich_header_and_keywords():
    chunks = chunk_document(BY_ID["product-catalog"], "markdown", {"max_level": 3})
    out = enrich(chunks, BY_ID, INDEX, EnrichOptions())
    battery = next(e for e in out if "21 days" in e.chunk.text)
    assert battery.embed_text.startswith("Document: Product Catalog\nSection:")
    assert "coldbox" in battery.meta["keywords"]
    plain = enrich(chunks, BY_ID, INDEX, EnrichOptions(False, False, False, False))
    assert plain[0].embed_text == plain[0].chunk.text and "keywords" not in plain[0].meta


def _store():
    chunks = chunk_corpus(DOCS, "markdown", {"max_level": 3})
    enriched = enrich(chunks, BY_ID, INDEX, EnrichOptions())
    vectors = _fake_embed([e.embed_text for e in enriched]).astype(np.float32)
    store = VectorStore(vectors.shape[1])
    store.add(vectors, [e.meta | {"text": e.chunk.text} for e in enriched])
    return store, BM25([e.embed_text for e in enriched]), vectors


def test_store_search_and_round_trip(tmp_path):
    store, _, vectors = _store()
    row, score = store.search(vectors[5], 1)[0]
    assert np.isclose(score, 1.0, atol=1e-5) and np.allclose(vectors[row], vectors[5])
    store.save(tmp_path)
    again = VectorStore.load(tmp_path)
    assert again.size == store.size and again.records == store.records
    with pytest.raises(ValueError):
        store.add(vectors[:2], [{}])


def test_keyword_retrieval_finds_the_postmortem():
    store, bm25, vectors = _store()
    hits, trace = retrieve(
        "total credit for the March outage certificate",
        vectors[0],
        store,
        bm25,
        INDEX,
        RetrieveOptions(method="keyword", top_k=3),
    )
    assert hits[0].record["doc_id"] == "incident-2026-03-postmortem"
    assert "certificate" in trace["index_terms"]


def test_filters_hybrid_and_links():
    store, bm25, vectors = _store()
    opts = RetrieveOptions(method="hybrid", top_k=3, departments=("Sales",), follow_links=True)
    hits, _ = retrieve("enterprise claim cap", vectors[0], store, bm25, INDEX, opts)
    assert hits and all(h.record["department"] == "Sales" for h in hits)
    opts = RetrieveOptions(method="hybrid", top_k=3, follow_links=True)
    hits, _ = retrieve("enterprise claim cap", vectors[0], store, bm25, INDEX, opts)
    linked = [h for h in hits if h.source == "link"]
    assert linked and not {h.record["doc_id"] for h in linked} & {
        h.record["doc_id"] for h in hits if h.source != "link"
    }


def test_prompt_and_citations():
    hit = Hit(
        0,
        {"chunk_id": "glossary#2", "title": "Glossary", "section": "", "text": "IAR"},
        0.9,
        "dense",
    )
    rag = build_messages("What is IAR?", [hit], rag=True)
    assert "[glossary#2] Glossary\nIAR" in rag[1].content and rag[0].role == "system"
    assert "Context" not in build_messages("What is IAR?", [hit], rag=False)[1].content
    assert citations("A [glossary#2] and [x#1], again [glossary#2].") == ["glossary#2", "x#1"]
