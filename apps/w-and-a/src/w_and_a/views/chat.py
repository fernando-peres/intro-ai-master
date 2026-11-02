"""A chat page per mode: presets, the turns so far, and the input pinned at the bottom."""

import streamlit as st

from w_and_a.engine import replay
from w_and_a.engine.data import PRESETS
from w_and_a.engine.events import Event, Run
from w_and_a.engine.llm import LLM
from w_and_a.engine.modes import MODES
from w_and_a.engine.scripted import scripted_chatbot
from w_and_a.ui import render
from w_and_a.views.registry import PAGES
from w_and_a.views.reply import reply


def _conversation(key: str) -> list[Run]:
    return st.session_state.setdefault(f"conv_{key}", [])


def _history(runs: list[Run]) -> list[dict]:
    return [
        m
        for run in runs
        for m in (
            {"role": "user", "content": run.question},
            {"role": "assistant", "content": run.answer},
        )
    ]


_BY_QUESTION = {p.question: p for p in PRESETS}


def _show(run: Run, key: str) -> None:
    with st.chat_message("user"):
        st.markdown(render.markdown_safe(run.question))
    with st.chat_message("assistant"):
        preset = _BY_QUESTION.get(run.question)
        reply(run, preset.watch[key] if preset else None)


def _execute(mode: str, key: str, question: str, llm: LLM | None) -> None:
    scripted = key == "chatbot_scripted"
    if llm is None and not scripted:
        run = replay.recorded(mode, question)
        if run is None:
            st.warning("No OpenAI key is set, so only the preset questions can be replayed.")
            return
        _conversation(key).append(run)
        st.rerun()

    with st.chat_message("user"):
        st.markdown(render.markdown_safe(question))
    with st.chat_message("assistant"):
        box = st.status("Running…", expanded=True)

        def live(event: Event) -> None:
            box.write(f"{render.icon(event)} **{event.actor}** · {event.title}")

        history = _history(_conversation(key))
        try:
            if scripted:
                run = scripted_chatbot(question, history, on_event=live)
            elif mode == "chatbot":
                run = MODES[mode](question, llm, history=history, on_event=live)
            else:
                run = MODES[mode](question, llm, on_event=live)
        except Exception as e:  # shown in the page, not swallowed
            box.update(label="Failed", state="error")
            st.error(f"The run failed: {e}")
            return
        box.update(label=f"Done in {run.seconds:.1f} s", state="complete", expanded=False)
    _conversation(key).append(run)
    st.rerun()


def chat_page(mode: str, llm: LLM | None) -> None:
    info = render.MODE_INFO[mode]
    key, head = mode, info
    title, link = st.columns([4, 1], vertical_alignment="bottom")
    title.html(f'<h2 class="wa-page-title">{render.esc(info["label"])}</h2>')
    link.page_link(PAGES[f"notes-{mode}"], label="How it works", icon=":material/menu_book:")
    if mode == "chatbot":
        variant = st.segmented_control(
            "Behind the chat",
            options=list(render.CHATBOT_VARIANTS),
            format_func=lambda k: render.CHATBOT_VARIANTS[k]["label"],
            default="scripted",
            key="chatbot_variant",
        )
        variant = variant or "scripted"
        key, head = f"chatbot_{variant}", render.CHATBOT_VARIANTS[variant]
    st.html(render.mode_head(head))

    pending = None
    made_here = any(p.best == mode for p in PRESETS)
    st.caption("Example questions" + (" · ★ made for this page" if made_here else ""))
    cols = st.columns(3)
    for i, preset in enumerate(PRESETS):
        star = "★ " if preset.best == mode else ""
        if cols[i % 3].button(
            star + preset.question, key=f"{key}_preset_{i}", width="stretch", help=preset.takeaway
        ):
            pending = preset.question
    if cols[len(PRESETS) % 3].button(
        "Clear chat", key=f"{key}_clear", icon=":material/delete_sweep:", width="stretch"
    ):
        st.session_state[f"conv_{key}"] = []
        st.rerun()

    for run in _conversation(key):
        _show(run, key)
    typed = st.chat_input("Ask a question…", key=f"{key}_input")
    if question := pending or typed:
        _execute(mode, key, question, llm)
