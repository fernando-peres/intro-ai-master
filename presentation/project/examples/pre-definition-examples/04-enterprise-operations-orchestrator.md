# PRD + Implementation Plan — Lab 4: Enterprise Operations Orchestrator

**Product:** Northstar Exception Response Center  
**Difficulty:** Capstone; composes Labs 1–3  
**Primary objective:** Build a governed, durable, event-driven multi-agent harness that supports cross-functional decisions and executes only authorized actions.

## 1. Business problem and rationale
A supplier shipment delay may reduce warehouse stock, prevent customer orders from shipping, breach service commitments, and require procurement alternatives. Teams otherwise manually reconcile events across logistics, inventory, purchasing and support. **Solution:** an event-driven operations harness that detects exceptions, assembles cross-domain context, coordinates bounded specialist agents, proposes remediation plans, obtains approvals and executes audited tool actions with retries and compensation paths.

### Users and jobs to be done
- Operations manager: see impact and select a mitigation plan.
- Inventory planner: quantify stock and order exposure.
- Procurement analyst: identify feasible alternate supply.
- Support lead: review customer communications and ticket escalations.
- Student: understand orchestrators, runtime state, agent boundaries, event handling, approvals, rollback and end-to-end evaluation.

### In-scope process use cases
1. **Delayed shipment exception:** upstream event triggers impact analysis across orders and inventory.
2. **Stockout mitigation:** compare alternate stock transfers, backorder options and supplier replenishment.
3. **Approval and execution:** manager authorizes reserving available stock or creating an internal follow-up task; proposed customer messages require review.
4. **Partial failure recovery:** pause/resume, retry idempotently and escalate when a downstream service is unavailable.

**Out of scope:** autonomous external purchases, payment, production ERP mutations, unreviewed customer message sends, real-world logistics booking.

## 2. Learning outcomes
Compare event-triggered and user-triggered workflows; understand orchestration versus delegated agents; manage durable state and exactly-once effects using idempotent application logic; apply action-specific approvals and audit; measure business outcomes, time, tokens and safety at system level.

## 3. Functional requirements and acceptance criteria
| ID | Requirement | Verifiable acceptance criterion |
|---|---|---|
| O-01 | Receive events reliably | Ingested event has event ID, type, timestamps, schema version and deduplication key |
| O-02 | Compute affected orders | Inventory/order tool reports impacted order IDs and quantities; validated against fixture oracle |
| O-03 | Generate mitigation options | At least two options presented when available, with costs, uncertainty and affected records |
| O-04 | Coordinate specialist agents | Inventory, Procurement and Communications roles produce schema-checked outputs in scoped permissions |
| O-05 | Enforce approval | Every action with external/business side effect requires explicit approver identity and scope |
| O-06 | Execute safely | Tool writes use idempotency keys; retries never duplicate reservations/tasks |
| O-07 | Resume after failure | Workflow persists checkpoint and resumes after simulated process restart or tool outage |
| O-08 | Explain and audit | Timeline shows events, facts, agent recommendations, rule decisions, approvals, writes and results |
| O-09 | Compare outcomes | Dashboard shows orders at risk, mitigation effect, time, cost, token usage and safety incidents |

## 4. Synthetic data specification
**Reuse prior lab IDs and add:** `inventory_positions` (500), `warehouse_locations` (5), `shipments` (100), `shipment_events` (~300), `purchase_orders` (100), `order_allocations` (~700), `customer_commitments` (120), `exception_cases` (50), `approval_requests` (50), `action_ledger` (~150), `notification_drafts` (50). Generate timestamps, item SKUs, warehouses and quantities with referential consistency.

**Artifact/event samples:** JSON events such as `shipment.delayed`, `inventory.threshold_breached`, `order.priority_changed`, `supplier.quote_updated`, `approval.granted`; schemas versioned and documented. Include duplicates, reordered events, absent fields, late arrivals, stale stock counts and a temporarily unavailable ERP adapter.

**Enterprise knowledge graph:** connect `Supplier` → `PurchaseOrder` → `Shipment` → `Warehouse` → `SKU` → `CustomerOrder` → `Customer`; attach contract commitment and exception events. Preserve provenance and validity of each edge. Use graph traversals for impact discovery, but canonical quantities must come from transactional tables.

**Gold scenario pack:** 20 end-to-end incidents, including 5 straightforward delays, 4 conflicting data, 4 missing/duplicate event cases, 4 service-failure/retry cases, 3 approval/authorization edge cases.

## 5. Harness design
**Workflow A — Detect, assess and propose:** ingest event → deduplicate → derive affected entities → inventory impact calculation → delegate procurement alternatives and customer implications → reconcile proposals → compute business impact → issue approval request.

**Workflow B — Approve, act and recover:** verify authorized approval → commit reservation or internal task through deterministic transactional tool → prepare notification draft → verify outcomes → update case → if failure, retry idempotently, compensate supported writes or escalate to human.

**Agents and boundaries:**
- **Operations Orchestrator (coordinator):** select investigation branches and summarize options, but cannot call side-effecting tools directly.
- **Inventory Agent:** analyze stock, allocations and fulfillment exposure with read-only tools.
- **Procurement Agent:** reuse Lab 3 sourcing/risk evidence to assess replacement supply.
- **Communications Agent:** draft customer-facing explanations grounded in verified impact; no send permission.

