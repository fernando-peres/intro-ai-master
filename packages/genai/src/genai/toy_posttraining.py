"""Post-training for the toy GPT: SFT on demonstrations, a reward model from preferences, PPO.

Real but tiny. Simplifications a reader must know: one reward per whole completion, sequence-level
PPO ratios, no value network, advantages standardised per batch, and the KL penalty is the exact
per-token KL to the frozen reference over the sampled completions, added to the loss.
"""

import argparse
import copy
from dataclasses import dataclass
from typing import Literal

import torch
import torch.nn.functional as F
from torch import Tensor, nn

from genai.toy_corpus import (
    DEMONSTRATIONS,
    HELD_OUT_DEMOS,
    PREFERENCE_PROMPTS,
    Demo,
    PreferencePrompt,
    Prepared,
    tokenize,
)
from genai.toy_gpt import (
    CHECKPOINTS,
    DpoPoint,
    PpoPoint,
    SftPoint,
    ToyGPT,
    Trainer,
    checkpoint_path,
)

MAX_SFT_STEPS = 1000
MAX_RM_STEPS = 1000
MAX_PPO_ITERATIONS = 200
MAX_DPO_STEPS = 1000
#: SFT runs gentler than pretraining and mixes a pretraining batch into every step (InstructGPT's
#: "pretraining mix"); without both, fifteen demonstrations overwrite what the model knew.
SFT_LR = 3e-4
SFT_REPLAY = 1.0
#: Adapters train from zero, so they take a higher rate than the full weights.
LORA_LR = 3e-3

Adapter = Literal["full", "lora"]
#: Completions this long are cut; the answers the lesson teaches are two to eight tokens.
MAX_COMPLETION = 8

Pair = tuple[str, str, str]
Bias = Literal["none", "length"]


def stage_checkpoint_path(corpus_id: str, stage: str):
    path = CHECKPOINTS / f"toy-gpt-{corpus_id}-{stage}.pt"
    return path if path.exists() else None


def encode_demo(prepared: Prepared, demo: Demo) -> tuple[list[int], list[bool]]:
    """Token ids of prompt + completion + newline, and which of them the SFT loss counts."""
    prompt = prepared.encode(demo.prompt)
    completion = prepared.encode(demo.completion + "\n")
    return prompt + completion, [False] * len(prompt) + [True] * len(completion)


def _batch(prepared: Prepared, demos: list[Demo], context_len: int):
    encoded = [encode_demo(prepared, d) for d in demos]
    width = min(context_len + 1, max(len(ids) for ids, _ in encoded))
    x = torch.zeros(len(encoded), width - 1, dtype=torch.long)
    y = torch.zeros_like(x)
    m = torch.zeros_like(x, dtype=torch.bool)
    for row, (ids, mask) in enumerate(encoded):
        ids, mask = ids[-width:], mask[-width:]
        n = len(ids) - 1
        x[row, :n] = torch.tensor(ids[:-1])
        y[row, :n] = torch.tensor(ids[1:])
        m[row, :n] = torch.tensor(mask[1:])
    return x, y, m


def _masked_loss(model: ToyGPT, x: Tensor, y: Tensor, m: Tensor) -> Tensor:
    logits = model(x)
    losses = F.cross_entropy(logits.reshape(-1, logits.shape[-1]), y.reshape(-1), reduction="none")
    return (losses * m.reshape(-1)).sum() / m.sum()


