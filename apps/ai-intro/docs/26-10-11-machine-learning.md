# Chapter: Machine Learning

Topic 02-Machine Learning. Follows chapter 01 (Programming vs ML) and precedes Neural Networks.

The chapter opens with the three components of every ML algorithm (Representation, Optimization, Evaluation), then zooms in on Evaluation: two lessons on bias (statistical and social), then one lesson per family of metrics. These lessons are content pages (`kind: "content"`), in `apps/ai-intro/src/lessons/machine-learning/`.

| Lesson | Slug | Running example |
|---|---|---|
| ML Components | `components` | Chapter 01's network, plus the "Other examples" gallery |
| Generalization / Bias & Variance | `bias-and-variance` | Polynomial curve fitting to a noisy sine (Bishop, 2006) |
| Generalization / Bias & Fairness | `fairness` | Synthetic loan applicants, two groups |
| Generalization / Data Splits | `data-splits` | Synthetic payments: 2% fraud, 10% minority group |
| Generalization / Generalization | `generalization` | Synthetic two-group data; neural network trained on 5 splits per scenario |
| Generalization / Summary | `summary` | Editable bilingual concept reference, saved in this browser |
| Metrics / Classification | `classification-metrics` | Exam pass vs. hours studied; synthetic payments for imbalance |
| Metrics / Clustering | `clustering-metrics` | k-means on 30 Iris flowers |
| Metrics / Regression | `regression-metrics` | Illustrative house prices (linear regression) |
| Metrics / Reinforcement Learning | `reinforcement-learning-metrics` | 5-armed bandit (ε-greedy) and a gridworld (Q-learning) |
| Metrics / Ranking & Recommendation | `ranking-metrics` | 4 illustrative search queries, two rankers |

**Hierarchy.** Two sidebar groups: "Generalization" (Bias & Variance, Bias & Fairness, Data Splits, Generalization with the interactive synthesis, then Summary as the editable reference) and "Metrics" (the five metrics lessons). The metrics lessons share `group: "Metrics"` in `curriculum.ts`: the sidebar shows them indented under a "Metrics" subheading and the breadcrumb reads Machine Learning / Metrics / lesson. URLs, the lesson counter and prev/next are unchanged (the group is display-only).

**Writing rule.** When prose lists two to five possibilities, render them as a numbered or bulleted list (`OptionList`) and set the one sentence to remember apart as a quote (`Takeaway`), both in `metric-section.tsx`.

## Metric lesson template

Every metric lesson uses the same layout (`metric-section.tsx`):

- Hero, lead, and one paragraph introducing the running example (with its data source, and "illustrative" or "synthetic" where the data is made up).
- One numbered section per metric (`MetricSection`): **What it measures**, **Why it matters**, a formula box, and a chart computed in the browser from the example.
- Under the formula box, a **"With our numbers"** box (`Worked`) repeats each formula with the example's actual values substituted — e.g. `precision = 8 / (8 + 2) = 0.80` — computed live, so it follows the sliders. Every metric lesson, Bias & Fairness, Bias & Variance and Data Splits use it.
- Where a single choice drives every metric (a classification threshold, a polynomial degree, an approval threshold), one `Slider` at the top updates every section.
- A closing **Cheat sheet** table (`CheatSheet`): metric, the question it answers, when to reach for it.

## Page: ML Components

UI
```
---------------------------
| Mitchell's definition   |
| + book cover citation   |
---------------------------
| Summary: 3 cards        |
| 1 Representation        |
| 2 Optimization          |
| 3 Evaluation            |
---------------------------
| What's being learned?   |
| (classification,        |
|  regression, clustering)|
---------------------------
| 1. Representation       |
|   NN example (live)     |
---------------------------
| 2. Optimization         |
|   NN example (live)     |
---------------------------
| 3. Evaluation           |
|   NN vs rules (live)    |
---------------------------
| 4. Other examples       |
|   4 cards × 3 columns,  |
|   each on its classic   |
|   dataset: decision tree|
|   (Play Tennis), linear |
|   regression (houses),  |
|   logistic regression   |
|   (exam), k-means       |
|   (Iris), NN            |
---------------------------
| 5. Why this split matters|
---------------------------
```

