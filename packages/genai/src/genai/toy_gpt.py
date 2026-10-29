"""A minimal decoder-only Transformer that trains live on `toy_corpus` on a laptop CPU.

It teaches the mechanism of pretraining; it is not GPT-3 and cannot show GPT-3-scale ability.
"""

import argparse
import math
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Literal

import torch
import torch.nn.functional as F
from torch import Tensor, nn

from genai.base_model import Candidate, Step
from genai.toy_corpus import CONTEXT_LEN, Prepared, prepare

#: A run never trains past this many steps; the server refuses, the UI disables the buttons.
MAX_STEPS = 2000
CHECKPOINTS = Path(__file__).parent / "checkpoints"
EVAL_WINDOWS = 32


@dataclass(frozen=True)
class ToyConfig:
    vocab_size: int
    context_len: int = CONTEXT_LEN
    d_model: int = 32
    n_heads: int = 2
    n_layers: int = 2
    d_ff: int = 128


class Block(nn.Module):
    """Pre-LayerNorm block: causal multi-head self-attention, then a two-layer MLP."""

    def __init__(self, cfg: ToyConfig) -> None:
        super().__init__()
        self.n_heads = cfg.n_heads
        self.ln1 = nn.LayerNorm(cfg.d_model)
        self.qkv = nn.Linear(cfg.d_model, 3 * cfg.d_model)
        self.proj = nn.Linear(cfg.d_model, cfg.d_model)
        self.ln2 = nn.LayerNorm(cfg.d_model)
        self.mlp = nn.Sequential(
            nn.Linear(cfg.d_model, cfg.d_ff), nn.GELU(), nn.Linear(cfg.d_ff, cfg.d_model)
        )

    def forward(self, x: Tensor, mask: Tensor) -> Tensor:
        b, t, d = x.shape
        q, k, v = self.qkv(self.ln1(x)).split(d, dim=-1)
        shape = (b, t, self.n_heads, d // self.n_heads)
        q, k, v = (m.view(shape).transpose(1, 2) for m in (q, k, v))
        scores = q @ k.transpose(-2, -1) / math.sqrt(q.shape[-1])
        scores = scores.masked_fill(mask[:t, :t] == 0, float("-inf"))
        y = (scores.softmax(-1) @ v).transpose(1, 2).reshape(b, t, d)
        x = x + self.proj(y)
        return x + self.mlp(self.ln2(x))


class LoRALinear(nn.Module):
    """A frozen `nn.Linear` plus a trainable low-rank update `B·A`, scaled by `alpha / rank`."""

    def __init__(self, base: nn.Linear, rank: int, alpha: float) -> None:
        super().__init__()
        self.base = base
        for parameter in base.parameters():
            parameter.requires_grad_(False)
        self.A = nn.Parameter(torch.randn(rank, base.in_features) * 0.01)
        self.B = nn.Parameter(torch.zeros(base.out_features, rank))
        self.scale = alpha / rank

    def forward(self, x: Tensor) -> Tensor:
        return self.base(x) + (x @ self.A.T @ self.B.T) * self.scale

    def merged(self) -> nn.Linear:
        """The plain linear with `B·A` folded into its weight."""
        with torch.no_grad():
            self.base.weight += (self.B @ self.A) * self.scale
        for parameter in self.base.parameters():
            parameter.requires_grad_(True)
        return self.base


#: Every linear of a block gets an adapter: attention projections and both MLP layers.
LORA_TARGETS = ("qkv", "proj", "mlp.0", "mlp.2")


class ToyGPT(nn.Module):
    """Token + position embeddings, `n_layers` blocks, final LayerNorm; output tied to tok_emb."""

    def __init__(self, cfg: ToyConfig) -> None:
        super().__init__()
        self.cfg = cfg
        self.tok_emb = nn.Embedding(cfg.vocab_size, cfg.d_model)
        self.pos_emb = nn.Embedding(cfg.context_len, cfg.d_model)
        self.blocks = nn.ModuleList(Block(cfg) for _ in range(cfg.n_layers))
        self.ln_f = nn.LayerNorm(cfg.d_model)
        self.register_buffer("mask", torch.tril(torch.ones(cfg.context_len, cfg.context_len)))
        for module in self.modules():
            if isinstance(module, nn.Linear | nn.Embedding):
                nn.init.normal_(module.weight, std=0.02)
            if isinstance(module, nn.Linear) and module.bias is not None:
                nn.init.zeros_(module.bias)

    @property
    def n_params(self) -> int:
        return sum(p.numel() for p in self.parameters())

    def hidden(self, ids: Tensor) -> Tensor:
        """Final-layer states `[B, T, d_model]`, what the output head and a reward head read."""
        t = ids.shape[1]
        x = self.tok_emb(ids) + self.pos_emb(torch.arange(t))
        for block in self.blocks:
            x = block(x, self.mask)
        return self.ln_f(x)

    def forward(self, ids: Tensor) -> Tensor:
        return self.hidden(ids) @ self.tok_emb.weight.T


@dataclass(frozen=True)
class Point:
    step: int
    train_loss: float
    val_loss: float


@dataclass(frozen=True)
class SftPoint:
    step: int
    loss: float
    held_out_loss: float


@dataclass(frozen=True)
class PpoPoint:
    """One PPO iteration: mean reward-model score, mean KL to the reference, and one sample."""

    iteration: int
    reward: float
    kl: float
    policy_loss: float
    clip_fraction: float
    sample_prompt: str
    sample_completion: str


@dataclass(frozen=True)
class DpoPoint:
    """One DPO step: loss, share of pairs whose implicit reward prefers the chosen one, margin."""

    step: int
    loss: float
    accuracy: float
    margin: float


Stage = Literal["pretrained", "sft", "rlhf", "dpo"]


@dataclass(frozen=True)
class Position:
    """One next-token prediction inside a probed text: `context` → `target`, with its loss."""

    index: int
    context: list[str]
    target: str
    prob: float
    loss: float
    top_k: list[Candidate]


def random_guess_loss(vocab_size: int) -> float:
    return math.log(vocab_size)


class Trainer:
    """Owns a `ToyGPT`, its optimizer and the loss history; `train` runs synchronous steps."""

    def __init__(
        self, prepared: Prepared, seed: int = 0, lr: float = 3e-3, batch_size: int = 16
    ) -> None:
        self.prepared = prepared
        self.seed, self.lr, self.batch_size = seed, lr, batch_size
        torch.manual_seed(seed)
        self.model = ToyGPT(ToyConfig(prepared.vocab_size))
        self.optimizer = torch.optim.AdamW(self.model.parameters(), lr=lr, weight_decay=0.01)
        self.generator = torch.Generator().manual_seed(seed)
        self.step = 0
        self.history: list[Point] = []
        self.stage: Stage = "pretrained"
        self.sft_history: list[SftPoint] = []
        self.ppo_history: list[PpoPoint] = []
        self.dpo_history: list[DpoPoint] = []
        #: How SFT trained this run ("full" or "lora") and how many parameters it moved.
        self.sft_adapter: str | None = None
        self.sft_trainable: int | None = None
        #: Weights frozen at a stage boundary, keyed by the stage they close ("pretrained", "sft").
        self.snapshots: dict[str, dict[str, Tensor]] = {}
        self._train = torch.tensor(prepared.train_ids)
        self._val = self._val_windows(torch.tensor(prepared.val_ids))

    def _linear(self, block: Block, target: str):
        if target.startswith("mlp."):
            return block.mlp, int(target[4:])
        return block, target

    def enable_lora(self, rank: int, alpha: float | None = None) -> list[nn.Parameter]:
        """Freezes every weight, wraps `LORA_TARGETS` in each block, returns the new parameters."""
        for parameter in self.model.parameters():
            parameter.requires_grad_(False)
        added: list[nn.Parameter] = []
        for block in self.model.blocks:
            for target in LORA_TARGETS:
                owner, key = self._linear(block, target)
                wrapped = LoRALinear(
                    owner[key] if isinstance(key, int) else getattr(owner, key),
                    rank,
                    alpha if alpha is not None else 2 * rank,
                )
                if isinstance(key, int):
                    owner[key] = wrapped
                else:
                    setattr(owner, key, wrapped)
                added += [wrapped.A, wrapped.B]
        return added

    def merge_lora(self) -> None:
        """Folds every adapter into its linear and unfreezes the model."""
        for block in self.model.blocks:
            for target in LORA_TARGETS:
                owner, key = self._linear(block, target)
                layer = owner[key] if isinstance(key, int) else getattr(owner, key)
                if isinstance(layer, LoRALinear):
                    if isinstance(key, int):
                        owner[key] = layer.merged()
                    else:
                        setattr(owner, key, layer.merged())
        for parameter in self.model.parameters():
            parameter.requires_grad_(True)

    def snapshot(self, name: str) -> None:
        self.snapshots[name] = {k: v.detach().clone() for k, v in self.model.state_dict().items()}

    @property
    def context_len(self) -> int:
        return self.model.cfg.context_len

    def _val_windows(self, val: Tensor) -> Tensor:
        length = min(self.context_len + 1, len(val))
        stride = max(1, self.context_len // 4)
        starts = range(0, len(val) - length + 1, stride)
        return torch.stack([val[s : s + length] for s in list(starts)[:EVAL_WINDOWS]])

    def _batch(self) -> tuple[Tensor, Tensor]:
        high = len(self._train) - self.context_len - 1
        starts = torch.randint(0, high, (self.batch_size,), generator=self.generator)
        x = torch.stack([self._train[s : s + self.context_len] for s in starts])
        y = torch.stack([self._train[s + 1 : s + self.context_len + 1] for s in starts])
        return x, y

    def _loss(self, x: Tensor, y: Tensor) -> Tensor:
        logits = self.model(x)
        return F.cross_entropy(logits.reshape(-1, logits.shape[-1]), y.reshape(-1))

    @torch.no_grad()
    def val_loss(self) -> float:
        self.model.eval()
        return float(self._loss(self._val[:, :-1], self._val[:, 1:]))

    def train(self, steps: int) -> list[Point]:
        """Runs `steps` optimizer steps; raises `ValueError` if that would pass `MAX_STEPS`."""
        if self.step + steps > MAX_STEPS:
            raise ValueError(f"a run stops at {MAX_STEPS} steps")
        points: list[Point] = []
        for _ in range(steps):
            self.model.train()
            x, y = self._batch()
            loss = self._loss(x, y)
            self.optimizer.zero_grad()
            loss.backward()
            nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)
            self.optimizer.step()
            self.step += 1
            points.append(Point(self.step, float(loss.detach()), self.val_loss()))
        self.history.extend(points)
        return points

    @torch.no_grad()
    def probe(self, text: str, top_k: int = 5) -> list[Position]:
        """Scores every position after the first, over the last `context_len` tokens only."""
        self.model.eval()
        full = self.prepared.encode(text)
        ids = full[-self.context_len :]
        offset = len(full) - len(ids)
        log_probs = self.model(torch.tensor([ids]))[0].log_softmax(-1)
        positions: list[Position] = []
        for i in range(1, len(ids)):
            row = log_probs[i - 1]
            top_p, top_i = row.exp().topk(top_k)
            positions.append(
                Position(
                    index=offset + i,
                    context=self.prepared.decode(ids[:i]),
                    target=self.prepared.vocab[ids[i]],
                    prob=float(row[ids[i]].exp()),
                    loss=float(-row[ids[i]]),
                    top_k=[
                        Candidate(self.prepared.vocab[int(j)], float(p))
                        for p, j in zip(top_p, top_i, strict=True)
                    ],
                )
            )
        return positions

    @torch.no_grad()
    def generate_steps(
        self,
        prompt: str,
        *,
        max_tokens: int,
        temperature: float,
        top_k: int,
        seed: int,
        stop: str | None = None,
    ) -> list[Step]:
        """Same contract as `BaseLM.generate_steps`, over a sliding `context_len` window."""
        return self._generate(
            self.model,
            prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            top_k=top_k,
            seed=seed,
            stop=stop,
        )

    def generate_from(self, stage: str, prompt: str, **kwargs) -> list[Step]:
        """Generates with the weights frozen at `stage`, or the live ones for "current"."""
        if stage == "current":
            return self.generate_steps(prompt, **kwargs)
        model = ToyGPT(self.model.cfg)
        model.load_state_dict(self.snapshots[stage])
        return self._generate(model, prompt, **kwargs)

    @torch.no_grad()
    def _generate(
        self,
        model: ToyGPT,
        prompt: str,
        *,
        max_tokens: int,
        temperature: float,
        top_k: int,
        seed: int,
        stop: str | None = None,
    ) -> list[Step]:
        model.eval()
        ids = self.prepared.encode(prompt) or [0]
        generator = torch.Generator().manual_seed(seed)
        steps: list[Step] = []
        for _ in range(max_tokens):
            logits = model(torch.tensor([ids[-self.context_len :]]))[0, -1]
            probs = (logits / (temperature or 1.0)).softmax(-1)
            if temperature == 0:
                choice = int(probs.argmax())
            else:
                choice = int(torch.multinomial(probs, 1, generator=generator))
            top_p, top_i = probs.topk(top_k)
            token = self.prepared.vocab[choice]
            steps.append(
                Step(
                    token=token,
                    prob=float(probs[choice]),
                    top_k=[
                        Candidate(self.prepared.vocab[int(j)], float(p))
                        for p, j in zip(top_p, top_i, strict=True)
                    ],
                )
            )
            if stop and stop in token:
                break
            ids.append(choice)
        return steps

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        torch.save(
            {
                "corpus": self.prepared.corpus.id,
                "seed": self.seed,
                "lr": self.lr,
                "batch_size": self.batch_size,
                "step": self.step,
                "history": [asdict(p) for p in self.history],
                "model": self.model.state_dict(),
                "optimizer": self.optimizer.state_dict(),
                "stage": self.stage,
                "sft_history": [asdict(p) for p in self.sft_history],
                "ppo_history": [asdict(p) for p in self.ppo_history],
                "dpo_history": [asdict(p) for p in self.dpo_history],
                "snapshots": self.snapshots,
                "sft_adapter": self.sft_adapter,
                "sft_trainable": self.sft_trainable,
            },
            path,
        )

    @classmethod
    def load(cls, path: Path) -> Trainer:
        data = torch.load(path, weights_only=True)
        trainer = cls(prepare(data["corpus"]), data["seed"], data["lr"], data["batch_size"])
        trainer.model.load_state_dict(data["model"])
        trainer.optimizer.load_state_dict(data["optimizer"])
        trainer.step = data["step"]
        trainer.history = [Point(**p) for p in data["history"]]
        trainer.stage = data.get("stage", "pretrained")
        trainer.sft_history = [SftPoint(**p) for p in data.get("sft_history", [])]
        trainer.ppo_history = [PpoPoint(**p) for p in data.get("ppo_history", [])]
        trainer.dpo_history = [DpoPoint(**p) for p in data.get("dpo_history", [])]
        trainer.snapshots = data.get("snapshots", {})
        trainer.sft_adapter = data.get("sft_adapter")
        trainer.sft_trainable = data.get("sft_trainable")
        return trainer


def checkpoint_path(corpus_id: str) -> Path | None:
    """The committed checkpoint for `corpus_id`, or `None` when none was trained."""
    path = CHECKPOINTS / f"toy-gpt-{corpus_id}.pt"
    return path if path.exists() else None


def main() -> None:
    parser = argparse.ArgumentParser(description="Train a toy GPT and save its checkpoint.")
    parser.add_argument("--corpus", default="all")
    parser.add_argument("--steps", type=int, default=800)
    parser.add_argument("--seed", type=int, default=0)
    args = parser.parse_args()
    trainer = Trainer(prepare(args.corpus), seed=args.seed)
    for _ in range(args.steps // 100):
        point = trainer.train(100)[-1]
        print(f"step {point.step}: train {point.train_loss:.3f} val {point.val_loss:.3f}")
    trainer.train(args.steps % 100)
    path = CHECKPOINTS / f"toy-gpt-{args.corpus}.pt"
    trainer.save(path)
    paris = trainer.probe("The capital of France is Paris.")[4]
    print(f"saved {path} ({path.stat().st_size} bytes); p(Paris) = {paris.prob:.2f}")


if __name__ == "__main__":
    main()