def sft(
    trainer: Trainer,
    steps: int,
    *,
    batch_size: int = 8,
    adapter: Adapter = "full",
    rank: int = 4,
) -> list[SftPoint]:
    """Supervised fine-tuning on `DEMONSTRATIONS`; freezes the pretrained weights on first call.

    `adapter` is fixed by the first call: "full" moves every weight, "lora" trains rank-`rank`
    adapters on each block's linears and folds them in when the call ends.
    """
    if trainer.stage in ("rlhf", "dpo"):
        raise ValueError(
            "SFT after PPO or DPO would break the lineage; reset the run to start over"
        )
    if len(trainer.sft_history) + steps > MAX_SFT_STEPS:
        raise ValueError(f"SFT stops at {MAX_SFT_STEPS} steps")
    if trainer.sft_adapter is not None and trainer.sft_adapter != adapter:
        chosen = "LoRA adapters" if trainer.sft_adapter == "lora" else "all its weights (full)"
        raise ValueError(f"This run fine-tunes {chosen}; reset it to switch")
    if "pretrained" not in trainer.snapshots:
        trainer.snapshot("pretrained")
        for group in trainer.optimizer.param_groups:
            group["lr"] = SFT_LR
    trainer.stage = "sft"
    trainer.sft_adapter = adapter
    if adapter == "lora":
        lora_params = trainer.enable_lora(rank)
        optimizer = torch.optim.AdamW(lora_params, lr=LORA_LR, weight_decay=0.0)
        trainer.sft_trainable = sum(p.numel() for p in lora_params)
    else:
        optimizer = trainer.optimizer
        trainer.sft_trainable = trainer.model.n_params
    held = _batch(trainer.prepared, list(HELD_OUT_DEMOS), trainer.context_len)
    demos = list(DEMONSTRATIONS)
    points: list[SftPoint] = []
    for _ in range(steps):
        order = torch.randperm(len(demos), generator=trainer.generator)[:batch_size]
        x, y, m = _batch(trainer.prepared, [demos[int(i)] for i in order], trainer.context_len)
        trainer.model.train()
        loss = _masked_loss(trainer.model, x, y, m)
        replay_x, replay_y = trainer._batch()
        total = loss + SFT_REPLAY * trainer._loss(replay_x, replay_y)
        optimizer.zero_grad()
        total.backward()
        nn.utils.clip_grad_norm_(trainer.model.parameters(), 1.0)
        optimizer.step()
        trainer.model.eval()
        with torch.no_grad():
            held_loss = float(_masked_loss(trainer.model, *held))
        points.append(SftPoint(len(trainer.sft_history) + 1, float(loss.detach()), held_loss))
        trainer.sft_history.append(points[-1])
    if adapter == "lora":
        trainer.merge_lora()
    return points


def pairs_from_ranking(prompt: PreferencePrompt, ranking: list[str]) -> list[Pair]:
    """Every ordered pair of a best → worst ranking of the prompt's candidate ids."""
    texts = {c.id: c.text for c in prompt.candidates}
    if sorted(ranking) != sorted(texts):
        raise ValueError("ranking must list each candidate id exactly once")
    return [
        (prompt.prompt, texts[chosen], texts[rejected])
        for i, chosen in enumerate(ranking)
        for rejected in ranking[i + 1 :]
    ]


def builtin_pairs(bias: Bias) -> list[Pair]:
    """The honest rankings, or rankings by length (longest first) to show a biased annotator."""
    pairs: list[Pair] = []
    for prompt in PREFERENCE_PROMPTS:
        if bias == "length":
            ranking = sorted(
                (c.id for c in prompt.candidates),
                key=lambda cid: (
                    -len(tokenize(next(c.text for c in prompt.candidates if c.id == cid)))
                ),
            )
        else:
            ranking = list(prompt.honest)
        pairs.extend(pairs_from_ranking(prompt, ranking))
    return pairs


class RewardModel(nn.Module):
    """The policy's backbone (copied, as InstructGPT did) plus a scalar head on the last token."""

    def __init__(self, policy: ToyGPT) -> None:
        super().__init__()
        self.backbone = copy.deepcopy(policy)
        self.head = nn.Linear(policy.cfg.d_model, 1)
        nn.init.zeros_(self.head.bias)

    def score(self, ids: Tensor) -> Tensor:
        return self.head(self.backbone.hidden(ids.unsqueeze(0))[0, -1]).squeeze(-1)


@dataclass(frozen=True)
class RmPoint:
    step: int
    loss: float
    accuracy: float


