---
name: create-spec
description: Write a feature spec from docs/templates/spec.md, asking the user about open implementation questions first. Run with /create-spec.
argument-hint: [project] [feature]
disable-model-invocation: true
---

# create-spec

Writes **one** spec, then stops. It does not implement anything.

Arguments: $ARGUMENTS

## Steps

1. Resolve the project (`apps/<name>` or `packages/<name>`) and the feature from the arguments. If either is missing, ask the user. If the feature spans projects, use the app that leads it; a package spec must not reference apps.
2. Read `docs/templates/spec.md`, the project's `README.md` and `docs/`, and the code the feature touches.
3. List the open questions about the implementation. Answer what the code and docs can answer, and do not ask about those.
4. Ask the user the rest with `AskUserQuestion`: behavior, edge cases, scope, data and contracts, verification. Recommend an option where there is one. Repeat until nothing that would change the spec is left open.
5. Write `<project>/docs/<feature-slug>.md` from the template with `Status: Draft`. If that file exists, ask before overwriting it.
6. Report the path and any assumptions you made. Do not implement or commit.

Follow `AGENTS.md`: English unless asked otherwise, UTC `YYYY-MM-DD-HH-mm-ss` dates, no ADR references in the spec. If the spec implies a major decision, ask the user whether to record it as an ADR.