**Teaching constraint:** Labs should expose orchestrator plus 1–2 delegated agents at a time, then run full 3-specialist coordination in the capstone. Workflow engine retains authority for transitions and writes.

**Tool contracts:** `get_shipment(shipment_id)`, `find_impacted_orders(sku, warehouse_id, as_of)`, `get_inventory_snapshot(sku, warehouse_id)`, `find_alternative_suppliers(sku, required_qty, date)`, `calculate_mitigation_scenarios(exception_id)`, `propose_stock_reservation(case_id, allocations[])`, `approve_action(proposal_id, approver_id)`, `commit_stock_reservation(proposal_id, approval_token, idempotency_key)`, `create_internal_task(case_id, payload, idempotency_key)`, `draft_customer_notification(case_id, customer_order_id)`. Explicitly no `send_notification` or external purchasing tool in initial prototype.

**Rules/guardrails:** code enforces no negative stock, no unauthorized cross-account disclosure, no action on stale inventory snapshots, no writes without approved proposal, capped tool recursion, rate/time budgets, no prompt-driven override of workflow or approval, safe fail-closed behavior, immutable audit and strict separation between suggested and executed actions.

**Memory:** durable case state `{case_id, triggering_event_ids, affected_entities, validated_facts, proposed_options, agent_findings, pending_approvals, committed_action_ids, errors, retry_count, checkpoint_version, status}`; episodic incident summary after closure; semantic policy/contract references from prior labs; retention and expiration rules; state replay from event log plus snapshots.

## 6. Architecture / API / UI
- Event ingestion endpoint / lightweight queue (in-process with durable outbox for classroom mode, optional Redis/worker for expanded implementation); workflow engine with persisted checkpoints; tool adapters; case DB and action ledger; shared traces and evaluators.
- `POST /api/labs/4/events`, `GET /api/labs/4/incidents`, `GET /api/labs/4/incidents/{id}`, `POST /api/labs/4/incidents/{id}/plan`, `POST /api/labs/4/actions/{id}/approve`, `POST /api/labs/4/actions/{id}/execute`, `POST /api/labs/4/incidents/{id}/resume`, `POST /api/labs/4/evaluate`.
- React: exception inbox; enterprise impact graph; incident timeline; delegated-agent panel; mitigation options; approval/execute UI with confirmation; action ledger; failure-injection toggles; baseline-versus-orchestrated outcome dashboard.

## 7. Evaluation plan
**Deterministic safety:** zero unauthorized commits, zero duplicate reservations under event/retry replay, no negative stock, exact impacted-order IDs against fixtures, 100% approval enforcement. **Robustness:** completion after recoverable tool errors, valid state after restart, bounded retries and escalation on hard failures. **Decision evaluation:** operational feasibility, evidence consistency and risk disclosure. **LLM judge:** planning clarity and communication quality (0–4), grounded in verified record packet; judge cannot pass failing rule/authorization checks. **Business metrics:** orders mitigated, exposure reduction, mean resolution steps, token/cost budget, incident closure time in simulated clock. **Provisional target:** ≥80% fully resolved gold scenarios, all safety invariants 100%.

## 8. Incremental delivery plan
| Phase | Tasks | Exit gate |
|---|---|---|
| 0. Domain/event model | Seed consistent inventory, shipments, orders, scenario events and expected outcomes | 20 reproducible incidents |
| 1. Event + state engine | Event schema, deduplication, case creation, checkpoint/outbox | Duplicate/reordered events handled safely |
| 2. Impact computation | Graph traversals, transactional inventory lookups, impact oracle | Correct at-risk orders and quantities |
| 3. Multi-agent planning | Scoped agents, orchestration, evidence reconciliation, scenario calculator | Explainable action alternatives |
| 4. Human approval + action | Approval policy, reservation/task adapters, idempotency ledger, audit | Side effects only after approval |
| 5. Failure recovery | Inject outage, timeout, duplicate event, restart, compensation/escalation | Recovery/no-duplicate drills pass |
| 6. Capstone dashboard and evaluation | End-to-end metrics, judge rubric, trace export, classroom scenario runner | Scenario pack and definition of done pass |

## 9. Risks and mitigations
Cascade of inaccurate facts → provenance and snapshot freshness checks. Agent autonomy exceeding permissions → scoped capabilities plus workflow-owned writes. Duplicate side effects → transactional action ledger and idempotency. Partial failure → checkpoint, bounded retry and human escalation; never claim universal distributed exactly-once semantics. Cost explosion → call budgets, concurrency limits and caching where safe. Inconsistent inventory → simulate transactional locks/version checks.

## 10. Student exercise and deliverables
Students respond to a delayed shipment affecting multiple priority orders. Compare manual coordination, a single assistant and the governed multi-agent workflow. Then inject duplicate events and an unavailable ERP service. Deliver incident timeline, graph of impacted entities, mitigation options, approval trail, recovered state, safety test results and a short architecture critique.

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
