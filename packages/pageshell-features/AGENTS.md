---
title: "AGENTS.md (packages/pageshell-features)"
created: 2025-01-09
updated: 2025-01-09
status: active
tags:
  - type/guide
  - status/active
  - package/pageshell-features
related:
  - "[[../AGENTS]]"
  - "[[../../AGENTS]]"
---

# AGENTS.md (packages/pageshell-features)

## Scope

This file applies to everything under `packages/pageshell-features/`.
It **inherits** the global rules and routing in the repo root `AGENTS.md`.

## Project Context

`@pageshell/features` provides compound feature components for PageShell (Layer 4). These are higher-level components that combine interactions and layouts.

## Mandatory Startup (ToStudy)

- If you are working in `packages/pageshell-features/`, you are in **ToStudy** context → follow the root `AGENTS.md` startup before implementation work.

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

## Herança

- **Pai**: [[../AGENTS]] (packages)
- **Root**: [[../../AGENTS]]

## Links

- [[../AGENTS]] - Packages index
