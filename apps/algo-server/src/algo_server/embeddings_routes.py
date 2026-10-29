"""Embeddings Lab endpoints: GloVe word vectors, MiniLM sentence vectors, PCA and search."""

from dataclasses import asdict
from functools import cache
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from genai.embedding_registry import MODELS
from genai.search_corpus import DOCUMENTS, SearchIndex
from genai.sentence_vectors import MiniLMEncoder, SentenceEncoder
from genai.vectors import pca
from genai.word_vectors import (
    DEFAULT_VOCAB_LIMIT,
    GloveVectors,
    MissingWords,
    WordVectors,
)

router = APIRouter(prefix="/api/embeddings")

#: One corpus index per encoder instance; a plain `@cache` over a `Depends` signature is unreliable.
INDEXES: dict[int, SearchIndex] = {}


@cache
def get_word_vectors() -> WordVectors:
    return GloveVectors()


@cache
def get_sentence_encoder() -> SentenceEncoder:
    return MiniLMEncoder()


Words = Annotated[WordVectors, Depends(get_word_vectors)]
Encoder = Annotated[SentenceEncoder, Depends(get_sentence_encoder)]


def get_search_index(encoder: Encoder) -> SearchIndex:
    if id(encoder) not in INDEXES:
        INDEXES[id(encoder)] = SearchIndex(encoder)
    return INDEXES[id(encoder)]


Index = Annotated[SearchIndex, Depends(get_search_index)]
Mode = Literal["real"]
Word = Annotated[str, Field(min_length=1, max_length=40)]
VocabLimit = Annotated[int, Field(ge=1000, le=400_000)]


def missing_words(error: MissingWords) -> HTTPException:
    detail = {
        "message": "Not in the GloVe vocabulary",
        "missing": [asdict(m) for m in error.missing],
    }
    return HTTPException(400, detail)


class ModelInfo(BaseModel):
    id: str
    name: str
    family: str
    modalities: list[str]
    dimensions: int
    pooling: str
    supports_token_inspection: bool
    supports_analogies: bool
    embedding_space_id: str
    default_normalization: bool
    revision: str
    download_mb: int
    loaded: bool


class ModelsResponse(BaseModel):
    models: list[ModelInfo]


@router.get("/models")
def models(words: Words, encoder: Encoder) -> ModelsResponse:
    loaded = {"word": words.loaded, "sentence": encoder.loaded}
    return ModelsResponse(models=[ModelInfo(**asdict(m), loaded=loaded[m.family]) for m in MODELS])


class DocumentOut(BaseModel):
    id: str
    title: str
    category: str
    text: str


class CorpusResponse(BaseModel):
    documents: list[DocumentOut]


@router.get("/corpus")
def corpus() -> CorpusResponse:
    return CorpusResponse(documents=[DocumentOut(**asdict(d)) for d in DOCUMENTS])


class WordsRequest(BaseModel):
    words: list[Word] = Field(min_length=1, max_length=40)


class WordOut(BaseModel):
    word: str
    rank: int
    vector: list[float]
    norm: float


class MissingOut(BaseModel):
    word: str
    suggestions: list[str]


class WordsResponse(BaseModel):
    model: str
    execution_mode: Mode = "real"
    dimensions: int
    normalized: bool
    found: list[WordOut]
    missing: list[MissingOut]


@router.post("/words")
def lookup_words(req: WordsRequest, words: Words) -> WordsResponse:
    result = words.lookup(req.words)
    return WordsResponse(
        model=words.name,
        dimensions=words.dimensions,
        normalized=False,
        found=[WordOut(**asdict(w)) for w in result.found],
        missing=[MissingOut(**asdict(m)) for m in result.missing],
    )


class NeighborOut(BaseModel):
    word: str
    rank: int
    score: float


class NeighborsRequest(BaseModel):
    word: Word
    top_k: int = Field(10, ge=1, le=20)
    vocab_limit: VocabLimit = DEFAULT_VOCAB_LIMIT


class NeighborsResponse(BaseModel):
    model: str
    execution_mode: Mode = "real"
    word: str
    vector: list[float]
    neighbors: list[NeighborOut]


@router.post("/neighbors")
def neighbors(req: NeighborsRequest, words: Words) -> NeighborsResponse:
    try:
        result = words.neighbors(req.word, top_k=req.top_k, vocab_limit=req.vocab_limit)
    except MissingWords as error:
        raise missing_words(error) from error
    return NeighborsResponse(
        model=words.name,
        word=result.word,
        vector=result.vector,
        neighbors=[NeighborOut(**asdict(n)) for n in result.neighbors],
    )


class AnalogyRequest(BaseModel):
    positive: list[Word] = Field(min_length=1, max_length=3)
    negative: list[Word] = Field(default_factory=list, max_length=3)
    top_k: int = Field(5, ge=1, le=20)
    vocab_limit: VocabLimit = DEFAULT_VOCAB_LIMIT


