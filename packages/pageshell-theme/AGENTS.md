---
title: "AGENTS.md (packages/pageshell-theme)"
created: 2025-01-09
updated: 2026-02-04
status: active
tags:
  - type/guide
  - status/active
  - package/pageshell-theme
related:
  - "[[../AGENTS.md]]"
  - "[[../../AGENTS.md]]"
---

# AGENTS.md (packages/pageshell-theme)

## Scope

This file applies to everything under `packages/pageshell-theme/`.
It **inherits** the global rules and routing in the repo root `AGENTS.md`.

## Project Context

`@pageshell/theme` provides theme context and configuration for PageShell composites. Manages theme state and provides hooks for theme-aware components.

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

## Heranca

- **Pai**: [[../AGENTS.md]] (packages)
- **Root**: [[../../AGENTS.md]]

## Links

- [[CLAUDE.md]] - Entry point
- [[../AGENTS.md]] - Packages index
