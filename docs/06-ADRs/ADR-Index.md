---
title: ADR Index
created: 2026-02-05
updated: 2026-02-12
author: Team AURIA
status: published
tags:
  - type/index
  - status/published
related:
  - "[[docs/00-Index/Home]]"
  - "[[AGENTS.md]]"
---

# ADR Index

> Architecture Decision Records for AURIA (formerly DentAI Pro).

## Active ADRs

| ID | Title | Status | Date | Domain |
|----|-------|--------|------|--------|
| [[ADR-001-3-layer-frontend-architecture\|ADR-001]] | 3-Layer Frontend Architecture | Accepted | 2026-02-04 | Frontend |
| [[ADR-002-pageshell-design-system-adoption\|ADR-002]] | PageShell Design System Adoption | Accepted | 2026-02-04 | Frontend / Design System |
| [[ADR-003-centralized-prompt-management\|ADR-003]] | Centralized Prompt Management | Accepted | 2026-02-04 | AI / Backend |
| [[ADR-004-credit-model-and-monetization\|ADR-004]] | Credit Model & Monetization | Accepted | 2026-02-10 | Backend / Billing |
| [[ADR-005-authentication-and-authorization\|ADR-005]] | Authentication & Authorization | Accepted | 2026-02-10 | Backend / Security |
| [[ADR-006-ai-integration-strategy\|ADR-006]] | AI Integration Strategy | Accepted | 2026-02-10 | AI / Backend |
| [[ADR-007-clinical-photo-storage\|ADR-007]] | Clinical Photo Storage | Accepted | 2026-02-10 | Backend / Storage |
| [[ADR-008-wizard-architecture-post-refactor\|ADR-008]] | Wizard Architecture (Post-Refactor) | Accepted | 2026-02-10 | Frontend |
| [[ADR-009-Design-System-Coexistence\|ADR-009]] | Design System Coexistence (PageShell + shadcn/ui) | Accepted | 2026-02-12 | Frontend / Design System |

## Status Legend

| Status | Meaning |
|--------|---------|
| **Proposed** | Under discussion, not yet decided |
| **Accepted** | Decision made, implementation planned or in progress |
| **Superseded** | Replaced by a newer ADR |
| **Deprecated** | No longer relevant |

## How to Create an ADR

1. Copy [[Templates/ADR Template]]
2. Assign the next sequential ID (`ADR-###`)
3. Fill in all sections
4. Add the entry to this index
5. Link bidirectionally: ADR ↔ Plan ↔ Home

> [!info] Governance
> Structural changes require a linked ADR before the PR. See [[AGENTS.md#Governance]] for traceability rules.

## Related

- [[docs/00-Index/Home]] — Documentation Hub
- [[02-Architecture/Overview]] — Architecture Overview
- [[AGENTS.md#Governance]] — Traceability rules
- [[Templates/ADR Template]] — Blank ADR template

---
*Updated: 2026-02-12*
