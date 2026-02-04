---
title: "AGENTS.md (packages/pageshell-layouts)"
created: 2025-01-09
updated: 2025-01-09
status: active
tags:
  - type/guide
  - status/active
  - package/pageshell-layouts
related:
  - "[[../AGENTS]]"
  - "[[../../AGENTS]]"
---

# AGENTS.md (packages/pageshell-layouts)

## Scope

This file applies to everything under `packages/pageshell-layouts/`.
It **inherits** the global rules and routing in the repo root `AGENTS.md`.

## Project Context

`@pageshell/layouts` provides theme-aware layout components for PageShell. Contains page layouts, sections, and structural components.

## Mandatory Startup (ToStudy)

- If you are working in `packages/pageshell-layouts/`, you are in **ToStudy** context → follow the root `AGENTS.md` startup before implementation work.

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

## Herança

- **Pai**: [[../AGENTS]] (packages)
- **Root**: [[../../AGENTS]]

## Links

- [[../AGENTS]] - Packages index
