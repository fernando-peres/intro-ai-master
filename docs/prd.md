# AI Explained — Product Requirements

**Status:** Draft, open for review
**Owner:** Fernando Peres
**App:** `apps/ai-intro`

## Summary

AI Explained is an interactive course that **shows Machine Learning and Generative AI techniques at work**. Each topic starts from a real problem and shows how a technique solves it. It also shows where the technique **breaks down**, and that limitation is what motivates the next technique.

The course has two kinds of page:

- **Content** pages explain a topic: the problem, the idea and the vocabulary.
- **Simulation** pages are hands-on experiments. Students change inputs and parameters and watch the algorithm respond, which builds intuition that reading alone does not.

## Problem

People learning AI usually meet techniques as formulas, code snippets or hype. They can name a perceptron, a transformer or an agent, but they cannot say:

- **what problem** the technique was invented to solve,
- **why** it works, beyond "the maths says so",
- **where it fails**, and therefore why the field moved on.

Without that chain, the field looks like a list of unrelated tools instead of a story of problems and answers.

## Audience

| Who | Need |
|---|---|
| Students on an introductory AI course (primary) | Intuition first, maths second. Learn at their own pace. |
| Instructors | Project a simulation in class and change it live while explaining. |
| Self-learners and technical professionals | A quick, honest map of how ML leads to GenAI and then to agents. |

*Assumption:* no programming knowledge is needed to use a simulation.

## Goals

1. Every technique is presented as **problem → technique → limitation → next advance**.
2. Every chapter has at least one simulation where the student **sees the technique fail**, not only succeed.
3. A simulation can be understood in under a minute, with no setup and no account.
4. The course runs in a browser on a laptop or a projector.

## Non-goals (for now)

- Graded exercises, quizzes, certificates or learner accounts.
- Training real large models. Simulations use small, illustrative models and data.
- Mobile-first layout. Phones should work, but laptops and projectors come first.
- Writing code inside the app. Notebooks can be linked to later.

## How a chapter teaches

Each chapter follows the same arc:

| Step | Page kind | Purpose |
|---|---|---|
| 1. The problem | Simulation | Show a task the current approach struggles with. |
| 2. The technique | Content | Explain the idea that addresses it. |
| 3. See it work | Simulation | Let the student run it and tune it. |
| 4. See it break | Simulation | Push it to a failure case. |
| 5. What's next | Content | Name the limitation and point to the next chapter. |

**Example (chapter 01, Programming vs ML):** the student hand-writes rules to classify data and watches them fail on messy examples. They read that ML learns rules from examples instead. They fit a model and watch it succeed. Then they give it too little or skewed data and watch it overfit. That failure sets up why better models and more data matter.

## Curriculum and candidate simulations

The current curriculum has 5 chapters; `apps/ai-intro/src/curriculum.ts` defines the lesson order. The simulation ideas below are proposals to discuss.

