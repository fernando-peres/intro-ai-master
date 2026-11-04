# Checklist

> **Disclaimer:** these are guidelines, not strict rules. They give a rationale and a structure for learning; adapt them to your problem and explain why.

What to verify before you hand in, or when you challenge someone else's design. GenAI fails silently: outputs can look right and still be wrong.

## Problem and value
- [ ] A real business problem: one process, one user group, one measurable business outcome.
- [ ] The problem names a user, a task, a cause and a measurable consequence.
- [ ] Baseline, target, scope and non-goals are stated.
- [ ] The AI approach fits each task (rules, task-specific model, GenAI, agent) and the choice is explained.
- [ ] Value outweighs running cost; regulatory constraints (GDPR, EU AI Act) are named.

## Project deck
- [ ] The hypothesis has capability, users, task, baseline → target, risks and guards.
- [ ] Every success metric has a baseline, a target and a measurement method.
- [ ] One big-picture diagram shows the whole system.
- [ ] 3–5 use cases, prioritised, with the riskiest marked ★.
- [ ] Each risk has a guard; the key assumption is named, with an owner.
- [ ] Conclusions separate what is proven from what is still a hypothesis.

## Each use case
- [ ] The story names a user, a trigger, an outcome and the value.
- [ ] The flow shows where a human decides and what happens when a step fails.
- [ ] Autonomy per step is stated; accountability sits with a person.
- [ ] Only the blocks it needs are used; skipped ones have a reason.
- [ ] Context sources have freshness and access rules; the output has a schema or is free text for a human.
- [ ] Tool arguments are validated; act tools are limited or approved.
- [ ] The flow is the simplest pattern that works, and each AI step names its model.
- [ ] Guardrails match the risk (input, execution, output).
- [ ] A test set (normal, hard, edge, adversarial) and a threshold per dimension.
- [ ] Any answer can be traced to its input, sources, tools, prompt and model version.
- [ ] Key design choices have an experiment with a decision metric.

## Component catalog
- [ ] Every component is listed once, with ID, name, type and description.
- [ ] Every component is used by at least one use case; use cases refer to IDs.

## One-pager
- [ ] Fits on one page.
- [ ] The diagram shows only the components used, and where a human decides.
- [ ] At most three risks, each with a concrete guard.
- [ ] Ends with a specific decision: what, who, by when.

## Pitch
- [ ] Five slides; each title states a conclusion.
- [ ] Shows numbers: baseline, target, thresholds.

## Prototype
- [ ] Addresses the riskiest use case.
- [ ] Proves one or two concepts (e.g. grounded answer, schema check, blocked attack, eval with threshold).

## Consistency
- [ ] Project deck, pitch, one-pager and prototype tell the same story.
- [ ] Numbers, names and IDs match across all deliverables.

## Peer challenge questions
1. Why AI here, why this approach (GenAI or task-specific model), and which simpler alternative was rejected?
2. Which assumption, if wrong, breaks the whole design?
3. Is the human review meaningful, or merely ceremonial?
4. What happens when the system is wrong, and would anyone notice?
5. What changes when use grows from 50 cases to 50,000, and does the cost still pay off?
