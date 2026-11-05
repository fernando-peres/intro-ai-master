# PRD + Implementation Plan — Lab 3: Procurement Decision Assistant

**Product:** Northstar Procurement Intelligence  
**Difficulty:** Advanced; reuses retrieval, tools, state and governance  
**Primary objective:** Demonstrate graph-based enterprise semantics, multi-source reasoning and bounded agent collaboration for defensible decisions.

## 1. Business problem and rationale
Procurement teams evaluate suppliers using incompatible quotes, contracts, delivery metrics, compliance records and corporate relationships. A language-only assistant may overlook hidden ownership, apply inconsistent weighting or calculate incorrectly. **Solution:** a decision-support harness combining explicit supplier ontology/knowledge graph, relational pricing data, contract evidence retrieval, deterministic scorecards and two specialized agents. Decisions are recommendations subject to approval, never autonomous purchases.

### Users and jobs to be done
- Procurement analyst: shortlist eligible suppliers for a product requirement.
- Risk/compliance reviewer: flag missing certifications, contract restrictions and related-party risks.
- Manager: review scored recommendations, evidence and approvals.
- Student: contrast graph traversal, semantic retrieval, tool calls, deterministic calculations and agent coordination.

### In-scope process use cases
1. **Supplier discovery:** find suppliers able to fulfill a specified product category, location, quantity and deadline.
2. **Quotation comparison:** normalize price, lead time, shipping and service terms; compare like-for-like quotes.
3. **Risk and compliance:** traverse owner/subsidiary relationships and review documents for required certification.
4. **Purchase recommendation:** generate a transparent shortlist and route to a manager for decision.

**Out of scope:** automatic issuing of purchase orders, real payment execution, external supplier contacts, legal sign-off by the model.

## 2. Learning outcomes
Understand ontologies as business meaning; distinguish graph facts from free-text claims; combine graph and hybrid retrieval; define specialist agent responsibilities; implement transparent deterministic scoring and mandatory review; evaluate decision soundness and evidence coverage.

## 3. Functional requirements and acceptance criteria
| ID | Requirement | Verifiable acceptance criterion |
|---|---|---|
| P-01 | Supplier knowledge graph | Entity IDs and typed relations persist; graph traversal reveals parent/subsidiary links |
| P-02 | Search suppliers by constraints | Required product capability, geographic scope and mandatory compliance filters are enforced |
| P-03 | Compare commercial offers | Normalized total cost calculated by backend code, with currency/rate source and timestamp |
| P-04 | Review contract/policy evidence | Evidence links to contract ID/version/clause; unsupported claims flagged |
| P-05 | Coordinate two agents | Research and Risk agents return schema-validated, evidence-linked findings with no action authority |
| P-06 | Explain scoring | Manager can see weights, underlying values, exclusion rules and sensitivity analysis |
| P-07 | Approval gate | Recommendation can be approved/rejected; purchasing remains outside prototype scope |
| P-08 | Handle incomplete evidence | Missing required certification leads to ineligible/needs-review, never an invented attestation |

## 4. Synthetic data specification
**Tables:** 25 `suppliers`, ~80 `quotes`, 30 `contracts`, 50 `purchase_requests`, 150 `delivery_events`, 70 `certifications`, 30 `risk_events`, 20 `supplier_scores`, 10 `approval_records`. Seed multiple currencies but freeze synthetic rate table with source/version for reproducibility. Include quote expiry, volume tiers, penalty clauses and incomplete terms.

**Artifacts:** contract PDFs/MD (30), supplier profiles (25), catalog specs (25), compliance statements (30), quotation CSV/JSON (80). Some contract text should conflict with quoted terms so the harness must highlight discrepancy rather than guess.

**Knowledge graph entities:** `Supplier`, `LegalEntity`, `ProductCategory`, `Product`, `Certification`, `Region`, `Contract`, `RiskEvent`.
**Relations:** `OWNED_BY`, `SUBSIDIARY_OF`, `SUPPLIES`, `AUTHORIZED_IN`, `HOLDS_CERTIFICATION`, `PARTY_TO`, `HAS_RISK_EVENT`, `ALTERNATIVE_TO`. Store provenance `{source_id, observed_at, effective_from, confidence, verified_by}` per fact. Use a lightweight graph layer with Neo4j or relational edge table for the lab; the frontend graph viewer must illustrate traversals.

**Gold fixtures:** 30 procurement requests, including 8 apparent low-cost but ineligible suppliers, 5 shared-parent relationship traps, 5 expired certifications, 5 contract conflicts, 7 straightforward valid cases.

## 5. Harness design
**Workflow A — Source and compare:** parse purchase request → mandatory-constraint filter → graph discover suppliers → retrieve quotes and contract excerpts → deterministic normalize costs → create scorecard → report shortlist.

