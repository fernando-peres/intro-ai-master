# Transformers: architecture, pretraining and post-training of a GPT-like model

**Status:** Implemented in full: Phases 1 (Architecture), 2 (Pretraining), 3 (Post-training), 4a (DPO branch), 4b (encoder attention), 4c (LoRA) and 4d (pt-BR copy).
**Apps:** `apps/ai-intro` (lessons), `apps/algo-server` (model endpoints)
**Package:** `packages/genai`
**Chapter:** 04 Generative AI → group **Transformers** (`/learn/generative-ai/transformer-architecture`, `/pretraining`, `/post-training`)

## Purpose

Chapter 04 shows *what* a foundation model does (Next Token), how prompting and post-training data adapt it (Adaptation) and what the assistant looks like afterwards (GPT → ChatGPT). This group shows *how*: the network inside, how it is pretrained, and how post-training changes it. Students should leave able to keep three things apart:

1. **The Transformer is an architecture.** A way of wiring a network so tokens can look at each other through attention. BERT, GPT-2, GPT-3 and T5 are all Transformers.
2. **GPT is a model family** built on the Transformer's decoder. Its weights come from pretraining on next-token prediction.
3. **Pretraining, post-training and inference are activities** you do with that architecture. Training changes weights; inference and in-context examples do not.

Teaching principle, carried through every lesson: post-training did not install a list of new tasks. Most of GPT-3.5's abilities already existed in pretrained GPT-3; post-training made them reachable through plain instructions and improved conversational behaviour, instruction following and alignment with preferences.

### Historical frame

| Milestone | Year | Main contribution |
|---|---|---|
| Transformer | 2017 | Attention-based architecture with an encoder and a decoder |
| GPT-2 | 2019 | Large decoder-only autoregressive language model |
| GPT-3 | 2020 | Scaling, strong in-context few-shot learning |
| InstructGPT | 2022 | Instruction following through SFT, a reward model and RLHF |
| GPT-3.5 / ChatGPT | 2022 | Conversational, instruction-following assistant |

The UI labels this "GPT-3 → InstructGPT → GPT-3.5-era ChatGPT: conceptual evolution". OpenAI described ChatGPT's training as supervised dialogue fine-tuning, then reward modelling and PPO-based RLHF; the complete training history and datasets of the GPT-3.5 family are not public. The lessons teach the published method, never an exact checkpoint-to-checkpoint reproduction, and never present an open-weight model as GPT-3.

### Execution-mode rule

Every number on screen says where it came from, with a `ModeBadge` beside the panel title:

| Mode | Meaning | Examples |
|---|---|---|
| `real` | computed by a live model | GPT-2 attention weights and next-token probabilities; the toy model's loss |
| `simulation` | toy numbers the student edits, run through the real formula | the Q·K·V calculator |
| `historical illustration` | authored, from the published papers | the milestone table, the illustrative reward table |

From Phase 2 on, every API response and saved experiment carries `execution_mode` as a required field.

## Module → lesson map

The pasted source specification describes five modules. Two already exist in this chapter and are linked, not rebuilt.

| Module | Lesson | Phase |
|---|---|---|
| 0 Architecture explorer | `transformer-architecture` (new) | 1, built |
| 1 Pretraining | `pretraining` (new) | 2, built |
| 2 Base-model inference | existing `next-token-lab`; zero/one/few-shot already in `adaptation-lab` | — |
| 3 Post-training | `post-training` (new) | 3, built |
| 4 Post-trained inference | existing `gpt-to-chatgpt`, plus its "Same lineage, toy scale" row | 3, built |

Sidebar: the three lessons form the group **Transformers** at the end of chapter 04. The chapter-05 `llm/transformers` placeholder was removed to avoid two entries with the same name.

## 1. Architecture (built)

Two tabs, **Theory** (default) and **Lab**; both stay mounted so lab state survives switching (the Adaptation pattern).

### Theory (`transformer-theory.tsx`)

