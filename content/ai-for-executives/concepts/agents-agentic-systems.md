# Agents and Agentic Systems

## In one sentence

An AI agent uses a model to choose and execute steps, often with tools and memory, in pursuit of a goal; an agentic system is the larger environment that enables and controls that behavior.

## Executive mental model

```text
Goal
 -> observe context
 -> choose next step
 -> use tool or produce output
 -> inspect result
 -> continue, stop, or escalate
```

In a workflow, predefined code largely controls the sequence. In an agent, the model dynamically decides more of the sequence and tool use.

## Components

- model and instructions;
- goals and stopping conditions;
- context, knowledge, and memory;
- tools and permissions;
- planning or execution loop;
- evaluation and guardrails;
- human approval and escalation; and
- logs, monitoring, and recovery.

## When agents fit

Agents can help when the task is open-ended, the route cannot be fully predefined, feedback is available, actions can be checked, and the value justifies added latency, cost, and risk.

Use a simpler workflow when steps are stable, exact, high-stakes, or easily encoded.

## Questions to ask

- Why does the model need to choose the process dynamically?
- What tools, data, and actions are permitted?
- What are the time, spend, and step limits?
- How does the agent know it is finished?
- Can it recover from errors and ask for help?
- Is a multi-agent design actually necessary?

## Related concepts

[Tools](tools-apis-actions.md), [Memory](memory-ai-brain.md), [Autonomy](autonomy-human-oversight.md), [AI harness](ai-harness.md)

## Sources

- [Anthropic - building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [Microsoft - AI agent adoption guidance](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ai-agents/)
- [Building Effective AI Agents - PDF](https://resources.anthropic.com/hubfs/Building%20Effective%20AI%20Agents-%20Architecture%20Patterns%20and%20Implementation%20Frameworks.pdf)

