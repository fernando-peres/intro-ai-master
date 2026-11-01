# intro-ai-master

Introduction to AI: a polyglot monorepo (Python, React).

## Setup

Requires [uv](https://docs.astral.sh/uv/), Python 3.14, Node 24+, pnpm 11, and Docker for the databases.

```bash
uv sync --all-packages
pnpm install
```

For the AI labs and assistant in `ai-intro`, put `OPENAI_API_KEY` in the repo-root `.env`.

## Run

```bash
uv run all-apps
```

This opens a terminal dashboard. Press `space` to run or stop the selected service, `a` to start all and `q` to quit. Starting a service also starts what it needs.

| Project | What it is | Port | Docs |
|---|---|---|---|
| `apps/ai-intro` | React course app | 5173 | [README](apps/ai-intro/README.md) |
| `apps/harness-content` | React app: Reusable Artifacts Studio | 5174 | [README](apps/harness-content/README.md) |
| `apps/algo-server` | FastAPI service behind `ai-intro` | 8000 | [README](apps/algo-server/README.md) |
| `apps/harness-content-api` | FastAPI service behind `harness-content` | 8001 | [README](apps/harness-content-api/README.md) |
| PostgreSQL | `harness-content-api` database | 5433 | |
| `apps/all-apps` | The terminal dashboard | | [README](apps/all-apps/README.md) |
| `packages/algo` | Python package | | [README](packages/algo/README.md) |
| `packages/genai` | Python package: GPT-2, prompts, OpenAI assistant | | [README](packages/genai/README.md) |

Each README covers running that project on its own. The first GPT-2 and embeddings requests download the models (about 1.1 GB in total).

## Test and lint

```bash
uv run pytest -m "not slow"   # Python tests; drop the filter to include real-model tests
uv run ruff check .
uv run lint-imports           # packages/* never import apps/*

pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

## Add a project

Every project lives in `apps/<name>/` or `packages/<name>/` with its own manifest, `README.md`, `docs/` and tests. Apps may depend on packages, but packages never depend on apps.

- **Python:** use a src layout and add the project to `[tool.uv.workspace].members` in the root `pyproject.toml`, along with the pytest, ruff and import-linter settings there. An app depends on a package with `[tool.uv.sources] <pkg> = { workspace = true }`.
- **JS/TS:** `pnpm-workspace.yaml` already picks up the folder. An app depends on a package with `"<pkg>": "workspace:*"`.

Agent and contributor rules are in [AGENTS.MD](AGENTS.MD); design docs are in [docs/](docs/).
