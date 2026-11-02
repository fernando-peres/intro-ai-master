"""The tools a model can ask for. The model only sees `name`, `description` and `parameters`;
arguments come from the model and are treated as untrusted input."""

import ast
import json
import operator
import re
from collections.abc import Callable
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

from w_and_a.engine.data import ORDERS, POLICIES, WEATHER


@dataclass(frozen=True)
class Tool:
    name: str
    description: str
    parameters: dict
    fn: Callable[..., dict]

    def spec(self) -> dict:
        return {
            "type": "function",
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters,
        }


def _string_param(name: str, description: str) -> dict:
    return {
        "type": "object",
        "properties": {name: {"type": "string", "description": description}},
        "required": [name],
        "additionalProperties": False,
    }


def lookup_order(order_id: str) -> dict:
    found = ORDERS.get(str(order_id).strip().lstrip("#"))
    return found or {"error": f"No order {order_id!r}. Known orders have four digits."}


_STOP = {"the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "is", "my", "our", "what"}


def _stem(word: str) -> str:
    if len(word) > 4 and word.endswith("ies"):
        return word[:-3] + "y"
    if len(word) > 3 and word.endswith("s"):
        return word[:-1]
    return word


def _terms(text: str) -> set[str]:
    return {_stem(w) for w in re.findall(r"[a-z0-9]+", text.lower()) if w not in _STOP}


def search_policies(query: str) -> dict:
    wanted = _terms(query)
    scored = [(len(wanted & _terms(" ".join(p.values()))), p) for p in POLICIES]
    hits = [p for score, p in sorted(scored, key=lambda s: -s[0]) if score > 0][:2]
    return {"query": query, "results": [{k: p[k] for k in ("id", "title", "text")} for p in hits]}


def get_weather(city: str) -> dict:
    return WEATHER.get(city.strip().lower()) or {"error": f"No weather data for {city!r}."}


_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def _eval(node: ast.AST) -> Decimal:
    if isinstance(node, ast.Constant) and type(node.value) in (int, float):
        return Decimal(str(node.value))
    if isinstance(node, ast.BinOp) and type(node.op) in _OPS:
        return _OPS[type(node.op)](_eval(node.left), _eval(node.right))
    if isinstance(node, ast.UnaryOp) and type(node.op) in _OPS:
        return _OPS[type(node.op)](_eval(node.operand))
    raise ValueError("only numbers and + - * / ( ) are allowed")


def calculate(expression: str) -> dict:
    """Decimal arithmetic over the AST, rounded half-up to cents as a till would. Names, calls
    and attributes are rejected, never evaluated."""
    cleaned = expression.replace("€", "").replace("%", "/100").replace(",", ".").strip()
    try:
        value = _eval(ast.parse(cleaned, mode="eval").body)
        cents = value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except (SyntaxError, ValueError, ZeroDivisionError, InvalidOperation) as e:
        return {"expression": expression, "error": str(e) or type(e).__name__}
    return {"expression": expression, "result": float(cents)}


TOOLS: dict[str, Tool] = {
    t.name: t
    for t in (
        Tool(
            "lookup_order",
            "Look up a Pebble & Pine order by its four-digit id: status, items, dates and the "
            "reason for any delay.",
            _string_param("order_id", "The order id, e.g. '1042'."),
            lookup_order,
        ),
        Tool(
            "search_policies",
            "Search Pebble & Pine's policies (returns, late deliveries, shipping, warranty, "
            "discounts). Returns the best-matching policy texts.",
            _string_param("query", "What to look for, in a few words."),
            search_policies,
        ),
        Tool(
            "get_weather",
            "Today's weather in a Portuguese city where Pebble & Pine delivers.",
            _string_param("city", "City name, e.g. 'Porto'."),
            get_weather,
        ),
        Tool(
            "calculate",
            "Exact arithmetic. Use for any price, total or percentage.",
            _string_param("expression", "Numbers and + - * / ( ) only, e.g. '3 * 49.90 * 0.85'."),
            calculate,
        ),
    )
}


def run_tool(name: str, arguments: dict) -> dict:
    tool = TOOLS.get(name)
    if tool is None:
        return {"error": f"Unknown tool {name!r}."}
    try:
        return tool.fn(**arguments)
    except TypeError as e:
        return {"error": f"Bad arguments for {name}: {e}"}


def as_json(data: dict) -> str:
    return json.dumps(data, ensure_ascii=False, indent=2)
