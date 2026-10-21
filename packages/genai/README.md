# genai

Python 3.14 package with the models behind the Generative AI labs. Packages never import from `apps/*`.

- `base_model.py`: `BaseLM`, a pretrained model that shows its next-token choices, and `GPT2Model`, which runs GPT-2 (124M) on CPU through Hugging Face `transformers`.
- `prompts.py`: `few_shot_prompt`, the zero-shot and few-shot prompt format the labs preview.
- `assistant.py`: `OpenAIAssistant`, an instruction-tuned chat model reached through the OpenAI Responses API, and `pick_label`. The caller passes the API key and the model name; the package never reads the environment.

## Install

The GPT-2 model needs the `gpt2` extra (torch and transformers, about 1 GB):

```toml
[project]
dependencies = ["genai[gpt2]"]

[tool.uv.sources]
genai = { workspace = true }
```

On first use GPT-2's weights (about 550 MB) download to the Hugging Face cache (`~/.cache/huggingface`).

```python
from genai.base_model import GPT2Model

steps = GPT2Model().generate_steps(
    "The capital of France is", max_tokens=5, temperature=0, top_k=5, seed=0
)
print([s.token for s in steps], steps[0].top_k)
```

GPT-2 runs without its KV cache: reusing `past_key_values` crashes (SIGBUS) under torch on Python 3.14, so each step recomputes the whole sequence. That takes about 65 ms per token on a laptop CPU.

## Run the server

`genai` has no server of its own. [`algo-server`](../../apps/algo-server) exposes it over HTTP for the Generative AI labs in `ai-intro`:

```bash
# from the repo root
uv sync --all-packages
uv run fastapi dev apps/algo-server/src/algo_server/main.py   # http://localhost:8000
curl localhost:8000/api/health                                # names the base and assistant models
```

The assistant needs `OPENAI_API_KEY` in the repo-root `.env` (optional `OPENAI_MODEL` picks the chat model); without it the assistant endpoints return 503 and GPT-2 still works. The first GPT-2 request downloads the weights, so the first answer waits for it.

Endpoints: `POST /api/genai/complete`, `POST /api/genai/few-shot`, `POST /api/genai/chat`. Interactive docs at http://localhost:8000/docs; details in the [algo-server README](../../apps/algo-server/README.md).

## Test

```bash
uv run pytest packages/genai                # includes the GPT-2 tests (downloads the model)
uv run pytest packages/genai -m "not slow"  # without GPT-2
```
