# Meta prompt: interactive HTML companion for a lesson notebook

Reusable instructions distilled from building `notebooks/llm_tools_01.html`. Copy the block below into a new session, fill in the `{…}` fields, and adapt the "Topic mapping" section.

---

```text
Create an interactive HTML companion page for the notebook {NOTEBOOK_PATH}
(topic: {TOPIC}, e.g. guardrails / evals / RAG / MCP / skills).

GOAL
A visual teaching page I can use live in class to explain the notebook's concepts.
It must show WITHOUT vs WITH {THE TECHNIQUE} for every example, with diagrams and
step-by-step animations. It's not a copy of the notebook.

SOURCE OF TRUTH
- All questions, answers, traces, tool/LLM calls and code come from the notebook's
  own cells and SAVED OUTPUTS. Never invent results. If an example has no outputs,
  show an honest "Not run yet" state, plus an "Expected flow" animation with generic
  labels and no values.
- Find cells by CONTENT (a unique snippet, scoped to the example's section),
  never by index, so adding cells doesn't break the page.
- Never hard-code run-dependent values (numbers, answers) in the HTML or the
  markdown. Read them from the outputs. When notebook markdown quotes a figure from
  a run, check it against the saved output and fix any mismatch.
- If you can't run the notebook (no API access in the session), add the cells
  without outputs, tell me, and I'll run it locally and push. Then rebuild.

DESIGN
- Use the "Graphite Console" tokens from harness-sigmma.pen (Inter + IBM Plex Mono,
  zinc neutrals, violet primary #3A3263 / #6D5BD0, semantic tints:
  fail = WITHOUT, pass = WITH, done/blue = tool or external step, warn = caveat).
- Light/dark toggle (saved), sticky top bar with section nav, a global
  "Show all code" switch, responsive (stack below ~980px), prefers-reduced-motion.
- Single self-contained HTML file: no build step at view time, no API calls,
  no JS libraries (Google Fonts with system fallback).

PAGE STRUCTURE
1. Hero: title, one-line idea, chips linking to sections, a tiny without/with teaser.
2. Concepts: what the technique is (split diagram: who decides what), and why it's
   needed (gap cards that link to the example that fills each gap).
3. The core loop/pipeline as an animated sequence diagram (Play / Back / Step / Reset)
   with a caption per step and the matching code lines highlighted beside it.
4. Core code cells, collapsed, with a copy button and light syntax highlighting.
5. Examples as tabs. Each example has:
   a. gap tag, short intro, the question/input
   b. "Run it step by step" PLAYER (see below)
   c. collapsed "Compare: without vs with" EXPANDER: left = without, right = with;
      each side only a static sequence diagram + 3–4 very short bullets
   d. one example-specific visual when it teaches something (e.g. a bar chart of
      wrong vs exact, a two-run decision comparison, a "how the steps connect" card)
   e. the code cells (collapsed), then the notebook's Explain bullets
6. A "when NOT to use it" case, if the notebook has one.
7. Summary table + takeaways cards.

PLAYER (per example)
- Sequence diagram lanes: Model | Your code | one lane per tool/component
  (labelled "Tool 1: name" + its backend), so the flow reads
  model → tool 1 → model → tool 2 → model → answer.
- Scenes: "Without" and "With" (plus extra runs if the notebook has them).
  Play runs ONLY the selected scene. Each scene keeps its own step, so I can
  switch back and forth while explaining. Each scene shows an "n/N" counter.
- Caption per step: title, one-sentence explanation, the real payload on that
  arrow (JSON highlighted). The code pane shows the loop lines, or the actual
  tool function while it runs.
- Keyboard: ← → step, Space play/pause, 1–3 switch scene (only while hovering
  over or focused on the player).

BUILD
- Keep a template + a stdlib-only build script in the repo
  (scripts/<name>_html/template.html, build.py, README.md) that injects the
  notebook's cells and saved outputs into the template:
  python scripts/<name>_html/build.py <notebook> <template> <output.html>

WORKFLOW
- Plan first, then implement. Ask only when a choice is genuinely mine
  (theme, data source, whether I'll run the notebook).
- Verify with headless Chromium (Playwright): every tab renders, step counts
  match the saved trace, scenes keep separate state, no console errors,
  light/dark/mobile screenshots. Review the screenshots.
- Commit to the working branch, push, then merge into main (fast-forward)
  when I ask.
```

---

## Topic mapping (adapt the player lanes and the without/with contrast)

| Topic | WITHOUT | WITH | Lanes / hops to animate | Example-specific visual |
|---|---|---|---|---|
| **Tools** (done) | model answers from memory | model calls functions | Model, code, Tool 1, Tool 2; function_call → run → output → answer | chain card (call 1 result → call 2 argument), wrong-vs-exact bars |
| **Guardrails** | unsafe input/output passes straight through | input check → model → output check | User, input guard, model, output guard; show *blocked* hops in red, with the reason in the caption | before/after table of prompts: allowed vs blocked, with the rule that fired |
| **Evals** | "looks fine to me" on one sample | dataset → model → grader/judge → score | Dataset, model, grader (rule or LLM judge), report; one hop per test case | score table / pass-rate bars per variant; judge rationale per case |
| **RAG** | model answers without the documents (or hallucinates) | query → embed → retrieve top-k → model with context | User, embedder, vector store, model; show retrieved chunks and scores in the caption | retrieved chunks with similarity bars; citation highlighting in the answer |
| **MCP** | tools hard-wired in the app | client discovers tools from an MCP server | Model, host/client, MCP server, external system; list_tools → call_tool → result | discovered tool list; the same tool used by two clients |
| **Skills** | one long system prompt | skill selected and loaded on demand | Model, skill index, skill files, tools | which skill loaded and why; prompt size before/after |

## Lessons learned (avoid repeating these)

- An example without saved outputs must not break the page. Show "Not run yet" plus the expected flow.
- Cell indices shift whenever cells are added, so look cells up by content, scoped to the section.
- Run outputs change every run (temperatures, model figures). Read them from outputs and re-check any figure the markdown quotes.
- "Side by side" means a compact, collapsed comparison: two diagrams and short bullets. Not two heavy columns of cards.
- Play must not run into the next scene. Each scene keeps its own state.
- Check that a commit actually contains the executed notebook before rebuilding.
