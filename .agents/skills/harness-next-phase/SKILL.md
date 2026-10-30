---
name: harness-next-phase
description: Implement the next phase of the harness-content walking-skeleton plan (apps/harness-content/docs/implementation-plan.md). Use when the user says "next phase", "/harness-next-phase", or asks to continue the harness-content / harness-content-api implementation.
---

# harness-next-phase

Implements exactly **one** phase of `apps/harness-content/docs/implementation-plan.md`, then stops.

## Steps

1. Read `apps/harness-content/docs/implementation-plan.md` and the PRD sections the phase cites (`apps/harness-content/docs/reusable-artifacts-prd-v0.1.md`).
2. Pick the first phase whose status is `in-progress` (resume it), otherwise the first `todo`. If the user named a phase (e.g. "P7"), use that one. Set it to `Status: in-progress`.
3. If the phase lists design node IDs, print them:
   `python3 -I apps/harness-content/scripts/pen-nodes.py harness-sigmma.pen <ids...>`
   Match layout, copy and tokens to the designs. Tokens are `$name` variables with one value per theme (dark, light, violet, mint, cobalt, ivory).
4. Read the code the earlier phases produced before adding to it; reuse their modules rather than duplicating them.
5. Implement the deliverables. Follow `AGENTS.md`: comment/docstring budgets, UTC `YYYY-MM-DD-HH-mm-ss` dates, `packages/*` never import `apps/*`, each app self-contained with its own README and tests, no ADR without asking the user first.
6. Run the phase's "Done when" checks plus lint/typecheck for every project touched. Fix failures; do not mark the phase done while a check fails. For browser checks, use the `claude-in-chrome` skill.
7. Set `Status: done` and add one line under the phase: `Log: <UTC YYYY-MM-DD-HH-mm-ss> — <what shipped, anything deferred>`. If a decision changed, update the plan's Decisions section.
8. Stop. Summarize what shipped, what was verified (with the commands), and what is deferred. Do **not** start the following phase. Do not commit unless the user asks.

## When blocked

If a phase depends on a decision the plan does not settle (licensing, a product rule, an ADR), ask the user instead of guessing, and leave the phase `in-progress`.
