"""Streamlit entry: login, sidebar navigation, then the home page or one block."""

import sys
from pathlib import Path

# Streamlit Cloud runs this file without installing the package.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import streamlit as st  # noqa: E402

from blocks.blocks import BLOCKS  # noqa: E402
from blocks.ui import auth, render  # noqa: E402
from blocks.views.block import block_page  # noqa: E402
from blocks.views.home import home_page  # noqa: E402

st.set_page_config(
    page_title="Building blocks",
    page_icon=":material/widgets:",
    layout="wide",
    initial_sidebar_state="expanded",
)
render.inject_css()
auth.require_login("Building blocks")


def _named(fn, name: str):
    fn.__name__ = name
    return fn


PAGES: dict[str, st.Page] = {
    b.slug: st.Page(
        _named(lambda b=b: block_page(b), f"block_{b.slug}"),
        title=b.title,
        icon=b.icon,
        url_path=b.slug,
    )
    for b in BLOCKS
}
HOME = st.Page(
    _named(lambda: home_page(PAGES), "home"),
    title="Home",
    icon=":material/home:",
    url_path="home",
    default=True,
)

current = st.navigation([HOME, *PAGES.values()], position="hidden")
with st.sidebar:
    st.html(render.header())
    st.page_link(HOME, width="stretch")
    st.html('<p class="bk-nav-section">Blocks</p>')
    for page in PAGES.values():
        st.page_link(page, width="stretch")
    st.button("Log out", icon=":material/logout:", on_click=auth.logout, width="stretch")
current.run()
