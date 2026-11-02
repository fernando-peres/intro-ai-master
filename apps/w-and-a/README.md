# w-and-a: workflows and agents, in action

A Streamlit app for Unit 05 of deck 06, "Orchestrators: Workflows and Agents". The same customer-support question is answered five ways, one per tab: **Chatbot**, **Prompt → model**, **Workflow**, **Agent** and **Agentic system**. Each answer shows its steps folded underneath: reasoning summaries, routing, tool calls and results, checks and handoffs. The colours match the slides.

The data belongs to Pebble & Pine, an invented online home-goods shop, so a correct answer has to come from a tool.

## Install

```bash
# from the repo root
uv sync --all-packages --all-groups
```

Live runs read `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`, default `gpt-5.4-mini`) from the repo-root `.env`. Without a key the app stays usable: the three preset questions replay recorded runs, marked **Recorded run**.

## Run

```bash
uv run w-and-a            # http://localhost:8502
uv run w-and-a-record     # re-record the offline runs (needs a key; billed)
```

It is also listed in `uv run all-apps`.

## Layout

| Path | What |
|---|---|
| `src/w_and_a/engine/` | Free of Streamlit: `events` (Event, Trace, Run), `data` (the invented shop), `tools`, `llm` (OpenAI Responses API), `modes` (one runner per tab), `replay` |
| `src/w_and_a/recordings/` | Recorded runs per tab, for offline use |
| `src/w_and_a/ui/` | Theme and HTML rendering of the events |
| `src/w_and_a/app.py` | Tabs, preset questions, chat input, live status |
| `docs/` | The spec (`README.md`) and the prompt the app was built from (`build-prompt.md`) |

## Test

```bash
uv run pytest apps/w-and-a
```

The tests drive every runner with a scripted fake model, so they need no key and no network.
