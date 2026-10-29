"""Live toy-GPT training for the Pretraining and Post-training lessons; runs live in this process.

A run is lost on restart or eviction; the client then creates a new one.
"""

import secrets
from collections import OrderedDict
from dataclasses import dataclass, field
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from genai.base_model import Candidate, Step
from genai.toy_corpus import (
    CONTEXT_LEN,
    CORPORA,
    DEMONSTRATIONS,
    HELD_OUT_DEMOS,
    PREFERENCE_PROMPTS,
    prepare,
    tokenize,
)
from genai.toy_gpt import MAX_STEPS, PpoPoint, Stage, Trainer, checkpoint_path, random_guess_loss
from genai.toy_posttraining import (
    Adapter,
    Bias,
    Pair,
    RewardTrainer,
    builtin_pairs,
    dpo,
    pairs_from_ranking,
    ppo,
    sft,
    stage_checkpoint_path,
)

router = APIRouter(prefix="/api/genai/toy")

#: Oldest run is evicted when a new one would exceed this; a fully post-trained run (policy,
#: optimizer, two snapshots, reward model) is about 1.6 MB, so this is about 200 MB.
MAX_RUNS = 120


@dataclass
class ToyRun:
    """One student's lineage: the policy, its reward model and the preferences they ranked."""

    trainer: Trainer
    rm: RewardTrainer | None = None
    student_pairs: list[Pair] = field(default_factory=list)
    bias: Bias = "none"

    def pairs(self) -> list[Pair]:
        return builtin_pairs(self.bias) + self.student_pairs


RUNS: OrderedDict[str, ToyRun] = OrderedDict()


class CorpusInfo(BaseModel):
    id: str
    title: str
    purpose: str
    sample: str
    documents: int
    duplicates_removed: int
    tokens: int
    vocab_size: int
    train_tokens: int
    val_tokens: int
    context_len: int
    has_checkpoint: bool


@router.get("/corpora")
def corpora() -> list[CorpusInfo]:
    out = []
    for corpus_id, corpus in CORPORA.items():
        prepared = prepare(corpus_id)
        out.append(
            CorpusInfo(
                id=corpus_id,
                title=corpus.title,
                purpose=corpus.purpose,
                sample=" ".join(corpus.documents[:3]),
                documents=prepared.documents,
                duplicates_removed=prepared.duplicates_removed,
                tokens=prepared.tokens,
                vocab_size=prepared.vocab_size,
                train_tokens=len(prepared.train_ids),
                val_tokens=len(prepared.val_ids),
                context_len=CONTEXT_LEN,
                has_checkpoint=checkpoint_path(corpus_id) is not None,
            )
        )
    return out


class DemoOut(BaseModel):
    prompt: str
    completion: str


class AnswerOut(BaseModel):
    id: str
    text: str
    note: str


class PreferencePromptOut(BaseModel):
    id: str
    prompt: str
    candidates: list[AnswerOut]
    honest: list[str]


class Alignment(BaseModel):
    demonstrations: list[DemoOut]
    held_out: list[DemoOut]
    prompts: list[PreferencePromptOut]


@router.get("/alignment")
def alignment() -> Alignment:
    return Alignment(
        demonstrations=[DemoOut(prompt=d.prompt, completion=d.completion) for d in DEMONSTRATIONS],
        held_out=[DemoOut(prompt=d.prompt, completion=d.completion) for d in HELD_OUT_DEMOS],
        prompts=[
            PreferencePromptOut(
                id=p.id,
                prompt=p.prompt,
                candidates=[AnswerOut(id=c.id, text=c.text, note=c.note) for c in p.candidates],
                honest=list(p.honest),
            )
            for p in PREFERENCE_PROMPTS
        ],
    )


class CreateRun(BaseModel):
    corpus: str = "all"
    seed: int = 0
    pretrained: bool = False
    #: With `pretrained`, which committed checkpoint to load.
    stage: Stage = "pretrained"


class PointOut(BaseModel):
    step: int
    train_loss: float
    val_loss: float


class SftPointOut(BaseModel):
    step: int
    loss: float
    held_out_loss: float


class RmPointOut(BaseModel):
    step: int
    loss: float
    accuracy: float


class DpoPointOut(BaseModel):
    step: int
    loss: float
    accuracy: float
    margin: float


