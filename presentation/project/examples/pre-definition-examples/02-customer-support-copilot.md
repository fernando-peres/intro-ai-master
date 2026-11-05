# PRD + Implementation Plan — Lab 2: Customer Support Copilot

**Product:** Northstar Service Desk Copilot  
**Difficulty:** Intermediate; reuses Lab 1 retrieval  
**Primary objective:** Move from answering questions to safe, stateful business-tool use.

## 1. Business problem and rationale
Support employees manually combine policies, customer records, order status, warranty history and previous tickets. Context is lost between sessions, and inconsistent resolutions create rework. **Solution:** a support copilot with bounded tool use, deterministic eligibility rules, two explicit workflows and durable structured case memory. A model can interpret customer language and select information, but database lookups, permissions and updates need controlled APIs.

### Users and jobs to be done
- Support representative: resolve order and warranty inquiries with current evidence.
- Team lead: examine escalations and audit resolution recommendations.
- Student: learn tool-call selection, typed API contracts, working memory and persistence.

### In-scope process use cases
1. **Warranty eligibility:** customer reports a defective NX-200, assistant verifies ownership, purchase date, warranty policy and claim history.
2. **Where is my order?** retrieve fulfillment/shipping status and explain delay, without inventing delivery dates.
3. **Troubleshooting and escalation:** retrieve manual steps, ask diagnostic questions and create a ticket after consent.
4. **Resume interrupted case:** restart service and continue using persisted structured state, not only chat replay.

**Out of scope:** unattended refunds, financial transactions, changing warranty policy, sending customer-facing messages without review.

## 2. Learning outcomes
Distinguish retrieval from authoritative structured records; define tool contracts, typed arguments and backend authorization; design deterministic workflows versus flexible agent decisions; extract working memory and persist workflow checkpoints; evaluate action safety separately from answer fluency.

## 3. Functional requirements and acceptance criteria
| ID | Requirement | Verifiable acceptance criterion |
|---|---|---|
| S-01 | Resolve customer identity within simulated auth scope | User can access only seeded authorized customers; unauthorized ID returns denial |
| S-02 | Query orders, warranties and tickets | Tools return typed JSON with record ID, status and update timestamp |
| S-03 | Eligibility computation | Deterministic service uses dates, product warranty and claim rules; model cannot change result |
| S-04 | Support workflow | Runs triage → lookup → policy check → proposal → approval → mutation / escalation |
| S-05 | Resume from durable state | Interrupted case resumes after process restart with same case stage, facts and pending action |
| S-06 | Protected writes | Ticket creation/update requires scope, consent/confirmation and idempotency key |
| S-07 | Agent trace | UI shows selected tool, arguments, response, decision and validation errors |
| S-08 | Safety evaluation | Injection, unauthorized customer, duplicate write and tool timeout scenarios have explicit safe outcomes |

## 4. Synthetic data specification
**Relational entities** (seeded and linked to Lab 1 products/policies): `customers` (100), `orders` (300), `order_items` (~450), `shipments` (~180), `warranty_registrations` (~200), `tickets` (150), `ticket_events` (~500), `conversations` (50), `support_agents` (8). Include canceled orders, out-of-warranty items, mismatched ownership, missing tracking numbers, repeated claims and disputed purchases.

**Data artifacts:** CSV seed tables, SQL migrations, JSON events/conversations, warranty policies and troubleshooting manuals from Lab 1. Use fabricated names and addresses only; no real personal data.

**Knowledge semantics:** `Customer` — `placed` → `Order`; `Order` — `contains` → `Product`; `Product` — `covered_by` → `WarrantyPolicy`; `Ticket` — `about` → `Order|Product`. Implement via foreign keys and server joins; an optional graph visualization may show relationships, without requiring a graph DB.

**Gold fixtures:** 35 cases (10 warranty-eligible, 8 ineligible, 7 order inquiries, 5 troubleshooting, 5 escalation/edge cases), each with allowed records, expected eligibility, expected permitted action and expected state transition.

## 5. Harness design
**Workflow A — Warranty claim triage:** authenticate → identify customer/order → retrieve purchase + warranty policy → deterministic eligibility → draft explanation → request confirmation → create or update ticket → persist outcome.

**Workflow B — Troubleshoot and escalate:** identify product and symptom → retrieve troubleshooting steps → record user responses → resolve or create escalation → persist summary and evidence.

