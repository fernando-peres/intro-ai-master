# Probabilistic Outputs and Limitations

## In one sentence

Generative models produce likely outputs rather than executing a fixed rule, so fluent, confident, and useful responses can coexist with inconsistency and error.

## Executive mental model

```text
Same request
   -> distribution of plausible outputs
   -> one generated response

Plausible does not imply factual, authorized, fair, or safe.
```

## Important limitations

- **Hallucination:** unsupported or fabricated content.
- **Freshness:** training does not provide live information.
- **Context:** the model sees only what the system supplies within constraints.
- **Reasoning:** a convincing explanation may contain logical or numerical errors.
- **Consistency:** small input changes may alter the output.
- **Scope:** capability on one benchmark or demo may not transfer to the institution's cases.
- **Security:** instructions and connected tools create new attack surfaces.

## Why executives should care

Probabilistic systems require a different assurance approach from traditional deterministic software. Testing must use distributions of realistic cases, thresholds, failure analysis, production monitoring, and human intervention proportionate to impact.

## Questions to ask

- Which errors are tolerable, and which are not?
- What evidence establishes performance in our deployment setting?
- Can errors be detected before they affect a person or system?
- What fallback exists when confidence or evidence is insufficient?
- How will behavior changes after model updates be detected?

## Related concepts

[Evaluation](evaluation.md), [Guardrails](guardrails.md), [Human oversight](autonomy-human-oversight.md)

## Sources

- [NIST Generative AI Profile - PDF](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)
- [Stanford foundation model report - PDF](https://crfm.stanford.edu/assets/report.pdf)
- [Google People + AI Guidebook - errors and graceful failure](https://pair.withgoogle.com/guidebook-v2/chapters)

