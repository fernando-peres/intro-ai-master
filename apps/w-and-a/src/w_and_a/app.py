"""Streamlit entry: five tabs, one per way of using a model, sharing the same preset questions."""

import streamlit as st

from w_and_a.engine import replay
from w_and_a.engine.data import PRESETS, SHOP
from w_and_a.engine.events import Event, Run
from w_and_a.engine.llm import live_llm, model_name
from w_and_a.engine.modes import MODES
from w_and_a.ui import render

st.set_page_config(
    page_title="Workflows and agents",
    page_icon=":material/account_tree:",
    layout="wide",
    initial_sidebar_state="collapsed",
)
render.inject_css()

LLM = live_llm()
status = (
    f'<span class="wa-status is-live">Live · {render.esc(model_name())}</span>'
    if LLM
    else '<span class="wa-status">Offline · preset questions replay recorded runs</span>'
)
st.html(
    '<h1 class="wa-title">Workflows and <b>agents</b>, in action</h1>'
    f'<p class="wa-sub">Customer support for {SHOP}, an invented shop. Ask the same question '
    f"in every tab and watch who decides each step.</p>{render.legend()}{status}"
)


def _conversation(mode: str) -> list[Run]:
    return st.session_state.setdefault(f"conv_{mode}", [])


def _show(run: Run) -> None:
    with st.chat_message("user"):
        st.markdown(render.markdown_safe(run.question))
    with st.chat_message("assistant"):
        st.html(render.events(run.events))
        st.markdown(render.markdown_safe(run.answer) or "_(no answer)_")
        st.html(render.stats(run))


def _execute(mode: str, question: str) -> None:
    if LLM is None:
        run = replay.recorded(mode, question)
        if run is None:
            st.warning("No OpenAI key is set, so only the preset questions can be replayed.")
            return
        _conversation(mode).append(run)
        st.rerun()

    with st.chat_message("user"):
        st.markdown(render.markdown_safe(question))
    with st.chat_message("assistant"):
        box = st.status("Running…", expanded=True)

        def live(event: Event) -> None:
            box.write(f"{render.icon(event)} **{event.actor}** · {event.title}")

        kwargs: dict = {"on_event": live}
        if mode == "chatbot":
            kwargs["history"] = [
                m
                for past in _conversation(mode)
                for m in (
                    {"role": "user", "content": past.question},
                    {"role": "assistant", "content": past.answer},
                )
            ]
        try:
            run = MODES[mode](question, LLM, **kwargs)
        except Exception as e:  # shown in the page, not swallowed
            box.update(label="Failed", state="error")
            st.error(f"The run failed: {e}")
            return
        box.update(label=f"Done in {run.seconds:.1f} s", state="complete", expanded=False)
    _conversation(mode).append(run)
    st.rerun()


def tab(mode: str) -> None:
    st.html(render.tab_head(mode))
    pending = None
    cols = st.columns([1, 1, 1, 0.35])
    for i, preset in enumerate(PRESETS):
        if cols[i].button(preset, key=f"{mode}_preset_{i}", width="stretch", help=preset):
            pending = preset
    if cols[3].button("Clear", key=f"{mode}_clear", icon=":material/delete_sweep:"):
        st.session_state[f"conv_{mode}"] = []
        st.rerun()

    for run in _conversation(mode):
        _show(run)
    typed = st.chat_input("Ask a question…", key=f"{mode}_input")
    question = pending or typed
    if question:
        _execute(mode, question)


for container, mode in zip(
    st.tabs([i["label"] for i in render.MODE_INFO.values()]), MODES, strict=True
):
    with container:
        tab(mode)
