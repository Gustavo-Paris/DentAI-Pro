# @pageshell/theme

Theme context and configuration for PageShell composites.

## Features

- **Theme context** - React context for theme state
- **Theme types** - TypeScript definitions
- **Theme utilities** - Helper functions for theming

## Installation

```typescript
import { ... } from '@pageshell/theme'
```

## Usage

### Theme Provider

```tsx
import { ThemeProvider, useTheme } from '@pageshell/theme'

// Wrap your app
<ThemeProvider theme="admin">
  <App />
</ThemeProvider>

// Access theme in components
function MyComponent() {
  const { theme, setTheme } = useTheme()

  return (
    <div data-theme={theme}>
      Current theme: {theme}
    </div>
  )
}
```

### Theme Context

```tsx
import { useTheme } from '@pageshell/theme/context'

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="admin">Admin</option>
      <option value="creator">Creator</option>
      <option value="student">Student</option>
    </select>
  )
}
```

### Theme Types

```typescript
import type { Theme, ThemeConfig } from '@pageshell/theme/types'

const config: ThemeConfig = {
  name: 'admin',
  colors: {
    primary: 'cyan',
    background: '#0a0a0a',
  },
}
```

## Exports

| Export Path | Description |
|-------------|-------------|
| `.` | Main exports |
| `./context` | Theme context and hooks |
| `./types` | TypeScript type definitions |

## Available Themes

| Theme | Primary Color | Usage |
|-------|---------------|-------|
| `admin` | Cyan (#06b6d4) | Admin dashboard |
| `creator` | Violet (#8b5cf6) | Creator portal |
| `student` | Blue (#3b82f6) | Student interface |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm build` | Build with tsup |
| `pnpm type-check` | TypeScript validation |

## Related

- [AGENTS.md](./AGENTS.md) - Agent instructions
- [@pageshell/themes](../pageshell-themes/README.md) - Theme presets and CSS
