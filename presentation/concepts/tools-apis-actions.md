# Tools, APIs, and Actions

## In one sentence

Tools are controlled interfaces that let an AI system obtain information or perform actions through software, databases, and enterprise services.

## Executive mental model

```text
User intent
   -> model selects a permitted tool
   -> tool validates structured inputs
   -> API or system executes
   -> result returns to the model/workflow
   -> response, approval, or next action
```

A model may know how to describe a refund. A tool connected to an authorized order system may actually issue one. That transition changes the risk materially.

## Design principles

- Give each tool a clear, narrow purpose.
- Validate inputs outside the model.
- Apply user identity and least-privilege permissions.
- Require approval for high-impact or irreversible actions.
- Make actions idempotent or reversible where possible.
- Log requests, results, failures, and approvals.
- Rate-limit use and define timeouts and fallback behavior.

## Why executives should care

Tools convert language capability into operational power. The key decision is not merely whether an agent can call an API, but which actions it may take, within what limits, on whose authority, and with what evidence and recovery.

## Questions to ask

- Can the tool read, write, spend, communicate, or change rights?
- Which business rules are enforced deterministically?
- Does the model inherit the user's permissions?
- Which actions require confirmation or dual control?
- Can every action be traced and reversed?

## Related concepts

[Agents](agents-agentic-systems.md), [Autonomy](autonomy-human-oversight.md), [Guardrails](guardrails.md)

## Sources

- [Anthropic - writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents)
- [Microsoft - search and tool-use architectures](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/architecture/search-tool-use-architectures)
- [Building Effective AI Agents - PDF](https://resources.anthropic.com/hubfs/Building%20Effective%20AI%20Agents-%20Architecture%20Patterns%20and%20Implementation%20Frameworks.pdf)