class RewardTrainer:
    """Trains a `RewardModel` on (prompt, chosen, rejected) pairs with `−log σ(r_w − r_l)`."""

    def __init__(self, trainer: Trainer, pairs: list[Pair], seed: int = 0, lr: float = 1e-3):
        torch.manual_seed(seed)
        self.prepared = trainer.prepared
        self.context_len = trainer.context_len
        self.model = RewardModel(trainer.model)
        self.optimizer = torch.optim.AdamW(self.model.parameters(), lr=lr, weight_decay=0.01)
        self.generator = torch.Generator().manual_seed(seed)
        self.history: list[RmPoint] = []
        self.set_pairs(pairs)

    def set_pairs(self, pairs: list[Pair]) -> None:
        self.pairs = list(pairs)
        self._encoded = [(self._ids(p + c), self._ids(p + r)) for p, c, r in self.pairs]

    def _ids(self, text: str) -> Tensor:
        return torch.tensor(self.prepared.encode(text)[-self.context_len :])

    def _margins(self, indices) -> Tensor:
        return torch.stack(
            [
                self.model.score(self._encoded[i][0]) - self.model.score(self._encoded[i][1])
                for i in indices
            ]
        )

    def train(self, steps: int, *, batch_size: int = 4) -> list[RmPoint]:
        if len(self.history) + steps > MAX_RM_STEPS:
            raise ValueError(f"the reward model stops at {MAX_RM_STEPS} steps")
        points: list[RmPoint] = []
        for _ in range(steps):
            order = torch.randperm(len(self.pairs), generator=self.generator)[:batch_size]
            self.model.train()
            loss = -F.logsigmoid(self._margins(order.tolist())).mean()
            self.optimizer.zero_grad()
            loss.backward()
            self.optimizer.step()
            self.model.eval()
            with torch.no_grad():
                accuracy = float((self._margins(range(len(self.pairs))) > 0).float().mean())
            points.append(RmPoint(len(self.history) + 1, float(loss.detach()), accuracy))
            self.history.append(points[-1])
        return points

    @torch.no_grad()
    def score(self, prompt: str, completion: str) -> float:
        self.model.eval()
        return float(self.model.score(self._ids(prompt + completion)))


def _sample(model: ToyGPT, prepared: Prepared, prompt_ids: list[int], generator, context_len):
    stop = {prepared.vocab.index("."), prepared.vocab.index("\n")}
    ids = list(prompt_ids)
    completion: list[int] = []
    for _ in range(MAX_COMPLETION):
        probs = model(torch.tensor([ids[-context_len:]]))[0, -1].softmax(-1)
        choice = int(torch.multinomial(probs, 1, generator=generator))
        completion.append(choice)
        ids.append(choice)
        if choice in stop:
            break
    return completion


def _completion_log_probs(
    model: ToyGPT, prompt_ids: list[int], completion: list[int], ctx
) -> Tensor:
    """Log-probabilities `[n, V]` at the positions that predict the `n` completion tokens."""
    ids = (prompt_ids + completion)[-ctx:]
    n = len(completion)
    return model(torch.tensor([ids]))[0, -n - 1 : -1].log_softmax(-1)


def _log_prob(model: ToyGPT, prompt_ids: list[int], completion: list[int], ctx) -> Tensor:
    log_probs = _completion_log_probs(model, prompt_ids, completion, ctx)
    return log_probs.gather(1, torch.tensor(completion).unsqueeze(1)).sum()


def _kl_to_reference(policy: ToyGPT, reference: ToyGPT, prompt_ids, completion, ctx) -> Tensor:
    """Exact KL(π ‖ π_ref) summed over the completion positions."""
    new = _completion_log_probs(policy, prompt_ids, completion, ctx)
    with torch.no_grad():
        ref = _completion_log_probs(reference, prompt_ids, completion, ctx)
    return (new.exp() * (new - ref)).sum()


