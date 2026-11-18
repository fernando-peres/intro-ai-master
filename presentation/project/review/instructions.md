# Project review: instructions

How to score each group's GenAI System Design project. One page per group (`01-mms.md` … `12-ip.md`).

> The guidelines are not strict rules. Reward a justified deviation; penalise an unexplained one.

## When

| Step | When | What to score |
| --- | --- | --- |
| Read the deliverables | Before 17 Nov 2026 | A, B, C (project deck, use cases, one-pager) |
| Live presentation | Tue 17 Nov 2026 | D (pitch, prototype) and adjust A–C after Q&A |

## Scale (0–4, per criterion)

| Score | Level | Meaning |
| :--: | --- | --- |
| 0 | Missing | Absent, or contradicts the guidelines |
| 1 | Weak | Mentioned, but vague, generic or unjustified |
| 2 | Adequate | Present and correct, with gaps in evidence or specificity |
| 3 | Good | Specific, justified and consistent; minor gaps |
| 4 | Excellent | Specific, justified, measurable; anticipates failure and trade-offs |

## Criteria (12)

### A. Problem & Solution: 25%

| ID | Criterion | Look for | 2 vs 4 |
| --- | --- | --- | --- |
| A1 | Bounded business problem | One process, one user group; user, task, cause, measurable consequence | 2: real problem, broad scope · 4: tight scope, cause and cost of the problem quantified |
| A2 | Success metrics | Baseline → target, measurement method; scope and non-goals | 2: targets without baseline or method · 4: every metric has baseline, target and method |
| A3 | Solution hypothesis & big picture | Hypothesis (capability, users, task, baseline → target, risks, guards); one system diagram; key assumption with owner; value vs running cost | 2: diagram but no stated assumption · 4: the assumption that breaks the design is named and owned; cost pays off |

### B. GenAI Usage & System Design: 35%

| ID | Criterion | Look for | 2 vs 4 |
| --- | --- | --- | --- |
| B1 | Right AI for each task | Simplest option that works: rules / task-specific model / GenAI; workflow before agent; simpler alternative rejected and why | 2: GenAI everywhere, plausible · 4: approach chosen per task, agent only where the model must decide the path |
| B2 | Context & tools | Context sources with freshness and access rules; output schema; tool arguments validated; act tools limited or approved; only needed blocks, skipped ones explained | 2: blocks listed generically · 4: each block justified, access and write actions controlled |
| B3 | Guardrails & accountability | Guardrails match the risk (input, execution, output) and live in code; human decision is meaningful, not ceremonial; GDPR / EU AI Act named | 2: "the prompt tells it not to" · 4: enforced checks, accountable person per decision, regulation addressed |
| B4 | Evals & observability | Test set (normal, hard, edge, adversarial) with a threshold per dimension; traceability to input, sources, tools, prompt, model version; experiments with a decision metric | 2: "we will test it" · 4: test set + thresholds per use case, traces, one experiment defined |

### C. Use Cases: 25%

| ID | Criterion | Look for | 2 vs 4 |
| --- | --- | --- | --- |
| C1 | Portfolio | 3–5 use cases, prioritised, riskiest marked ★ | 2: list without priority · 4: clear priority, riskiest chosen and designed first |
| C2 | Story & flow | User, trigger, outcome, value; where a human decides; what happens when a step fails; autonomy per step | 2: happy path only · 4: failure paths and autonomy per step explicit |
| C3 | Component catalog & consistency | Every component listed once (ID, name, type), used by a use case; numbers, names and IDs match across deck, use cases, one-pager, pitch | 2: catalog with mismatches · 4: fully consistent across all deliverables |

### D. Presentation & Prototype: 15%

| ID | Criterion | Look for | 2 vs 4 |
| --- | --- | --- | --- |
| D1 | Pitch & one-pager | 5 slides, titles state conclusions; numbers (baseline, target, thresholds); one-pager fits a page, ≤ 3 risks with guards; ends with a decision (what, who, by when) | 2: descriptive titles, no ask · 4: clear story with numbers and a concrete decision |
| D2 | Prototype | Addresses the riskiest use case; proves 1–2 concepts live (grounded answer, schema check, blocked attack, eval with threshold) | 2: demo of the easy path · 4: proves the riskiest concept, with evidence |

## Computing the score

- **Section %** = sum of section scores ÷ (4 × number of criteria in the section)
- **Total %** = Σ (section weight × section %)
- **Grade /20** = total % × 20 (optional)

| Section | Criteria | Max points | Weight |
| --- | :--: | :--: | :--: |
| A. Problem & Solution | 3 | 12 | 25% |
| B. GenAI Usage & System Design | 4 | 16 | 35% |
| C. Use Cases | 3 | 12 | 25% |
| D. Presentation & Prototype | 2 | 8 | 15% |
| **Total** | **12** | **48** | **100%** |

Example: A 9/12 (75%), B 10/16 (62.5%), C 8/12 (66.7%), D 6/8 (75%) → 0.25·75 + 0.35·62.5 + 0.25·66.7 + 0.15·75 = **68.5%** → **13.7/20**.

## Q&A: challenge questions

Ask one or two per group; note the answers on the group page. They inform A3, B1, B3, B4.

1. Why AI here, why this approach (GenAI or task-specific model), and which simpler alternative was rejected?
2. Which assumption, if wrong, breaks the whole design?
3. Is the human review meaningful, or merely ceremonial?
4. What happens when the system is wrong, and would anyone notice?
5. What changes when use grows from 50 cases to 50,000, and does the cost still pay off?
