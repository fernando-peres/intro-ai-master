# Generative AI: From Foundation Model to AI Assistant

**Status:** Implemented.
**Apps:** `apps/ai-intro` (lessons), `apps/algo-server` (model endpoints)
**Package:** `packages/genai`
**Chapter:** 04 Generative AI (`/learn/generative-ai/*`). LLM and Agents moved to 05 and 06.

## Purpose

Show students how the same language-model technology goes from text prediction to a useful assistant, and keep three ideas apart:

1. **Pretraining.** The model learns to predict the next token, and general language skill comes with it.
2. **Adaptation.** Prompting, supervised fine-tuning (SFT) and human feedback shape that skill for specific tasks. Prompting changes the context; fine-tuning changes the weights.
3. **Conversational assistant.** A post-trained model follows instructions, keeps the conversation in context and handles many tasks.

> Pretraining develops general capabilities. Adaptation shapes how those capabilities are used. A conversational assistant is one application of a post-trained foundation model.

Every output in the labs is live. GPT-2 is a genuine foundation model (it was never instruction-tuned). Chat-API models are already post-trained, so prompting one cannot turn it back into a base model. That is why the labs use two different models.

## Lessons

| # | Slug | Kind | Stage | Classroom experiment |
|---|---|---|---|---|
| 1 | `foundation-models` | content | all | concepts, diagrams, foundation vs adapted |
| 2 | `next-token-lab` | simulation | Foundation | 1 complete the text · 2 try an instruction · 5 temperature |
| 3 | `adaptation-lab` | theory + simulation | Adaptation | 3 adapt behaviour · review → post-training dataset |
| 4 | `assistant-lab` | simulation | Assistant | 4 chat, follow up, context |
| 5 | `gpt-to-chatgpt` | simulation | all | same input, three stages side by side |
| 6–8 | `intuition-pretraining`, `intuition-rlhf`, `intuition-dpo` | group **Training Intuition** (content) | all | the kind of data each training technique needs, GPT-3 → GPT-3.5; see [the Training Intuition spec](26-10-26-training-intuition.md) |
| 9–11 | `transformer-architecture`, `pretraining`, `post-training` | group **Transformers** | all | the network inside, how it is pretrained and post-trained; see [the Transformers spec](26-10-25-transformers.md) |

Each lab opens with a status line naming the live models. The sidebar links between the labs. When `algo-server` is unreachable, the status line becomes a notice with the start command, and it recovers by itself (the health check is polled every 5 s).

Stage colours follow `docs/branding.md`. The stages are a method comparison, not data classes, so they use **misc**: Foundation `chart-warm`, Adaptation `chart-amber`, Assistant `fg-secondary`.

### 1. Foundation Models (content)

Sections: What a foundation model is · Pretraining: predict the next token · Adaptation: shape how the skill is used · From GPT to ChatGPT · Foundation vs adapted model (table). `PipelineDiagram` draws the data → TRAINING → foundation network → ADAPTED → adapted network pipeline; `labels` adds the stage captions and `tasks` adds the downstream task chips. Its numbers come from the labs: GPT-2's top candidates after "The capital of France is" (" the" 8.5%, …, " Paris" 3.2%, fifth), and the zero-shot vs few-shot classification of the mixed review (Positive 79% → Mixed 59%).

### 2. Next Token

```text
┌ Configuration ───────┐ ┌ Generation ─────────────────────────────────────────┐
│ Prompt [Story][Fact] │ │ Once upon a time, in a small village, there existed │
│   [Question][Instr.] │ │ a man named… ▮   (prompt muted, tokens underlined)  │
│ [textarea]           │ ├─────────────────────────────────────────────────────┤
│ [Generate][Resample] │ │ [‹][▶ Play][Next token ›][⏭] GPT-2·124M │ Tokens 7/30 │
│ Temperature ──●── 0.7│ │                         Avg. probability · Temp.    │
│ Max tokens  − 30 +   │ └─────────────────────────────────────────────────────┘
└──────────────────────┘ ┌ Next-token probabilities ─────────── token 8 of 30 ┐
                         │ " who"     ████████░░░░  41%   (click = choose it)  │
                         │ " named"   ███░░░░░░░░░  12%   …                    │
                         └─────────────────────────────────────────────────────┘
```

- One request returns every step (token, probability, top-5); the lab reveals them locally every 280 ms, so stepping back and forth makes no extra calls.
- Clicking a candidate keeps the text before that step, puts the chosen token there (shown in brand colour, "your pick") and asks GPT-2 to continue from the new prefix.
- Sampling draws from the 50 most likely tokens at the chosen temperature, with a seed (Resample adds 1). Temperature 0 is greedy, and its bars show the untempered distribution. A sampled token outside the top 5 is appended to the list.

### 3. Adaptation

Two tabs, **Theory** (default) and **Lab**; both stay mounted, so lab state survives switching. The slug stays `adaptation-lab`.

**Theory** (`adaptation-theory.tsx`): what adaptation is · from foundation model to adapted model (post-training learns from *demonstration data* for SFT and *preference data*, chosen vs rejected, for RLHF or DPO) · a table of adaptation types grouped by whether they change the weights (continued pretraining, SFT, preference optimization: yes; PEFT/LoRA: partially; prompting/few-shot, RAG: no), each with its meaning and an example · what the lab shows, with an **Open the lab** button.

