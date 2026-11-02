# Build prompt: `w-and-a`, workflows and agents in action

Use this prompt to build (or rebuild) the app. It is derived from Unit 05 of deck 06 (`presentation/06/index.html`, slides 65–81, "Orchestrators: Workflows and Agents").

---

Build a Streamlit app in `apps/w-and-a/` (Python package `w_and_a`, console script `w-and-a`, port 8502) that shows an executive audience the difference between five ways of using a language model. The idea to get across: **who decides the next step**: a person, your code (workflow) or the model (agent).

## Audience and tone
Executives and other non-technical people. Short labels, plain English, no jargon without a one-line explanation. Every screen should answer "who decided this step?"

## Layout
A left sidebar holds the header (title, subtitle, colour legend, Live/Offline status) and the navigation, in three groups: **Chat** (the five modes), **How it works** (one page per mode: explanation, a diagram in the colour code, the tools and limits, the exact instructions sent) and **Try the tools** (each tool's spec as the model sees it, a form to run it, the invented data). The right side is the selected page; a chat page is a plain chat of user/assistant turns with the input pinned at the bottom.

## The five modes (same question works in all five)
1. **Chatbot**, with a *Scripted flow* / *LLM* switch. Scripted: a fixed decision tree (menu, keywords, templates, an order lookup from a rule), with no model; it works without a key. LLM: keeps the chat history, has no tools. Either way it talks; it cannot reason over your systems.
2. **Prompt → model**: one shot, with no history and no tools. The person is the orchestrator.
3. **Workflow**: a path fixed in code: classify (model) → route (code) → tool call (code picks the tool) → draft (model) → rule check (code), with one revision if the check fails.
4. **Agent**: a model with all tools in a loop (think → act → observe). The model picks the tools and the order. Code enforces a step limit of 6.
5. **Agentic system**: a supervisor (lead) plans subtasks and hands each to one of two specialist agents with different tools. The lead writes the reply and an evaluator agent checks it against the findings, with one revision on FAIL.

## Tools (invented data: Pebble & Pine, an online home-goods shop that does not exist)
- `lookup_order(order_id)`: status, items, promised and expected dates, delay reason.
- `find_orders(query)`: orders matching items or a city, for when the id is unknown or wrong.
- `search_policies(query)`: the best-matching policy snippets (returns 2025 vs 2026, delivery delays, shipping, warranty).
- `get_weather(city)`: invented weather for today.
- `calculate(expression)`: safe arithmetic via the AST, never `eval`.

Because every fact is invented, a correct answer must come from a tool. The chatbot and the single prompt visibly can't know.

## Preset questions (buttons in every chat, and the Compare page)
Each question is the best fit for one mode and has a one-line takeaway:
1. "Write a short, friendly apology for a late delivery." (Prompt → model: no private data, so one call is enough)
2. "What's the status of order 1043?" (Workflow: known steps)
3. "Can I still return the lamp from order 1043, and who pays shipping?" (Agent: two lookups the path didn't plan)
4. "Where is order 1045? It's the wool throw going to Coimbra." (Agent: recovers when a step fails)
5. "Orders 1042 and 1044: where is each, any weather risk, and what will I be owed?" (Agent: one agent copes, and a team costs twice as much)

## What the chat shows
A chat-like UI (`st.chat_message`). Above each answer, every event is shown **collapsed** (`<details>`), with an icon, the actor and a colour:
reasoning summary, plan, route or rule fired, workflow step, tool call (name + arguments), tool result (JSON), check (pass/fail), handoff, specialist report and notes. A footer shows LLM calls, tool calls, tokens and seconds. While a run is in progress, the events stream live into a status box.

## Colour code (identical to the slides)
Model = deep green, your code / check = mint `#6ee7a0`, workflow = lime `#e6f57a`, agent = pink `#ff4fd8`, tool = dashed grey, person = white. A legend appears at the top of the page.

## LLM
OpenAI Responses API with function tools; chain turns with `previous_response_id`. Ask for reasoning summaries (`reasoning={"summary": "auto"}`) and drop the parameter if the model rejects it. Read `OPENAI_API_KEY` and `OPENAI_MODEL` (default `gpt-5.4-mini`) from the repo-root `.env`.

**Offline:** without a key, the preset buttons replay recorded runs (`recordings/<mode>.json`, made by `uv run w-and-a-record`), shown with a "Recorded run" badge. Free-text questions explain that a key is needed.

## Repo rules (AGENTS.md)
- Self-contained app: its own `pyproject.toml`, `README.md`, `docs/`, `tests/`. Register it in the root uv workspace, `testpaths` and the import-linter contract.
- Never import another app. Packages never import apps.
- Every timestamp is UTC `YYYY-MM-DD-HH-mm-ss`.
- Docstring budgets: module 10 lines, class 6, public function 5, private 3. Keep comments to constraints the reader can't infer.
- Add it to the all-apps TUI (`apps/all-apps/src/all_apps/services.py`) with health check `/_stcore/health`.

## Structure
- `engine/`: free of Streamlit. `events.py` (Event, Trace, Run), `data.py` (invented shop), `tools.py`, `llm.py` (LLM protocol + OpenAI), `modes.py` (one runner per mode), `replay.py`.
- `engine/scripted.py`: the rule-based chatbot.
- `views/`: `chat`, `notes`, `tools` pages; `notes/<mode>.md` holds the page text.
- `ui/`: theme CSS, HTML rendering of events (all text escaped), Graphviz diagrams.
- `app.py`: sidebar header and navigation.
- `record.py`: records the preset runs for offline use.

## Acceptance
- The engine is unit-tested with a scripted fake LLM: tools (including calculator safety), workflow routing and the check, the agent loop and its step limit, the agentic plan fallback, and the replay files load.
- `uv run ruff check`, `uv run pytest apps/w-and-a`, `uv run lint-imports` pass.
- An offline `AppTest` runs the app, the scripted chatbot across two turns, and a replayed preset.
- In every chat the same preset question gives visibly different steps. The workflow always takes the same path; the agent's path varies.
