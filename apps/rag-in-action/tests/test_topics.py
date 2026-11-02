import numpy as np

from rag_in_action.pipeline import topics as tm
from rag_in_action.pipeline.store import VectorStore
from rag_in_action.views.doc_modal import inline_links

TEXTS = [
    "How do I return the ColdBox?",
    "ColdBox return fee of 38 euros",
    "Where do I return a ColdBox sensor?",
    "Can you ship to France with customs?",
    "Customs papers for France shipping",
    "International customs for Morocco",
]
LABELS = np.array([0, 0, 0, 1, 1, 1])


def test_log_is_utc_stamped_and_bucketed_by_week():
    df = tm.load_questions()
    assert len(df) > 200
    assert set(df.columns) >= {"asked", "channel", "customer_tier", "question", "week"}
    assert df["asked"].str.fullmatch(r"\d{4}(-\d{2}){5}").all()
    assert tm.week_of("2026-03-11-09-00-00") == "2026-W11"


def test_c_tf_idf_names_each_cluster_by_its_distinctive_words():
    names = tm.topic_terms(TEXTS, LABELS)
    assert names[0][0] == "coldbox"
    assert "customs" in names[1][:2]


def test_kmeans_is_deterministic_and_separates_obvious_groups():
    rng = np.random.default_rng(0)
    vectors = np.vstack([rng.normal(0, 0.05, (5, 3)) + c for c in ([1, 0, 0], [0, 1, 0])])
    a, b = tm.cluster(vectors, 2), tm.cluster(vectors, 2)
    assert (a == b).all()
    assert len(set(a[:5])) == 1 and len(set(a[5:])) == 1 and a[0] != a[5]


def test_coverage_and_verdicts_flag_the_gap():
    kb = np.eye(3, dtype=np.float32)[:1]  # The KB only talks about axis 0.
    store = VectorStore(3)
    store.add(kb, [{"chunk_id": "kb#0"}])
    vectors = np.array([[1, 0, 0]] * 3 + [[0, 1, 0]] * 3, dtype=np.float32)
    found = tm.topics(TEXTS, LABELS, tm.best_scores(vectors, store), gap=0.4)
    kinds = {t.terms[0]: tm.verdict(t, total=6)[0] for t in found}
    assert kinds["coldbox"] == "unclear"  # Covered, but two of three ask how.
    assert kinds["customs"] == "gap"
    assert [t.unanswered for t in found] == [0.0, 1.0]


def test_new_rows_are_assigned_without_moving_the_topics():
    rng = np.random.default_rng(1)
    base = np.vstack([rng.normal(0, 0.05, (6, 3)) + c for c in ([1, 0, 0], [0, 1, 0], [0, 0, 1])])
    extra = np.vstack([base, [[0.5, 0.5, 0]]])
    fit = np.array([True] * len(base) + [False])
    assert (tm.cluster(extra, 3, fit=fit)[:-1] == tm.cluster(base, 3)).all()


def test_services_match_product_names():
    masks = tm.services(["Frost to Porto?", "Track API 429", "same-day pickup"])
    assert masks["Frost"].tolist() == [True, False, False]
    assert masks["Track API"].tolist() == [False, True, False]
    assert masks["Same-Day Chill"].tolist() == [False, False, True]


def test_modal_keeps_link_text_and_names_target():
    out = inline_links("See the [returns policy](returns-policy.md) first.")
    assert out == "See the **returns policy** (→ `returns-policy`) first."
