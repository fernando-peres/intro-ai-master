# Modalities and Multimodal AI

## In one sentence

A modality is a type of information - such as text, image, audio, video, code, or structured data - and multimodal AI works across more than one type.

## Executive mental model

```text
INPUTS                    OUTPUTS
text   image              text   image
audio  video    -> AI ->  audio  video
code   tables             code   structured data
```

Multimodality matters because real workflows rarely consist of text alone. A field technician may combine a spoken description, a machine photograph, a manual, sensor values, and service history.

## Business opportunities

- transcribe and summarize meetings or calls;
- inspect images and explain anomalies;
- extract information from forms and diagrams;
- create accessible descriptions or translations;
- reason across text, images, and structured records; and
- generate text, visual, audio, or code outputs.

## Risks and design implications

Each modality has different quality measures, privacy concerns, manipulation risks, accessibility needs, storage costs, and failure modes. Performance in English text says little about performance on noisy Portuguese audio or specialized medical images.

## Questions to ask

- Which modalities exist in the real workflow?
- Which input is authoritative when sources conflict?
- Has quality been tested under realistic noise and conditions?
- Do voice, face, image, or video inputs introduce biometric or consent concerns?

## Related concepts

[AI capabilities](ai-capabilities.md), [Foundation models](foundation-models.md), [Evaluation](evaluation.md)

## Sources

- [Google Machine Learning Glossary](https://developers.google.com/machine-learning/glossary)
- [Stanford foundation model report](https://crfm.stanford.edu/report)
- [NIST Generative AI Profile - PDF](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)

