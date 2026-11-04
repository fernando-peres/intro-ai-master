# Guardrails

## In one sentence

Guardrails are layered technical, procedural, and organizational controls that constrain AI behavior, detect unsafe conditions, and limit the consequences of failure.

## Executive mental model

```text
Prevent -> Detect -> Intervene -> Recover -> Learn
```

No single guardrail makes a system safe. Effective control uses layers before, during, and after model execution.

## Examples

- approved-use and prohibited-use policies;
- authentication and least-privilege permissions;
- input filtering and prompt-injection defenses;
- structured output schemas and deterministic validation;
- retrieval restricted to authorized sources;
- tool limits, rate limits, budgets, and transaction ceilings;
- human approval for consequential actions;
- content or safety classifiers;
- monitoring, incident response, rollback, and shutdown; and
- user training and feedback channels.

## Common misconception

**"The model provider has safety filters, so our application is safe."**

Provider controls address only part of the system. The deploying institution must control its data, workflow, permissions, integrations, users, impacts, and operational response.

## Questions to ask

- Which failure is each control meant to prevent or contain?
- Can the guardrail itself fail or be bypassed?
- Are controls tested under adversarial and realistic conditions?
- What residual risk remains, and who accepts it?
- Can the institution stop the system safely?

## Related concepts

[Evaluation](evaluation.md), [Autonomy](autonomy-human-oversight.md), [Risk and governance](risk-governance.md)

## Sources

- [NIST Generative AI Profile - PDF](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)
- [NIST AI RMF Playbook](https://airc.nist.gov/airmf-resources/playbook/)
- [EU AI Act - official overview](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)

