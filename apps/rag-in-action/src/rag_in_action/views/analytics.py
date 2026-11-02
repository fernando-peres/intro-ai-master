from datetime import UTC, datetime

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from genai.vectors import pca
from rag_in_action.pipeline import topics as tm
from rag_in_action.ui import state
from rag_in_action.ui.components import bar, chips, esc, lead

#: Verdict → (color, label). Semantic colors from the branding rules; no per-topic hues.
VERDICT = {
    "gap": ("#f87171", "Knowledge gap"),
    "unclear": ("#fbbf24", "Process unclear"),
    "demand": ("#d9742e", "High demand"),
    "ok": ("#5b8def", "Covered"),
}
_GRID = "#35291f"
_CHART = {"displayModeBar": False}


def _layout(fig: go.Figure, height: int, **extra) -> go.Figure:
    fig.update_layout(
        height=height,
        margin={"l": 0, "r": 0, "t": 10, "b": 0},
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font={"size": 14},
        **extra,
    )
    return fig


def _log() -> pd.DataFrame:
    """The authored log plus the questions asked in this session's chat."""
    df = tm.load_questions()
    now = datetime.now(UTC).strftime("%Y-%m-%d-%H-%M-%S")
    live = [
        {"asked": now, "channel": "this session", "customer_tier": "—", "question": t["question"]}
        for t in st.session_state.get("chat", [])
    ]
    if live:
        extra = pd.DataFrame(live)
        extra["week"] = extra["asked"].map(tm.week_of)
        df = pd.concat([df, extra], ignore_index=True)
    return df


def _vectors(texts: list[str], model: str) -> np.ndarray:
    cache = st.session_state.setdefault("analytics_vectors", {})
    missing = [t for t in dict.fromkeys(texts) if (model, t) not in cache]
    if missing:
        for t, v in zip(missing, state.embedder(model).encode(missing), strict=True):
            cache[(model, t)] = v
    return np.array([cache[(model, t)] for t in texts])


def _most_asked(found: list[tm.Topic], kinds: dict[int, str]) -> go.Figure:
    ordered = found[::-1]
    fig = go.Figure(
        go.Bar(
            x=[t.size for t in ordered],
            y=[t.name for t in ordered],
            orientation="h",
            marker={"color": [VERDICT[kinds[t.id]][0] for t in ordered]},
            text=[t.size for t in ordered],
            textposition="outside",
            cliponaxis=False,
            hovertemplate="%{y}<br>%{x} questions<extra></extra>",
        )
    )
    return _layout(
        fig,
        44 * len(found) + 40,
        xaxis={"gridcolor": _GRID, "title": "questions", "range": [0, found[0].size * 1.15]},
        yaxis={"automargin": True},
        bargap=0.3,
    )


def _topic_map(vectors, labels, texts, found, kinds, live: np.ndarray) -> go.Figure:
    proj = pca(vectors.tolist(), dimensions=2)
    pts = np.array(proj.points)
    fig = go.Figure()
    for kind, (color, label) in VERDICT.items():
        ids = [t.id for t in found if kinds[t.id] == kind]
        idx = np.where(np.isin(labels, ids) & ~live)[0]
        if not len(idx):
            continue
        fig.add_scatter(
            x=pts[idx, 0],
            y=pts[idx, 1],
            mode="markers",
            name=label,
            marker={"color": color, "size": 9, "opacity": 0.75, "line": {"width": 0}},
            hovertext=[texts[i] for i in idx],
            hoverinfo="text",
        )
    for t in found:
        c = pts[labels == t.id].mean(axis=0)
        fig.add_annotation(
            x=c[0], y=c[1], text=f"<b>{t.terms[0]}</b>", showarrow=False,
            font={"color": "#f5ece0", "size": 15}, bgcolor="rgba(13,10,6,.75)",
        )  # fmt: skip
    if live.any():
        idx = np.where(live)[0]
        fig.add_scatter(
            x=pts[idx, 0],
            y=pts[idx, 1],
            mode="markers",
            name="your questions",
            marker={"symbol": "diamond", "size": 16, "color": "#f5ece0",
                    "line": {"color": "#df753e", "width": 2}},
            hovertext=[texts[i] for i in idx],
            hoverinfo="text",
        )  # fmt: skip
    axis = {"showticklabels": False, "gridcolor": _GRID, "zeroline": False}
    return _layout(fig, 520, xaxis=axis, yaxis=axis, legend={"orientation": "h", "y": -0.04})


