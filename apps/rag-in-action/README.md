# rag-in-action

A Streamlit app that runs a Retrieval-Augmented Generation pipeline one visible step at a time: **Load → Chunk → Enrich → Embed → Store (FAISS) → Retrieve & chat**, then **Analytics**, which uses the same embeddings to find topics in a log of support questions. The corpus is 10 Markdown files about Nimbus Logistics, an invented cold-chain courier. Its facts are fictional, so a model can only answer correctly through retrieval.

## Install

```bash
# from the repo root
uv sync --all-packages --all-groups
```

The first embedding run downloads all-MiniLM-L6-v2 (about 90 MB) to the Hugging Face cache.

Chat answers and OpenAI embeddings read `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`, default `gpt-5.4-mini`) from the repo-root `.env`. Without a key, every indexing step and retrieval still works; generation is skipped and the trace shows the prompt the model would have received.

## Run

```bash
uv run rag-in-action          # http://localhost:8501
```

It is also listed in `uv run all-apps`.

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
