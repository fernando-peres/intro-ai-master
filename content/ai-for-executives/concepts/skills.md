# Agent Skills

## In one sentence

An agent skill is a reusable package of instructions, procedural knowledge, references, scripts, and assets that teaches an agent how and when to perform a specialized task.

## Executive mental model

```text
Model       = general capability
Tool        = interface for reading or acting
Skill       = reusable method for accomplishing a task
Command     = explicit invocation or session control
Plugin      = installable distribution bundle
```

## Open Agent Skills pattern

The Agent Skills open format uses a directory containing a required `SKILL.md` file and optional resources:

```text
skill-name/
  SKILL.md        metadata + operating instructions
  scripts/        executable helpers
  references/     detailed domain knowledge
  assets/         templates and other resources
```

Skills use progressive disclosure: the agent first sees a short name and description, loads the full instructions when relevant, and reads supporting resources only as needed. This limits context usage while making specialist procedures reusable.

## Institutional uses

- procurement review using approved criteria;
- preparation of a board paper in the institution's format;
- regulatory or policy analysis;
- incident investigation procedure;
- data-quality assessment; and
- creation of a standard presentation or report.

## Governance concerns

A skill can influence tool use and may include executable code. Treat it as governed software and institutional procedure: establish provenance, ownership, versioning, permissions, evaluation, security review, change approval, and retirement.

## Questions to ask

- What task and triggering conditions does the skill cover?
- Is its procedure approved by the process owner?
- Which tools, data, network access, and execution permissions does it require?
- How is output quality evaluated across representative cases?
- Can third-party instructions or scripts be trusted and updated safely?
- Who owns the skill when policy or systems change?

## Related concepts

[Commands](commands.md), [Plugins](plugins.md), [Tools](tools-apis-actions.md), [AI brain](memory-ai-brain.md), [Agents](agents-agentic-systems.md)

## Sources

- [Agent Skills - official overview](https://agentskills.io/home)
- [Agent Skills - format specification](https://agentskills.io/specification)
- [Anthropic - complete guide to building skills - PDF](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf)

