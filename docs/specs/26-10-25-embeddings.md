# Embeddings: meaning as geometry

**Status:** Phases 1–3 built. Phases 4–8 are outlines.
**Apps:** `apps/ai-intro` (lesson), `apps/algo-server` (embedding endpoints)
**Package:** `packages/genai`
**Chapter:** 05 LLM → **Embeddings** (`/learn/llm/embeddings`, slug `embeddings`), replacing the "Tokens & Embeddings" placeholder

## Purpose

Chapter 04 showed how a model turns text into next-token probabilities. This lesson shows the step before that: how a model turns an input into a list of numbers, and what those numbers do and do not mean. Students should leave able to keep five things apart:

1. **An embedding is a vector produced by a model.** It is a list of numbers, not a meaning. The model, its training and its pooling decide what the numbers capture.
2. **Static and contextual embeddings differ.** GloVe gives "bank" one vector everywhere. MiniLM gives each token a vector that depends on its sentence, then pools them into one sentence vector.
3. **Similarity is not equivalence.** "I love this phone" and "I do not love this phone" score high because they share topic and wording. A high cosine says "close in this model's space", not "means the same".
4. **A 2D map is a shadow.** PCA keeps two directions out of 300 or 384. Distances on the map are distorted, and the axes change when the data changes.
5. **Vectors from different models are not comparable.** Each model has its own space, even when the dimensions match. The API says so with `embedding_space_id`.

Teaching principle, carried through every tab: show the real vector first, then the measure, then the caveat.

### Execution-mode rule

Every panel that shows numbers carries a `ModeBadge`. The transformers spec defined `real`, `simulation` and `historical illustration`. This lesson adds a fourth:

| Mode | Meaning | Examples |
|---|---|---|
| `real` | computed by a live model | GloVe neighbours and analogies; MiniLM sentence and token vectors; the PCA of real vectors; search scores |
| `simulation` | toy numbers the student edits, run through the real formula | the 3 × 3 pooling table (mean, CLS, max) |
| `historical illustration` | authored, from published work | not used in this lesson |
| `conceptual` ("conceptual illustration") | an idealised diagram, not measured data | the king/queen parallelogram, the embedding pipeline, the RAG diagram |

Every `POST` response carries `model` and `execution_mode: "real"`; the two catalogue `GET`s do not.

## Tab map

One lesson, four tabs; all stay mounted so lab state survives switching.

| Tab | Content | Phase |
|---|---|---|
| Theory (default) | what an embedding is; modalities; static vs contextual; similarity metrics; the 2D shadow; uses | 1, built |
| Intuition | GloVe: analogies, nearest words, metrics, PCA map, vector inspector | 1, built |
| Text | MiniLM: sentence similarity matrix, pooling inspector, pooling toy, bank experiment | 2, built |
| Applications | semantic vs keyword search, RAG diagram | 3, built |

## 1. Theory (built)

`embeddings-theory.tsx`, six sections:

1. **What an embedding is.** Input → model → vector → picture, with a pipeline diagram labelled `conceptual`.
2. **Modalities.** A table of modality, model examples and typical dimensions. Text is the only modality run here.
3. **Static vs contextual.** GloVe vs MiniLM, with a link to the "bank" attention example in Transformers › Architecture. States that vectors from different models can never be compared.
4. **Similarity metrics.** Dot product, cosine, Euclidean and Manhattan distance, as Unicode formulas. For unit vectors, `a·b = cos(a, b)`.
5. **2D is a shadow.** The king/queen parallelogram, labelled `conceptual`: "An idealized map, not measured data" (the UI string).
6. **Where embeddings are used.** Search, recommendation, clustering, RAG, with an **Open the lab** button to the Intuition tab.

## 2. Intuition (built)

`embeddings-intuition.tsx`, `embeddings-intuition-view.tsx`. Word vectors from GloVe 6B 300d.