def ppo(
    trainer: Trainer,
    rm: RewardTrainer,
    iterations: int,
    *,
    lr: float = 5e-4,
    clip: float = 0.2,
    kl_beta: float = 0.1,
    epochs: int = 4,
    seed: int = 0,
) -> list[PpoPoint]:
    """Clipped-surrogate updates against `rm`, plus `kl_beta` × KL to the weights at PPO start."""
    if trainer.stage == "pretrained":
        raise ValueError("Run SFT first: PPO needs the SFT weights as its reference")
    if trainer.stage == "dpo":
        raise ValueError("This run took the DPO branch; reset it to try PPO")
    if len(trainer.ppo_history) + iterations > MAX_PPO_ITERATIONS:
        raise ValueError(f"PPO stops at {MAX_PPO_ITERATIONS} iterations")
    if "sft" not in trainer.snapshots:
        trainer.snapshot("sft")
    trainer.stage = "rlhf"
    prepared, ctx = trainer.prepared, trainer.context_len
    reference = ToyGPT(trainer.model.cfg)
    reference.load_state_dict(trainer.snapshots["sft"])
    reference.eval()
    optimizer = torch.optim.AdamW(trainer.model.parameters(), lr=lr, weight_decay=0.0)
    generator = torch.Generator().manual_seed(seed * 1000 + len(trainer.ppo_history))
    prompts = [(p.prompt, prepared.encode(p.prompt)) for p in PREFERENCE_PROMPTS]
    points: list[PpoPoint] = []
    for _ in range(iterations):
        trainer.model.eval()
        with torch.no_grad():
            samples = [_sample(trainer.model, prepared, ids, generator, ctx) for _, ids in prompts]
            batch = list(zip((ids for _, ids in prompts), samples, strict=True))
            old = torch.stack([_log_prob(trainer.model, ids, s, ctx) for ids, s in batch])
            scores = torch.tensor(
                [float(rm.model.score(torch.tensor((ids + s)[-ctx:]))) for ids, s in batch]
            )
            kl_before = torch.stack(
                [_kl_to_reference(trainer.model, reference, ids, s, ctx) for ids, s in batch]
            ).mean()
            advantages = (scores - scores.mean()) / (scores.std() + 1e-6)
        losses, clipped = [], []
        for _ in range(epochs):
            trainer.model.train()
            new = torch.stack([_log_prob(trainer.model, ids, s, ctx) for ids, s in batch])
            ratio = (new - old).exp()
            surrogate = torch.minimum(
                ratio * advantages, ratio.clamp(1 - clip, 1 + clip) * advantages
            )
            kl = torch.stack(
                [_kl_to_reference(trainer.model, reference, ids, s, ctx) for ids, s in batch]
            ).mean()
            loss = -surrogate.mean() + kl_beta * kl
            optimizer.zero_grad()
            loss.backward()
            nn.utils.clip_grad_norm_(trainer.model.parameters(), 1.0)
            optimizer.step()
            losses.append(float(loss.detach()))
            clipped.append(float(((ratio - 1).abs() > clip).float().mean()))
        points.append(
            PpoPoint(
                iteration=len(trainer.ppo_history) + 1,
                reward=float(scores.mean()),
                kl=float(kl_before),
                policy_loss=sum(losses) / len(losses),
                clip_fraction=sum(clipped) / len(clipped),
                sample_prompt=prompts[0][0],
                sample_completion="".join(prepared.decode(samples[0])),
            )
        )
        trainer.ppo_history.append(points[-1])
    return points


