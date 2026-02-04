# @pageshell/layouts

Theme-aware layout components for PageShell.

## Features

- **Page layouts** - Standard page structure with header, sidebar, content
- **Theme integration** - Automatically applies theme tokens
- **Next.js adapter** - Server component compatible

## Installation

```typescript
import { ... } from '@pageshell/layouts'
```

## Usage

### Page Layout

```tsx
import { PageLayout, PageHeader, PageContent } from '@pageshell/layouts'

<PageLayout theme="admin">
  <PageHeader
    title="Dashboard"
    breadcrumbs={[
      { label: 'Home', href: '/' },
      { label: 'Dashboard' },
    ]}
  />
  <PageContent>
    {/* Page content */}
  </PageContent>
</PageLayout>
```

### With Sidebar

```tsx
import { PageLayout, Sidebar, SidebarItem } from '@pageshell/layouts'

<PageLayout>
  <Sidebar>
    <SidebarItem icon="home" href="/" active>
      Dashboard
    </SidebarItem>
    <SidebarItem icon="courses" href="/courses">
      Courses
    </SidebarItem>
  </Sidebar>
  <PageContent>
    {/* Content */}
  </PageContent>
</PageLayout>
```

### Next.js Adapter

```tsx
import { NextPageLayout } from '@pageshell/layouts/adapters/next'

// In a Next.js layout.tsx
export default function Layout({ children }) {
  return (
    <NextPageLayout theme="creator">
      {children}
    </NextPageLayout>
  )
}
```

## Exports

| Export Path | Description |
|-------------|-------------|
| `.` | All layout components |
| `./adapters/next` | Next.js specific adapters |

## Theme Integration

Layouts automatically apply theme CSS variables:

| Theme | Primary Color |
|-------|---------------|
| `admin` | Cyan (#06b6d4) |
| `creator` | Violet (#8b5cf6) |
| `student` | Blue (#3b82f6) |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm build` | Build with tsup |
| `pnpm type-check` | TypeScript validation |

## Related

- [AGENTS.md](./AGENTS.md) - Agent instructions
- [@pageshell/themes](../pageshell-themes/README.md) - Theme presets
- [@pageshell/primitives](../pageshell-primitives/README.md) - UI primitives
