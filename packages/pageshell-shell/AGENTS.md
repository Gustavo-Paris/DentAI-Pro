---
title: "AGENTS.md (packages/pageshell-shell)"
created: 2025-01-09
updated: 2025-01-09
status: active
tags:
  - type/guide
  - status/active
  - package/pageshell-shell
related:
  - "[[../AGENTS]]"
  - "[[../../AGENTS]]"
---

# AGENTS.md (packages/pageshell-shell)

## Scope

This file applies to everything under `packages/pageshell-shell/`.
It **inherits** the global rules and routing in the repo root `AGENTS.md`.

## Project Context

`@pageshell/shell` provides the PageShell facade and query handling components. This is the main entry point for using PageShell in pages.

## Mandatory Startup (ToStudy)

- If you are working in `packages/pageshell-shell/`, you are in **ToStudy** context → follow the root `AGENTS.md` startup before implementation work.

## Key Locations

- Public entry: `packages/pageshell-shell/src/index.ts`
- Shell: `packages/pageshell-shell/src/shell/`
- Query: `packages/pageshell-shell/src/query/`

## Safe Defaults (Local)

- Shell is the facade layer (ADR-0017) - keep it thin.
- Query handling follows ADR-0036 (ListPage Reactive Queries).
- Changes here affect all pages using PageShell.

## Validation (only when the user asks)

- Typecheck: `pnpm -C packages/pageshell-shell type-check`

---

## Herança

- **Pai**: [[../AGENTS]] (packages)
- **Root**: [[../../AGENTS]]

## Links

- [[../AGENTS]] - Packages index