def dpo(
    trainer: Trainer,
    pairs: list[Pair],
    steps: int,
    *,
    beta: float = 0.1,
    lr: float = 5e-4,
    batch_size: int = 4,
    seed: int = 0,
) -> list[DpoPoint]:
    """Direct Preference Optimization against the SFT weights frozen as the reference.

    Alternative to the reward model + PPO branch: a run takes one of the two.
    """
    if trainer.stage == "pretrained":
        raise ValueError("Run SFT first: DPO needs the SFT weights as its reference")
    if trainer.stage == "rlhf":
        raise ValueError("This run took the PPO branch; reset it to try DPO")
    if len(trainer.dpo_history) + steps > MAX_DPO_STEPS:
        raise ValueError(f"DPO stops at {MAX_DPO_STEPS} steps")
    if "sft" not in trainer.snapshots:
        trainer.snapshot("sft")
    trainer.stage = "dpo"
    prepared, ctx = trainer.prepared, trainer.context_len
    reference = ToyGPT(trainer.model.cfg)
    reference.load_state_dict(trainer.snapshots["sft"])
    reference.eval()
    encoded = [(prepared.encode(p), prepared.encode(c), prepared.encode(r)) for p, c, r in pairs]
    with torch.no_grad():
        ref = [
            (_log_prob(reference, p, c, ctx), _log_prob(reference, p, r, ctx))
            for p, c, r in encoded
        ]

    def margins(indices) -> Tensor:
        return torch.stack(
            [
                beta
                * (
                    (_log_prob(trainer.model, encoded[i][0], encoded[i][1], ctx) - ref[i][0])
                    - (_log_prob(trainer.model, encoded[i][0], encoded[i][2], ctx) - ref[i][1])
                )
                for i in indices
            ]
        )

    optimizer = torch.optim.AdamW(trainer.model.parameters(), lr=lr, weight_decay=0.0)
    generator = torch.Generator().manual_seed(seed * 1000 + len(trainer.dpo_history))
    points: list[DpoPoint] = []
    for _ in range(steps):
        order = torch.randperm(len(pairs), generator=generator)[:batch_size]
        trainer.model.train()
        loss = -F.logsigmoid(margins(order.tolist())).mean()
        optimizer.zero_grad()
        loss.backward()
        nn.utils.clip_grad_norm_(trainer.model.parameters(), 1.0)
        optimizer.step()
        trainer.model.eval()
        with torch.no_grad():
            all_margins = margins(range(len(pairs)))
        points.append(
            DpoPoint(
                step=len(trainer.dpo_history) + 1,
                loss=float(loss.detach()),
                accuracy=float((all_margins > 0).float().mean()),
                margin=float(all_margins.mean()),
            )
        )
        trainer.dpo_history.append(points[-1])
    return points


def main() -> None:
    parser = argparse.ArgumentParser(description="Post-train the committed toy GPT checkpoint.")
    parser.add_argument("--corpus", default="all")
    parser.add_argument("--sft-steps", type=int, default=200)
    parser.add_argument("--rm-steps", type=int, default=150)
    parser.add_argument("--ppo-iterations", type=int, default=40)
    args = parser.parse_args()
    base = checkpoint_path(args.corpus)
    if base is None:
        raise SystemExit(
            f"train the base checkpoint first: python -m genai.toy_gpt --corpus {args.corpus}"
        )
    trainer = Trainer.load(base)
    italy = "Question: What is the capital of Italy? Answer:"
    gen = dict(max_tokens=4, temperature=0.0, top_k=3, seed=0)
    print("pretrained:", "".join(s.token for s in trainer.generate_steps(italy, **gen)))
    sft(trainer, args.sft_steps)
    trainer.save(CHECKPOINTS / f"toy-gpt-{args.corpus}-sft.pt")
    print("sft:", "".join(s.token for s in trainer.generate_steps(italy, **gen)))
    rm = RewardTrainer(trainer, builtin_pairs("none"))
    print("reward model accuracy:", rm.train(args.rm_steps)[-1].accuracy)
    points = ppo(trainer, rm, args.ppo_iterations)
    trainer.save(CHECKPOINTS / f"toy-gpt-{args.corpus}-rlhf.pt")
    print("rlhf:", "".join(s.token for s in trainer.generate_steps(italy, **gen)))
    print(f"ppo reward {points[0].reward:.2f} → {points[-1].reward:.2f}, kl {points[-1].kl:.3f}")


if __name__ == "__main__":
    main()
