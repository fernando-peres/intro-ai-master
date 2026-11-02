"""The model behind every tab, as one `respond` call. Tests swap in a scripted fake."""

import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Protocol

from dotenv import load_dotenv

#: The repo-root `.env`; variables already set in the environment win.
load_dotenv(Path(__file__).resolve().parents[5] / ".env")

DEFAULT_MODEL = "gpt-5.4-mini"
#: Reasoning summaries come back empty unless an effort is set.
DEFAULT_EFFORT = "medium"


@dataclass(frozen=True)
class ToolCall:
    call_id: str
    name: str
    arguments: dict


@dataclass(frozen=True)
class Reply:
    id: str = ""
    text: str = ""
    calls: list[ToolCall] = field(default_factory=list)
    #: Reasoning summaries, when the model returns them.
    reasoning: list[str] = field(default_factory=list)
    tokens: int = 0


class LLM(Protocol):
    model: str

    def respond(
        self,
        *,
        instructions: str,
        input: str | list,
        tools: list[dict] | None = None,
        previous_id: str | None = None,
    ) -> Reply: ...


def tool_output(call: ToolCall, result: dict) -> dict:
    return {
        "type": "function_call_output",
        "call_id": call.call_id,
        "output": json.dumps(result, ensure_ascii=False),
    }


class OpenAILLM:
    """Responses API; turns chain through `previous_id`, so only new items are sent."""

    def __init__(self, api_key: str, model: str = DEFAULT_MODEL, effort: str = DEFAULT_EFFORT):
        from openai import OpenAI

        self.model = model
        self.effort = effort
        self._client = OpenAI(api_key=api_key)
        self._reasoning = True

    def respond(self, *, instructions, input, tools=None, previous_id=None) -> Reply:
        kwargs: dict = {"model": self.model, "instructions": instructions, "input": input}
        if tools:
            kwargs["tools"] = tools
        if previous_id:
            kwargs["previous_response_id"] = previous_id
        if self._reasoning:
            kwargs["reasoning"] = {"summary": "auto", "effort": self.effort}
        try:
            response = self._client.responses.create(**kwargs)
        except Exception as e:  # a model without reasoning rejects the parameter
            if not self._reasoning or "reasoning" not in str(e).lower():
                raise
            self._reasoning = False
            kwargs.pop("reasoning")
            response = self._client.responses.create(**kwargs)
        return _parse(response)


def _parse(response) -> Reply:
    calls, reasoning = [], []
    for item in response.output:
        if item.type == "function_call":
            args = json.loads(item.arguments or "{}")
            calls.append(ToolCall(item.call_id, item.name, args))
        elif item.type == "reasoning":
            reasoning += [s.text for s in item.summary or [] if s.text]
    usage = response.usage.total_tokens if response.usage else 0
    return Reply(response.id, response.output_text or "", calls, reasoning, usage)


def api_key() -> str | None:
    return os.environ.get("OPENAI_API_KEY") or None


def model_name() -> str:
    return os.environ.get("OPENAI_MODEL", DEFAULT_MODEL)


def live_llm() -> OpenAILLM | None:
    key = api_key()
    effort = os.environ.get("OPENAI_REASONING_EFFORT", DEFAULT_EFFORT)
    return OpenAILLM(key, model_name(), effort) if key else None
