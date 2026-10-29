"""Generative AI endpoints: GPT-2 as the base model, an OpenAI chat model as the assistant."""

import os
from functools import cache
from pathlib import Path
from typing import Annotated, Literal

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from genai.assistant import Assistant, Message, OpenAIAssistant, Role, pick_label
from genai.base_model import BaseLM, Candidate, GPT2Model, Step
from genai.encoder_model import AttentionModel, BertSmallModel
from genai.prompts import Example, few_shot_prompt

#: The repo-root `.env`; variables already set in the environment win.
load_dotenv(Path(__file__).resolve().parents[4] / ".env")

DEFAULT_ASSISTANT_MODEL = "gpt-5.4-mini"

router = APIRouter(prefix="/api")


@cache
def get_base_lm() -> BaseLM:
    return GPT2Model()


@cache
def get_encoder() -> AttentionModel:
    return BertSmallModel()


@cache
def get_assistant() -> Assistant | None:
    key = os.environ.get("OPENAI_API_KEY")
    model = os.environ.get("OPENAI_MODEL", DEFAULT_ASSISTANT_MODEL)
    return OpenAIAssistant(key, model) if key else None


MaybeAssistant = Annotated[Assistant | None, Depends(get_assistant)]
Base = Annotated[BaseLM, Depends(get_base_lm)]
Encoder = Annotated[AttentionModel, Depends(get_encoder)]


def require_assistant(assistant: MaybeAssistant) -> Assistant:
    if assistant is None:
        raise HTTPException(503, "OPENAI_API_KEY is not set in the repo-root .env")
    return assistant


RequiredAssistant = Annotated[Assistant, Depends(require_assistant)]


def ask(assistant: Assistant, messages: list[Message]) -> str:
    try:
        return assistant.reply(messages)
    except Exception as error:  # the OpenAI SDK raises many types; the student sees the message
        raise HTTPException(502, f"The assistant model failed: {error}") from error


class Health(BaseModel):
    status: Literal["ok"] = "ok"
    base_model: str
    assistant_model: str | None


@router.get("/health")
def health(base: Base, assistant: MaybeAssistant) -> Health:
    return Health(base_model=base.name, assistant_model=assistant.model if assistant else None)


class CompleteRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=2000)
    max_tokens: int = Field(30, ge=1, le=80)
    temperature: float = Field(0.7, ge=0, le=2)
    top_k: int = Field(5, ge=1, le=10)
    seed: int = 0


class CompleteResponse(BaseModel):
    model: str
    steps: list[Step]


@router.post("/genai/complete")
def complete(req: CompleteRequest, base: Base) -> CompleteResponse:
    steps = base.generate_steps(
        req.prompt,
        max_tokens=req.max_tokens,
        temperature=req.temperature,
        top_k=req.top_k,
        seed=req.seed,
    )
    return CompleteResponse(model=base.name, steps=steps)


class AttentionRequest(BaseModel):
    text: str = Field(min_length=1, max_length=200)
    layer: int = Field(0, ge=0, le=GPT2Model.LAYERS - 1)
    top_k: int = Field(5, ge=1, le=10)
    #: GPT-2 is the causal decoder; BERT small the bidirectional encoder.
    model: Literal["gpt2", "bert-small"] = "gpt2"


class AttentionResponse(BaseModel):
    model: str
    #: Causal: future keys are 0. An encoder's rows are free to look both ways.
    causal: bool
    layers: int
    tokens: list[str]
    layer: int
    heads: int
    #: `weights[head][query][key]`; every query row sums to 1.
    weights: list[list[list[float]]]
    next_tokens: list[Candidate]


@router.post("/genai/attention")
def attention(req: AttentionRequest, base: Base, encoder: Encoder) -> AttentionResponse:
    causal = req.model == "gpt2"
    chosen: BaseLM | AttentionModel = base if causal else encoder
    layers = GPT2Model.LAYERS if causal else encoder.LAYERS
    if req.layer >= layers:
        raise HTTPException(400, f"{chosen.name} has layers 0..{layers - 1}")
    result = chosen.attention(req.text, layer=req.layer, top_k=req.top_k)
    return AttentionResponse(
        model=chosen.name,
        causal=causal,
        layers=layers,
        tokens=result.tokens,
        layer=result.layer,
        heads=result.heads,
        weights=result.weights,
        next_tokens=result.next_tokens,
    )


class ExampleIn(BaseModel):
    input: str = Field(max_length=500)
    output: str = Field(max_length=200)


class FewShotRequest(BaseModel):
    instruction: str = Field("", max_length=500)
    examples: list[ExampleIn] = Field(default_factory=list, max_length=12)
    query: str = Field(min_length=1, max_length=1000)
    input_name: str = Field("Input", max_length=40)
    output_name: str = Field("Output", max_length=40)
    model: Literal["base", "assistant"]
    #: When given, the answer is one of these labels (classification).
    labels: list[str] | None = Field(None, max_length=8)


class FewShotResponse(BaseModel):
    model: str
    prompt: str
    output: str
    label: str | None = None
    #: Base model only: each label's probability as the continuation of the prompt.
    scores: dict[str, float] | None = None


ASSISTANT_SYSTEM = "Complete the last {0} in the user's text. Reply with that {0} only."


@router.post("/genai/few-shot")
def few_shot(req: FewShotRequest, base: Base, assistant: MaybeAssistant) -> FewShotResponse:
    examples = [Example(ex.input, ex.output) for ex in req.examples]
    prompt = few_shot_prompt(req.instruction, examples, req.query, req.input_name, req.output_name)

    if req.model == "assistant":
        chosen = require_assistant(assistant)
        system = ASSISTANT_SYSTEM.format(req.output_name)
        output = ask(chosen, [Message("system", system), Message("user", prompt)]).strip()
        label = pick_label(output, req.labels) if req.labels else None
        return FewShotResponse(model=chosen.model, prompt=prompt, output=output, label=label)

    if req.labels:
        scores = base.label_scores(prompt, req.labels)
        label = max(scores, key=scores.__getitem__)
        return FewShotResponse(
            model=base.name, prompt=prompt, output=label, label=label, scores=scores
        )

    steps = base.generate_steps(prompt, max_tokens=40, temperature=0, top_k=1, seed=0, stop="\n")
    output = "".join(step.token for step in steps).strip()
    return FewShotResponse(model=base.name, prompt=prompt, output=output)


class MessageIn(BaseModel):
    role: Role
    content: str = Field(max_length=4000)


class ChatRequest(BaseModel):
    messages: list[MessageIn] = Field(min_length=1, max_length=40)


class ChatResponse(BaseModel):
    model: str
    reply: str


@router.post("/genai/chat")
def chat(req: ChatRequest, assistant: RequiredAssistant) -> ChatResponse:
    reply = ask(assistant, [Message(m.role, m.content) for m in req.messages])
    return ChatResponse(model=assistant.model, reply=reply)
