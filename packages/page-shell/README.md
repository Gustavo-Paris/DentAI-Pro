# @repo/page-shell

Unified barrel package that re-exports from all @pageshell/* packages.

## Purpose

This package provides a single import point for all PageShell functionality, simplifying imports across the monorepo.

## Installation

```typescript
// Instead of importing from multiple packages:
import { Button } from '@pageshell/primitives'
import { Input } from '@pageshell/interactions'
import { ListPage } from '@pageshell/composites'

// Import from the unified barrel:
import { Button, Input, ListPage } from '@repo/page-shell'
```

## Usage

### All-in-One Import

```tsx
import {
  // Primitives
  Button,
  Card,
  Badge,
  // Interactions
  Input,
  Select,
  Checkbox,
  // Composites
  ListPage,
  FormPage,
  DetailPage,
  // Theme
  ThemeProvider,
  useTheme,
} from '@repo/page-shell'
```

### Subpath Imports

```typescript
import { ... } from '@repo/page-shell/core'
import { ... } from '@repo/page-shell/primitives'
import { ... } from '@repo/page-shell/layouts'
import { ... } from '@repo/page-shell/interactions'
import { ... } from '@repo/page-shell/features'
import { ... } from '@repo/page-shell/composites'
import { ... } from '@repo/page-shell/theme'
import { ... } from '@repo/page-shell/themes'
import { ... } from '@repo/page-shell/domain'
```

## Exports

| Export Path | Re-exports From |
|-------------|-----------------|
| `.` | All packages |
| `./core` | @pageshell/core |
| `./primitives` | @pageshell/primitives |
| `./layouts` | @pageshell/layouts |
| `./interactions` | @pageshell/interactions |
| `./features` | @pageshell/features |
| `./composites` | @pageshell/composites |
| `./theme` | @pageshell/theme |
| `./themes` | @pageshell/themes |
| `./domain` | @pageshell/domain |

## When to Use

| Scenario | Recommendation |
|----------|----------------|
| Quick prototyping | Use `@repo/page-shell` |
| Optimal tree-shaking | Use specific `@pageshell/*` packages |
| Internal tooling | Use `@repo/page-shell` |
| Library components | Use specific `@pageshell/*` packages |

## Related

- [AGENTS.md](./AGENTS.md) - Agent instructions
- [@pageshell/composites](../pageshell-composites/README.md) - Page composites
- [@pageshell/primitives](../pageshell-primitives/README.md) - UI primitives
