---
title: "ADR-009: Design System Coexistence (PageShell + shadcn/ui)"
adr_id: ADR-009
created: 2026-02-12
updated: 2026-02-12
status: accepted
deciders: Team AURIA
tags:
  - type/adr
  - status/accepted
  - domain/frontend
  - domain/design-system
related:
  - "[[ADR-002-pageshell-design-system-adoption]]"
  - "[[ADR-008-wizard-architecture-post-refactor]]"
  - "[[docs/00-Index/Home]]"
---

# ADR-009: Design System Coexistence (PageShell + shadcn/ui)

## Status

**Accepted** (2026-02-12)

## Context

AURIA uses two UI libraries that serve different architectural layers:

- **PageShell composites** (`@pageshell/composites`) provide structural page templates — `ListPage`, `DetailPage`, `FormPage`, `DashboardPage`, `WizardPage`, `SettingsPage`. These reduce page code by 70-85% (from ~300-400 lines to ~50-80 lines) by encapsulating layout, navigation, pagination, and interaction patterns.

- **shadcn/ui primitives** (`Button`, `Input`, `Dialog`, `Select`, etc.) provide low-level UI building blocks used inside composites, in wizard step components, and in custom clinical UI.

As of 2026-02-12, **61% of pages** already use PageShell composites: Dashboard, Patients, Evaluations, Settings, Profile, and Pricing. The wizard flow (NewCase) uses shadcn/ui directly because its clinical UI (photo capture, tooth selection, DSD simulation) requires custom layouts that don't fit a single composite template.

There is **no CSS token conflict** between the two libraries. PageShell reads CSS custom properties from the same Tailwind theme provider that shadcn/ui uses. Both libraries share the same design tokens (`--primary`, `--background`, `--border`, etc.) defined in the application's global CSS.

The question this ADR addresses: should AURIA standardize on a single UI library, or formalize the coexistence of both?

## Decision

**Formalize the two-layer coexistence model:**

1. **PageShell composites** are the standard for **structural pages** — any page whose layout follows a known pattern (list, detail, form, dashboard, wizard, settings) MUST use the corresponding PageShell composite.

2. **shadcn/ui primitives** are used for **internal components** — within composite slots, wizard step components, custom clinical UI, and any UI that lives inside a PageShell composite's content area.

3. **New pages MUST use a PageShell composite.** If no existing composite fits, a new composite variant should be created in `@pageshell/composites` rather than building a standalone page with shadcn/ui only.

4. **Components inside composites use shadcn/ui freely.** There is no restriction on using shadcn/ui primitives within the content slots of PageShell composites.

### Boundary Rules

| Layer | Library | Examples |
|-------|---------|----------|
| Page structure | PageShell composite | `ListPage`, `DetailPage`, `DashboardPage` |
| Page content / slots | shadcn/ui primitives | `Button`, `Dialog`, `Select`, `Card` |
| Wizard steps | shadcn/ui primitives | Photo capture, tooth grid, DSD viewer |
| Shared components | shadcn/ui primitives | `ConfirmDialog`, `CreditBadge`, `ToothSelector` |

### Decision Tree for New UI

```
Need a new page?
├── Does a PageShell composite fit? → Use the composite
├── Close fit but needs customization? → Extend via composite Config/Render/Slots
└── Completely custom layout? → Create a new PageShell composite variant
    └── Only then: build with shadcn/ui directly (requires ADR justification)

Need a new component inside a page?
└── Use shadcn/ui primitives directly
```

## Alternatives Considered

### 1. Full PageShell Only (Eliminate shadcn/ui)

- **Pros:** Single dependency tree, unified API surface
- **Cons:** PageShell composites are structural — they don't replace primitive components like `Button`, `Dialog`, or `Input`. The wizard's clinical UI (tooth selection grid, photo capture overlay, DSD simulation viewer) requires low-level control that composites are not designed to provide.
- **Rejected because:** PageShell composites and shadcn/ui primitives operate at different abstraction levels. Forcing all UI through composites would require building dozens of micro-composites that duplicate what shadcn/ui already provides.

### 2. shadcn/ui Only (Eliminate PageShell)

- **Pros:** Single library, maximum flexibility per page, no composite learning curve
- **Cons:** Every page requires 300-400 lines of boilerplate for layout, navigation, pagination, empty states, and loading states. The 61% of pages already migrated to PageShell would regress.
- **Rejected because:** PageShell composites provide a 70-85% code reduction for standard pages. Removing them would increase maintenance surface and introduce inconsistency across pages that follow the same pattern.

### 3. Migrate to a Single Unified Library

- **Pros:** Clean architecture with one dependency
- **Cons:** No existing library serves both roles (structural composites AND primitives). Building a unified library would require either (a) creating composite wrappers around shadcn/ui (duplicating PageShell) or (b) adding primitives to PageShell (duplicating shadcn/ui).
- **Rejected because:** The two libraries are complementary, not competing. A migration would be high-effort with no architectural benefit.

## Consequences

### Positive

- **Clear architectural boundary** — Developers know which library to use based on what they're building (page structure vs. component).
- **Code reduction for new pages** — New pages follow the mechanical pattern: domain hook + PageShell composite props (~50-80 lines).
- **Consistent page structure** — All list pages look and behave the same; all detail pages share the same layout.
- **Flexibility for custom UI** — Clinical features (DSD, photo analysis, tooth selection) can use shadcn/ui primitives without fighting composite constraints.

### Negative

- **Two dependency trees** — The project maintains both `@pageshell/*` (11 packages) and shadcn/ui components. Updates to either must be validated.
- **Learning curve for new developers** — Contributors must understand when to use PageShell composites vs. shadcn/ui primitives. The boundary rules above mitigate this.

### Risks

- **Boundary drift** — If the rule "new pages MUST use PageShell" is not enforced, developers may default to shadcn/ui-only pages for convenience. **Mitigation:** Enforce via code review checklist and [[AGENTS.md]] rules.
- **Composite gaps** — A new page pattern may not have a matching PageShell composite, tempting developers to bypass the rule. **Mitigation:** Create new composite variants in `@pageshell/composites` when gaps are identified, per [[ADR-002-pageshell-design-system-adoption]].

## Implementation

This ADR formalizes the existing architecture rather than requiring migration. The coexistence model is already in practice:

- **PageShell pages:** Dashboard, Patients, Evaluations, Settings, Profile, Pricing (61%)
- **shadcn/ui-heavy pages:** NewCase wizard (uses `WizardPage` composite with shadcn/ui step content)
- **Excluded pages:** Landing, Login, Register, Terms, Privacy, SharedEvaluation (static/auth/public)

Enforcement mechanisms:

1. **Code review** — PRs adding new pages must justify if not using a PageShell composite.
2. **AGENTS.md** — Agent rules reference this ADR for design system decisions.
3. **ADR-002** — Contains the full page-to-composite mapping and migration plan.

> [!tip] Quick reference
> Building a **page**? Use PageShell. Building a **component**? Use shadcn/ui.

## Links

- [[ADR-002-pageshell-design-system-adoption]] — PageShell adoption decision and page-to-composite mapping
- [[ADR-008-wizard-architecture-post-refactor]] — Wizard architecture that uses shadcn/ui within PageShell WizardPage
- [[ADR-001-3-layer-frontend-architecture]] — 3-layer architecture that defines the page adapter pattern
- [[ADR-Index]] — ADR Index

---
*Created: 2026-02-12 | Last updated: 2026-02-12*
