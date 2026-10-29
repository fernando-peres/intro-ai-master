"""Vector math for the Embeddings Lab: cosine similarity, ranking and PCA (numpy only)."""

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class PCA:
    """`points = (rows - mean) @ components.T`; components are unit rows, ratios sum to <= 1."""

    points: list[list[float]]
    explained_variance_ratio: list[float]
    mean: list[float]
    components: list[list[float]]
    input_dimensions: int
    output_dimensions: int


def unit(v: np.ndarray) -> np.ndarray:
    """`v` scaled to length 1; raises `ValueError` for the zero vector."""
    norm = np.linalg.norm(v)
    if norm == 0:
        raise ValueError("The zero vector has no direction")
    return v / norm


def cosine_scores(matrix: np.ndarray, norms: np.ndarray, query: np.ndarray) -> np.ndarray:
    """Cosine of each row of `matrix` with `query`, given the row `norms`; zero rows score -1."""
    query_norm = np.linalg.norm(query)
    denominator = norms * query_norm
    dots = matrix @ query
    safe = np.where(denominator == 0, 1.0, denominator)
    return np.where(denominator == 0, -1.0, dots / safe)


def top_indices(scores: np.ndarray, *, k: int, exclude: set[int]) -> list[int]:
    """Indices of the `k` highest scores, best first (ties by index), skipping `exclude`."""
    n = min(len(scores), k + len(exclude))
    if n < len(scores):
        candidates = np.argpartition(-scores, n - 1)[:n]
    else:
        candidates = np.arange(len(scores))
    order = candidates[np.lexsort((candidates, -scores[candidates]))]
    return [int(i) for i in order if int(i) not in exclude][:k]


def pca(rows: list[list[float]], *, dimensions: int, decimals: int = 5) -> PCA:
    """Project `rows` onto their top `dimensions` principal axes.

    Raises `ValueError` for ragged rows or fewer than `dimensions + 1` rows.
    """
    if len({len(r) for r in rows}) > 1:
        raise ValueError("All rows must have the same length")
    if len(rows) < dimensions + 1:
        raise ValueError(f"PCA to {dimensions} dimensions needs at least {dimensions + 1} rows")
    data = np.array(rows, dtype=np.float64)
    if data.shape[1] < dimensions:
        raise ValueError(f"Rows have {data.shape[1]} values, fewer than {dimensions} dimensions")
    mean = data.mean(axis=0)
    centred = data - mean
    u, s, vt = np.linalg.svd(centred, full_matrices=False)
    # svd_flip (sklearn): make the largest-magnitude entry of each component positive.
    signs = np.sign(vt[np.arange(vt.shape[0]), np.abs(vt).argmax(axis=1)])
    signs[signs == 0] = 1.0
    vt = vt * signs[:, None]
    variance = s**2
    total = variance.sum()
    ratio = variance[:dimensions] / total if total > 0 else np.zeros(dimensions)
    components = vt[:dimensions]
    return PCA(
        points=np.round(centred @ components.T, decimals).tolist(),
        explained_variance_ratio=np.round(ratio, decimals).tolist(),
        mean=np.round(mean, decimals).tolist(),
        components=np.round(components, decimals).tolist(),
        input_dimensions=int(data.shape[1]),
        output_dimensions=dimensions,
    )
