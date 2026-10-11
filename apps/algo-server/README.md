# algo-server

FastAPI service on Python 3.14. Depends on the workspace package [`algo`](../../packages/algo).

## Run

```bash
# from the repo root
uv sync --all-packages

uv run fastapi dev apps/algo-server/src/algo_server/main.py   # http://localhost:8000
curl localhost:8000/health                                    # → {"status":"ok"}
```

Interactive API docs: http://localhost:8000/docs

Production-style run:

```bash
uv run fastapi run apps/algo-server/src/algo_server/main.py --port 8000
```

## Test

```bash
uv run pytest apps/algo-server
```

`tests/test_health.py` covers the endpoint. `tests/test_algo_integration.py` is the pattern for integration tests against `packages/*`.