| Chapter | Lesson | Candidate simulation | Limitation it exposes |
|---|---|---|---|
| 01 Programming vs ML | Problem | **Built.** A 30-machine factory-sensor dataset (temperature, vibration) plotted as a scatter chart, labelled Normal / At Risk — the classes interlock like two moons | No straight line separates the two classes |
| | Programming | **Built.** The fixed if/else rules as code or a flowchart; run them against the dataset and see which one breaks | Rules don't scale and break on edge cases |
| | Machine Learning | **Built.** A playground on the same 30 machines: configure hidden layers/neurons, activation and learning rate, train with backpropagation, and watch per-neuron views, the curved decision boundary and accuracy vs. the rules (100% vs 67%); classify a new example | Needs representative data |
| | Content *(content page)* | Explanation of ML vs classical programming | — |
| 02 Machine Learning | ML Components *(content)* | **Built.** Representation / Optimization / Evaluation, worked for the chapter's network and a gallery of classic algorithms | — |
| | Bias & Variance *(content)* | **Built.** Polynomial degree slider; training vs. test error, bias²–variance decomposition, cross-validation, learning curves | Overfitting and underfitting |
| | Bias & Fairness *(content)* | **Built.** Approval-threshold slider over two groups; parity, disparate impact, equal opportunity, equalized odds, predictive parity | Fairness criteria conflict |
| | Data Splits *(content)* | **Built.** Holdout, k-fold, stratified and group-aware folds on imbalanced payments, time and grouped splits | Splits make fairness measurable, not fair |
| | Generalization *(content)* | **Built.** Synthesis of bias, variance, imbalance and fairness; scenario tabs (underfit, good fit, overfit, imbalanced) each train a neural network on 5 splits | Low training error proves nothing; averages hide groups |
| | Summary *(content, closes Generalization)* | **Built.** Editable concept reference with separate English and Portuguese copies saved in the browser | Summaries and overall scores must be interpreted in context |
| | Metrics: Classification / Clustering / Regression / Reinforcement Learning / Ranking *(content)* | **Built.** One lesson per family: what each metric measures, why, its formula and a computed chart | Each metric hides some failure |
| 03 Neural Networks | Perceptron | Train a perceptron on 2D points | Cannot learn XOR, which motivates hidden layers |
| | Back-propagation | Deepen the Machine Learning playground — more hidden layers, pick the activation — and train it on XOR/moons | Vanishing gradients in deep stacks |
| | Activation Functions | Compare step, sigmoid, tanh and ReLU on the same task | Saturation and dead neurons |
| | Loss & Optimization | Ball rolling on a loss landscape, with a learning-rate slider | Local minima, divergence when the rate is too high |
| 04 Generative AI | Foundation Models *(content)* | **Built.** Pretraining → adaptation → assistant, with GPT-2's real next-token guesses | A foundation model continues text; it does not try to help |
| | Next Token | **Built.** GPT-2 generates token by token; probabilities, temperature, forcing a token | Sampling trades fluency for surprise; "Paris" is only the fifth guess |
| | Adaptation | **Built.** Theory of adaptation methods; zero-/few-shot classification on GPT-2 and the assistant; reviews become a post-training dataset | Prompting changes the context, not the weights |
| | Assistant Lab | **Built.** Chat with a post-trained model, with and without history | Without history, follow-ups lose their referent |
| | GPT → ChatGPT | **Built.** One input through the foundation model, the few-shot adapted model and the assistant | A base model sometimes answers correctly by chance |
| | Training Intuition › Pretraining *(content)* | **Built.** Raw web text as it was found, GPT-3's data mix, a sentence sliced into next-token examples, GPT-3 continuing a question instead of answering it | Self-supervision teaches what text looks like, not what you want |
| | Training Intuition › RLHF *(content)* | **Built.** The InstructGPT recipe as three data sets: written answers, ranked answers, prompts alone; before/after on the same prompt | A reward model learns preferences, not truth; tiny data, large behaviour change |
| | Training Intuition › DPO *(content)* | **Built.** The same rankings as chosen/rejected pairs, the update intuition, RLHF vs DPO side by side, the lab's toy prompt | No sampling means no exploration beyond the written pairs |
| | Transformers › Architecture | **Built.** Encoder / decoder / encoder–decoder; GPT-2's real attention per layer and head with the causal mask; a Q·K·V calculator | Attention weights are not an explanation of the model's reasoning |
| | Transformers › Pretraining | **Built.** Train a tiny GPT live on a small corpus; context → target rows with real probabilities; training vs validation loss; greedy generation | A toy model is not GPT-3 scale; a tiny corpus is memorised fast |
| | Transformers › Post-training | **Built.** SFT on demonstrations, ranking answers into preference pairs, a real tiny reward model and PPO on the toy GPT, or DPO on the same pairs, then base vs SFT vs RLHF side by side | Few demonstrations overwrite knowledge; a biased annotator trains a biased reward model; reward hacking |
| 05 LLM | Embeddings | **Built.** Real GloVe word vectors (analogies, neighbours, PCA map) and MiniLM sentence vectors (similarity matrix, pooling inspector), plus semantic vs keyword search over a small corpus | A 2D map distorts 300 dimensions; high similarity is not equivalence |
| | Prompting | The same task under different prompts | Brittleness, hallucination |
| | Fine-tuning | Before and after on a narrow task | Catastrophic forgetting, data cost |
| 06 Agents | Tools & Function Calling | Trace of a model choosing and calling tools | Wrong tool, wrong arguments |
| | Memory | Conversation overflowing the context window | Forgetting and retrieval errors |
| | Planning Loops | Step through a plan → act → observe loop | Loops that never converge, error compounding |
| | Multi-agent Systems | Agents passing messages to solve a task | Coordination overhead, cascading errors |

