"""Embed step: turn texts into unit-length float32 rows, locally or through OpenAI."""

from dataclasses import dataclass
from typing import Protocol

import numpy as np


class Embedder(Protocol):
    key: str
    label: str
    dimensions: int

    def encode(self, texts: list[str]) -> np.ndarray:
        """Shape (len(texts), dimensions), float32, each row of length 1."""
        ...


def _normalize(rows: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(rows, axis=1, keepdims=True)
    return (rows / np.where(norms == 0, 1, norms)).astype(np.float32)


class MiniLMEmbedder:
    key = "minilm"
    label = "all-MiniLM-L6-v2 · local · 384-d"
    dimensions = 384
    max_tokens = 256

    def __init__(self, batch: int = 32) -> None:
        from genai.sentence_vectors import MiniLMEncoder

        self._encoder = MiniLMEncoder()
        self._batch = batch

    def encode(self, texts: list[str]) -> np.ndarray:
        if not texts:
            return np.zeros((0, self.dimensions), np.float32)
        rows = []
        for i in range(0, len(texts), self._batch):
            rows += [v.vector for v in self._encoder.encode(texts[i : i + self._batch])]
        return _normalize(np.array(rows, dtype=np.float32))


@dataclass
class OpenAIEmbedder:
    api_key: str
    key: str = "openai"
    label: str = "text-embedding-3-small · OpenAI · 1536-d"
    dimensions: int = 1536
    model: str = "text-embedding-3-small"

    def encode(self, texts: list[str]) -> np.ndarray:
        if not texts:
            return np.zeros((0, self.dimensions), np.float32)
        from openai import OpenAI

        client = OpenAI(api_key=self.api_key)
        rows = []
        for i in range(0, len(texts), 256):
            response = client.embeddings.create(model=self.model, input=texts[i : i + 256])
            rows += [d.embedding for d in response.data]
        return _normalize(np.array(rows, dtype=np.float32))
