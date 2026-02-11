---
title: "ADR-002: PageShell Design System Adoption"
adr_id: ADR-002
created: 2026-02-04
updated: 2026-02-05
status: accepted
deciders: Team AURIA
tags:
  - type/adr
  - status/accepted
  - domain/frontend
  - domain/design-system
related:
  - "[[ADR-001-3-layer-frontend-architecture]]"
  - "[[plans/2026-02-04-frontend-architecture-design]]"
  - "[[docs/00-Index/Home]]"
---

# ADR-002: PageShell Design System Adoption

## Status

**Accepted** (2026-02-04)

## Context

AURIA uses shadcn/ui primitives directly in 20 of 21 pages. Only the Dashboard uses [[08-Glossary/Terms#Composite|PageShell composites]]. This creates two coexisting UI patterns:

- **Pattern A:** Hand-built pages with shadcn/ui primitives (~300-400 lines each)
- **Pattern B:** Composite-driven pages via PageShell (~50-80 lines each)

The PageShell design system is already installed as 11 packages in the monorepo (`packages/pageshell-*`) and shared across projects. However, adoption is minimal — only one page uses it.

Every new feature requires deciding which pattern to follow, doubling cognitive load and inconsistency.

## Decision

Adopt **PageShell composites as the standard UI layer** for all applicable pages. Pages become thin adapters that map [[08-Glossary/Terms#Domain Hook|Domain Hook]] output to composite props.

### Page-to-Composite Mapping

| Page | Composite | Effort | Priority |
|------|-----------|--------|----------|
| Dashboard | `DashboardPage` | Low (review) | High |
| Evaluations | `ListPage` | Low | High |
| Patients | `ListPage` | Low | High |
| Inventory | `ListPage` | Low | Medium |
| PatientProfile | `DetailPage` | Medium | Medium |
| EvaluationDetails | `DetailPage` | Medium | Medium |
| Profile | `SettingsPage` | Low | Low |
| NewCase | `LinearFlow` | High | High |
| Result | `DetailPage` | Medium | Low |

### Pages Excluded

Landing, Login, Register, Terms, Privacy, SharedEvaluation — static, auth-specific, or unique public design. No composite benefit.

### Boundary Rule

[[08-Glossary/Terms#Page Adapter|Page Adapters]] import from `@pageshell/composites` and `src/hooks/domain/`. They **never** import from `src/data/` or `@supabase` directly. This keeps PageShell reusable across projects.

## Alternatives Considered

### 1. Keep shadcn/ui Direct Usage

- **Pros:** No migration, full control per page
- **Cons:** 300-400 lines per page, duplicated patterns, inconsistent UX
- **Rejected because:** Doesn't scale. Each new list/detail page reinvents the wheel.

### 2. Build Custom Design System

- **Pros:** Tailored to AURIA domain
- **Cons:** High build cost, no cross-project reuse, maintenance burden for solo dev
- **Rejected because:** PageShell already exists and is maintained. Building from scratch is unnecessary.

### 3. External Library (MUI, Ant Design)

- **Pros:** Mature ecosystems, large component sets
- **Cons:** Bundle size, style conflicts with Tailwind, opinionated theming that fights existing setup
- **Rejected because:** PageShell is already Tailwind-native and integrated into the monorepo.

## Consequences

### Positive

- **70-85% code reduction per page** — Pages drop from ~300-400 lines to ~50-80 lines.
- **Consistent UX** — All list, detail, and form pages share the same interaction patterns.
- **Cross-project reuse** — PageShell is shared across multiple projects via the monorepo.
- **Faster feature development** — New pages follow a mechanical pattern: domain hook + composite props.

### Negative

- **Learning curve** — Must understand the composite API and customization hierarchy (Config > Render > Slots > Children > New Variant).
- **Composite constraints** — Some pages (Result with custom protocol UI) may not fit composites perfectly.
- **Migration effort** — 9 pages need migration across phases 2-5 of the architecture roadmap.

### Risks

- **Composite gaps** — If a page pattern doesn't exist in PageShell, it must be created as a new variant in `/composites/`, not as standalone code.

## Implementation

Migration follows the 3-layer architecture roadmap ([[ADR-001-3-layer-frontend-architecture]]):

- **Phase 2:** Dashboard as reference implementation
- **Phase 3:** ListPage trio (Evaluations, Patients, Inventory)
- **Phase 4:** Wizard refactor (NewCase → LinearFlow)
- **Phase 5:** DetailPages (PatientProfile, EvaluationDetails)

## Links

- [[ADR-001-3-layer-frontend-architecture]] — Parent architecture decision
- [[plans/2026-02-04-frontend-architecture-design]] — Full design document (Layer 3)
- [[ADR-Index]] — ADR Index

---
*Created: 2026-02-04 | Last updated: 2026-02-05*
