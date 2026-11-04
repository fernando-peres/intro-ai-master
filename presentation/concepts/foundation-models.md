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


---

Notes for explain better

# Foundation Models

https://deepchecks.com/exploring-different-types-foundational-models-ai/

Foundation Model (FM) is the broader category, while LLMs, VLMs, and other model families can be specific types of foundation models.
- LLM (Large Language Model): Focuses on language understanding and generation. Example: Llama.
- VLM (Vision-Language Model): Combines visual and language understanding. Example: CLIP.
- Image Generation Model: Generates images. Example: Stable Diffusion.
- Speech Model: Processes or generates speech. Example: Whisper.

Also, these categories can overlap: a model can be both an LLM and a VLM.
In short: Foundation Model describes the model's general-purpose role; LLM, VLM, etc., describe its capabilities or modalities.

The distinction is about general-purpose capabilities vs. specialization.
A model can be an LLM or VLM without necessarily being a foundation model if it is trained or specialized for a narrow task and is not broadly adaptable.
Example: LLM
Imagine two language models:
1. Llama (Foundation Model + LLM)
- Pretrained on large, diverse datasets.
- Can summarize, translate, write code, answer questions, etc.
- Can be adapted to many different applications.
2. A specialized medical LLM (LLM, but not necessarily a Foundation Model)
- Fine-tuned exclusively to classify medical reports into predefined categories.
- Designed to perform one specific task.
- May have limited general-purpose capabilities.
However, there is an important nuance: fine-tuning a foundation model for a narrow task does not automatically mean it stops being a foundation model. Its underlying architecture and pretrained capabilities still come from a foundation model.
A clearer counterexample
Consider a language model trained from scratch on a narrow dataset of customer support tickets, exclusively to predict ticket categories.
It might qualify as a language model, but it would generally not be considered a foundation model because it lacks broad pretraining and adaptability.
It also might not qualify as a large language model, depending on its size.
The key distinction
Term	Describes
Foundation Model	Broad pretraining and adaptability
LLM	Large-scale language modeling
VLM	Modeling relationships between vision and language
Fine-tuned Model	A model adapted for a particular task
Bottom line: Most modern LLMs, including GPT, Claude, and Llama, are foundation models. The distinction becomes relevant when discussing smaller, narrowly trained models or highly specialized systems.
For an introductory AI course, it's accurate and simpler to teach LLMs and VLMs as types of foundation models, while mentioning that the categories are not mathematically exclusive.