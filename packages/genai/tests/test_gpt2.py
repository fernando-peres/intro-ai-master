"""Runs the real GPT-2 (downloads ~500 MB once). Skip with `-m "not slow"`."""

import pytest

pytest.importorskip("transformers")

from genai.base_model import GPT2Model  # noqa: E402

pytestmark = pytest.mark.slow

model = GPT2Model()


def test_greedy_generation_is_deterministic_and_reports_candidates():
    kwargs = dict(max_tokens=3, temperature=0.0, top_k=5, seed=1)
    first = model.generate_steps("The capital of France is", **kwargs)
    assert first == model.generate_steps("The capital of France is", **kwargs)
    assert len(first) == 3
    assert first[0].token == first[0].top_k[0].token
    assert all(len(step.top_k) == 5 for step in first)


def test_generation_stops_at_the_stop_text():
    steps = model.generate_steps(
        "Q: 2+2?\nA: 4\n\nQ: 3+3?\nA:", max_tokens=20, temperature=0.0, top_k=3, seed=1, stop="\n"
    )
    assert "\n" in steps[-1].token
    assert len(steps) < 20


def test_attention_is_causal_and_each_row_is_a_distribution():
    attention = model.attention("The cat sat on the", layer=5, top_k=3)
    n = len(attention.tokens)
    assert n == 5 and attention.heads == 12 and len(attention.weights) == 12
    for head in attention.weights:
        for q, row in enumerate(head):
            assert len(row) == n
            assert sum(row) == pytest.approx(1.0, abs=1e-3)
            assert row[q + 1 :] == [0.0] * (n - q - 1)
    assert len(attention.next_tokens) == 3
    assert attention.next_tokens[0].prob >= attention.next_tokens[1].prob


def test_attention_rejects_a_missing_layer():
    with pytest.raises(ValueError):
        model.attention("Hi", layer=12, top_k=1)


def test_label_scores_form_a_distribution():
    scores = model.label_scores("Review: I love it!\nSentiment:", ["Positive", "Negative"])
    assert set(scores) == {"Positive", "Negative"}
    assert sum(scores.values()) == pytest.approx(1.0)