class RunState(BaseModel):
    run_id: str
    corpus: str
    step: int
    max_steps: int
    params: int
    vocab_size: int
    context_len: int
    random_guess_loss: float
    history: list[PointOut]
    stage: Stage
    sft_history: list[SftPointOut]
    rm_history: list[RmPointOut]
    ppo_history: list[PpoPoint]
    dpo_history: list[DpoPointOut]
    sft_adapter: Adapter | None
    sft_trainable_params: int | None
    student_pairs: int
    has_reward_model: bool
    execution_mode: Literal["real"] = "real"


def state(run_id: str, run: ToyRun) -> RunState:
    trainer = run.trainer
    return RunState(
        run_id=run_id,
        corpus=trainer.prepared.corpus.id,
        step=trainer.step,
        max_steps=MAX_STEPS,
        params=trainer.model.n_params,
        vocab_size=trainer.prepared.vocab_size,
        context_len=trainer.context_len,
        random_guess_loss=random_guess_loss(trainer.prepared.vocab_size),
        history=[
            PointOut(step=p.step, train_loss=p.train_loss, val_loss=p.val_loss)
            for p in trainer.history
        ],
        stage=trainer.stage,
        sft_history=[
            SftPointOut(step=p.step, loss=p.loss, held_out_loss=p.held_out_loss)
            for p in trainer.sft_history
        ],
        rm_history=[
            RmPointOut(step=p.step, loss=p.loss, accuracy=p.accuracy)
            for p in (run.rm.history if run.rm else [])
        ],
        ppo_history=list(trainer.ppo_history),
        dpo_history=[
            DpoPointOut(step=p.step, loss=p.loss, accuracy=p.accuracy, margin=p.margin)
            for p in trainer.dpo_history
        ],
        sft_adapter=trainer.sft_adapter,
        sft_trainable_params=trainer.sft_trainable,
        student_pairs=len(run.student_pairs),
        has_reward_model=run.rm is not None,
    )


def get_run(run_id: str) -> ToyRun:
    run = RUNS.get(run_id)
    if run is None:
        raise HTTPException(404, "This training run is gone (the server restarted or made room)")
    return run


@router.post("/runs")
def create_run(req: CreateRun) -> RunState:
    if req.corpus not in CORPORA:
        raise HTTPException(404, f"Unknown corpus {req.corpus!r}")
    if req.pretrained:
        path = (
            checkpoint_path(req.corpus)
            if req.stage == "pretrained"
            else stage_checkpoint_path(req.corpus, req.stage)
        )
        if path is None:
            raise HTTPException(
                400, f"No {req.stage} checkpoint was trained for the {req.corpus!r} corpus"
            )
        trainer = Trainer.load(path)
    else:
        trainer = Trainer(prepare(req.corpus), seed=req.seed)
    run_id = secrets.token_hex(4)
    RUNS[run_id] = ToyRun(trainer)
    while len(RUNS) > MAX_RUNS:
        RUNS.popitem(last=False)
    return state(run_id, RUNS[run_id])


def bad_request(error: ValueError) -> HTTPException:
    return HTTPException(400, str(error))


class TrainRequest(BaseModel):
    steps: int = Field(20, ge=1, le=200)


@router.post("/runs/{run_id}/train")
def train(run_id: str, req: TrainRequest) -> RunState:
    run = get_run(run_id)
    try:
        run.trainer.train(req.steps)
    except ValueError as error:
        raise bad_request(error) from error
    return state(run_id, run)


class ProbeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=300)
    top_k: int = Field(5, ge=1, le=10)


class PositionOut(BaseModel):
    index: int
    context: list[str]
    target: str
    prob: float
    loss: float
    top_k: list[Candidate]


class ProbeResponse(BaseModel):
    tokens: list[str]
    #: True when only the last `context_len` tokens were scored.
    truncated: bool
    positions: list[PositionOut]


@router.post("/runs/{run_id}/probe")
def probe(run_id: str, req: ProbeRequest) -> ProbeResponse:
    trainer = get_run(run_id).trainer
    tokens = tokenize(req.text)
    positions = trainer.probe(req.text, top_k=req.top_k)
    return ProbeResponse(
        tokens=tokens,
        truncated=len(tokens) > trainer.context_len,
        positions=[
            PositionOut(
                index=p.index,
                context=p.context,
                target=p.target,
                prob=p.prob,
                loss=p.loss,
                top_k=p.top_k,
            )
            for p in positions
        ],
    )


class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=300)
    max_tokens: int = Field(12, ge=1, le=40)
    temperature: float = Field(0.0, ge=0, le=2)
    top_k: int = Field(5, ge=1, le=10)
    seed: int = 0
    #: "current" uses the live weights; a stage name uses the weights frozen when it ended.
    stage: Literal["current", "pretrained", "sft"] = "current"


