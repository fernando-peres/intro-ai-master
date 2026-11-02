"""Compare: one example question, answered by four modes side by side, from the recordings."""

import streamlit as st

from w_and_a.engine import replay
from w_and_a.engine.data import PRESETS
from w_and_a.ui import render
from w_and_a.views.registry import PAGES
from w_and_a.views.reply import reply

#: Manual → fixed steps → autonomous → a team, left to right.
COLUMNS = ("prompt", "workflow", "agent", "agentic")


def compare_page() -> None:
    st.html('<h2 class="wa-page-title">Same question, four ways</h2>')
    st.caption(
        "Pick a question. Each column is a recorded run: who decided the steps, the path it "
        "took, and the answer the customer got."
    )
    index = st.segmented_control(
        "Question",
        options=range(len(PRESETS)),
        format_func=lambda i: PRESETS[i].question,
        default=0,
        key="compare_question",
        label_visibility="collapsed",
    )
    preset = PRESETS[index or 0]
    best = render.MODE_INFO[preset.best]["label"]
    st.html(render.takeaway(preset.takeaway, best))

    for mode, col in zip(COLUMNS, st.columns(len(COLUMNS)), strict=True):
        info = render.MODE_INFO[mode]
        with col:
            star = '<span class="wa-col-best">★ best fit</span>' if mode == preset.best else ""
            st.html(
                f'<p class="wa-col-head">{render.esc(info["label"])} {star}</p>'
                f'<p class="wa-col-kind">{render.esc(info["kind"])}</p>'
            )
            run = replay.recorded(mode, preset.question)
            if run is None:
                st.info("Not recorded yet: run `uv run w-and-a-record`.")
                continue
            reply(run, preset.watch[mode])
            st.page_link(PAGES[f"chat-{mode}"], label="Try it live", icon=":material/chat:")
