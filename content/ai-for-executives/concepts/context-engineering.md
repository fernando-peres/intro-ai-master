# Context Engineering

## In one sentence

Context engineering is the design and continual curation of the information, instructions, examples, tools, state, and history made available to a model for a task.

## Prompting versus context engineering

```text
Prompt engineering:
How should we ask?

Context engineering:
What should the model know, see, use, and remember right now?
```

Context may include system instructions, user identity, conversation history, retrieved policies, live records, tool definitions, permissions, examples, and intermediate results.

## Why executives should care

Institutional differentiation often comes less from owning a foundation model and more from supplying the right context at the right time. Context also carries the most sensitive data and can become a source of leakage, manipulation, overload, and incorrect behavior.

More context is not always better. The aim is the smallest high-signal set that enables the task while respecting security and cost.

## Questions to ask

- Which context is necessary for this specific decision?
- Is each item current, authorized, relevant, and traceable?
- Can untrusted content inject instructions?
- What is stored, summarized, discarded, or retrieved later?
- How is context quality included in evaluations?

## Related concepts

[Prompts](prompts-instructions.md), [RAG](retrieval-augmented-generation.md), [Memory](memory-ai-brain.md), [Tools](tools-apis-actions.md)

## Sources

- [Anthropic - effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Anthropic - building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [Building Effective AI Agents - PDF](https://resources.anthropic.com/hubfs/Building%20Effective%20AI%20Agents-%20Architecture%20Patterns%20and%20Implementation%20Frameworks.pdf)

