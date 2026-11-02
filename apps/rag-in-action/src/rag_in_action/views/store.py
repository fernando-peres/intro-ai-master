import hashlib
import json
from pathlib import Path

import pandas as pd
import streamlit as st

from rag_in_action.pipeline.retrieve import BM25
from rag_in_action.pipeline.store import VectorStore
from rag_in_action.ui import state
from rag_in_action.ui.components import lead
from rag_in_action.ui.stepper import next_button
from rag_in_action.views.registry import PAGES

VAR_DIR = Path(__file__).resolve().parents[3] / "var"


def config_hash() -> str:
    c, e, m = state.get("chunk"), state.get("enrich"), state.get("embed")
    cfg = {
        "strategy": c["strategy"],
        "params": c["params"],
        "enrich": e["options"].__dict__,
        "model": m["model"],
    }
    return hashlib.sha1(json.dumps(cfg, sort_keys=True).encode()).hexdigest()[:10]


def page() -> None:
    st.title("Store the vectors in FAISS")
    lead(
        "A vector database keeps every vector next to its metadata and answers one question "
        "fast: <i>which stored vectors are closest to this one?</i> FAISS "
        "<code>IndexFlatIP</code> compares the query with every row (exact search). "
        "On unit vectors, inner product = cosine.",
        ("Vectors + metadata", "index.add()", "Searchable index"),
    )
    enriched, vectors = state.get("enrich")["enriched"], state.get("embed")["vectors"]
    controls, out = st.columns([1, 2.1], gap="large")
    with controls:
        st.code(
            "import faiss\n\n"
            f"index = faiss.IndexFlatIP({vectors.shape[1]})\n"
            f"index.add(vectors)   # shape {vectors.shape}\n"
            "scores, rows = index.search(q, k)",
            language="python",
        )
        if st.button("Build the index", type="primary", icon=":material/database:"):
            store = VectorStore(vectors.shape[1])
            store.add(
                vectors,
                [e.meta | {"text": e.chunk.text, "embed_text": e.embed_text} for e in enriched],
            )
            state.complete(
                "store",
                store=store,
                bm25=BM25([e.embed_text for e in enriched]),
                model=state.get("embed")["model"],
                pca=state.get("embed")["pca"],
            )
            st.rerun()
    if not state.done("store"):
        with out:
            st.html('<div class="notice">Build the index to inspect what FAISS holds.</div>')
        return
    store = state.get("store")["store"]
    with controls:
        if st.button("Save to disk", icon=":material/save:"):
            target = VAR_DIR / config_hash()
            store.save(target)
            st.success(f"Saved to `{target.relative_to(VAR_DIR.parent)}`", icon=":material/check:")
    with out:
        m = st.columns(4)
        m[0].metric("Rows (ntotal)", store.size)
        m[1].metric("Dimensions", store.dimensions)
        m[2].metric("Vector memory", f"{store.nbytes / 1024:.0f} KB")
        m[3].metric("Index", "IndexFlatIP")
        st.caption(
            "Sidecar: row i of the index ↔ record i below. FAISS stores only numbers; "
            "the text and metadata live next to it."
        )
        rows = [
            {
                "row": i,
                "chunk_id": r["chunk_id"],
                "section": r["section"],
                "department": r.get("department"),
                "keywords": ", ".join(r.get("keywords", [])),
                "text": r["text"][:120],
            }
            for i, r in enumerate(store.records)
        ]
        st.dataframe(pd.DataFrame(rows), hide_index=True, width="stretch", height=430)
    next_button("Next · Retrieve & chat", "chat", PAGES, enabled=True)
