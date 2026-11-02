"""One Graphviz diagram per mode, in the deck's colour code (see theme.css). Rendered with
`st.graphviz_chart`, which draws DOT in the browser: no Graphviz install needed."""

_STYLE = {
    "human": 'shape=ellipse color="#ffffff" fontcolor="#ffffff"',
    "model": 'style="rounded,filled" fillcolor="#13261d" color="#2f6d4f" fontcolor="#cdf3df"',
    "code": 'style=rounded color="#6ee7a0" fontcolor="#6ee7a0"',
    "wf": 'style="rounded,filled" fillcolor="#1b1d0c" color="#e6f57a" fontcolor="#e6f57a"',
    "agent": 'style="rounded,filled" fillcolor="#1f0b1b" color="#ff4fd8" fontcolor="#ff4fd8"',
    "tool": 'style="rounded,dashed" color="#8f8f8f" fontcolor="#e4ddd2"',
    "answer": 'style=rounded color="#c9bfb2" fontcolor="#f5ece0"',
}


def _graph(nodes: list[tuple[str, str, str]], edges: list[str], rankdir: str = "TB") -> str:
    """`nodes` are (id, label, style key); `edges` are DOT edge lines like 'a -> b'."""
    node_lines = "\n".join(f'  {i} [label="{label}" {_STYLE[kind]}];' for i, label, kind in nodes)
    edge_lines = "\n".join(f"  {e};" for e in edges)
    return (
        f'digraph {{\n  rankdir={rankdir}; bgcolor="transparent"; pad=0.2; nodesep=0.35;\n'
        '  node [shape=box fontname="Helvetica" fontsize=12 penwidth=2 margin="0.18,0.08"];\n'
        '  edge [color="#8c8378" fontcolor="#c9bfb2" fontname="Helvetica" fontsize=10];\n'
        f"{node_lines}\n{edge_lines}\n}}"
    )


SCRIPTED = _graph(
    [
        ("u", "Customer message", "human"),
        ("r", "Match rules, in order\\n(first match wins)", "wf"),
        ("id", "Order id?", "wf"),
        ("ask", "Ask for the id\\n(template)", "wf"),
        ("look", "lookup_order", "tool"),
        ("late", "More than 3 days late?\\nadd voucher line", "wf"),
        ("ret", "Returns text\\n(template)", "wf"),
        ("menu", "Fallback: menu\\n(template)", "wf"),
        ("a", "Reply", "answer"),
    ],
    [
        "u -> r",
        'r -> id [label="order"]',
        'id -> ask [label="no"]',
        'id -> look [label="yes"]',
        "look -> late",
        "late -> a",
        "ask -> a",
        'r -> ret [label="returns"]',
        "ret -> a",
        'r -> menu [label="no match"]',
        "menu -> a",
    ],
)

DIAGRAMS: dict[str, str] = {
    "chatbot": _graph(
        [
            ("u", "Customer message", "human"),
            ("h", "Chat history", "code"),
            ("m", "Model", "model"),
            ("a", "Reply\\n(no facts from systems)", "answer"),
        ],
        ["u -> m", 'h -> m [label="adds"]', "m -> a", 'a -> h [style=dashed label="saved"]'],
    ),
    "prompt": _graph(
        [
            ("u", "Person writes a prompt", "human"),
            ("m", "Model, once", "model"),
            ("a", "Answer", "answer"),
            ("p", "Person decides\\nwhat to do next", "human"),
        ],
        ["u -> m", "m -> a", "a -> p", 'p -> u [style=dashed label="by hand"]'],
    ),
    "workflow": _graph(
        [
            ("u", "Customer message", "human"),
            ("c", "1 · Classify", "model"),
            ("r", "2 · Route (code)", "wf"),
            ("o", "lookup_order\\n+ late policy", "tool"),
            ("p", "search_policies", "tool"),
            ("x", "model writes sum\\n→ calculate", "tool"),
            ("d", "4 · Draft", "model"),
            ("k", "5 · Check rules", "wf"),
            ("f", "Revise once", "model"),
            ("a", "Reply", "answer"),
        ],
        [
            "u -> c",
            "c -> r",
            'r -> o [label="order"]',
            'r -> p [label="policy"]',
            'r -> x [label="price"]',
            'r -> d [label="other"]',
            "o -> d",
            "p -> d",
            "x -> d",
            "d -> k",
            'k -> a [label="pass"]',
            'k -> f [label="fail"]',
            "f -> a",
        ],
    ),
    "agent": _graph(
        [
            ("u", "Goal", "human"),
            ("t", "Think\\n(model)", "agent"),
            ("act", "Act: call a tool", "tool"),
            ("o", "Observe: result\\nback to the model", "code"),
            ("lim", "Step limit\\n(6, in code)", "code"),
            ("a", "Answer", "answer"),
        ],
        [
            "u -> t",
            't -> act [label="needs facts"]',
            "act -> o",
            "o -> t",
            't -> a [label="done"]',
            'lim -> t [style=dashed arrowhead=tee label="stops"]',
        ],
    ),
    "agentic": _graph(
        [
            ("u", "Customer message", "human"),
            ("l", "Lead: plan\\n(JSON subtasks)", "agent"),
            ("so", "Orders specialist\\nlookup_order, find_orders,\\nget_weather", "agent"),
            ("sp", "Policies specialist\\nsearch_policies, calculate", "agent"),
            ("w", "Lead: write reply", "agent"),
            ("rv", "Reviewer: PASS / FAIL", "agent"),
            ("f", "Lead: revise once", "agent"),
            ("a", "Reply", "answer"),
        ],
        [
            "u -> l",
            'l -> so [label="hand off"]',
            'l -> sp [label="hand off"]',
            'so -> w [label="report"]',
            'sp -> w [label="report"]',
            "w -> rv",
            'rv -> a [label="pass"]',
            'rv -> f [label="fail"]',
            "f -> a",
        ],
    ),
}
