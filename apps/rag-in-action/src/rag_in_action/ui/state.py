"""Pipeline state in `st.session_state`: finishing a stage clears every stage after it."""

import os
from pathlib import Path

import streamlit as st
from dotenv import load_dotenv

from rag_in_action.pipeline.chunk import STRATEGIES, chunk_corpus
from rag_in_action.pipeline.embed import Embedder, MiniLMEmbedder, OpenAIEmbedder
from rag_in_action.pipeline.enrich import EnrichOptions, enrich
from rag_in_action.pipeline.load import load_corpus, load_keyword_index
from rag_in_action.pipeline.store import VectorStore

#: The repo-root `.env`; variables already set in the environment win.
load_dotenv(Path(__file__).resolve().parents[5] / ".env")

STAGES = ("load", "chunk", "enrich", "embed", "store")
DEFAULT_CHAT_MODEL = "gpt-5.4-mini"


def pipeline() -> dict:
    return st.session_state.setdefault("pipeline", {})


def done(stage: str) -> bool:
    return stage in pipeline()


def get(stage: str) -> dict:
    return pipeline()[stage]


def complete(stage: str, **data) -> None:
    p = pipeline()
    for later in STAGES[STAGES.index(stage) :]:
        p.pop(later, None)
    p[stage] = data
    st.session_state.pop("chat", None)


def ready_for(stage: str) -> bool:
    """True when every stage before `stage` is done. Analytics brings its own index."""
    if stage == "analytics":
        return True
    order = (*STAGES, "chat", "analytics")
    return all(done(s) for s in order[: order.index(stage)] if s != "chat")


def api_key() -> str | None:
    return os.environ.get("OPENAI_API_KEY") or None


def chat_model() -> str:
    return os.environ.get("OPENAI_MODEL", DEFAULT_CHAT_MODEL)


@st.cache_resource(show_spinner="Loading all-MiniLM-L6-v2…")
def _minilm() -> MiniLMEmbedder:
    return MiniLMEmbedder()


def embedder(key: str) -> Embedder:
    if key == "openai":
        key_value = api_key()
        if not key_value:
            raise RuntimeError("OPENAI_API_KEY is not set in the repo-root .env")
        return OpenAIEmbedder(key_value)
    return _minilm()


@st.cache_resource(show_spinner="Building a default index…")
def _default_index() -> VectorStore:
    docs = load_corpus()
    params = {name: spec[0] for name, spec in STRATEGIES["markdown"].params.items()}
    chunks = chunk_corpus(docs, "markdown", params)
    enriched = enrich(chunks, {d.id: d for d in docs}, load_keyword_index(), EnrichOptions())
    vectors = _minilm().encode([e.embed_text for e in enriched])
    store = VectorStore(vectors.shape[1])
    store.add(
        vectors, [e.meta | {"text": e.chunk.text, "embed_text": e.embed_text} for e in enriched]
    )
    return store


def analytics_index() -> tuple[VectorStore, str, str]:
    """(store, embedder key, label): the step-5 index when built, else a cached default one."""
    if done("store"):
        s = get("store")
        return s["store"], s["model"], "your index from step 5"
    return (
        _default_index(),
        "minilm",
        "a default index (Markdown chunks, MiniLM, all enrichments). Run steps 1–5 to use yours",
    )
