

# Chapter: Traditional Programming vs. Machine Learning

Topic 01-Programming vs ML
## Page:  Problem

UI:
```
---------------------------
| Problem                 |
---------------------------
| Data                    |
---------------------------
| Chart of the data       |
---------------------------
```

1. The Problem — Can We Predict Machine Failure?

Imagine a factory with hundreds of machines. Each machine has sensors that continuously measure its operating conditions.

Our goal is to predict whether a machine is operating normally or is at risk of failure.

Temperature (°C)

How hot is the machine?

Vibration (mm/s)

How much is it vibrating?

Each observation contains two input features and a classification:

- A — Normal: Machine is operating safely.
- B — At Risk: Machine may require maintenance.

### Example dataset

30 observations (15 per class), shared by Problem, Programming, Machine Learning and Content (`dataset.ts`). The classes interlock like "two moons": no straight line, and no set of single-feature thresholds, separates them.

| Temperature | Vibration | Classification |
| ----------- | --------- | -------------- |
| 64°C | 5.3 | A — Normal |
| 65°C | 4.4 | A — Normal |
| 68°C | 3.9 | A — Normal |
| 69°C | 2.4 | A — Normal |
| 71°C | 2.3 | A — Normal |
| 75°C | 1.4 | A — Normal |
| 76°C | 1.5 | A — Normal |
| 81°C | 1.7 | A — Normal |
| 83°C | 1.2 | A — Normal |
| 86°C | 1.9 | A — Normal |
| 88°C | 2.3 | A — Normal |
| 91°C | 3.1 | A — Normal |
| 93°C | 3.7 | A — Normal |
| 93°C | 4.1 | A — Normal |
| 94°C | 5.2 | A — Normal |
| 50°C | 4.5 | B — At Risk |
| 51°C | 5.1 | B — At Risk |
| 52°C | 5.4 | B — At Risk |
| 54°C | 6.3 | B — At Risk |
| 54°C | 6.5 | B — At Risk |
| 58°C | 7.3 | B — At Risk |
| 59°C | 7.3 | B — At Risk |
| 66°C | 7.5 | B — At Risk |
| 67°C | 7.6 | B — At Risk |
| 70°C | 6.6 | B — At Risk |
| 75°C | 5.8 | B — At Risk |
| 76°C | 6.2 | B — At Risk |
| 77°C | 5.2 | B — At Risk |
| 77°C | 5.3 | B — At Risk |
| 81°C | 4.3 | B — At Risk |

Illustrative synthetic training data, with labels assigned for the lesson—not actual industrial safety thresholds.

### Visualize the problem

a chart of points each classification with a color

Question for students: Can you draw a single line separating normal machines from machines at risk? What happens when new data arrives?

## Page: Programming (Traditinal Programming)

UI
```
---------------------------
| Rational                |
---------------------------
| Algorithm (play button) |
---------------------------
| Show performance        |
| Show charts             |
---------------------------
| Where rule brakdown     |
---------------------------
```

2. Traditional Programming — Define the Rules

Traditionally, we ask a domain expert to define the logic.

For example:

- High temperature is dangerous.
- High vibration is dangerous.
- Moderate temperature and vibration together may also indicate a problem.

We translate these assumptions into code:

```python how higlight in python
def predict_failure(temperature, vibration):    if temperature > 85:        return "B — At Risk"    if vibration > 6:        return "B — At Risk"    if temperature > 75 and vibration > 4:        return "B — At Risk"    return "A — Normal"
```

> Show  tab to see algorithm as a flowchart: a decision diagram (start → one diamond per `if`, read top to bottom → "yes" exits to B — At Risk, three "no"s end at A — Normal).

This is traditional programming: humans provide the rules, and the computer executes them.

Show the performance of the algorithm (accuracy and precision)

### Where do these rules break down?

The rules get 20 of 30 machines right (67%). Each rule is a threshold on one feature, so together they carve the chart into rectangles — but the at-risk machines form an arch. Hot machines with low vibration (e.g. 88°C/2.3) are normal; cooler machines with moderate vibration (e.g. 51°C/5.1) are at risk.

We could add another rule. But what about the next exception?

As sensors, operating conditions, and interactions increase, manually defining and maintaining all the rules becomes expensive and error-prone.

