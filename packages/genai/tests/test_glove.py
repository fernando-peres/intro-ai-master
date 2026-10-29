"""Runs the real GloVe 6B 300-d (downloads ~480 MB once). Skip with `-m "not slow"`."""

import math

import pytest

pytest.importorskip("safetensors")

from genai.word_vectors import GloveVectors, MissingWords  # noqa: E402

pytestmark = pytest.mark.slow

glove = GloveVectors()


def test_lookup_returns_300_finite_dimensions():
    (dog,) = glove.lookup(["dog"]).found
    assert len(dog.vector) == 300 == glove.dimensions
    assert math.isfinite(dog.norm) and dog.norm > 0
    assert dog.rank > 1
    assert glove.loaded


def test_king_man_woman_has_queen_in_the_top_five():
    result = glove.analogy(["king", "woman"], ["man"], top_k=5, vocab_limit=100_000)
    assert "queen" in [n.word for n in result.neighbors]
    assert len(result.vector) == 300


def test_analogy_excludes_inputs_and_padding():
    result = glove.analogy(["king", "woman"], ["man"], top_k=20, vocab_limit=100_000)
    words = {n.word for n in result.neighbors}
    assert not {"king", "woman", "man", "PADDING_TOKEN"} & words
    assert all(n.rank > 0 for n in result.neighbors)


def test_lookup_is_case_insensitive_and_suggests_by_prefix():
    lookup = glove.lookup(["  DOG ", "elephantine1234"])
    assert [w.word for w in lookup.found] == ["dog"]
    (missing,) = lookup.missing
    assert missing.word == "elephantine1234"
    assert 0 < len(missing.suggestions) <= 5
    assert all(s.startswith("ele") for s in missing.suggestions)


def test_analogy_with_a_missing_word_raises():
    with pytest.raises(MissingWords) as error:
        glove.analogy(["king", "zzzqqq"], ["man"], top_k=5, vocab_limit=100_000)
    assert [m.word for m in error.value.missing] == ["zzzqqq"]


def test_neighbors_of_dog_descend_and_exclude_dog():
    result = glove.neighbors("dog", top_k=10, vocab_limit=100_000)
    scores = [n.score for n in result.neighbors]
    assert scores == sorted(scores, reverse=True)
    assert "dog" not in [n.word for n in result.neighbors]
    assert result.word == "dog" and len(result.vector) == 300


def test_vocab_limit_bounds_the_ranks():
    result = glove.neighbors("dog", top_k=20, vocab_limit=1000)
    assert all(n.rank <= 1000 for n in result.neighbors)
