---
title: "AGENTS.md (packages/pageshell-themes)"
created: 2025-01-09
updated: 2025-01-09
status: active
tags:
  - type/guide
  - status/active
  - package/pageshell-themes
related:
  - "[[../AGENTS]]"
  - "[[../../AGENTS]]"
---

# AGENTS.md (packages/pageshell-themes)

## Scope

This file applies to everything under `packages/pageshell-themes/`.
It **inherits** the global rules and routing in the repo root `AGENTS.md`.

## Project Context

`@pageshell/themes` provides the theme system and presets for PageShell. Contains admin, creator, and student theme presets.

## Mandatory Startup (ToStudy)

- If you are working in `packages/pageshell-themes/`, you are in **ToStudy** context → follow the root `AGENTS.md` startup before implementation work.

## Key Locations

- Public entry: `packages/pageshell-themes/src/index.ts`
- Presets: `packages/pageshell-themes/src/presets/`
- Tokens: `packages/pageshell-themes/src/tokens/`

## Theme Presets

| Theme | Primary Color | Usage |
|-------|---------------|-------|
| `admin` | Cyan (#06b6d4) | `/admin/*` routes |
| `creator` | Violet (#8b5cf6) | `/creator-portal/*` routes |
| `student` | TBD | Student-facing pages |

## Safe Defaults (Local)

- Follow semantic token patterns from `docs/design-system-guidelines.md`.
- Use CSS variables, never hardcoded colors.
- Test theme changes across all three presets.

## Validation (only when the user asks)

- Typecheck: `pnpm -C packages/pageshell-themes type-check`

---

## Herança

- **Pai**: [[../AGENTS]] (packages)
- **Root**: [[../../AGENTS]]

## Links

- [[README.md]] - Package documentation
