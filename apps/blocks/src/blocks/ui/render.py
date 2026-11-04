"""Theme injection and the small HTML fragments the pages share."""

from html import escape
from pathlib import Path

import streamlit as st

_CSS = Path(__file__).with_name("theme.css").read_text()


def inject_css() -> None:
    st.html(f"<style>{_CSS}</style>")


def header() -> str:
    return (
        '<p class="bk-title">Building blocks</p>'
        '<p class="bk-sub">Interactive notes · Build &amp; Improving GenAI systems</p>'
    )


def card(title: str, summary: str) -> str:
    return (
        f'<p class="bk-card-title">{escape(title)}</p><p class="bk-card-text">{escape(summary)}</p>'
    )
