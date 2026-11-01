# Class 06 — Build & Improving GenAI systems

The HTML deck for Class 6 (02 November 2026). It has no build step: `index.html`, `deck.css`, `deck.js` and the Three.js modules in `diagrams/`.

## Run

Opening `index.html` directly works for slides and docs. Three.js diagrams are ES modules, so they need a local server:

```bash
python3 -m http.server 8000
```

Run it from the repo root, because the fonts and logo are in `presentation/`, then open http://localhost:8000/class_06/. Three.js loads from a CDN, so the 3D diagrams need internet access. Everything else, fonts included, is local.

## Content

50 pages. Each unit follows its notebooks in `notebooks/` and ends with a hands-on doc page.

| Part | Pages | Notebooks |
|---|---|---|
| Intro | Cover, today, system map, materials | – |
| 01 Embeddings | Meaning as numbers | `embeddings_01` |
| 02 Tools | From answers to actions | `llm_tools_01` |
| 03 MCP | One plug, many systems | `mcp_01` |
| 04 Skills | How your team does it | `llm_skills_01` |
| 05 Evals | Measure before you improve | `evals_01` … `evals_04` |
| 06 Guardrails | What must never happen | `guardrails_01` … `guardrails_04` |
| Closing | Improvement loop, questions for executives, setup, wrap-up | – |

## Keys

| Key | Action |
|---|---|
| `→` `PageDown` `n` / `←` `PageUp` `p` | Next / previous step |
| `Space` `↓` / `Shift+Space` `↑` | On a slide: next / previous. On a doc page: scroll, then move on at the end / start |
| `Home` / `End` | First / last step |
| `t` | Show / hide the table of contents (`Esc` closes it) |
| `i` | Show / hide the progress bar and the `step x / n` counter. The choice is remembered. |

The URL hash (`#/5`) follows the current step, so a link can open a given step.

## Fonts

Fonts are in `../presentation/fonts/`, declared in `../presentation/fonts/fonts.css`:

| Role | Font | CSS variable |
|---|---|---|
| Titles (`h1`, `h3`, cover badge) | Borna | `--font-title` |
| Subtitles and long-form text (`h2`, `.subtitle`, `.lede`, doc paragraphs) | CMU Serif | `--font-serif` |
| Code (`code`, `pre`) | Fira Code | `--font-code` |
| General text and UI | Prompt | `--font-text` |

Borna's web fonts in `../presentation/fonts/Borna/webfont/` come from `Borna Complete Webfont 4.zip` in the same folder.

## Authoring

Pages are the `<section class="page">` elements in `index.html`, in order.

- `data-type="slide"`: a 1600×900 stage scaled to fit the screen. Content goes in `<div class="stage">`; add `is-green` or `is-dark` for a coloured background.
- `data-type="doc"`: a step that scrolls vertically. Content goes in `<article class="doc">`.
- `data-title`: the label shown in the table of contents.
- Units: wrap pages in `<div class="unit" data-title="…">`. The table of contents groups them and the counter shows the unit name.

Slide layouts: `.layout-content` (header + body), `.layout-unit` (unit title), `.layout-statement` (one sentence). Components: `.card`, `.grid-2/3/4`, `.split`, `.flow` with `.node` and `.arrow`, `.table`, `.points`, `.key-idea`, `.code`, `.chip`. Doc components: `.callout`, `.try`, `.result`, `.meta`.

## Diagrams (Three.js / img2threejs)

`<div class="diagram" data-module="diagrams/name.js"></div>` loads the module the first time its page is shown. The module exports `mount(el)` and returns `{ start(), stop() }`, which the deck calls when the page is entered and left.

`diagrams/lib.js` holds the shared setup: renderer, camera, lights, HTML labels that follow 3D objects, drag-to-rotate and the render loop. The three diagrams are `system-map.js`, `embedding-space.js` and `guardrail-gates.js`.

A model produced with [img2threejs](https://github.com/img2threejs/img2threejs) goes inside `mount()`: add it to the `root` group from `createStage`. Import Three.js as `"three"`; the import map in `index.html` resolves it.