def _trend(df: pd.DataFrame, labels, found: list[tm.Topic]) -> go.Figure:
    weeks = sorted(df["week"].unique())
    grid = np.zeros((len(found), len(weeks)))
    col = {w: i for i, w in enumerate(weeks)}
    row = {t.id: i for i, t in enumerate(found)}
    for lab, week in zip(labels, df["week"], strict=True):
        grid[row[lab], col[week]] += 1
    fig = go.Figure(
        go.Heatmap(
            z=grid,
            x=[w.split("-")[1] for w in weeks],
            y=[t.name for t in found],
            colorscale=[[0, "#140d08"], [0.5, "#8a4520"], [1, "#fbbf24"]],
            hovertemplate="%{y}<br>%{x}: %{z} questions<extra></extra>",
            showscale=False,
            xgap=2,
            ygap=2,
        )
    )
    return _layout(fig, 44 * len(found) + 50, yaxis={"autorange": "reversed", "automargin": True})


def _services(texts: list[str]) -> go.Figure:
    masks = tm.services(texts)
    items = sorted(((n, int(m.sum())) for n, m in masks.items()), key=lambda x: x[1])
    fig = go.Figure(
        go.Bar(
            x=[c for _, c in items],
            y=[n for n, _ in items],
            orientation="h",
            marker={"color": "#d9742e"},
            text=[c for _, c in items],
            textposition="outside",
            cliponaxis=False,
            hovertemplate="%{y}: %{x} questions<extra></extra>",
        )
    )
    return _layout(
        fig,
        300,
        xaxis={
            "gridcolor": _GRID,
            "title": "questions that mention it",
            "range": [0, max(c for _, c in items) * 1.15],
        },
    )


def _card(t: tm.Topic, verdict: tuple[str, str], examples: list[str], total: int) -> str:
    kind, sentence = verdict
    advice = sentence.split(": ", 1)[-1]
    color, label = VERDICT[kind]
    qs = "".join(f"<li>{esc(q)}</li>" for q in examples)
    return (
        f'<div class="topic-card" style="--verdict:{color}">'
        f'<div class="head"><span class="verdict">{label}</span>'
        f'<span class="size">{t.size} questions · {t.size / total:.0%}</span></div>'
        f'<div class="chips">{chips(list(t.terms), "kw")}</div>'
        f'<div class="metric">KB can\'t answer <b>{t.unanswered:.0%}</b>{bar(t.unanswered)}</div>'
        f'<div class="metric">"How do I…" share <b>{t.how_to:.0%}</b>{bar(t.how_to)}</div>'
        f'<p class="advice">{esc(advice[:1].upper() + advice[1:])}</p><ul>{qs}</ul></div>'
    )


