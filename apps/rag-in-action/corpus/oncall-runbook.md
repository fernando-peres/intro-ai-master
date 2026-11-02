---
id: oncall-runbook
title: On-call Runbook
department: Engineering
owner: Leonor Pires
updated: 2026-04-10-13-00-00
tags: [on-call, incidents, severity, alerts]
related: [incident-2026-03-postmortem, onboarding-guide, security-policy]
---

# On-call Runbook

The on-call engineer responds to pages from PagerDuty. A rotation lasts one week, Monday 10:00 to Monday 10:00 (Lisbon time).

## Severity levels

| Severity | Meaning | Response time |
|---|---|---|
| SEV1 | Deliveries stopped, or ColdBox data lost across a hub | 5 minutes |
| SEV2 | One service degraded; deliveries continue | 15 minutes |
| SEV3 | Minor bug, no customer impact | Next working day |

## First five minutes of a SEV1

1. Acknowledge the page.
2. Open an incident channel named `#inc-<yyyy-mm-dd>-<short-name>`.
3. Name an **incident commander** (IC); by default the on-call engineer is IC until someone senior takes over.
4. Post a status update every 30 minutes to `#status` until resolved.

## Common alerts

- **`coldbox_ingest_lag`** — sensor logs are more than 10 minutes behind. Check the LTE-M gateway first; restart ColdBox Ingest only after the gateway is healthy. This alert preceded the [March 2026 incident](incident-2026-03-postmortem.md).
- **`fleetline_assign_errors`** — Fleetline failed to assign parcels. Fail over to the previous routing plan with `fleetline rollback --plan last-good`.

## After the incident

Every SEV1 and SEV2 gets a blameless postmortem within **5 working days**.
