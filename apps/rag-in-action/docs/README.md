# rag-in-action: step-by-step RAG simulator

**Status:** Implemented
**Project:** `apps/rag-in-action`

## Purpose

Show every stage of RAG on real intermediate data, so a class can watch how chunking, enrichment, embedding and retrieval choices change what reaches the model and how it answers.

## Access

Every page sits behind a login page (`ui/auth.py`); deep links land on it too. Credentials default to `student` / `novaims` and are overridden by `APP_USER` / `APP_PASSWORD` (environment or Streamlit Cloud secrets). The session stays logged in until the browser tab closes.

## Behavior

Each stage is a page. The stepper rail locks a page until every earlier stage is done (Analytics excepted), and finishing a stage again clears every later one (and the chat).

1. **Load.** Parses `corpus/*.md` into documents: frontmatter, body, and links (`related:` plus inline `[text](id.md)`). Shows the documents table, the rendered and raw file, a link graph, and the keyword index.
2. **Chunk.** Six strategies, each returning chunks whose `text == body[start:end]`:

   | Key | Splits | Parameters |
   |---|---|---|
   | `fixed_chars` | every N characters | size, overlap |
   | `fixed_tokens` | every N word/punctuation tokens | size, overlap |
   | `recursive` | headings → paragraphs → sentences → spaces, until each piece fits | size, overlap |
   | `markdown` | at headings up to a level; the heading trail is kept | max level |
   | `sentence_window` | N sentences, sliding by a stride | window, stride |
   | `semantic` | where the cosine between neighbouring sentences drops below a threshold (MiniLM) | threshold, max sentences |

   The preview highlights chunks in place, marks overlaps and dropped whitespace, and compares two strategies side by side.
3. **Enrich.** Optional: a contextual header (`Document:` / `Section:`) added to the *embedded* text only; index keywords found in the chunk; related document ids; department, tags and date. The LLM always reads the plain chunk text.
4. **Embed.** `all-MiniLM-L6-v2` (local, 384-d) or `text-embedding-3-small` (OpenAI, 1536-d, needs a key). Vectors are float32 and unit length. Shows a 2-D PCA map, a heatmap of the raw values, and nearest neighbours.
5. **Store.** A FAISS `IndexFlatIP` (exact search; inner product equals cosine on unit vectors), with a sidecar list in which record *i* describes row *i*. **Save to disk** writes `var/<config-hash>/index.faiss` and `records.json`.
6. **Retrieve & chat.**
   - **Retrievers:** dense (FAISS cosine), keyword (BM25 over the embedded text; ×1.25 for documents the keyword index lists for a term in the question), or hybrid (reciprocal-rank fusion, k = 60).
   - **Options:** top-k; a minimum cosine (dense only); a department filter, which also applies to linked documents; and "follow links", which adds the best dense chunk of each document linked from a hit.
   - **Answers:** RAG, no RAG, or both side by side. The RAG prompt asks for answers from the context only, with `[doc#n]` citations.
   - **Trace:** retrieved chunks with their cosine, BM25 score and matched terms; the exact prompt; the question placed on the PCA map; and the time each stage took.
   - **Source modal:** a **Sources** row under a RAG answer has one button per cited chunk, and every retrieved-chunk card has **Open doc.md**. Either opens the whole document, rendered as Markdown, in a modal: metadata chips, the cited passage at the top, and buttons that open its related documents in the same modal. Corpus links can't navigate inside a modal, so they show as bold text plus the target id.
7. **Analytics.** Opens anytime, without the steps before it. It uses the step-5 index when one exists, otherwise a default index built once per server (Markdown chunks, MiniLM, all enrichments). Topic modeling over `corpus/support/questions.csv`: 254 invented support questions (UTC `asked`, channel, customer tier) spread over 12 weeks, plus any question asked in this session's chat.
   - **Method:** embed every question with the index's model, cluster with KMeans (4–14 topics, default 10, fixed seed), and name each topic by its top c-TF-IDF terms. Centroids are fit on the authored log only, so chat questions are placed into existing topics instead of reshuffling them.
   - **Coverage:** each question's best cosine against the FAISS index. Below the gap threshold (default 0.40) the knowledge base can't answer it.
   - **Verdicts** (in order): *knowledge gap*, when at least half a topic's questions are unanswered; *process unclear*, when it covers at least 10% of the questions and at least 25% start "How do I / Can I…"; *high demand*, when it covers at least 10%; otherwise *covered*.
   - **Shows:** topics by size coloured by verdict, a 2-D map of the questions, a topic × week heatmap (authored log only; the March outage spikes in weeks 9–11), questions per product or service, and one insight card per topic.
   - The log has planted patterns: ColdBox returns asked most, a credit-claim spike after the March outage, and three subjects the corpus doesn't cover (invoices and VAT, live animals, shipping outside Iberia).

## Out of scope

Approximate FAISS indexes (IVF, HNSW), rerankers, uploading your own documents or question logs, LLM-written topic names, and saving the chat between sessions.

## Verification

- [x] `uv run pytest apps/rag-in-action/tests`: corpus integrity, exact offsets for every strategy, enrichment, FAISS round-trip, keyword/hybrid/filter/link retrieval, prompt and citations, topic naming, coverage, verdicts and stable topic assignment, and an `AppTest` walk through every page, including the source modal.
- [x] `uv run lint-imports`: `genai` does not import `rag_in_action`.
- [x] Manual: run all steps, then ask the starter questions with **Both**. The RAG answer cites the right chunks; the no-RAG answer invents facts.
