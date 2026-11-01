# Presentation 06 — Build & Improving GenAI systems (harness deck)

A five-slide HTML deck built on the `class_06/` engine (same `deck.js` runtime, keys, TOC and HUD). No build step.

## Run

Run a server from the repo root (the Three.js diagram is an ES module):

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000/presentation/06/. Three.js and the handwriting font (Architects Daughter) load from CDNs. Without internet, the notes fall back to CMU Serif.

## Slides

| # | Slide | Template |
|---|---|---|
| 1 | Cover | `.cover` (same as `class_06`) |
| 2 | Index | `.layout-index` |
| 3 | 01. What is a harness? | `.layout-unit-v2` |
| 4 | Lesson · Harness overview | `.layout-lesson` |
| 5 | Harness for GenAI systems | `.layout-dark-1` + `diagrams/harness.js` |

## Templates: what changes in each instance

- **Index** (`.stage.is-night.layout-index`): only the `<ol>` items.
- **Unit** (`.stage.is-brand.layout-unit-v2`): the title. Write the light part as plain text and the key word in `<b>`, for example `01. What is a <b>harness</b>?`.
- **Lesson** (`.stage.is-forest` > `.layout-lesson`): the title, which depth pill carries `.is-current` (Overview / Conceptual / Technical / Deep dive), and the `.objective` text.
- **Dark content 1** (`.stage.is-night` > `.layout-dark-1`): `.eyebrow` small title (optional), `h1` title (`<em>` = mint highlight), `.subtitle` (optional, `<em>` = mint highlight), and `.content`.

Every slide can have `<span class="page-num"></span>`. `deck.js` fills it with the page number. `.slide-logo` puts the white NOVA IMS logo bottom-left, and `.slide-footer` adds the centred footer line.

## Harness diagram

`diagrams/harness.js` draws three nested layers, front-on: the model (a glossy sphere that breathes), the harness (a mint annulus whose eight spokes push particles inward toward the model), and context and knowledge (the pale outer ring). The callouts and leader lines on slide 5 are static HTML/SVG. Their end points match the radii in `harness.js` (1 world unit ≈ 80 px), so update both if you resize anything. `diagrams/lib.js` is the `class_06` helper with an extra `spin: false` option.
