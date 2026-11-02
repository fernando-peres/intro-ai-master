"""The rail across the top of every page: one pill per stage, locked until its turn."""

import streamlit as st

from rag_in_action.ui import state

STEPS = (
    ("load", "Load", "load"),
    ("chunk", "Chunk", "chunk"),
    ("enrich", "Enrich", "enrich"),
    ("embed", "Embed", "embed"),
    ("store", "Store", "store"),
    ("chat", "Retrieve", "chat"),
    ("analytics", "Analytics", "analytics"),
)


def _stat(stage: str) -> str:
    if stage == "analytics":
        return "topics" if state.done("store") else ""
    if stage == "chat":
        n = len(st.session_state.get("chat", []))
        return f"{n} question{'s' if n != 1 else ''}" if n else ""
    if not state.done(stage):
        return ""
    d = state.get(stage)
    return {
        "load": lambda: f"{len(d['docs'])} docs",
        "chunk": lambda: f"{len(d['chunks'])} chunks",
        "enrich": lambda: f"{sum(d['options'].__dict__.values())} enrichments",
        "embed": lambda: f"{d['vectors'].shape[1]}-d vectors",
        "store": lambda: f"{d['store'].size} rows · FAISS",
    }[stage]()


def rail(current: str, pages: dict) -> None:
    with st.container(key="rail"):
        cols = st.columns([0.9, 1, 1, 1, 1, 1, 1.3, 1.15], vertical_alignment="top", gap="small")
        cols[0].html('<div class="brand">RAG <b>in action</b></div>')
        for col, (i, (key, label, page)) in zip(cols[1:], enumerate(STEPS, start=1), strict=True):
            is_done = (
                bool(st.session_state.get("chat"))
                if key == "chat"
                else key != "analytics" and state.done(key)
            )
            with col:
                clicked = st.button(
                    f"{i} · {label}",
                    key=f"rail_{key}",
                    type="primary" if key == current else "secondary",
                    icon=":material/check:" if is_done and key != current else None,
                    disabled=not state.ready_for(key),
                    width="stretch",
                )
                stat = _stat(key)
                st.html(f'<div class="rail-stat {"done" if stat else ""}">{stat or "&nbsp;"}</div>')
            if clicked and key != current:
                st.switch_page(pages[page])


def next_button(label: str, target: str, pages: dict, *, enabled: bool) -> None:
    st.write("")
    if st.button(
        label,
        type="primary",
        disabled=not enabled,
        icon=":material/arrow_forward:",
        key=f"next_{target}",
    ):
        st.switch_page(pages[target])
