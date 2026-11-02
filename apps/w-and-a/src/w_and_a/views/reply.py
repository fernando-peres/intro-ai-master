"""One reply, shared by the chat and Compare pages: the answer first, then the path it took."""

import streamlit as st

from w_and_a.engine.events import Run
from w_and_a.ui import render


def reply(run: Run, watch: str | None = None) -> None:
    with st.container(border=True):
        st.caption("Assistant")
        st.markdown(render.markdown_safe(run.answer) or "_(no answer)_")
    st.html(render.path(run.events))
    if watch:
        st.html(render.watch(watch))
    with st.expander(f"Show every step ({len(run.events)})"):
        st.html(render.events(run.events))
    st.html(render.stats(run))
