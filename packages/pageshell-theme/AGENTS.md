---
title: "AGENTS.md (packages/pageshell-theme)"
created: 2025-01-09
updated: 2025-01-09
status: active
tags:
  - type/guide
  - status/active
  - package/pageshell-theme
related:
  - "[[../AGENTS]]"
  - "[[../../AGENTS]]"
---

# AGENTS.md (packages/pageshell-theme)

## Scope

This file applies to everything under `packages/pageshell-theme/`.
It **inherits** the global rules and routing in the repo root `AGENTS.md`.

## Project Context

`@pageshell/theme` provides theme context and configuration for PageShell composites. Manages theme state and provides hooks for theme-aware components.

## Mandatory Startup (ToStudy)

- If you are working in `packages/pageshell-theme/`, you are in **ToStudy** context → follow the root `AGENTS.md` startup before implementation work.

## Key Locations

- Public entry: `packages/pageshell-theme/src/index.ts`
- Context: `packages/pageshell-theme/src/context/`
- Hooks: `packages/pageshell-theme/src/hooks/`

## Safe Defaults (Local)

- Theme context is used across the entire app - changes have wide impact.
- Follow semantic token patterns from `docs/design-system-guidelines.md`.
- Keep theme API stable; breaking changes affect all themed components.

## Validation (only when the user asks)

- Typecheck: `pnpm -C packages/pageshell-theme type-check`

---

## Herança

- **Pai**: [[../AGENTS]] (packages)
- **Root**: [[../../AGENTS]]

## Links

- [[../AGENTS]] - Packages index
