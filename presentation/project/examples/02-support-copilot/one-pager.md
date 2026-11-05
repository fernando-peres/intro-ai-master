# Northstar Service Desk Copilot

**Owner:** Head of Customer Service · **Version:** 1.0 · **Date:** 2026-11-04-17-00-00 UTC · Example 2 of 4 (illustrative numbers)

## 1. Problem

> **Support agents** struggle to **resolve warranty and order cases consistently** because **they combine five systems by hand and lose context between sessions**, resulting in **14 min per case, 9 % inconsistent warranty decisions and 12 % reopened cases (≈ €42k a month)**.

**Scope:** warranty, order-status and troubleshooting cases. **Non-goals:** unattended refunds, policy changes, unreviewed customer messages.

## 2. Solution: the copilot reads, rules decide, the agent approves, the workflow writes

```mermaid
flowchart LR
    A(["Support agent"]):::user --> GI["GR-05 · GR-01"]:::guard --> CL["MOD-02<br/>classifier"]:::model --> AG["AG-01 copilot<br/>read tools only"]:::agent
    R[("REPO-01 · RAG-01<br/>MEM-01 case state")]:::ctx -.-> AG
    AG --> EL["TL-05<br/>rules engine"]:::tool --> DR["MOD-01 draft<br/>GR-02 lock"]:::model --> H{{"Agent<br/>approves"}}:::human --> GW["GR-03 gate<br/>→ TL-07 write"]:::guard
    classDef user fill:#0F172A,stroke:#0F172A,color:#fff
    classDef guard fill:#FEE2E2,stroke:#DC2626,color:#7F1D1D
    classDef agent fill:#EDE9FE,stroke:#7C3AED,color:#3B0764
    classDef model fill:#D1FAE5,stroke:#059669,color:#064E3B
    classDef ctx fill:#E0F2FE,stroke:#0284C7,color:#0C4A6E
    classDef tool fill:#FEF3C7,stroke:#D97706,color:#78350F
    classDef human fill:#FDE68A,stroke:#B45309,color:#451A03,stroke-width:2px
```

| Component | Used for | Catalog ID |
| --- | --- | --- |
| Records + knowledge index + case memory | Authoritative facts; policy wording; state across sessions | REPO-01, RAG-01, MEM-01 |
| Tools | Read records; compute eligibility; propose; commit (approved) | TL-01…08 |
| Models | Classifier routes; LLM picks tools and drafts | MOD-02, MOD-01 |
| Workflow / agent | Fixed stages, with a bounded read-only agent step | WF-01, AG-01 |

| # | Use case | Target user | Priority |
| --- | --- | --- | --- |
| UC1 | Warranty eligibility claim | Support agent | ★ riskiest |
| UC2 | Where is my order? | Support agent | High |
| UC3 | Troubleshoot and escalate | Support agent | Medium |
| UC4 | Resume an interrupted case | Next-shift agent | High |

## 3. Risks and guards

| Risk | Guard |
| --- | --- |
| Another customer's data exposed | `GR-01` backend ownership check on every read; 100 % denial on fixtures |
| Model overrides eligibility | `TL-05` rules decide; `GR-02` blocks drafts that contradict the result or its rule IDs |
| Duplicate or silent write | `GR-03` approval token + idempotency key; success shown only from the receipt |

**Key assumption:** the warranty rules fit an explicit table (`POL-01`). Cases outside it go to the team lead.

## 4. Evals

| Measure | Metric | Baseline → target / threshold |
| --- | --- | --- |
| Value | Average handling time · reopen rate | 14 → ≤ 6 min · 12 → ≤ 6 % |
| Quality | Eligibility = oracle · tool accuracy · unsafe actions | 100 % · ≥ 85 % · 0 |
| Adoption | Proposals approved without edits | ≥ 70 % |

**Evidence so far:** on 35 gold cases there are 0 leaks and 0 duplicate writes, eligibility matches the oracle on 18/18, and resume after restart is exact. Time saved is still a hypothesis.
**Decision asked:** the **Head of Customer Service** approves a **4-week pilot** (4 agents, ≈ €22k) by **2026-12-04-17-00-00 UTC**.
