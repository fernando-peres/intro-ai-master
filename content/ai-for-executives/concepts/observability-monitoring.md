# Observability and Monitoring

## In one sentence

Monitoring tracks known indicators, while observability provides enough evidence to understand why an AI system behaved as it did and to investigate unexpected failures.

## Executive mental model

```text
Inputs -> context -> model -> tools -> human -> action -> outcome
   \        \         \       \        \        \       \
                 logs, metrics, traces, feedback, incidents
```

Traditional uptime is insufficient. An AI service can be available while producing degraded, unsafe, expensive, or ignored outputs.

## What to observe

- system and model versions;
- prompts, retrieved sources, and tool calls where lawful;
- quality and safety measures;
- latency, failures, retries, and availability;
- token, infrastructure, and tool cost;
- user adoption, overrides, corrections, and appeals;
- data or behavior drift;
- incidents and near misses; and
- business outcomes.

Logging must respect privacy, security, retention, and minimization obligations.

## Questions to ask

- Which indicators provide early warning before harm or value loss?
- Can a specific output and action be reconstructed?
- Who receives an alert and what must they do?
- Which changes trigger re-evaluation or rollback?
- Are monitoring costs included in the business case?

## Related concepts

[Evaluation](evaluation.md), [AI harness](ai-harness.md), [AI lifecycle](ai-initiative-lifecycle.md)

## Sources

- [NIST AI RMF Core - production monitoring](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/)
- [OECD accountability principle](https://oecd.ai/en/dashboards/ai-principles/P9)
- [NIST AI RMF 1.0 - PDF](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf)

