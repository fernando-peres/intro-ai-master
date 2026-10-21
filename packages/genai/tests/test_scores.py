import pytest

from genai.assistant import pick_label
from genai.base_model import normalise


def test_normalise_turns_log_probs_into_a_distribution():
    scores = normalise({"a": -1.0, "b": -1.0, "c": -1000.0})
    assert scores["a"] == pytest.approx(0.5)
    assert sum(scores.values()) == pytest.approx(1.0)


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("Mixed.", "Mixed"),
        ("The sentiment is negative, not positive", "Negative"),
        ("I can't tell", None),
    ],
)
def test_pick_label_takes_the_first_label_mentioned(text, expected):
    assert pick_label(text, ["Positive", "Negative", "Mixed"]) == expected
