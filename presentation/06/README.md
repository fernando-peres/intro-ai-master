# Presentation 06 — Build & Improving GenAI systems (harness deck)

A 79-page HTML deck built on the `class_06/` engine (same `deck.js` runtime, keys, TOC and HUD). No build step.

## Run

The slide 5 diagram loads Three.js code as ES modules, and browsers block those when a page is opened straight from disk (`file://`). Serve the repo instead. From the repo root:

```bash
just serve
```

Then open http://localhost:8000/presentation/06/. To use another port, run `just serve 8080`. Stop the server with `Ctrl+C`.

Without `just`, run the same thing directly from the repo root:

```bash
uv run python -m http.server 8000
```

Serve from the repo root, not from this folder: the deck loads fonts from `../fonts/`. Three.js and the handwriting font (Architects Daughter) load from CDNs. Without internet, the notes fall back to CMU Serif.

## Slides

| # | Slide | Template |
|---|---|---|
| 1 | Cover |  |
| 2 | Table of Contents | `layout-index` |
| 3 | Unit 1 · What is a harness? | `layout-unit-v2` |
| 4 | Unit 1 · One idea to keep | `layout-statement-dark` |
| 5 | Lesson · Harness overview | `layout-lesson` |
| 6 | Harness for GenAI systems | `layout-dark-1` |
| 7 | Model ≠ GenAI system | `layout-dark-1` |
| 8 | Components of a harness | `layout-dark-1` |
| 9 | Model, harness, context: three roles | `layout-dark-1` |
| 10 | Implemented harnesses · assistants | `layout-dark-1` |
| 11 | Implemented harnesses · coding and app building | `layout-dark-1` |
| 12 | Harness development frameworks | `doc · doc-dark-bg-1` |
| 13 | Implemented harnesses vs. frameworks | `doc · doc-dark-bg-1` |
| 14 | Unit 2 · The mindset for GenAI systems | `layout-unit-v2` |
| 15 | Unit 2 · One idea to keep | `layout-statement-dark` |
| 16 | Improving the performance of GenAI systems | `layout-dark-1` |
| 17 | Four dimensions of continuous improvement | `layout-dark-1` |
| 18 | An interconnected improvement system | `layout-dark-1` |
| 19 | Why model optimization alone is not enough | `layout-dark-1` |
| 20 | Where to invest: training vs. the system | `layout-dark-1` |
| 21 | The rising cost of training frontier models | `layout-dark-1` |
| 22 | Main takeaways · continuous improvement | `layout-dark-1` |
| 23 | Unit 3 · Context & context engineering | `layout-unit-v2` |
| 24 | Unit 3 · One idea to keep | `layout-statement-dark` |
| 25 | Lesson · Context | `layout-lesson` |
| 26 | What is context? | `layout-dark-1` |
| 27 | What is context engineering? | `layout-dark-1` |
| 28 | Prompt engineering and context engineering, side by side | `layout-dark-1` |
| 29 | Context engineering vs. prompt engineering | `layout-dark-1` |
| 30 | Context engineering in the harness | `layout-dark-1` |
| 31 | Building blocks of context | `doc · doc-dark-bg-1` |
| 32 | Main takeaways · context | `layout-dark-1` |
| 33 | The right information, at the right time | `layout-dark-1` |
| 34 | Lesson · RAG overview | `layout-lesson` |
| 35 | RAG · what it is and why | `layout-dark-1` |
| 36 | RAG · indexing and retrieval | `layout-dark-1` |
| 37 | RAG · indexing strategies | `layout-dark-1` |
| 38 | RAG · retrieval strategies | `layout-dark-1` |
| 39 | RAG · semantic search | `layout-dark-1` |
| 40 | RAG · metadata and hybrid search | `layout-dark-1` |
| 41 | RAG · in action (links to `apps/rag-in-action`) | `layout-dark-1` |
| 42 | RAG · other types | `layout-dark-1` |
| 43 | RAG · takeaways | `layout-dark-1` |
| 44 | Unit 4 · Tools and Integration | `layout-unit-v2` |
| 45 | Unit 4 · One idea to keep | `layout-statement-dark` |
| 46 | Four gaps of a frozen model | `layout-dark-1` |
| 47 | The tool loop | `layout-dark-1` |
| 48 | Descriptions are prompts | `layout-dark-1` |
| 49 | Five examples, one loop | `layout-dark-1` |
| 50 | Hands-on · llm_tools_01 | `doc · doc-dark-bg-1` |
| 51 | Tools · takeaways | `layout-dark-1` |
| 52 | Lesson · MCP overview | `layout-lesson` |
| 53 | From N × M to N + M | `layout-dark-1` |
| 54 | MCP · client and server | `layout-dark-1` |
| 55 | MCP · the moving parts | `layout-dark-1` |
| 56 | MCP · discovery is built in | `layout-dark-1` |
| 57 | MCP · least privilege in three layers | `layout-dark-1` |
| 58 | When to use MCP | `layout-dark-1` |
| 59 | Before you connect a server | `layout-dark-1` |
| 60 | MCP · takeaways | `layout-dark-1` |
| 61 | Alert · using third-party tools and MCP servers | `layout-alert` |
| 62 | Alert · building tools and MCP servers | `layout-alert` |
| 63 | Unit 6 · Guardrails and Evals | `layout-unit-v2` |
| 64 | Unit 6 · One idea to keep | `layout-statement-dark` |
| 65 | Lesson · Guardrails overview | `layout-lesson` |
| 66 | Guardrails · what and why | `layout-dark-1` |
| 67 | Guardrails · types | `layout-dark-1` |
| 68 | Guardrails · in action (links to `html/guardrails.html`) | `layout-dark-1` |
| 69 | Guardrails · accelerators | `doc · doc-dark-bg-1` |
| 70 | Guardrails · takeaways | `layout-dark-1` |
| 71 | Lesson · Evals overview | `layout-lesson` |
| 72 | Evals · what and why | `layout-dark-1` |
| 73 | Evals · types | `layout-dark-1` |
| 74 | Evals · in action (links to `html/evals.html`) | `layout-dark-1` |
| 75 | Evals · accelerators | `doc · doc-dark-bg-1` |
| 76 | Evals · takeaways | `layout-dark-1` |
| 77 | Next · Observability | `layout-statement-dark` |
| 78 | Unit 7 · Observability | `layout-unit-v2` |
| 79 | Unit 8 · Experiments | `layout-unit-v2` |

