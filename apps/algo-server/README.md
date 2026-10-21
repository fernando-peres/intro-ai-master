# algo-server

FastAPI service on Python 3.14. Depends on the workspace packages [`algo`](../../packages/algo) and [`genai`](../../packages/genai), which serves the Generative AI labs in `ai-intro`.

## Run

```bash
# from the repo root
uv sync --all-packages

uv run fastapi dev apps/algo-server/src/algo_server/main.py   # http://localhost:8000
curl localhost:8000/health                                    # → {"status":"ok"}
```

Interactive API docs: http://localhost:8000/docs

## Generative AI endpoints

| Endpoint | Model | What it does |
|---|---|---|
| `GET /api/health` | — | Names the base model and the assistant model (`null` without an API key). |
| `POST /api/genai/complete` | GPT-2 | Continues a prompt; every step returns its token, probability and top-k candidates. |
| `POST /api/genai/few-shot` | GPT-2 or assistant | Builds a zero-/few-shot prompt and answers it. With `labels`, GPT-2 scores each label's probability. |
| `POST /api/genai/chat` | assistant | Sends a conversation (system, user and assistant messages) and returns the reply. |

Settings come from the repo-root `.env` (variables already in the environment win):

| Variable | Default | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | — | Required by the assistant; without it those calls return 503 and GPT-2 still works. |
| `OPENAI_MODEL` | `gpt-5.4-mini` | The OpenAI chat model used as the assistant. |

The first GPT-2 request downloads its weights (about 550 MB) to `~/.cache/huggingface`; the server's first answer waits for it.

Production-style run:

```bash
uv run fastapi run apps/algo-server/src/algo_server/main.py --port 8000
```

## Test

```bash
uv run pytest apps/algo-server
```

`tests/test_health.py` covers the health endpoint. `tests/test_genai_routes.py` covers the Generative AI endpoints with a fake GPT-2 and a fake assistant, so it needs neither the model download nor an API key. `tests/test_algo_integration.py` is the pattern for integration tests against `packages/*`.
