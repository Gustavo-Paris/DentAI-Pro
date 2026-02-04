---
title: "AGENTS.md (packages/pageshell-interactions)"
created: 2025-01-09
updated: 2025-01-09
status: active
tags:
  - type/guide
  - status/active
  - package/pageshell-interactions
related:
  - "[[../AGENTS]]"
  - "[[../../AGENTS]]"
---

# AGENTS.md (packages/pageshell-interactions)

## Scope

This file applies to everything under `packages/pageshell-interactions/`.
It **inherits** the global rules and routing in the repo root `AGENTS.md`.

## Project Context

`@pageshell/interactions` provides interactive UI components for PageShell (Layer 3). Contains forms, buttons, inputs, and other interactive elements.

## Mandatory Startup (ToStudy)

- If you are working in `packages/pageshell-interactions/`, you are in **ToStudy** context → follow the root `AGENTS.md` startup before implementation work.

## Key Locations

- Public entry: `packages/pageshell-interactions/src/index.ts`
- Components: `packages/pageshell-interactions/src/components/`
- Forms: `packages/pageshell-interactions/src/forms/`

## Safe Defaults (Local)

- Interactive components must be accessible (keyboard, screen readers).
- Follow Layer 3 (Interactions) pattern from ADR-0019.
- Use react-hook-form adapter pattern (ADR-0041) for form components.

## Validation (only when the user asks)

- Typecheck: `pnpm -C packages/pageshell-interactions type-check`

---

## Herança

- **Pai**: [[../AGENTS]] (packages)
- **Root**: [[../../AGENTS]]

## Links

- [[../AGENTS]] - Packages index