## Templates: what changes in each instance

- **Unit title** (`.stage.is-brand.layout-unit-v2` > `.unit-head`): `h1` (light part as text, key word in `<b>`), `.subtitle`, and `.covers` (one `<span>` per topic).
- **Statement** (`.stage.is-night` > `.layout-statement-dark`): `.label` ("One idea to keep"), `.statement` (`<em>` = mint), `.statement-source`. One per unit, right after the unit title.
- **Index** (`.stage.is-night.layout-index`): only the `<ol>` items.
- **Unit** (`.stage.is-brand.layout-unit-v2`): the title. Write the light part as plain text and the key word in `<b>`, for example `01. What is a <b>harness</b>?`.
- **Lesson** (`.stage.is-forest` > `.layout-lesson`): the title, which depth pill carries `.is-current` (Overview / Conceptual / Technical / Deep dive), and the `.objective` text.
- **Dark content 1** (`.stage.is-night` > `.layout-dark-1`): `.eyebrow` small title (optional), `h1` title (`<em>` = mint highlight), `.subtitle` (optional, `<em>` = mint highlight), and `.content`.

- **Doc dark 1** (`<section class="page is-night" data-type="doc">` > `<article class="doc-dark-1">`): a scrolling document page. Slots: `.eyebrow`, `h1`, `.lead` (optional), paragraphs and `.dark-table`. Accent colour: `.is-mint` (default), `.is-pink` or `.is-lime` on the article. Space / ↓ scroll the page first, then advance.
- **Alert** (`.stage.is-night` > `.layout-dark-1.layout-alert`): a security warning for executives, amber accent. Slots: `.alert-chip` (label with a warning icon), `h1` (`<em>` = amber), `.alert-rows` (one `.alert-hd` header row, then one row per risk: `b` name, `p` what can happen, `p.do` what to do) and `.source`.

- **Dark table** (`table.dark-table`): uppercase column headers, first column in the accent colour. Works inside `.layout-dark-1` (absolutely placed under the title) and inside `.doc-dark-1`. Add `.is-compare` for bold sentence-case headers.

- **Bar chart** (`.cost-chart`): one `.row` per bar; set the value on the bar as `style="--v:191"` (the track spans 0–500). Put the sources in `.source` under the chart.

Every slide can have `<span class="page-num"></span>`. `deck.js` fills it with the page number. `.slide-logo` puts the white NOVA IMS logo bottom-left, and `.slide-footer` adds the centred footer line.

## Harness diagram

`diagrams/harness.js` draws three nested layers, front-on: the model (a glossy sphere that breathes), the harness (a mint annulus whose eight spokes push particles inward toward the model), and context and knowledge (the pale outer ring). The callouts and leader lines on slide 5 are static HTML/SVG. Their end points match the radii in `harness.js` (1 world unit ≈ 80 px), so update both if you resize anything. `diagrams/system.js` (slide 6) shows the bare model, an arrow "+ harness", and the same model inside the harness ring with five labelled functions; it is a GenAI system. `diagrams/lib.js` is the `class_06` helper with an extra `spin: false` option.
