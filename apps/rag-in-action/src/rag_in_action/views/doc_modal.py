"""The source-document modal opened from citations and retrieved-chunk cards."""

import re

import streamlit as st

from rag_in_action.ui import state
from rag_in_action.ui.components import chips, esc

_MD_LINK = re.compile(r"\[([^\]]+)\]\(([\w.-]+)\.md\)")


_H1 = re.compile(r"\A\s*# [^\n]*\n+")


def inline_links(body: str) -> str:
    """Corpus links can't navigate inside a modal; keep their text, name the target."""
    return _MD_LINK.sub(lambda m: f"**{m.group(1)}** (→ `{m.group(2)}`)", body)


def open_doc(doc_id: str, chunk_id: str | None = None) -> None:
    st.session_state["modal_doc"] = (doc_id, chunk_id)
    _dialog()


@st.dialog("Source document", width="large")
def _dialog() -> None:
    doc_id, chunk_id = st.session_state["modal_doc"]
    docs = {d.id: d for d in state.get("load")["docs"]}
    doc = docs.get(doc_id)
    if doc is None:
        st.error(f"No document `{doc_id}` in the corpus.")
        return
    meta = doc.metadata
    facts = [meta.get("department"), meta.get("owner"), f"updated {meta.get('updated')}"]
    st.html(
        f'<div class="modal-head"><span class="id">{esc(doc.id)}.md</span>'
        f"<h3>{esc(doc.title)}</h3>"
        f'<div class="chips">{chips([f for f in facts if f])}'
        f"{chips(meta.get('tags') or [], 'kw')}</div></div>"
    )
    if chunk_id:
        records = state.get("store")["store"].records if state.done("store") else []
        text = next((r["text"] for r in records if r["chunk_id"] == chunk_id), None)
        if text and chunk_id.split("#")[0] == doc.id:
            st.html(
                f'<div class="cited"><div class="label">Cited passage · {esc(chunk_id)}</div>'
                f"{esc(text)}</div>"
            )
    with st.container(key="modal_body"):
        st.markdown(inline_links(_H1.sub("", doc.body)))
    related = [r for r in doc.related if r in docs]
    if related:
        st.caption("Related documents")
        with st.container(key="modal_related", horizontal=True):
            for rid in related:
                if st.button(
                    docs[rid].title, key=f"modal_rel_{rid}", icon=":material/arrow_forward:"
                ):
                    st.session_state["modal_doc"] = (rid, None)
                    st.rerun(scope="fragment")