def page() -> None:
    st.title("Analytics: what are people asking?")
    lead(
        "The same embeddings that power retrieval can read the support inbox. Cluster a log of "
        "customer questions by meaning, name each cluster by its most distinctive words, and "
        "check it against the knowledge base: what is asked most, which processes confuse "
        "people, and what the documents don't cover.",
        ("Support questions", "embed → KMeans → c-TF-IDF names", "Topics and insights"),
    )
    df = _log()
    store, model, index_label = state.analytics_index()
    st.caption(f"Coverage is measured against {index_label}.")
    with st.sidebar:
        st.header("Topics")
        k = st.slider("Number of topics", 4, 14, 10)
        gap = st.slider(
            "Knowledge-gap threshold (best cosine vs. KB)",
            0.2, 0.6, 0.4, 0.01,
            help="A topic whose questions score below this against every chunk is a gap.",
        )  # fmt: skip
        channels = st.multiselect("Channels", sorted(df["channel"].unique()))
        tiers = st.multiselect("Customer tier", sorted(df["customer_tier"].unique()))
    if channels:
        df = df[df["channel"].isin(channels)]
    if tiers:
        df = df[df["customer_tier"].isin(tiers)]
    df = df.reset_index(drop=True)
    if len(df) < k:
        st.html(
            '<div class="notice">Too few questions for that many topics; widen the filters.</div>'
        )
        return
    texts = df["question"].tolist()
    with st.spinner(f"Embedding {len(texts)} questions…"):
        vectors = _vectors(texts, model)
    live = (df["channel"] == "this session").to_numpy()
    labels = tm.cluster(vectors, k, fit=~live if (~live).sum() >= k else None)
    scores = tm.best_scores(vectors, store)
    found = tm.topics(texts, labels, scores, gap)
    verdicts = {t.id: tm.verdict(t, total=len(texts)) for t in found}
    kinds = {i: v[0] for i, v in verdicts.items()}

    gaps = int((scores < gap).sum())
    svc = {n: int(m.sum()) for n, m in tm.services(texts).items()}
    top_service = max(svc.items(), key=lambda item: item[1])[0]
    m = st.columns(4)
    m[0].metric(
        "Questions", len(texts), f"{int(live.sum())} from this session" if live.any() else None
    )
    m[1].metric("Topics", k)
    m[2].metric(
        "KB can't answer", f"{gaps / len(texts):.0%}", f"{gaps} questions", delta_color="off"
    )
    m[3].metric("Most requested", top_service, f"{svc[top_service]} questions", delta_color="off")

    legend = "".join(
        f'<span><b style="background:{c}"></b>{label}</span>' for c, label in VERDICT.values()
    )
    st.html(f'<div class="legend">{legend}</div>')
    left, right = st.columns([1, 1.15], gap="large")
    with left:
        st.subheader("Most asked")
        st.plotly_chart(_most_asked(found, kinds), width="stretch", config=_CHART)
    with right:
        st.subheader("Topic map")
        st.plotly_chart(
            _topic_map(vectors, labels, texts, found, kinds, live),
            width="stretch",
            config=_CHART,
        )
    left, right = st.columns([1.5, 1], gap="large")
    with left:
        st.subheader("Week by week")
        st.caption("A spike means something happened: look for the March outage.")
        st.plotly_chart(_trend(df[~live], labels[~live], found), width="stretch", config=_CHART)
    with right:
        st.subheader("Services requested")
        st.caption("Questions that name a product or service.")
        st.plotly_chart(_services(texts), width="stretch", config=_CHART)

    st.subheader("Insights")
    order = {"gap": 0, "unclear": 1, "demand": 2, "ok": 3}
    cols = st.columns(3, gap="medium")
    for i, t in enumerate(sorted(found, key=lambda t: (order[kinds[t.id]], -t.size))):
        idx = np.where(labels == t.id)[0]
        ranked = idx[np.argsort(scores[idx])] if kinds[t.id] == "gap" else idx
        examples = list(dict.fromkeys(texts[j] for j in ranked))[:3]
        cols[i % 3].html(_card(t, verdicts[t.id], examples, len(texts)))

    with st.expander("How the topics are found"):
        st.markdown(
            f"1. **Embed** every question with the index's model (`{model}`), so questions and "
            "chunks live in the same space.\n"
            "2. **Cluster** the vectors with KMeans: similar questions share a topic.\n"
            "3. **Name** each topic with c-TF-IDF: join a cluster's questions into one document "
            "and keep the words frequent there but rare in the other clusters.\n"
            "4. **Coverage**: for each question, the best cosine against the FAISS index. Low "
            "means no chunk talks about it: a gap in the knowledge base.\n"
            '5. **Process unclear**: covered topics where many questions start with "How do I…" '
            'or "Can I…".'
        )
