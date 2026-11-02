# w-and-a: five ways to use a model

**Status:** Implemented
**Project:** `apps/w-and-a`
**Slides:** deck 06, Unit 05 (slides 65–81). The app is linked from "Workflows and agents · in action".

## Purpose

Show, on the same question, who decides each step in a GenAI system: a person (chatbot, single prompt), our code (workflow) or the model (agent, agentic system). The audience is executives, so each tab states this in one line and draws its flow in the unit's colours.

## Behavior

| Tab | Who decides | Tools | Steps |
|---|---|---|---|
| Chatbot | a person | none | one model call with the chat history |
| Prompt → model | a person | none | one model call, no history |
| Workflow | our code | chosen by code per route | classify (model) → route (code) → look up (tool) → draft (model) → rule check (code), with one revision on fail |
| Agent | the model | all four | tool loop (think → act → observe) chained with `previous_response_id`, stopped by code after 6 rounds |
| Agentic system | a lead agent | per specialist | lead plans 1–3 subtasks (JSON) → handoffs to the orders specialist (`lookup_order`, `get_weather`) or the policies specialist (`search_policies`, `calculate`), each a tool loop of up to 4 rounds → lead writes → reviewer agent returns PASS / FAIL, with one revision on FAIL |

- **Workflow routes:** `order` looks up the order id found by a regex. If the order is delayed it also searches the late-delivery policy, and the check requires the order id in the reply. `policy` searches with the customer's words. `price` has the model write an expression, then the calculator computes it, and the check requires the result. `other` makes no lookup. An unparseable plan in the agentic system falls back to both specialists on the whole question.
- **Events:** each run records `reasoning`, `plan`, `route`, `step`, `tool_call`, `tool_result`, `check`, `handoff`, `report` and `note` events, each with an actor, a UTC timestamp (`YYYY-MM-DD-HH-mm-ss`) and the seconds since the start. While a run is in progress they stream into a status box. Afterwards they are folded under the answer, with the counts of LLM calls, tool calls, tokens and seconds.
- **Offline:** without `OPENAI_API_KEY`, the preset questions replay `recordings/<mode>.json` and free text shows a warning. `uv run w-and-a-record` regenerates the recordings.

## Data

Pebble & Pine is invented (`engine/data.py`). Order 1042 is delayed by a storm in Porto. The returns policy changed from 14 to 30 days on 2026-01-01. Late deliveries over 3 days earn a 15% voucher, and the spring discount takes 15% off lamps.

## Colour code

The colours are the same as in `presentation/06/deck.css` (`.wa-*`): model = deep green, our code / checks = mint `#6ee7a0`, workflow = lime `#e6f57a`, agent = pink `#ff4fd8`, tool = dashed grey, person = white.