The problem is no longer writing code. It is discovering the right rules.

## Page: Machine Learning  


UI
```
Intro (why ML)

┌ rail (collapsible ‹ ›) ──┬ main ───────────────────────────────────┐
│ Network configuration    │ Network diagram          [size slider]  │
│  hidden layers, activation,├───────────────────────────────────────┤
│  learning rate           │ Epoch │ Loss │ Network acc │ Rules acc  │
│ ──────────────────────── ├────────────────────┬────────────────────┤
│ [Show weights]           │ Decision plot      │ Accuracy chart     │
│ [Show math] (floating)   ├────────────────────┼────────────────────┤
│ ──────────────────────── │ Loss chart         │ Comments           │
│ [Step] [Train] [Reset]   │                    │ (status + notes)   │
└──────────────────────────┴────────────────────┴────────────────────┘

Classify a new example (below the workbench)
```
Flat, minimalist, hairline-bordered workbench; rows share the same edges. The rail collapses; on narrow screens it stacks above and rows stack. Show weights and Show math are independent: weights print on the diagram, math opens a draggable floating panel. The Network panel header has a top-right **ƒ Function** button that opens a modal with the whole forward pass written as one function of Temp and Vib, using the current learned weights and biases (live while training). Before the first epoch the decision plot is shown alone (resizable) and Comments takes the full last row.

3. Machine Learning — Learn the Rules from Data


Instead of writing the classification logic ourselves, we provide examples of machines with known outcomes.

The algorithm learns patterns that connect temperature and vibration to the target class.

In supervised machine learning, the programmer defines the learning procedure, but the model learns its parameters from labeled data.

### A small neural network

We can solve this classification problem with a simple feedforward neural network trained using backpropagation. Inform the NN is used

