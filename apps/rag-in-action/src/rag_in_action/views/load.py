import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from rag_in_action.pipeline.load import load_corpus, load_keyword_index
from rag_in_action.ui import state
from rag_in_action.ui.components import lead
from rag_in_action.ui.stepper import next_button
from rag_in_action.views.registry import PAGES


def _link_graph(docs) -> go.Figure:
    import math

    n = len(docs)
    pos = {
        d.id: (math.cos(2 * math.pi * i / n), math.sin(2 * math.pi * i / n))
        for i, d in enumerate(docs)
    }
    xs, ys = [], []
    for d in docs:
        for target in d.related:
            if target in pos:
                xs += [pos[d.id][0], pos[target][0], None]
                ys += [pos[d.id][1], pos[target][1], None]
    degree = {d.id: 0 for d in docs}
    for d in docs:
        for t in d.related:
            if t in degree:
                degree[t] += 1
    fig = go.Figure()
    fig.add_scatter(
        x=xs, y=ys, mode="lines", line={"color": "#554c42", "width": 1}, hoverinfo="skip"
    )
    fig.add_scatter(
        x=[pos[d.id][0] for d in docs],
        y=[pos[d.id][1] for d in docs],
        mode="markers+text",
        text=[d.id for d in docs],
        textposition="top center",
        textfont={"color": "#d9cac1", "size": 13},
        marker={
            "size": [12 + 3 * degree[d.id] for d in docs],
            "color": "#d9742e",
            "line": {"color": "#0d0a06", "width": 2},
        },
        hovertext=[f"{d.title}<br>linked from {degree[d.id]} docs" for d in docs],
        hoverinfo="text",
    )
    fig.update_layout(
        showlegend=False,
        height=520,
        margin={"l": 10, "r": 10, "t": 20, "b": 10},
        xaxis={"visible": False, "range": [-1.45, 1.45]},
        yaxis={"visible": False},
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
    )
    return fig


def page() -> None:
    st.title("Load the documents")
    lead(
        "Loading reads each file and separates what the document <i>says</i> (the body) from "
        "what we <i>know about it</i> (frontmatter: owner, department, date, tags, related "
        "docs). That metadata later filters and explains retrieval.",
        ("corpus/*.md", "parse frontmatter + links", "10 Documents"),
    )
    if not state.done("load"):
        if st.button("Load the corpus", type="primary", icon=":material/folder_open:"):
            state.complete("load", docs=load_corpus(), index=load_keyword_index())
            st.rerun()
        return
    docs, index = state.get("load")["docs"], state.get("load")["index"]
    tab_docs, tab_links, tab_index = st.tabs(["Documents", "Link graph", "Keyword index"])
    with tab_docs:
        table = pd.DataFrame(
            [
                {
                    "id": d.id,
                    "title": d.title,
                    "department": d.metadata.get("department"),
                    "owner": d.metadata.get("owner"),
                    "updated (UTC)": d.metadata.get("updated"),
                    "tags": ", ".join(d.metadata.get("tags", [])),
                    "chars": len(d.body),
                    "links out": len(d.related),
                }
                for d in docs
            ]
        )
        st.dataframe(table, hide_index=True, width="stretch")
        left, right = st.columns([1, 2])
        with left:
            chosen = st.selectbox("Open a document", [d.id for d in docs])
            view = st.segmented_control("View", ["Rendered", "Raw file"], default="Rendered")
            doc = next(d for d in docs if d.id == chosen)
            st.json(doc.metadata, expanded=True)
        with right:
            if view == "Raw file":
                st.code(doc.body, language="markdown", height=560)
            else:
                with st.container(height=560, border=True):
                    st.markdown(doc.body)
    with tab_links:
        st.caption(
            "Edges come from `related:` in the frontmatter and from inline Markdown links. "
            "Bigger nodes are linked to more often."
        )
        st.plotly_chart(_link_graph(docs), width="stretch", config={"displayModeBar": False})
    with tab_index:
        st.caption(
            "Hand-written in `corpus/_index.yml`. Retrieval boosts chunks from these "
            "documents when a query contains the term."
        )
        st.dataframe(
            pd.DataFrame(
                [
                    {"term": t, "documents": ", ".join(ids), "count": len(ids)}
                    for t, ids in index.items()
                ]
            ),
            hide_index=True,
            width="stretch",
        )
    next_button("Next · Chunk", "chunk", PAGES, enabled=True)
