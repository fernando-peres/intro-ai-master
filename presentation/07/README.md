# Presentation 07 — GenAI System Mindset: summary

Class 7 · 04 November 2026. An HTML deck that uses the deck 06 engine (`deck.js`, `deck.css`, keys, TOC and HUD). No build step.

## Run

From the repo root:

```bash
just serve
```

Then open http://localhost:8000/presentation/07/. Serve from the repo root, not from this folder, because the deck loads fonts from `../fonts/`.

## Present, autoplay and record

- **Navigate:** ← / → (or swipe), or the on-screen ◀ ▶ buttons, which hide after a few idle seconds. `t` opens the contents, `f` toggles fullscreen.
- **Autoplay:** add `?autoplay` to the URL (for example `http://localhost:8000/presentation/07/?autoplay`), or press `a` / ⏯. Each page stays up for its `data-duration` in seconds, otherwise a default for its template: cover 7, statement 9, diagram or doc 20, other 15. Arrows restart the current page's timer; opening the contents pauses. `&loop` starts over after the last page.
- **Record mode:** `?record` hides the HUD, the controls and the cursor.
- **Video:** `just record 07` writes an MP4 (1920×1080, 30 fps, no audio) to `export/`, named after the PDF there. It opens Google Chrome and plays the deck once; keep that window open until it finishes. The recorder lives in `presentation/tools/` with its own `package.json` (`playwright-core`), outside the pnpm workspace.

## Slides

| # | Slide | Template |
|---|---|---|
| 1 | Cover |  |
| 2 | Building blocks of a GenAI system | `layout-dark-1` |
| 3 | Building blocks · Context | `layout-dark-1` · `.bb` |
| 4 | Building blocks · Tools & integrations | `layout-dark-1` · `.bb` |
| 5 | Building blocks · Workflows | `layout-dark-1` · `.bb` |
| 6 | Building blocks · Agents | `layout-dark-1` · `.bb` |
| 7 | Building blocks · Guardrails | `layout-dark-1` · `.bb` |
| 8 | Building blocks · Evals | `layout-dark-1` · `.bb` |
| 9 | Improving the system · Observability (live signals panel) | `layout-dark-1` · `data-view="obs"` |
| 10 | Improving the system · Experiments (lab panel) | `layout-dark-1` · `data-view="exp"` |
| 11 | Unit 9 · One idea to keep (from deck 06) | `layout-statement-dark` |
| 12 | Recap · the four dimensions (from deck 06) | `layout-dark-1` |
| 13 | Cycles · three cycles, one system (from deck 06) | `layout-dark-1` |
| 14 | Closing · the improvement loop (from deck 06) | `layout-statement-dark` |
| 15 | Levels of AI adoption · L0 to L5 (from deck 06) | `layout-dark-1` |
| 16 | To close · a system that learns | `layout-statement-dark` |

## Templates

`deck.css`, `deck.js` and `diagrams/lib.js` are copies of deck 06's. `diagrams/kit.js` holds the colours, ring plane and helpers shared by `blocks.js` and `focus.js`. For the template slots, see [`presentation/06/README.md`](../06/README.md#templates-what-changes-in-each-instance).

- **Building blocks** (slide 2): `.blk-groups` holds one `.blk-card` per group. Each card sets its colour with `style="--c:…"` and carries a `.blk-badge` whose `data-blk` letter (C, T, W, A, G, E, X, O) matches a badge in `diagrams/blocks.js`; both pulse together as the request moves through the diagram. In the diagram, the harness, context and observability rings surround the model; a separate experiments orbit (upper right) holds dashed candidate badges, and when feedback returns from the answer to the harness, one is validated and replaces the harness badge of the same type. `.blk-note` explains the O satellite that orbits the observability ring.

- **One building block** (slides 3–8, `.layout-dark-1.bb` with `style="--c:…"`): `.bb-left` stacks `.bb-def` (definition), `.bb-idea` (one idea to keep), `.bb-spectrum` (set `style="--n:<stops>"`; a `.bb-stop` may set its own `--c`), then `.bb-pairs`, `.bb-chips` and `.bb-foot` as needed. The diagram is `diagrams/focus.js`; `data-focus` picks the layer: `C` context, `T` tools, `W` workflow, `A` agent, `G` guardrails, `E` evals. Add `.is-here` to the `.bb-stop` that the slide is about.

- **Improving the system** (slides 9–10): `diagrams/blocks.js` with `data-view="obs"` or `"exp"` draws the slide 2 system wide (`.blocks-diagram.is-wide`) without the experiments orbit, and drives a panel from `diagrams/panels.js`. `.ob-live` holds four `.ob-col` signal columns whose `[data-ob]` values update per request; `.ex-lab` holds the six `.ex-lab-steps` and the `[data-ex="rows"]` variant rows. A 👍 row calls `promote(id)`, which flies that badge from below into the harness. The numbers are illustrative.
- **Badge rows** (`.blk-row`): small block badges added to the deck 06 framework quadrants and cycle legend.