**Lab** rail: method **Zero-shot / Few-shot / Fine-tuned** with a one-line hint each, and model **Base · GPT-2 / Assistant · {`assistant_model` from `/health`}** with a note naming the model. The task is fixed to sentiment (Positive, Negative, Mixed).

- **1 · Demonstrations** start with two examples (one Positive, one Negative); **Add example** offers a Mixed one first. Zero-shot greys them out.
- **Prompt sent to the model** is a live preview built by `fewShotPrompt` in `api.ts`, which mirrors `genai.prompts.few_shot_prompt`; both test suites assert the same strings.
- **2 · Classify and review**: GPT-2 scores each label by its probability as the continuation of `Sentiment:`. The assistant's reply is matched to the first label it mentions. **3 · Review** asks the student to mark the prediction Correct, or Wrong and pick the right label.
- **Your runs** keeps the last six runs (method, model, number of examples, review, prediction and confidence, the student's review).
- **Post-training dataset**: each review adds observations without the few-shot examples in their prompt. A confirmed label adds a demonstration `{type, prompt, completion}`; a corrected one also adds a preference pair `{type, prompt, chosen, rejected}`. The panel previews them as JSONL, downloads them as `post-training-dataset.jsonl`, and explains that SFT and RLHF/DPO would turn them into new weights.
- **Fine-tuned** is not run live. It explains where the examples go in each method (every request vs once, into the weights), counts the student's demonstrations, and refers to OpenAI's Fine-tuning API, whose availability depends on the model and account.

Observed with GPT-2 on "The product is excellent, but shipping was slow.": zero-shot Positive 79%; two examples Mixed 37%; three (with the Mixed one) Mixed 59%.

### 4. Assistant Lab

Rail: editable system instruction, a **Send history** switch, and task presets (Ask, Follow up, Summarize, Translate). The **Conversation** panel shows the chat; **Context sent** lists every message of the last request. With history off, a follow-up such as "And what is its population?" travels alone, the turn is tagged "sent without history", and the assistant asks which place is meant.

### 5. GPT → ChatGPT

This replaces the mockup's Base/Adapted/Assistant toggle: **Run all three** sends one input to all three stages and shows them side by side.

| Panel | Request | Model receives |
|---|---|---|
| 01 Foundation | `/complete`, greedy, 30 tokens | task prefix + input |
| 02 Adaptation | `/few-shot`, base | the task's instruction and examples + input |
| 03 Assistant | `/chat` | system "helpful, under 60 words" + task prefix + input |

The examples are Text continuation, Question answering and Sentiment classification; only sentiment has a prefix ("Classify the sentiment of this review as Positive, Negative or Mixed:"). Each panel has a "What the model received" disclosure, and the answers stay tied to the input that produced them.

## API (`algo-server`)

| Endpoint | Body | Reply |
|---|---|---|
| `GET /api/health` | — | `{status, base_model, assistant_model \| null}` |
| `POST /api/genai/complete` | `prompt`, `max_tokens` ≤ 80, `temperature` 0–2, `top_k` ≤ 10, `seed` | `{model, steps: [{token, prob, top_k}]}` |
| `POST /api/genai/few-shot` | `instruction`, `examples` ≤ 12, `query`, `input_name`, `output_name`, `model: base\|assistant`, `labels?` | `{model, prompt, output, label, scores \| null}` |
| `POST /api/genai/chat` | `messages` (system/user/assistant) ≤ 40 | `{model, reply}` |
| `POST /api/genai/attention` | `text` ≤ 200 chars, `layer`, `top_k` ≤ 10, `model` gpt2 or bert-small | `{model, causal, layers, tokens, layer, heads, weights, next_tokens}` (Transformers spec) |

The server reads `OPENAI_API_KEY` and `OPENAI_MODEL` (default `gpt-5.4-mini`) from the repo-root `.env`. Without the key, assistant calls return 503 with that message; an OpenAI failure returns 502 with its error. GPT-2 loads lazily on its first request and is cached in-process.

## Decisions and limits

- **GPT-2 without its KV cache.** Reusing `past_key_values` crashes the process (SIGBUS) with torch and transformers on Python 3.14, so every step recomputes the whole sequence. That takes about 65 ms per token on a laptop CPU.
- **`genai[gpt2]` extra.** torch and transformers are optional for the package, and `algo-server` requires them. The package and route tests use fakes, so they need no model download; `packages/genai/tests/test_gpt2.py` (marked `slow`) runs the real model.
- **No fine-tuning in v1.** The Adaptation lesson explains it and collects the dataset it would use. A next version could add a model fine-tuned on the sentiment examples as a third Adaptation option.
- **Mostly English.** Copy goes through `t()`; the Transformers group and the chapter's sidebar titles have pt-BR entries, the five original lessons do not yet.

## Verification

- `uv run pytest` (real GPT-2 included), `uv run ruff check apps packages`, `uv run lint-imports`.
- `pnpm --filter ai-intro test | lint | build`. The lab tests stub `fetch` (`lessons/generative-ai/test-utils.tsx`) and cover the request bodies, stepping, forcing a token, the history switch, the offline notice and a missing API key.
- Checked by hand against the live models in dark and light themes and at 390 px width.
