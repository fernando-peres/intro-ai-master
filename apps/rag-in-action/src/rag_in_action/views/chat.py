import time

import numpy as np
import streamlit as st

from genai.assistant import OpenAIAssistant
from rag_in_action.pipeline.generate import build_messages, citations
from rag_in_action.pipeline.retrieve import RetrieveOptions, retrieve
from rag_in_action.ui import state
from rag_in_action.ui.components import hit_card, lead, prompt_html, with_citations
from rag_in_action.views.doc_modal import open_doc
from rag_in_action.views.embed import map_figure

STARTERS = (
    "How long does a ColdBox battery last, and what if a customer never returns it?",
    "How much did the March 2026 outage cost in credits, and why was it 100%?",
    (
        "An Enterprise customer's frozen parcel spoiled. "
        "How long do they have to claim, and how much can we pay?"
    ),
    "Why do Frost shipments take an extra day?",
    "Who do I ask about ColdBox hardware in my first week?",
)
_METHODS = {
    "dense": "Dense · meaning (FAISS)",
    "keyword": "Keyword · BM25 + index",
    "hybrid": "Hybrid · both, fused (RRF)",
}


def _controls(records: list[dict]) -> tuple[RetrieveOptions, str]:
    with st.sidebar:
        st.header("Retrieval")
        method = st.radio("Retriever", list(_METHODS), format_func=_METHODS.get, index=2)
        top_k = st.slider("Top-k chunks", 1, 10, 4)
        min_score = st.slider(
            "Minimum cosine (dense only)", 0.0, 0.8, 0.2, 0.05, disabled=method != "dense"
        )
        departments = st.multiselect(
            "Only departments", sorted({r.get("department") or "—" for r in records})
        )
        follow = st.toggle(
            "Follow links to related docs",
            value=False,
            help="Adds the best chunk of each document linked from the hits.",
        )
        st.header("Generation")
        mode = st.segmented_control("Answer", ["RAG", "No RAG", "Both"], default="Both")
        st.caption(f"Model `{state.chat_model()}`")
    return RetrieveOptions(method, top_k, min_score, tuple(departments), follow), mode or "RAG"


def _ask(question: str, options: RetrieveOptions, mode: str) -> dict:
    s = state.get("store")
    store, bm25 = s["store"], s["bm25"]
    embedder = state.embedder(s["model"])
    t0 = time.perf_counter()
    q = embedder.encode([question])[0]
    t1 = time.perf_counter()
    hits, trace = retrieve(question, q, store, bm25, state.get("load")["index"], options)
    t2 = time.perf_counter()
    turn = {
        "question": question,
        "hits": hits,
        "trace": trace,
        "query": q,
        "mode": mode,
        "timing": {"embed query": t1 - t0, "retrieve": t2 - t1},
        "answers": {},
        "prompts": {},
    }
    key = state.api_key()
    for variant in ["RAG", "No RAG"] if mode == "Both" else [mode]:
        messages = build_messages(question, hits, rag=variant == "RAG")
        turn["prompts"][variant] = messages
        if not key:
            turn["answers"][variant] = None
            continue
        t = time.perf_counter()
        try:
            turn["answers"][variant] = OpenAIAssistant(key, state.chat_model()).reply(messages)
        except Exception as error:  # noqa: BLE001 — shown to the user, never swallowed
            turn["answers"][variant] = f"**Generation failed:** {error}"
        turn["timing"][f"generate ({variant})"] = time.perf_counter() - t
    return turn


def _sources(cited: list[str], key: str) -> None:
    """One button per cited chunk; each opens its document in the modal."""
    with st.container(key=f"sources_{key}", horizontal=True, vertical_alignment="center"):
        st.html('<span class="sources-label">Sources</span>')
        for cid in cited:
            if st.button(cid, key=f"cite_{key}_{cid}", icon=":material/description:"):
                open_doc(cid.split("#")[0], cid)


def _answer(text: str | None, variant: str, key: str) -> None:
    if text is None:
        st.html(
            '<div class="notice">No OPENAI_API_KEY: retrieval ran, generation skipped. '
            "The prompt the model would receive is in the trace below.</div>"
        )
        return
    st.markdown(with_citations(text), unsafe_allow_html=True)
    if variant == "RAG":
        cited = citations(text)
        if cited:
            _sources(cited, key)
        else:
            st.caption("No citations: the model may be answering from memory.")


