"""HTML fragments for the pages. Every string from the model or a tool is escaped."""

import html
from pathlib import Path

import streamlit as st

from w_and_a.engine.events import Event, Run

_CSS = Path(__file__).with_name("theme.css").read_text(encoding="utf-8")

#: Per mode: one-line kind, label, nav icon, who decides, colour class, flow strip (text, class).
MODE_INFO: dict[str, dict] = {
    "chatbot": {
        "kind": "Talks, can't act",
        "icon": ":material/chat:",
        "label": "Chatbot",
        "who": "<b>A person</b> decides every next step. The bot only talks: it follows a "
        "fixed script, or a model that remembers this chat.",
        "cls": "",
        "flow": [("You", "is-human"), ("Model + chat history", "is-model"), ("Reply", "")],
    },
    "prompt": {
        "kind": "Manual: you call the model, once",
        "icon": ":material/arrow_forward:",
        "label": "Prompt → model",
        "who": "<b>A person</b> is the orchestrator. One question, one answer, no memory.",
        "cls": "",
        "flow": [("You", "is-human"), ("Model, once", "is-model"), ("Reply", "")],
    },
    "workflow": {
        "kind": "Fixed steps: our code decides the path",
        "icon": ":material/account_tree:",
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
        "kind": "Autonomous: the model decides the steps",
        "icon": ":material/smart_toy:",
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
        "kind": "A team: agents plan, hand off and check",
        "icon": ":material/groups:",
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

#: The Chatbot page's two variants: a fixed script (code decides) or a model.
CHATBOT_VARIANTS: dict[str, dict] = {
    "scripted": {
        "kind": "Fixed script: rules decide, no model",
        "label": "Scripted flow",
        "who": "<b>Our code</b> decides every step: a fixed decision tree. No model, no key.",
        "cls": "is-wf",
        "flow": [("You", "is-human"), ("Match a rule", "is-wf"), ("Template reply", "is-wf")],
    },
    "llm": {
        "kind": "Talks, can't act: a model with no tools",
        "label": "LLM",
        "who": "<b>A model</b> writes each reply and remembers this chat. It has no tools.",
        "cls": "",
        "flow": [("You", "is-human"), ("Model + chat history", "is-model"), ("Reply", "")],
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


def header(live_model: str | None) -> str:
    status = (
        f'<span class="wa-status is-live">Live · {esc(live_model)}</span>'
        if live_model
        else '<span class="wa-status">Offline · presets replay recorded runs</span>'
    )
    return (
        '<div class="wa-side"><h1 class="wa-title">Workflows and <b>agents</b></h1>'
        '<p class="wa-sub">Customer support for Pebble &amp; Pine, an invented shop. Ask the '
        f"same question in every chat and watch who decides each step.</p>{legend()}{status}</div>"
    )


def _chips(items: list[tuple[str, str]]) -> str:
    return "<i>→</i>".join(f'<span class="{c}">{esc(t)}</span>' for t, c in items)


def mode_head(info: dict) -> str:
    return (
        f'<div class="wa-head"><p class="wa-kind {info["cls"]}">{esc(info["kind"])}</p>'
        f'<p class="wa-who">{info["who"]}</p>'
        f'<div class="wa-flow">{_chips(info["flow"])}</div></div>'
    )


def _chip(e: Event) -> tuple[str, str] | None:
    title = e.title
    if e.kind == "step":
        name = title.split("· ", 1)[-1]
        return None if name == "Look up" else (name, "is-model")
    if e.kind == "route" and "Route → " in title:
        return ("Route: " + title.split("→ ", 1)[1], "is-wf")
    if e.kind == "route" and title.startswith("Rule · "):
        return ("Rule: " + title[7:].split(":")[0], "is-wf")
    if e.kind == "tool_call":
        return (title.removeprefix("Call "), "is-tool")
    if e.kind == "check":
        word = "Review" if e.actor == "reviewer" else "Check"
        return (f"{word} {'✗' if 'fail' in title.lower() else '✓'}", "is-code")
    if e.kind == "reasoning":
        return ("Think", "is-agent")
    if e.kind == "plan":
        return ("Plan", "is-agent")
    if e.kind == "handoff":
        return ("→ " + title.split("→ ", 1)[-1], "is-agent")
    return None


def path(items: list[Event]) -> str:
    """The steps a run took, as one strip of chips; repeats in a row collapse into one."""
    chips: list[tuple[str, str]] = []
    for chip in filter(None, map(_chip, items)):
        if not chips or chips[-1] != chip:
            chips.append(chip)
    chips = chips or [("Model, once", "is-model")]
    return f'<div class="wa-flow wa-path"><b>Path taken</b>{_chips(chips)}</div>'


def takeaway(text: str, best: str | None = None) -> str:
    fit = f'<span class="wa-best">Best fit: {esc(best)}</span>' if best else ""
    return f'<p class="wa-takeaway">{esc(text)}{fit}</p>'


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


def watch(text: str) -> str:
    return f'<div class="wa-watch"><b>What to watch</b> {esc(text)}</div>'


def markdown_safe(text: str) -> str:
    """Model text for `st.markdown`: `$` would start LaTeX."""
    return text.replace("$", "\\$")
