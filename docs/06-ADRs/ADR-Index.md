---
title: ADR Index
created: 2026-02-05
updated: 2026-02-05
author: Team DentAI
status: published
tags:
  - type/index
  - status/published
related:
  - "[[docs/00-Index/Home]]"
  - "[[AGENTS.md]]"
---

# ADR Index

> Architecture Decision Records for DentAI Pro.

## Active ADRs

| ID | Title | Status | Date | Domain |
|----|-------|--------|------|--------|
| [[ADR-001-3-layer-frontend-architecture\|ADR-001]] | 3-Layer Frontend Architecture | Accepted | 2026-02-04 | Frontend |
| [[ADR-002-pageshell-design-system-adoption\|ADR-002]] | PageShell Design System Adoption | Accepted | 2026-02-04 | Frontend / Design System |
| [[ADR-003-centralized-prompt-management\|ADR-003]] | Centralized Prompt Management | Accepted | 2026-02-04 | AI / Backend |

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
- [[AGENTS.md#Governance]] — Traceability rules
- [[Templates/ADR Template]] — Blank ADR template

---
*Updated: 2026-02-05*
