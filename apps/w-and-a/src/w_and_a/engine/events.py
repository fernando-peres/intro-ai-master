"""What a run produces: a list of events, the answer, and its cost. JSON round-trips for replay."""

import time
from collections.abc import Callable
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from typing import Literal

Kind = Literal[
    "reasoning",
    "plan",
    "route",
    "step",
    "tool_call",
    "tool_result",
    "check",
    "handoff",
    "report",
    "note",
]


def utc_stamp() -> str:
    return datetime.now(UTC).strftime("%Y-%m-%d-%H-%M-%S")


@dataclass(frozen=True)
class Event:
    kind: Kind
    actor: str
    title: str
    body: str = ""
    at: str = ""
    #: Seconds since the run started.
    t: float = 0.0


@dataclass
class Run:
    mode: str
    question: str
    answer: str = ""
    events: list[Event] = field(default_factory=list)
    llm_calls: int = 0
    tool_calls: int = 0
    tokens: int = 0
    seconds: float = 0.0
    recorded: bool = False

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> Run:
        events = [Event(**e) for e in data.get("events", [])]
        return cls(**{**data, "events": events})


class Trace:
    """Collects a run's events and counters; `on_event` sees each event as it happens."""

    def __init__(self, run: Run, on_event: Callable[[Event], None] | None = None):
        self.run = run
        self._on_event = on_event
        self._start = time.perf_counter()

    def emit(self, kind: Kind, actor: str, title: str, body: str = "") -> None:
        event = Event(kind, actor, title, body, utc_stamp(), round(self.elapsed(), 2))
        self.run.events.append(event)
        if self._on_event:
            self._on_event(event)

    def elapsed(self) -> float:
        return time.perf_counter() - self._start

    def finish(self, answer: str) -> Run:
        self.run.answer = answer
        self.run.seconds = round(self.elapsed(), 2)
        return self.run
