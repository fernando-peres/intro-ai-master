# Back-propagation: hidden layers that learn curved boundaries

**Status:** Draft specification; no implementation changes included.
**App:** `apps/ai-intro`
**Lesson:** Neural Networks → Back-propagation (`/learn/neural-networks/back-propagation`)
**Kind:** Simulation

## Purpose

Continue directly from the Perceptron lesson's closing line: "One neuron... can only separate classes with a straight boundary. A network with nonlinear hidden layers can learn more flexible features." This lesson lets a student watch that claim become true, then watch the new technique hit its own limit.

Follow the course's **problem → technique → limitation → next advance** arc in [the PRD](../../../docs/prd.md). The lesson has three beats:

1. **The problem, restated.** Zero hidden layers reproduces exactly what the Perceptron lesson showed: one neuron draws one straight line, and XOR/moons defeat it.
2. **The technique.** A modest hidden-layer network with a nonlinear activation, trained by backpropagation (the chain rule applied layer by layer), solves what the single neuron couldn't.
3. **The new limitation.** Pushing the network deeper with a saturating activation (sigmoid, eventually tanh) makes training stall again — not because the boundary is too simple this time, but because the gradient shrinks at every layer it passes backward through and barely reaches the earliest weights. This is the **vanishing gradient problem**, the limitation this lesson exists to expose, motivating the next lesson (Activation Functions).

**Scope decision, noted explicitly:** this lesson reuses the Train-loop playground pattern already built for `programming-vs-ml/machine-learning.tsx` — hidden-layer controls, Step/Train/Reset, a live network diagram, a decision chart, loss/accuracy history — rather than building a dedicated forward/backward gradient-flow step-through visualization. The vanishing-gradient beat is demonstrated through training *behavior* (the existing loss-over-epoch chart visibly flattening near the random-guess baseline) and a derived status message, not a new diagram. `docs/prd.md`'s candidate-simulation entry for this lesson is updated alongside this spec to match ("Deepen the Machine Learning playground... train it on XOR/moons" / "Vanishing gradients in deep stacks") so the two documents agree.

The experience should make sense without opening the math panel.

## Inspiration and algorithm review

Use the **"Hidden layers + backprop"** tab in [Neural networks: from rules to transformers](<../../../inspiration/Neural networks_ from rules to transformers.html>) as a reference: its own `Backpropagation` concept card and activation-saturation explainer already state the vanishing-gradient idea ("small gradients in early layers, especially with sigmoid/tanh").

| Reference behavior or claim | Requirement for this lesson |
|---|---|
| A dedicated mean-gradient-norm-per-layer stat/diagram drives the vanishing-gradient claim. | Do not add a new gradient-norm stat or diagram. Make the claim through training behavior — the existing loss-over-epoch chart flattening near `ln 2 ≈ 0.693` (the random-guess loss for a binary target) — and a derived status message. |
| Dataset options include a noise slider and extra shapes (circle, spiral, linear). | Reuse exactly the five fixed, seeded fixtures already defined in `perceptron-data.ts` (`or`/`and`/`clusters`/`xor`/`moons`). No noise slider, no new datasets — this keeps continuity with the Perceptron lesson and keeps fixtures language/test independent. |
| Hidden layers capped at 4, 1–8 neurons each. | Raise the hidden-layer ceiling to 8 so a student can push deep enough to see training visibly stall (see empirical numbers below). |
| "Backpropagation (1986)... the chain rule, weight by weight." | Keep this framing. Reuse `neural-net.ts`'s existing forward/backward math verbatim — it is already general over depth and activation; this spec does not change it. |

### Empirical grounding

Running `neural-net.ts`'s existing `createNetwork`/`trainEpoch` against the XOR and moons fixtures from `perceptron-data.ts`, sweeping depth (1–10 hidden layers of 4 neurons) and activation at a learning rate of 0.3:

