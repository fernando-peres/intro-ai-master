# Adaptation lesson: Theory + Lab tabs, post-training dataset

## Context
The "Adaptation Lab" page today is only a tool. It runs zero-shot or few-shot classification on GPT-2 or the assistant, and it describes fine-tuning without running it. It never explains what adaptation is, or how adaptation turns a foundation model into a usable model. It never says which models answer, and it never shows what an adaptation task *produces*. The user wants these changes:
- The page is renamed **Adaptation**.
- A **Theory** tab explains the concept, then focuses on adaptation as the path from foundation model to adapted model (post-training). It lists the methods split by whether they change the weights, each with its meaning and an example.
- A **Lab** tab holds the tool. It shows a one-line hint per method, names the models it uses, and shows the full process. That process ends with the student's labelled/corrected observations becoming a **post-training dataset**: demonstration data for SFT and preference data (chosen vs rejected) for RLHF/DPO.

Terminology (checked on the web): InstructGPT (Ouyang et al., 2022) calls these **demonstration data** (prompt → desired output, used for SFT) and **comparison data**, also known as **preference data** (rankings of outputs, used for the reward model + PPO). DPO uses the same preference pairs `{prompt, chosen, rejected}` without a reward model. "Post-training" = SFT + preference optimization applied to a pretrained model.

## Files
- `apps/ai-intro/src/lessons/generative-ai/adaptation-lab.tsx`: main rewrite (keep slug `adaptation-lab`, so URLs stay stable)
- `apps/ai-intro/src/lessons/generative-ai/adaptation-lab.test.tsx`: update + new tests
- `apps/ai-intro/src/curriculum.ts`: title `"Adaptation Lab"` → `"Adaptation"`
- `apps/ai-intro/src/lessons/generative-ai/foundation-models.tsx`: link text "Adaptation Lab" → "Adaptation"
- `apps/ai-intro/README.md`: lab list wording
- `apps/ai-intro/docs/26-10-16-foundational model.md`: section 3 rewritten to the new design (docs are the source of truth). Also drop the stale "stage strip" sentence and rename "Next-Token Lab" → "Next Token" there.

No server change: `/genai/few-shot` already returns `prompt`, `output`, `label`, `scores`, and `/health` already returns `base_model` and `assistant_model`.

## Page structure
Hero `Adaptation`, short lead, then a tablist that copies the pattern in `lessons/machine-learning/classification-metrics.tsx:312-332` (`role="tablist"`, `role="tab"` with `aria-selected`, `role="tabpanel"` with `hidden`). Tabs: **Theory** (default) · **Lab**. Both panels stay mounted (`hidden`), so lab state survives switching.

