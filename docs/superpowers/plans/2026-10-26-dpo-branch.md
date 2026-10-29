# DPO Branch (Transformers Phase 4a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Post-training lesson a second branch from the SFT model: Direct Preference Optimization on the same preference pairs, with no reward model, so students can compare "reward model + PPO" with "optimise on the pairs directly".

**Architecture:** `toy_posttraining.dpo()` optimises the toy GPT with the DPO loss `−log σ(β[(log π(y_w|x) − log π_ref(y_w|x)) − (log π(y_l|x) − log π_ref(y_l|x))])` against the SFT weights frozen as the reference; it is an alternative to PPO, so a run takes one branch (`stage` becomes `"dpo"`) and the other is refused until Reset. One new route, one new panel, the Compare columns and the lineage logic extended to the new stage.

**Spec:** `docs/specs/26-10-25-transformers.md`, section 3 (DPO was listed under "Other techniques"; it stays listed there as a *modern* alternative, now runnable).

## Global Constraints

As in the Phase 3 plan. DPO ≤ 200 steps per request, 1000 per run. Badge `real · toy model`. Branding: DPO loss `chart-warm`, pair accuracy `fg-secondary`.

## Review Focus

1. DPO before SFT → 400 "Run SFT first"; after PPO → 400 "took the PPO branch"; PPO after DPO → 400 "took the DPO branch" (Task 1 and Task 2 tests).
2. Student pairs are part of DPO's data too, so a contradictory ranking moves the policy (Task 1 test).
3. β = 0 degenerates the loss to a constant; the UI offers only 0.1 · 0.5 · 1 (Task 3).

### Task 1: `dpo()` in `toy_posttraining.py`

- `@dataclass(frozen=True) DpoPoint(step, loss, accuracy, margin)` in `toy_gpt.py` (saved in checkpoints like the others); `Trainer.dpo_history`; `Stage` gains `"dpo"`.
- `dpo(trainer, pairs: list[Pair], steps, *, beta=0.1, lr=5e-4, batch_size=4, seed=0) -> list[DpoPoint]`: requires `stage in ("sft", "dpo")`; freezes `snapshots["sft"]` on first call; reference = scratch `ToyGPT` loaded from it; per step a batch of pairs, loss as above; `accuracy` = fraction of all pairs whose implicit reward margin `β[(log π − log π_ref)(y_w) − (log π − log π_ref)(y_l)]` is positive after the step, `margin` its mean. Cap `MAX_DPO_STEPS = 1000`. `ppo()` refuses when `stage == "dpo"`.
- Tests: `test_dpo_prefers_chosen_answers_and_needs_sft`, `test_dpo_and_ppo_are_exclusive_branches`, `test_student_pairs_steer_dpo`.

### Task 2: route `POST /runs/{id}/dpo {steps 1–200, beta, lr}`

- `RunState.dpo_history`, `Stage` literal; `GenerateRequest.stage` unchanged (`sft` snapshot exists after DPO starts). Tests: `test_dpo_runs_after_sft_and_blocks_ppo`, `test_dpo_requires_sft`.

### Task 3: lesson

- `api.ts`: `DpoPoint`, `RunState.dpo_history`, `Stage` with `"dpo"`, `dpoRun(runId, {steps, beta})`.
- `post-training-panels.tsx`: `DpoPanel` after the PPO panel: β `SelectField` (0.1 · 0.5 · 1), **Run 50 DPO steps** (disabled until SFT; disabled with "took the PPO branch" once `ppo_history` is non-empty), loss and accuracy charts, the DPO loss in Unicode, note: same pairs, no reward model, the policy itself becomes the reward model. PPO panel disabled with "took the DPO branch" when `stage === "dpo"`. `stagesFor("dpo")` = `["pretrained", "sft", "current"]`; compare label "After DPO (current)". Tests: DPO disabled before SFT; enabled after SFT; posts `{steps: 50, beta: 0.1}`; PPO disabled afterwards with the branch message; compare shows "After DPO (current)".

### Task 4: docs

Spec section 3 (DPO branch, exclusivity, loss, observed numbers), Phases table (4a built), API table, READMEs, PRD limitation column.
