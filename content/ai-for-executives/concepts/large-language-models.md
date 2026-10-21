# Large Language Models

## In one sentence

A large language model (LLM) is a model, commonly based on the Transformer architecture, trained to estimate and generate sequences of tokens at large scale.

## Executive mental model

```text
Input tokens + context
       -> model estimates likely next token
       -> repeats the process
       -> coherent response
```

Predicting tokens at scale creates surprisingly general capabilities because language contains patterns about concepts, tasks, code, and relationships. It does not turn the model into a verified database.

## What an LLM is not

- A database or search engine.
- Automatically connected to current information.
- An institution's knowledge base.
- Deterministic software.
- An agent unless a system gives it goals, tools, state, and an execution loop.

## Why executives should care

LLMs are general-purpose components. The surrounding application determines which context they receive, what data they can access, what actions they may take, how outputs are evaluated, and who remains accountable.

## Questions to ask

- Which task-specific evidence shows the selected LLM is suitable?
- What information enters its context?
- Which languages and user populations have been tested?
- Can a smaller or specialized model meet the need at lower cost or risk?
- How can the institution switch models later?

## Related concepts

[Tokens and context windows](tokens-context-windows.md), [Transformers](transformers-attention.md), [AI systems and harnesses](ai-harness.md)

## Sources

- [Google - What is a large language model?](https://developers.google.com/machine-learning/crash-course/llm/transformers)
- [Google Machine Learning Glossary](https://developers.google.com/machine-learning/glossary)
- [Stanford foundation model report - PDF](https://crfm.stanford.edu/assets/report.pdf)

