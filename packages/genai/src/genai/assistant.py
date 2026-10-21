"""An instruction-tuned chat model reached through the OpenAI Responses API."""

from dataclasses import dataclass
from typing import Literal, Protocol

Role = Literal["system", "user", "assistant"]


@dataclass(frozen=True)
class Message:
    role: Role
    content: str


class Assistant(Protocol):
    model: str

    def reply(self, messages: list[Message]) -> str: ...


class OpenAIAssistant:
    """The caller supplies the key and model name; this package never reads the environment."""

    def __init__(self, api_key: str, model: str) -> None:
        from openai import OpenAI

        self.model = model
        self._client = OpenAI(api_key=api_key)

    def reply(self, messages: list[Message]) -> str:
        response = self._client.responses.create(
            model=self.model,
            input=[{"role": m.role, "content": m.content} for m in messages],
        )
        return response.output_text


def pick_label(text: str, labels: list[str]) -> str | None:
    """The label that appears first in `text`, case-insensitive; `None` if none does."""
    lowered = text.lower()
    found = [(lowered.find(label.lower()), label) for label in labels]
    hits = [hit for hit in found if hit[0] >= 0]
    return min(hits)[1] if hits else None
