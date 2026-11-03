# rag-in-action

A Streamlit app that runs a Retrieval-Augmented Generation pipeline one visible step at a time: **Load → Chunk → Enrich → Embed → Store (FAISS) → Retrieve & chat**, then **Analytics**, which uses the same embeddings to find topics in a log of support questions. The corpus is 10 Markdown files about Nimbus Logistics, an invented cold-chain courier. Its facts are fictional, so a model can only answer correctly through retrieval.

## Install

```bash
# from the repo root
uv sync --all-packages --all-groups
```

The first embedding run downloads all-MiniLM-L6-v2 (about 90 MB) to the Hugging Face cache.

Chat answers and OpenAI embeddings read `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`, default `gpt-5.4-mini`) from the repo-root `.env`. Without a key, every indexing step and retrieval still works; generation is skipped and the trace shows the prompt the model would have received.

Every page is behind a login: user `student`, password `novaims`.

## Run

```bash
uv run rag-in-action          # http://localhost:8501
```

It is also listed in `uv run all-apps`.

## Deploy to Streamlit Community Cloud

1. On [share.streamlit.io](https://share.streamlit.io): **Create app** → repo `fernando-peres/intro-ai-master`, branch `main`, main file path `apps/rag-in-action/src/rag_in_action/app.py`.
2. **Advanced settings**: Python 3.14. Secrets (top-level keys become environment variables):

   ```toml
   OPENAI_API_KEY = "sk-..."   # optional: without it the app runs offline; retrieval still works
   # APP_USER = "student"      # optional: override the login
   # APP_PASSWORD = "novaims"
   ```

Cloud runs from the repo root without installing the package: `app.py` puts `src/` and `packages/genai/src` on `sys.path`, the theme comes from the root `.streamlit/config.toml`, and dependencies from `src/rag_in_action/requirements.txt`, which takes precedence over the root `uv.lock`. Regenerate it after changing dependencies:

```bash
{ echo "--find-links https://download.pytorch.org/whl/cpu/torch/"
  uv export --package rag-in-action --no-dev --no-hashes --no-emit-workspace --no-header --no-annotate --frozen \
    | grep -vE '^(nvidia-|triton==)' \
    | sed -E "s/^torch==(.*)$/torch==\\1+cpu ; sys_platform == 'linux'\ntorch==\\1 ; sys_platform != 'linux'/"
} > apps/rag-in-action/src/rag_in_action/requirements.txt
```

The filter swaps the lock's CUDA torch for the CPU build, so Cloud does not download several GB of NVIDIA wheels. `--find-links` instead of `--extra-index-url` because uv takes every package from the first index that lists it. The first MiniLM run on Cloud downloads the model (about 90 MB).

## Layout

| Path | What |
|---|---|
| `corpus/*.md` | The documents: YAML frontmatter (`id`, `title`, `department`, `owner`, `updated`, `tags`, `related`), body, inline links |
| `corpus/_index.yml` | Hand-written keyword index: term → document ids |
| `corpus/support/questions.csv` | Invented support-question log for Analytics: `asked` (UTC), `channel`, `customer_tier`, `question` |
| `src/rag_in_action/pipeline/` | The pipeline, free of Streamlit: `load`, `chunk`, `enrich`, `embed`, `store`, `retrieve`, `generate`, `topics` |
| `src/rag_in_action/views/` | One Streamlit page per step, plus the source-document modal |
| `src/rag_in_action/ui/` | Theme, stepper rail, HTML fragments, session state |
| `var/` | Saved FAISS indexes (git-ignored) |

## Test

```bash
uv run pytest apps/rag-in-action/tests
```

`test_app_flow.py` is marked `slow`: it drives every page through Streamlit's `AppTest` with the real MiniLM model.
