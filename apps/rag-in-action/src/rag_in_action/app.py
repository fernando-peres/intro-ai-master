"""Streamlit entry: one page per pipeline stage, gated by the stepper rail."""

import sys
from pathlib import Path

# Streamlit Cloud runs this file without installing the app or the `genai` workspace package.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
sys.path.insert(0, str(Path(__file__).resolve().parents[4] / "packages" / "genai" / "src"))

import streamlit as st  # noqa: E402

from rag_in_action.ui import auth, state  # noqa: E402
from rag_in_action.ui.components import inject_css  # noqa: E402
from rag_in_action.ui.stepper import rail  # noqa: E402
from rag_in_action.views import analytics, chat, chunk, embed, enrich, load, overview, store  # noqa: E402
from rag_in_action.views.registry import PAGES  # noqa: E402

st.set_page_config(
    page_title="RAG in action",
    page_icon=":material/hub:",
    layout="wide",
    initial_sidebar_state="collapsed",
)
inject_css()
auth.require_login("RAG in action")

_VIEWS = {
    "overview": overview,
    "load": load,
    "chunk": chunk,
    "enrich": enrich,
    "embed": embed,
    "store": store,
    "chat": chat,
    "analytics": analytics,
}
_TITLES = {
    "overview": "Overview",
    "load": "1 · Load",
    "chunk": "2 · Chunk",
    "enrich": "3 · Enrich",
    "embed": "4 · Embed",
    "store": "5 · Store",
    "chat": "6 · Retrieve & chat",
    "analytics": "7 · Analytics",
}

PAGES.update(
    {
        key: st.Page(view.page, title=_TITLES[key], url_path=key, default=key == "overview")
        for key, view in _VIEWS.items()
    }
)
current = st.navigation(list(PAGES.values()), position="hidden")
key = (
    next(k for k, p in PAGES.items() if p.url_path == current.url_path)
    if current.url_path
    else "overview"
)
if key != "overview" and not state.ready_for(key):
    st.switch_page(PAGES["overview"])
rail(key, PAGES)
current.run()
