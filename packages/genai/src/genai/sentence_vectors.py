"""Sentence embeddings from all-MiniLM-L6-v2: one vector per text, plus a token-level view."""

import threading
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class SentenceVector:
    text: str
    vector: list[float]
    tokens: int
    #: True when the text hit `max_tokens` and the tail was cut off.
    truncated: bool


@dataclass(frozen=True)
class Pooled:
    """The four ways to collapse token vectors into one; the model was trained with `mean`."""

    mean: list[float]
    mean_normalized: list[float]
    cls: list[float]
    max: list[float]


@dataclass(frozen=True)
class Inspection:
    """Word pieces (including [CLS]/[SEP]) with their ids, mask and contextual vectors."""

    tokens: list[str]
    ids: list[int]
    attention_mask: list[int]
    token_vectors: list[list[float]]
    pooled: Pooled
    truncated: bool
    trained_pooling: str = "mean"


class SentenceEncoder(Protocol):
    name: str
    dimensions: int
    max_tokens: int

    @property
    def loaded(self) -> bool: ...

    def encode(self, texts: list[str], *, normalize: bool = True) -> list[SentenceVector]:
        """One vector per text; `normalize` scales each to length 1."""
        ...

    def inspect(self, text: str) -> Inspection:
        """Token-level vectors and the four poolings of `text`."""
        ...


class MiniLMEncoder:
    """all-MiniLM-L6-v2 on CPU; weights load on first use (~90 MB download once)."""

    name = "sentence-transformers/all-MiniLM-L6-v2"
    REVISION = "c9745ed1d9f207416be6d2e6f8de32d1f16199bf"
    dimensions = 384
    max_tokens = 256

    def __init__(self) -> None:
        self._model = None
        self._lock = threading.Lock()

    @property
    def loaded(self) -> bool:
        return self._model is not None

    def _load(self):
        with self._lock:
            if self._model is None:
                from sentence_transformers import SentenceTransformer

                self._model = SentenceTransformer(self.name, revision=self.REVISION, device="cpu")
            return self._model

    def _forward(self, texts: list[str]):
        """Padded tokenizer batch and the transformer's last hidden states (no pooling)."""
        import torch

        model = self._load()
        tok = model.tokenizer(
            texts, padding=True, truncation=True, max_length=self.max_tokens, return_tensors="pt"
        )
        with torch.no_grad():
            hidden = model[0].auto_model(**tok).last_hidden_state
        return tok, hidden

    @staticmethod
    def _mean(hidden, mask):
        weights = mask.unsqueeze(-1).to(hidden.dtype)
        return (hidden * weights).sum(dim=1) / weights.sum(dim=1).clamp(min=1e-9)

    def encode(self, texts: list[str], *, normalize: bool = True) -> list[SentenceVector]:
        import torch

        tok, hidden = self._forward(texts)
        mean = self._mean(hidden, tok["attention_mask"])
        if normalize:
            mean = torch.nn.functional.normalize(mean, dim=1)
        counts = tok["attention_mask"].sum(dim=1).tolist()
        return [
            SentenceVector(text, _round(vector), count, count == self.max_tokens)
            for text, vector, count in zip(texts, mean, counts, strict=True)
        ]

    def inspect(self, text: str) -> Inspection:
        import torch

        tok, hidden = self._forward([text])
        mask = tok["attention_mask"]
        token_vectors = hidden[0]
        mean = self._mean(hidden, mask)[0]
        ids = tok["input_ids"][0].tolist()
        return Inspection(
            tokens=self._load().tokenizer.convert_ids_to_tokens(ids),
            ids=ids,
            attention_mask=mask[0].tolist(),
            token_vectors=[_round(v) for v in token_vectors],
            pooled=Pooled(
                mean=_round(mean),
                mean_normalized=_round(torch.nn.functional.normalize(mean, dim=0)),
                cls=_round(token_vectors[0]),
                max=_round(
                    token_vectors.masked_fill(mask[0].unsqueeze(-1) == 0, -torch.inf).max(0).values
                ),
            ),
            truncated=len(ids) == self.max_tokens,
        )


def _round(vector) -> list[float]:
    return [round(x, 5) for x in vector.tolist()]