```text
┌ rail ─────────────────────────┬ main ───────────────────────────────────────────┐
│ Analogy preset                │ Analogy  king − man + woman = ?          [real] │
│   king/queen · Paris/Rome ·   │   top-k cosine bars, expected word's rank,      │
│   walking/swimming · Custom   │   explanation                                   │
│ A − B + C, expected, top-k    │ Nearest words to “king”                  [real] │
│ Word set                      │   chips pick the word; bars                     │
│   Royalty · Neighborhoods ·   │ Metrics between two words                [real] │
│   Polysemy · Bias ·           │   cosine | dot | euclidean | manhattan,         │
│   Out of vocabulary           │   Normalized switch, vector inspector           │
│ Words (chips, add, remove)    │ Map  PCA of N words                      [real] │
│ ☐ Freeze projection           │   scatter, arrows B→A and C→target,             │
│ ☐ Show arrows · ☐ Show labels │   explained variance, "axes may change"         │
│ [▶ Run]                       │ Missing words with suggestions                  │
└───────────────────────────────┴─────────────────────────────────────────────────┘
```

- **Run** posts the analogy, fetches only the words not yet cached (`/words`), also fetches the top-k neighbour words of the analogy, then projects the cached vectors, the analogy target and those neighbours with `/pca`. The neighbours are drawn on the map as a separate "results" series.
- **Nearest words.** Picking a word chip posts `/neighbors` for that word.
- **Top-k stepper** stops at 10 in the UI; the API allows 20.
- **Metrics, normalisation, arrows, labels and pair selection** are client-side, so controls respond instantly. Cosine, dot, Euclidean and Manhattan are computed in `embeddings-math.ts`.
- **Freeze projection** reuses the stored `mean` and `components` from the first PCA reply and projects new words locally with no request. The basis is the latest one received.
- **Out-of-vocabulary words** return a 400 from `/analogy` and a `missing` list from `/words`, with up to five suggestions as buttons that replace the word. The map keeps drawing for the rest.
- Fewer than three cached vectors: "Add at least three words to draw a map."
- Class colours (`class-1`, `class-2`) mark membership only in the animals-vs-vehicles set; other points use the misc order.

Observed with GloVe 6B 300d (vocabulary limited to 100 000 words):

- `king − man + woman`: queen 0.6713, princess 0.5433, throne 0.5386, monarch 0.5348, daughter 0.4980. Queen is rank 1, also with the full 400 000-word vocabulary.
- `paris − france + italy`: rome 0.7369, milan 0.6661, italian 0.6114.
- Neighbours of "dog": dogs 0.7889, cat 0.6817, pet 0.6292, puppy 0.5936, hound 0.5468.

The input words are excluded from the analogy results, so the lesson states that "queen" is the nearest remaining word, not a proof that the model reasons by analogy. Neighbour lists also carry bias and frequency effects; the Bias word set shows them.

## 3. Text (built)

Three files: `embeddings-text.tsx` (rail and requests), `embeddings-text-view.tsx` (panels, inspect, bank experiment) and `pooling-toy.tsx`. Sentence vectors from all-MiniLM-L6-v2 (384 dims, mean pooling).

```text
"Sentence model: all-MiniLM-L6-v2 · 384 dims · mean pooling"
┌ rail ─────────────────────────┬ main ───────────────────────────────────────────┐
│ Sentence set                  │ Similarity matrix (n×n)                  [real] │
│   paraphrase · synonyms ·     │   click a cell → pair                           │
│   topic · different topics ·  │ Pair: s1 × s2  cosine 0.91               [real] │
│   negation · numbers ·        │   metric, values, explanation                   │
│   opposites · word order ·    │ Map  PCA of n sentences                  [real] │
│   business · all nine ·       │ Nearest sentences to [s1 ▾]              [real] │
│   bank context · Custom       │ Inspect “s1”                             [real] │
│ Sentences (2–20, add/remove)  │   tokens with ids, mask, pooling:               │
│ ☐ Normalize                   │   mean (trained) | CLS | max (experiments)      │
│ [▶ Embed]                     │ Pooling toy 3 tokens × 3 dims      [simulation] │
│ Inspect sentence [s1 ▾]       │   editable; mean / cls / max live               │
│ [▶ Inspect]                   │ Bank experiment                          [real] │
│ Bank experiment [▶ Run]       │   two contextual “bank” vectors: cosine;        │
│                               │   static GloVe “bank” shown, not compared       │
└───────────────────────────────┴─────────────────────────────────────────────────┘
```