- **sigmoid**: on XOR, loss plateaus at `ln 2 ≈ 0.693` (the random-guess loss) by depth **2** already, and stays flat through depth 10 — the cleanest demonstration.
- **tanh**: robust through depth 6; starts failing at depth 8–10.
- **relu**: solves quickly at low/mid depth, but can die unpredictably at high depth (a different failure — dead units from initialization — worth a soft secondary mention, not the lesson's main claim).

These numbers ground the constants below and the acceptance criteria's test oracles.

## Page structure

The lesson is a group of four pages under Neural Networks → Back-propagation:

| Page | Slug | Kind | Holds |
|---|---|---|---|
| Overview | `back-propagation` | content | Title "Backpropagation (1986)", 1986 fun fact with the Nature paper link, What / Why (numbered list), forward/backward diagram, key-innovation takeaway, then six Key-concept cards (each with What / Why; Hidden layers shows XOR in input space → hidden lines → hidden space) |
| Training Lab | `training-lab` | simulation | The workbench below (with class-color pickers in the rail), Classify a new example, limitation + link to Step by Step |
| Step by Step | `forward-and-backward` | content | A five-step stepper over one forward/backward/update pass on a 2 → 2 → 1 network (see [its spec](26-10-13-bp-step-by-step.md)) |
| Key Concepts | `under-the-hood` | content | The seven numbered theory explainers, from "1. Loss function" |

The workbench on the Training Lab uses the same rail + main shell as `programming-vs-ml/machine-learning.tsx`, with a Key-concepts section (richer treatment, matching the Perceptron lesson) and a closing limitation + forward link:

```text
Problem + short "what to notice" hint

┌ rail (collapsible) ────────┬ main ──────────────────────────────────────┐
│ Configuration                │ Network diagram             [size slider]│
│  Dataset: OR|AND|Clusters|   ├────────────────────────────────────────── │
│   XOR|Moons (badge)          │ Epoch │ Loss │ Accuracy │ Architecture    │  stat strip
│  Hidden layers: +/−layer,    ├─────────────────────┬──────────────────── │
│   per-layer +/− neurons      │ Decision chart       │ Accuracy over epoch│
│  Activation: tanh/relu/      ├─────────────────────┼──────────────────── │
│   sigmoid/linear             │ Loss over epoch      │ Comments           │
│  Learning rate select        │                      │ (incl. the         │
│ ─────────────────────────    │                      │  plateau/vanishing-│
│ [Show weights][Show math]    │                      │  gradient branch)  │
│ ─────────────────────────    │                      │                    │
│ [Step][Train/Pause][Reset]   │                      │                    │
└───────────────────────────────┴──────────────────────┴───────────────────┘

Key concepts (one live graphic per concept)
Limitation + link to Activation Functions
```

Opening copy:

> **Hidden layers: from lines to curves.**
> A single neuron (the Perceptron) can only draw a straight line. Stack neurons into hidden layers, give them a nonlinear activation, and train every weight with backpropagation — the error flows backwards through the chain rule, layer by layer.

Hint: "Start with XOR or Moons — the two datasets the Perceptron lesson couldn't solve. Then push the hidden layers deeper and watch training stall again, for a different reason."

## Datasets

Reuse `perceptron-data.ts`'s `DATASET_IDS`/`DATASETS` unchanged — the same five fixed, seeded fixtures (`or`/`and`/`clusters`/`xor`/`moons`), the same `separable` flag and "Not linearly separable" badge convention already used by the Perceptron lesson. Convert each point to a training example with `{ input: [p.x1, p.x2], target: [p.y] }`.

OR/AND/clusters are trivially solved even with zero hidden layers — nothing new to show there. **XOR and moons are the load-bearing presets**: they are exactly where the Perceptron's "cannot" becomes this lesson's "can," and they default-select on load (XOR first, not OR — a deliberate continuation of the Perceptron lesson's narrative).

## Controls and state

| Control | Behavior |
|---|---|
| Dataset | Pause, rebuild the training examples, create a fresh network with the current architecture/activation/seed, and evaluate an epoch-0 baseline. |
| Hidden layers (+ / − layer, per-layer + / − neurons) | Same interaction as `machine-learning.tsx`. `MIN_LAYERS = 0`, `MAX_LAYERS = 8`, `MIN_NEURONS_PER_LAYER = 1`, `MAX_NEURONS_PER_LAYER = 8`. Any change restarts training on the current dataset. |
| Activation | tanh / relu / sigmoid / linear. Changing it restarts training. |
| Learning rate | Same preset `<select>` as the Machine Learning lesson. |
| Step / Train (play-pause) / Reset | Same semantics as `machine-learning.tsx`'s epoch-at-a-time stepping, `setTimeout`-driven play loop, and full restart. |
| Show weights / Show math | Same toggles, wired to this lesson's own diagram/math panel. |

Initial state: **XOR** dataset, `DEFAULT_HIDDEN_LAYERS = [4, 4]`, `tanh`, learning rate 0.3, paused, epoch-0 baseline evaluated immediately.

## Model and training contract

No changes to `apps/ai-intro/src/lib/neural-net.ts` — it already supports arbitrary depth and all four activations. `createNetwork(layerSizes, seed, hiddenActivation)` initializes weights (He init for relu, scaled Gaussian otherwise); `forward`/`predict` compute activations layer by layer; `trainEpoch` runs mini-batch gradient descent, backpropagating the cross-entropy gradient through every layer via the chain rule; `crossEntropy` reports the mean loss this lesson plots and uses to detect a plateau. This spec documents that existing math rather than redefining it.

## Visualizations and explanations

Network diagram, stat strip (epoch / loss / accuracy / architecture string), decision chart + accuracy-over-epoch chart side by side, loss-over-epoch chart + Comments — the same visual grammar as `machine-learning.tsx`.

Status/comments copy, keyed off architecture, activation, and loss trend:

| Situation | Message |
|---|---|
| 0 hidden layers, no progress | "No hidden layer = a single neuron — the same Perceptron you just saw. Its boundary is still one straight line." |
| ≥1 hidden layer, nonlinear activation, loss falling | "Training… the hidden layer is learning a curved boundary the single neuron couldn't draw." |
| Solved (loss below target) | "Solved — {n} hidden layer(s) and backpropagation found a boundary the Perceptron couldn't." |
| Hidden layers ≥ 6, sigmoid or tanh, loss has not moved by more than a small epsilon over the last window of checkpoints | "Loss has stalled near a coin flip — this is a vanishing gradient: with {activation}, the error shrinks every layer it passes backward through, so the earliest layers barely update. Try relu, or fewer layers." |
| Epoch cap reached without solving (not a plateau case) | "Still not separated after {max} epochs. Try more neurons, a different activation, or another learning rate." |

The plateau branch is detected purely from the existing `history` array (a pure `isPlateaued(history, window, epsilon)` helper) — no new instrumentation on the training engine. State explicitly: **no gradient-flow diagram is added**; this is the resolution of the scope decision noted in Purpose.

### Key concepts

Cards in the same spirit as `perceptron-concepts.tsx` (a small live graphic, a title, one short sentence), adapted for a multi-layer network:

- **Hidden layers** — a straight line vs. a bent/curved boundary, illustrating what an extra layer buys.
- **Nonlinear activation** — the current activation's curve (tanh/relu/sigmoid/linear), noting which saturate.
- **Backpropagation** — a small forward/backward arrow diagram over the layer stack, with one sentence on the chain rule.
- **Learning rate** — arrow length scaled to the selected preset, same idiom as the Perceptron lesson's card.
- **Epoch** — a dot ring / progress bar over the current epoch and dataset size, same idiom as the Perceptron lesson's card.
- **Vanishing gradients at depth** — a small sparkline of recent loss deltas, flattening as a visual echo of the plateau message; caption ties it to the current architecture and activation.

### Under the hood (theory section)

After "Classify a new example" and before the limitation, eight numbered explainers (`back-propagation-theory.tsx`), each with what/why, formulas and a graphic. All numbers come from pure functions in `back-propagation-theory-math.ts`, so prose and charts agree:

1. **Backpropagation** — forward / backward / update, the chain rule on a 1 → 1 → 1 sigmoid network, a worked numeric pass (loss 0.475 → 0.445), and a forward/backward chain diagram.
2. **Loss function** — loss vs. cost, binary / categorical cross-entropy and MSE, and the −ln ŷ curves for y = 1 and y = 0.
3. **Gradient descent** — interactive plot on J(w) = w² with start point and learning-rate sliders.
4. **Learning rate** — too small / about right / too large side by side; on the bowl, w ← (1 − 2η)w converges for η < 1, bounces at 1, diverges above.
5. **Vanishing and exploding gradients** — log-scale per-layer gradient bars (×0.25 and ×2 per layer) with a shared depth slider, plus the standard fixes.
6. **Optimizers** — SGD, momentum, RMSProp, Adam; three paths down the same narrow valley. The playground itself uses plain mini-batch gradient descent (batch 10).
7. **Hidden-layer activation** — why linear layers collapse, f(z) and f′(z) for sigmoid / tanh / ReLU.
8. **Output activation** — sigmoid / softmax / linear paired with their matching loss, so the output gradient is ŷ − y; interactive softmax bars.

### Next topic

Close with the limitation statement and a link to `/learn/neural-networks/activation-functions` as "Next: activation functions" (a placeholder route today, same as how the Perceptron lesson linked forward to this one before it existed).

## Integration and scope

Register under `neural-networks/back-propagation` in the lesson registry (`lessons/index.ts`) and the curriculum i18n map. This lesson's diagram, math panel, and canvas-sampling helper are **its own files** (`back-propagation-diagram.tsx`, `back-propagation-math.tsx`, `back-propagation-grid.ts`), duplicated and adapted from `programming-vs-ml`'s equivalents rather than shared — matching the Perceptron lesson's fully self-contained convention. `machine-learning.tsx` and its files are not touched.

Out of scope: no backend, no custom dataset editor, no manual weight editing, no new chart/diagram type beyond what's described above, no change to `neural-net.ts`, `perceptron.tsx`, or `machine-learning.tsx`'s behavior.

All training remains local, in the browser, with seeded randomness. Support the app's five themes, keyboard operability, visible focus, and reduced motion. Use the existing translation mechanism and supply English and Brazilian Portuguese copy, following [localization conventions](../../../docs/localization.md); update its lesson-coverage note once implemented.

## Acceptance criteria

1. The lesson opens on XOR, `[4, 4]` hidden layers, tanh, paused, with an evaluated epoch-0 baseline. Reset restores every declared default.
2. Zero hidden layers never solves XOR or moons within `MAX_EPOCHS`, reproducing the Perceptron lesson's limitation exactly.
3. `DEFAULT_HIDDEN_LAYERS` with tanh solves XOR within a small epoch budget (empirically well under 300 epochs at lr 0.3).
4. Eight hidden layers with sigmoid plateaus near `Math.log(2)` within a bounded epoch window, and the plateau status message appears once `isPlateaued` returns true.
5. After each epoch, metrics equal an independent evaluation of the final parameters; the epoch-0 baseline and every history entry use the correct epoch index.
6. Pause/resume and repeated single steps produce the same numerical result at the same epoch; no duplicate playback timers occur; unmounting during playback cancels the scheduled tick.
7. Dataset, hidden-layer, and activation changes restart training and clear history; disclosure (weights/math), theme, and language changes do not.
8. The Perceptron lesson's "Next: hidden layers and back-propagation" link resolves to this lesson instead of a placeholder.
9. Keyboard use, narrow layouts, all five themes, reduced motion, and both languages remain usable.

Validate the training engine's reuse and the new `isPlateaued`/dataset-conversion helpers with focused unit tests (including regression-style assertions that encode the empirical numbers above as oracles), control/state behavior with component tests, and visual/accessibility behavior in the browser.

## Build plan

- **Pass 1 (not built yet):** spec drafted; implementation plan covers `back-propagation-training.ts`, `back-propagation-grid.ts`, `back-propagation-diagram.tsx`, `back-propagation-math.tsx`, `back-propagation-concepts.tsx`, `back-propagation.tsx`, their tests, and registration in `lessons/index.ts` / `i18n/curriculum.ts` / `i18n/pt-br.ts` / `docs/localization.md`, plus a one-line `docs/prd.md` wording update.
