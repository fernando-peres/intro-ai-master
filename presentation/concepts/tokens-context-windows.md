# Tokens and Context Windows

## In one sentence

Tokens are the units a model processes, while the context window is the limited amount of tokenized information available to the model during one inference.

## Executive mental model

```text
Instructions
+ user request
+ conversation
+ retrieved documents
+ tool results
+ desired output
= tokens competing for a finite context window
```

A token may be a word, part of a word, punctuation, or another unit such as an image patch. Token counts affect capacity, latency, and cost.

## Why executives should care

- A large context window does not guarantee that every included detail will be used correctly.
- Sending every document may reduce relevance, increase cost, and expose unnecessary data.
- Long conversations and agent tasks need context management, retrieval, summaries, or external memory.
- Different languages may consume different numbers of tokens for equivalent content.

## Common misconception

**"The model supports a million tokens, so it can remember our whole organization."**

A context window is closer to temporary working material than a governed institutional memory. It is finite, request-specific, and needs careful curation.

## Questions to ask

- Which information truly needs to be in context?
- What is the cost and latency at realistic input and output lengths?
- What happens when the context limit is reached?
- Can sensitive content be minimized before it reaches the model?

## Related concepts

[Context engineering](context-engineering.md), [Memory](memory-ai-brain.md), [RAG](retrieval-augmented-generation.md)

## Sources

- [Google Machine Learning Glossary - token and tokenizer](https://developers.google.com/machine-learning/glossary)
- [Anthropic - effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Stanford foundation model report - PDF](https://crfm.stanford.edu/assets/report.pdf)

