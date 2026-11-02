---
id: security-policy
title: Information Security Policy
department: Security
owner: Duarte Lobo
updated: 2026-02-25-09-10-00
tags: [security, access, passwords, data]
related: [onboarding-guide, oncall-runbook]
---

# Information Security Policy

This policy applies to every employee and contractor. Questions go to the Head of Security, Duarte Lobo, or `#security`.

## Access

- Every internal system requires single sign-on with a **hardware security key**. SMS and app codes are not accepted.
- Production access is granted per incident through the break-glass tool and expires after **4 hours**.
- Access is reviewed every quarter; unused accounts are disabled after 45 days.

## Data classification

| Class | Examples | Rule |
|---|---|---|
| Public | Website, price list | No restriction |
| Internal | Runbooks, this policy | Employees only |
| Confidential | Customer addresses, ColdBox logs | Encrypted at rest, need-to-know |
| Restricted | Payment data, API keys | Only in the secrets vault |

ColdBox logs are kept for **2 years**, then deleted.

## Reporting

Report a lost laptop or security key within **1 hour** to `#security`. Report a suspected phishing email with the "Report" button; never forward it.
