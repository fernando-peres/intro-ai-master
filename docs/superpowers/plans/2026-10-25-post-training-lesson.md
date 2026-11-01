# Post-training Lesson (Transformers Phase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Students take the Phase 2 toy GPT through the published InstructGPT recipe on the server: supervised fine-tuning on demonstrations, a reward model trained on preference pairs (built-in plus their own rankings), and PPO against that reward model with a KL penalty, then compare base, SFT and RLHF checkpoints on the same prompts.

**Architecture:** `packages/genai/toy_posttraining.py` adds three real, tiny procedures to the existing `Trainer`: `sft()` (loss masked to completion tokens), a `RewardModel` (the policy's backbone plus a scalar head, initialised from the current policy as InstructGPT did) trained with the pairwise loss, and `ppo()` (sequence-level clipped surrogate with a KL penalty against a frozen reference policy). The vocabulary gains the tokens of the instruction format, so pretraining never sees "Question:" but SFT can teach it. `algo-server` exposes the stages on the existing run objects. The `post-training` lesson is a stepped workbench; GPT → ChatGPT gains a "same lineage, toy scale" row.

**Deviation from the spec outline, ruled here:** the spec asked for a PPO *simulator* over a small auditable policy. The toy GPT is that small policy, so PPO runs for real on it; what is simplified (sequence-level ratio, one reward per completion, no value network, advantages normalised per batch) is stated on the page and in the spec. The Adaptation lab's downloaded dataset is *not* fed to the toy model (its review vocabulary is all `<unk>` to it); the page shows that it has the same shape as the built-in demonstrations and preference pairs.

**Tech Stack:** Python 3.14, PyTorch, FastAPI/Pydantic, React + TanStack Query, vitest, pytest.

**Spec:** `apps/ai-intro/docs/26-10-25-transformers.md`, "3. Post-training" and "Constraints".

## Global Constraints

- `packages/*` never import `apps/*`; run registry stays in `algo-server`.
- Synchronous requests only; SFT ≤ 200 steps, reward model ≤ 200 steps, PPO ≤ 20 iterations per request; a run's post-training totals capped at 1000 SFT steps, 1000 RM steps, 200 PPO iterations.
- Every panel badge: `real · toy model`. The illustrative reward table from the source spec is marked `historical illustration`.
- Copy through `t()`, English only. Docstring budgets per AGENTS.md. Branding: SFT loss `chart-warm`, held-out loss `fg-secondary`; reward `chart-warm`, KL `chart-amber`; verdicts (RM agrees with the chosen answer) `success`/`error`.
- Checkpoints `< 1 MB` each: `toy-gpt-all.pt` (regenerated with the extended vocabulary), `toy-gpt-all-sft.pt`, `toy-gpt-all-rlhf.pt`.

## Review Focus

1. A student ranking that contradicts the built-in pairs (e.g. puts the wrong capital first) → the reward model is trained on it anyway and the candidate-score panel shows the wrong answer rising; no crash, no silent drop (Task 2 `test_student_pairs_change_the_reward_model`, Task 4 route test).
2. PPO with `kl_beta = 0` → reward climbs and completions degenerate (repetition); the page's "reward hacking" note appears when the sample repeats a token (Task 2 `test_ppo_without_kl_drifts_further_from_the_reference`).
3. Running PPO before a reward model exists → 400 with a message; the UI disables the PPO button until the RM has trained (Task 4 `test_ppo_requires_a_reward_model`, Task 5 test).
4. SFT on a run that is not pretrained (fresh random weights) → allowed but the page warns that there is nothing to align (Task 5 copy; no server rule).
5. Stage checkpoints requested for a corpus without them (`stage: "sft"` on `general`) → 400 (Task 4 `test_stage_checkpoints_exist_only_for_all`).

---

### Task 1: Instruction data and the extended vocabulary

**Files:** Modify `packages/genai/src/genai/toy_corpus.py`; Test `packages/genai/tests/test_toy_corpus.py`.

**Produces:**
- `@dataclass(frozen=True) Demo(prompt: str, completion: str)`; `DEMONSTRATIONS: tuple[Demo, ...]` (14: eight capitals — France, Japan, Spain, Portugal, Germany, Brazil, Greece, Canada — bees→honey, spiders→eight legs, two plus two→four, grass→green, milk→cows, ice→frozen water) and `HELD_OUT_DEMOS` (Italy→Rome, Egypt→Cairo), format `Question: What is the capital of France? Answer:` / ` Paris.`.
- `@dataclass(frozen=True) Candidate(id: str, text: str, note: str)`; `@dataclass(frozen=True) PreferencePrompt(id: str, prompt: str, candidates: tuple[Candidate, ...], honest: tuple[str, ...])` where `honest` is the candidate ids best → worst; `PREFERENCE_PROMPTS` (6: France, Japan, Spain, bees, spiders, two plus two), each with four candidates: concise correct, long correct, confident wrong, irrelevant.
- `alignment_texts() -> list[str]` (every demo prompt + completion, every candidate text) and `prepare()` adds their tokens to the vocabulary (still sorted, `<unk>` first).

- [ ] Tests: `test_demonstrations_are_in_question_answer_format`, `test_preference_prompts_rank_concise_correct_first`, `test_vocab_includes_the_instruction_tokens` (`" Answer"`, `"Question"`, `" Paris"` in `prepare("all").vocab`; `encode("Question:")` has no 0).
- [ ] Run → FAIL; implement; run → PASS; ruff.

### Task 2: SFT, reward model and PPO

**Files:** Create `packages/genai/src/genai/toy_posttraining.py`; Test `packages/genai/tests/test_toy_posttraining.py`.

**Produces:**
- `@dataclass(frozen=True) SftPoint(step: int, loss: float, held_out_loss: float)`
- `sft(trainer: Trainer, steps: int, *, batch_size: int = 8) -> list[SftPoint]` — trains on `DEMONSTRATIONS` encoded as `prompt + completion + "\n"`, loss only on completion tokens (and the newline), held-out loss on `HELD_OUT_DEMOS`; appends to `trainer.sft_history`; sets `trainer.stage = "sft"`; snapshots the pretrained weights into `trainer.snapshots["pretrained"]` the first time. Caps at `MAX_SFT_STEPS = 1000`.
- `Pair = tuple[str, str, str]` (prompt, chosen, rejected); `pairs_from_ranking(prompt: str, ranking: list[str], prompt_id: str) -> list[Pair]` (every ordered pair, by candidate id); `builtin_pairs(bias: Literal["none", "length"]) -> list[Pair]` (honest rankings, or rankings by token count descending).
- `class RewardModel(nn.Module)`: `__init__(policy: ToyGPT)` deep-copies the backbone, adds `head: Linear(d_model, 1)`; `score(ids: Tensor[1, T]) -> Tensor[]` from the last position.
- `@dataclass(frozen=True) RmPoint(step: int, loss: float, accuracy: float)`
- `class RewardTrainer`: `__init__(trainer: Trainer, pairs: list[Pair], seed: int = 0, lr: float = 1e-3)`; `train(steps: int) -> list[RmPoint]` (pairwise loss `−log σ(r_w − r_l)`, batches of 4 pairs; accuracy over all pairs after each step); `score(prompt: str, completion: str) -> float`. Cap `MAX_RM_STEPS = 1000`.
- `@dataclass(frozen=True) PpoPoint(iteration: int, reward: float, kl: float, policy_loss: float, clip_fraction: float, sample_prompt: str, sample_completion: str)`
- `ppo(trainer: Trainer, rm: RewardTrainer, iterations: int, *, lr: float = 5e-4, clip: float = 0.2, kl_beta: float = 0.1, epochs: int = 4, seed: int = 0) -> list[PpoPoint]` — reference = frozen copy of the policy when PPO starts (`trainer.snapshots["sft"]`); per iteration: for each of the 6 preference prompts sample one completion (temperature 1, ≤ 8 tokens, stop at "." or "\n"); `reward = rm.score − kl_beta·(logπ − logπ_ref)`; advantages standardised; `epochs` clipped-surrogate updates with sequence-level ratios; records mean RM score, mean KL, loss, clip fraction, the first sample. Sets `trainer.stage = "rlhf"`. Cap `MAX_PPO_ITERATIONS = 200`.
- `Trainer` gains attributes `stage: Literal["pretrained","sft","rlhf"] = "pretrained"`, `sft_history`, `snapshots: dict[str, dict]`, `generate_from(stage, ...)` (loads a snapshot into a scratch model and generates), and `save`/`load` carry them.
- `main()`: loads `toy-gpt-all.pt`, runs `sft(300)`, saves `toy-gpt-all-sft.pt`; trains RM 150 steps on honest pairs, `ppo(40)`, saves `toy-gpt-all-rlhf.pt`; prints held-out answers.

- [ ] Tests: `test_sft_teaches_the_format_and_transfers_knowledge` (after `sft(200)`: `probe("Question: What is the capital of Italy? Answer: Rome.")` has ` Rome` top-1 — Italy is held out; before SFT it is not), `test_sft_loss_only_counts_completion_tokens` (changing prompt tokens' targets does not change the loss: compare masked loss on two demos sharing a completion), `test_reward_model_learns_the_honest_pairs` (accuracy ≥ 0.9 after 100 steps on built-in pairs, starts near 0.5), `test_student_pairs_change_the_reward_model` (add student pairs preferring " Madrid." for France; the Madrid score rises above the Paris score after training on student pairs only), `test_ppo_runs_and_reports_metrics` (3 iterations → 3 points, `kl >= 0`, sample non-empty, deterministic for the same seed), `test_ppo_without_kl_drifts_further_from_the_reference` (mean KL after 10 iterations with `kl_beta=0` > with `kl_beta=0.5`), `test_stage_checkpoints_answer_the_held_out_question` (committed SFT checkpoint: ` Rome`), `test_generate_from_snapshot_uses_the_old_weights`.
- [ ] Run → FAIL; implement; run → PASS (file under 60 s); ruff; regenerate checkpoints: `uv run python -m genai.toy_gpt --steps 800` then `uv run python -m genai.toy_posttraining`.

### Task 3: Routes

**Files:** Modify `apps/algo-server/src/algo_server/toy_routes.py`; Test `apps/algo-server/tests/test_toy_routes.py`.

**Produces:**
- `RunState` gains `stage`, `sft_history: list[{step, loss, held_out_loss}]`, `rm_history: list[{step, loss, accuracy}]`, `ppo_history: list[PpoPoint]`, `student_pairs: int`.
- `CreateRun` gains `stage: Literal["pretrained","sft","rlhf"] = "pretrained"` (with `pretrained: true` loads `toy-gpt-all[-stage].pt`; 400 when missing).
- `GET /alignment` → `{demonstrations: [{prompt, completion}], held_out: [...], prompts: [{id, prompt, candidates: [{id, text, note}], honest: [ids]}]}`.
- `POST /runs/{id}/sft {steps 1–200}` → `RunState`; `POST /runs/{id}/preferences {prompt_id, ranking: [ids]}` → `RunState` (stores pairs on the run; 404 unknown prompt id, 422 bad ranking); `POST /runs/{id}/reward-model {steps 1–200, bias: "none"|"length"}` → `RunState` plus `candidate_scores: {prompt_id: {candidate_id: score}}` (RM created on first call from the current policy; `bias` rebuilds the built-in pairs); `POST /runs/{id}/ppo {iterations 1–20, lr, clip, kl_beta}` → `RunState`; 400 without an RM; `POST /runs/{id}/generate` gains optional `stage` ("pretrained" | "sft" | "current").
- The run registry holds a `ToyRun` dataclass `{trainer, rm: RewardTrainer | None, student_pairs: list[Pair], bias}` instead of a bare `Trainer`.

- [ ] Tests (real toy model, small steps): `test_alignment_lists_demos_and_prompts`, `test_sft_then_generate_from_each_stage`, `test_preferences_then_reward_model_scores_candidates`, `test_ppo_requires_a_reward_model`, `test_ppo_runs_after_the_reward_model`, `test_stage_checkpoints_exist_only_for_all`, `test_bad_ranking_is_422`.
- [ ] Run → FAIL; implement; run `uv run pytest apps/algo-server -q` → PASS; ruff; lint-imports.

### Task 4: Post-training lesson and the GPT → ChatGPT lineage row

**Files:** Modify `apps/ai-intro/src/lessons/generative-ai/api.ts`, `lessons/index.ts`, `gpt-to-chatgpt.tsx`, `gpt-to-chatgpt.test.tsx`; Create `post-training.tsx`, `post-training-panels.tsx`, `post-training.test.tsx`, `toy-lineage.tsx`.

**Lesson** (`PostTrainingLesson`): hero "Post-training / from GPT to assistant". Rail: Start from (Pretrained checkpoint · SFT checkpoint · RLHF checkpoint; always corpus `all`), **Reset**. Main, four numbered panels in pipeline order, each `real · toy model`:
1. **Supervised fine-tuning** — demonstrations table (prompt → completion, first six + "and N more"), masks shown for one demo (prompt tokens muted, completion tokens brand), before/after `p(target)` for the held-out question `Question: What is the capital of Italy? Answer:` (` Rome`), **Run 50 SFT steps** button, `LineChart` loss vs held-out loss. Note: knowledge came from pretraining; SFT taught the format.
2. **Human preferences** — for each preference prompt, a ranking widget (click candidates best → worst; Reset ranking; Submit → `POST /preferences`); shows the built-in honest order's note per candidate after submission; "Prefer longer answers" `Switch` (bias). **Train reward model 100 steps** → RM accuracy chart and the candidate-score table (success/error dot: RM agrees with the honest best). The pairwise loss formula in Unicode. Note: the RM learns to predict preferences, not truth.
3. **RLHF with PPO** — controls lr, clip ε, KL β (`SelectField` presets), **Run 5 iterations**; chart reward (chart-warm) and KL (chart-amber); table of sample completions per iteration; the invented reward table from the source spec with the `historical illustration` badge; reward-hacking note when a sample repeats a token three times or when KL β is 0; disabled until an RM exists.
4. **Compare the checkpoints** — prompt chooser (preference prompts + Italy/Egypt), **Generate** → three columns: pretrained / SFT / current (RLHF) outputs with per-token probabilities on hover.
Then **Other techniques** table (DPO, LoRA/PEFT, continued pretraining, rejection sampling: what it does, relationship) with a note that they are not stages of the original ChatGPT pipeline, and a closing `PanelNote` on capabilities vs behaviour.

**GPT → ChatGPT**: below the existing three panels, a `ToyLineage` panel: "Same lineage, toy scale": one toy prompt (`SelectField` over the six preference prompts + Italy), **Run the toy lineage** → creates three runs (`stage` pretrained/sft/rlhf, `pretrained: true`) once and generates from each; three mini columns. Note that unlike GPT-2 vs the assistant, these three share every weight that was not changed by post-training.

- [ ] Tests, `post-training.test.tsx` (fake routes): loads the SFT panel with before probabilities and demos; **Run 50 SFT steps** posts `{steps: 50}` and shows the after probability; ranking four candidates then Submit posts `{prompt_id, ranking}`; **Train reward model** posts `{steps: 100, bias: "none"}` and shows candidate scores; PPO button disabled before RM, enabled after, posts `{iterations: 5, lr, clip, kl_beta}`; Generate shows three columns. `gpt-to-chatgpt.test.tsx`: the lineage button creates three runs with the three stages and shows three outputs.
- [ ] Run → FAIL; implement; `npx vitest run src/lessons/generative-ai src/curriculum.test.ts`, `pnpm exec tsc --noEmit`, `npx biome check src` → green.

### Task 5: Docs

Modify `apps/ai-intro/docs/26-10-25-transformers.md` (section 3 → built, with the PPO simplifications and the Adaptation-dataset ruling; API table; Phases; Verification), `docs/prd.md` (Post-training row **Built.**), `apps/algo-server/README.md`, `packages/genai/README.md`, `apps/ai-intro/README.md`. Then the full verification: Python fast suite, ruff, lint-imports; frontend tsc, biome, full vitest; servers up, drive the lesson headlessly (SFT → ranking → RM → PPO → compare), check GPT → ChatGPT's lineage row, dark/light, 390 px.