- **Embed** posts the sentences to `/sentences`, then the vectors to `/pca`. **Inspect** posts only the selected sentence to `/inspect`; the panel says "Sentence changed: press Inspect" when the text moves on.
- Metric, pair selection, nearest sentence and pooling choice are client-side. The `/inspect` reply holds all three poolings (`pooled.mean`, `cls`, `max`) plus `mean_normalized`, so switching needs no request. Mean is what the model was trained with; CLS and max are labelled experiments.
- **Bank experiment** inspects "We had a picnic on the bank of the river." and "She deposited the money at the bank.", finds the "bank" token in each, and shows the cosine between the two contextual vectors. The static GloVe "bank" vector comes from `/words` and is shown but not compared with the MiniLM vectors: it lives in another space. The panel also shows two GloVe-internal cosines, bank × river and bank × money. Those are valid because both vectors are in the GloVe space. The MiniLM and GloVe numbers are never compared with each other.
- A permanent rail tip says that high similarity is not the same meaning, and points to the Negation preset.
- Each sentence is capped at 200 characters in the UI; the API allows 500.

Observed with MiniLM: paraphrase ("car fast" / "automobile quickly") cosine 0.8369; negation ("payment approved" / "not approved") 0.8182; unrelated ("football" / "database server offline") −0.0810.

## 4. Applications (built)

`embeddings-applications.tsx`, `rag-pipeline-diagram.tsx`.

```text
┌ rail ─────────────────────────┬ main ───────────────────────────────────────────┐
│ Query preset                  │ Semantic search  [real] │ Keyword search [real] │
│ Query [≤ 500 chars]           │  ranked, cosine bars    │  ranked, shared tokens│
│ Top-k [− 5 +]                 │ query tokens, explanation                       │
│ [▶ Search]                    │ RAG pipeline                       [conceptual] │
│ Corpus (collapsible list)     │   documents → chunks → embeddings → index;      │
│                               │   question → embedding → top-k → prompt → LLM   │
│                               │   (LLM greyed: “not run here”)                  │
└───────────────────────────────┴─────────────────────────────────────────────────┘
```

- The corpus is 35 short company-policy documents in five categories (HR, finance, support, IT, travel), seven each. Documents describe the same idea in different words (PTO, vacation, leave), so an exact-word match misses what a vector match finds.
- **Search** posts `{query, top_k}` to `/search`. The reply holds two rankings: semantic (cosine between normalised MiniLM vectors) and keyword (Jaccard overlap of distinct lowercase `[a-z0-9]+` words, no stemming, with the shared words listed). The keyword ranking is naive on purpose. The Top-k stepper and the API both stop at 10.
- Presets: "How many days can employees work remotely?", "my laptop won't turn on", "refund after a month".
- An empty keyword list reads: "No document shares a token with the query — keyword search returns nothing, semantic search still ranks."
- The RAG diagram states that retrieval works without an LLM and links to the Adaptation lesson.

## Outlines (not built)

| Phase | Idea | Sketch |
|---|---|---|
| 4 | Applications, the rest | RAG with a real LLM answering from the top-k; clustering of the sentence map (adds scikit-learn); a recommender over the corpus; a bias probe on word sets |
| 5 | Images | CLIP image and text vectors in one space; text-to-image retrieval |
| 6 | Multimodal | a shared-space view comparing image and text vectors; "same space" vs "different space" warnings |
| 7 | Audio | CLAP audio and text vectors |
| 8 | Advanced | UMAP; saved experiments; a vector index |

