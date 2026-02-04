---
title: "AGENTS.md (packages/pageshell-domain)"
created: 2025-01-09
updated: 2025-01-09
status: active
tags:
  - type/guide
  - status/active
  - package/pageshell-domain
related:
  - "[[../AGENTS]]"
  - "[[../../AGENTS]]"
---

# AGENTS.md (packages/pageshell-domain)

## Scope

This file applies to everything under `packages/pageshell-domain/`.
It **inherits** the global rules and routing in the repo root `AGENTS.md`.

## Project Context

`@pageshell/domain` provides domain-specific UI components for PageShell. Contains components for courses, sessions, credits, gamification, dashboard, and mentorship.

## Mandatory Startup (ToStudy)

- If you are working in `packages/pageshell-domain/`, you are in **ToStudy** context → follow the root `AGENTS.md` startup before implementation work.

## Key Locations

- Public entry: `packages/pageshell-domain/src/index.ts`
- Courses: `packages/pageshell-domain/src/courses/`
- Sessions: `packages/pageshell-domain/src/sessions/`
- Credits: `packages/pageshell-domain/src/credits/`
- Gamification: `packages/pageshell-domain/src/gamification/`
- Dashboard: `packages/pageshell-domain/src/dashboard/`
- Mentorship: `packages/pageshell-domain/src/mentorship/`

## Safe Defaults (Local)

- Domain components are ToStudy-specific (not generic).
- Follow Domain Primitives Pattern (ADR-0011, ADR-0033).
- Components may depend on `@repo/types` for domain types.

## Validation (only when the user asks)

- Typecheck: `pnpm -C packages/pageshell-domain type-check`

---

## Herança

- **Pai**: [[../AGENTS]] (packages)
- **Root**: [[../../AGENTS]]

## Links

- [[../AGENTS]] - Packages index
