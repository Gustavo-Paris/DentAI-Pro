---
title: "AGENTS.md (packages/pageshell-features)"
created: 2025-01-09
updated: 2026-02-04
status: active
tags:
  - type/guide
  - status/active
  - package/pageshell-features
related:
  - "[[../AGENTS.md]]"
  - "[[../../AGENTS.md]]"
---

# AGENTS.md (packages/pageshell-features)

## Scope

This file applies to everything under `packages/pageshell-features/`.
It **inherits** the global rules and routing in the repo root `AGENTS.md`.

## Project Context

`@pageshell/features` provides compound feature components for PageShell (Layer 4). These are higher-level components that combine interactions and layouts.

## Key Locations

- Public entry: `packages/pageshell-features/src/index.ts`
- Features: `packages/pageshell-features/src/features/`

## Safe Defaults (Local)

- Feature components combine Layer 2 and 3 components.
- Follow Layer 4 (Features) pattern from ADR-0019.
- Keep features composable - don't create monolithic components.

## Validation (only when the user asks)

- Typecheck: `pnpm -C packages/pageshell-features type-check`

---

## Heranca

- **Pai**: [[../AGENTS.md]] (packages)
- **Root**: [[../../AGENTS.md]]

## Links

- [[CLAUDE.md]] - Entry point
- [[../AGENTS.md]] - Packages index
