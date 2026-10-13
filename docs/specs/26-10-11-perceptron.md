# Perceptron: one neuron, one decision boundary

**Status:** Draft specification; no implementation changes included.
**App:** `apps/ai-intro`
**Lesson:** Neural Networks → Perceptron (`/learn/neural-networks/perceptron`)
**Kind:** Simulation

## Purpose

Let a beginner watch one artificial neuron learn to separate two classes, understand what its weights and bias do, and discover why one straight decision boundary cannot solve XOR or interlocking moons.

Follow the course's **problem → technique → limitation → next advance** arc in [the PRD](../prd.md). The student should be able to explain:

- A neuron computes a weighted sum, adds a bias, then applies an activation.
- Training changes the weights and bias using labelled examples.
- A step perceptron and a sigmoid neuron use different learning rules, even though both have a straight decision boundary with these two inputs.
- More training or a smooth activation cannot make this model represent a curved boundary. Hidden layers with nonlinear activations are the next topic.

The experience should make sense without opening the math panel or knowing how to code.

## Inspiration and algorithm review

Use the **Perceptron tab** in [Neural networks: from rules to transformers](<../../inspiration/Neural networks_ from rules to transformers.html>) as the interaction reference: dataset presets, step/sigmoid comparison, a decision plot beside a neuron diagram, live performance, and contextual concepts. Relevant source anchors are `perceptronData`, `P0`, `pEpoch`, `PerceptronDiagram`, and `Perceptron`.

**Review result:** `pEpoch` implements the correct mistake-driven perceptron update for 0/1 labels. Its sigmoid branch implements per-example stochastic gradient descent on binary cross-entropy. Preserve those distinctions; the reference's presentation and stopping logic need the corrections below.

| Reference behavior or claim | Requirement for this lesson |
|---|---|
| Both modes stop at zero classification errors and display “Converged.” | Step may stop when a full evaluation has zero errors. Sigmoid continues to the epoch cap: 100% accuracy does not mean zero loss or converged parameters. |
| Any run with errors after 25 epochs displays an XOR/moons explanation. | Derive explanations from the selected dataset and actual run status. A slow separable run must never be described as XOR. |
| A finite run implies success or failure of the learning algorithm. | Label the cap “Epoch limit reached.” Failing to find a separator within a budget does not prove non-separability. |
| Boolean presets contain 40 jittered points. | Use the four exact truth-table inputs so AND, OR, and XOR retain their literal Boolean meaning. This is an intentional change from the reference. |
| Random clusters and moons are labelled separable/non-separable by preset name. | Use fixed fixtures with verified geometry, as defined below. Do not infer separability from a training run. |
| Step is “not differentiable, so gradients can't be used — only the perceptron rule.” | Explain that the hard step has zero derivative away from its discontinuity and is undefined there, so ordinary backpropagation through it is unsuitable. Do not claim no other training methods exist. |
| “Only hidden layers” address the limitation. | Say nonlinear hidden layers can learn new features; engineered nonlinear features are another option, outside this playground. |
| The XOR result caused the first AI winter. | Omit this simplified historical causal claim. Keep the lesson focused on the mathematical limitation. |

