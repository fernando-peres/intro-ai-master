"""One runner per tab. The difference between them is who decides the next step:
a person (chatbot, prompt), our code (workflow) or the model (agent, agentic system).

Every runner takes the question and an `LLM`, records each step on a `Trace`, and returns
the finished `Run`. Nothing here imports Streamlit.
"""

import json
import re
from collections.abc import Callable

from w_and_a.engine.data import SHOP
from w_and_a.engine.events import Event, Run, Trace
from w_and_a.engine.llm import LLM, Reply, tool_output
from w_and_a.engine.tools import TOOLS, as_json, run_tool

AGENT_STEP_LIMIT = 6
SPECIALIST_STEP_LIMIT = 4

_ASSISTANT = (
    f"You are the customer assistant of {SHOP}, an online home-goods shop in Portugal. "
    "Be brief: at most 120 words."
)


def _ask(trace: Trace, llm: LLM, actor: str, **kwargs) -> Reply:
    reply = llm.respond(**kwargs)
    trace.run.llm_calls += 1
    trace.run.tokens += reply.tokens
    for text in reply.reasoning:
        trace.emit("reasoning", actor, "Reasoning summary", text)
    return reply


def _call_tool(trace: Trace, actor: str, name: str, arguments: dict) -> dict:
    trace.emit("tool_call", actor, f"Call {name}", as_json(arguments))
    result = run_tool(name, arguments)
    trace.run.tool_calls += 1
    trace.emit("tool_result", "tool", f"{name} returned", as_json(result))
    return result


# ---------- A person decides ----------


def chatbot(question: str, llm: LLM, history: list[dict] | None = None, on_event=None) -> Run:
    trace = Trace(Run("chatbot", question), on_event)
    trace.emit(
        "note", "code", "No tools", "It can only talk: it has no access to orders or policies."
    )
    instructions = (
        f"{_ASSISTANT} You have no access to orders, policies or any system. "
        "If you can't know something, say so."
    )
    messages = [*(history or []), {"role": "user", "content": question}]
    reply = _ask(trace, llm, "model", instructions=instructions, input=messages)
    return trace.finish(reply.text)


def prompt_model(question: str, llm: LLM, on_event=None) -> Run:
    trace = Trace(Run("prompt", question), on_event)
    trace.emit(
        "note", "code", "One shot", "No chat history, no tools, no instructions about the shop."
    )
    reply = _ask(trace, llm, "model", instructions="Answer briefly.", input=question)
    return trace.finish(reply.text)


# ---------- Our code decides: a workflow ----------

ROUTES = ("order", "policy", "price", "other")


def _label(text: str) -> str:
    lowered = text.lower()
    hits = [(lowered.find(r), r) for r in ROUTES if r in lowered]
    return min(hits)[1] if hits else "other"


def workflow(question: str, llm: LLM, on_event=None) -> Run:
    trace = Trace(Run("workflow", question), on_event)

    trace.emit("step", "workflow", "Step 1 · Classify", "The model labels the request.")
    classify = (
        "Classify the customer's message. Reply with one word only: "
        "order (about a specific order), policy (returns, delivery, warranty rules), "
        "price (a calculation), or other."
    )
    route = _label(_ask(trace, llm, "model", instructions=classify, input=question).text)

    trace.emit("route", "workflow", f"Step 2 · Route → {route}", _ROUTE_TEXT[route])
    trace.emit("step", "workflow", "Step 3 · Look up", "Our code calls the tool for this route.")
    facts, must_mention = _gather(trace, llm, route, question)

    trace.emit("step", "workflow", "Step 4 · Draft", "The model writes the reply from the facts.")
    draft_rules = f"{_ASSISTANT} Use only the facts provided. If they don't answer it, say so."
    draft_input = f"Customer message: {question}\n\nFacts from our systems:\n{as_json(facts)}"
    answer = _ask(trace, llm, "model", instructions=draft_rules, input=draft_input).text

    problems = _check(answer, must_mention)
    trace.emit(
        "check",
        "workflow",
        "Step 5 · Check: " + ("pass" if not problems else "fail"),
        "\n".join(problems) or "Not empty, short enough, and it states the key fact.",
    )
    if problems:
        fix = f"{draft_input}\n\nYour previous draft:\n{answer}\n\nFix this: {'; '.join(problems)}"
        answer = _ask(trace, llm, "model", instructions=draft_rules, input=fix).text
        again = _check(answer, must_mention)
        trace.emit(
            "check",
            "workflow",
            "Re-check: " + ("pass" if not again else "fail"),
            "\n".join(again) or "Fixed.",
        )
    return trace.finish(answer)


_ROUTE_TEXT = {
    "order": "Order path: find the order id, look up the order, and if it is late, look up the "
    "late-delivery policy.",
    "policy": "Policy path: search the policies with the customer's words.",
    "price": "Price path: the model writes the sum, the calculator computes it.",
    "other": "No tool fits: the model answers from the message alone.",
}


def _gather(trace: Trace, llm: LLM, route: str, question: str) -> tuple[dict, list[str]]:
    """The fixed lookups for each route, and the facts the reply must mention."""
    if route == "order":
        found = re.search(r"\b\d{4}\b", question)
        if not found:
            trace.emit("note", "workflow", "No order id", "The path asks the customer for it.")
            return {"missing": "order id; ask the customer for it"}, []
        order = _call_tool(trace, "workflow", "lookup_order", {"order_id": found.group()})
        facts = {"order": order}
        if order.get("status") == "delayed":
            facts["policy"] = _call_tool(
                trace, "workflow", "search_policies", {"query": "late deliveries voucher"}
            )
        return facts, [found.group()]
    if route == "policy":
        return {
            "policies": _call_tool(trace, "workflow", "search_policies", {"query": question})
        }, []
    if route == "price":
        ask = (
            "Write one arithmetic expression for this, using numbers and + - * / ( ) only. "
            "Reply with the expression only."
        )
        expr = _ask(trace, llm, "model", instructions=ask, input=question).text.strip("` \n")
        result = _call_tool(trace, "workflow", "calculate", {"expression": expr})
        value = result.get("result")
        return {"calculation": result}, [f"{value:.2f}"] if value is not None else []
    return {}, []