1. **An architecture, not a model.** Vaswani et al. 2017; architecture vs weights vs recipe; the milestone table with its `historical illustration` badge.
2. **Three variants.** `TransformerVariantsDiagram` (encoder, decoder, encoder–decoder stacks; attention blocks share one colour, cross-attention drawn as a dashed arrow) and the table:

   | Architecture | Attention | Example | Typical uses |
   |---|---|---|---|
   | Encoder-only | bidirectional self-attention | BERT | classification, extraction, representations |
   | Decoder-only | causal self-attention | GPT-2, GPT-3 | generation, completion; assistants after post-training |
   | Encoder–decoder | encoder self-attention, decoder causal attention, cross-attention | T5, BART | translation, summarization, text-to-text |

   Takeaway: an encoder can use both sides of a token; a causal decoder cannot see the future, which is what lets it be trained on next-token prediction.
3. **Inside a block.** Attention mixes information between tokens; feed-forward transforms each token alone. `Q = X·W_Q`, `K = X·W_K`, `V = X·W_V`; `Attention(Q, K, V) = softmax(Q·Kᵀ/√d_k + M)·V`; the mask `M` is 0 or −∞, so a decoder's weights above the diagonal are exactly zero. The last block feeds the vocabulary logits whose softmax the Next Token lab shows. Formulas are Unicode text (the app has no math renderer).
4. **Where the labs fit.** Training vs inference: known targets / unknown future tokens · forward + backward / forward only · loss + optimizer / decoding strategy · parameters change / parameters fixed · all positions in parallel / one token at a time. Links to Next Token, Adaptation and GPT → ChatGPT, and an **Open the lab** button.

### Lab (`transformer-architecture.tsx`)

```text
ServerNotice (base model)
┌ rail ─────────────────────┬ main ──────────────────────────────────────────────┐
│ Example: River bank vs.   │ Text A column            │ Text B column (optional)│
│   money bank · The cat    │  Attention · layer 5 ·   │  same three panels      │
│   sat on the · Custom     │   head 0        [real]   │                         │
│ Text A [≤ 200 chars]      │   token strip → heatmap  │                         │
│ Text B [≤ 200, optional]  │  What “bank” attends to  │                         │
│ Layer [− 5 +] Head [− 0 +]│   top-5 bars             │                         │
│ ☐ Mean of heads           │  Next token after the    │                         │
│ [▶ Inspect]               │   last position  [real]  │                         │
├───────────────────────────┴──────────────────────────┴─────────────────────────┤
│ Q · K · V calculator [simulation]: 3 editable token vectors, fixed W_Q/W_K/W_V,  │
│ Causal mask switch, Q, K, V, QKᵀ/√d_k, output tables and a small heatmap         │
└──────────────────────────────────────────────────────────────────────────────────┘
Note: attention weights are one window into the model, not an explanation of its reasoning.
```

