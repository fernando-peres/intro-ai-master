# Foundation Models

## In one sentence

A foundation model is trained on broad data at scale and can be adapted to many downstream tasks rather than built for only one narrow purpose.

## Executive mental model

```text
Broad data + large-scale training
             -> foundation model
             -> many applications
                |- writing assistant
                |- image analysis
                |- coding support
                |- knowledge search
                |- agents
```

The model is a foundation because many products can be built on it. It is not a complete product or institution-specific solution.

## Strategic implications

- **Leverage:** one model can support many use cases.
- **Reuse:** common capabilities can be shared across business units.
- **Dependency:** many applications may inherit one model's weaknesses or provider risk.
- **Adaptation:** prompting, retrieval, tools, fine-tuning, and workflow design specialize the capability.
- **Homogenization:** failures or changes in one foundation can propagate across dependent systems.

## Questions to ask

- Which provider and model dependencies are we accepting?
- Can models be substituted without redesigning the entire product?
- What information is available about training, limitations, evaluations, and incidents?
- Which parts of our advantage come from the model versus our data, workflow, and user experience?

## Related concepts

[Large language models](large-language-models.md), [AI harness](ai-harness.md), [Build, buy, or partner](build-buy-partner.md)

## Sources

- [Stanford CRFM - foundation model report](https://crfm.stanford.edu/report)
- [On the Opportunities and Risks of Foundation Models - PDF](https://crfm.stanford.edu/assets/report.pdf)
- [Stanford Foundation Model Transparency Index](https://crfm.stanford.edu/fmti/)

