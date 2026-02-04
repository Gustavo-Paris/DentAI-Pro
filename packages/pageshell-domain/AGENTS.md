---
title: "AGENTS.md (packages/pageshell-domain)"
created: 2025-01-09
updated: 2026-02-04
status: active
tags:
  - type/guide
  - status/active
  - package/pageshell-domain
related:
  - "[[../AGENTS.md]]"
  - "[[../../AGENTS.md]]"
---

# AGENTS.md (packages/pageshell-domain)

## Scope

This file applies to everything under `packages/pageshell-domain/`.
It **inherits** the global rules and routing in the repo root `AGENTS.md`.

## Project Context

`@pageshell/domain` provides domain-specific UI components for PageShell. Contains components for courses, sessions, credits, gamification, dashboard, and mentorship.

## Key Locations

- Public entry: `packages/pageshell-domain/src/index.ts`
- Courses: `packages/pageshell-domain/src/courses/`
- Sessions: `packages/pageshell-domain/src/sessions/`
- Credits: `packages/pageshell-domain/src/credits/`
- Gamification: `packages/pageshell-domain/src/gamification/`
- Dashboard: `packages/pageshell-domain/src/dashboard/`
- Mentorship: `packages/pageshell-domain/src/mentorship/`

## Safe Defaults (Local)

- Domain components are DentAI Pro-specific (not generic).
- Follow Domain Primitives Pattern (ADR-0011, ADR-0033).
- Components may depend on `@repo/types` for domain types.

## Validation (only when the user asks)

- Typecheck: `pnpm -C packages/pageshell-domain type-check`

---

## Heranca

- **Pai**: [[../AGENTS.md]] (packages)
- **Root**: [[../../AGENTS.md]]

## Links

- [[CLAUDE.md]] - Entry point
- [[../AGENTS.md]] - Packages index