**Agent:** one Support Copilot with read-only `get_customer`, `get_order`, `get_warranty`, `get_ticket`, `search_knowledge`; bounded write requests `propose_ticket_action`. A workflow controller, not the agent, executes `commit_ticket_action` after backend validation and user approval. Optional specialized troubleshooting assistant only if student exercises need a second agent.

**Tools:**
- `get_customer(customer_id)`; `get_order(order_id)`; `get_warranty(order_item_id, as_of)`; `list_tickets(customer_id)`.
- `calculate_warranty_eligibility(order_item_id, claim_date)` returns explicit result, matched rule IDs and reasons.
- `propose_ticket_action(case_id, action_type, payload)` returns a preview and required approval.
- `commit_ticket_action(proposal_id, approval_token, idempotency_key)` writes, audits and returns ticket ID.

**Rules and guardrails:** verify customer ownership, never expose a different customer's record, never bypass calculated eligibility, do not infer missing tracking dates, no silent writes, audit every mutation, tool outputs are untrusted text/data, mask synthetic contact details in evaluation traces.

**Memory and state:**
- Short-term session: last turns needed for conversational continuity.
- Extracted structured working memory: `{case_id, customer_id, order_id, product_id, issue_type, symptom_codes, confirmed_facts, evidence_refs, unresolved_questions, workflow_stage, pending_proposal_id, updated_at}`; validate schema before persistence.
- Episodic case summary: resolution, approved action, outcome and evidence; searchable for audit, never treated as an authoritative policy.
- Resume test compares restored state to last committed checkpoint; protect against duplicate writes.

## 6. Architecture / API / UI
- FastAPI support domain services + existing knowledge retrieval; PostgreSQL transactions for tickets, cases and audit events.
- `POST /api/labs/2/cases`, `GET /api/labs/2/cases/{id}`, `POST /api/labs/2/cases/{id}/message`, `POST /api/labs/2/cases/{id}/resume`, `GET /api/labs/2/orders/{id}`, `POST /api/labs/2/ticket-proposals`, `POST /api/labs/2/ticket-proposals/{id}/approve`, `POST /api/labs/2/evaluate`.
- React: customer/order selector; support conversation; policy evidence panel; tool-call waterfall; editable/validated memory JSON viewer; action approval modal; ticket history and evaluation.

## 7. Evaluation plan
**Hard constraints:** 100% unauthorized-access denial in fixtures, 100% writes behind approval, 0 duplicate writes in retry test, 100% eligibility match to code-based oracle. **Workflow metrics:** correct next step, accurate tool arguments, case completion, state replay, failure recovery. **LLM judge:** clarity, empathy without unsupported promises, evidence-based explanation (0–4 each). Human reviewer validates 10 judge-labeled outcomes. **Provisional demo target:** ≥85% correct tool choice across seeded cases; all prohibited mutations blocked.

## 8. Incremental delivery plan
| Phase | Tasks | Exit gate |
|---|---|---|
| 0. Data/model | Seed customers/orders/tickets, define rule tables and gold cases | Referential integrity + fixtures validated |
| 1. API foundation | Read tools, authorization and warranty calculation | Deterministic API results verified |
| 2. Tool-using assistant | Agent routing, typed tool schema, evidence retrieval | Representative case resolved without write |
| 3. Workflow + actions | State machine, proposed ticket actions, approval, audit, idempotency | Safe ticket creation demo |
| 4. Memory | Extract schema, checkpoint, restart-and-resume, episodic summary | Interrupted case resumes exactly once |
| 5. Evaluation + failure drills | Tool timeout, injection, permission, duplicates and judge rubric | Baseline/harness report and tests pass |

## 9. Risks and mitigations
Unauthorized disclosure → backend scope checks on every read/write. Wrong eligibility → isolated deterministic rule engine with boundary tests. Lost state → transactionally persisted checkpoint and schema version. Hallucinated write success → verify tool response and transaction receipt. Double submission → idempotency keys, action state machine.

## 10. Student exercise and deliverables
Students solve one warranty case manually using separate records, then run a read-only copilot, introduce protected ticket creation and simulate restart. Deliver state schema, tool-call trace, approval/audit evidence, tests for unauthorized access and duplicate writes, and baseline comparison.

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