## Constraints (all phases)

Kept from the source specification: never present a similarity score as a meaning judgement · separate static from contextual embeddings · never mix vectors from different models · show the real vector before the measure · compute where practical · state limits on the page.

### Cuts, with reasons

| Dropped from the source spec | Why |
|---|---|
| Plotly / Recharts | the course draws hand-written SVG; the scatter, heatmap and bars reuse the existing chart components |
| `/api/v1/labs/embeddings` | repo convention is `/api/<area>/*`; the lesson uses `/api/embeddings/*` |
| response envelope | responses are flat, with `model` and `execution_mode: "real"` |
| server-side embedding IDs | full vectors are returned, so the server holds no state; the client keeps what it needs |
| server-side similarity metrics | the client computes them, so metric and normalise controls are instant |
| job queue, SQLite | every request finishes in milliseconds to seconds; nothing is long-running or stored |
| vector database / FAISS | the corpus has 35 documents; a matrix product is exact and clearer |
| file uploads | out of scope for a lab on text; images and audio come with Phases 5–7 |
| UMAP | PCA is deterministic, explainable and needs only numpy; UMAP is a Phase 8 idea |
| side-by-side model comparison | vectors from different models are not comparable, and the lesson says so instead |
| gensim | no cp314 wheel; GloVe is loaded directly from its Hugging Face files |
| scikit-learn | deferred until a clustering phase needs it |

## Phases

| Phase | Deliverable | Status |
|---|---|---|
| 1 | Embeddings lesson shell; Theory; Intuition (GloVe); `/api/embeddings/*` for words, models, PCA | built |
| 2 | Text tab (MiniLM sentences, inspector, pooling toy, bank experiment) | built |
| 3 | Applications tab (semantic vs keyword search, RAG diagram); `/search`, `/corpus` | built |
| 4 | RAG with an LLM, clustering, recommender, bias probe | idea |
| 5 | Images (CLIP) | idea |
| 6 | Multimodal | idea |
| 7 | Audio (CLAP) | idea |
| 8 | UMAP, saved experiments, vector index | idea |

## API (`algo-server`, `embeddings_routes.py`)

Every `POST` reply carries `model` and `execution_mode: "real"`; `GET /models` and `GET /corpus` do not. Bounds are `Field` constraints; a violation returns 422.

| Endpoint | Body | Reply |
|---|---|---|
| `GET /api/embeddings/models` | — | `{models[{id, name, family, modalities, dimensions, pooling, supports_token_inspection, supports_analogies, embedding_space_id, default_normalization, revision, download_mb, loaded}]}` |
| `GET /api/embeddings/corpus` | — | `{documents[{id, title, category, text}]}` |
| `POST /api/embeddings/words` | `words` 1–40, each 1–40 chars | `{model, execution_mode, dimensions, normalized, found[{word, rank, vector, norm}], missing[{word, suggestions}]}` |
| `POST /api/embeddings/neighbors` | `word` 1–40 chars, `top_k` 1–20 (10), `vocab_limit` 1 000–400 000 (100 000) | `{model, execution_mode, word, vector, neighbors[{word, rank, score}]}`; 400 for an unknown word |
| `POST /api/embeddings/analogy` | `positive` 1–3, `negative` 0–3, `top_k` 1–20 (5), `vocab_limit` | `{model, execution_mode, positive, negative, vector, neighbors}`; 400 for an unknown word |
| `POST /api/embeddings/sentences` | `sentences` 1–20, each ≤ 500 chars, `normalize` (true) | `{model, execution_mode, dimensions, normalized, pooling: "mean", items[{text, vector, tokens, truncated}]}` |
| `POST /api/embeddings/inspect` | `text` ≤ 200 chars | `{model, execution_mode, dimensions, trained_pooling, tokens, ids, attention_mask, token_vectors, pooled{mean, mean_normalized, cls, max}, truncated}` |
| `POST /api/embeddings/pca` | `rows` 1–200, each 2–1024 values, `dimensions` 2 or 3 | `{model: "numpy-svd", execution_mode, points, explained_variance_ratio, mean, components, input_dimensions, output_dimensions, rows}`; 400 for ragged rows, fewer than `dimensions + 1` rows, or rows with fewer values than `dimensions` |
| `POST /api/embeddings/search` | `query` ≤ 500 chars, `top_k` 1–10 (5) | `{model, execution_mode, normalized: true, query_tokens, query_vector, semantic[{id, title, category, score}], keyword[{…, shared}]}` |

