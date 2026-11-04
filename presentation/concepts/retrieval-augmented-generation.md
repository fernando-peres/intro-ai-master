# Retrieval-Augmented Generation (RAG)

## In one sentence

RAG retrieves relevant external information at inference time and places it in the model's context so the generated response can be grounded in that information.

## Executive mental model

```text
User question
      -> search approved sources
      -> retrieve relevant passages
      -> add passages to model context
      -> generate answer with evidence/citations
```

RAG addresses the fact that a base model does not inherently know an institution's current, proprietary knowledge.

## Typical pipeline

```text
Sources -> parse -> split -> embed/index -> retrieve -> rerank
                                               |
Question --------------------------------------+
                                               -> model -> answer
```

## What RAG can and cannot do

RAG can improve freshness, traceability, and grounding. It does not guarantee truth. The system can retrieve the wrong passage, miss the right one, use obsolete content, violate permissions, or generate an answer not supported by the retrieved evidence.

## RAG family

| Pattern | What changes | Best fit |
| --- | --- | --- |
| Standard RAG | A predefined search retrieves passages for one generation step | Direct questions against a known source or index |
| [Agentic RAG](agentic-rag.md) | An agent plans queries, selects sources, evaluates evidence, and may retrieve repeatedly | Complex, multi-source, or multi-step questions |
| [GraphRAG](graph-rag.md) | Retrieval uses entities, relationships, communities, and graph structure | Questions requiring connections, paths, or corpus-wide themes |

Agentic RAG concerns **retrieval orchestration**. GraphRAG concerns **knowledge representation and retrieval structure**. They can be combined: an agent may decide when and how to query a knowledge graph.

## Questions to ask

- Which sources are approved and authoritative?
- Are user permissions enforced during retrieval?
- What proportion of real questions retrieve sufficient evidence?
- Must the answer cite sources or refuse when evidence is absent?
- How are retrieval and generation evaluated separately?

## Related concepts

[Knowledge bases](documents-knowledge-bases.md), [Embeddings](embeddings.md), [Agentic RAG](agentic-rag.md), [GraphRAG](graph-rag.md), [Context engineering](context-engineering.md)

## Sources

- [Retrieval-Augmented Generation paper](https://arxiv.org/abs/2005.11401)
- [Retrieval-Augmented Generation paper - PDF](https://arxiv.org/pdf/2005.11401)
- [Anthropic - context retrieval and agentic search](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
