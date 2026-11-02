import streamlit as st

from rag_in_action.pipeline.enrich import EnrichOptions, enrich
from rag_in_action.ui import state
from rag_in_action.ui.components import esc, lead
from rag_in_action.ui.stepper import next_button
from rag_in_action.views.registry import PAGES


def page() -> None:
    st.title("Enrich every chunk")
    lead(
        'A chunk cut from the middle of a page forgets where it came from: <i>"The battery '
        'lasts 21 days"</i> never says <i>which</i> battery. Enrichment puts that context '
        "back as metadata, and optionally as a header in the text that gets embedded.",
        ("Chunks", "attach metadata", "Chunks + metadata + embed text"),
    )
    load, chunk = state.get("load"), state.get("chunk")
    docs = {d.id: d for d in load["docs"]}
    chunks = chunk["chunks"]
    controls, out = st.columns([1, 2.1], gap="large")
    with controls:
        options = EnrichOptions(
            header=st.toggle(
                "Contextual header (title + section) in the embedded text", value=True
            ),
            keywords=st.toggle("Keywords from the index", value=True),
            links=st.toggle("Related documents (links)", value=True),
            tags=st.toggle("Department, tags and date", value=True),
        )
        enriched = enrich(chunks, docs, load["index"], options)
        ids = [e.chunk.id for e in enriched]
        default = next((i for i, e in enumerate(enriched) if "battery" in e.chunk.text), 0)
        pick = st.selectbox("Inspect chunk", ids, index=default)
        if st.button("Enrich all chunks", type="primary", icon=":material/sell:"):
            state.complete("enrich", enriched=enriched, options=options)
            st.rerun()
        if state.done("enrich"):
            st.success(
                f"{len(state.get('enrich')['enriched'])} chunks enriched.", icon=":material/check:"
            )
    with out:
        e = enriched[ids.index(pick)]
        added = e.embed_text[: len(e.embed_text) - len(e.chunk.text)]
        st.html(
            '<div class="diff"><div><div class="label">Chunk text: what the LLM will read</div>'
            f"<pre>{esc(e.chunk.text)}</pre></div>"
            '<div><div class="label">Embed text: what the embedder will see</div>'
            f'<pre><span class="add">{esc(added)}</span>{esc(e.chunk.text)}</pre></div></div>'
        )
        st.markdown(
            '<div class="label" style="margin-top:1rem">Metadata stored next to the vector</div>',
            unsafe_allow_html=True,
        )
        st.json(e.meta, expanded=True)
    next_button("Next · Embed", "embed", PAGES, enabled=state.done("enrich"))
