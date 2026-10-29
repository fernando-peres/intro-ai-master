# Toy GPT checkpoints

Each file is a `Trainer` state (model, optimizer, step, histories, stage snapshots), so the lessons can start from a trained model without waiting.

- `toy-gpt-all.pt`: 800 pretraining steps on the `all` corpus, seed 2. Regenerate from the repo root with `uv run python -m genai.toy_gpt --steps 800 --seed 2`.
- `toy-gpt-all-sft.pt` and `toy-gpt-all-rlhf.pt`: the base after supervised fine-tuning, and after a reward model plus PPO. Regenerate with `uv run python -m genai.toy_posttraining` (after the base).
