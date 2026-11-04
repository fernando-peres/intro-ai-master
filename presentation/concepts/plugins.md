# Plugins

## In one sentence

A plugin is an installable extension bundle that adds capabilities or configuration to an AI application, potentially including skills, commands, agents, hooks, tools, connectors, or language services.

## Executive mental model

```text
Plugin package
  |- skills and instructions
  |- commands and workflows
  |- agents
  |- hooks or event handlers
  |- tool/MCP server connections
  |- configuration and metadata
  `- update and distribution mechanism
```

Unlike the Agent Skills format, "plugin" is not one universal technical standard. Its contents, permissions, isolation, and installation model depend on the host platform.

## Why executives should care

Plugins make capability reusable and easy to distribute, but they expand the software and AI supply chain. Installing one may introduce executable code, new tools, remote services, data flows, automatic hooks, or instructions that influence agent behavior.

## Governance controls

- approved marketplace or internal registry;
- verified publisher, ownership, license, and provenance;
- manifest of components, permissions, data flows, and dependencies;
- security and privacy review proportional to capability;
- version pinning, controlled updates, and change notes;
- testing before institutional rollout;
- inventory of installations and affected users; and
- disable, rollback, uninstall, and incident-response procedures.

## Questions to ask

- What exactly does the plugin install?
- Which tools, systems, files, network services, and data can it access?
- Can it execute automatically through hooks or background processes?
- Who maintains it and how are updates reviewed?
- What telemetry or institutional data leaves the environment?
- Can it be disabled and removed without losing institutional data or workflows?

## Related concepts

[Skills](skills.md), [Commands](commands.md), [Tools](tools-apis-actions.md), [Build, buy, or partner](build-buy-partner.md), [Risk and governance](risk-governance.md)

## Sources

- [Claude Code - plugins overview as one concrete implementation](https://code.claude.com/docs/en/plugins)
- [Agent Skills specification](https://agentskills.io/specification)
- [Building Effective AI Agents - PDF](https://resources.anthropic.com/hubfs/Building%20Effective%20AI%20Agents-%20Architecture%20Patterns%20and%20Implementation%20Frameworks.pdf)

