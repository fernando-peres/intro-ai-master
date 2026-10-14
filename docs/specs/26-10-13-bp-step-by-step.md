# Back-propagation: Step by Step

**Status:** Implemented.
**App:** `apps/ai-intro`
**Lesson:** Neural Networks → Back-propagation → Step by Step (`/learn/neural-networks/forward-and-backward`)
**Kind:** Content

## Purpose

Show how back-propagation works by simulating one complete forward pass, loss, backward pass and weight update on a tiny network, one step at a time. The page replaces the earlier static worked example.

## Data and network

The data is chosen from a combo box above the table: **AND** (default), **OR** or **XOR**. Each is the four corners of the unit square, listed starting at (1, 1) so row 1 has both inputs active. Training is online: the network is updated after each row, then the next row starts from the updated parameters. After row 4 a new epoch starts (40 epochs, 160 rows in all). Changing the dataset restarts training.

| # | x₁ | x₂ | y (AND) | y (OR) | y (XOR) |
|---|---|---|---|---|---|
| 1 | 1 | 1 | 1 | 1 | 0 |
| 2 | 0 | 1 | 0 | 1 | 1 |
| 3 | 1 | 0 | 0 | 1 | 1 |
| 4 | 0 | 0 | 0 | 0 | 0 |

```text
input (x₁, x₂) → Input Layer → Hidden Layer → Output

  x₁ ──┬─ h₁ ──┐
       ├─ h₂ ──┤
       ├─ h₃ ──┼── ŷ        every input feeds every hidden neuron,
  x₂ ──┴─ h₄ ──┘            every hidden neuron feeds ŷ
```

2 → 4 → 1, sigmoid on every neuron, a bias on every hidden and output neuron, cross-entropy loss, η = 2. Starting parameters (biases start at 0):

| Parameter | Value |
|---|---|
| h₁ ← (x₁, x₂) | (1, 0.4) |
| h₂ ← (x₁, x₂) | (−0.3, −0.3) |
| h₃ ← (x₁, x₂) | (−1, 1) |
| h₄ ← (x₁, x₂) | (−0.6, 0.2) |
| ŷ ← (a₁, a₂, a₃, a₄) | (−0.7, 0.1, 0.8, 0.2) |

These were picked, not random: the mixed signs put the untrained network's 0.5 decision boundary inside the unit square (so the chart has a line to draw from the start), and AND, OR and XOR all reach 100% accuracy within the 40-epoch run from here.

**Why biases.** Without a bias, the input (0, 0) always gives z = 0 and so the same hidden activations, whatever the weights. The output can then not learn a threshold, and AND and OR stalled at 75% accuracy however long they trained. A bias is a weight on a constant input of 1, so its gradient is its neuron's δ.

**Why four hidden neurons.** With two hidden neurons, XOR did not train from the starts we tried. Each hidden neuron cuts the plane with its own line, and the output combines the cuts; four give XOR enough pieces to separate its two diagonals.

All numbers come from `stepByStep()` and `trainRounds()` in `back-propagation-step-by-step-math.ts`; every gradient, biases included, is checked against finite differences. Row 1 of AND gives ŷ = 0.489, loss 0.716, and 0.087 after its update.

Metrics are the whole dataset under the current parameters: mean cross-entropy loss, and accuracy (ŷ ≥ 0.5 matches y). Untrained: AND loss 0.746, accuracy 25%. After 40 epochs, all at 100% accuracy: AND loss 0.027 (stably correct from epoch 20), OR 0.008 (epoch 8), XOR 0.063 (epoch 28). Four rows per epoch make AND take ~80 updates, so it is not solved after 10 epochs.

## Steps

Five steps per row. **‹ Previous** and **Next ›** move between them; at step 5 Next reads **Next row ›** and starts the next row at step 1 with the updated network ("Network updated by row n"). Previous at step 1 returns to the earlier row's step 5. The wizard circles jump within the current row. Both buttons are disabled only at the very start and the very end.

**Next epoch** (left of Train) jumps to the first row of the next epoch, step 1, with every remaining row of the current epoch trained on; it is disabled in the last epoch. **Train** completes one row every 150 ms, landing on its Update step so the network, boundary and charts follow; it becomes **Pause**, and stops by itself after epoch 40. **Reset** returns to row 1, step 1 of the untrained network. Using Previous, Next, Next epoch, a wizard circle or the dataset box also pauses Train.

| # | Step | Network shows | AND, row 1 |
|---|---|---|---|
| 1 | Forward weights | z on each hidden/output node, weights on edges, biases under the tiles | z₁ = 1.400, z₂ = −0.600, z₃ = 0, z₄ = −0.400 |
| 2 | Activation function | a = σ(z) on hidden nodes, ŷ on the output | a₁ = 0.802, a₂ = 0.354, a₃ = 0.500, a₄ = 0.401, z = −0.046, ŷ = 0.489 |
| 3 | Loss | L on the output | L = −ln ŷ = 0.716 |
| 4 | Backward | δ on each node, gradients on edges | δ_out = −0.511, δ₁ = 0.057, δ₂ = −0.012, δ₃ = −0.102, δ₄ = −0.025 |
| 5 | Update | new parameters, new loss | new loss 0.087 (was 0.716) |

