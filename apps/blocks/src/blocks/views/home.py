"""Home: one card per block, each opening its page."""

import streamlit as st

from blocks.blocks import BLOCKS
from blocks.ui import render

_COLS = 3


def home_page(pages: dict[str, st.Page]) -> None:
    st.title("Building blocks")
    st.write(
        "Each block is an interactive page: the same model and question, with and without "
        "one building block, so you can see what it changes. Open one below or from the sidebar."
    )
    for start in range(0, len(BLOCKS), _COLS):
        for col, block in zip(st.columns(_COLS), BLOCKS[start : start + _COLS], strict=False):
            with col, st.container(border=True):
                st.html(render.card(block.title, block.summary))
                if st.button("Open", key=f"open-{block.slug}", icon=block.icon, width="stretch"):
                    st.switch_page(pages[block.slug])