For the mathematical review, see [Cornell's perceptron notes](https://www.cs.cornell.edu/courses/cs4780/2018fa/lectures/lecturenote03.html) for the separability condition and [Stanford CS229 notes, logistic regression and perceptron sections](https://cs229.stanford.edu/notes-spring2019/cs229-notes1.pdf) for the two updates. Cornell uses −1/+1 labels; this lesson consistently uses 0/1.

## Page structure

Use the existing simulation shell: no lesson counter or previous/next footer. Keep the current sidebar and header.

```text
Problem + short “what to notice” hint

┌ rail (collapsible ‹ ›) ──┬ main ───────────────────────────────────┐
│ Configuration            │ Network diagram          [size slider]  │
│  Dataset: OR|AND|…       ├─────────────────────────────────────────┤
│  Activation: Step|Sigmoid│ Epoch │ Misclassified │ Accuracy │ BCE  │  one stat strip
│  “Changing dataset or    ├────────────────────┬────────────────────┤
│   activation restarts…”  │ Decision plot      │ Performance chart  │
│ ──────────────────────── │ + point inspector  │ (misclassified)    │
│ [Show weights]           ├────────────────────┼────────────────────┤
│ [Show math] (floating)   │ Loss chart (BCE,   │ Comments           │
│ ──────────────────────── │ sigmoid only)      │ (explanations)     │
│ [Play] [Step 1] [Reset]  │                    │                    │
└──────────────────────────┴────────────────────┴────────────────────┘

Key concepts (one live graphic per concept)
Limitation + link to Back-propagation
```

The page is one aligned workbench: a left rail (configuration, display toggles, then transport controls pinned at the bottom, separated by hairlines) beside a main column whose rows share the same edges. The rail collapses to a thin strip; on narrow screens it stacks above the main column and each row stacks. In step mode there is no loss chart, so Comments takes the full width of the last row. Visual style: flat, minimalist, hairline borders, no shadows except the floating math panel.

Opening copy:

> **The problem: separate the blue class from the orange class.**
> One neuron combines two inputs and a bias, then makes a prediction. Train it and watch its decision boundary move.

Hint: “Start with OR. Then try XOR: can one straight line separate all four points?”

Label the modes **Step — perceptron** and **Sigmoid — logistic regression**. Changing the activation also selects its matching training rule; this is not merely a visual switch.

## Datasets

All examples are synthetic, run in the browser, and use the same points in both activation modes. Class 0 is orange; class 1 is blue. Use labels and marker shapes as well as color.

| Preset | Fixture | Teaching point |
|---|---|---|
| OR (default) | `(0,0) → 0`, `(0,1) → 1`, `(1,0) → 1`, `(1,1) → 1` | One positive input is enough; a line separates the classes. |
| AND | Same inputs, targets `0, 0, 0, 1` | Both inputs must be positive; the bias helps position the line. |
| 2 clusters | 40 points, 20 per class. Seed 7; centers `(0.15, 0.20)` and `(0.95, 0.90)`, each coordinate offset bounded to `[-0.15, 0.15]`. | A line also works beyond Boolean inputs. Bounded clusters guarantee a gap. |
| XOR | Same Boolean inputs, targets `0, 1, 1, 0` | Opposite corners share a class; no line can classify all four. |
| Moons | 60 points: for `i = 0…29`, `t = iπ/29`; class 0 at `(cos(t), sin(t))`, class 1 at `(1 − cos(t), 0.5 − sin(t))`. No noise. | Interlocking curves need a nonlinear boundary. Verify intersecting class convex hulls in the fixture test. |

Mark XOR and Moons with a textual **“Not linearly separable”** badge, not an unexplained warning icon. These are deliberate limitations, not errors in the app. Preserve stable point IDs and order; seed any random generation and epoch shuffling. Add plot padding so every point is visible, and keep axes fixed during training for each dataset.

## Controls and state

Initial state: OR, Step, paused, `w₁ = −0.3`, `w₂ = 0.2`, `b = 0.1`, epoch 0, weights hidden, math collapsed. Evaluate the initial model immediately and record an epoch-0 baseline in the charts.

| Control | Behavior |
|---|---|
| Dataset | Pause and initialize a fresh run on that fixture, retaining the selected activation. |
| Activation | Pause and initialize a fresh run on the same fixture with the matching learning rate and rule. |
| Play / Pause | Advance one complete epoch per animation tick; pause preserves the current run. Use approximately 140 ms per epoch, as in the reference. |
| Step 1 epoch | Pause, process every point once, then refresh all views. One click is an epoch, not a single weight update. |
| Reset | Restore the full initial state, including OR, Step, toggles, model, seed, selection, and epoch-0 metrics. |
| Show weights | Toggle numerical `w₁`, `w₂`, and `b` labels in the network without changing training. |
| Show math | Open the equations and worked example in a floating, draggable panel (close with ✕ or Escape) without changing training. |

Dataset/activation changes clear history and the previous update trace, select the first point, and retain disclosure toggles. Show a short note by the selectors: “Changing dataset or activation restarts training.”

Use a **60-epoch cap** for either mode. Step stops earlier if post-epoch evaluation finds zero errors. Sigmoid does not stop on accuracy alone. At a terminal state disable Play and Step; changing a selector or Reset starts a fresh run. If Step is both solved and at the cap, report success.

Cancel scheduled work on pause, reset, configuration change, and unmount. Repeated Play clicks must not create multiple training loops. A queued tick from an old run must never update the new run. Playback and repeated stepping must produce the same numerical result at the same epoch.

## Model and training contract

### Shared representation

For a point with inputs `x₁`, `x₂` and target `y ∈ {0,1}`:

```text
z = w₁x₁ + w₂x₂ + b
```

There are exactly **three trainable parameters** and no hidden layer or engineered features. The constant bias input is `1`; it is not a third measured feature.

Both modes predict class 1 when `z ≥ 0`. The boundary is `w₁x₁ + w₂x₂ + b = 0` when the weight vector is nonzero. With sigmoid, this is also the `p = 0.5` contour. A smooth probability surface does not create a curved classification boundary.

### Step: classical perceptron

For each point, using the current parameters:

```text
ŷ = 1 if z ≥ 0, otherwise 0
error = y − ŷ
w₁ ← w₁ + η × error × x₁
w₂ ← w₂ + η × error × x₂
b  ← b  + η × error
η = 0.1
```

Compute all increments from the same prediction before applying them. Correct predictions cause no update. Include the bias update, including when both coordinates are zero.

The perceptron has a finite-convergence guarantee for a finite, strictly linearly separable dataset with a positive margin and a fixed positive learning rate when examples are revisited. This is not a guarantee of convergence within the demo's 60 epochs. Non-separable datasets cannot reach zero classification errors.

### Sigmoid: logistic regression

For each point, using the current parameters:

```text
p = σ(z) = 1 / (1 + exp(−z))
ŷ = 1 if p ≥ 0.5, otherwise 0
error = y − p
w₁ ← w₁ + η × error × x₁
w₂ ← w₂ + η × error × x₂
b  ← b  + η × error
η = 0.5
```

This is **stochastic gradient descent on binary cross-entropy**, not the perceptron mistake rule. Use the probability in the update, not the thresholded class; do not multiply by an additional `p(1−p)` factor. Correctly classified examples can still change the parameters.

Display mean binary cross-entropy over the entire fixture:

```text
BCE = mean(−y log(p) − (1−y) log(1−p))
```

Compute it stably from logits, using `max(z,0) − y·z + log(1 + exp(−abs(z)))`, and use a numerically stable sigmoid. Keep full precision for computation and round only for display. Probabilities are the model's estimates, not guarantees of correctness.

Perfect classification is compatible with positive BCE. Do not claim finite parameter convergence on separable data or promise that fixed-rate stochastic updates decrease the reported loss every epoch.

### Epoch and evaluation

At each epoch, deterministically shuffle the point IDs using a seed derived from the completed epoch count (reference: `epoch + 3`). Visit every point once, updating parameters immediately after each point. Evaluation after the final update recomputes predictions for **all** points using that one model snapshot.

Track misclassified points, accuracy, and (sigmoid only) BCE after evaluation. The number of mistakes encountered while learning is not the final misclassification count. The plot, network, metrics, history, and math inspector must agree on the committed epoch snapshot.

## Visualizations and explanations

### Decision plot and network

- Plot the labelled points over the current decision regions. Step shows two solid regions; sigmoid shows a probability gradient with a `P(class 1)` legend.
- Draw the explicit decision boundary and mark misclassified points with an additional outline or symbol. True class color never changes with the prediction.
- Handle vertical lines, boundaries outside the viewport, and a zero weight vector without dividing by zero. For a zero weight vector, show a constant prediction; when `b = 0`, all points are ties and predict class 1. Do not invent a line.
- Select a point by click or keyboard-accessible point list. Show its coordinates, target, current score, prediction, and probability in sigmoid mode. Default to the first fixture point.
- The network shows `x₁`, `x₂`, constant `1` → weighted sum → activation → output. Label it “2 inputs → 1 neuron”; the diagram's sum and activation are parts of the same neuron.
- When weights are shown, use signed numbers. If line color/width also encodes sign/magnitude, provide a separate legend so it cannot be confused with class colors.

### Performance

Show epoch, **misclassified / total**, and **training accuracy** in both modes, as one stat strip directly above the charts. Show **binary cross-entropy** only for sigmoid, as a fourth cell of the strip and a separate loss chart in the row below the misclassification history. Include epoch 0, and extend the epoch axis through the actual run rather than clipping it at 12 as in the reference.

State explicitly: “Evaluated on the same points used for training; this does not measure performance on unseen data.” No train/test split is needed for this small representation lesson.

| Situation | Explanation |
|---|---|
| Before training | “Press Play or Step 1 epoch to watch the line move.” |
| Step reaches zero errors | “All training points are correctly classified. This line separates this dataset.” |
| Sigmoid reaches zero errors | “All training points are correctly classified. Probabilities and loss can still change.” |
| OR / AND / clusters still have errors | “A separating line exists. The current weights have not found one yet.” |
| XOR | “Opposite corners have the same label. Every straight boundary leaves at least one mistake.” |
| Moons | “These two curves interlock. A straight boundary cannot separate this fixture.” |
| Epoch cap reached | “Epoch limit reached.” Follow with the appropriate dataset explanation and current metrics. |

Show the XOR/moons limitation from selection onward; do not wait for an arbitrary failure timer. Do not promise a specific accuracy for a non-separable run. Separate learning status from the structural limitation.

### Math disclosure

Explain the active model's forward pass, prediction threshold, update rule, and learning rate. Substitute the selected point's values into the forward pass using the current model.

After an epoch, also retain the last processed point's actual update trace: point ID, target, pre-update parameters and score, hard prediction/probability, increments, and post-update parameters. Label this **“Last training update”** separately from **“Selected point with current weights”**. Never present a calculation using post-epoch weights as though it were the update that already occurred. At epoch 0, show “No training update yet.”

### Key concepts and next topic

Show each concept as a card with a small live graphic tied to the current state, a title, and one short sentence. Each graphic has a text alternative.

- **Inputs**: the selected point with projections to x₁ and x₂, plus the constant bias input 1.
- **Weights**: the current boundary with the weight vector drawn perpendicular to it, pointing to the class-1 side.
- **Bias**: the boundary with b = 0 (dashed) and the current boundary, with an arrow for the shift.
- **Weighted sum**: signed bars for w₁x₁, w₂x₂ and b of the selected point, adding up to z.
- **Activation**: the step or sigmoid curve with the selected point's z marked.
- **Learning rate**: arrows whose length shows η for each mode, the active one highlighted.
- **Epoch**: one dot per point visited each pass, plus progress toward the epoch limit.
- **Linear separability**: a separable and a non-separable example, with the current dataset's case highlighted.

Explain that bias shifts the boundary, while weights determine its orientation and influence on the score.

Close with: “One neuron with these raw inputs can only separate classes with a straight boundary. A network with nonlinear hidden layers can learn more flexible features.” Link to the existing `/learn/neural-networks/back-propagation` lesson as **“Next: hidden layers and back-propagation”**. Do not imply that clicking the link automatically solves the current dataset or transfers its state.

## Integration and scope

Register the page under `neural-networks/perceptron` in the existing lesson registry. Keep training/data functions independent of rendering and reuse existing course controls, chart conventions, and theme tokens. The existing one-dimensional, full-batch logistic-regression fitter is not this two-input, per-example training engine; do not reuse it unchanged.

All training remains local. No backend, new package, storage, export, custom dataset editor, manual weight editing, learning-rate slider, hidden-layer controls, or extra activation functions are required.

Support the app's five themes. Make selectors, disclosures, playback, and point inspection keyboard-operable, with visible focus and readable chart alternatives. Announce pause/completion and configuration changes accessibly without announcing every animation frame. Respect reduced motion, and keep ordinary control feedback within the PRD's 100 ms target.

Use the existing translation mechanism and supply English and Brazilian Portuguese copy for this lesson, following [localization conventions](../localization.md). Language and theme changes preserve model parameters, progress, selected point, and disclosure state. Equations, class IDs, and data remain language independent. Update the localization coverage documentation when the lesson is implemented.

## Acceptance criteria

1. OR is immediately usable in the existing simulation shell. Reset restores every declared default and reproduces the initial metrics.
2. AND/OR/XOR fixtures match their truth tables; clusters have a demonstrable separating line; the moons fixture has intersecting class convex hulls. Fixture tests establish these properties independently of optimizer output.
3. A hand-calculated mistaken Step example updates both weights and bias correctly; a correct example leaves all three unchanged. Cover `z = 0` and a misclassified `(0,0)` input.
4. A hand-calculated sigmoid example matches the BCE gradient update and changes parameters even for a correctly classified point. Extreme logits produce finite loss and valid probabilities.
5. Step solves the three separable presets within the chosen default budget. Both modes retain at least one XOR/moons error. If a separable preset misses the budget during implementation, adjust and document the defaults; never fake success or mislabel its geometry.
6. After each epoch, metrics equal an independent evaluation of the final parameters; the epoch-0 baseline and every history entry use the correct epoch index.
7. Sigmoid remains trainable after reaching 100% accuracy. Step stops on zero errors; both respect the cap. Pause/resume and repeated single steps match uninterrupted playback.
8. Reset, selector changes, and unmount prevent stale updates. Disclosure, theme, and language changes preserve the run. No duplicate playback timers occur.
9. Plot regions, line, point inspection, network values, and math agree on one snapshot; the last-update trace uses its recorded pre-update state. Vertical and degenerate boundaries render safely.
10. Dataset-specific copy never conflates an epoch cap with non-separability, accuracy with loss convergence, or training accuracy with generalization.
11. Keyboard use, narrow layouts, all themes, reduced motion, and both languages remain usable; the next-topic link resolves to the intended existing route.

Validate the implemented engine with focused unit tests, control/state behavior with component tests, and visual/accessibility behavior in the browser. This spec revision itself requires documentation review only.
