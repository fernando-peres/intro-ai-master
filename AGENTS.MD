# intro-ai monorepo — Agent Instructions

Introduction to AI: a polyglot monorepo. Apps live in `apps/`, reusable packages in `packages/`. Either can be Python (uv), Node or React (pnpm).

## Source of truth

| Location | What it is |
|---|---|
| `docs/` | Canonical, durable design documentation — kept up to date as the system evolves. |
| `docs/adr/` | The decision log for major, irreversible, system-wide architectural decisions **only** — see rule 3 for the bar. |
| `README.md` (root and per project) | How to install, run and test each app and package. |

## Non-negotiable rules

1. **Never create, modify, read, or delete anything under `.scratchpad/`**: It is for personal notes, not a working directory for agents.

2. **`docs/` is the source of truth**. (do not read `.scratchpad/` — it only has the user's general notes)

3. **ADRs are for major, irreversible, system-wide decisions only**: ADRs are for major, costly-to-reverse, system-wide decisions only. Create a new ADR in docs/adr/ and add its entry to docs/adr/README.md only when the decision materially affects the system architecture—for example, changing the primary datastore, replacing a core framework, redefining service or layer boundaries, or making another decision that would be expensive to reverse.

   - Keep the ADR log small and high-level. Routine implementation choices, refactoring, bug fixes, individual features, and local design decisions are not ADRs.

   - Before creating or saving an ADR, explicitly ask the user whether the decision should be recorded as an ADR. Do not create one automatically.

   - ADR references must remain confined to docs/adr/ and docs/adr/README.md. Do not add ADR numbers or references to source-code comments, other md files, docstrings, configuration files, or implementation documentation, as these references can become stale or misleading when ADRs are superseded, renumbered, or reorganized.

4. **Be succinct in comments and docstrings**: A docstring states the contract a caller must not violate — not an essay about how the code got this way. A comment that restates the code is noise; a comment that names a constraint the reader cannot infer earns its place.

   - The budget, counted in prose lines before the first `Args:` / `Returns:` / `Raises:` section: **module 10, class 6, public function 5, private function 3**, contiguous `#` block 3, `#:` attribute comment 2. Structured sections are exempt from the prose cap; each entry is ≤ 3 lines.

   - Going over the cap requires naming a *specific* concurrency invariant, format contract, or non-obvious negative. Nothing else buys the lines.

   - Never repeat a fact already stated by the type annotation, the function name, or the sibling `.md`.

5. **When a file needs more explanation than its docstring budget allows, write a sibling `.md`**: Create a Markdown file of the same name beside it — `cron.py` → `cron.md`, `registry.py` → `registry.md`. Same directory, same stem, no other spelling.

   - Split by audience: the `.py` docstring states the contract a **caller** must not violate; the `.md` holds definitions, the pattern, the alternatives considered, and worked examples. When both would say the same thing, the `.py` says it in one sentence and names the `.md` section.

   - Only when necessary. Most modules do not need one — do not create these speculatively.

   - A directory-wide `README.md` stays the right choice for documenting a folder rather than a single module.

6. **All dates are UTC, written `YYYY-MM-DD-HH-mm-ss`**: Every timestamp the repo writes — filenames, payloads, logs, pages — is UTC in that format. Never `datetime.now()` without `UTC`, never `isoformat()` or another spelling.

7. **`packages/*` never knows about `apps/*`**: Dependencies point one way — `apps/*` may import any `packages/*`; no `packages/*` may import, declare a dependency on, or reference an `apps/*` module, in any language. A type a package needs at its boundary is defined in the package, and the app maps to it.

   - Python: enforced by the `packages/* never import apps/*` import-linter contract in the root `pyproject.toml` (`uv run lint-imports`). Add every new Python package and app to that contract.

   - JS/TS: when the first package under `packages/` exists, forbid `apps/*` imports there with Biome `noRestrictedImports`.

8. **Each app and package is self-contained**: its own `pyproject.toml` or `package.json`, `README.md` and tests. Shared tooling lives at the root: the uv workspace (`pyproject.toml`, `uv.lock`) and the pnpm workspace (`package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`). Apps may add integration tests against the packages they use.

## Translation (pt-BR)

1. **Do not translate to Portuguese unless the request says so.** Write new docs, code, comments and UI copy in English. Translate only when the request explicitly asks (e.g. "translate to pt-br", "update the pt-br translation").

2. **Track translation state in frontmatter**: a source document that has a pt-BR copy declares `update` under `metadata`:

   ```yaml
   ---
   metadata:
     update: true   # or false
   ---
   ```

   - Set `update: true` when you change the English source of a document that has a pt-BR copy.
   - Set `update: false` once its pt-BR copy is brought up to date.
   - A translation/update request translates only files marked `update: true`, unless the user names specific files. Files without `metadata.update` are not translated.

## Skills

Reusable task-specific instructions are available under `.agents/skills/`

Before starting a non-trivial task, check whether a relevant skill exists and read it before implementing the change.

Use skills for specialized workflows or conventions rather than duplicating those instructions in this file.

## Repo layout

```
docs/           — design docs (architecture, system design, ADRs)
apps/           — algo-server (FastAPI, Python 3.14), ai-intro (React, Vite, pnpm)
packages/       — algo, genai (Python 3.14)
.agents/skills/ — reusable task-specific agent instructions
.scratchpad/    — personal notes; never read, modify or delete
```
