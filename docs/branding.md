# Chart and UI Colors

`apps/ai-intro` picks a color by what it means, not by what looks good next to it. Every color used in a chart, diagram or piece of text belongs to one of four buckets. Pick the bucket by asking what the color is telling the reader, then use its token — never introduce a new hex value for one of these meanings.

## The four buckets

**APP BRAND** — white (`--color-fg`) and orange (`--color-brand`, theme-reactive: it's violet in the violet theme, mint-green in the mint theme, and so on). The app's own identity: navigation, buttons, links, headings. Charts and diagrams may reach for it when the content is about the app itself rather than about data — for example, a single illustrative metric line with no second series to distinguish it from.

**DATA CLASS** — purple (`--color-class-1`) and green (`--color-class-2`). Reserved strictly for a color that tells the reader *which class, group, or cluster a data point belongs to*: the two classes in a classification lesson, a demographic group A vs. B, a cluster assignment, a decision boundary's two sides. If the chart would still make sense after swapping the labels "class 1" and "class 2" everywhere, it's not a data-class chart — use misc or semantic instead.

**MISC** — orange, white, light gray and yellow. For everything that compares two or more things which are not classes: a metric curve (precision vs. recall, an ROC or PR curve), a procedural split (train vs. validate vs. test), a method comparison (random vs. stratified folds), a hyperparameter sweep (several bandit epsilon values), or an algorithm comparison (a keyword vs. a learned ranker). These are the colors to add a third or fourth tone to, in that order (orange, white, light gray, yellow), when a chart needs more than two.

**SEMANTIC** — success (blue, `--color-success`) and error (light red, `--color-error`). For an evaluative verdict: a prediction was correct or incorrect, a check passed or failed, an agent reached the goal or fell in the pit. The color itself carries the judgment, independent of which "side" is listed first.

## Decision rule

Ask, in order:
1. Is this the app's own chrome (nav, button, heading), or a chart deliberately illustrating the app's identity? → **brand**.
2. Does the color say which class, group, or cluster a data point belongs to? → **class**.
3. Is it a pass/fail verdict on a check, a prediction, or an outcome? → **semantic**.
4. Otherwise (a metric, a split, a method, a variant) → **misc**.

## Tokens by theme

| Bucket | Color | Token | Behavior across themes |
|---|---|---|---|
| Brand | white | `--color-fg` | Auto-inverts: near-white in dark-bucket themes (dark/violet/mint/cobalt), near-black in light. |
| Brand | orange | `--color-brand` | Theme-reactive: the active theme's own accent color. |
| Class | purple | `--color-class-1` | Theme-invariant hue, with a darker shade in the light theme for contrast. |
| Class | green | `--color-class-2` | Same. |
| Misc | orange | `--color-chart-warm` | Theme-invariant (`#d9742e` in every theme). |
| Misc | white | `--color-fg-secondary` | Auto-inverts, like `--color-fg`. |
| Misc | light gray | `--color-fg-muted` | Auto-inverts. |
| Misc | yellow | `--color-chart-amber` | Theme-invariant hue, with a darker shade in the light theme. |
| Semantic | success (blue) | `--color-success` | Alias of `--color-chart-cool`, the app's one fixed blue. |
| Semantic | error (light red) | `--color-error` | Theme-invariant hue, with a darker shade in the light theme. |

All eight tokens are Tailwind utilities (`bg-`, `text-`, `border-` + the token name), defined in `apps/ai-intro/src/index.css`'s `@theme inline` block, backed by `--ae-*` custom properties per theme.

## Examples

- Classification Metrics' exam pass/fail scatter plots literal classes → `class-1`/`class-2`. Its ROC curve, PR curve, and the specificity/balanced-accuracy line in the same file are each a single metric line → `chart-warm`/`fg-secondary` (misc), not class colors, even though the file reuses the same two chart components.
- Data Splits' train/validate/test diagrams are a procedural role, not a class → misc (`chart-warm`/`fg-secondary`, plus `chart-amber` where a third segment is needed).
- Generalization's fairness-criterion check (`fair ? ... : ...`) is a verdict → `success`/`error`, not misc or class, even though the underlying chart is right next to a genuine class-colored decision plot.

## Verification

No test asserts a literal color string; chart color choices are reviewed by reading the lesson, not by a test. When adding a new chart, place its color by the decision rule above before writing the series array, and check it in both a dark-bucket theme and the light theme — the light theme uses different shades for class, misc-yellow and error so they keep working contrast against its pale background.
