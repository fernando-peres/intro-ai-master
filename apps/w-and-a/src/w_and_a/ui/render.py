"""HTML fragments for the page. Every string from the model or a tool is escaped."""

import html
from pathlib import Path

import streamlit as st

from w_and_a.engine.events import Event, Run

_CSS = Path(__file__).with_name("theme.css").read_text(encoding="utf-8")

#: Per tab: label, who decides, colour class, and the flow strip as (text, colour class).
MODE_INFO: dict[str, dict] = {
    "chatbot": {
        "label": "Chatbot",
        "who": "<b>A person</b> decides every next step. The model only talks, and remembers "
        "this chat.",
        "cls": "",
        "flow": [("You", "is-human"), ("Model + chat history", "is-model"), ("Reply", "")],
    },
    "prompt": {
        "label": "Prompt → model",
        "who": "<b>A person</b> is the orchestrator. One question, one answer, no memory.",
        "cls": "",
        "flow": [("You", "is-human"), ("Model, once", "is-model"), ("Reply", "")],
    },
    "workflow": {
        "label": "Workflow",
        "who": "<b>Our code</b> decides the path. Same steps, every time.",
        "cls": "is-wf",
        "flow": [
            ("1 · Classify", "is-model"),
            ("2 · Route", "is-wf"),
            ("3 · Look up", "is-tool"),
            ("4 · Draft", "is-model"),
            ("5 · Check", "is-wf"),
        ],
    },
    "agent": {
        "label": "Agent",
        "who": "<b>The model</b> decides the path: which tool, in what order, and when it is done.",
        "cls": "is-agent",
        "flow": [
            ("Goal", "is-human"),
            ("Think ↻ act ↻ observe", "is-agent"),
            ("Tools", "is-tool"),
            ("Answer", "is-model"),
        ],
    },
    "agentic": {
        "label": "Agentic system",
        "who": "<b>A team of agents</b>: a lead plans and hands off, specialists use their own "
        "tools, a reviewer checks.",
        "cls": "is-agent",
        "flow": [
            ("Lead: plan", "is-agent"),
            ("Orders specialist", "is-agent"),
            ("Policies specialist", "is-agent"),
            ("Lead: write", "is-agent"),
            ("Reviewer: check", "is-agent"),
        ],
    },
}

_KIND = {
    "reasoning": ("🧠", "k-model"),
    "plan": ("🗺️", "k-agent"),
    "route": ("🔀", "k-wf"),
    "step": ("▶", "k-wf"),
    "tool_call": ("🔧", "k-tool"),
    "tool_result": ("📄", "k-tool"),
    "check": ("✓", "k-code"),
    "handoff": ("🤝", "k-agent"),
    "report": ("📝", "k-agent"),
    "note": ("ℹ️", "k-code"),
}


def esc(text: str) -> str:
    return html.escape(text, quote=True)


def inject_css() -> None:
    st.html(f"<style>{_CSS}</style>")


def legend() -> str:
    keys = [
        ("k-human", "Person"),
        ("k-model", "Model"),
        ("k-code", "Our code"),
        ("k-wf", "Workflow"),
        ("k-agent", "Agent"),
        ("k-tool", "Tool"),
    ]
    return (
        '<div class="wa-legend">'
        + "".join(f'<span class="{k}">{t}</span>' for k, t in keys)
        + "</div>"
    )


def tab_head(mode: str) -> str:
    info = MODE_INFO[mode]
    flow = "<i>→</i>".join(f'<span class="{c}">{esc(t)}</span>' for t, c in info["flow"])
    return (
        f'<div class="wa-head"><p class="wa-who {info["cls"]}">{info["who"]}</p>'
        f'<div class="wa-flow">{flow}</div></div>'
    )


def icon(event: Event) -> str:
    return _KIND.get(event.kind, ("•", ""))[0]


def events(items: list[Event]) -> str:
    rows = []
    for e in items:
        sym, cls = _KIND.get(e.kind, ("•", ""))
        if e.actor in ("agent", "lead", "reviewer") or "specialist" in e.actor:
            cls = "k-agent" if e.kind in ("tool_call", "reasoning", "note", "check") else cls
        fail = " is-fail" if e.kind == "check" and "fail" in e.title.lower() else ""
        body = f"<pre>{esc(e.body)}</pre>" if e.body else ""
        rows.append(
            f'<details class="wa-ev {cls}{fail}"><summary>{sym} <span class="actor">{esc(e.actor)}'
            f'</span> {esc(e.title)}<span class="t">+{e.t:.1f}s</span></summary>{body}</details>'
        )
    return f'<div class="wa-events">{"".join(rows)}</div>' if rows else ""


def stats(run: Run) -> str:
    chips = [
        f"LLM calls {run.llm_calls}",
        f"Tool calls {run.tool_calls}",
        f"Tokens {run.tokens:,}",
        f"{run.seconds:.1f} s",
        f"{len(run.events)} steps",
    ]
    out = "".join(f"<span>{c}</span>" for c in chips)
    if run.recorded:
        out += '<span class="is-recorded">Recorded run</span>'
    return f'<div class="wa-stats">{out}</div>'


def markdown_safe(text: str) -> str:
    """Model text for `st.markdown`: `$` would start LaTeX."""
    return text.replace("$", "\\$")
