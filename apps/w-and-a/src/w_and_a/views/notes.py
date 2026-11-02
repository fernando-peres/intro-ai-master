"""A "how it works" page per mode: the explanation, a diagram, and the exact instructions sent."""

from pathlib import Path

import streamlit as st

from w_and_a.engine.modes import AGENT_STEP_LIMIT, PROMPTS, SPECIALIST_STEP_LIMIT, SPECIALISTS
from w_and_a.engine.scripted import RULES
from w_and_a.engine.tools import TOOLS
from w_and_a.ui import render
from w_and_a.ui.diagrams import DIAGRAMS, SCRIPTED
from w_and_a.views.registry import PAGES

_NOTES = Path(__file__).resolve().parents[1] / "notes"

#: Which tools each mode may call, and the limit our code enforces.
_TOOLS: dict[str, tuple[list[str], str]] = {
    "chatbot": ([], "No tools. The scripted variant calls lookup_order from a fixed rule."),
    "prompt": ([], "No tools, no history."),
    "workflow": (["lookup_order", "search_policies", "calculate"], "Chosen by code per route."),
    "agent": (list(TOOLS), f"Chosen by the model; at most {AGENT_STEP_LIMIT} rounds."),
    "agentic": (
        sorted({t for _, tools in SPECIALISTS.values() for t in tools}),
        f"Each specialist only has its own tools; at most {SPECIALIST_STEP_LIMIT} rounds each.",
    ),
}


def notes_page(mode: str) -> None:
    info = render.MODE_INFO[mode]
    title, link = st.columns([4, 1], vertical_alignment="bottom")
    title.html(f'<h2 class="wa-page-title">How it works · {render.esc(info["label"])}</h2>')
    link.page_link(PAGES[f"chat-{mode}"], label="Open the chat", icon=":material/chat:")
    st.html(render.mode_head(info))

    text, picture = st.columns([1.05, 1], gap="large")
    with text:
        st.markdown((_NOTES / f"{mode}.md").read_text(encoding="utf-8"))
    with picture:
        if mode == "chatbot":
            st.markdown("##### LLM chatbot")
        st.graphviz_chart(DIAGRAMS[mode], width="stretch")
        if mode == "chatbot":
            st.markdown("##### Scripted flow: the decision tree")
            st.graphviz_chart(SCRIPTED, width="stretch")
            st.markdown(
                "\n".join(f"{i}. **{name}**: {what}" for i, (name, what) in enumerate(RULES, 1))
            )

    st.markdown("#### Under the hood")
    tools, limit = _TOOLS[mode]
    st.markdown(f"**Tools:** {', '.join(f'`{t}`' for t in tools) or 'none'}. {limit}")
    st.page_link(PAGES["tools"], label="Try the tools yourself", icon=":material/build:")
    for label, instructions in PROMPTS[mode]:
        with st.expander(f"Instructions sent to the model · {label}"):
            st.code(instructions, language=None, wrap_lines=True)
