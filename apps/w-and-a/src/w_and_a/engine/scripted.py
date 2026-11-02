"""A scripted chatbot: a fixed decision tree, no model. The first matching rule wins and every
reply comes from a template, so the same message in the same state always gets the same answer.
It needs no API key. Its state is only the last bot message (did we ask for an order id?)."""

import re
from datetime import date

from w_and_a.engine.data import POLICIES, SHOP
from w_and_a.engine.events import Run, Trace
from w_and_a.engine.modes import call_tool

MENU = (
    "I can help with:\n\n1. Order status\n2. Returns\n3. Talk to a person\n\n"
    "Reply with a number, or a few words."
)
ASK_ID = "What is your order number? It has four digits and starts with 10, e.g. 1042."
HANDOFF = "I'm passing you to a person. Our team answers on weekdays, 09:00–18:00."
RETURNS = next(p for p in POLICIES if p["id"] == "returns-2026")
LATE_DAYS = 3

#: (rule name, what it matches), in the order they are tried. Shown on the notes page.
RULES: list[tuple[str, str]] = [
    (
        "Waiting for an order id",
        "the last reply asked for an order number, and this message has one",
    ),
    ("Order id in the message", "a four-digit number starting with 10"),
    ("Order status", "'1', or words like order, status, late, where, delivery"),
    ("Returns", "'2', or words like return, refund"),
    ("Talk to a person", "'3', or words like person, human, agent"),
    ("Greeting", "hi, hello, olá, good morning"),
    ("Fallback", "anything else: say so and show the menu"),
]

#: Order numbers are four digits starting with 10, so years like 2025 never match.
_ORDER_ID = re.compile(r"\b10\d{2}\b")
_WORDS = {
    "order": re.compile(r"^\s*1\s*$|\b(order|status|late|where|delivery|track)", re.I),
    "returns": re.compile(r"^\s*2\s*$|\b(return|refund)", re.I),
    "person": re.compile(r"^\s*3\s*$|\b(person|human|agent|someone)", re.I),
    "greeting": re.compile(r"^\s*(hi|hello|hey|ol[aá]|good (morning|afternoon|evening))\b", re.I),
}


def _order_reply(trace: Trace, order_id: str) -> str:
    order = call_tool(trace, "script", "lookup_order", {"order_id": order_id})
    if "error" in order:
        trace.emit("route", "script", "Template · order not found")
        return f"I can't find order {order_id}. Please check the number. {ASK_ID}"
    status = order["status"]
    trace.emit("route", "script", f"Template · status = {status}")
    if status == "delivered":
        return f"Order {order_id} was delivered on {order['delivered']}."
    if status == "processing":
        return (
            f"Order {order_id} is being prepared. Promised delivery: {order['promised_delivery']}."
        )
    late = (
        date.fromisoformat(order["expected_delivery"])
        - date.fromisoformat(order["promised_delivery"])
    ).days
    reply = (
        f"Order {order_id} is delayed. New expected delivery: {order['expected_delivery']}. "
        f"Reason: {order['delay_reason']}"
    )
    rule = f"Rule · {late} days late > {LATE_DAYS}"
    if late > LATE_DAYS:
        trace.emit("route", "script", f"{rule}: add the voucher line", "Late-delivery policy.")
        reply += " Because it is more than 3 days late, you get a 15% voucher on the order total."
    return reply


def scripted_chatbot(question: str, history: list[dict] | None = None, on_event=None) -> Run:
    """Answers from the decision tree in `RULES`; `history` is the list of chat messages."""
    trace = Trace(Run("scripted", question), on_event)
    last_bot = next((m["content"] for m in reversed(history or []) if m["role"] == "assistant"), "")
    found = _ORDER_ID.search(question)

    def fired(name: str, detail: str = "") -> None:
        trace.emit("route", "script", f"Rule · {name}", detail)

    if found and ASK_ID in last_bot:
        fired("Waiting for an order id", f"Found {found.group()}.")
        answer = _order_reply(trace, found.group())
    elif found:
        fired("Order id in the message", f"Found {found.group()}.")
        answer = _order_reply(trace, found.group())
    elif _WORDS["order"].search(question):
        fired("Order status", "No order id yet: ask for it.")
        answer = ASK_ID
    elif _WORDS["returns"].search(question):
        fired("Returns", f"Fixed text: {RETURNS['title']}.")
        answer = f"{RETURNS['title']}: {RETURNS['text']}"
    elif _WORDS["person"].search(question):
        fired("Talk to a person")
        answer = HANDOFF
    elif _WORDS["greeting"].search(question):
        fired("Greeting")
        answer = f"Hello! Welcome to {SHOP}. {MENU}"
    else:
        fired("Fallback", "No rule matched this message.")
        answer = f"Sorry, I can't help with that here. {MENU}"
    return trace.finish(answer)
