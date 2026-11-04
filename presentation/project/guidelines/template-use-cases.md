# Use case guidelines

> **Disclaimer:** these are guidelines, not strict rules. They give a rationale and a structure for learning; adapt them to your problem and explain why.

Feeds topics **3 (use case list)** and **4 (use cases)** of the project deck. Each use case document follows the topics below, in order. Refer to components by their component catalog ID (project deck, topic 7) (e.g. `RAG-01`, `TL-02`).

**Only the blocks you need:** skip a topic with a one-line reason (e.g. "Tools: none, read-only answers from documents").

**Topics:** 1 Story · 2 User flow · 3 Context · 4 Tools · 5 Flow and models · 6 Guardrails · 7 Evals · 8 Observability · 9 Experiments · 10 Risks and open questions

---

## 1. Story

**Who needs what, and what changes for them?**

> "As a **[user]**, when **[trigger]**, I want **[outcome]**, so that **[value]**."

## 2. User flow

**What happens from trigger to outcome, and who does each step?**

| Step | Human | AI | Tool / system | Autonomy |
| --- | --- | --- | --- | --- |
| 1 | | | | Suggests / acts after approval / acts alone |

- Mark **where a human decides** and **what happens when a step fails** (fallback, escalation, retry).
- More autonomy needs more guardrails and evals.

## 3. Context (C)

**What must the model know at each step?**

| Step | Need | Component (ID) | Freshness & access |
| --- | --- | --- | --- |
| | | `RAG-01` | |

- Include memory (what is kept, what is never stored) and the **output schema** (`SCH`) code can validate, or state "free text for a human".
- Relevance beats volume: too much context degrades answers.

## 4. Tools (T)

**What must it fetch, compute or do that the model cannot?**

| Tool (ID) | Purpose | Read / act |
| --- | --- | --- |

- The model only *requests* a call; your code runs it and validates the arguments.
- Act tools (refund, email) need limits or approval.

## 5. Flow and models (W / A / M)

**Who decides the next step, and which model does each AI step?**

| Pattern | Use when |
| --- | --- |
| Prompt → model | One answer is enough and a person checks it |
| Workflow (`WF`) | Steps can be drawn in advance |
| Agent (`AG`) | Next step depends on what it finds |

- State the pattern and why. Patterns can mix (a workflow with an agent step).
- Name the model per AI step (`MOD` ID): a GenAI model, or a task-specific model when the task is narrow (e.g. classify a ticket, then let GenAI draft the reply).

## 6. Guardrails (G)

**What must the system never let in, do, or say?**

| Input | Execution | Output |
| --- | --- | --- |
| Personal-data redaction, prompt-injection detection, topic scope | Argument checks, tool access by role, approval thresholds | Schema check, groundedness, leak filter, safe fallback |

Each guardrail can raise false alarms: test it too.

## 7. Evals (E)

**How do we prove it works, and still works after a change?**

| Dimension | Metric | Evaluator | Threshold |
| --- | --- | --- | --- |
| Correctness (accuracy, precision / recall for classifiers) | | Code / LLM as judge / human | |
| Groundedness | | | |
| Format / policy | | | |

- Test set: normal, hard, edge and adversarial cases.
- Code first, judge second, people to calibrate the judge.

## 8. Observability (O)

**In production, can we see what it did, and why?**

| Signal | What is logged | Alert / review trigger |
| --- | --- | --- |
| Traces (inputs, sources, tools, prompt & model version) | | |
| Speed, errors, cost | | |
| Quality (judge scores, user feedback) | | |

Every production failure becomes a test case.

## 9. Experiments (X)

**Which design choice must be tested before we trust it?**

| Hypothesis | Variant vs. baseline | Dataset | Decision metric |
| --- | --- | --- | --- |

Change one thing at a time on the same dataset; offline first, then a small live pilot.

## 10. Risks and open questions

**What can go wrong here, and would anyone notice?**

List failure modes, their impact, and assumptions still to validate.
