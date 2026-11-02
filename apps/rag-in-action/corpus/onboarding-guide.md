---
id: onboarding-guide
title: Engineering Onboarding Guide
department: Engineering
owner: Tomás Reis
updated: 2026-04-02-08-30-00
tags: [onboarding, engineering, tools, on-call]
related: [oncall-runbook, security-policy, glossary]
---

# Engineering Onboarding Guide

Welcome to Nimbus engineering. This guide covers your first two weeks.

## Day one

- Collect your laptop and hardware security key from the Porto IT desk (second floor).
- Enrol the key in the identity portal; you cannot reach any internal system without it (see [Security policy](security-policy.md)).
- Join the `#eng-general` and `#coldbox-alerts` channels.

## Week one

Every new engineer ships a small change to production in the first week, paired with their **onboarding buddy**. The main systems are:

- **Fleetline** — the routing service that assigns parcels to vans (Go).
- **ColdBox Ingest** — receives sensor logs over LTE-M (Rust).
- **Nimbus Track API** — the customer-facing API (Python, FastAPI).
- **Ledger** — billing and service credits (Python).

## Week two

Shadow one on-call shift with your buddy. You join the on-call rotation only after **six weeks** and after completing the runbook drill in the [On-call runbook](oncall-runbook.md).

## Who to ask

Your buddy first, then `#eng-help`. For hardware questions, ask the ColdBox team lead, Leonor Pires.
