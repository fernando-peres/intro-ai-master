# Generative AI

## In one sentence

Generative AI creates new content - such as text, images, audio, video, or code - by learning patterns and representations from existing data.

## Executive mental model

```text
Foundation model
     + instructions
     + context
     + user input
     -> generated output
```

Generative AI shifts software interaction from specifying every rule toward expressing intent in language, examples, and context.

## What enabled GenAI

GenAI emerged from several advances reinforcing one another rather than from a single breakthrough:

1. **[Deep learning](deep-learning.md):** multi-layer neural networks became capable of learning complex patterns directly from large datasets.
2. **[Embeddings and learned representations](embeddings.md):** models learned numerical representations of words, images, and other data that capture useful relationships and meaning.
3. **[Transformer architecture and attention](transformers-attention.md):** Transformers made it practical to model long-range relationships and train language models efficiently at large scale.
4. **Self-supervised pretraining:** models could learn from vast amounts of largely unlabelled text, images, audio, and code by predicting missing or subsequent elements.
5. **More data, compute, and specialized hardware:** internet-scale datasets, GPUs, TPUs, cloud infrastructure, and distributed training supported much larger models.
6. **Scaling and [foundation models](foundation-models.md):** increasing model size, data, and computation produced broadly capable models that could be reused across many tasks.
7. **Better generative methods:** autoregressive models advanced text and code generation, while diffusion models substantially improved image, audio, and video generation.
8. **Instruction tuning and human feedback:** fine-tuning models on instructions and preferences made them more useful, conversational, and aligned with user intent.
9. **Accessible interfaces and application infrastructure:** chat interfaces, APIs, [retrieval](retrieval-augmented-generation.md), vector databases, and open-source tools made these capabilities easier to adopt and integrate.

Together, these changes moved generative models from specialized research systems to general-purpose platforms for creating and transforming content.

## What changed

One model can support many tasks: summarize, classify, extract, translate, draft, compare, explain, or generate code. This generality lowers the cost of experimentation and creates natural-language interfaces to information and software.

## Core limitations

- Outputs are probabilistic.
- Fluency does not guarantee truth.
- The base model does not inherently know current or proprietary facts.
- Model capability does not provide system access or permission to act.
- Performance varies by task, language, population, and context.

## Why executives should care

GenAI expands which knowledge-work activities can be assisted, but a compelling demonstration is only evidence of possibility. Institutional value requires a reliable workflow, approved data, user adoption, evaluation, controls, and sustainable economics.

## Questions to ask

- Which generative capability changes the workflow?
- Which outputs require factual grounding or human approval?
- What happens when the generated answer is plausible but wrong?
- Why GenAI instead of deterministic automation or traditional ML?

## Related concepts

[Foundation models](foundation-models.md), [Probabilistic outputs](probabilistic-outputs-limitations.md), [Demo to production](demo-prototype-production.md)

## Sources

- [NIST Generative AI Profile - PDF](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)
- [Google - What is machine learning?](https://developers.google.com/machine-learning/intro-to-ml/what-is-ml)
- [Stanford foundation model report](https://crfm.stanford.edu/report)
