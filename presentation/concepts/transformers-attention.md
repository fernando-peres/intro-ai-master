# Transformers and Attention

## In one sentence

A Transformer is a neural-network architecture that uses attention mechanisms to weigh relationships among elements in a sequence, enabling effective parallel training and context-sensitive representations.

## Executive intuition

Consider the word "bank" in two sentences:

- "The bank approved the loan."
- "We sat on the river bank."

Attention helps the model use surrounding words to construct a different representation of "bank" in each context.

```text
Tokens
  -> embeddings
  -> attention: which other tokens matter here?
  -> repeated transformations
  -> contextual representations
  -> output tokens
```

## Why it matters

Transformers became the architecture behind many modern language and multimodal models. Their importance is practical: they made large-scale pretraining and flexible reuse across tasks highly effective.

Executives do not need to understand the equations. They should understand that the model interprets inputs relationally, has a finite context, and generates from learned statistical representations rather than consulting a verified fact table.

## Questions to ask

- Is this architectural detail material to our decision, or is task performance what matters?
- What context length, latency, and cost does the use case require?
- How has the full system been evaluated on our cases?

## Related concepts

[Embeddings](embeddings.md), [Tokens](tokens-context-windows.md), [Large language models](large-language-models.md)

## Sources

- [Attention Is All You Need - paper](https://arxiv.org/abs/1706.03762)
- [Attention Is All You Need - PDF](https://arxiv.org/pdf/1706.03762)
- [Google Machine Learning Glossary - Transformer and attention](https://developers.google.com/machine-learning/glossary)

