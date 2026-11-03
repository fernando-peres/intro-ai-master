"""Streamlit entry: the header and navigation in the sidebar, the selected page on the right."""

import sys
from pathlib import Path

# Streamlit Cloud runs this file without installing the package.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import streamlit as st  # noqa: E402

from w_and_a.engine.llm import live_llm, model_name  # noqa: E402
from w_and_a.ui import auth, render  # noqa: E402
from w_and_a.views.chat import chat_page  # noqa: E402
from w_and_a.views.compare import compare_page  # noqa: E402
from w_and_a.views.notes import notes_page  # noqa: E402
from w_and_a.views.registry import PAGES  # noqa: E402
from w_and_a.views.tools import tools_page  # noqa: E402

st.set_page_config(
    page_title="Workflows and agents",
    page_icon=":material/account_tree:",
    layout="wide",
    initial_sidebar_state="expanded",
)
render.inject_css()
auth.require_login("Workflows and agents")
LLM = live_llm()


def _page(fn, name: str):
    fn.__name__ = name
    return fn


for mode, info in render.MODE_INFO.items():
    PAGES[f"chat-{mode}"] = st.Page(
        _page(lambda m=mode: chat_page(m, LLM), f"chat_{mode}"),
        title=info["label"],
        icon=info["icon"],
        url_path=f"chat-{mode}",
    )
    PAGES[f"notes-{mode}"] = st.Page(
        _page(lambda m=mode: notes_page(m), f"notes_{mode}"),
        title=info["label"],
        icon=":material/menu_book:",
        url_path=f"notes-{mode}",
    )
PAGES["compare"] = st.Page(
    compare_page,
    title="Same question, four ways",
    icon=":material/compare:",
    url_path="compare",
    default=True,
)
PAGES["tools"] = st.Page(
    tools_page, title="Try the tools", icon=":material/build:", url_path="tools"
)

_SECTIONS = {
    "Compare": ["compare"],
    "Chat": [f"chat-{m}" for m in render.MODE_INFO],
    "How it works": [f"notes-{m}" for m in render.MODE_INFO],
    "Tools": ["tools"],
}
current = st.navigation(
    {section: [PAGES[k] for k in keys] for section, keys in _SECTIONS.items()},
    position="hidden",
)
with st.sidebar:
    st.html(render.header(model_name() if LLM else None))
    for section, keys in _SECTIONS.items():
        st.html(f'<p class="wa-nav-section">{section}</p>')
        for k in keys:
            st.page_link(PAGES[k], width="stretch")
    st.button("Log out", icon=":material/logout:", on_click=auth.logout, width="stretch")
current.run()
