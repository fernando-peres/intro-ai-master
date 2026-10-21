# Ontologies

## In one sentence

An ontology is a formal, shared model of a domain that defines concepts, categories, relationships, and sometimes logical constraints so people and systems interpret information consistently.

## Executive mental model

```text
Ontology:  what kinds of things exist and what relationships mean
Graph:     particular things and relationships observed or asserted
Documents: source material containing evidence and context
```

Example:

```text
Concepts:     Customer, Contract, Product, Incident
Relations:    Customer signs Contract
              Contract covers Product
              Incident affects Product
Constraints:  every Contract has an effective date and accountable owner
```

## Taxonomy, ontology, and knowledge graph

| Structure | Purpose |
| --- | --- |
| Taxonomy | Organizes concepts into categories or hierarchies |
| Ontology | Defines concepts, relationships, meaning, and constraints |
| Knowledge graph | Represents specific entities and relationships, often using an ontology |

An ontology can guide GraphRAG, but GraphRAG does not require a fully formal ontology. Some systems let an LLM discover entity types and relationships from text; this is faster but may produce inconsistent or unstable semantics.

## Why executives should care

Different departments often use the same word differently or different words for the same thing. An ontology can improve interoperability, analytics, retrieval, data governance, and explainability. It also requires sustained domain ownership; it is not merely an IT schema.

## Questions to ask

- Which cross-functional decisions suffer from inconsistent definitions?
- Who owns the meaning of each critical concept and relationship?
- Can an existing industry ontology or standard be reused?
- How are disagreements, versions, and local exceptions governed?
- Does the value justify the modeling and maintenance effort?
- How will generated graph facts be validated against the ontology and sources?

## Related concepts

[GraphRAG](graph-rag.md), [Documents and knowledge bases](documents-knowledge-bases.md), [AI brain](memory-ai-brain.md), [Risk and governance](risk-governance.md)

## Sources

- [W3C OWL 2 Web Ontology Language Primer](https://www.w3.org/TR/owl-primer/)
- [W3C OWL 2 Primer - PDF](https://www.w3.org/2012/pdf/REC-owl2-primer-20121211.pdf)
- [Microsoft GraphRAG knowledge model](https://microsoft.github.io/graphrag/index/default_dataflow/)