Every machine learning algorithm — not just this chapter's neural network — is built from three independent components (Mitchell, 1997; popularized as this split by Miller, 2017):

1. Representation — the shape a solution is allowed to take (a decision tree's splits, a regression's weighted sum, a network's graph of weighted nodes).
2. Optimization — the search that finds good parameter values within that shape, guided by one function to minimize or maximize (gradient descent, greedy splitting, k-means' alternating updates, a closed-form solve).
3. Evaluation — the measure used to judge a candidate solution, which depends on the task being learned (classification: accuracy/precision/recall/F1/log loss/AUC; regression: MSE/MAE/R²; clustering: silhouette/Dunn/Davies–Bouldin).

A short "What's being learned?" note introduces the task types (classification, regression, clustering) before the three components, since Evaluation in particular only makes sense per task. Sections 1–3 walk through the chapter's own network — a fresh, untrained net for Representation; the cross-entropy loss and update rule for Optimization; a 300-epoch-trained net's accuracy against `rulesScore` on a `DecisionChart` for Evaluation. Section 4, "Other examples," then works the same Representation/Optimization/Evaluation split for one algorithm per task type, each on the dataset it is usually taught with, plus the network again summarized. Each card follows one template: Task and Data lines, then three icon-headed columns, each with a chart computed in the browser and a short explanation; Optimization adds its formulas, Evaluation its metric definitions.

| Card | Data | Representation | Optimization | Evaluation |
|---|---|---|---|---|
| Decision tree (classification) | Play Tennis, Mitchell (1997) Table 3.2, 14 days | The tree ID3 actually learns (Outlook → Humidity / Yes / Wind), drawn top-down | Information gain per attribute at the root (Outlook 0.25 wins); entropy and gain formulas | Leave-one-out confusion matrix, accuracy, precision, recall, F1, ROC AUC (training 14/14 noted) |
| Linear regression (regression) | 14 illustrative house sales, area (m²) → price (k) | Function ŷ = w·x + b with fitted values, plus its graph over the data | RMSE falling over gradient-descent epochs; MSE and update rules | MAE, MSE, RMSE, MAPE, R², with definitions |
| Logistic regression (classification) | 20 students, hours studied → pass (Wikipedia's "Logistic regression" example; fit matches its 1.50·hours − 4.08) | Function p = σ(w·x + b) plus the sigmoid curve as P(pass) % over the data; 50% cut-off | Log loss over epochs; log-loss and update rules | Confusion matrix, accuracy, precision, recall, F1, ROC AUC |
| k-means (clustering) | 30 Iris flowers (10 per species, Fisher 1936), petal length/width, species hidden | Scatter colored by found cluster, × centroids | Inertia over iterations; inertia and centroid-update rules | Elbow chart (inertia for k = 1..6), silhouette, Davies–Bouldin, agreement with the hidden species checked afterwards |
| Neural network (classification) | This chapter's 30 machines | Network diagram | Loss over epochs; cross-entropy and update rule | The same classification metrics, on its training data (flagged as such) |

Engine pieces, all hand-rolled with tests: `src/lib/decision-tree.ts` (entropy, information gain, ID3), `src/lib/linear-regression.ts` and `src/lib/logistic-regression.ts` (gradient descent on standardized data), `src/lib/metrics.ts` (confusion-matrix metrics, rank-based ROC AUC, regression metrics), `src/lib/kmeans.ts` (Lloyd's algorithm, silhouette, Davies–Bouldin). Shared card UI (columns, formula boxes, metric lists, confusion matrix) lives in `algorithm-card.tsx`. Datasets live in `classic-datasets.ts`. The house prices are illustrative, not a real market sample, and the card says so.

**Metric explanations (gallery).** In every "Other examples" card the Evaluation metrics (`MetricList`) have a "What do these measure?" toggle that reveals a one-line what/why per metric (`metric-glossary.ts`) and links to the matching metrics lesson.

## Page: Generalization

The last page of the Generalization group: a synthesis of the group. `generalization.tsx`, `generalization-playground.tsx`, `generalization-data.ts`, `run-colors.ts`. Lead: the definition (Goodfellow, Bengio & Courville 2016, §5.2) and its three failures as a list — underfitting (bias), memorizing (variance), uneven generalization across groups (imbalance → fairness). Sections: 1 Why generalization ability is important — a concept → what goes wrong → how you see it → lesson table (bias, variance, imbalanced data, fairness) and how they connect; 2 The generalization gap (train − test, worked on the Good-fit network); 3 Scenarios — one tab each for Underfit (high bias), Good fit, Overfit (high variance) and Imbalanced (unfair); each tab holds a one-hidden-layer neural network with its config (neurons, training size, % random labels, minority share), trains it on 5 training splits (5 independent samples of the same size, each scored on the one fixed test set — explained in a short list), then shows one row per run (#1–#5: that run's training points with its own boundary and the dashed true boundary; its training vs test accuracy over epochs; its scores; a one-line comment from its own numbers — underfitting, overfitting, one group left behind or good fit) and an "All 5 runs" row (mean shading with every run's boundary — `DecisionChart`'s `boundaries` prop; mean training vs test accuracy over epochs; the per-run table with a mean row; worked mean gap / test spread / worst group; bias, variance and fairness diagnosis lines; the verdict). Tabs mount on first visit and stay mounted; 4 Finding the equilibrium (symptom → diagnosis → fixes). Presets verified over 5 runs: Underfit 70% train; Good fit 99/95%; Overfit 93/61% with test spread 0.27; Imbalanced group B 43%. Data: synthetic, group A wavy boundary, group B the flipped rule, fixed clean test set of 200 per group.

## Page: Bias & Variance

Lead as a numbered list (bias, variance) plus a takeaway. Opens with the classic 2 × 2 bullseye (`bullseye.tsx`: low/high bias × low/high variance, each dot one model trained on a different sample) beside short Bias and Variance definitions. Then a short list explaining polynomial degree (0 flat, 1 line, 2 parabola, 3 cubic, 9 through 10 points) with a takeaway, and an interactive degree slider that also shows the current polynomial (ŷ = w₀ + w₁x + …) and its coefficient count (fit, training vs. test error); 1 Underfitting (degree 1); 2 Overfitting (degree 9 through 10 points); 3 Training vs. test error by degree (U-shape); 4 Bias²–variance decomposition over 200 resampled training sets, with the σ² noise floor; 5 Validation and 5-fold cross-validation (fold diagram, CV vs. true test error, degrees ≤ 6 only — higher degrees can't be fitted on 8 points); 6 Learning curves for degree 1 and 9; 7 Diagnosis table (symptom → diagnosis → remedies); 8 Five splits, four combinations — the bullseye rebuilt from real fits: four panels (degree 3/30 points, degree 1/30, degree 9/10, degree 1/3 random points), each with 5 fits on 5 different training samples against the true curve, one color per run, with a per-run table of training vs. test MSE and a one-paragraph reading of each panel, captioned with the bias² and variance measured across them (`splitFits`). Computations: `curve-fitting.ts`, `src/lib/polynomial.ts`.

## Page: Bias & Fairness

Opens with a summary chart (`fairness-summary.tsx`): four cards — accurate and fair, accurate but unfair, inaccurate but fair, inaccurate and unfair — each showing two groups of 8 applicants (qualified / not, approved boxed) with TPR and FPR computed from the dots; then Bias and Fairness definitions and a "Class imbalance ≠ fairness" callout. Ends with section 9, Five splits, four models: four illustrative credit scores (`modelVariants`), each scored on 5 fresh samples (`splitScores`), plotted as accuracy vs. TPR gap with quadrant lines — including one split where a fair score looks unfair by chance.

Synthetic data (`loan-applicants.ts`): 150 applicants per group, base repayment 65% (A) vs 45% (B), and a score that under-rates B's repayers (measurement bias). A shared approval threshold drives: 1 Sources of bias (Suresh & Guttag, 2021) + score distributions; 2 Demographic parity; 3 Disparate impact ratio and the four-fifths rule; 4 Equal opportunity (TPR); 5 Equalized odds (TPR and FPR); 6 Predictive parity (precision); 7 The impossibility result (Kleinberg et al., 2016; Chouldechova, 2017) as gaps vs. threshold; 8 Cheat sheet.

## Page: Classification Metrics

Exam data and the logistic fit shared with the gallery (`classic-models.ts`). A threshold slider drives: 1 Confusion matrix (sigmoid chart with the threshold line); 2 Accuracy, plus the accuracy trap (1,000 payments, 10 frauds, an always-"not fraud" model); 3 Precision and recall vs. threshold; 4 F1 / Fβ vs. threshold, with macro/micro averaging noted; 5 Specificity and balanced accuracy; 6 MCC; 7 ROC curve and AUC; 8 Precision–recall curve and average precision; 9 Log loss; 10 Brier score and calibration (calibration curve and ECE on the synthetic payments: ROC AUC 0.98 yet badly calibrated); 11 Balanced vs. imbalanced data — and fairness: lazy vs. real fraud model across accuracy, balanced accuracy, F1, MCC, ROC AUC and PR AUC; a which-metric-when table; "Class imbalance ≠ fairness" with the four combinations and per-group evaluation (TPR, FPR, precision, calibration, log loss); 12 Cheat sheet.

## Page: Classification (Fairness)

`classification-fairness.tsx` follows the fraud-detection story: distinguish class
imbalance from demographic fairness; inspect the evaluation distribution; show
980 legitimate payments and 20 frauds; expose the lazy classifier’s 98% accuracy
and zero fraud recall; then evaluate a candidate with TP=14, FN=6, TN=940, FP=40.
The candidate detects more fraud, but its accuracy falls to 95.4% and its alert
precision is 25.93%. “Better” is conditional on the task and error costs.
Both model sections pair a confusion matrix with the same four performance
figures. The lazy matrix has TP=0, FN=20, TN=980, FP=0; its alert precision is
undefined because it never predicts fraud.

Every metric has an explanation, motivation, formula, substituted calculation,
range, interpretation, and adjacent chart: recall, specificity, FPR, precision,
accuracy, balanced accuracy, F1, Fβ (worked F2), MCC, ROC/AUC, PR/average precision,
log loss, binary Brier, calibration curve, and ECE. Average precision uses the
step-wise PR integral, not trapezoidal PR AUC. The class colors stay consistent.

A lesson-local fixture in `classification-fairness-data.ts` supplies four score
bands: 14 frauds at 0.8, six frauds at 0.2, 940 legitimate payments at 0.1, and 40
legitimate payments at 0.6. Threshold 0.5 reproduces the same confusion matrix.
The lazy probability baseline assigns 0.02 to everyone, so it has no fraud
predictions at 0.5 but perfect aggregate calibration on this illustrative sample.
The probabilities are constructed examples, not a trained model or calibrated
estimates. The shared `payments.ts` fixture is unchanged.

A short demographic-fairness bridge links to Bias & Fairness; these class totals
cannot establish group fairness. Immediately before Main Takeaways, a comparison
table gives every metric’s lazy and candidate results under a grouped Performance
header, plus a short interpretation and desirable score direction. Undefined lazy
precision is shown as a dash, and the zero-denominator MCC convention is explicit.
A final metric-selection table qualifies usefulness for balanced data, imbalanced
data, group assessment, and good-score interpretation. Both languages share all
calculations; score ranges are never presented as universal acceptance thresholds.

## Page: Data Splits

`data-splits.tsx`, `payments.ts`, `src/lib/splits.ts`. Lead: train / validation / test as a numbered list. 1 Train/validation/test holdout (proportion bar, common leaks); 2 k-fold cross-validation (shared `FoldDiagram`); 3 Stratified splits for imbalanced data (frauds per fold, random vs. stratified — one random fold has none); 4 Group-aware splits for fairness (group-B payments per fold, random vs. stratified by class × group; only 3 minority-group frauds exist, so no split covers every fold — splits make fairness measurable, they don't guarantee it); 5 Time-based and grouped splits (diagrams); 6 Cheat sheet.

## Page: Clustering Metrics

k-means (k = 1–8) on the Iris petal sample. 1 Inertia and the elbow; 2 Silhouette (per-point silhouette plot + mean vs. k; peaks at k = 2, setosa vs. the rest); 3 Davies–Bouldin; 4 Calinski–Harabasz; 5 External metrics: purity, cluster × species table, adjusted Rand index vs. k (peaks at k = 3); 6 Cheat sheet.

## Page: Regression Metrics

House prices and the linear fit. 1 Residuals plot; 2 MAE (|error| per house); 3 MSE and RMSE (with vs. without one outlier, showing RMSE's sensitivity); 4 MAPE (% error per house); 5 R² and adjusted R² (predicted vs. actual); 6 Cheat sheet.

## Page: RL Metrics

`rl-environments.ts`, `src/lib/reinforcement.ts`. Bandit (arms 0.2/0.5/0.35/0.8/0.6, ε = 0, 0.1, 0.3, 300 runs × 500 steps): 1 Average reward per step; 2 Cumulative regret; 3 Optimal action rate. Gridworld (4 × 5, pits, Q-learning, 40 runs × 150 episodes): 4 Episode return, with the learned policy drawn as arrows; 5 Episode length vs. the 7-step optimum; 6 Success rate and sample efficiency (episodes to 80% smoothed success); 7 Cheat sheet.

## Page: Ranking Metrics

`search-results.ts` (illustrative graded judgements 0–3), keyword vs. learned ranker. 1 Precision@k; 2 Recall@k; 3 Hit rate@k; 4 MRR (per query + mean); 5 MAP (per query + mean); 6 NDCG@k; a note on beyond-accuracy metrics (coverage, diversity, novelty, online A/B outcomes); 7 Cheat sheet.

## Shared engine pieces

All hand-rolled, each with tests in `src/lib/`: `metrics.ts` (confusion-matrix metrics at any threshold incl. specificity, balanced accuracy and MCC; Brier score, calibration curve, ECE; ROC and PR curves, average precision, log loss, regression metrics, adjusted R²), `kmeans.ts` (+ silhouette samples, Davies–Bouldin, Calinski–Harabasz, adjusted Rand index), `polynomial.ts`, `reinforcement.ts`, `ranking.ts`. New chart: `components/charts/bar-chart.tsx` (grouped bars, negative values, per-bar colors). `LineChart` gained `vLines` and negative y; `ScatterChart`'s `lines` takes several (optionally dashed) polylines.

# Build plan

- **Pass 1 (done):** chapter created; ML Components moved here from chapter 01 (slug `components`); metric explanation toggle on the gallery cards; Bias & Variance, Bias & Fairness, and the Classification, Clustering, Regression, RL and Ranking metrics lessons built.
- **Pass 2 (done):** Bias & Variance opens with the bias/variance bullseye diagram and two one-paragraph definitions.
- **Pass 3 (done):** Metrics group in the sidebar and breadcrumb; new Data Splits lesson; Bias & Fairness summary chart, definitions, imbalance callout and five-splits section; Bias & Variance five-splits panels; Classification gains specificity/balanced accuracy, MCC, Brier/calibration and the balanced-vs-imbalanced section; leads rewritten as lists with takeaways; pt-BR copy for everything new.
- **Pass 4 (done):** worked calculations ("With our numbers") added to every metric section across Classification, Clustering, Regression, RL, Ranking, Bias & Fairness, plus Bias & Variance (error gap, decomposition) and Data Splits (fair share per fold); Bias & Variance section 8 gives each run its own color with per-run training vs. test MSE.
- **Pass 5 (done):** new Generalization lesson heading a new "Generalization" sidebar group (with Bias & Variance, Bias & Fairness, Data Splits); three-tab playground (k-NN, neural network, polynomial) with presets that force underfitting, a good fit, memorization or an imbalanced failure; `src/lib/knn.ts`; pt-BR copy.
- **Pass 6 (done):** Generalization moved to the end of its group as the synthesis page; new "Why generalization ability is important" section; "Force a situation" became "Scenarios" — one tab per scenario, neural network only, each trained on 5 splits with per-run boundaries and scores; the k-NN and polynomial tabs and `src/lib/knn.ts` were removed; `DecisionChart` gained `boundaries`; run colors shared via `run-colors.ts`.
- **Pass 7 (done):** each scenario now shows one row per run (its own data, boundary and train/test accuracy curve, with a comment) plus an "All 5 runs" row with mean curves and bias / variance / fairness diagnosis lines; a short note explains the 5 splits; tabs mount lazily.
- **Pass 8 (done):** each scenario splits into two sub-tabs. **Dataset**: the data sliders (training size, % random labels, minority share), how the data was split into 5, split 1's training points with the group A | B divide, a class-by-group distribution chart (training splits vs test set), a per-split table (points, group A/B, class-1 share, wrong labels) and a "What to notice" note on the data's part. **Algorithm / Performance**: the hidden-neurons slider and training controls, the five run rows, the "All 5 runs" row and a "What to notice" note explaining the outcome (underfitting, good fit, overfitting, unfairness). The variance diagnosis now says when a big gap comes from group B rather than memorization.
- **Pass 9 (done):** per-group performance and fairness in every scenario. Each run's learning curve now plots training, test (all), and test accuracy for group A and group B. A new "Per group and fairness" block (mean of the 5 runs, test set) shows a grouped bar chart of accuracy, TPR, FPR, precision and selection rate per group, the Bias & Fairness criteria as gaps with ✓/✗ (demographic parity, disparate impact ≥ 0.8, equal opportunity, equalized odds, predictive parity; gap ≤ 0.15 passes), worked equal-opportunity / equalized-odds / disparate-impact lines, a fairness verdict by equalized odds, and a per-scenario fairness note. Measured: Good fit accurate and fair; Overfit fair but inaccurate; Imbalanced accurate for A, unfair to B; Underfit also unfair (group B's FPR about three times A's). Helpers: `groupReport`, `meanGroupReport`, `fairnessGaps` in `generalization-data.ts`.


---




## Page: Generalization Summary

`/learn/machine-learning/summary` closes the Generalization group with an editable
reference for Bias & Variance, Bias & Fairness, Data Splits, and Generalization.
Each concept includes a definition, practical interpretation, and source-lesson
link. A diagnosis table and personal-notes section close the document.

The lazy-loaded BlockNote editor supports text, headings, lists, checklists,
quotes, tables, links, formatting, undo/redo, and block reordering. Explicit
move-up/down buttons provide a keyboard alternative to dragging. The page uses
the course shell and themes, with an approximately 800px document column.

Each language has its own version-1 JSON document under
`ai-intro-generalization-summary:en-US` or `ai-intro-generalization-summary:pt-BR`.
Edits autosave after 500ms and flush on navigation, language changes, and page
exit. Failed writes remain in memory for the tab lifetime. Unreadable saved
content is preserved until an explicit, confirmed restore; restore affects only
the current language. There is no account, backend, upload, or collaboration.