def _turn(n: int, turn: dict, proj) -> None:
    with st.chat_message("user", avatar=":material/person:"):
        st.markdown(turn["question"])
    with st.chat_message("assistant", avatar=":material/neurology:"):
        answers = turn["answers"]
        if len(answers) == 2:
            a, b = st.columns(2, gap="large")
            with a:
                st.markdown("**With retrieval**")
                _answer(answers["RAG"], "RAG", f"{n}")
            with b:
                st.markdown("**Without retrieval** · model memory only")
                _answer(answers["No RAG"], "No RAG", f"{n}n")
        else:
            ((variant, text),) = answers.items()
            _answer(text, variant, f"{n}")
        timing = "".join(
            f"<span>{k} <b>{v * 1000:.0f} ms</b></span>" for k, v in turn["timing"].items()
        )
        st.html(f'<div class="timing">{timing}</div>')
        with st.expander(
            "What happened: retrieved chunks, prompt, meaning map",
            expanded=turn is st.session_state["chat"][-1],
        ):
            tab_hits, tab_prompt, tab_map = st.tabs(
                ["Retrieved chunks", "Augmented prompt", "Meaning map"]
            )
            with tab_hits:
                hits = turn["hits"]
                if not hits:
                    st.html(
                        '<div class="notice">Nothing passed the filters. Lower the minimum '
                        "score or switch retriever.</div>"
                    )
                top = max((h.score for h in hits if h.source != "link"), default=1)
                terms = turn["trace"]["index_terms"]
                if terms:
                    st.caption(
                        f"Keyword-index terms in the question: {', '.join(terms)} → boosts "
                        f"{', '.join(sorted(turn['trace']['boosted']))}"
                    )
                cols = st.columns(2)
                for i, h in enumerate(hits):
                    with cols[i % 2]:
                        st.html(hit_card(i + 1, h, top))
                        rec = h.record
                        if st.button(
                            f"Open {rec['doc_id']}.md",
                            key=f"src_{n}_{i}",
                            type="tertiary",
                            icon=":material/open_in_new:",
                        ):
                            open_doc(rec["doc_id"], rec["chunk_id"])
            with tab_prompt:
                variant = "RAG" if "RAG" in turn["prompts"] else "No RAG"
                st.html(prompt_html(turn["prompts"][variant]))
            with tab_map:
                records = state.get("store")["store"].records
                q = (np.array(turn["query"], dtype=np.float64) - np.array(proj.mean)) @ np.array(
                    proj.components
                ).T
                st.plotly_chart(
                    map_figure(
                        np.array(proj.points),
                        records,
                        highlight={h.record["chunk_id"] for h in turn["hits"]},
                        query=q,
                        height=460,
                    ),
                    width="stretch",
                    config={"displayModeBar": False},
                    key=f"map_{n}",
                )


def page() -> None:
    st.title("Retrieve, augment, generate")
    lead(
        "Your question is embedded with the same model as the chunks, the index returns the "
        "nearest ones, and they are pasted into the prompt as context. Ask the same thing "
        "<i>without</i> retrieval to see what the model makes up.",
        ("Question", "retrieve top-k → augment prompt → LLM", "Answer with citations"),
    )
    records = state.get("store")["store"].records
    options, mode = _controls(records)
    history: list = st.session_state.setdefault("chat", [])
    question = st.chat_input("Ask about Nimbus Logistics…") or st.session_state.pop("pending", None)
    if question:
        with st.spinner("Retrieving and generating…"):
            history.append(_ask(question, options, mode))
    if not history:
        st.caption("Try one of these: each needs facts that exist only in the Nimbus documents.")
        for i, q in enumerate(STARTERS):
            if st.button(q, key=f"starter_{i}", icon=":material/help:"):
                st.session_state["pending"] = q
                st.rerun()
    proj = state.get("store")["pca"]
    for n, turn in enumerate(history):
        _turn(n, turn, proj)
    if history and st.button("Clear chat", icon=":material/delete_sweep:"):
        st.session_state["chat"] = []
        st.rerun()
