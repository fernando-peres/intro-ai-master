"""The block registry: one entry per file in `html/`, in teaching order."""

from dataclasses import dataclass
from pathlib import Path

HTML_DIR = Path(__file__).resolve().with_name("html")


@dataclass(frozen=True)
class Block:
    slug: str
    title: str
    icon: str
    summary: str

    @property
    def path(self) -> Path:
        return HTML_DIR / f"{self.slug}.html"


BLOCKS: list[Block] = [
    Block(
        "tools",
        "How LLMs use tools",
        ":material/build:",
        "A model never runs anything: it asks, your code runs the function and sends the "
        "result back. The tool loop in a few lines of Python, five examples side by side, "
        "and when not to use a tool.",
    ),
    Block(
        "context",
        "Context engineering",
        ":material/layers:",
        "The model only knows what you put in front of it. Each tab adds one building block "
        "to the context window, same model and question, with and without it.",
    ),
    Block(
        "mcp",
        "MCP",
        ":material/power:",
        "The Model Context Protocol: one plug, many systems. A fetch server and a filesystem "
        "server show how MCP changes the model's reach, not its intelligence.",
    ),
    Block(
        "guardrails",
        "Guardrails",
        ":material/shield:",
        "Checks around the model, before and after it answers. Each case shows a request "
        "without and with guardrails, ending in the reply the user actually sees.",
    ),
    Block(
        "evals",
        "Evals",
        ":material/fact_check:",
        "How to tell whether answers are good: code checks, LLM judges and critiques, "
        "replayed from saved notebook runs.",
    ),
    Block(
        "observability",
        "Observability",
        ":material/monitoring:",
        "Complaints are feelings; traces, costs and scores are evidence. A bike shop's "
        "assistant is slow, wrong and expensive: each tab finds one cause, the last fixes them.",
    ),
    Block(
        "experiments",
        "Experiments",
        ":material/science:",
        "Before a new prompt, model or agent reaches customers, it has to win on the same "
        "test: same cases, same checks, several versions side by side.",
    ),
]
