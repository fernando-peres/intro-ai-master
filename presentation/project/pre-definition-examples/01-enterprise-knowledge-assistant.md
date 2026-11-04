# PRD + Implementation Plan — Lab 1: Enterprise Knowledge Assistant

**Product:** Northstar Knowledge Assistant  
**Difficulty:** Beginner; foundation for Labs 2–4  
**Primary objective:** Move from a generic LLM answer to a source-grounded enterprise response.

## 1. Business problem and rationale
Northstar employees search across versioned HR policies, product manuals, FAQs and operating procedures. Documents conflict, become outdated and are difficult to locate. A base LLM cannot reliably know the company's current rules. **Solution:** a permission-aware document assistant using ingestion, hybrid retrieval, metadata filters, source citations, abstention and evaluation. This is the simplest useful harness: tools for retrieval and rules around model context, without autonomous business actions.

### Users and jobs to be done
- Employee: ask about current policy and receive a cited answer.
- Support analyst: locate technical instructions for a product or compare policy revisions.
- Content owner: identify outdated and conflicting documents.
- Instructor/student: inspect chunking, retrieval, prompt context and groundedness.

### In-scope process use cases
1. **Policy Q&A:** “Can a field technician claim travel expenses?” Distinguish current policy from expired one.
2. **Product troubleshooting lookup:** “How do I reset model NX-200?” Cite the correct manual and version.
3. **Policy change comparison:** identify changes between version 1 and version 2 of an expense policy.
4. **Low-evidence refusal:** abstain or ask for clarification where the approved corpus lacks the answer.

**Out of scope:** changing a policy, employee personal-record access, sending messages, automatic ticket creation, web-browsing external sources.

## 2. Learning outcomes
- Distinguish parametric knowledge from retrieved enterprise evidence.
- Inspect document ingestion, chunking, embeddings, keyword search, ranking and context budgets.
- Use metadata (validity period, version, access group, owner) to avoid stale/unauthorized evidence.
- Understand citations, groundedness, prompt injection risks and retrieval-versus-generation evaluation.

## 3. Functional requirements and acceptance criteria
| ID | Requirement | Verifiable acceptance criterion |
|---|---|---|
| K-01 | Ingest PDF/MD/TXT documents and normalize extracted text | Every ingested item has document ID, version, owner, valid dates, checksum and extraction status |
| K-02 | Chunk and index documents with metadata | Each chunk maps to a document/version/page or section; reindexing does not duplicate chunks |
| K-03 | Hybrid search with filters | Query returns ranked snippets filtered by access group and effective date |
| K-04 | Grounded answer with citations | Claims cite document ID/version and specific section/page; no invented citations |
| K-05 | Uncertainty handling | Unanswerable fixture produces explicit insufficiency rather than fabricated policy |
| K-06 | Compare versions | Change report identifies changed clauses and links both source versions |
| K-07 | Visible execution inspection | UI shows retrieval query, retrieved chunks, filters, context size and final sources |
| K-08 | Baseline/evaluation | Same fixture set runs against direct LLM and RAG, with exportable metrics |

## 4. Synthetic data specification
**Generate ~35 synthetic documents** in `fixtures/northstar/knowledge/`:
- 10 HR/employee policy documents (expense, remote work, travel, equipment, onboarding), including 3 superseded versions.
- 12 product manuals / FAQ sheets across 5 products (NX-100, NX-200, NX-300, NX-Pro, NX-Hub).
- 8 operating procedures (returns, warranty intake, safety, service handoff).
- 5 intentionally ambiguous/contradictory or incomplete documents; label expected resolution in test fixtures.
- MD/TXT source as canonical authoring format; generate PDF versions for realistic ingestion tests; keep identical IDs across formats to prevent accidental duplicate counting.

**Metadata schema** `documents(id, title, domain, owner_team, access_groups[], product_ids[], version, status, effective_from, effective_to, source_uri, checksum, supersedes_id, created_at)` and `chunks(id, document_id, version, section, page, body, embedding, token_count)`.
**Ontology/semantics:** `Document` — `describes` → `Product|Policy|Procedure`; `DocumentVersion` — `supersedes` → `DocumentVersion`; `Policy` — `owned_by` → `Department`. Lab 1 can express these as relational metadata; a graph DB is **not** required.
**Gold evaluation set:** 40 questions (20 exact, 8 multi-document, 6 version-sensitive, 6 unanswerable); reference evidence IDs plus rubric, not only one rigid answer string.

## 5. Harness design
**Workflow A — Answer with evidence:** authenticate → classify domain → apply permissions/date filters → hybrid retrieve → rerank (optional) → assemble bounded context → LLM answer → validate citation IDs → display answer and trace.

**Workflow B — Compare document versions:** choose policy ID and versions → retrieve matching sections → deterministic diff → LLM summarize implications → link changed sections.

**Agent:** one bounded Knowledge Assistant chooses `search_knowledge`, `fetch_document_section`, and `compare_versions` as read-only tools. A deterministic workflow is the default; the agentic option is a controlled comparison experiment.

**Tools / contracts**
- `search_knowledge(query, domain?, product_id?, as_of?, top_k)` → chunks + permissions-filtered metadata.
- `fetch_document_section(document_id, version, section_id)` → exact source excerpt.
- `compare_versions(document_id, old_version, new_version)` → section-by-section diff.

