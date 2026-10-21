# Models, Training, and Inference

## In one sentence

A model is a learned mathematical structure; training creates or adapts it, and inference uses it to produce an output for a new input.

## Executive mental model

```text
TRAINING                              INFERENCE

Data + objective                     New input + context
      -> learning process                  -> trained model
      -> model parameters                  -> output
```

Training is usually computationally intensive and occasional. Inference occurs whenever the deployed model handles a request. Many organizations do not train a foundation model; they consume one and design the surrounding system.

## Why executives should care

The distinction clarifies cost, ownership, data use, and vendor claims:

- Training data affects what a model can generally do and what biases it may inherit.
- Inference data is the live information supplied when the model is used.
- Fine-tuning adapts model behavior; it does not automatically give reliable access to changing institutional facts.
- Retrieval supplies current knowledge at inference time without retraining the model.

## Questions to ask

- Are we training, fine-tuning, or only consuming a model?
- Which data is used at each stage, and under what rights?
- Where does inference occur and where is input retained?
- What does each inference cost at expected volume?
- Which model changes require re-evaluation?

## Example

A general language model may be trained by a provider. A hospital application then performs inference using an approved prompt and retrieved policies. The hospital is still responsible for the application and workflow it deploys.

## Related concepts

[Foundation models](foundation-models.md), [RAG](retrieval-augmented-generation.md), [AI economics](ai-economics-roi.md)

## Sources

- [Google Machine Learning Glossary](https://developers.google.com/machine-learning/glossary)
- [Google - supervised learning and inference](https://developers.google.com/machine-learning/intro-to-ml/supervised)
- [Stanford foundation model report - PDF](https://crfm.stanford.edu/assets/report.pdf)

