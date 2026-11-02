"""Store step: a FAISS inner-product index over unit vectors (inner product = cosine)."""

import json
from pathlib import Path

import faiss  # noqa: E402, I001
import numpy as np
import torch  # noqa: F401  # must load its libomp before faiss does, or macOS segfaults


class VectorStore:
    """Row i of the index is `records[i]`; the two are only ever appended together."""

    def __init__(self, dimensions: int) -> None:
        self.index = faiss.IndexFlatIP(dimensions)
        self.records: list[dict] = []

    @property
    def size(self) -> int:
        return self.index.ntotal

    @property
    def dimensions(self) -> int:
        return self.index.d

    @property
    def nbytes(self) -> int:
        return self.index.ntotal * self.index.d * 4

    def add(self, vectors: np.ndarray, records: list[dict]) -> None:
        if len(vectors) != len(records):
            raise ValueError("vectors and records differ in length")
        self.index.add(np.ascontiguousarray(vectors, dtype=np.float32))
        self.records += records

    def search(self, query: np.ndarray, k: int) -> list[tuple[int, float]]:
        """(row, cosine) pairs, best first; `k` is clipped to the store size."""
        k = min(k, self.size)
        if k == 0:
            return []
        scores, rows = self.index.search(np.asarray(query, np.float32).reshape(1, -1), k)
        return [(int(r), float(s)) for r, s in zip(rows[0], scores[0], strict=True) if r >= 0]

    def vectors(self) -> np.ndarray:
        return self.index.reconstruct_n(0, self.size)

    def save(self, directory: Path) -> None:
        directory.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self.index, str(directory / "index.faiss"))
        (directory / "records.json").write_text(json.dumps(self.records, ensure_ascii=False))

    @classmethod
    def load(cls, directory: Path) -> VectorStore:
        index = faiss.read_index(str(directory / "index.faiss"))
        store = cls(index.d)
        store.index = index
        store.records = json.loads((directory / "records.json").read_text())
        return store
