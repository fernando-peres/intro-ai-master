# algo

Python 3.14 package. Packages never import from `apps/*`.

## Use

```bash
# from the repo root
uv sync --all-packages

uv run algo              # → Hello, world!
uv run python -m algo    # same, as a module
```

From an app, declare it as a workspace dependency in the app's `pyproject.toml`:

```toml
[project]
dependencies = ["algo"]

[tool.uv.sources]
algo = { workspace = true }
```

```python
import algo

print(algo.GREETING)
```

## Test

```bash
uv run pytest packages/algo
```
