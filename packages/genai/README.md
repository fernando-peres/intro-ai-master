# genai

Python 3.14 package with the models behind the Generative AI labs. Packages never import from `apps/*`.

- `base_model.py`: `BaseLM`, a pretrained model that shows its next-token choices, and `GPT2Model`, which runs GPT-2 (124M) on CPU through Hugging Face `transformers`.
- `encoder_model.py`: `BertSmallModel`, an encoder-only Transformer (`google/bert_uncased_L-4_H-512_A-8`, 29 M parameters) that returns its bidirectional attention in the same shape as `GPT2Model.attention`; downloads about 115 MB on first use and borrows BERT base's tokenizer.
- `prompts.py`: `few_shot_prompt`, the zero-shot and few-shot prompt format the labs preview.
- `assistant.py`: `OpenAIAssistant`, an instruction-tuned chat model reached through the OpenAI Responses API, and `pick_label`. The caller passes the API key and the model name; the package never reads the environment.
- `toy_corpus.py`: authored corpora, the word-level `tokenize` and `prepare` (cleaning, deduplication, every 10th document to validation).
- `toy_gpt.py`: `ToyGPT`, a 2-layer decoder of about 50 k parameters, and `Trainer`, which trains it step by step, probes a text position by position, generates (from the live weights or a stage snapshot), and saves or loads a checkpoint. `checkpoints/toy-gpt-all.pt` is committed; regenerate it with `uv run python -m genai.toy_gpt --steps 800 --seed 2`.
- `toy_posttraining.py`: `sft` (demonstrations, answer-token loss, pretraining mix; full weights or LoRA adapters that are merged back afterwards), `RewardTrainer` (pairwise preference loss on a copy of the policy with a scalar head) `ppo` (clipped surrogate with a KL penalty to the SFT weights) and `dpo` (the same pairs, optimised directly against the SFT reference), all on the toy GPT. `checkpoints/toy-gpt-all-sft.pt` and `-rlhf.pt` come from `uv run python -m genai.toy_posttraining`.
- `vectors.py`: numpy-only `unit`, `cosine_scores`, `top_indices` and `pca` (SVD with sklearn's sign convention).
- `word_vectors.py`: `GloveVectors`, GloVe 6B 300-d (400k words) with `lookup`, `neighbors` and `analogy`; a word missing from the vocabulary raises `MissingWords` with prefix suggestions.
- `sentence_vectors.py`: `MiniLMEncoder`, all-MiniLM-L6-v2 sentence vectors; `inspect` also returns the token-level vectors and four poolings (mean, normalized mean, `[CLS]`, max).
- `embedding_registry.py`: `MODELS`, the catalogue of embedding models; reading it never loads one.
- `search_corpus.py`: 35 authored help-desk documents, `SearchIndex` (semantic cosine ranking next to a naive keyword-overlap ranking).

## Install

The GPT-2 model needs the `gpt2` extra (torch and transformers, about 1 GB):

```toml
[project]
dependencies = ["genai[gpt2]"]

[tool.uv.sources]
genai = { workspace = true }
```

On first use GPT-2's weights (about 550 MB) download to the Hugging Face cache (`~/.cache/huggingface`).

The embedding models need the `embeddings` extra (sentence-transformers, safetensors, numpy). On first use GloVe (about 480 MB) and MiniLM (about 90 MB) download to the Hugging Face cache; set `HF_HOME` to move it. Both revisions are pinned in the code.

```python
from genai.base_model import GPT2Model

steps = GPT2Model().generate_steps(
    "The capital of France is", max_tokens=5, temperature=0, top_k=5, seed=0
)
print([s.token for s in steps], steps[0].top_k)
```

```python
from genai.sentence_vectors import MiniLMEncoder
from genai.word_vectors import GloveVectors

analogy = GloveVectors().analogy(["king", "woman"], ["man"], top_k=5, vocab_limit=100_000)
print([n.word for n in analogy.neighbors])  # queen among them
print(MiniLMEncoder().encode(["The car is very fast."])[0].vector[:3])
```

GPT-2 runs without its KV cache: reusing `past_key_values` crashes (SIGBUS) under torch on Python 3.14, so each step recomputes the whole sequence. That takes about 65 ms per token on a laptop CPU.

`GPT2Model.attention(text, layer=5, top_k=5)` returns every head's attention weights for one layer plus the next-token candidates. The model is loaded with the eager attention kernel because the default (sdpa) cannot return weights; on CPU, eager is also the faster of the two.

## Run the server

`genai` has no server of its own. [`algo-server`](../../apps/algo-server) exposes it over HTTP for the Generative AI labs in `ai-intro`:

```bash
# from the repo root
uv sync --all-packages
uv run fastapi dev apps/algo-server/src/algo_server/main.py   # http://localhost:8000
curl localhost:8000/api/health                                # names the base and assistant models
```

The assistant needs `OPENAI_API_KEY` in the repo-root `.env` (optional `OPENAI_MODEL` picks the chat model); without it the assistant endpoints return 503 and GPT-2 still works. The first GPT-2 request downloads the weights, so the first answer waits for it.

Endpoints: `POST /api/genai/complete`, `POST /api/genai/few-shot`, `POST /api/genai/chat`, `POST /api/genai/attention`. Interactive docs at http://localhost:8000/docs; details in the [algo-server README](../../apps/algo-server/README.md).

## Test

```bash
uv run pytest packages/genai                # includes the GPT-2, GloVe and MiniLM tests (downloads the models)
uv run pytest packages/genai -m "not slow"  # without the real models
```
