# w-and-a: five ways to use a model

**Status:** Implemented
**Project:** `apps/w-and-a`
**Slides:** deck 06, Unit 05 (slides 65–82). The app is linked from "Workflows and agents · in action".

## Purpose

Show, on the same question, who decides each step in a GenAI system: a person (chatbot, single prompt), our code (scripted chatbot, workflow) or the model (agent, agentic system). The audience is executives, so each chat states this in one line and draws its flow in the unit's colours.

## Access

Every page sits behind a login page (`ui/auth.py`); deep links land on it too. Credentials default to `student` / `novaims` and are overridden by `APP_USER` / `APP_PASSWORD` (environment or Streamlit Cloud secrets). The session stays logged in until the browser tab closes or **Log out** (sidebar bottom) is pressed.

## Pages

The sidebar shows the header (title, legend, Live/Offline status), then hand-drawn navigation (`st.navigation` is hidden so the header can sit above it):

- **Compare** (`/compare`, the default page): pick an example question, then see its takeaway and four recorded runs side by side: Prompt → model, Workflow, Agent and Agentic system. Each run shows its answer, the path it took and its cost.
- **Chat** (`/chat-<mode>`): the five example questions as buttons, and the conversation. Each reply shows the answer first, then the path-taken strip, the "What to watch" line, and every step folded in an expander. The conversation as user/assistant turns with the input pinned at the bottom. Each mode keeps its own conversation.
- **How it works** (`/notes-<mode>`): `notes/<mode>.md`, a Graphviz diagram (`ui/diagrams.py`), the tools the mode may call and its limits, and the exact instructions it sends (`engine.modes.PROMPTS`).
- **Try the tools** (`/tools`): each tool's spec as the model sees it, a form that calls `run_tool`, and the orders, policies and weather tables.

## Behavior

| Mode | Who decides | Tools | Steps |
|---|---|---|---|
| Chatbot · Scripted flow | our code | `lookup_order`, from a rule | a fixed decision tree (`engine/scripted.py`): rules tried in order, first match wins, replies from templates; no model, no key |
| Chatbot · LLM | a person | none | one model call with the chat history |
| Prompt → model | a person | none | one model call, no history |
| Workflow | our code | chosen by code per route | classify (model) → route (code) → look up (tool) → draft (model) → rule check (code), with one revision on fail |
| Agent | the model | all five | tool loop (think → act → observe) chained with `previous_response_id`, stopped by code after 6 rounds |
| Agentic system | a lead agent | per specialist | lead plans 1–3 ordered subtasks (JSON) → sequential handoffs, each specialist receiving the earlier reports, to the orders specialist (`lookup_order`, `find_orders`, `get_weather`) or the policies specialist (`search_policies`, `calculate`), each a tool loop of up to 4 rounds → lead writes → reviewer agent, which sees the customer's message, returns PASS / FAIL, with one revision on FAIL |

- **Workflow routes:** `order` looks up the order id found by a regex. If the order is delayed it also searches the late-delivery policy, and the check requires the order id in the reply. `policy` searches with the customer's words. `price` has the model write an expression, then the calculator computes it, and the check requires the result. `other` makes no lookup. An unparseable plan in the agentic system falls back to both specialists on the whole question.
- **Events:** each run records `reasoning`, `plan`, `route`, `step`, `tool_call`, `tool_result`, `check`, `handoff`, `report` and `note` events, each with an actor, a UTC timestamp (`YYYY-MM-DD-HH-mm-ss`) and the seconds since the start. While a run is in progress they stream into a status box. Afterwards they are folded above the answer, with the counts of LLM calls, tool calls, tokens and seconds.
- **Scripted rules,** in order: waiting for an order id (the last reply asked for it) → an order id in the message (`10xx`, so years never match) → order words → returns words → talk to a person → greeting → fallback menu. A delayed order more than 3 days late gets the voucher line from a rule.
- **Offline:** the scripted chatbot and the tools page work without a key. Without `OPENAI_API_KEY`, the preset questions replay `recordings/<mode>.json` and free text shows a warning. `uv run w-and-a-record` regenerates the recordings.

## Presets

Five example questions (`engine/data.py`, `PRESETS`). Each one has a best fit, a one-line takeaway, and a "What to watch" line per chat. They were chosen so that the difference shows **in the answer**, not only in the hidden steps. A question about compensation was dropped because the workflow got the euro amount right by mental arithmetic.

| Question | Best fit | Takeaway |
|---|---|---|
| Write a short, friendly apology for a late delivery. | Prompt → model | No private data needed: one manual call is enough. |
| What's the status of order 1043? | Workflow | Known steps: a workflow is cheap and does the same thing every time. |
| Can I still return the lamp from order 1043, and who pays shipping? | Agent | It needs two lookups the path didn't plan: only the agent gets both. |
| Where is order 1045? It's the wool throw going to Coimbra. | Agent | A step fails: the agent changes course; the workflow just reports the error. |
| Orders 1042 and 1044: where is each, any weather risk, and what will I be owed? | Agent | Many parts: one agent copes. A team costs twice as much, and facts can slip in handoffs. |

No question is marked best for the agentic system. On this shop's data a single agent does at least as well for about half the tokens, which is the "start simple" lesson. The question sources are Anthropic's *Building effective agents* and OpenAI's *A practical guide to building agents*.

## Data

Pebble & Pine is invented (`engine/data.py`). Every model except Prompt → model is told today is 2026-11-02 (`TODAY`). Order 1042 is delayed by a storm in Porto (promised 2026-10-30, now 2026-11-05). Order 1043 was delivered on 2026-10-24 (€64). Order 1044 (wool throw, Coimbra) is processing; there is no 1045. The returns policy changed from 14 to 30 days on 2026-01-01. Late deliveries over 3 days earn a 15% voucher, and the spring discount takes 15% off lamps.

## Colour code

The colours are the same as in `presentation/06/deck.css` (`.wa-*`): model = deep green, our code / checks = mint `#6ee7a0`, workflow = lime `#e6f57a`, agent = pink `#ff4fd8`, tool = dashed grey, person = white.