class GenerateResponse(BaseModel):
    model: Literal["toy-gpt"] = "toy-gpt"
    steps: list[Step]


@router.post("/runs/{run_id}/generate")
def generate(run_id: str, req: GenerateRequest) -> GenerateResponse:
    trainer = get_run(run_id).trainer
    if req.stage != "current" and req.stage not in trainer.snapshots:
        raise HTTPException(400, f"This run has no {req.stage} weights yet")
    steps = trainer.generate_from(
        req.stage,
        req.prompt,
        max_tokens=req.max_tokens,
        temperature=req.temperature,
        top_k=req.top_k,
        seed=req.seed,
        stop="\n",
    )
    return GenerateResponse(steps=steps)


class SftRequest(BaseModel):
    steps: int = Field(50, ge=1, le=200)
    adapter: Adapter = "full"
    rank: int = Field(4, ge=1, le=16)


@router.post("/runs/{run_id}/sft")
def run_sft(run_id: str, req: SftRequest) -> RunState:
    run = get_run(run_id)
    try:
        sft(run.trainer, req.steps, adapter=req.adapter, rank=req.rank)
    except ValueError as error:
        raise bad_request(error) from error
    return state(run_id, run)


class PreferenceRequest(BaseModel):
    prompt_id: str
    ranking: list[str] = Field(min_length=4, max_length=4)


@router.post("/runs/{run_id}/preferences")
def add_preferences(run_id: str, req: PreferenceRequest) -> RunState:
    run = get_run(run_id)
    prompt = next((p for p in PREFERENCE_PROMPTS if p.id == req.prompt_id), None)
    if prompt is None:
        raise HTTPException(404, f"Unknown prompt {req.prompt_id!r}")
    try:
        pairs = pairs_from_ranking(prompt, req.ranking)
    except ValueError as error:
        raise HTTPException(422, str(error)) from error
    run.student_pairs.extend(pairs)
    if run.rm is not None:
        run.rm.set_pairs(run.pairs())
    return state(run_id, run)


class RewardModelRequest(BaseModel):
    steps: int = Field(100, ge=1, le=200)
    bias: Bias = "none"


class RewardModelResponse(BaseModel):
    run: RunState
    #: `candidate_scores[prompt_id][candidate_id]`: the reward model's score for each answer.
    candidate_scores: dict[str, dict[str, float]]


@router.post("/runs/{run_id}/reward-model")
def train_reward_model(run_id: str, req: RewardModelRequest) -> RewardModelResponse:
    run = get_run(run_id)
    run.bias = req.bias
    if run.rm is None:
        run.rm = RewardTrainer(run.trainer, run.pairs())
    else:
        run.rm.set_pairs(run.pairs())
    try:
        run.rm.train(req.steps)
    except ValueError as error:
        raise bad_request(error) from error
    scores = {
        p.id: {c.id: run.rm.score(p.prompt, c.text) for c in p.candidates}
        for p in PREFERENCE_PROMPTS
    }
    return RewardModelResponse(run=state(run_id, run), candidate_scores=scores)


class PpoRequest(BaseModel):
    iterations: int = Field(5, ge=1, le=20)
    lr: float = Field(5e-4, gt=0, le=1e-2)
    clip: float = Field(0.2, ge=0.05, le=1.0)
    kl_beta: float = Field(0.1, ge=0, le=5)


@router.post("/runs/{run_id}/ppo")
def run_ppo(run_id: str, req: PpoRequest) -> RunState:
    run = get_run(run_id)
    if run.rm is None:
        raise HTTPException(400, "Train a reward model first: PPO needs its scores")
    try:
        ppo(run.trainer, run.rm, req.iterations, lr=req.lr, clip=req.clip, kl_beta=req.kl_beta)
    except ValueError as error:
        raise bad_request(error) from error
    return state(run_id, run)


class DpoRequest(BaseModel):
    steps: int = Field(50, ge=1, le=200)
    beta: float = Field(0.1, gt=0, le=2)
    lr: float = Field(5e-4, gt=0, le=1e-2)


@router.post("/runs/{run_id}/dpo")
def run_dpo(run_id: str, req: DpoRequest) -> RunState:
    """The reward model's preference pairs, optimised directly; excludes the PPO branch."""
    run = get_run(run_id)
    try:
        dpo(run.trainer, run.pairs(), req.steps, beta=req.beta, lr=req.lr)
    except ValueError as error:
        raise bad_request(error) from error
    return state(run_id, run)
