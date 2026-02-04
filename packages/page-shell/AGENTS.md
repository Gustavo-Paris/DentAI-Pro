---
title: "AGENTS.md (packages/page-shell)"
created: 2025-01-10
updated: 2025-01-10
status: active
tags:
  - type/guide
  - status/active
  - packages/page-shell
related:
  - "[[../AGENTS]]"
  - "[[../../AGENTS]]"
---

# AGENTS.md (packages/page-shell)

## Scope

This file applies to everything under `packages/page-shell/`.
It **inherits** the global rules and routing in the repo root `AGENTS.md`.

## Project Context

`@repo/page-shell` is a **unified barrel package** that re-exports all `@pageshell/*` packages for simplified imports. It contains no implementation code, only re-exports.

## Purpose

Provides a single import point for consumers who want to import from multiple PageShell packages:

```typescript
// Instead of:
import { Button } from '@pageshell/primitives';
import { PageLayout } from '@pageshell/layouts';
import { ListPage } from '@pageshell/composites';

// You can use:
import { Button } from '@repo/page-shell/primitives';
import { PageLayout } from '@repo/page-shell/layouts';
import { ListPage } from '@repo/page-shell/composites';
```

## Package Structure

```
packages/page-shell/
├── src/
│   ├── index.ts        # Main barrel (re-exports all)
│   ├── core.ts         # Re-exports @pageshell/core
│   ├── primitives.ts   # Re-exports @pageshell/primitives
│   ├── layouts.ts      # Re-exports @pageshell/layouts
│   ├── interactions.ts # Re-exports @pageshell/interactions
│   ├── features.ts     # Re-exports @pageshell/features
│   ├── composites.ts   # Re-exports @pageshell/composites
│   ├── theme.ts        # Re-exports @pageshell/theme
│   ├── themes.ts       # Re-exports @pageshell/themes
│   └── domain.ts       # Re-exports @pageshell/domain
├── package.json
├── tsconfig.json
└── AGENTS.md          # This file
```

## Safe Defaults

- **Read-only package**: This package only re-exports. Do NOT add implementation code here.
- **Sync exports**: Keep re-exports in sync with source packages.
- **No direct modifications**: Changes should be made in source `@pageshell/*` packages, not here.

## When to Modify

Only modify this package when:
1. A new `@pageshell/*` package is added → add corresponding re-export file
2. A `@pageshell/*` package exports change → update re-export to match
3. A `@pageshell/*` package is removed → remove corresponding re-export

## Validation (only when the user asks)

```bash
pnpm -C packages/page-shell type-check
```

## Related Packages

This package re-exports from:
- [[../pageshell-core/AGENTS]] - Core hooks and utilities
- [[../pageshell-primitives/AGENTS]] - Radix UI primitives
- [[../pageshell-layouts/AGENTS]] - Layout components
- [[../pageshell-interactions/AGENTS]] - Interactive components
- [[../pageshell-features/AGENTS]] - Feature components
- [[../pageshell-composites/AGENTS]] - Page composites
- [[../pageshell-theme/AGENTS]] - Theme context
- [[../pageshell-themes/AGENTS]] - Theme presets
- [[../pageshell-domain/AGENTS]] - Domain components

---

## Heranca

- **Pai**: [[../AGENTS]] (packages)
- **Root**: [[../../AGENTS]]

## Links

- [[CLAUDE.md]] - Entry point
- [[../AGENTS]] - Packages index
