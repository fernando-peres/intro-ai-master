# w-and-a: workflows and agents, in action

A Streamlit app for Unit 05 of deck 06, "Orchestrators: Workflows and Agents". The left sidebar holds the header (legend, Live/Offline status) and four groups of pages:

- **Compare**: one example question answered by Prompt → model, Workflow, Agent and Agentic system side by side, from recorded runs. It shows the takeaway, each answer, and the path each one took.
- **Chat**: the same customer-support question answered five ways: **Chatbot** (with a *Scripted flow* / *LLM* switch), **Prompt → model**, **Workflow**, **Agent** and **Agentic system**. Each reply shows the answer first, then the path it took, and every step (reasoning summaries, rules, routing, tool calls, checks, handoffs) folded below.
- **How it works**: one page per mode, with the explanation, a diagram in the slide colours, and the exact instructions the mode sends.
- **Try the tools**: what the model sees for each tool, a form to run it, and the invented data behind it.

The data belongs to Pebble & Pine, an invented online home-goods shop, so a correct answer has to come from a tool.

## Install

```bash
# from the repo root
uv sync --all-packages --all-groups
```

Live runs read `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`, default `gpt-5.4-mini`) from the repo-root `.env`. Without a key the app stays usable: the scripted chatbot and the tools page need no model, and the five preset questions replay recorded runs, marked **Recorded run**.

Every page is behind a login: user `student`, password `novaims`.

## Run

```bash
uv run w-and-a            # http://localhost:8502
uv run w-and-a-record     # re-record the offline runs (needs a key; billed)
```

It is also listed in `uv run all-apps`.

## Deploy to Streamlit Community Cloud

1. On [share.streamlit.io](https://share.streamlit.io): **Create app** → repo `fernando-peres/intro-ai-master`, branch `main`, main file path `apps/w-and-a/src/w_and_a/app.py`.
2. **Advanced settings**: Python 3.14. Secrets (top-level keys become environment variables):

   ```toml
   OPENAI_API_KEY = "sk-..."   # optional: without it the app runs offline
   # APP_USER = "student"      # optional: override the login
   # APP_PASSWORD = "novaims"
   ```

Cloud runs from the repo root without installing the package: `app.py` puts `src/` on `sys.path`, the theme comes from the root `.streamlit/config.toml`, and dependencies from `src/w_and_a/requirements.txt`, which takes precedence over the root `uv.lock`. Regenerate it after changing dependencies:

```bash
uv export --package w-and-a --no-dev --no-hashes --no-emit-workspace --no-header --no-annotate --frozen \
  -o apps/w-and-a/src/w_and_a/requirements.txt
```

## Layout

| Path | What |
|---|---|
| `src/w_and_a/engine/` | Free of Streamlit: `events` (Event, Trace, Run), `data` (the invented shop), `tools`, `llm` (OpenAI Responses API), `modes` (one runner per mode), `scripted` (the rule-based chatbot), `replay` |
| `src/w_and_a/recordings/` | Recorded runs per mode, for offline use |
| `src/w_and_a/views/` | The pages: `compare`, `chat`, `notes`, `tools`, and `reply` (one answer, shared by both) |
| `src/w_and_a/notes/` | The text of each "how it works" page |
| `src/w_and_a/ui/` | Theme, HTML rendering of the events, Graphviz diagrams |
| `src/w_and_a/app.py` | Sidebar header and navigation |
| `docs/` | The spec (`README.md`) and the prompt the app was built from (`build-prompt.md`) |

## Test

```bash
uv run pytest apps/w-and-a
```

The tests drive every runner with a scripted fake model, and the pages through Streamlit's `AppTest` offline, so they need no key and no network.
