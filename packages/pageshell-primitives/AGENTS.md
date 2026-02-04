---
title: "AGENTS.md (packages/pageshell-primitives)"
created: 2025-01-09
updated: 2025-01-09
status: active
tags:
  - type/guide
  - status/active
  - package/pageshell-primitives
related:
  - "[[../AGENTS]]"
  - "[[../../AGENTS]]"
---

# AGENTS.md (packages/pageshell-primitives)

## Scope

This file applies to everything under `packages/pageshell-primitives/`.
It **inherits** the global rules and routing in the repo root `AGENTS.md`.

## Project Context

`@pageshell/primitives` provides Radix-based UI primitives for PageShell composites. These are the low-level building blocks that composites are built from.

## Mandatory Startup (ToStudy)

- If you are working in `packages/pageshell-primitives/`, you are in **ToStudy** context → follow the root `AGENTS.md` startup before implementation work.

## Key Locations

- Public entry: `packages/pageshell-primitives/src/index.ts`
- Components: `packages/pageshell-primitives/src/components/`

## Safe Defaults (Local)

- Based on Radix UI primitives - follow Radix patterns.
- Keep components unstyled or minimally styled (styling in themes layer).
- Ensure accessibility compliance (ARIA, keyboard navigation).
- Avoid breaking changes to component APIs.

## Validation (only when the user asks)

- Typecheck: `pnpm -C packages/pageshell-primitives type-check`

---

## Herança

- **Pai**: [[../AGENTS]] (packages)
- **Root**: [[../../AGENTS]]

## Links

- [[README.md]] - Package documentation
