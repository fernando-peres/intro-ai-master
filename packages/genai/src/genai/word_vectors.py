"""GloVe 6B 300-d word vectors: lookup, nearest neighbours and analogies."""

import json
import threading
from dataclasses import dataclass
from typing import Protocol

import numpy as np

from genai.vectors import cosine_scores, top_indices, unit

#: Vocabulary is ordered by frequency; neighbour searches default to the 100k most common words.
DEFAULT_VOCAB_LIMIT = 100_000


@dataclass(frozen=True)
class WordVector:
    word: str
    #: Frequency rank in the vocabulary; 1 is the most common word.
    rank: int
    vector: list[float]
    norm: float


@dataclass(frozen=True)
class MissingWord:
    word: str
    suggestions: list[str]


@dataclass(frozen=True)
class WordLookup:
    found: list[WordVector]
    missing: list[MissingWord]


@dataclass(frozen=True)
class Neighbor:
    word: str
    rank: int
    score: float


@dataclass(frozen=True)
class Analogy:
    positive: list[str]
    negative: list[str]
    vector: list[float]
    neighbors: list[Neighbor]


@dataclass(frozen=True)
class NeighborSearch:
    """A word's own vector with its nearest neighbours."""

    word: str
    vector: list[float]
    neighbors: list[Neighbor]


class MissingWords(ValueError):
    def __init__(self, missing: list[MissingWord]) -> None:
        super().__init__(f"Not in the vocabulary: {', '.join(m.word for m in missing)}")
        self.missing = missing


class WordVectors(Protocol):
    name: str
    dimensions: int

    @property
    def loaded(self) -> bool: ...

    def lookup(self, words: list[str]) -> WordLookup:
        """Vectors for the words in the vocabulary; the rest come back with suggestions."""
        ...

    def neighbors(self, word: str, *, top_k: int, vocab_limit: int) -> NeighborSearch:
        """The nearest words to `word` by cosine, itself excluded; raises `MissingWords`."""
        ...

    def analogy(
        self, positive: list[str], negative: list[str], *, top_k: int, vocab_limit: int
    ) -> Analogy:
        """Nearest words to the sum of positive minus negative unit vectors, inputs excluded."""
        ...


class GloveVectors:
    """GloVe 6B 300-d from the Hugging Face Hub; loads on first use (~480 MB download once)."""

    name = "sentence-transformers/average_word_embeddings_glove.6B.300d"
    REVISION = "e5e8fec6971be8960cfaa853a77a6ddc62a265d7"
    dimensions = 300

    def __init__(self) -> None:
        self._matrix: np.ndarray | None = None
        self._norms: np.ndarray | None = None
        self._vocab: list[str] = []
        self._index: dict[str, int] = {}
        self._lock = threading.Lock()

    @property
    def loaded(self) -> bool:
        return self._matrix is not None

    def _load(self) -> np.ndarray:
        with self._lock:
            if self._matrix is not None:
                return self._matrix
            from huggingface_hub import hf_hub_download
            from safetensors.numpy import load_file

            def fetch(name: str) -> str:
                return hf_hub_download(
                    self.name, f"0_WordEmbeddings/{name}", revision=self.REVISION
                )

            tensors = load_file(fetch("model.safetensors"))
            if "emb_layer.weight" not in tensors:
                raise RuntimeError(f"{self.name} has no 'emb_layer.weight' tensor")
            matrix = tensors["emb_layer.weight"].astype(np.float32, copy=False)
            with open(fetch("whitespacetokenizer_config.json"), encoding="utf-8") as f:
                config = json.load(f)
            if "vocab" not in config:
                raise RuntimeError(f"{self.name} tokenizer config has no 'vocab' key")
            vocab = config["vocab"]
            if matrix.shape != (len(vocab), self.dimensions):
                raise RuntimeError(
                    f"Embedding matrix {matrix.shape} does not match {len(vocab)} vocabulary words"
                )
            self._norms = np.linalg.norm(matrix, axis=1)
            self._vocab = vocab
            self._index = {w: i for i, w in enumerate(vocab)}
            self._matrix = matrix
            return matrix

    def _suggest(self, word: str) -> list[str]:
        """First five common words sharing the longest prefix (>= 3 characters) with `word`."""
        pool = self._vocab[1:DEFAULT_VOCAB_LIMIT]
        for length in range(len(word), 2, -1):
            matches = [w for w in pool if w.startswith(word[:length])][:5]
            if matches:
                return matches
        return []

    def _indices(self, words: list[str]) -> list[int]:
        self._load()
        clean = [w.strip().lower() for w in words]
        missing = [MissingWord(w, self._suggest(w)) for w in clean if w not in self._index]
        if missing:
            raise MissingWords(missing)
        return [self._index[w] for w in clean]

    def _rank(
        self, target: np.ndarray, exclude: set[int], top_k: int, vocab_limit: int
    ) -> list[Neighbor]:
        scores = cosine_scores(self._matrix[:vocab_limit], self._norms[:vocab_limit], target)
        return [
            Neighbor(self._vocab[i], i, round(float(scores[i]), 4))
            for i in top_indices(scores, k=top_k, exclude=exclude | {0})
        ]

    def _vector(self, i: int) -> list[float]:
        return np.round(self._matrix[i], 5).tolist()

    def lookup(self, words: list[str]) -> WordLookup:
        self._load()
        found, missing = [], []
        for raw in words:
            word = raw.strip().lower()
            i = self._index.get(word)
            if i is None:
                missing.append(MissingWord(word, self._suggest(word)))
            else:
                found.append(WordVector(word, i, self._vector(i), round(float(self._norms[i]), 5)))
        return WordLookup(found, missing)

    def neighbors(self, word: str, *, top_k: int, vocab_limit: int) -> NeighborSearch:
        (i,) = self._indices([word])
        found = self._rank(self._matrix[i], {i}, top_k, vocab_limit)
        return NeighborSearch(self._vocab[i], self._vector(i), found)

    def analogy(
        self, positive: list[str], negative: list[str], *, top_k: int, vocab_limit: int
    ) -> Analogy:
        pos, neg = self._indices(positive), self._indices(negative)
        target = sum(unit(self._matrix[i]) for i in pos) - sum(unit(self._matrix[i]) for i in neg)
        found = self._rank(target, set(pos + neg), top_k, vocab_limit)
        return Analogy(
            [self._vocab[i] for i in pos],
            [self._vocab[i] for i in neg],
            np.round(target, 5).tolist(),
            found,
        )