def _check(answer: str, must_mention: list[str]) -> list[str]:
    problems = []
    if not answer.strip():
        problems.append("the reply is empty")
    if len(answer) > 1000:
        problems.append("the reply is longer than 1000 characters")
    normalised = answer.replace(",", ".")
    problems += [f"the reply must state {fact}" for fact in must_mention if fact not in normalised]
    return problems


# ---------- The model decides: an agent ----------


def tool_loop(
    trace: Trace, llm: LLM, actor: str, instructions: str, task: str, tools: list[str], limit: int
) -> str:
    """Think, act, observe until the model answers in text, or `limit` rounds of tool calls."""
    specs = [TOOLS[name].spec() for name in tools]
    reply = _ask(trace, llm, actor, instructions=instructions, input=task, tools=specs)
    for _ in range(limit):
        if not reply.calls:
            return reply.text
        outputs = [
            tool_output(c, _call_tool(trace, actor, c.name, c.arguments)) for c in reply.calls
        ]
        reply = _ask(
            trace,
            llm,
            actor,
            instructions=instructions,
            input=outputs,
            tools=specs,
            previous_id=reply.id,
        )
    if reply.calls:
        trace.emit(
            "note", "code", "Step limit reached", f"Our code stopped the loop after {limit} rounds."
        )
        return reply.text or "I stopped before finishing: the step limit was reached."
    return reply.text


def agent(question: str, llm: LLM, on_event=None) -> Run:
    trace = Trace(Run("agent", question), on_event)
    trace.emit(
        "note",
        "agent",
        "Goal and tools",
        f"Tools: {', '.join(TOOLS)}. Limit: {AGENT_STEP_LIMIT} rounds.",
    )
    instructions = (
        f"{_ASSISTANT} Use the tools to find facts; never guess order details, policies or "
        "prices. Use calculate for any arithmetic."
    )
    answer = tool_loop(trace, llm, "agent", instructions, question, list(TOOLS), AGENT_STEP_LIMIT)
    return trace.finish(answer)


# ---------- Several agents: an agentic system ----------

SPECIALISTS: dict[str, tuple[str, list[str]]] = {
    "orders": ("Orders specialist", ["lookup_order", "get_weather"]),
    "policies": ("Policies specialist", ["search_policies", "calculate"]),
}


def _plan(text: str, question: str) -> list[dict]:
    try:
        found = re.search(r"\{.*\}", text, re.S)
        tasks = json.loads(found.group())["subtasks"] if found else []
        tasks = [t for t in tasks if t.get("specialist") in SPECIALISTS and t.get("task")]
    except json.JSONDecodeError, KeyError, TypeError, AttributeError:
        tasks = []
    return tasks[:3] or [{"specialist": s, "task": question} for s in SPECIALISTS]


def agentic(question: str, llm: LLM, on_event=None) -> Run:
    trace = Trace(Run("agentic", question), on_event)
    lead = (
        f"You lead the support team of {SHOP}. Specialists: 'orders' can look up orders and "
        "today's weather; 'policies' can search shop policies and calculate. Split the "
        'request into 1 to 3 subtasks. Reply with JSON only: {"subtasks": '
        '[{"specialist": "orders" or "policies", "task": "..."}]}'
    )
    plan = _plan(_ask(trace, llm, "lead", instructions=lead, input=question).text, question)
    trace.emit(
        "plan",
        "lead",
        f"Plan · {len(plan)} subtask(s)",
        "\n".join(f"{i}. {t['specialist']}: {t['task']}" for i, t in enumerate(plan, 1)),
    )

    reports = []
    for task in plan:
        name, tools = SPECIALISTS[task["specialist"]]
        trace.emit("handoff", "lead", f"Hand off → {name}", task["task"])
        rules = f"You are the {name} at {SHOP}. Use your tools; report facts only, briefly."
        report = tool_loop(trace, llm, name, rules, task["task"], tools, SPECIALIST_STEP_LIMIT)
        trace.emit("report", name, f"{name} reports", report)
        reports.append(f"{name}: {report}")

    findings = "\n\n".join(reports)
    write = f"{_ASSISTANT} Write the reply using only the specialists' findings."
    draft_input = f"Customer message: {question}\n\nFindings:\n{findings}"
    answer = _ask(trace, llm, "lead", instructions=write, input=draft_input).text

    review = (
        "You review support replies. Check the draft against the findings: every fact must "
        "come from them. Reply PASS, or FAIL: <what is wrong>."
    )
    verdict = _ask(
        trace,
        llm,
        "reviewer",
        instructions=review,
        input=f"Findings:\n{findings}\n\nDraft:\n{answer}",
    ).text.strip()
    passed = verdict.upper().startswith("PASS")
    trace.emit("check", "reviewer", "Review: " + ("pass" if passed else "fail"), verdict)
    if not passed:
        fix = f"{draft_input}\n\nPrevious draft:\n{answer}\n\nReviewer: {verdict}"
        answer = _ask(trace, llm, "lead", instructions=write, input=fix).text
    return trace.finish(answer)


Runner = Callable[..., Run]

MODES: dict[str, Runner] = {
    "chatbot": chatbot,
    "prompt": prompt_model,
    "workflow": workflow,
    "agent": agent,
    "agentic": agentic,
}

__all__ = ["MODES", "Event", "Run"]
