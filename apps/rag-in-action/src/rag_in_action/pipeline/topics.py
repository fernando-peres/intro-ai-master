"""Topic modeling over a support-question log: KMeans on embeddings, named by c-TF-IDF."""

import re
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS, CountVectorizer

from rag_in_action.pipeline.load import CORPUS_DIR
from rag_in_action.pipeline.store import VectorStore

QUESTIONS_CSV = CORPUS_DIR / "support" / "questions.csv"
#: Product or service → pattern that counts a question as asking about it.
SERVICES = {
    "ColdBox": r"coldbox",
    "Same-Day Chill": r"same[- ]day",
    "Next-Day Chill": r"next[- ]day",
    "Frost": r"\bfrost\b",
    "Track API": r"\bapi\b|webhook|429",
}
_HOW_TO = re.compile(r"^(how do|how can|can i|can we|what do i need|do i need|where)", re.I)
_EXTRA_STOP = [
    "does",
    "did",
    "didn",
    "need",
    "nimbus",
    "parcel",
    "parcels",
    "shipment",
    "shipments",
]


@dataclass(frozen=True)
class Topic:
    id: int
    terms: tuple[str, ...]
    size: int
    coverage: float
    #: Share of its questions whose best KB cosine is below the gap threshold.
    unanswered: float
    how_to: float

    @property
    def name(self) -> str:
        return " · ".join(self.terms[:3])


def load_questions(path: Path = QUESTIONS_CSV) -> pd.DataFrame:
    """Columns: asked (UTC `YYYY-MM-DD-HH-mm-ss`), channel, customer_tier, question, week."""
    df = pd.read_csv(path)
    df["week"] = df["asked"].map(week_of)
    return df


def week_of(stamp: str) -> str:
    when = datetime.strptime(stamp, "%Y-%m-%d-%H-%M-%S").replace(tzinfo=UTC)
    year, week, _ = when.isocalendar()
    return f"{year}-W{week:02d}"


def cluster(vectors: np.ndarray, k: int, *, fit: np.ndarray | None = None, seed: int = 0):
    """Labels for every row; centroids learn only from `fit` rows, so new ones don't move them."""
    base = vectors if fit is None else vectors[fit]
    k = max(1, min(k, len(base)))
    return KMeans(n_clusters=k, n_init=10, random_state=seed).fit(base).predict(vectors)


def topic_terms(texts: list[str], labels: np.ndarray, n: int = 6) -> dict[int, tuple[str, ...]]:
    """Top c-TF-IDF terms per cluster: each cluster's questions are read as one document."""
    ids = sorted(set(labels.tolist()))
    joined = [" ".join(t for t, lab in zip(texts, labels, strict=True) if lab == i) for i in ids]
    stop = [*ENGLISH_STOP_WORDS, *_EXTRA_STOP]
    vec = CountVectorizer(stop_words=stop, ngram_range=(1, 2), token_pattern=r"(?u)\b[a-z][\w-]+\b")
    counts = np.asarray(vec.fit_transform(joined).todense(), dtype=float)
    tf = counts / np.maximum(counts.sum(axis=1, keepdims=True), 1)
    avg_words = counts.sum() / len(ids)
    idf = np.log1p(avg_words / np.maximum(counts.sum(axis=0), 1))
    scores = tf * idf
    vocab = vec.get_feature_names_out()
    out = {}
    for row, i in enumerate(ids):
        picked: list[str] = []
        for j in np.argsort(-scores[row]):
            term = str(vocab[j])
            if scores[row, j] <= 0:
                break
            if any(term in p or p in term for p in picked):
                continue
            picked.append(term)
            if len(picked) == n:
                break
        out[i] = tuple(picked)
    return out


def best_scores(vectors: np.ndarray, store: VectorStore) -> np.ndarray:
    """Each question's highest cosine against the knowledge base."""
    return np.array([store.search(v, 1)[0][1] if store.size else 0.0 for v in vectors])


def topics(texts: list[str], labels: np.ndarray, scores: np.ndarray, gap: float) -> list[Topic]:
    """Topics sorted by size, largest first."""
    names = topic_terms(texts, labels)
    how = np.array([bool(_HOW_TO.match(t)) for t in texts])
    out = [
        Topic(
            id=i,
            terms=names[i],
            size=int((labels == i).sum()),
            coverage=float(scores[labels == i].mean()),
            unanswered=float((scores[labels == i] < gap).mean()),
            how_to=float(how[labels == i].mean()),
        )
        for i in names
    ]
    return sorted(out, key=lambda t: -t.size)


def verdict(topic: Topic, *, total: int) -> tuple[str, str]:
    """(kind, sentence) where kind is `gap`, `unclear`, `demand` or `ok`."""
    share = topic.size / max(total, 1)
    if topic.unanswered >= 0.5:
        return "gap", "Knowledge gap: the documents don't answer this. Write one."
    if topic.how_to >= 0.25 and share >= 0.1:
        return (
            "unclear",
            "Process unclear: the answer exists, yet many still ask how. Fix the docs or the flow.",
        )
    if share >= 0.1:
        return "demand", "High demand: one of the most asked subjects. Make it a FAQ."
    return "ok", "Covered: the documents answer it and volume is ordinary."


def services(texts: list[str]) -> dict[str, np.ndarray]:
    """Per service, a boolean mask over `texts` of questions that mention it."""
    return {
        name: np.array([bool(re.search(p, t, re.I)) for t in texts]) for name, p in SERVICES.items()
    }
