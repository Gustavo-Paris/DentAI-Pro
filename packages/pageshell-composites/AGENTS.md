---
title: "AGENTS.md (packages/pageshell-composites)"
created: 2025-01-09
updated: 2026-02-04
status: active
tags:
  - type/guide
  - status/active
  - package/pageshell-composites
related:
  - "[[../AGENTS.md]]"
  - "[[../../AGENTS.md]]"
---

# AGENTS.md (packages/pageshell-composites)

## Scope

This file applies to everything under `packages/pageshell-composites/`.
It **inherits** the global rules and routing in the repo root `AGENTS.md`.

## Project Context

`@pageshell/composites` provides declarative page composites built on PageShell primitives. High-level, configuration-driven components for common page patterns.

## Key Locations

- Public entry: `packages/pageshell-composites/src/index.ts`
- ListPage: `packages/pageshell-composites/src/list/`
- FormPage: `packages/pageshell-composites/src/form/`
- DetailPage: `packages/pageshell-composites/src/detail/`
- DashboardPage: `packages/pageshell-composites/src/dashboard/`
- WizardPage: `packages/pageshell-composites/src/wizard/`

## Composites Overview

| Composite | Use Case |
|-----------|----------|
| `ListPage` | CRUD list with filtering, sorting, pagination |
| `FormPage` | Form page with validation |
| `FormModal` | Modal form dialog |
| `DetailPage` | Detail/view page with sections or tabs |
| `DashboardPage` | Dashboard with stats and widgets |
| `WizardPage` | Multi-step wizard |

## Safe Defaults (Local)

- Composites are the primary way to build pages (ADR-0009).
- Follow customization hierarchy: Config → Render → Slots → Children → New Variant.
- Keep composites declarative - avoid imperative logic in configs.

## Validation (only when the user asks)

- Typecheck: `pnpm -C packages/pageshell-composites type-check`

---

## Heranca

- **Pai**: [[../AGENTS.md]] (packages)
- **Root**: [[../../AGENTS.md]]

## Links

- [[CLAUDE.md]] - Entry point
- [[README.md]] - Package documentation with usage examples
