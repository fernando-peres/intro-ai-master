# Bots, Assistants, and Workflows

## In one sentence

Bots, assistants, and AI workflows differ mainly in how they interact, who controls the process, and how much of the path is predefined.

## Comparison

| Pattern | Main role | Process control | Typical example |
| --- | --- | --- | --- |
| Bot | Respond within a narrow conversation | Script, rules, or routing | FAQ chatbot |
| Assistant / copilot | Help a person complete work | Human directs and approves | Drafting or research support |
| AI workflow | Perform AI steps inside a defined process | Code or workflow defines sequence | Extract, validate, route, and draft |

## Executive mental model

```text
Bot:        request -> bounded response
Assistant:  human <-> AI support -> human action
Workflow:   fixed stages + AI at selected stages
```

A workflow can use an LLM without giving the LLM control over the whole process. This often provides more predictability than an agent for stable, repeatable work.

## Why executives should care

Organizations frequently label every conversational system an "agent." Choosing the right pattern affects cost, reliability, speed, user responsibility, and governance. Greater autonomy should solve a real need, not serve as a status symbol.

## Questions to ask

- Is the process known in advance?
- Who decides the next step: code, a person, or the model?
- Does the use case need conversation, assistance, orchestration, or action?
- Would a deterministic workflow be safer and easier to operate?

## Related concepts

[Agents](agents-agentic-systems.md), [Autonomy](autonomy-human-oversight.md), [AI harness](ai-harness.md)

## Sources

- [Anthropic - building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [Microsoft - generative orchestration](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/generative-orchestration)
- [Building Effective AI Agents - PDF](https://resources.anthropic.com/hubfs/Building%20Effective%20AI%20Agents-%20Architecture%20Patterns%20and%20Implementation%20Frameworks.pdf)

