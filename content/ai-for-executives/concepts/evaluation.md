# Evaluation

## In one sentence

Evaluation is the disciplined measurement of whether an AI system performs its intended task, creates the desired outcome, and remains within acceptable risk under realistic conditions.

## Executive mental model

```text
Business outcome
     ^
Workflow performance
     ^
AI system behavior
     ^
Model + retrieval + tools + people + controls
```

Model benchmark performance is only one layer. The institution must evaluate the complete sociotechnical system in its deployment setting.

## Evaluation layers

- **Capability:** can the model perform the task at all?
- **Component:** do retrieval, tools, prompts, and controls work?
- **End-to-end:** does the full workflow succeed?
- **Human factors:** can users understand, verify, and intervene?
- **Risk:** are safety, fairness, privacy, and security thresholds met?
- **Business:** does the outcome improve relative to a baseline or comparison?
- **Production:** does performance remain acceptable over time?

## Good evaluation practice

Use representative normal cases, difficult cases, edge cases, known failures, adversarial cases, and relevant groups. Set thresholds before seeing results. Analyze failures rather than reporting only an average.

## Questions to ask

- What does success mean, and who defined it?
- Is the test set representative of actual use?
- What is the baseline and counterfactual?
- Which threshold blocks deployment?
- How are incidents and feedback converted into new tests?
- Is any assessment independent of the delivery team?

## Related concepts

[Probabilistic outputs](probabilistic-outputs-limitations.md), [Observability](observability-monitoring.md), [AI economics](ai-economics-roi.md)

## Sources

- [NIST AI RMF Core - Measure](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/)
- [Google People + AI Guidebook](https://pair.withgoogle.com/guidebook-v2/chapters)
- [NIST Generative AI Profile - PDF](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)