**Workflow B — Review and approve:** trigger parallel research/risk assessments → consolidate evidence → flag discrepancies → issue recommendation and sensitivity analysis → request manager approval → store decision and trace.

**Agent 1, Supplier Research:** finds supplier capability, availability and commercial terms using read-only tools. **Agent 2, Risk & Compliance:** checks certifications, corporate relationships, risk events and restrictive contract clauses. An orchestrating workflow reconciles results and requests more evidence when agents disagree; numeric scoring is not delegated to either agent.

**Tool contracts:**
- `find_suppliers(category, region, quantity, deadline)` → filtered IDs and exclusions.
- `graph_neighbors(entity_id, relationship_types, max_depth)` → grounded edges with provenance.
- `get_supplier_quote(supplier_id, request_id)` → offer lines, currency, validity and terms.
- `retrieve_contract_clauses(contract_id, topics[])` → exact citations.
- `calculate_total_landed_cost(quote_id, request_id, rate_version)` → normalized numerical breakdown.
- `score_supplier(supplier_id, request_id, weighting_profile)` → deterministic score, exclusions and sensitivity.
- `submit_recommendation_for_approval(request_id, recommended_supplier_id, evidence_ids[])` → pending approval item.

**Rules/guardrails:** hard compliance exclusions override overall score; never manufacture rates or certifications; prohibit purchasing writes; graph paths respect authorization; conflict between evidence sources escalates; evidence citations required for nonnumeric claims; explain assumptions and versioned scoring rules.

**Memory:** structured decision record `{request_id, requirements, candidate_ids, excluded_ids, evidence_ids, agent_findings, score_profile_version, unresolved_risks, manager_decision, status}`; separate episodic decision history, not automatically reinterpreted as current policy. Store graph-fact provenance and rule versions.

## 6. Architecture / API / UI
- Add graph service (`graph_edges` in PostgreSQL or Neo4j), contract retriever, scoring/FX simulation and approval service.
- `POST /api/labs/3/requests`, `POST /api/labs/3/requests/{id}/evaluate`, `GET /api/labs/3/suppliers/{id}/graph`, `POST /api/labs/3/quotes/compare`, `POST /api/labs/3/recommendations/{id}/approve`, `POST /api/labs/3/evaluate`, `GET /api/runs/{run_id}`.
- React: procurement request builder; supplier graph; quote comparison grid; agent findings side-by-side; score/weight sensitivity; conflicts and exclusion badges; approval queue; evaluation.

## 7. Evaluation plan
**Deterministic:** 100% correct exclusion on mandatory-rule fixtures; arithmetic and exchange-rate conversions match oracle; no approval bypass; graph query matches expected provenance edges. **Retrieval:** contract-clause recall@5. **Agent metrics:** agent role adherence, evidence coverage, contradictory-claim detection. **LLM judge:** explanation defensibility, completeness, explicit uncertainty (0–4), scored from source packet; calibrate with human reviewer. **Provisional demo targets:** ≥90% correct shortlist inclusion/exclusion and ≥85% retrieval recall@5; hard constraints remain 100%.

## 8. Incremental delivery plan
| Phase | Tasks | Exit gate |
|---|---|---|
| 0. Model and seed | Relational schema, graph ontology, document corpus, edge provenance | Graph and tabular facts consistent |
| 1. Deterministic sourcing | Filters, cost calculator, scoring profile and tests | Baseline scorecards reproduce expected outputs |
| 2. Graph + retrieval | Graph traversal, contract passage retrieval, conflict detection | Related-party risk surfaced |
| 3. Specialist agents | Research agent, risk agent, schema validation and orchestrator | Two independent evidence-backed findings |
| 4. Review workflow | Reconciliation, sensitivity analysis, approval state, audit | Safe manager-reviewed recommendation |
| 5. Evaluation + teaching UI | Graph viewer, trace, hard-case pack, judge calibration | Conflict and false-cheapest scenarios pass |

## 9. Risks and mitigations
Graph misinformation → source-level provenance and expiry. Numeric hallucination → backend scoring oracle. Overconfident agent consensus → independent checks and disagreement escalation. Criteria gaming → hard exclusions before weighted scoring. Conflicting contract terms → surfaced as unresolved risk for human reviewer.

## 10. Student exercise and deliverables
Students evaluate three suppliers where the cheapest lacks valid certification and two suppliers share a parent company. Compare naive LLM ranking, deterministic scoring, graph-enriched risk review and multi-agent recommendation. Deliver graph snapshot, scorecard, evidence trail, approval record, risk memo and measured evaluation improvements.

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
