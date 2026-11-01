# Training Intuition: the data behind pretraining, RLHF and DPO

**Status:** Built.
**App:** `apps/ai-intro` (content lessons only; no server calls)
**Chapter:** 04 Generative AI → group **Training Intuition** (`/learn/generative-ai/intuition-pretraining`, `/intuition-rlhf`, `/intuition-dpo`), between GPT → ChatGPT and the Transformers group.

## Purpose

The Transformers group *computes* pretraining and post-training on a toy GPT. These three pages give the intuition those labs confirm, framed on GPT-3 → InstructGPT → GPT-3.5: each task the assistant had to learn needed a **different kind of data**, and each kind of data needed a **different training technique**.

| Page | Data | Signal | Technique |
|---|---|---|---|
| Pretraining | raw text, hundreds of billions of tokens, no labels | the next token of the text itself (self-supervised) | next-token prediction |
| RLHF | written answers → ranked answers → prompts alone | labelers, then a reward model trained on their rankings | SFT → reward model → PPO |
| DPO | the same ranked answers, as chosen / rejected pairs | the pairs directly, against a frozen reference | DPO loss |

Every page ends with the same three recipe cards (`TechniqueSummary`), the current page highlighted, so the comparison is always one scroll away.

## Historical frame and sources

- GPT-3 (Brown et al. 2020), Table 2.2: Common Crawl (filtered) 410 B tokens at 60 % of training, WebText2 19 B at 22 %, Books1 12 B at 8 %, Books2 55 B at 8 %, Wikipedia 3 B at 3 %; 175 B parameters; about 300 B tokens seen in training.
- InstructGPT (Ouyang et al. 2022), §3 and Figure 1: about 40 contractors; roughly 13 k prompts with written demonstrations (SFT), 33 k with ranked answers (reward model), 31 k prompts alone (PPO). The moon-landing prompt, GPT-3's continuation ("Explain the theory of gravity to a 6 year old…") and InstructGPT's answer ("People went to the moon…") are quoted from that figure.
- DPO (Rafailov et al. 2023): the loss is shown in Unicode; the "RLHF or DPO" table states the trade-off (no sampling, no reward model, no exploration beyond the pairs).

Everything else on the pages, the four web-text snippets, the three demonstrations, the Australia ranking and its reward-model scores, the before/after probabilities of DPO, is authored and badged accordingly.

### Execution-mode rule

These pages compute nothing, so only two badges appear: `historical illustration` for figures and quotations from the papers, `conceptual illustration` for authored examples. The toy prompt on the DPO page mirrors the Post-training lab's France preference prompt and a test checks the strings against `packages/genai/src/genai/toy_corpus.py`.

## Pages

Files in `apps/ai-intro/src/lessons/generative-ai/`: `training-intuition-data.ts` (authored samples and the three recipes), `training-intuition.tsx` (shared pieces), one file per page, `training-intuition.test.tsx`.

**Typography.** The pages are deliberately larger than the rest of the app: body copy 19 px, data samples in 26 px display type with their prompt in 22 px, takeaways 24 px, tables 19 px. `Takeaway` gained an optional `className` for this. Colours follow `docs/branding.md`: the three techniques are a method comparison (misc bucket, `chart-warm` / `chart-amber` / `fg-secondary`, the same trio as the chapter's stages); chosen / rejected is a preference, not a verdict, so it uses `chart-warm` / `fg-muted`, never `success` / `error`.

### Pretraining (`training-intuition-pretraining.tsx`)

1. **The data: text as it was found** — four snippets (encyclopedia, forum post, code, news), the GPT-3 mix table, the scale row (175 B · 300 B · 0 human labels).
2. **Where the label comes from** — the slicer: "The capital of France is Paris." as word buttons; clicking a word shows context → target in big type and highlights that row in the list of six training examples. Takeaway: one sentence, six examples, zero labellers.
3. **What the model generates** — the moon-landing prompt and GPT-3's continuation; it continues, it does not answer.
4. **What this kind of data can and cannot teach** — two lists; link to Transformers › Pretraining.

### RLHF (`training-intuition-rlhf.tsx`)

1. **Demonstrations** — three prompt + written-answer samples; imitation on the answer tokens only; teaches the format, not facts.
2. **Comparisons** — one prompt, four answers in the labeler's order with notes (correct and concise · correct but longer · confident but wrong · irrelevant), then the reward model's scores as bars. Takeaway: it learns preferences, not truth.
3. **Reinforcement learning** — prompts alone; sample → score → nudge, the KL leash in one sentence; the InstructGPT counts.
4. **Same prompt, before and after** — GPT-3 vs InstructGPT on the moon-landing prompt.
5. **Three steps, three kinds of data** — table (data · who makes it · signal · what changes); link to Transformers › Post-training.

### DPO (`training-intuition-dpo.tsx`)

1. **The same data, as pairs** — one chosen / rejected pair, then the six pairs a ranking of four produces (`pairsFromRanking`).
2. **The update** — before/after bars for the chosen and the rejected answer (illustrative), the loss in Unicode, "the model is its own reward model".
3. **RLHF or DPO** — comparison table: data, extra networks, generation during training, cost and stability, what each gives up.
4. **Toy scale** — the lab's France prompt and four candidates, pointing at the "3b · Direct Preference Optimization" panel (the lab has no deep link; the DPO and PPO branches are exclusive on one run).
5. **One idea across the three pages** — the three data → technique lines and the closing takeaway.

## Decisions and limits

- **No server.** A test stubs `fetch` and asserts no call; the pages render offline.
- **English bodies.** The chapter's sidebar titles are translated (`i18n/curriculum.ts`: Pré-treino · RLHF · DPO, group "Intuição de treino"); the bodies stay English like the rest of chapter 04 outside the Transformers group. The new files are not in `transformers-ptbr.test.ts`'s scan.
- **Titles repeat.** "Pretraining" appears under both Training Intuition and Transformers; the sidebar and breadcrumb show the group, the footer shows the bare title.
- **No ADR.** A content feature inside existing boundaries.

## Verification

From `apps/ai-intro`: `pnpm typecheck`, `pnpm lint`, `pnpm test`. `training-intuition.test.tsx` covers registration and the no-fetch rule; on Pretraining the four samples, the six-row mix table, the slicer (click → target, `aria-pressed`, current row, first word disabled), the quoted continuation, the lab link and the footer order; on RLHF the three demonstrations, the four ranked answers and a score, the four InstructGPT figures, both quotations, the five-column table and the footer; `pairsFromRanking`; on DPO the pair group, the six pairs, the shift's label, the comparison table, the toy prompt's five samples, the highlighted summary card and the footer; and the mirror of the toy prompt against `toy_corpus.py`. `curriculum.test.ts` pins the group's position and kind; `transformers-ptbr.test.ts` pins the Portuguese titles.

Manual: open the three pages, check the group sits between GPT → ChatGPT and Transformers, the type is visibly larger than Foundation Models, the slicer responds, badges read correctly, dark and light themes, 390 px width, and that PT-BR changes only the sidebar and breadcrumb.
