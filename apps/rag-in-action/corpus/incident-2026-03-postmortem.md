---
id: incident-2026-03-postmortem
title: Postmortem — ColdBox Ingest outage, March 2026
department: Engineering
owner: Leonor Pires
updated: 2026-03-19-17-20-00
tags: [incident, postmortem, coldbox, sev1]
related: [oncall-runbook, shipping-slas]
---

# Postmortem — ColdBox Ingest outage, March 2026

**Severity:** SEV1 · **Date:** 2026-03-14 · **Duration:** 3 h 42 min · **Incident commander:** Afonso Neves

## Summary

On 2026-03-14 ColdBox Ingest stopped accepting sensor logs from Hub North (Braga). For 3 hours and 42 minutes Nimbus could not prove the temperature of 6,180 parcels. Under the [Shipping SLAs](shipping-slas.md) a parcel without a log counts as an excursion, so every affected customer received a 100 % credit, a total of **€71,400**.

## Timeline (Lisbon time)

- 06:02 — A certificate on the Braga LTE-M gateway expired.
- 06:15 — `coldbox_ingest_lag` paged the on-call engineer.
- 06:40 — The on-call engineer restarted ColdBox Ingest, which did not help, because the gateway was the cause (the [runbook](oncall-runbook.md) says to check the gateway first).
- 08:10 — Afonso Neves took over as incident commander.
- 09:44 — The certificate was renewed and logs started flowing.

## Root cause

The gateway certificate was renewed by hand and nobody owned the renewal date.

## Action items

1. Automate gateway certificate renewal — owner Leonor Pires, done 2026-04-01.
2. Buffer logs on the ColdBox for up to 6 hours so an outage does not lose data — owner Tomás Reis, due 2026-06-30.
3. Add a certificate-expiry alert 14 days ahead — done 2026-03-21.
