import numpy as np
import pytest

from genai.vectors import cosine_scores, pca, top_indices, unit


def test_unit_has_length_one():
    assert np.allclose(unit(np.array([3.0, 4.0])), [0.6, 0.8])


def test_unit_rejects_the_zero_vector():
    with pytest.raises(ValueError):
        unit(np.zeros(3))


def test_cosine_matches_hand_values_and_zero_rows_score_minus_one():
    matrix = np.array([[1.0, 0.0], [1.0, 1.0], [0.0, 0.0], [-1.0, 0.0]])
    norms = np.linalg.norm(matrix, axis=1)
    scores = cosine_scores(matrix, norms, np.array([2.0, 0.0]))
    assert np.allclose(scores, [1.0, 2**-0.5, -1.0, -1.0])


def test_cosine_of_unit_vectors_equals_the_dot_product():
    rng = np.random.default_rng(0)
    matrix = rng.normal(size=(5, 4))
    matrix /= np.linalg.norm(matrix, axis=1, keepdims=True)
    query = unit(rng.normal(size=4))
    assert np.allclose(cosine_scores(matrix, np.ones(5), query), matrix @ query)


def test_top_indices_orders_by_score_and_skips_excluded():
    scores = np.array([0.1, 0.9, 0.5, 0.7])
    assert top_indices(scores, k=2, exclude=set()) == [1, 3]
    assert top_indices(scores, k=2, exclude={1}) == [3, 2]
    assert top_indices(scores, k=10, exclude={0}) == [1, 3, 2]


def test_pca_of_collinear_points_has_one_component():
    rows = [[0.0, 0.0], [1.0, 1.0], [2.0, 2.0], [3.0, 3.0]]
    result = pca(rows, dimensions=2)
    assert result.explained_variance_ratio == pytest.approx([1.0, 0.0], abs=1e-4)
    assert (result.input_dimensions, result.output_dimensions) == (2, 2)


def test_pca_components_are_unit_and_project_the_centred_rows():
    rng = np.random.default_rng(1)
    rows = rng.normal(size=(10, 5))
    result = pca(rows.tolist(), dimensions=3, decimals=8)
    components = np.array(result.components)
    assert np.allclose(np.linalg.norm(components, axis=1), 1.0, atol=1e-6)
    projected = (rows - np.array(result.mean)) @ components.T
    assert np.allclose(projected, result.points, atol=1e-5)


def test_pca_ratios_are_non_negative_and_sum_to_at_most_one():
    rng = np.random.default_rng(2)
    result = pca(rng.normal(size=(8, 6)).tolist(), dimensions=3)
    ratios = result.explained_variance_ratio
    assert all(r >= 0 for r in ratios) and sum(ratios) <= 1 + 1e-4
    assert ratios == sorted(ratios, reverse=True)


def test_pca_signs_are_deterministic():
    rows = np.random.default_rng(3).normal(size=(9, 4)).tolist()
    assert pca(rows, dimensions=2) == pca(rows, dimensions=2)
    components = np.array(pca(rows, dimensions=2).components)
    # svd_flip: the largest-magnitude entry of each component is positive.
    for row in components:
        assert row[np.argmax(np.abs(row))] > 0


def test_pca_needs_more_rows_than_dimensions():
    with pytest.raises(ValueError):
        pca([[1.0, 2.0], [3.0, 4.0]], dimensions=2)


def test_pca_rejects_ragged_rows():
    with pytest.raises(ValueError):
        pca([[1.0, 2.0], [3.0], [4.0, 5.0]], dimensions=2)


def test_pca_of_identical_rows_has_zero_ratios_not_nan():
    result = pca([[1.0, 2.0, 3.0]] * 4, dimensions=2)
    assert result.explained_variance_ratio == [0.0, 0.0]
    assert all(np.isfinite(x) for p in result.points for x in p)
