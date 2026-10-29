"""Runs the real BERT small encoder (downloads ~115 MB once). Skip with `-m "not slow"`."""

import pytest

pytest.importorskip("transformers")

from genai.encoder_model import BertSmallModel  # noqa: E402

pytestmark = pytest.mark.slow

model = BertSmallModel()


def test_attention_is_bidirectional_over_wordpiece_tokens():
    attention = model.attention("The bank is beside the river.", layer=0, top_k=5)
    assert attention.tokens == [
        "[CLS]",
        "the",
        "bank",
        "is",
        "beside",
        "the",
        "river",
        ".",
        "[SEP]",
    ]
    assert attention.heads == 8 and len(attention.weights) == 8 and attention.layer == 0
    bank, river = 2, 6
    for head in attention.weights:
        for row in head:
            assert len(row) == 9 and sum(row) == pytest.approx(1.0, abs=1e-3)
    # An encoder lets "bank" look forward at "river": head 4 puts most of its weight there.
    assert attention.weights[4][bank][river] > 0.5
    assert attention.next_tokens == []


def test_missing_layer_is_rejected():
    with pytest.raises(ValueError):
        model.attention("Hi", layer=4, top_k=1)
