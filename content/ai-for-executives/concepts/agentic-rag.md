# Agentic RAG

## In one sentence

Agentic RAG gives an AI agent control over retrieval: it can decompose a question, select sources, issue multiple searches, inspect evidence, refine queries, and stop when it has enough context.

## Executive mental model

```text
Complex question
      -> agent plans what it needs to know
      -> chooses retrieval tool/source
      -> searches
      -> evaluates evidence
      -> searches again, changes source, or stops
      -> grounded answer with citations
```

Standard RAG follows a pipeline designed in advance. Agentic RAG makes retrieval an available tool and lets the model decide when and how to use it within defined limits.

## When it adds value

- a question must be decomposed into subquestions;
- evidence comes from several indexes, databases, documents, or APIs;
- later searches depend on earlier findings;
- the first search may be insufficient and needs refinement;
- source selection depends on user intent or intermediate evidence; or
- the system must compare, reconcile, or investigate information.

For a direct question against one reliable index, standard RAG is usually simpler, faster, cheaper, and easier to evaluate.

## New risks and costs

- search loops increase latency and token/tool cost;
- the agent may choose the wrong source or stop too early;
- intermediate evidence can redirect the investigation incorrectly;
- permissions must hold across every selected source;
- a plausible synthesis can obscure missing or contradictory evidence; and
- greater flexibility makes testing and reproducibility harder.

## Controls

- define tools and source boundaries clearly;
- enforce identity and permissions at every retrieval call;
- limit steps, time, and spend;
- require citations and preserve retrieval traces;
- define evidence-sufficiency and stopping criteria;
- test source selection, query planning, retrieval, and final answers separately; and
- escalate when sources conflict or evidence remains weak.

## Questions to ask

- Why is one retrieval step insufficient?
- Which sources may the agent select and in what order?
- How does it judge evidence quality and completeness?
- What are the iteration, latency, and budget limits?
- Can reviewers reconstruct every query and source used?
- What baseline proves the extra complexity improves outcomes?

## Related concepts

[RAG](retrieval-augmented-generation.md), [GraphRAG](graph-rag.md), [Agents](agents-agentic-systems.md), [Tools](tools-apis-actions.md), [Evaluation](evaluation.md)

## Sources

- [Microsoft - develop an agentic RAG solution](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/rag/rag-agentic)
- [Microsoft Foundry - RAG and agentic retrieval](https://learn.microsoft.com/en-us/azure/foundry/concepts/retrieval-augmented-generation)
- [Microsoft Research - AgenticRAG for enterprise knowledge bases](https://www.microsoft.com/en-us/research/publication/agenticrag-agentic-retrieval-for-enterprise-knowledge-bases/)
- [Agentic RAG survey - paper](https://arxiv.org/abs/2501.09136)

