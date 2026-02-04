---
title: "AGENTS.md (packages/pageshell-core)"
created: 2025-01-09
updated: 2026-02-04
status: active
tags:
  - type/guide
  - status/active
  - package/pageshell-core
related:
  - "[[../AGENTS.md]]"
  - "[[../../AGENTS.md]]"
---

# AGENTS.md (packages/pageshell-core)

## Scope

This file applies to everything under `packages/pageshell-core/`.
It **inherits** the global rules and routing in the repo root `AGENTS.md`.

## Project Context

`@pageshell/core` provides core hooks, utils, and types for PageShell composites. This is the foundation layer that other PageShell packages depend on.

## Key Locations

- Public entry: `packages/pageshell-core/src/index.ts`
- Hooks: `packages/pageshell-core/src/hooks/`
- Utils: `packages/pageshell-core/src/utils/`
- Types: `packages/pageshell-core/src/types/`

## Safe Defaults (Local)

- This is a foundational package - changes affect all other PageShell packages.
- Prefer additive changes; breaking changes require coordination with all dependents.
- Keep exports minimal and well-typed.

## Validation (only when the user asks)

- Typecheck: `pnpm -C packages/pageshell-core type-check`

---

## Heranca

- **Pai**: [[../AGENTS.md]] (packages)
- **Root**: [[../../AGENTS.md]]

## Links

- [[CLAUDE.md]] - Entry point
- [[README.md]] - Package documentation
