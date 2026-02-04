---
title: "AGENTS.md (packages/pageshell-layouts)"
created: 2025-01-09
updated: 2026-02-04
status: active
tags:
  - type/guide
  - status/active
  - package/pageshell-layouts
related:
  - "[[../AGENTS.md]]"
  - "[[../../AGENTS.md]]"
---

# AGENTS.md (packages/pageshell-layouts)

## Scope

This file applies to everything under `packages/pageshell-layouts/`.
It **inherits** the global rules and routing in the repo root `AGENTS.md`.

## Project Context

`@pageshell/layouts` provides theme-aware layout components for PageShell. Contains page layouts, sections, and structural components.

## Key Locations

- Public entry: `packages/pageshell-layouts/src/index.ts`
- Layouts: `packages/pageshell-layouts/src/layouts/`
- Sections: `packages/pageshell-layouts/src/sections/`

## Safe Defaults (Local)

- Layouts must be theme-aware (use semantic tokens).
- Keep layout components responsive by default.
- Follow the Layer 2 (Layouts) pattern from ADR-0019.

## Validation (only when the user asks)

- Typecheck: `pnpm -C packages/pageshell-layouts type-check`

---

## Heranca

- **Pai**: [[../AGENTS.md]] (packages)
- **Root**: [[../../AGENTS.md]]

## Links

- [[CLAUDE.md]] - Entry point
- [[../AGENTS.md]] - Packages index
