# Class 06 — Build & Improving GenAI systems

An HTML deck for the training. It has no build step: `index.html`, `deck.css` and `deck.js`.

## Run

Opening `index.html` directly works for slides and docs. Three.js diagrams are ES modules, so they need a local server:

```bash
python3 -m http.server 8000 --directory content/intro-ai-ml/class-06
```

Then open http://localhost:8000. Three.js and the DM Sans font load from a CDN, so you need internet access.

## Keys

| Key | Action |
|---|---|
| `→` `PageDown` `n` / `←` `PageUp` `p` | Next / previous step |
| `Space` `↓` / `Shift+Space` `↑` | On a slide: next / previous. On a doc page: scroll, then move on at the end / start |
| `Home` / `End` | First / last step |
| `t` | Show / hide the table of contents (`Esc` closes it) |
| `i` | Show / hide the progress bar and the `step x / n` counter. The choice is remembered. |

The URL hash (`#/5`) follows the current step, so a link can open a given step.

## Authoring

Pages are the `<section class="page">` elements in `index.html`, in order.

- `data-type="slide"`: a 1600×900 stage scaled to fit the screen. Content goes in `<div class="stage">`. Add `is-green` for a green brand background. Layouts: `.layout-title`, `.layout-content`.
- `data-type="doc"`: a step that scrolls vertically. Content goes in `<article class="doc">`.
- `data-title`: the label shown in the table of contents.
- Units: wrap pages in `<div class="unit" data-title="…">`. The table of contents groups them and the counter shows the unit name. Pages outside a unit, such as the cover, are allowed.

## Diagrams (Three.js / img2threejs)

`<div class="diagram" data-module="diagrams/name.js"></div>` loads the module the first time its page is shown. The module exports `mount(el)` and returns `{ start(), stop() }`, which the deck calls when the page is entered and left. See `diagrams/example.js`. A model produced with [img2threejs](https://github.com/img2threejs/img2threejs) goes inside `mount()`. Import Three.js as `"three"`; the import map in `index.html` resolves it.
