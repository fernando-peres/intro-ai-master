# Commands

## In one sentence

A command is an explicit user or system instruction that invokes a known operation, changes session behavior, or starts a predefined workflow.

## Executive mental model

```text
Command = "Do this operation now"
Skill   = "Here is how to perform this class of task"
Tool    = "Here is an interface the agent can call"
Agent   = "Choose and perform steps toward this goal"
```

Commands are often exposed through menus, buttons, or slash syntax such as `/review`, but the concept is interface-level and not tied to one product.

## Types of commands

- **Session control:** clear context, change mode, inspect status, or select a model.
- **Direct operation:** export, summarize, validate, or create a standard artifact.
- **Workflow invocation:** start a review or research procedure.
- **Skill invocation:** explicitly activate a reusable skill that might otherwise be selected automatically.
- **Administrative:** install, configure, authorize, or inspect extensions.

## Why executives should care

Commands make important behavior visible and repeatable. They can reduce ambiguity and give users deliberate control over consequential operations. However, a friendly command name may hide tools, data access, scripts, or external communication.

## Control principles

- make command scope and consequences clear;
- separate preview from execution for high-impact actions;
- validate arguments and permissions;
- log consequential commands and results;
- distinguish built-in, institutional, and third-party commands; and
- make cancellation and recovery available where practical.

## Questions to ask

- Does the command directly execute code or invoke an AI workflow?
- What data, tools, and permissions does it activate?
- Can the user preview the effect?
- Is the result deterministic, probabilistic, or mixed?
- Who may create, publish, update, or retire commands?

## Related concepts

[Skills](skills.md), [Plugins](plugins.md), [Tools](tools-apis-actions.md), [Human oversight](autonomy-human-oversight.md)

## Sources

- [Claude Code - commands reference as one concrete implementation](https://code.claude.com/docs/en/commands)
- [Agent Skills - official overview](https://agentskills.io/home)
- [Google People + AI workshop guide - PDF](https://pair.withgoogle.com/guidebook-v2/workshop/Guidebook-Workshop-Facilitator-Guide.pdf)

