"""One block page: its HTML file in a scrolling iframe."""

import streamlit as st
import streamlit.components.v1 as components

from blocks.blocks import Block

_HEIGHT = 1100


@st.cache_data
def _read(path: str) -> str:
    with open(path, encoding="utf-8") as f:
        return f.read()


def block_page(block: Block) -> None:
    components.html(_read(str(block.path)), height=_HEIGHT, scrolling=True)