Default architecture: 2 inputs → 4 → 2 → 1 (tanh hidden, sigmoid output), trained by backpropagation with cross-entropy loss and mini-batch gradient descent on the same 30 machines. It separates all 30 (vs the rules' 20) within ~150 epochs; with 0 hidden layers it stays a straight line and stalls at 28/30. A teaching example; real model performance depends on data and training.

Show and simulate the neural network

Show nn config and run trianin. 

## Page: ML Components — moved

Moved to chapter 02, Machine Learning: see `26-10-11-machine-learning.md`.

# Page: Content — chapter summary

A self-contained recap for students, readable without running a simulation.
English and Brazilian Portuguese share the same charts and computed results.

1. **The problem:** predict Normal or At Risk from temperature and vibration.
   Show the shared 30-observation scatter plot, explain the curved pattern,
   and identify the data as synthetic teaching examples.
2. **Programming:** show the fixed Python rules and their decision boundary,
   ring incorrect predictions, and compute accuracy from `rulesScore`.
   Explain a false alarm (88°C, 2.3 mm/s) and a missed risk (51°C, 5.1 mm/s).
   The limitations apply to these rules, not to all traditional programs.
3. **Machine learning:** describe the default 2 → 4 → 2 → 1 network and
   predict / measure error / update / repeat cycle. Use `trainWithLossHistory`
   with the shared defaults, fixed seed and 300 epochs. Compute the score
   and decision boundary from that same network. Show its trained network diagram
   with connection weights and neuron biases always visible, rounded to two
   decimal places, explaining that these parameters are what training learned.
   Explicitly distinguish
   training accuracy from unseen-data performance, which is not measured here.
4. **Main takeaways:** compare results, useful contexts, logic, maintenance,
   interpretability and limitations. Discuss false alarms versus missed failures.
   “See it break — Learning patterns is not understanding” uses three labeled
   thought experiments: wrong labels, unrepresentative data/overfitting, and
   changed operating conditions. Each includes an explanation and a check.

All explanations and results are visible by default. Charts have explanatory
captions; figures and table rows avoid internal print breaks. Keep this reading
order suitable for a future student PDF handout. PDF export and complete print
layout support remain future work.

# Companion Simulation — Learn by Experimenting

The content page introduces the concepts. The simulation should let students experience the difference directly.

Temperature

65°C

Vibration

5.0 mm/s

Manual rule prediction

Based on the Python rules shown above

A — Normal

Try the known exception: 65°C, 5 mm/s

This first demonstration executes actual manual rules. The neural-network comparison should use a genuinely trained model, not a simulated prediction.

For the full interactive simulation, I would organize the experience into four stages:

1\. Create the rules

Students adjust temperature and vibration thresholds, observe predictions on the scatter plot, and see how many examples are classified correctly.

2\. Train a neural network

Students click Train. They see the decision boundary evolve as backpropagation updates the weights. Display epoch, training loss and accuracy.

3\. Compare the results

Show rules vs. neural network on the same held-out test examples. Students can compare accuracy and observe where the two approaches disagree.

4\. Make ML fail

Introduce mislabeled examples, reduce training data, or change the operating conditions. Let students discover overfitting and distribution shift.

# Build plan

- **Pass 1 (done):** the Problem page — hero, the two feature cards, the dataset table and the scatter chart. `apps/ai-intro/src/lessons/programming-vs-ml/{problem.tsx,dataset.ts}`, `apps/ai-intro/src/components/charts/scatter-chart.tsx`.
- **Pass 2 (done):** Programming (fixed rules, a code/flowchart toggle, a run-the-algorithm animation, "where rules break down"), an initial fixed-architecture Machine Learning page, and the Content page rewrite (the 5 numbered sections, replacing the earlier draft). New shared pieces: `src/lib/neural-net.ts` (generic MLP engine, reusable by chapter 02), `src/components/charts/{scales,decision-chart,line-chart}.tsx`, `src/components/code-block.tsx` (Shiki, dual light/dark theme).
- **Pass 3 (done):** rebuilt Machine Learning into a playground — configurable hidden layers/neuron counts, an activation picker (tanh/relu/sigmoid/linear; `neural-net.ts` genericized accordingly), a learning-rate preset and a noise slider, a ~120-point synthetic dataset with a train/test split (since replaced in Pass 4), a dual train/test loss chart (`line-chart.tsx` now multi-series), a decision-boundary chart with the learned 0.5-probability line drawn on top (`decision-chart.tsx`'s `showBoundaryLine`), and a live per-neuron "what it sees" thumbnail on every node (`activation-grid.ts`, canvas-based). Also corrected Programming/Content's prose: the fixed rules actually miss 3 of 12 rows (75% accuracy), not 1.
- **Pass 4 (done):** one shared 30-row "two moons" dataset for every page (replacing the 12 rows and the ML page's synthetic set; `ml-dataset.ts` removed). `neural-net.ts` now trains with cross-entropy and shuffled mini-batches (Gaussian init), as in the 1986 hidden-layers + backprop demo — the network separates 30/30 vs the rules' 20/30. ML page: 0–4 hidden layers, metric tiles (epoch, loss, network vs rules accuracy), an accuracy chart with the rules as a dashed baseline, a status line, and a rules-vs-network classify form. `decision-chart.tsx`'s boundary is now a marching-squares contour (curves can wrap); the network diagram is plain SVG (React Flow lost node measurements on every training update and rendered blank).
- **Pass 5 (done):** Programming now draws the rules' own decision regions and boundary (the same `DecisionChart` as ML, fed the rules as a 0/1 value — a stair-step of axis-aligned edges), rings the misses (`flaggedKeys` on `DecisionChart`), and plots running accuracy over the machines evaluated, with an explanation. ML: a "Show weights & math" toggle prints every weight/bias on the diagram and opens `network-math.tsx` (per-layer equations, a live worked forward pass for the "classify" machine, the cross-entropy loss and update rule); the accuracy and loss charts each carry a definition plus a post-training reading of the result.
- **Pass 6 (done):** built the "About Machine Learning" lesson (retitled "ML Components", `kind: "content"` so it now gets the chapter eyebrow/counter/footer) explaining Mitchell's (1997) learning definition and the Representation / Optimization / Evaluation split popularized by Miller (2017), with the book's cover (`public/references/mitchell-1997-machine-learning.jpg`, the app's first raster asset) and the chapter's own network as the running example for all three: a fresh untrained net for Representation, the cross-entropy loss + update rule for Optimization, and a 300-epoch-trained net's accuracy (vs. `rulesScore`) on a `DecisionChart` for Evaluation. `SectionTitle` moved from `content.tsx` into `lesson-layout.tsx` as a shared export; the `examples` array moved from `machine-learning.tsx` into `ml-training.ts` so both pages build it once.
- **Pass 7 (done):** widened ML Components into a general framework, not just one worked example. Hero line changed to "ML is composed of 3 components." A new 3-card summary strip (lucide icons) at the top. A new "What's being learned?" section introducing task types (classification, regression, clustering) before the three components, since Evaluation only makes sense per task. Each numbered section now opens with other algorithms' take on that component — decision trees, linear/logistic regression, and cluster centroids for Representation; greedy search, k-means' alternating updates, and closed-form least squares for Optimization; classification/regression/clustering metrics for Evaluation — before returning to the chapter's own network as the worked example, unchanged from Pass 6. Content grounded via web search (independently confirms the Representation/Evaluation/Optimization split and its usual examples) and the Mitchell-derived thesis excerpt pasted into this conversation.
- **Pass 8 (done):** sections 1–3 reverted to NN-only (Pass 7's inline "other algorithm" bullets removed — they only named things, never showed them). Added section 4, "Other examples": four cards — Decision tree, Clustering, Linear/logistic regression, and the NN again summarized — each broken into the same Representation/Optimization/Evaluation columns, every cell a real chart computed from the shared 30-machine dataset (`algorithm-examples.tsx`). New engine piece: `src/lib/kmeans.ts` (Lloyd's algorithm + silhouette score, no library, same hand-rolled convention as `neural-net.ts`), with `kmeans.test.ts`. `ml-training.ts` gained `fromInput` (inverse of `toInput`, for plotting centroids) and `trainWithLossHistory` (now shared by the NN and logistic-regression cards, and by section 3's `trainedNet`). `rule-flowchart.tsx` gained an optional `height` prop; `scatter-chart.tsx` gained an optional `markers` prop (small "×" marks, used for cluster centroids). "Why this split matters" renumbered to section 5. Section headers (`SectionTitle`, shared with `content.tsx`) and the page's own `<h1>` (`LessonHero`, shared by every lesson) made bigger and bold.
- **Pass 9 (done):** "Other examples" moved off the shared machines onto each algorithm's classic dataset, with representations native to each algorithm. Decision tree: ID3 on Play Tennis, drawn as a real top-down tree (new generic `components/charts/tree-diagram.tsx`), with information-gain bars and training vs leave-one-out accuracy. Linear regression: house prices, scatter + fitted line (new `line` prop on `ScatterChart`), RMSE curve, RMSE/R². Clustering: k-means (k = 3) on an Iris sample. The logistic-regression card was dropped in favour of a true regression task. New `src/lib/{decision-tree,linear-regression}.ts` with tests; `fromInput` removed (no longer used). Programming page: `RuleFlowchart` rewritten from React Flow to plain SVG as a decision diagram (start pill, diamond per rule, yes → At Risk, final no → Normal), and the `height` prop dropped.
- **Pass 10 (done):** Evaluation widened per task. Classifiers (decision tree, logistic regression, NN) show a confusion matrix plus accuracy, precision, recall, F1 and ROC AUC; regression shows MAE, MSE, RMSE, MAPE and R²; clustering adds an elbow chart and Davies–Bouldin next to silhouette. New logistic-regression card (exam pass vs hours studied) after linear regression. Regression representations now show the function with its fitted values above its chart; logistic plots P(pass) as a percentage. `ScatterChart`'s `line` prop now takes a list of points (a polyline), so it can draw the sigmoid.
- **Pass 11 (done):** ML Components moved out of this chapter into the new chapter 02, Machine Learning (`src/lessons/machine-learning/`); see `26-10-11-machine-learning.md` for it and the chapter's new lessons. Chapter 01 now has four lessons.
- **Companion Simulation lab (not built yet):** originally planned to repurpose the "About Machine Learning" lesson slot — that slot is now "ML Components" (Pass 6/7), so this lab has no lesson to land in and remains unbuilt. Needs a decision when prioritized: a 6th lesson (the course would no longer be 17 lessons), or folding a lighter version into an existing page.

- Dataset (`dataset.ts`) and the fixed rules (`rules.ts`, incl. `rulesScore`) are shared across all four pages; accuracy figures in the prose are computed from them, not hard-coded.
