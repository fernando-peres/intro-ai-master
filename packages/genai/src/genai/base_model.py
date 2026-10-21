"""A pretrained, non-instruction-tuned language model that exposes its next-token choices."""

import math
import threading
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class Candidate:
    token: str
    prob: float


@dataclass(frozen=True)
class Step:
    """One generated token, its probability and the `top_k` candidates it was drawn from."""

    token: str
    prob: float
    top_k: list[Candidate]


class BaseLM(Protocol):
    name: str

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
        """Continue `prompt` token by token; stop early at end-of-text or a token containing `stop`.

        `temperature` 0 is greedy, and its candidates show the untempered (T = 1) distribution.
        """
        ...

    def label_scores(self, prompt: str, labels: list[str]) -> dict[str, float]:
        """Probability of each label as the continuation of `prompt`, normalised over `labels`."""
        ...


#: Sampling draws only from the most likely tokens; GPT-2's long tail is mostly noise.
SAMPLING_POOL = 50


def normalise(log_probs: dict[str, float]) -> dict[str, float]:
    peak = max(log_probs.values())
    weights = {k: math.exp(v - peak) for k, v in log_probs.items()}
    total = sum(weights.values())
    return {k: w / total for k, w in weights.items()}


class GPT2Model:
    """GPT-2 (124M) from Hugging Face on CPU; weights load on first use (~500 MB download once)."""

    name = "gpt2"

    def __init__(self) -> None:
        self._tokenizer = None
        self._model = None
        self._lock = threading.Lock()

    @property
    def loaded(self) -> bool:
        return self._model is not None

    def _load(self):
        with self._lock:
            if self._model is not None:
                return self._tokenizer, self._model
            from transformers import AutoModelForCausalLM, AutoTokenizer

            self._tokenizer = AutoTokenizer.from_pretrained(self.name)
            self._model = AutoModelForCausalLM.from_pretrained(self.name).eval()
            return self._tokenizer, self._model

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
        import torch

        tokenizer, model = self._load()
        ids = tokenizer(prompt, return_tensors="pt").input_ids
        generator = torch.Generator().manual_seed(seed)
        steps: list[Step] = []
        # No KV cache: reusing past_key_values crashes (SIGBUS) under torch on Python 3.14.
        with torch.no_grad():
            for _ in range(max_tokens):
                logits = model(ids, use_cache=False).logits[0, -1]
                probs = (logits / (temperature or 1.0)).softmax(-1)
                if temperature == 0:
                    choice = int(probs.argmax())
                else:
                    pool_p, pool_i = probs.topk(SAMPLING_POOL)
                    pick = torch.multinomial(pool_p / pool_p.sum(), 1, generator=generator)
                    choice = int(pool_i[pick])
                top_p, top_i = probs.topk(top_k)
                token = tokenizer.decode([choice])
                steps.append(
                    Step(
                        token=token,
                        prob=float(probs[choice]),
                        top_k=[
                            Candidate(tokenizer.decode([int(i)]), float(p))
                            for p, i in zip(top_p, top_i, strict=True)
                        ],
                    )
                )
                if choice == tokenizer.eos_token_id or (stop and stop in token):
                    break
                ids = torch.cat([ids, torch.tensor([[choice]])], dim=1)
        return steps

    def label_scores(self, prompt: str, labels: list[str]) -> dict[str, float]:
        import torch

        tokenizer, model = self._load()
        prompt_ids = tokenizer(prompt).input_ids
        log_probs: dict[str, float] = {}
        with torch.no_grad():
            for label in labels:
                label_ids = tokenizer(" " + label).input_ids
                ids = torch.tensor([prompt_ids + label_ids])
                logits = model(ids, use_cache=False).logits[0].log_softmax(-1)
                start = len(prompt_ids) - 1
                log_probs[label] = sum(
                    float(logits[start + i, tok]) for i, tok in enumerate(label_ids)
                )
        return normalise(log_probs)
