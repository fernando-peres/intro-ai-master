"""Pipeline state in `st.session_state`: finishing a stage clears every stage after it."""

import os
from pathlib import Path

import streamlit as st
from dotenv import load_dotenv

from rag_in_action.pipeline.embed import Embedder, MiniLMEmbedder, OpenAIEmbedder

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
    """True when every stage before `stage` is done."""
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
