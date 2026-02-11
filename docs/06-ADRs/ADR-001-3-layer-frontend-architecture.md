---
title: "ADR-001: 3-Layer Frontend Architecture"
adr_id: ADR-001
created: 2026-02-04
updated: 2026-02-05
status: accepted
deciders: Team AURIA
tags:
  - type/adr
  - status/accepted
  - domain/frontend
  - domain/architecture
related:
  - "[[plans/2026-02-04-frontend-architecture-design]]"
  - "[[ADR-002-pageshell-design-system-adoption]]"
  - "[[docs/00-Index/Home]]"
---

# ADR-001: 3-Layer Frontend Architecture

## Status

**Accepted** (2026-02-04)

## Context

AURIA has 173 TypeScript files and 21 pages. Three structural problems limit evolution speed:

1. **No data layer.** Supabase calls are spread across 16+ files with duplicated query logic and direct coupling that prevents backend swaps or simple unit testing.
2. **No intermediate structure.** Pages like `NewCase.tsx` have 25+ `useState` calls. Business logic, fetching, and presentation live in the same file.
3. **PageShell installed but not adopted.** Only Dashboard uses composites. The other 20 pages are hand-built with shadcn/ui. Two UI patterns coexist, doubling decision cost for every new feature.

**Root cause:** Missing intermediate layers. The app jumps from Supabase directly to page components.

## Decision

Adopt a **3-layer frontend architecture** with strict neighbor-only communication:

```
┌─────────────────────────────────────────────┐
│  PageShell Composites (DashboardPage, etc.) │  Design system
├─────────────────────────────────────────────┤
│  Page Adapters (per page)                   │  Domain → composite props
├─────────────────────────────────────────────┤
│  Domain Hooks (per feature)                 │  Business logic + state
├─────────────────────────────────────────────┤
│  Data Client (one module)                   │  Typed Supabase wrappers
├─────────────────────────────────────────────┤
│  Supabase SDK                               │  Infrastructure
└─────────────────────────────────────────────┘
```

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **[[08-Glossary/Terms#Data Client\|Data Client]]** | Typed async functions per entity, no business logic | `apps/web/src/data/` |
| **[[08-Glossary/Terms#Domain Hook\|Domain Hooks]]** | React Query + business rules, domain-shaped data | `apps/web/src/hooks/domain/` |
| **[[08-Glossary/Terms#Page Adapter\|Page Adapters]]** | Map domain data to PageShell composite props | `apps/web/src/pages/` |

**Fundamental rule:** Each layer only talks to its neighbor. Pages don't call Supabase. Domain hooks don't know PageShell. The data client doesn't know React.

## Alternatives Considered

### 1. Keep Monolithic Pages

- **Pros:** No migration cost, works today
- **Cons:** Increasing complexity per page, untestable business logic, duplicated queries across 16+ files
- **Rejected because:** Does not scale. Every new feature increases duplication.

### 2. Full Redux / State Machine

- **Pros:** Centralized state, well-known patterns
- **Cons:** Boilerplate overhead, overkill for solo dev, React Query already handles server state
- **Rejected because:** Over-engineering. Domain hooks with React Query achieve the same with less code.

### 3. Backend-for-Frontend (BFF) Layer

- **Pros:** Clean API surface, server-side aggregation
- **Cons:** Additional infra, increased latency, Supabase already provides typed SDK
- **Rejected because:** Adds operational complexity without proportional benefit given Supabase's typed client.

## Consequences

### Positive

- **Incremental migration** — Old hooks coexist with new ones. No big bang rewrite.
- **Clear boundaries** — Each layer has a single responsibility and well-defined contract.
- **Testability** — Data client functions are pure async (no React), domain hooks test business logic in isolation.
- **Backend portability** — If leaving Supabase, only `src/data/` changes.

### Negative

- **Migration effort** — 21 pages need gradual refactoring (6 phases planned).
- **Learning curve** — Contributors must understand the 3-layer pattern.
- **Indirection** — Simple features now touch 3 files instead of 1.

### Risks

- **Partial migration stall** — Mitigated by making each phase deliver standalone value.

## Implementation

See [[plans/2026-02-04-frontend-architecture-design]] for the full 6-phase roadmap:

1. Foundation (Data Client)
2. Dashboard as reference implementation
3. ListPage trio (Evaluations, Patients, Inventory)
4. Wizard refactor (NewCase)
5. DetailPages (PatientProfile, EvaluationDetails)
6. Cleanup

## Links

- [[plans/2026-02-04-frontend-architecture-design]] — Full design document
- [[ADR-002-pageshell-design-system-adoption]] — Related: PageShell adoption (Layer 3)
- [[ADR-Index]] — ADR Index

---
*Created: 2026-02-04 | Last updated: 2026-02-05*
