# Prompts and Instructions

## In one sentence

A prompt is the input used to guide a generative model; instructions specify the task, role, constraints, context, and expected output.

## Executive mental model

```text
Good task definition
+ relevant context
+ clear constraints
+ representative examples
+ output format
-> better probability of useful behavior
```

Prompts can come from users, application developers, policies, retrieved content, and prior messages. These sources may conflict, which makes instruction hierarchy and security important.

## Why executives should care

Prompting makes experimentation accessible, but production quality does not come from a secret phrase. Reliable systems combine clear instructions with governed context, tools, evaluation, permissions, workflow design, and monitoring.

Prompts are also operational assets. They should be versioned, tested, reviewed, and changed under appropriate controls.

## Questions to ask

- Who can change system instructions?
- Are prompts and versions included in evaluation and incident records?
- Can untrusted document or user content override instructions?
- Do examples reflect real and difficult cases?
- Is the desired output structured enough for the next workflow step?

## Related concepts

[Context engineering](context-engineering.md), [Guardrails](guardrails.md), [Evaluation](evaluation.md)

## Sources

- [Anthropic - effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Google People + AI Guidebook](https://pair.withgoogle.com/guidebook-v2/chapters)
- [NIST Generative AI Profile - PDF](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)