- **Model.** *GPT-2 · decoder* (12 layers × 12 heads, causal) or *BERT small · encoder* (`google/bert_uncased_L-4_H-512_A-8`, 4 layers × 8 heads, 29 M parameters, about 115 MB downloaded on first use; it borrows BERT base's identical uncased WordPiece tokenizer because the small checkpoints ship no fast one). Switching resets the layer to the model's default (5 and 0), the head to 0, the texts to that model's presets, and clears the results. The spec's `bert-tiny` idea was measured and dropped: its 2 layers put "bank" on `[CLS]`/`[SEP]` and at most 0.09 on "river".
- **Presets.** For GPT-2, *River bank vs. money bank* is the decoder-honest form of the classic encoder example: `He fished from the river bank` / `She deposited money at the bank`, the disambiguating word *before* "bank" so causal attention can reach it. For BERT small it is the classic form, `The bank is beside the river.` / `She deposited money at the bank.`, where the cue comes after. *The cat sat on the* (GPT-2) and *The cat sat on the mat* (BERT) give one text. Editing a text switches the example to *Custom*.
- **Inspect** posts `{text, layer, top_k: 5}` once per non-empty text. The reply holds every head of the chosen layer, so **Head** and **Mean of heads** switch client-side with no request; changing **Layer** shows "Layer changed: press Inspect".
- **Heatmap** (`attention-heatmap.tsx`): rows are query tokens, columns key tokens, cell opacity is the weight (`chart-warm`, a magnitude, not a class). Future keys are hatched for the decoder; the encoder's rows are unmasked and include `[CLS]` and `[SEP]`. A token strip of `aria-pressed` buttons selects the query row; the default is "bank" when the text has one, else the last token. The SVG is `role="img"` and its label names the selected token and its strongest key.
- **What “bank” attends to**: the selected row's top-5 keys as `CompareBars`, with each key's position.
- **Next token after the last position**: GPT-2's top-5 continuations, linking to Next Token. The panel is absent for the encoder, which predicts no next token.
- **Calculator** (`attention-calculator.tsx`, `attention-math.ts`): `scaledDotProductAttention(X, W_Q, W_K, W_V, {causal})` on three 2-D token vectors; the student edits X and toggles the mask. Note: in GPT-2 every head in every layer has its own learned projections and `d_k = 64`.

Observed with BERT small, layer 0 head 4: bank → river 0.88 in the first sentence and bank → money 0.76 in the second, the same head doing both, looking forward and backward. Observed with GPT-2: "bank" attends to "river" strongly in many heads (layer 5 head 6: 73%; layer 4 head 11: 100%; layer 3 head 3: 79%), while "bank" → "money" only appears at layer 11 head 8 (52%). Averaged over heads, every sentence puts most weight on its first token (0.68–0.73), the well-known attention sink, which is why the rail tip steers students to single heads. GPT-2's tokenizer splits "fished" into " f" + "ished", a useful aside on tokenization. Next tokens after "The cat sat on the": " floor" 8%, " bed" 7%, " couch" 5%.

## 2. Pretraining (built)

Goal: watch a decoder-only Transformer learn next-token prediction, with every number computed by the model on screen.

### Toy model (`packages/genai`)

- `toy_corpus.py`: seven selectable corpora of authored sentences — General text (facts, capitals), Narrative (a dragon story), Code (one-line Python), Structured text (`Name: Ana; City: Lisbon; Country: Portugal`), Multilingual (Portuguese), Noisy text (General plus exact duplicates and typo variants) and Everything (all clean corpora, about 1 600 tokens, 480-word vocabulary). `tokenize` keeps a word's leading space like GPT-2 (`"".join(tokens)` is the text). `prepare` cleans whitespace, drops exact duplicates (counted), gives every 10th document to validation and joins documents with newline tokens. Unknown words map to `<unk>`.
- `toy_gpt.py`: `ToyGPT`, a 2-layer, 2-head, `d = 32` pre-LayerNorm decoder with learned positions, context 32 and an output head tied to the embedding (about 50 k parameters). `Trainer` owns the model, AdamW (lr 3e-3), a seeded generator and the loss history; `train(k)` runs *k* steps on random 32-token windows and records train and validation loss after every step; `probe(text)` scores every position of the last 32 tokens (context → target, `p(target)`, `−ln p`, top-5); `generate_steps` has the `BaseLM` contract; `save`/`load` keep model, optimizer, step and history. A run stops at `MAX_STEPS = 2000`.
- `checkpoints/toy-gpt-all.pt` (580 KB) is the trainer after 800 steps on Everything with seed 0, regenerated with `uv run python -m genai.toy_gpt --steps 800`. Observed: train loss 6.2 → 0.13, validation 6.2 → 4.5 at step 100 and back up to 8.6 at step 800 (the corpus is tiny, so memorisation starts early), `p(Paris | The capital of France is)` = 0.56.

### Endpoints (`algo-server`, `toy_routes.py`)

Runs live in an in-process `OrderedDict` (120 most recent, about 200 MB once post-trained; a new run evicts the oldest). No job queue, database or streaming: every request finishes synchronously.

| Endpoint | Body | Reply |
|---|---|---|
| `GET /api/genai/toy/corpora` | — | per corpus: `id, title, purpose, sample, documents, duplicates_removed, tokens, vocab_size, train_tokens, val_tokens, context_len, has_checkpoint` |
| `POST /api/genai/toy/runs` | `corpus` (default `all`), `seed`, `pretrained` | `RunState {run_id, corpus, step, max_steps, params, vocab_size, context_len, random_guess_loss, history[{step, train_loss, val_loss}], execution_mode: "real"}`; 404 unknown corpus, 400 `pretrained` without a checkpoint |
| `POST /api/genai/toy/runs/{id}/train` | `steps` 1–200 | `RunState`; 404 lost run, 400 past the step cap |
| `POST /api/genai/toy/runs/{id}/probe` | `text` ≤ 300 chars, `top_k` ≤ 10 | `{tokens, truncated, positions[{index, context, target, prob, loss, top_k}]}` |
| `POST /api/genai/toy/runs/{id}/generate` | `prompt`, `max_tokens` ≤ 40, `temperature`, `top_k`, `seed` | `{model: "toy-gpt", steps}` with the `/genai/complete` step shape |

### Page (`pretraining.tsx`, `pretraining-panels.tsx`)

```text
ServerNotice
┌ rail ──────────────────────┬ main ───────────────────────────────────────────────┐
│ Corpus (select, purpose,   │ Dataset [real · toy model]: documents, duplicates   │
│   “checkpoint available”)  │   removed, tokens, vocabulary, train/validation,    │
│ Start from: Random weights │   context; sample; “How the text is prepared”       │
│   · Pretrained checkpoint  ├─────────────────────────────────────────────────────┤
│ Seed [− 0 +]               │ Training example: probe text → table of context →   │
│ 10 · 50 · 200 steps        │   target, p(target) bar, loss; selected row's top-5 │
│ [⚡ Train] [▶ Auto] [↺ Reset]├─────────────────────────────────────────────────────┤
│ tip                        │ Training: step / 2000, train & validation loss,     │
│                            │   perplexity, parameters; LineChart with ln V line  │
│                            ├─────────────────────────────────────────────────────┤
│                            │ Try the model: Story · Fact · Code presets, greedy  │
│                            │   12 tokens, each token's probability on hover      │
└────────────────────────────┴─────────────────────────────────────────────────────┘
Note: ~50 k parameters and a few thousand tokens vs GPT-3's 175 B and hundreds of billions.
```

- On load (and whenever corpus, start or seed changes) the page creates a run and probes `The capital of France is Paris.`; the ` Paris` row is selected by default. **Train** runs the chosen number of steps and re-probes, so the table and the chart move together. **Auto** chains training calls until paused or the cap. **Reset** creates a fresh run with the same settings.
- **Pretrained checkpoint** is offered only for a corpus with a checkpoint (Everything); switching to another corpus falls back to random weights.
- A 404 from any run call (server restarted or evicted the run) creates a new run and shows "The previous run was lost (the server no longer has it), so a new one was started."
- The Training note switches to a memorisation warning when, over the last 20 points, validation loss rose while training loss fell. Perplexity is `e^(validation loss)`; the dashed baseline is `ln V`, the random-guess loss.
- Probe texts longer than the context show "Showing the last 32 tokens"; unknown words appear as `<unk>`.

Boundary, stated on the page: the toy model is not GPT-3 and cannot show GPT-3-scale capability; the mechanism is the same, the capabilities are not.

## 3. Post-training (built)

The published InstructGPT / ChatGPT recipe run for real on the toy GPT: SFT and PPO update the policy; the reward model is a separate learned evaluator. The outline had asked for a PPO *simulator* over a small auditable policy; the toy GPT is that small policy, so PPO runs on it, and the simplifications are stated on the page (one reward per whole answer, sequence-level PPO ratios, no value network, advantages standardised per batch, exact per-token KL to the frozen reference added to the loss).

### Data (`toy_corpus.py`)

- `DEMONSTRATIONS`: 15 `Question: … Answer:` → ` answer.` pairs whose answers are facts the pretraining corpus states in plain sentences (nine capitals, spiders' legs, two plus two, grass, cows, bees, cheese). `HELD_OUT_DEMOS`: Italy → Rome and Egypt → Cairo, never trained on.
- `PREFERENCE_PROMPTS`: six prompts (France, Japan, Spain, honey, spiders, two plus two), each with four answers: `a` correct and concise, `b` correct but longer than asked, `c` confident but wrong, `d` irrelevant; `honest` = `a b c d`.
- The tokens of all post-training texts join the vocabulary at `prepare()` time but never the training text, so pretraining has random embeddings for "Question" and " Answer" and SFT must teach them. Because of this the base checkpoint was regenerated (seed 2; p(Paris | The capital of France is) = 0.72).

### Procedures (`toy_posttraining.py`)

- `sft(trainer, steps)`: loss on the answer tokens plus the newline only (`encode_demo` returns ids and the mask), the pretraining optimizer continued at `SFT_LR = 3e-4`, and a pretraining batch mixed into every step (`SFT_REPLAY = 1.0`, InstructGPT's pretraining mix). Without both, fifteen demonstrations overwrite what the model knew. Freezes `snapshots["pretrained"]` on first call; records `SftPoint(step, loss, held_out_loss)`.
- `sft(…, adapter="lora", rank=4)`: LoRA instead of full fine-tuning. `Trainer.enable_lora` freezes every weight and wraps each block's four linears (`qkv`, `proj`, both MLP layers) in `LoRALinear` (`base(x) + x·Aᵀ·Bᵀ · alpha/rank`, `B` starting at zero); only `A` and `B` train, with their own AdamW at `LORA_LR = 3e-3`; when the call ends `merge_lora` folds `B·A` into the weights, so the rest of the pipeline sees a plain model. The adapter choice is fixed by the first SFT call of a run. Observed: 4 096 trainable parameters of 43 584 (9 %), Spain → Madrid 0.84 in the probe and 0.94 live after 200 steps, plain-sentence knowledge kept (p(Rome) 0.92); rank 4 on the attention linears alone did not learn the format in 200 steps, which is why all four linears carry adapters. The new format words' embeddings stay random under LoRA, and the adapters learn around them.
- `RewardModel`: a deep copy of the policy's backbone plus a scalar head on the last token, as InstructGPT initialised its reward model from the policy. `RewardTrainer` trains it with `−log σ(r_w − r_l)` on batches of four pairs and reports the accuracy over all pairs after every step. `builtin_pairs("none")` are the honest rankings; `"length"` ranks the longest answer first to show a biased annotator; `pairs_from_ranking` turns a student's best → worst ranking into every ordered pair.
- `ppo(trainer, rm, iterations, lr, clip, kl_beta)`: per iteration, one sampled answer per prompt (temperature 1, ≤ 8 tokens, stops at "." or newline), reward-model scores, standardised advantages, `epochs = 4` clipped-surrogate updates with `kl_beta × KL(π ‖ π_ref)` summed over the answer positions, where the reference is `snapshots["sft"]` frozen when PPO starts. Records `PpoPoint(iteration, reward, kl, policy_loss, clip_fraction, sample_prompt, sample_completion)`.
- `dpo(trainer, pairs, steps, beta, lr)`: Direct Preference Optimization on the same pairs the reward model uses, against the SFT weights frozen as the reference: `L = −log σ(β[(log π − log π_ref)(y_w) − (log π − log π_ref)(y_l)])`, batches of four pairs, AdamW. Records `DpoPoint(step, loss, accuracy, margin)`, where accuracy is the share of all pairs whose implicit reward prefers the chosen answer. DPO and PPO are exclusive branches from the SFT stage: a run's `stage` becomes `dpo`, PPO is then refused (and DPO after PPO), and SFT is refused after either. Observed: 60 steps at β = 0.5 reach ≥ 90 % pair agreement; a student ranking that puts Madrid first makes p(Madrid) exceed p(Paris) for the France prompt, while greedy decoding can still pick a third token, because DPO moves the chosen answer up only *relative* to the rejected one.
- Caps: 1000 SFT steps, 1000 reward-model steps, 200 PPO iterations, 1000 DPO steps per run.
- Checkpoints: `toy-gpt-all-sft.pt` (200 SFT steps) and `toy-gpt-all-rlhf.pt` (reward model 150 steps on the honest pairs, 40 PPO iterations), under 1 MB each, regenerated with `uv run python -m genai.toy_posttraining`.

**Observed, and taught as such.** SFT learns the format and the demonstrated questions (Spain → Madrid 0.99 after 200 steps) and keeps the plain-sentence knowledge (The capital of Italy is → Rome stays top-1). The held-out question Italy does *not* reach that knowledge in this toy: the model answers with a demonstrated capital. With one earlier base seed it did, with the committed seed it does not, so the lesson states that transfer is what scale buys rather than claiming it. The reward model reaches 100 % agreement with the honest pairs; PPO raises the mean score (3.9 → 4.9 over 40 iterations at β = 0.1) and the KL to the SFT policy climbs to about 1.4.

**Ruling:** the Adaptation lab's downloaded dataset is not fed to the toy model, because its review vocabulary is all `<unk>` to it. The page shows that the built-in demonstrations and preference pairs have exactly the shape that dataset has.

### Endpoints (`toy_routes.py`)

Stage order is enforced: PPO needs SFT first (400 "Run SFT first"), and SFT is refused once PPO has run (400, "would break the lineage"); the page disables the matching buttons and says why. The registry now holds `ToyRun {trainer, rm, student_pairs, bias}`; `RunState` gains `stage`, `sft_history`, `rm_history`, `ppo_history`, `student_pairs`, `has_reward_model`; `POST /runs` gains `stage` (which committed checkpoint `pretrained: true` loads; 400 when missing); `POST /runs/{id}/generate` gains `stage` (`current` · `pretrained` · `sft`; 400 before that stage exists).

| Endpoint | Body | Reply |
|---|---|---|
| `GET /api/genai/toy/alignment` | — | `{demonstrations, held_out, prompts[{id, prompt, candidates[{id, text, note}], honest}]}` |
| `POST /api/genai/toy/runs/{id}/sft` | `steps` 1–200, `adapter` `full` (default) or `lora`, `rank` 1–16 | `RunState` (with `sft_adapter` and `sft_trainable_params`); 400 when the adapter differs from the run's first choice |
| `POST /api/genai/toy/runs/{id}/preferences` | `prompt_id`, `ranking` (four ids) | `RunState`; 404 unknown prompt, 422 bad ranking |
| `POST /api/genai/toy/runs/{id}/reward-model` | `steps` 1–200, `bias` | `{run: RunState, candidate_scores[prompt_id][candidate_id]}`; creates the reward model from the current policy on first call |
| `POST /api/genai/toy/runs/{id}/ppo` | `iterations` 1–20, `lr`, `clip`, `kl_beta` | `RunState`; 400 without a reward model, before SFT, or after DPO |
| `POST /api/genai/toy/runs/{id}/dpo` | `steps` 1–200, `beta` (0, 2], `lr` | `RunState` with `dpo_history`; 400 before SFT or after PPO |

### Page (`post-training.tsx`, `post-training-panels.tsx`)

Rail: **Start from** Pretrained · SFT · RLHF checkpoint (always corpus `all`), **Reset**, and the run's stage line. Main, in pipeline order, each `real · toy model`:

1. **Supervised fine-tuning**: demonstrations table, the loss mask on one demonstration (prompt struck through, answer highlighted), the adapter choice (**Full fine-tuning** or **LoRA adapter (rank 4)**, fixed after the first run, with "N of M parameters trained (p %)" once known), two live probes — the demonstrated question Spain (p(Madrid)) and the held-out Italy (the model's top guess and p(Rome)) — **Run 50 SFT steps**, and the loss chart (demonstrations vs held-out). Note: knowledge came from pretraining, SFT taught the format, transfer is what scale buys.
2. **Human preferences**: prompt selector; four answers ranked by clicking in order (1st … 4th), **Reset ranking**, **Submit ranking** (reveals each answer's note and the running count of the student's pairs); the pairwise loss; the **Prefer longer answers** switch; **Train reward model (100 steps)** with the accuracy chart and a score table whose dot is `success` when the reward model's favourite is the honest best and `error` otherwise.
3. **RLHF with PPO**: learning rate, clip ε and KL β selects; **Run 5 PPO iterations**, disabled until a reward model exists; reward and KL charts; a table of iterations with the sample answer; a reward-hacking note when a sample repeats a token three times, and a drift note at β = 0; the source spec's invented reward table under a `historical illustration` badge.
3b. **Direct Preference Optimization**: β select (0.1 · 0.5 · 1), **Run 50 DPO steps** (needs SFT; closed once the run took the PPO branch, and the PPO panel is closed once it took the DPO branch), loss and pair-agreement charts, the DPO loss in Unicode, and a note on why DPO replaced PPO in many recipes and on its catch (absolute probabilities can fall).
4. **Compare the checkpoints**: prompt selector (six prompts plus Italy and Egypt), **Generate from all stages**, greedy, per-token probability on hover. The columns follow the run's stage, because the SFT weights are frozen only when PPO starts: a pretrained run shows one column, a run after SFT shows pretrained and "After SFT (current)", a run after PPO shows pretrained, after SFT and "After RLHF (current)"; after DPO the last column reads "After DPO (current)".
5. **Other techniques you will hear about**: DPO, LoRA/PEFT, continued pretraining, rejection sampling, with the note that none were stages of the original pipeline.

GPT → ChatGPT gains **Same lineage, toy scale**: one toy prompt run through the three committed checkpoints side by side, with the note that these three are one model at three points of its training while the panels above compare different models. The three runs are created once per page visit and reused; a 404 recreates them.

## Constraints (all phases)

Kept from the source specification: never fake historical accuracy · separate capabilities from behaviour · preserve checkpoint lineage in before/after comparisons · differentiate training signals (next-token targets / demonstrations / preferences / reward + KL) · show what changes (weights in training, context in inference) · compute where practical (attention, loss, probabilities, small-model training) · treat evaluation as separate from training loss.

### Cuts, with reasons

| Dropped from the source spec | Why |
|---|---|
| Redis, worker queue, SQLite/PostgreSQL, SSE/WebSockets | toy training runs *k* synchronous steps per request; nothing is long-running |
| BERT / T5 downloads for encoder and encoder–decoder attention | a second ~0.5 GB model for one diagram-level point; the variants diagram and the calculator's mask toggle carry it. `bert-tiny` (17 MB) is a Phase 4 option |
| 40-exercise bank with IDs and difficulty levels | the PRD has no accounts or grading; each lesson ships presets with Observe / Experiment / Explain prompts instead |
| real PPO / TRL training, GPU | the PRD rules out large-model training; the PPO simulator is labelled as such |
| "export experiment results" and "compare checkpoints" global controls | deferred to Phase 3, where there are checkpoints to compare |

## Phases

| Phase | Deliverable | Status |
|---|---|---|
| 1 | Transformers group in the sidebar; Architecture lesson; `POST /api/genai/attention` | built |
| 2 | Pretraining lesson; toy GPT with checkpoint; `/genai/toy/*` | built |
| 3 | Post-training lesson (SFT, preferences, reward model, PPO on the toy GPT); lineage row in GPT → ChatGPT | built |
| 4a | DPO branch in Post-training | built |
| 4b | Encoder attention with BERT small in the Architecture lab | built |
| 4c | LoRA as an SFT option in Post-training | built |
| 4d | pt-BR copy for the group and the chapter's titles | built |

## API (`algo-server`)

| Endpoint | Body | Reply | Phase |
|---|---|---|---|
| `POST /api/genai/attention` | `text` ≤ 200 chars, `layer`, `top_k` ≤ 10, `model` `gpt2` (default) or `bert-small` | `{model, causal, layers, tokens, layer, heads, weights[head][query][key], next_tokens}`; 400 for a layer the model lacks; `next_tokens` empty for the encoder | 1, 4b |
| `GET /api/genai/toy/corpora`, `POST /api/genai/toy/runs`, `POST /api/genai/toy/runs/{id}/train`, `/probe`, `/generate` | see section 2 | `RunState` carries `execution_mode: "real"` | 2 |
| `GET /api/genai/toy/alignment`, `POST /api/genai/toy/runs/{id}/sft`, `/preferences`, `/reward-model`, `/ppo` | see section 3 | `RunState` (with `execution_mode: "real"`) or the reward-model reply | 3 |

`/genai/attention` returns every head of one layer: with the 200-character cap that is at most about 12 × 60 × 60 floats, and it keeps head switching instant. GPT-2 is loaded with `attn_implementation="eager"`: the default kernel cannot return attention weights, and eager was measured faster on CPU here (28 ms vs 58 ms per forward pass).

## Decisions and limits

- **Both directions run.** GPT-2 shows causal attention (its "bank" example puts the context before the word); BERT small shows bidirectional attention on the classic sentences. Encoder–decoder cross-attention stays a diagram.
- **All heads, one layer per request.** Layer changes need a new request; the rail says so.
- **No math renderer.** Formulas are plain Unicode, as in the Neural Networks chapter.
- **Two languages.** Every string goes through `t()`; the group's Brazilian Portuguese copy lives in `i18n/pt-br-transformers.ts`, the chapter's sidebar titles in `i18n/curriculum.ts`, and `i18n/transformers-ptbr.test.ts` fails when a `t()` literal in these lessons has no entry. The rest of chapter 04 keeps English bodies.
- **No ADR**: this is a feature inside existing boundaries.

## Verification

- Python: `uv run pytest -m "not slow"` (includes the toy corpus, toy GPT, post-training and toy route tests, which train the real toy model: loss falls, probe positions, truncation, determinism, save/load, the step cap, the committed checkpoint predicting " Paris"; SFT learning the format while keeping plain-sentence knowledge, the loss mask, the reward model learning honest and student pairs, PPO metrics and determinism, less drift with a larger β, stage snapshots, the committed SFT and RLHF checkpoints), `uv run pytest packages/genai -m slow` (real GPT-2: rows sum to 1, strictly causal, `top_k` candidates, missing layer rejected), `uv run ruff check apps packages`, `uv run lint-imports`.
- Frontend (`apps/ai-intro`): `pnpm exec tsc --noEmit`, `npx biome check src`, `npx vitest run`. The Architecture tests cover: Theory first and **Open the lab**; Inspect posting both texts at the chosen layer; 3 × 3 cells with 3 masked; head stepping and mean-of-heads without a new request; token selection updating the attended list; the calculator reacting to a vector edit and the mask toggle. The Pretraining tests cover: run created and probed on load with ` Paris` selected; Train posting the chosen steps and re-probing; the pretrained start; a lost run recreated with the notice; Generate showing the toy model's tokens; Auto pausing on an error; steps clamped at the cap. The Post-training tests cover: the pretrained checkpoint loaded with both probes; SFT posting and re-probing; ranking and submitting a preference; the reward model posting the bias and showing scores; PPO disabled until a reward model exists, then posting its settings and flagging a repeating sample; Compare generating from the three stages; and, in GPT → ChatGPT, the lineage row creating the three stage runs.
- Manual: run the server and the app. Architecture: Inspect the bank preset, select "bank" in both heatmaps, step heads, toggle Mean, try the cat preset, edit the calculator. Pretraining: Train to about 300 steps and watch ` Paris` climb, switch to the pretrained checkpoint, try the Noisy corpus for the memorisation note, Generate the three presets. Check the sidebar group, the Post-training placeholder, dark and light themes, 390 px width and the offline notice.
