import streamlit as st

from rag_in_action.ui import state
from rag_in_action.ui.components import lead
from rag_in_action.views.registry import PAGES

_STAGES = (
    ("Indexing", "Load", "Read 10 Markdown files with their frontmatter, links and keyword index."),
    ("Indexing", "Chunk", "Cut each document into passages. Six strategies, side by side."),
    ("Indexing", "Enrich", "Attach title, section, keywords and links to every chunk."),
    ("Indexing", "Embed", "Turn each chunk into a vector: local MiniLM or OpenAI."),
    ("Indexing", "Store", "Put the vectors in a FAISS index next to their metadata."),
    ("Query", "Retrieve", "Embed the question, rank chunks by meaning, keywords, or both."),
    ("Query", "Generate", "Paste the best chunks into the prompt; the LLM answers and cites."),
    ("Insights", "Analytics", "Cluster support questions into topics; find what the docs miss."),
)


def page() -> None:
    st.title("Watch a question find its answer")
    lead(
        "Retrieval-Augmented Generation gives a language model facts it was never trained on. "
        "Here the facts belong to <b>Nimbus Logistics</b>, an invented cold-chain courier: no "
        "model has seen its documents, so every correct answer has to come from retrieval."
    )
    groups = []
    for phase, cls, note in (
        ("Indexing", "index", "once, ahead of time"),
        ("Query", "query", "on every question"),
        ("Insights", "insights", "later"),
    ):
        stages = "".join(
            f'<div class="stage"><h4>{name}</h4><p>{text}</p></div>'
            for p, name, text in _STAGES
            if p == phase
        )
        groups.append(
            f'<div class="{cls}"><div class="group-label"><b>{phase}</b> · {note}'
            f'</div><div class="row">{stages}</div></div>'
        )
    st.html(f'<div class="hero-flow">{"".join(groups)}</div>')
    c1, c2 = st.columns([1, 2.4], vertical_alignment="center")
    with c1:
        if st.button("Start with step 1 · Load", type="primary", icon=":material/arrow_forward:"):
            st.switch_page(PAGES["load"])
    with c2:
        key = "found" if state.api_key() else "missing: chat answers are disabled"
        st.caption(
            f"Chat model `{state.chat_model()}` · OPENAI_API_KEY {key}. "
            "Local embeddings need no key."
        )
