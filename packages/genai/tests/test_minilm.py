"""Runs the real all-MiniLM-L6-v2 (downloads ~90 MB once). Skip with `-m "not slow"`."""

import numpy as np
import pytest

pytest.importorskip("sentence_transformers")

from sentence_transformers import SentenceTransformer  # noqa: E402

from genai.sentence_vectors import MiniLMEncoder  # noqa: E402

pytestmark = pytest.mark.slow

encoder = MiniLMEncoder()
TEXTS = ["The car is very fast.", "The automobile moves quickly.", "I enjoy playing football."]


def cosine(a, b):
    a, b = np.array(a), np.array(b)
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))


def test_encode_returns_384_dimensional_unit_vectors():
    for item in encoder.encode(TEXTS):
        assert len(item.vector) == 384
        assert np.linalg.norm(item.vector) == pytest.approx(1.0, abs=1e-4)
        assert not item.truncated


def test_manual_masked_mean_matches_sentence_transformers():
    oracle = SentenceTransformer(
        MiniLMEncoder.name, revision=MiniLMEncoder.REVISION, device="cpu"
    ).encode(TEXTS)
    ours = np.array([i.vector for i in encoder.encode(TEXTS)])
    assert np.allclose(ours, oracle, atol=1e-4)


def test_raw_mean_normalizes_to_the_encoded_vector():
    raw = encoder.encode(TEXTS, normalize=False)
    unit = encoder.encode(TEXTS)
    for r, u in zip(raw, unit, strict=True):
        v = np.array(r.vector)
        assert np.linalg.norm(v) != pytest.approx(1.0, abs=1e-2)
        assert np.allclose(v / np.linalg.norm(v), u.vector, atol=1e-4)


def test_inspect_returns_one_vector_per_word_piece():
    result = encoder.inspect("Embeddings are fun")
    n = len(result.tokens)
    assert result.tokens[0] == "[CLS]" and result.tokens[-1] == "[SEP]"
    assert len(result.ids) == len(result.attention_mask) == len(result.token_vectors) == n
    assert result.attention_mask == [1] * n
    tokens = np.array(result.token_vectors)
    assert tokens.shape == (n, 384)
    assert np.allclose(result.pooled.mean, tokens.mean(axis=0), atol=1e-4)
    assert result.pooled.cls == result.token_vectors[0]
    assert (np.array(result.pooled.max) >= tokens.max(axis=0) - 1e-4).all()
    assert np.linalg.norm(result.pooled.mean_normalized) == pytest.approx(1.0, abs=1e-4)
    assert result.trained_pooling == "mean" and not result.truncated


def test_long_text_truncates_at_256_word_pieces():
    text = " ".join(["word"] * 400)
    (item,) = encoder.encode([text])
    assert item.tokens == 256 and item.truncated
    assert encoder.inspect(text).truncated


def test_similar_sentences_score_higher_than_unrelated_ones():
    car, automobile, football = (i.vector for i in encoder.encode(TEXTS))
    assert cosine(car, automobile) > cosine(car, football) + 0.2
