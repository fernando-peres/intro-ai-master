"""Catalogue of the embedding models the lab offers; reading it never loads a model."""

from dataclasses import dataclass
from typing import Literal

from genai.sentence_vectors import MiniLMEncoder
from genai.word_vectors import GloveVectors


@dataclass(frozen=True)
class EmbeddingModel:
    id: str
    name: str
    family: Literal["word", "sentence"]
    modalities: list[str]
    dimensions: int
    pooling: str
    supports_token_inspection: bool
    supports_analogies: bool
    #: Models sharing an id produce comparable vectors; different ids must never be mixed.
    embedding_space_id: str
    default_normalization: bool
    revision: str
    download_mb: int


MODELS = (
    EmbeddingModel(
        id="glove-6b-300d",
        name=GloveVectors.name,
        family="word",
        modalities=["text"],
        dimensions=GloveVectors.dimensions,
        pooling="none",
        supports_token_inspection=False,
        supports_analogies=True,
        embedding_space_id="glove-6b-300d",
        default_normalization=False,
        revision=GloveVectors.REVISION,
        download_mb=480,
    ),
    EmbeddingModel(
        id="minilm-l6-v2",
        name=MiniLMEncoder.name,
        family="sentence",
        modalities=["text"],
        dimensions=MiniLMEncoder.dimensions,
        pooling="mean",
        supports_token_inspection=True,
        supports_analogies=False,
        embedding_space_id="minilm-l6-v2",
        default_normalization=True,
        revision=MiniLMEncoder.REVISION,
        download_mb=90,
    ),
)
