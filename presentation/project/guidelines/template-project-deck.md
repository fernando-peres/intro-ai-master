# Project deck (PRD)

> **Disclaimer:** these are guidelines, not strict rules. They give a rationale and a structure for learning; adapt them to your problem and explain why.

The project deck is the **PRD** (Product Requirements Document): what the system does, for whom, why, and how each use case works. **6–10 pages.** Terms follow the building blocks vocabulary in the guidelines.

**Topics:** 1 Problem · 2 Solution and target users · 3 Big picture · 4 Use cases · 5 Risks and guards · 6 Conclusions · 7 Component catalog

---

## 1. Problem

**What problem matters, and how do we know?**

> **[User]** struggles to **[task]** because **[cause]**, resulting in **[measurable consequence]**.

- **Baseline** in business terms (time or cost per case, error rate, volume, € at stake), **scope** (one process, one user group) and **non-goals**.
- **Which AI approach:** pick per task; a solution can combine several.

| Option | Fits when | Used for / rejected because |
| --- | --- | --- |
| Rules / process change | Stable, explicit, deterministic task | |
| Task-specific model | Classify, extract, score or forecast with clear labels or history | |
| GenAI: prompt → model or workflow | Unstructured content, language, synthesis | |
| GenAI: agent | Next step depends on what it finds | |

## 2. Solution and target users

**What do we believe will work, and for whom?**

> We believe that using **[AI capability]** to help **[users]** perform **[task]** will improve **[outcome]** from **[baseline]** to **[target]**, while controlling **[main risks]** through **[key guards]**.

| Success metric | Baseline | Target | How measured |
| --- | --- | --- | --- |
| --- | --- | --- | --- |

- **Target users:** who they are, what they need, what hurts today.
- Mix **value** (time, cost, revenue, risk avoided), **quality** (correctness) and **adoption** (% AI suggestions accepted).
- Include the running cost (per case or per month) against the value created.

## 3. Big picture

**How does the whole system fit together?**

- One diagram: users → guardrails → flow (workflow / agent) with context and tools → human decision → action, with evals and observability around it. Start from the one-pager diagram.


## 4. Use cases

In the project deck, include only the use cases summary table.

- Use case list (3–5), with the riskiest marked ★:

| # | Use case | Target user | Trigger | Expected output | Priority |
| --- | --- | --- | --- | --- | --- |
| --- | --- | --- | --- | --- | --- |

Create an appendix with the full details of all use cases. This can be organized either as a single file containing all use cases or as a separate file for each use case.

For more information about the use cases, see the use case guidelines.

## 5. Risks Analysis

**What can go wrong, and what stops it?**

| Risk / assumption | Impact if wrong | Guard or validation | Owner |
| --- | --- | --- | --- |
| --- | --- | --- | --- |

- Typical risks: plausible but wrong answers, data leaks, regulation (GDPR, EU AI Act), over-reliance, stale knowledge, prompt injection, low adoption.
- Mark the **key assumption**: the one that breaks the design if wrong.

## 6. Conclusions

**What is proven, and what comes next?**

- **Now:** what is proven (evals, prototype) vs. still a hypothesis.
- **Next:** the decision you need (budget, pilot, team), the experiments to run, the V1 scope.

## 7. Component catalog

**Which components does the system use?**

Every component, listed once. Use cases and the one-pager refer to it by ID.

| ID | Name | Type | Description | Used by |
| --- | --- | --- | --- | --- |
| RAG-01 | Policy search | RAG index | Vector index over policy PDFs; metadata: date, product | UC1, UC2 |
| MOD-01 | Claim classifier | Model (task-specific) | Classifies incoming claims by type; trained on 2 years of history | UC1 |
| TL-01 | Order lookup | Tool (read) | Reads order status from the ERP API | UC2 |
| WF-01 | Claim triage | Workflow | Classify → retrieve → draft → check | UC1 |

**Types (ID prefix):**
- **Context:** Documents `DOC` · RAG index `RAG` · Repository `REPO` · Knowledge graph `KG` · Schema `SCH` · Memory `MEM` · Prompt / skill `PRM` · Policy `POL`
- **Model** `MOD` (GenAI or task-specific) · **Tool** `TL` (read or act) · **Workflow** `WF` · **Agent** `AG` · **Guardrail** `GR` · **Eval** `EV` · **Experiment** `XP` · **Observability** `OB`

---

## Pitch (5 slides)

| # | Slide | From project deck |
| --- | --- | --- |
| 1 | Problem | Problem, baseline, which AI approach |
| 2 | Solution and use cases | Hypothesis, target users, use cases (★ riskiest) |
| 3 | Big picture | Diagram; zoom on the riskiest use case |
| 4 | Risks and guards | Top risks, key assumption, guards |
| 5 | Evals and next steps | Success metrics, eval thresholds, evidence, decision asked |

One message per slide; the title states the conclusion. Show numbers.