## Requirements

### Content pages

- **C1** Show a lesson counter (`LESSON nn / NN`), a headline, a lead paragraph and the body. No page shows a chapter eyebrow ("Chapter nn — …"); the breadcrumb already names the chapter.
- **C2** Show previous/next navigation. Only content pages have it.
- **C3** Every content page ends by naming a limitation and linking to what addresses it.

### Simulation pages

- **S1** Show no lesson counter and no previous/next footer. The simulation is the focus.
- **S2** One sentence states the problem the simulation demonstrates, and a short "what to notice" hint guides the student.
- **S3** Controls (sliders, toggles, buttons) update the visualisation immediately, in under 100 ms for typical interactions.
- **S4** A **reset** returns to the default state. Randomness uses a fixed seed, so a class sees the same result.
- **S5** At least one preset demonstrates the **failure case** ("Show me where it breaks").
- **S6** Simulations run entirely in the browser by default. Nothing is installed and nothing is sent to a server.

### Navigation and presentation

- **N1** The sidebar lists every chapter and lesson and highlights the current one.
- **N2** Five colour themes (dark, light, violet, mint, cobalt) for preference and projector contrast.
- **N3** WCAG 2.1 AA: keyboard-operable controls, visible focus, a text alternative for each visual state, 4.5:1 text contrast.

## Technical approach (initial)

- **Front end:** `apps/ai-intro` (React, TanStack Router, Tailwind, shadcn/Base UI). Content and simulation pages are registered per lesson. React Flow handles graph-style visuals such as networks and agent loops.
- **Simulation logic:** small TypeScript models running client-side by default.
- **Back end (optional):** `apps/algo-server` (FastAPI) with `packages/algo` (Python), for algorithms that are easier or more faithful in Python. A simulation only depends on it when the in-browser version would be misleading.

## Success measures (draft)

- A student can state, for each chapter, the problem, the technique and one limitation. Measured in instructor sessions.
- Instructors use at least one simulation live in each class.
- Every chapter has at least one failure-case simulation.

## Milestones (proposed)

1. **Chapter 01 complete.** All four pages: three simulations and the content page. This proves the problem → technique → limitation pattern.
2. **Chapter 03 (Neural Networks).** The XOR failure leads to hidden layers.
3. **Chapters 04–05 (LLMs, Agents).** Decide which simulations need the Python back end.
4. **Polish.** Accessibility pass, presenter mode for instructors.

## Open questions

1. Should each chapter have exactly one content page, or one per technique?
2. Should the lesson counter count **all** pages or **content pages only**? Simulations currently show no counter.
3. Do LLM simulations use a real (small) model, cached real outputs, or a scripted imitation? This trades honesty against cost and offline use.
4. Is a presenter mode (larger type, hidden sidebar) needed for teaching?
5. Is there a glossary, and how do the top bar's COURSE, GLOSSARY and RESOURCES links work?
6. Should progress be remembered between visits, given that there are no accounts?