Page layout:

```text
┌ Data ──────────────────────────────────────────────────────────────────┐
│ Dataset [AND ▾]                                                          │
│ ┌──┬────┬────┬───┐   input (x₁, x₂) → Input Layer → Hidden Layer → Output │
│ │  │ x₁ │ x₂ │ y │   [Decision boundary: the network's shaded prediction, │
│ │▶ │ 1  │ 1  │ 1 │    the 0.5 line, the rows as class-coloured points,    │
│ │  │ 0  │ 1  │ 0 │    the active row ringed]                              │
│ │  │ 1  │ 0  │ 0 │                                                        │
│ │  │ 0  │ 0  │ 0 │                                                        │
│ └──┴────┴────┴───┘                                                        │
│ Class colors [■ Class 0] [■ Class 1] ↺                                   │
└──────────────────────────────────────────────────────────────────────────┘
┌ Step by step ──────────────────────────┐ ┌ Math ─────────────────────────┐
│ (✓)━━━━(✓)━━━━(✓)━━━━(✓)━━━━(5)        │ │ ┌ 1. Forward weights ───────┐ │
│  Fwd    Act    Loss   Back   Update    │ │ │ z₁ = 1·1 + 0.4·1 + 0 = 1.400 │
│ input        hidden        output(y=1) │ │ └───────────┬───────────────┘ │
│  [7 tiles, 12 edges with weights, a=, L=]│ │             ▼ z₁, z₂          │
│ UPDATE                                 │ │ ┌ 2. Activation function — Sigmoid ┐
│ Turn each dial a small step against…   │ │ │ [1.400] → [σ ∿] → [0.802] │ │
│ [‹ Previous] Row 1 · Epoch 1 · 5 / 5 [Next row ›]  (same height; Math scrolls)
│ [⏭ Next epoch] [▶ Train]  [↺ Reset]    │ │                               │
└────────────────────────────────────────┘ └───────────────────────────────┘
┌ Gradient descent ───────────┐ ┌ Loss: 0.683 ───────┐ ┌ Accuracy: 50% ─────┐
│ one parameter, row's loss   │ │ line chart          │ │ line chart          │
└─────────────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

- Data box: the dataset combo box sits above the table. Left: the table with a cursor and dark-orange highlight on the active row, the layer-flow text, and the class colour pickers (same control as the Training Lab's, with a reset; the colours also tint the y column). Right: the **decision boundary** chart (the same chart as the Training Lab's) shading where the current network predicts class 0 or 1, with the 0.5 line, the rows as points in the class colours, and the active row ringed. It redraws from the current parameters, so it changes at every update. It also keeps history: one orange 0.5 line per finished epoch (the untrained network first), newer lines stronger and older ones fading, drawn under the bold line of the network now. A line appears once the epoch's last row has been updated, so Train, Next epoch and stepping all add them. A network that predicts one class everywhere has no bold line until it does. The chart carries no caption text. The lines are drawn with the theme's orange resolved to a literal color: SVG stroke attributes cannot take `var()` or `color-mix()`, which made them fall back to the bold line's white.
- Math zoom: the Math card header has a zoom button. It opens a modal with the same blocks, connectors and info buttons in bigger type (formulas and worked lines at about 20px instead of 12px), scrolling inside the dialog; Escape, the backdrop or "Original size" closes it. It follows the current step, so the zoomed math is the same cumulative math.
- Math boxes: each has an info button (ⓘ) in its header. Clicking it shows, under the formulas, `where:` and a list of what each symbol means, e.g. `wⱼₖ: The weight from input k to hidden neuron j`, `η: The learning rate: the size of each step`. Boxes open and close independently.
- Network graph: drawn exactly like the Training Lab's diagram, with one hidden layer of four neurons. Each neuron is a heatmap tile of what it computes over the (x₁, x₂) plane, under the INPUT / HIDDEN 1 (4) / OUTPUT headers; edges are orange for positive weights and grey for negative, thicker for larger |w|. A dot on each tile marks the active row's (x₁, x₂). Numbers follow the step: weights on edges (gradients at step 4, new weights at step 5), and under each tile z, a, ŷ, L or δ, with its bias `b=`. It reuses the Lab's exported helpers (`sampleLayers`, `gridToDataUrl`, `resolveThemeColor`) in `back-propagation-step-network.tsx`; the Training Lab's own files are unchanged.
- Bottom row, three charts side by side, all drawn in the brand orange: **gradient descent**, **loss** and **accuracy**. Gradient descent is for one parameter chosen from a list (w₁₁ … w₄₂, v₁ … v₄, b₁ … b₄, b_out): the active row's loss as only that parameter moves. A dot marks its current value; at Backward a tangent shows the gradient; at Update a dashed step leads to the new value. Loss and accuracy are measured after each completed update (x = 0 is the untrained network); a row's point appears once its step 5 is reached.
- Performance: the heatmaps, the decision-boundary grid and contour depend only on the parameters, so they are rebuilt once per update (step 5), not on every click.

## Activation functions (reference)

The page uses sigmoid throughout. The table below is the reference for the alternatives.

```text
┌──────────────────┬────────────────────────────────────┬─────────────────────┬──────────────────────────────┐
│ ACTIVATION       │ KEY POINTS                         │ PLOT                │ EQUATION                     │
├──────────────────┼────────────────────────────────────┼─────────────────────┼──────────────────────────────┤
│ Linear           │ • Output of regression problems    │ -                   │ -                            │
│ (no activation)  │                                    │                     │                              │
├──────────────────┼────────────────────────────────────┼─────────────────────┼──────────────────────────────┤
│ Sigmoid and      │ • Output of classification         │ 1 ┤      ▁▂▃▄▅▅▅▅   │ sigm(z) = 1 / (1 + e^−z)     │
│ Softmax          │   problems                         │   │    ▃▀           │                              │
│ function         │   – Sigmoid for binary             │   │  ▂▀             │ soft(zᵢ) = e^zᵢ / Σ e^zⱼ     │
│                  │   – Softmax for multiclass         │ 0 ┼▁▁▀──────── z    │                              │
│                  │ • Derivatives are near zero for    │                     │                              │
│                  │   large values                     │                     │                              │
│                  │   – Known as vanishing gradient    │                     │                              │
│                  │     problem                        │                     │                              │
├──────────────────┼────────────────────────────────────┼─────────────────────┼──────────────────────────────┤
│ Hyperbolic       │ • Used within hidden layers        │ 1 ┤     ▁▂▃▄▅▅▅▅    │ g(z) = (e^z − e^−z)          │
│ tangent (tanh)   │ • Zero mean (faster than sigmoid)  │   │    ▄▀           │        / (e^z + e^−z)        │
│                  │ • Also can suffer from vanishing   │ 0 ┼───▄▀──────── z  │                              │
│                  │   gradients                        │   │ ▂▀              │                              │
│                  │                                    │−1 ┤▁▁               │                              │
├──────────────────┼────────────────────────────────────┼─────────────────────┼──────────────────────────────┤
│ Rectified        │ • Used within hidden layers        │ 1 ┤          ╱      │ g(z) = max(0, z)             │
│ Linear Units     │ • Faster learning / convergence    │   │        ╱        │ same as:                     │
│ (ReLU)           │ • Simpler / computationally        │   │      ╱          │   g(z) = 0, z < 0            │
│                  │   cheaper                          │ 0 ┼▁▁▁▁▁╱───── z    │          z, z ≥ 0            │
│                  │ • Adjusted weights can "kill"      │                     │                              │
│                  │   units as g′(z) = 0               │                     │                              │
│                  │   – Leaky ReLU is an alternative   │                     │                              │
└──────────────────┴────────────────────────────────────┴─────────────────────┴──────────────────────────────┘
```

## Integration and scope

- Replaces the body of `back-propagation-forward-backward.tsx`; slug, curriculum entry and registry are unchanged.
- The wizard is `components/course/stepper.tsx`, the math blocks are `back-propagation-step-math.tsx`, and the network drawing is `back-propagation-step-network.tsx`. The older `backpropExample()` stays: the Key Concepts page still uses it.
- All copy goes through the translation mechanism with English and Brazilian Portuguese entries, per [localization conventions](../localization.md).
- Out of scope: editable parameters or data, other activations on the page, batches.

## Acceptance criteria

1. The page opens on AND, step 1, with Previous disabled; the dataset combo box offers AND, OR and XOR (no other dataset) and sits above the table.
2. Each step shows its analogy above the wizard; the math below the graph accumulates, joined by connectors, and the network labels follow the step.
3. The numbers match `stepByStep()`, and every analytic gradient (weights and biases) matches finite differences.
4. One update lowers the loss (AND row 1: 0.716 → 0.087).
5. Finishing a row starts the next from the updated parameters and moves the cursor; Previous crosses back.
6. The decision-boundary chart draws a line for the untrained network, adds one fading line per finished epoch, marks the active row, and the class colour pickers recolour it.
7. Changing the dataset restarts training; the boundary and gradient chart follow the current parameters and step.
8. Next epoch jumps to row 1 of the next epoch with the earlier rows trained.
9. Each math box's info button toggles its variable meanings.
10. The Math zoom button opens a dialog with the same math in bigger type; Escape or its close button returns.
11. Train advances a row per tick and stops by itself at the end; Pause stops it; Reset returns to row 1, step 1. After 40 epochs AND, OR and XOR all reach 100% accuracy.