class AnalogyResponse(BaseModel):
    model: str
    execution_mode: Mode = "real"
    positive: list[str]
    negative: list[str]
    vector: list[float]
    neighbors: list[NeighborOut]


@router.post("/analogy")
def analogy(req: AnalogyRequest, words: Words) -> AnalogyResponse:
    try:
        result = words.analogy(
            req.positive, req.negative, top_k=req.top_k, vocab_limit=req.vocab_limit
        )
    except MissingWords as error:
        raise missing_words(error) from error
    return AnalogyResponse(
        model=words.name,
        positive=result.positive,
        negative=result.negative,
        vector=result.vector,
        neighbors=[NeighborOut(**asdict(n)) for n in result.neighbors],
    )


class SentencesRequest(BaseModel):
    sentences: list[Annotated[str, Field(max_length=500)]] = Field(min_length=1, max_length=20)
    normalize: bool = True


class SentenceOut(BaseModel):
    text: str
    vector: list[float]
    tokens: int
    truncated: bool


class SentencesResponse(BaseModel):
    model: str
    execution_mode: Mode = "real"
    dimensions: int
    normalized: bool
    pooling: Literal["mean"] = "mean"
    items: list[SentenceOut]


@router.post("/sentences")
def sentences(req: SentencesRequest, encoder: Encoder) -> SentencesResponse:
    items = encoder.encode(req.sentences, normalize=req.normalize)
    return SentencesResponse(
        model=encoder.name,
        dimensions=encoder.dimensions,
        normalized=req.normalize,
        items=[SentenceOut(**asdict(i)) for i in items],
    )


class InspectRequest(BaseModel):
    text: str = Field(max_length=200)


class PooledOut(BaseModel):
    mean: list[float]
    mean_normalized: list[float]
    cls: list[float]
    max: list[float]


class InspectResponse(BaseModel):
    model: str
    execution_mode: Mode = "real"
    dimensions: int
    trained_pooling: str
    tokens: list[str]
    ids: list[int]
    attention_mask: list[int]
    token_vectors: list[list[float]]
    pooled: PooledOut
    truncated: bool


@router.post("/inspect")
def inspect(req: InspectRequest, encoder: Encoder) -> InspectResponse:
    result = encoder.inspect(req.text)
    return InspectResponse(
        model=encoder.name,
        dimensions=encoder.dimensions,
        trained_pooling=result.trained_pooling,
        tokens=result.tokens,
        ids=result.ids,
        attention_mask=result.attention_mask,
        token_vectors=result.token_vectors,
        pooled=PooledOut(**asdict(result.pooled)),
        truncated=result.truncated,
    )


class PcaRequest(BaseModel):
    rows: list[Annotated[list[float], Field(min_length=2, max_length=1024)]] = Field(
        min_length=1, max_length=200
    )
    dimensions: Literal[2, 3] = 2


class PcaResponse(BaseModel):
    model: Literal["numpy-svd"] = "numpy-svd"
    execution_mode: Mode = "real"
    points: list[list[float]]
    explained_variance_ratio: list[float]
    mean: list[float]
    components: list[list[float]]
    input_dimensions: int
    output_dimensions: int
    rows: int


@router.post("/pca")
def project(req: PcaRequest) -> PcaResponse:
    try:
        result = pca(req.rows, dimensions=req.dimensions)
    except ValueError as error:
        raise HTTPException(400, str(error)) from error
    return PcaResponse(**asdict(result), rows=len(req.rows))


class SearchRequest(BaseModel):
    query: str = Field(max_length=500)
    top_k: int = Field(5, ge=1, le=10)


class SemanticHit(BaseModel):
    id: str
    title: str
    category: str
    score: float


class KeywordHit(SemanticHit):
    shared: list[str]


class SearchResponse(BaseModel):
    model: str
    execution_mode: Mode = "real"
    normalized: Literal[True] = True
    query_tokens: list[str]
    query_vector: list[float]
    semantic: list[SemanticHit]
    keyword: list[KeywordHit]


BY_ID = {d.id: d for d in DOCUMENTS}


@router.post("/search")
def search(req: SearchRequest, encoder: Encoder, index: Index) -> SearchResponse:
    result = index.search(req.query, top_k=req.top_k)

    def meta(hit_id: str) -> dict[str, str]:
        doc = BY_ID[hit_id]
        return {"id": doc.id, "title": doc.title, "category": doc.category}

    return SearchResponse(
        model=encoder.name,
        query_tokens=result.query_tokens,
        query_vector=result.query_vector,
        semantic=[SemanticHit(**meta(h.id), score=h.score) for h in result.semantic],
        keyword=[KeywordHit(**meta(h.id), score=h.score, shared=h.shared) for h in result.keyword],
    )
