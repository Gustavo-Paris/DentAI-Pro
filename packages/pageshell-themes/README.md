# @pageshell/themes

Theme system and presets for PageShell. Provides `createTheme()` for custom themes and pre-built presets for common use cases.

## Installation

```bash
npm install @pageshell/themes
# or
pnpm add @pageshell/themes
```

## Quick Start

### Using Preset Themes

```tsx
import { adminTheme, applyTheme } from '@pageshell/themes';

// Apply theme to document
applyTheme(adminTheme);
```

### Creating Custom Themes

```tsx
import { createTheme } from '@pageshell/themes';

const myTheme = createTheme({
  name: 'my-brand',
  mode: 'dark',
  colors: {
    primary: '#8b5cf6',
    primaryForeground: '#ffffff',
    secondary: '#334155',
    secondaryForeground: '#f8fafc',
    accent: '#a78bfa',
    accentForeground: '#1e1b4b',
    muted: '#1e1b4b',
    mutedForeground: '#a5b4fc',
    success: '#10b981',
    successForeground: '#ffffff',
    warning: '#f59e0b',
    warningForeground: '#ffffff',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    background: '#0c0a1d',
    foreground: '#f8fafc',
    card: '#1a1744',
    cardForeground: '#f8fafc',
    popover: '#1a1744',
    popoverForeground: '#f8fafc',
    border: '#312e81',
    input: '#312e81',
    ring: '#8b5cf6',
  },
});

// Use the generated CSS
console.log(myTheme.css);
// Output: [data-theme="my-brand"], .my-brand { --color-primary: #8b5cf6; ... }
```

## Available Presets

| Preset | Primary Color | Description |
|--------|---------------|-------------|
| `defaultTheme` | Blue (#3b82f6) | Neutral theme for general use |
| `adminTheme` | Cyan (#06b6d4) | Professional theme for admin dashboards |
| `creatorTheme` | Violet (#8b5cf6) | Creative theme for content creators |
| `studentTheme` | Emerald (#10b981) | Friendly theme for learners |

### Import Presets

```tsx
// Main export (includes presets)
import { adminTheme, creatorTheme, studentTheme } from '@pageshell/themes';

// Or from presets subpath
import { adminTheme, getPresetTheme, presetThemes } from '@pageshell/themes/presets';

// Get preset by name
const theme = getPresetTheme('admin'); // Type-safe
```

## API

### `createTheme(config: ThemeConfig): ResolvedTheme`

Creates a resolved theme from configuration.

```tsx
const theme = createTheme({
  name: 'my-theme',
  mode: 'dark', // 'light' | 'dark'
  colors: { /* ... */ },
  spacing: { /* optional */ },
  radius: { /* optional */ },
  typography: { /* optional */ },
  shadows: { /* optional */ },
  animations: { /* optional */ },
  extend: { /* custom CSS variables */ },
});
```

### `applyTheme(theme: ResolvedTheme, target?: HTMLElement)`

Applies theme CSS variables to an element (defaults to `document.documentElement`).

```tsx
applyTheme(adminTheme);
// or apply to specific element
applyTheme(adminTheme, document.getElementById('app'));
```

### `removeTheme(theme: ResolvedTheme, target?: HTMLElement)`

Removes theme CSS variables from an element.

### `generateThemeCSS(themes: ResolvedTheme[]): string`

Generates combined CSS for multiple themes.

```tsx
import { generateThemeCSS, adminTheme, creatorTheme } from '@pageshell/themes';

const css = generateThemeCSS([adminTheme, creatorTheme]);
// Write to file or inject into document
```

## Theme Configuration

### Colors (Required)

| Property | Description |
|----------|-------------|
| `primary` | Brand/accent color |
| `primaryForeground` | Text on primary background |
| `secondary` | Secondary accent |
| `secondaryForeground` | Text on secondary |
| `accent` | Highlight color |
| `accentForeground` | Text on accent |
| `muted` | Subtle backgrounds |
| `mutedForeground` | Subtle text |
| `success`, `warning`, `destructive` | State colors |
| `background`, `foreground` | Page colors |
| `card`, `cardForeground` | Card colors |
| `popover`, `popoverForeground` | Dropdown colors |
| `border`, `input`, `ring` | Border colors |

### Optional Customization

```tsx
createTheme({
  // ... colors required

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },

  radius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },

  typography: {
    fontFamily: 'Geist, sans-serif',
    fontFamilyHeading: 'Geist, sans-serif',
    fontFamilyMono: 'Geist Mono, monospace',
    fontSize: '16px',
    lineHeight: '1.5',
  },

  extend: {
    '--custom-var': '#ff0000',
  },
});
```

## CSS Variable Output

Themes generate CSS variables that follow this naming convention:

```css
[data-theme="admin"], .admin {
  /* Colors */
  --color-primary: #06b6d4;
  --color-primary-foreground: #ffffff;
  --color-background: #0f172a;
  /* ... */

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  /* ... */

  /* Radius */
  --radius: 0.375rem; /* Default for Tailwind */
  --radius-sm: 0.25rem;
  --radius-lg: 0.5rem;
  /* ... */

  /* Typography */
  --font-family: Geist, sans-serif;
  --font-family-mono: Geist Mono, monospace;
  /* ... */
}
```

## Integration with Tailwind

Add theme CSS to your Tailwind config:

```tsx
// tailwind.config.ts
import { generateThemeCSS, presetThemes } from '@pageshell/themes/presets';

export default {
  // ...
  plugins: [
    function({ addBase }) {
      addBase({
        ':root': {
          // Default theme variables
        },
      });
    },
  ],
};

// Or write CSS file during build
import { writeFileSync } from 'fs';
writeFileSync('themes.css', generateThemeCSS(presetThemes));
```

## License

MIT