**Rules/guardrails:** never use unauthorized or expired documents as authoritative; cite sources for factual policy statements; untrusted retrieved text cannot override system instructions; ask for clarification if product/version ambiguous; no write tools.

**Memory:** ephemeral conversation state only; optional structured session fields `{topic, product_id, document_version, unresolved_question}`. Do **not** teach persistent personal memory here; focus on context window, explicit state and retrieval.

## 6. Architecture / API / UI
- Ingestion worker: extract → normalize → chunk → embed → index (record statuses and errors).
- PostgreSQL document metadata + full-text index; pgvector; provider adapters; retrieval/evaluation service.
- `POST /api/labs/1/ingest`, `GET /api/labs/1/documents`, `POST /api/labs/1/search`, `POST /api/labs/1/answer`, `POST /api/labs/1/compare`, `POST /api/labs/1/evaluate`, `GET /api/runs/{run_id}`.
- Frontend panels: document library/version badges; retrieval ranking; chunk inspector; prompt/context preview (secrets removed); answer with clickable citations; evaluation comparison.

## 7. Evaluation plan
**Deterministic:** permission filtering 100% in authorization fixtures; citation IDs resolve 100%; no superseded document used as current when a current version exists; ingestion idempotent. **Retrieval:** recall@5 and MRR on gold evidence. **LLM judge:** assess groundedness (0–4), completeness (0–4), and proper abstention (0–4) against provided evidence only; calibrate against ~10 human-labelled cases. **Target for classroom demo:** ≥85% evidence recall@5 and ≥90% citation validity on 40 seeded questions; these are provisional targets, adjust after baseline measurement.

## 8. Incremental delivery plan
| Phase | Implementation tasks | Demo / exit gate |
|---|---|---|
| 0. Design and fixture generation | Draft policies/manuals, metadata schema, reference Q&A, version conflicts | 35 documents + 40 gold questions reproducible |
| 1. Baseline | Plain LLM QA UI; baseline scoring | Show wrong/unsupported answer on controlled fixture |
| 2. Ingestion/retrieval | Parser, chunks, embeddings, FTS/pgvector, filters | Retrieve exact and semantically similar passages |
| 3. Harness controls | Prompt assembly, citations, abstention, version filter | Cite approved version; reject injected instructions |
| 4. Comparison + evaluation | Version diff workflow, judge rubric, trace dashboard | Student sees failure-to-improvement comparison |
| 5. Hardening | Auth, test suite, seeding, documentation | All definition-of-done checks pass |

## 9. Risks and mitigations
- Retrieval miss → tune chunk boundaries, hybrid search, reranking, top-k; measure retrieval independently.
- Version confusion → explicit `effective_from/effective_to`, `supersedes_id`, and server filtering.
- Hallucinated citations → output schema enforces citations from allowed retrieved chunk IDs.
- Prompt injection in docs → role separation, never execute embedded instructions, injection tests.
- PDF text quality → retain canonical MD as reference and flag extraction errors.

## 10. Student exercise and deliverables
Students run a direct-prompt baseline, add retrieval, apply version/permission metadata, compare two policy versions, and evaluate five edge cases. Deliver: saved run IDs, a system diagram, two failed and two improved cases, and a short tradeoff explanation.

## Shared implementation conventions
- **Platform:** existing Python/FastAPI backend and React/TypeScript frontend; PostgreSQL for canonical records and durable state; pgvector and full-text search for retrieval; Neo4j optional where explicitly introduced.
- **Model isolation:** provider-neutral interfaces (`generate`, `embed`, `judge`) with structured-output validation, timeout limits, and mock mode for deterministic classroom demonstrations.
- **Cross-lab domain:** fictitious Northstar Electronics; stable IDs across customers, products, orders, suppliers, quotations, contracts, shipments and tickets. Never use real personal information.
- **Instrumentation:** trace ID, run ID, model/provider and version, prompt-template version, retrieved document IDs and versions, tool calls, latency, token usage and estimated cost; redact private content.
- **Security:** validate tool inputs server-side; least-privilege tool scopes; tenant/user authorization checked by backend code, not prompts; no secrets in logs or synthetic data; retrieved documents/tool outputs are untrusted.
- **Interface:** a Lab Workbench with Scenario Selector, Conversation, Context Inspector, Tool Timeline, Workflow State, Memory Inspector, Evaluation tab and baseline-versus-harness comparison.
- **Reproducibility:** seed generator, seed version, migration scripts, canned requests and gold/reference outcomes, fixture reset command, optional LLM-off replay mode.
- **Definitions:** Workflow = explicit state transitions controlled by code; agent = model-driven bounded decisions within a defined tool/permission envelope. Deterministic code owns financial computations, eligibility rules, permissions and external writes.

## Definition of done (applies to all labs)
- Scenario runs end to end in the React workbench with a traceable workflow and data provenance.
- Seed data and fixtures are documented and reproducible; reset and replay work.
- At least one positive, ambiguous, conflicting, unauthorized, prompt-injection and tool-failure test is demonstrated.
- Human-readable evaluation report compares LLM-only baseline with harness configuration on identical test cases.
- Required policy decisions and permission checks are enforced in code; actions are audited.
- Automated unit, integration, contract, and end-to-end smoke tests pass; setup instructions work from a fresh monorepo checkout.
