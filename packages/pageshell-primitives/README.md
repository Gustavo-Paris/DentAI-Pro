# @pageshell/primitives

Radix-based UI primitives for PageShell composites. Provides accessible, themeable component foundations.

## Installation

```bash
npm install @pageshell/primitives
# or
pnpm add @pageshell/primitives
```

## Primitives

| Primitive | Based On | Description |
|-----------|----------|-------------|
| `Button` | Radix Slot | Theme-aware button with variants, loading states, icons |
| `Dialog` | Radix Dialog | Modal dialog with overlay, header, footer |
| `DropdownMenu` | Radix DropdownMenu | Context menus with items, checkboxes, radio groups |
| `Skeleton` | Native | Loading placeholders with animations |
| `Table` | Native | Semantic table components |
| `Tabs` | Radix Tabs | Tabbed interface |
| `Tooltip` | Radix Tooltip | Hover tooltips |
| `HealthIndicator` | Native | Animated health/service status indicator |
| `LabeledIndicator` | Native | Compact indicator with icon, label, and value |

## Usage

```tsx
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@pageshell/primitives';

function MyComponent() {
  return (
    <Dialog>
      <Button variant="default">Open Dialog</Button>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Hello World</DialogTitle>
        </DialogHeader>
        <p>Dialog content here</p>
      </DialogContent>
    </Dialog>
  );
}
```

### Tree-Shaking

Import from subpaths for better tree-shaking:

```tsx
import { Button } from '@pageshell/primitives/button';
import { Dialog, DialogContent } from '@pageshell/primitives/dialog';
import { Skeleton, SkeletonText } from '@pageshell/primitives/skeleton';
```

## Button Variants

```tsx
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
<Button variant="destructive">Destructive</Button>

<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔍</Button>

<Button loading>Loading...</Button>
<Button leftIcon={<PlusIcon />}>Add Item</Button>
```

## Dialog Sizes

```tsx
<DialogContent size="sm">Small (max-w-sm)</DialogContent>
<DialogContent size="md">Medium (max-w-lg)</DialogContent>
<DialogContent size="lg">Large (max-w-2xl)</DialogContent>
<DialogContent size="xl">Extra Large (max-w-4xl)</DialogContent>
<DialogContent size="full">Full Width</DialogContent>
```

## Skeleton Presets

```tsx
<Skeleton className="h-4 w-[200px]" />  {/* Custom dimensions */}
<SkeletonText width={150} />            {/* Text line */}
<SkeletonHeading width={200} />         {/* Heading */}
<SkeletonAvatar size={40} />            {/* Circular avatar */}
```

## Health Indicator

Animated status indicator for services and health checks.

```tsx
import { HealthIndicator } from '@pageshell/primitives';

<HealthIndicator status="healthy" label="API Server" />
<HealthIndicator status="degraded" label="Database" showTimestamp lastChecked={new Date()} />
<HealthIndicator status="offline" size="lg" pulse />
<HealthIndicator status="checking" /> {/* Shows spinner */}
```

**Status variants:**
- `healthy` - Green dot
- `degraded` - Yellow dot
- `offline` - Red dot
- `unknown` - Gray dot
- `checking` - Animated spinner

**Props:**
- `status` - Status variant (required)
- `label` - Text label to show
- `size` - `'sm'` | `'md'` | `'lg'`
- `pulse` - Enable pulsing animation
- `showTimestamp` - Show last checked time
- `lastChecked` - Date of last health check
- `onClick` - Click handler

## Labeled Indicator

Compact indicator with icon, label, and optional value.

```tsx
import { LabeledIndicator } from '@pageshell/primitives';

<LabeledIndicator label="Difficulty" value="Hard" variant="warning" icon="flame" />
<LabeledIndicator label="Status" value="Active" variant="success" />
<LabeledIndicator label="Credits" value={42} variant="info" icon="coins" />
<LabeledIndicator label="Error" variant="destructive" icon="alert-circle" />
```

**Variants:**
- `default` - Neutral styling
- `success` - Green (emerald)
- `warning` - Yellow (amber)
- `destructive` - Red
- `muted` - Subtle gray
- `info` - Blue

**Props:**
- `label` - Text label (required)
- `value` - Optional value to display
- `variant` - Color variant
- `icon` - Lucide icon name
- `size` - `'sm'` | `'md'` | `'lg'`
- `showIcon` - Whether to show icon (default: true if icon provided)

## Styling

Primitives use CSS custom properties for theming. Override these in your theme:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --border: 240 5.9% 90%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
}
```

## Peer Dependencies

- React 18+ or 19+
- Tailwind CSS (for utility classes)

## Related

- [AGENTS.md](./AGENTS.md) - Agent instructions
- [@pageshell/core](../pageshell-core/README.md) - Core hooks and utilities
- [@pageshell/interactions](../pageshell-interactions/README.md) - Layer 3 components
- [@pageshell/themes](../pageshell-themes/README.md) - Theme presets

## License

MIT
