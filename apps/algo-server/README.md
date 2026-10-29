# algo-server

FastAPI service on Python 3.14. Depends on the workspace packages [`algo`](../../packages/algo) and [`genai`](../../packages/genai), which serves the Generative AI labs in `ai-intro`.

## Run

```bash
# from the repo root
uv sync --all-packages

uv run fastapi dev apps/algo-server/src/algo_server/main.py   # http://localhost:8000
curl localhost:8000/health                                    # → {"status":"ok"}
```

Interactive API docs: http://localhost:8000/docs

## Generative AI endpoints

| Endpoint | Model | What it does |
|---|---|---|
| `GET /api/health` | — | Names the base model and the assistant model (`null` without an API key). |
| `POST /api/genai/complete` | GPT-2 | Continues a prompt; every step returns its token, probability and top-k candidates. |
| `POST /api/genai/few-shot` | GPT-2 or assistant | Builds a zero-/few-shot prompt and answers it. With `labels`, GPT-2 scores each label's probability. |
| `POST /api/genai/chat` | assistant | Sends a conversation (system, user and assistant messages) and returns the reply. |
| `POST /api/genai/attention` | GPT-2 or BERT small | Returns the tokens of a text and every head's attention weights for one layer; with `model: "gpt2"` (default) the rows are causal and the top-k next tokens come too, with `"bert-small"` the rows look both ways. |
| `GET /api/genai/toy/corpora` | — | The toy corpora with their sizes, vocabularies, splits and whether a checkpoint exists. |
| `POST /api/genai/toy/runs` | toy GPT | Starts a training run (from random weights or the committed checkpoint); runs live in memory, 120 at most. |
| `POST /api/genai/toy/runs/{id}/train` | toy GPT | Runs 1–200 optimizer steps synchronously and returns the loss history; a run stops at 2000 steps. |
| `POST /api/genai/toy/runs/{id}/probe` | toy GPT | Scores every position of a text: context → target, probability, loss, top-k. |
| `POST /api/genai/toy/runs/{id}/generate` | toy GPT | Generates like `/genai/complete`, from the run's current weights or the weights frozen at an earlier stage (`stage`). |
| `GET /api/genai/toy/alignment` | — | The built-in demonstrations, held-out questions and preference prompts with their candidate answers. |
| `POST /api/genai/toy/runs/{id}/sft` | toy GPT | Supervised fine-tuning steps on the demonstrations; the loss counts only answer tokens. `adapter: "lora"` trains rank-`rank` adapters instead of the full weights. |
| `POST /api/genai/toy/runs/{id}/preferences` | — | Stores a student's best-to-worst ranking of one prompt's answers as preference pairs. |
| `POST /api/genai/toy/runs/{id}/reward-model` | toy GPT | Trains the run's reward model on built-in (honest or length-biased) and student pairs; returns every candidate's score. |
| `POST /api/genai/toy/runs/{id}/ppo` | toy GPT | PPO iterations against the reward model with a KL penalty to the SFT weights. |
| `POST /api/genai/toy/runs/{id}/dpo` | toy GPT | Direct Preference Optimization on the same pairs; the alternative branch to reward model + PPO. |

## Embeddings endpoints

| Endpoint | Model | What it does |
|---|---|---|
| `GET /api/embeddings/models` | — | Catalogue of the embedding models, with revision, size and whether each is loaded. |
| `GET /api/embeddings/corpus` | — | The authored search corpus (id, title, category, text). |
| `POST /api/embeddings/words` | GloVe | Full 300-d vectors for up to 40 words; unknown words come back with suggestions. |
| `POST /api/embeddings/neighbors` | GloVe | Nearest words to a word by cosine (`top_k` 1-20, `vocab_limit` 1000-400000). |
| `POST /api/embeddings/analogy` | GloVe | Nearest words to `positive - negative` (king - man + woman); inputs excluded, unknown words give 400. |
| `POST /api/embeddings/sentences` | MiniLM | 384-d vectors for up to 20 sentences, normalized or raw mean. |
| `POST /api/embeddings/inspect` | MiniLM | Word pieces with their contextual vectors and the four poolings. |
| `POST /api/embeddings/pca` | — | PCA to 2 or 3 dimensions of up to 200 vectors (numpy SVD). |
| `POST /api/embeddings/search` | MiniLM | Semantic and keyword rankings of the corpus for a query. |

Settings come from the repo-root `.env` (variables already in the environment win):

| Variable | Default | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | — | Required by the assistant; without it those calls return 503 and GPT-2 still works. |
| `OPENAI_MODEL` | `gpt-5.4-mini` | The OpenAI chat model used as the assistant. |

The first GPT-2 request downloads its weights (about 550 MB), the first BERT small request about 115 MB, the first GloVe request about 480 MB and the first MiniLM request about 90 MB, all to `~/.cache/huggingface` (`HF_HOME` moves it); that request waits for the download. With all three loaded the server holds about 1.1 GB.

Production-style run:

```bash
uv run fastapi run apps/algo-server/src/algo_server/main.py --port 8000
```

## Test

```bash
uv run pytest apps/algo-server
```

`tests/test_health.py` covers the health endpoint. `tests/test_genai_routes.py` covers the Generative AI endpoints with a fake GPT-2 and a fake assistant, so it needs neither the model download nor an API key. `tests/test_algo_integration.py` is the pattern for integration tests against `packages/*`.
