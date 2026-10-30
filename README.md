# intro-ai-master

Introduction to AI: a polyglot monorepo (Python, Node, React).

```
apps/                    deployable apps; may depend on packages/*
  algo-server/           FastAPI service (Python 3.14)
  ai-intro/              React app (Vite, pnpm)
  harness-content-api/   FastAPI + PostgreSQL service for the Reusable Artifacts Studio
packages/                reusable libraries; never depend on apps/*
  algo/                  Python 3.14 package
  genai/                 Python 3.14: GPT-2 base model, prompts, OpenAI assistant
pyproject.toml           uv workspace root (Python)
package.json             pnpm workspace root (JS/TS) + pnpm-workspace.yaml
```

## Rules

- **Dependencies point one way: `apps/*` → `packages/*`.** A package never imports or depends on an app. For Python this is enforced by the import-linter contract in `pyproject.toml` (`uv run lint-imports`).
- Every app and package has its own `pyproject.toml` or `package.json`, its own `README.md` and its own tests. Apps may add integration tests against the packages they use.

## Setup

Requires [uv](https://docs.astral.sh/uv/), Python 3.14, Node 24+ and pnpm 11.

```bash
uv sync --all-packages   # Python: all workspace members into .venv
pnpm install             # JS/TS: all workspace projects
```

## Common commands

```bash
uv run pytest            # all Python tests
uv run ruff check .      # Python lint
uv run lint-imports      # packages/* never import apps/*

pnpm test                # all JS/TS tests
pnpm lint
pnpm build
```

## Adding a project

- **Python:** create `apps/<name>/` or `packages/<name>/` with a `pyproject.toml` (src layout), and add it to `[tool.uv.workspace].members` in the root `pyproject.toml`. For a new package, also add it to `root_packages` and the import-linter contract. An app depends on a package with `[tool.uv.sources] <pkg> = { workspace = true }`.
- **JS/TS:** create the folder with a `package.json`; `pnpm-workspace.yaml` already picks up `apps/*` and `packages/*`. An app depends on a package with `"<pkg>": "workspace:*"`.

## Generative AI labs

The Generative AI chapter of `ai-intro` calls real models through `algo-server`: GPT-2, run locally, and an OpenAI chat model. Put `OPENAI_API_KEY` in the repo-root `.env`, then run both:

```bash
uv run fastapi dev apps/algo-server/src/algo_server/main.py   # :8000 (first run downloads GPT-2, ~550 MB)
pnpm --filter ai-intro dev                                    # :5173, proxies /api to :8000
```

The Embeddings lab (chapter 05) runs two more real models: GloVe 6B 300d (~480 MB) and all-MiniLM-L6-v2 (~90 MB), downloaded on first use. With GPT-2 the server holds about 1.1 GB in memory. Set `HF_HOME` to move the Hugging Face cache.

Per-project docs: [algo-server](apps/algo-server/README.md) · [ai-intro](apps/ai-intro/README.md) · [harness-content-api](apps/harness-content-api/README.md) · [algo](packages/algo/README.md) · [genai](packages/genai/README.md)