- A missing-word 400 carries `{message: "Not in the GloVe vocabulary", missing[{word, suggestions}]}`.
- Vectors are rounded to 5 decimals and scores to 4. GloVe rank is the vocabulary index; 1 is the most common word. GloVe vectors are returned as stored, not normalised.
- `/pca` is stateless: numpy SVD with the sign convention of scikit-learn's `svd_flip`. It returns `mean` and `components` so the client can freeze a projection and project new points locally.
- MiniLM truncates at 256 tokens; `truncated` says so. Pooling is a masked mean including [CLS] and [SEP], verified against `SentenceTransformer.encode()` within 1e-4.
- Models load on first use behind a lock, and the corpus index is built once per encoder.

## Decisions and limits

- **Repo conventions over the source spec.** Hand-written SVG, `/api/embeddings/*`, flat responses, full vectors, client-side metrics, stateless PCA. See the cuts table.
- **Real models, pinned.** GloVe 6B 300d loads from the Hugging Face repo `sentence-transformers/average_word_embeddings_glove.6B.300d` (safetensors plus a vocabulary JSON) at a pinned revision. MiniLM loads through sentence-transformers at a pinned revision. gensim is not used.
- **Download budget.** The transformers spec rejected "a second ~0.5 GB model for one diagram-level point". Here the two models are the lesson. First use downloads about 570 MB once (GloVe about 480 MB, MiniLM about 90 MB); with GPT-2 resident the server holds about 1.1 GB. `HF_HOME` moves the cache. Observed load times: GloVe 0.56 s from a warm cache, MiniLM 6.06 s including imports.
- **Conceptual badge.** Idealised diagrams carry `conceptual`, so no one reads the parallelogram as measured.
- **Deterministic explanations.** Explanation text is a template filled with measured values; no LLM writes it. Wording is gated on the measured cosine, so a low score never reads as "very similar".
- **Placement.** Chapter 05 LLM, slug `embeddings`, replacing the placeholder.
- **Known deviations.** Analogy arrows are drawn B→A and C→target, which are parallel offsets, not A→B. A frozen projection reuses the latest basis, so a basis computed on earlier words may fit later ones poorly.
- **Limits stated on the page.** A 2D map distorts 300 dimensions. High similarity is not equivalence. Neighbours reflect the training text, including its bias.
- **English only**, like the rest of the course; copy goes through `t()`.
- **No ADR**: this is a feature inside existing boundaries.

## Verification

- Python (repo root): `uv run pytest -m "not slow"` (vector maths, GloVe and MiniLM against fakes, the routes, the search corpus), `uv run pytest packages/genai -m slow` (real GPT-2, GloVe and MiniLM: queen among the top five for the king analogy, and the manual mean-pool matching `SentenceTransformer.encode()`), `uv run ruff check apps packages`, `uv run lint-imports`.
- Frontend, from `apps/ai-intro`: `pnpm exec tsc --noEmit`, `npx biome check src`, `npx vitest run`.
- Manual: run the server and the app. Theory: read the six sections and **Open the lab**. Intuition: Run the king preset and check queen is rank 1; add a word with the projection frozen; try the Out of vocabulary set and click a suggestion; switch metrics. Text: Embed the negation and paraphrase sets; click matrix cells; switch pooling; edit the pooling toy; run the bank experiment. Applications: Search the three presets and a query sharing no token with any document. Check the sidebar entry under chapter 05, dark and light themes, 390 px width and the offline notice.
