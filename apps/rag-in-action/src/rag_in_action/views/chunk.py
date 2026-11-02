import pandas as pd
import plotly.express as px
import streamlit as st

from rag_in_action.pipeline.chunk import STRATEGIES, chunk_corpus, chunk_document
from rag_in_action.ui import state
from rag_in_action.ui.components import LEGEND, chunk_card, highlighted, lead
from rag_in_action.ui.stepper import next_button
from rag_in_action.views.registry import PAGES


def _params(strategy: str, prefix: str) -> dict:
    out = {}
    cols = st.columns(len(STRATEGIES[strategy].params))
    for col, (name, (default, lo, hi, step)) in zip(
        cols, STRATEGIES[strategy].params.items(), strict=True
    ):
        out[name] = col.slider(name.replace("_", " "), lo, hi, default, step, key=f"{prefix}{name}")
    return out


def _embed_fn(strategy: str):
    return state.embedder("minilm").encode if strategy == "semantic" else None


def _strategy_picker(prefix: str, default: str = "markdown") -> tuple[str, dict]:
    keys = list(STRATEGIES)
    strategy = st.selectbox(
        "Strategy",
        keys,
        index=keys.index(default),
        format_func=lambda k: STRATEGIES[k].label,
        key=f"{prefix}strategy",
    )
    st.caption(STRATEGIES[strategy].description)
    return strategy, _params(strategy, prefix)


def _histogram(chunks) -> None:
    lengths = pd.DataFrame({"characters": [len(c.text) for c in chunks]})
    fig = px.histogram(lengths, x="characters", nbins=30, color_discrete_sequence=["#d9742e"])
    fig.update_layout(
        height=230,
        margin={"l": 0, "r": 0, "t": 10, "b": 0},
        bargap=0.08,
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        yaxis_title="chunks",
    )
    st.plotly_chart(fig, width="stretch", config={"displayModeBar": False})


def page() -> None:
    st.title("Chunk the documents")
    lead(
        "A model can only read so much, and a retriever ranks better when each piece is about "
        "one thing. Chunking decides where those pieces start and end. Too big and the facts "
        "drown; too small and they lose their subject.",
        ("10 Documents", "split by a strategy", "Chunks with offsets"),
    )
    docs = state.get("load")["docs"]
    by_id = {d.id: d for d in docs}
    tab_one, tab_compare = st.tabs(["Explore a strategy", "Compare two strategies"])
    with tab_one:
        controls, preview = st.columns([1, 2.1], gap="large")
        with controls:
            strategy, params = _strategy_picker("one_")
            doc_id = st.selectbox("Preview document", list(by_id), index=2, key="one_doc")
            with st.spinner("Chunking…"):
                chunks = chunk_document(by_id[doc_id], strategy, params, embed=_embed_fn(strategy))
            m1, m2 = st.columns(2)
            m1.metric("Chunks in this doc", len(chunks))
            m2.metric(
                "Avg characters", round(sum(len(c.text) for c in chunks) / max(1, len(chunks)))
            )
            if st.button("Chunk the whole corpus", type="primary", icon=":material/content_cut:"):
                with st.spinner("Chunking 10 documents…"):
                    all_chunks = chunk_corpus(docs, strategy, params, embed=_embed_fn(strategy))
                state.complete("chunk", chunks=all_chunks, strategy=strategy, params=params)
                st.rerun()
            if state.done("chunk"):
                d = state.get("chunk")
                st.success(
                    f"Corpus chunked with **{STRATEGIES[d['strategy']].label}**: "
                    f"{len(d['chunks'])} chunks.",
                    icon=":material/check:",
                )
        with preview:
            st.html(highlighted(by_id[doc_id].body, chunks) + LEGEND)
        if state.done("chunk"):
            st.subheader("Chunk lengths across the corpus")
            _histogram(state.get("chunk")["chunks"])
    with tab_compare:
        doc_id = st.selectbox("Document", list(by_id), index=3, key="cmp_doc")
        left, right = st.columns(2, gap="large")
        for col, prefix, default in ((left, "a_", "fixed_chars"), (right, "b_", "markdown")):
            with col:
                strategy, params = _strategy_picker(prefix, default)
                chunks = chunk_document(by_id[doc_id], strategy, params, embed=_embed_fn(strategy))
                st.caption(f"**{len(chunks)} chunks** · first one below, all of them highlighted")
                if chunks:
                    st.html(chunk_card(chunks[0].id, " › ".join(chunks[0].section), chunks[0].text))
                st.html(highlighted(by_id[doc_id].body, chunks))
    next_button("Next · Enrich", "enrich", PAGES, enabled=state.done("chunk"))
