# Memory and the AI "Brain"

## In one sentence

AI memory is external state that a system stores and later returns to a model; the model itself should not be treated as an institution's persistent brain.

## Executive mental model

```text
Model                 = general learned capability
Current context       = working memory for this inference
Conversation history  = recent interaction state
External memory       = stored facts, notes, preferences, or progress
Knowledge base        = governed reference information
Ontology              = shared meaning, categories, and relationship rules
Systems of record     = authoritative transactions and entities
```

The word "brain" is a useful metaphor only if its limits are explicit. An enterprise AI system usually combines several memory types with distinct owners, retention rules, permissions, and reliability. Its "brain" is therefore an architecture, not one model or database.

```text
Institutional AI "brain"

Model capability
  + current context
  + governed knowledge and ontology
  + episodic/task memory
  + authoritative systems of record
  + skills and tools
  + evaluation, permissions, and oversight
```

## Memory patterns

- **Short-term:** recent messages or steps.
- **Episodic:** records of prior interactions or events.
- **Semantic:** stored facts or summaries.
- **Procedural:** instructions, policies, or reusable methods.
- **Task state:** goals, plans, completed work, and pending actions.

## Risks

Memory may preserve an error, sensitive information, malicious instruction, outdated preference, or unauthorized fact. Remembering more can conflict with privacy, minimization, deletion, and user expectations.

## Questions to ask

- What is remembered, why, for how long, and with whose consent?
- Which store is authoritative?
- Can users inspect, correct, or delete memory?
- How is memory separated between users, cases, and security domains?
- What happens when memory conflicts with a current system of record?

## Related concepts

[Documents and knowledge bases](documents-knowledge-bases.md), [Ontologies](ontologies.md), [Context windows](tokens-context-windows.md), [Skills](skills.md), [Agents](agents-agentic-systems.md)

## Sources

- [Anthropic - context engineering and agentic memory](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Microsoft Agent Framework - memory and persistence](https://learn.microsoft.com/en-us/agent-framework/get-started/)
- [Building Effective AI Agents - PDF](https://resources.anthropic.com/hubfs/Building%20Effective%20AI%20Agents-%20Architecture%20Patterns%20and%20Implementation%20Frameworks.pdf)
