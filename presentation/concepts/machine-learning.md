# Machine Learning

## In one sentence

Machine learning is a way of creating software that learns patterns from data so it can make predictions or generate outputs without every rule being explicitly programmed.

## Executive mental model

```text
Examples + desired outcomes
          -> training
          -> learned model
          -> new input
          -> prediction
```

Traditional software begins with rules written by people. Machine learning begins with examples, an objective, and a learning process that estimates useful patterns.

## Common forms

- **Supervised learning:** learns from labeled examples, such as known fraud/non-fraud cases.
- **Unsupervised learning:** finds structure without predefined labels, such as customer clusters.
- **Reinforcement learning:** learns behavior through feedback or rewards.
- **Self-supervised learning:** creates learning signals from the data itself; important in foundation models.

## Why executives should care

ML is often preferable to generative AI when the central need is a stable prediction, score, forecast, ranking, or classification. A credit-risk score and a policy-writing assistant are both AI, but they require very different systems and controls.

## Questions to ask

- What pattern is the model meant to learn?
- Which past outcome is used as the target or label?
- Is the historical data relevant to the future setting?
- What errors matter most: false positives or false negatives?
- How will changing behavior or data affect performance?

## Example

A maintenance model can learn from sensor readings and past failures to estimate which equipment is likely to fail. It predicts an outcome; it does not need to generate natural-language content.

## Related concepts

[Deep learning](deep-learning.md), [Models, training, and inference](models-training-inference.md), [Evaluation](evaluation.md)

## Sources

- [Google - What is machine learning?](https://developers.google.com/machine-learning/intro-to-ml/what-is-ml)
- [Google Machine Learning Glossary](https://developers.google.com/machine-learning/glossary)
- [NIST AI Risk Management Framework 1.0 - PDF](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf)

