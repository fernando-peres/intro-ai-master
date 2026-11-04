# blocks: the interactive notes, in one app

A Streamlit app that serves the interactive HTML notes, one per building block of a GenAI system: tools, context engineering, MCP, guardrails, evals, observability and experiments. The home page shows one card per block; the sidebar (drag its edge to resize, use its arrow to hide or show it) links to every block.

Every page is behind a login: user `student`, password `novaims`.

## Install

```bash
# from the repo root
uv sync --all-packages --all-groups
```

## Run

```bash
uv run blocks             # http://localhost:8503
uv run pytest apps/blocks/tests
```

It is also listed in `uv run all-apps`.

## Add or update a block

The HTML files live in `src/blocks/html/`, so Streamlit Cloud ships them with the app. Deck 06 links to them there too. To add one, drop `<slug>.html` in that folder and add a `Block` with the same slug to `src/blocks/blocks.py`; a test fails if the two disagree.

## Deploy to Streamlit Community Cloud

1. On [share.streamlit.io](https://share.streamlit.io): **Create app** → repo `fernando-peres/intro-ai-master`, branch `main`, main file path `apps/blocks/src/blocks/app.py`.
2. **Advanced settings**: Python 3.14. Optional secrets (top-level keys become environment variables):

   ```toml
   # APP_USER = "student"
   # APP_PASSWORD = "novaims"
   ```

Cloud runs from the repo root without installing the package: `app.py` puts `src/` on `sys.path`, the theme comes from the root `.streamlit/config.toml`, and dependencies from `src/blocks/requirements.txt`. Regenerate it after changing dependencies:

```bash
uv export --package blocks --no-dev --no-hashes --no-emit-workspace --no-header --no-annotate --frozen \
  -o apps/blocks/src/blocks/requirements.txt
```

## Layout

| Path | What |
|---|---|
| `src/blocks/html/` | The interactive notes, one self-contained HTML file per block |
| `src/blocks/blocks.py` | The registry: slug, title, icon and card summary of each block |
| `src/blocks/views/` | `home` (the cards) and `block` (one HTML file in an iframe) |
| `src/blocks/ui/` | Login gate, theme CSS and HTML fragments |
| `src/blocks/app.py` | Page config, login, sidebar navigation |
| `docs/` | The spec |