### Theory tab
Reuses `SectionTitle`, `OptionList`, `Takeaway` (from `../machine-learning/metric-section`) and `PipelineDiagram labels`.
1. **What adaptation is**: adjusting a pretrained model so its general skill serves a specific task, domain or behaviour, without training from scratch. Example: GPT-2 continues "Review: … Sentiment:" with any word; adapted, it answers with a label.
2. **From foundation model to adapted model**: pretraining → *post-training* → assistant. Post-training uses two kinds of observations: demonstrations (SFT) and preferences (RLHF/DPO). Example: ChatGPT = GPT-3.5 + demonstrations + human rankings. Takeaway: "Pretraining develops capabilities; post-training turns observations of desired behaviour into weight changes."
3. **Types of adaptation**: one table with groups as row headers (`Changes the weights` / `Partially` / `Does not change the weights`). Columns: Technique · What it means · Example.
   - Changes weights: Continued pretraining (more unlabelled domain text, e.g. legal or medical text) · SFT (input → desired output pairs, e.g. reviews with correct labels) · Preference optimization: RLHF, DPO (people choose the better of two answers, e.g. "Mixed" chosen over "Positive")
   - Partially: PEFT / LoRA (base weights frozen; small added matrices trained, e.g. a 1–2 MB sentiment adapter)
   - Does not change weights: Prompt engineering / few-shot (instructions and examples in the prompt, e.g. the lab's three labelled reviews) · RAG (documents retrieved at question time and pasted into the prompt, e.g. company return policy)
   - Takeaway: "Prompting changes the context. Fine-tuning changes the weights."
4. **Where the lab fits**: you run the no-weight methods live, and your corrected results become the observations a weight-changing method would train on. Button "Open the lab" switches tabs.

### Lab tab: the tool, as a 3-step process
The existing `Workbench` + `ConfigRail` layout stays.

**Rail**
- *Adaptation method*: Zero-shot · Few-shot (run live) · Fine-tuned (SFT, explained). Each gets a one-line hint only, e.g. "Prompt only. Weights unchanged." / "Examples in the prompt. Weights unchanged." / "Examples train new weights. Not run live."
- *Model*: **Base · GPT-2 (124M, local)** and **Assistant · {assistant_model from /health, default gpt-5.4-mini}**, each with a one-line note: "Foundation model, never instruction-tuned" / "Already post-trained by OpenAI." `useHealth()` from `./api` provides the live names, and `ServerNotice` stays.
- *Task*: unchanged.

**Main area**
1. **Demonstrations**: the existing examples editor, renamed from "Training examples" (still "in the prompt" for few-shot).
2. **Classify**: the existing review textarea + prompt preview + `Result`.
3. **Review → observations**: under the latest result, the student marks the prediction ✓ correct, or ✗ and picks the right label. Each review appends an observation:
   - correct → demonstration `{prompt, completion: label}`
   - corrected → demonstration with the right label **and** a preference pair `{prompt, chosen: right label, rejected: model's label}`
   - A new **"Post-training dataset"** panel shows the counts (demonstrations / preference pairs), a JSONL preview (`pre` block, same styling as the prompt preview) and a **Download .jsonl** button (Blob + anchor, no server). It also carries an explanation: "Nothing here changed GPT-2's weights. A post-training job would use these observations: SFT trains on the demonstrations; RLHF or DPO trains on the preference pairs. The result is a new set of weights that no longer needs the examples in the prompt." Plus a note on scale: real post-training uses thousands of observations; you collected N.
   - The "Your runs" table stays and gets a "Review" column (✓ / ✗→label / —).
- When **Fine-tuned** is selected, `FineTuningPanel` stays, with its flows fed by the collected dataset ("your N demonstrations → training → new weights").

Theory gets the full meaning and example of each method; the tool gets only the short hints.

## Implementation notes
- Split into small components in the same file (`TheoryTab`, `LabTab`, `ReviewControls`, `DatasetPanel`). If the file grows past ~600 lines, move the theory into a sibling `adaptation-theory.tsx`.
- The observation type lives in the file: `type Observation = { kind: "demonstration" | "preference"; prompt: string; completion?: string; chosen?: string; rejected?: string }`. Build JSONL in a pure function `toJsonl(observations)` and export it for a unit test.
- Every visible string goes through `t()`. No pt-BR translations are added (AGENTS.md: translate only when asked), so new strings fall back to English.
- Docstrings follow the AGENTS.md budgets.

## Verification
- `pnpm --filter ai-intro exec tsc --noEmit`, `npx biome check src`, and `npx vitest run src/lessons/generative-ai src/curriculum.test.ts` from `apps/ai-intro`.
- New tests in `adaptation-lab.test.tsx`:
  - The Theory tab is selected by default, shows the weight-change table, and the Lab tab reveals the tool.
  - After Classify, ✓ adds 1 demonstration; ✗ + "Mixed" adds a demonstration + a preference pair with `chosen: "Mixed", rejected: "Positive"`; the JSONL preview contains them.
  - The rail shows the assistant model name from `/health`.
  - Existing tests are updated to click "Lab" first.
- Manual: run the app + `uv run fastapi dev apps/algo-server/src/algo_server/main.py`, open /learn/generative-ai/adaptation-lab, classify zero-shot → mark wrong → few-shot → mark correct, then download the .jsonl and check its contents.
