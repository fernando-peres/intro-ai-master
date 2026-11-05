# Northstar Electronics — Progressive GenAI Harness Labs

Four standalone PRDs with detailed implementation plans, intended for a Python/FastAPI + React/TypeScript monorepo. Build in order, reusing synthetic entity IDs and infrastructure.

1. [Lab 1 — Enterprise Knowledge Assistant](01-enterprise-knowledge-assistant.md): RAG, versions, citations and evaluation.
2. [Lab 2 — Customer Support Copilot](02-customer-support-copilot.md): business tools, workflows, case memory and protected writes.
3. [Lab 3 — Procurement Decision Assistant](03-procurement-decision-assistant.md): ontology, knowledge graph, specialist agents and approval.
4. [Lab 4 — Enterprise Operations Orchestrator](04-enterprise-operations-orchestrator.md): event-driven multi-agent work, approvals, durable state and recovery.

## Recommended build order
Set up shared model/tool interfaces, trace schema, auth and fixture generation; complete each lab's phase gates before integrating the next. Treat performance targets in each PRD as provisional classroom targets, not evidence of achieved accuracy.

## Shared cross-lab identifiers
Use `product_id`, `customer_id`, `order_id`, `supplier_id`, `contract_id`, `shipment_id`, `ticket_id`, and `case_id` consistently across synthetic sources. Store `source_id`, `version`, `effective_at` and `access_scope` wherever relevant.

## Principle
A harness is more than a prompt: it contextualizes, extends, coordinates, constrains and operationalizes foundation-model capabilities. Deterministic services remain the source of truth for calculations, authorization and side effects.
