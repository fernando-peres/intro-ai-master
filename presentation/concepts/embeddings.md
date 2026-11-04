# Embeddings

## In one sentence

An embedding represents an item such as a word, passage, image, product, or customer as a vector of numbers whose position captures learned relationships useful for a task.

## Executive intuition

Imagine a map where distance reflects meaning rather than geography:

```text
"annual leave policy"  near  "vacation rules"
"machine repair"       near  "equipment maintenance"
```

Items with related meaning can be close even when they do not share the same keywords. A search system can compare the embedding of a question with embeddings of document passages and retrieve nearby material.

## Common uses

- semantic search;
- retrieval for RAG;
- recommendations;
- clustering and duplicate detection;
- classification; and
- matching across languages or modalities.

## What embeddings are not

- They are not the original document or a human-readable explanation.
- Similarity does not prove factual relevance or authorization.
- A vector database is not automatically a governed knowledge base.
- Changing the embedding model may require reprocessing stored content.

## Questions to ask

- What is embedded: whole documents, sections, passages, images, or records?
- Which similarity measure and relevance threshold are used?
- Are permissions enforced before retrieval?
- How are new, changed, and deleted sources reflected?
- Has retrieval quality been evaluated on real queries and languages?

## Related concepts

[Documents and knowledge bases](documents-knowledge-bases.md), [RAG](retrieval-augmented-generation.md), [Context engineering](context-engineering.md)

## Sources

- [Google - embeddings](https://developers.google.com/machine-learning/crash-course/embeddings/obtaining-embeddings)
- [Google Machine Learning Glossary - embedding](https://developers.google.com/machine-learning/glossary)
- [Retrieval-Augmented Generation paper - PDF](https://arxiv.org/pdf/2005.11401)

