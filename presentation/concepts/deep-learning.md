# Deep Learning

## In one sentence

Deep learning is a branch of machine learning that uses neural networks with many layers to learn complex representations from large amounts of data.

## Executive mental model

```text
Raw input
  -> layer learns simple patterns
  -> later layers combine them into richer patterns
  -> output
```

For an image, early layers may respond to edges while later layers represent shapes or objects. For language, learned representations can capture relationships among tokens, syntax, topics, and context.

## Why it matters

Deep learning enabled major advances in computer vision, speech, language, and generative AI. It can reduce manual feature engineering, but usually requires substantial data, computation, specialist skills, and evaluation.

Scale brings capability and concentration risk. Institutions may depend on a small number of model providers, specialized hardware suppliers, and cloud platforms.

## What it is not

- It is not a digital copy of the human brain.
- More layers or parameters do not automatically create business value.
- The learned internal representations are not always easy to explain.

## Questions to ask

- Does this problem require deep learning, or would a simpler method work?
- Is the relevant training data available and permitted?
- What are the compute, energy, latency, and operating costs?
- How will performance be explained and challenged in this use case?

## Related concepts

[Machine learning](machine-learning.md), [Foundation models](foundation-models.md), [Transformers and attention](transformers-attention.md)

## Sources

- [Deep Learning book - online edition](https://www.deeplearningbook.org/)
- [Google Machine Learning Glossary](https://developers.google.com/machine-learning/glossary)
- [Stanford foundation model report - PDF](https://crfm.stanford.edu/assets/report.pdf)

