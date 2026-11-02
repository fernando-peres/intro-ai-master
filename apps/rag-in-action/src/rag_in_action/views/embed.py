import numpy as np
import plotly.graph_objects as go
import streamlit as st

from genai.vectors import pca
from rag_in_action.ui import state
from rag_in_action.ui.components import chunk_card, lead
from rag_in_action.ui.stepper import next_button
from rag_in_action.views.registry import PAGES

_LABELS = {
    "minilm": "all-MiniLM-L6-v2 · local · 384-d",
    "openai": "text-embedding-3-small · OpenAI · 1536-d",
}
_BATCH = 16


def map_figure(
    points: np.ndarray,
    records: list[dict],
    *,
    highlight: set[str],
    query: np.ndarray | None = None,
    height: int = 520,
) -> go.Figure:
    """2-D PCA of the chunks; highlighted chunk ids in accent, the query as a cream diamond."""
    on = np.array([r["chunk_id"] in highlight for r in records])
    hover = [f"{r['chunk_id']}<br>{r['section'][:60]}" for r in records]
    fig = go.Figure()
    for mask, color, size, name in ((~on, "#8c8378", 8, "chunk"), (on, "#df753e", 14, "selected")):
        idx = np.where(mask)[0]
        fig.add_scatter(
            x=points[idx, 0],
            y=points[idx, 1],
            mode="markers",
            name=name,
            marker={
                "color": color,
                "size": size,
                "opacity": 0.95 if name != "chunk" else 0.55,
                "line": {"color": "#0d0a06", "width": 1},
            },
            hovertext=[hover[i] for i in idx],
            hoverinfo="text",
        )
    if query is not None:
        fig.add_scatter(
            x=[query[0]],
            y=[query[1]],
            mode="markers+text",
            name="question",
            text=["question"],
            textposition="top center",
            textfont={"color": "#f5ece0"},
            marker={
                "symbol": "diamond",
                "size": 18,
                "color": "#f5ece0",
                "line": {"color": "#df753e", "width": 2},
            },
        )
    fig.update_layout(
        height=height,
        margin={"l": 0, "r": 0, "t": 10, "b": 0},
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        legend={"orientation": "h", "y": -0.05},
        xaxis={"title": "PC 1", "gridcolor": "#35291f", "zeroline": False},
        yaxis={"title": "PC 2", "gridcolor": "#35291f", "zeroline": False},
    )
    return fig


def page() -> None:
    st.title("Embed: text becomes coordinates")
    lead(
        "An embedding model reads each chunk and returns a list of numbers, a point in a space "
        "where texts with similar meaning land close together. Every vector is scaled to length "
        "1, so the dot product of two vectors <i>is</i> their cosine similarity.",
        ("Embed text", "encoder model", "Unit vectors"),
    )
    enriched = state.get("enrich")["enriched"]
    records = [e.meta for e in enriched]
    controls, out = st.columns([1, 2.1], gap="large")
    with controls:
        has_key = bool(state.api_key())
        key = st.radio(
            "Embedding model",
            ["minilm", "openai"],
            format_func=_LABELS.get,
            captions=[
                "Runs on this laptop, free. 256-token limit per chunk.",
                "API call, ~$0.02 per million tokens."
                if has_key
                else "Needs OPENAI_API_KEY in the repo-root .env.",
            ],
        )
        if key == "openai" and not has_key:
            st.warning("Set OPENAI_API_KEY to use OpenAI embeddings.", icon=":material/key:")
        go_embed = st.button(
            f"Embed {len(enriched)} chunks",
            type="primary",
            icon=":material/scatter_plot:",
            disabled=key == "openai" and not has_key,
        )
        if go_embed:
            model = state.embedder(key)
            texts = [e.embed_text for e in enriched]
            bar = st.progress(0.0, text="Embedding…")
            rows = []
            for i in range(0, len(texts), _BATCH):
                rows.append(model.encode(texts[i : i + _BATCH]))
                bar.progress(
                    min(1.0, (i + _BATCH) / len(texts)),
                    text=f"Embedded {min(i + _BATCH, len(texts))} / {len(texts)}",
                )
            vectors = np.vstack(rows)
            proj = pca(vectors.tolist(), dimensions=2)
            state.complete("embed", vectors=vectors, model=key, pca=proj)
            st.rerun()
    if not state.done("embed"):
        with out:
            st.html(
                '<div class="notice">Pick a model and embed the chunks to see the vectors.</div>'
            )
        return
    d = state.get("embed")
    vectors, proj = d["vectors"], d["pca"]
    with controls:
        st.success(
            f"{vectors.shape[0]} vectors × {vectors.shape[1]} dimensions "
            f"({_LABELS[d['model']].split(' · ')[0]}).",
            icon=":material/check:",
        )
    with out:
        tab_map, tab_nums, tab_near = st.tabs(["Meaning map", "The numbers", "Nearest neighbours"])
        ids = [r["chunk_id"] for r in records]
        with tab_map:
            docs = sorted({r["doc_id"] for r in records})
            doc = st.selectbox(
                "Highlight a document",
                docs,
                index=docs.index("shipping-slas") if "shipping-slas" in docs else 0,
            )
            st.plotly_chart(
                map_figure(
                    np.array(proj.points),
                    records,
                    highlight={i for i in ids if i.startswith(doc + "#")},
                ),
                width="stretch",
                config={"displayModeBar": False},
            )
            st.caption(
                f"{vectors.shape[1]} dimensions squeezed to 2 with PCA; these two axes keep "
                f"{sum(proj.explained_variance_ratio):.0%} of the spread, so distances are "
                "only a rough guide."
            )
        with tab_nums:
            n, dims = min(12, len(ids)), 48
            fig = go.Figure(
                go.Heatmap(
                    z=vectors[:n, :dims],
                    y=ids[:n],
                    colorscale=[[0, "#5b8def"], [0.5, "#140d08"], [1, "#d9742e"]],
                    zmid=0,
                    colorbar={"title": "value"},
                )
            )
            fig.update_layout(
                height=460,
                margin={"l": 0, "r": 0, "t": 10, "b": 0},
                paper_bgcolor="rgba(0,0,0,0)",
                xaxis_title=f"first {dims} dimensions",
            )
            st.plotly_chart(fig, width="stretch", config={"displayModeBar": False})
            st.code(
                f"{ids[0]} → [{', '.join(f'{x:+.3f}' for x in vectors[0, :8])}, …]  "
                f"‖v‖ = {np.linalg.norm(vectors[0]):.3f}",
                language=None,
            )
        with tab_near:
            pick = st.selectbox("Chunk", ids, key="near_pick")
            i = ids.index(pick)
            sims = vectors @ vectors[i]
            order = [j for j in np.argsort(-sims) if j != i][:3]
            st.html(chunk_card(pick, "selected", enriched[i].chunk.text))
            for j in order:
                st.html(chunk_card(ids[j], f"cosine {sims[j]:.3f}", enriched[j].chunk.text))
    next_button("Next · Store", "store", PAGES, enabled=True)
