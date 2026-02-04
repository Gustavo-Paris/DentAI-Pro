# @pageshell/core

Core hooks, utilities, formatters, and types for PageShell composites.

This package contains framework-agnostic logic that can be used with any UI library.

## Installation

```bash
npm install @pageshell/core
# or
pnpm add @pageshell/core
```

## Usage

```tsx
// Import from main entry
import { useModal, formatCurrency, interpolateHref } from '@pageshell/core';

// Or import from subpaths for better tree-shaking
import { useModal } from '@pageshell/core/hooks';
import { formatCurrency } from '@pageshell/core/formatters';
import { interpolateHref } from '@pageshell/core/utils';
```

## Features

### Hooks

- `useModal<T>()` - Modal state management with data payload
- `useDebounce<T>()` - Debounce values
- `useDebouncedCallback<T>()` - Debounce functions
- `useListLogic<T>()` - List state with filters, pagination, sorting (client & server-side)
- `useFormLogic()` - Form state, validation, unsaved changes, auto-save
- `useWizardLogic<T>()` - Multi-step wizard with validation and resumable progress
- `useInterval()` - Declarative setInterval with cleanup
- `useServiceHealth()` - Polling-based health check with status callbacks
- `useRelativeTime()` - Live relative time updates ("5 minutes ago")
- `useMediaQuery()` - SSR-safe media query hook with breakpoint presets

### Formatters

- `formatValue()` - Master formatter (auto-detects type)
- `formatCurrency()` - Currency formatting with locale support
- `formatDate()` / `formatDateTime()` / `formatTime()` - Date formatting
- `formatRelativeTime()` - Relative time (e.g., "2 hours ago")
- `formatNumber()` / `formatCompactNumber()` - Number formatting
- `formatPercent()` - Percentage formatting
- `formatBoolean()` - Boolean to Yes/No
- `formatDuration()` - Duration in seconds to human-readable
- `formatDurationVerbose()` - Verbose duration with i18n ("2 hours, 30 minutes")
- `formatCountdown()` - Countdown timer display (HH:MM:SS)
- `formatTimer()` - Timer display (MM:SS)
- `getNestedValue()` - Get nested object value via dot notation

### Utils

- `cn()` - Class name merging with Tailwind conflict resolution
- `interpolateHref()` - URL pattern interpolation (`:id` → `123`)
- `hasInterpolation()` - Check if string has patterns
- `extractInterpolationKeys()` - Get pattern keys from template
- `mergeDefaults()` - Deep merge user config with defaults
- `applyDefaults()` - Apply defaults to array of items

### Storage (SSR-safe)

- `isBrowser()` - Check if running in browser environment
- `safeGetItem<T>()` - Get parsed JSON from localStorage
- `safeSetItem<T>()` - Set JSON to localStorage
- `safeRemoveItem()` - Remove item from localStorage
- `safeGetRaw()` - Get raw string from localStorage
- `safeSetRaw()` - Set raw string to localStorage

### Progress Calculations

- `calculateProgress()` - Calculate percentage (clamped 0-100)
- `calculateUsagePercent()` - Calculate usage percentage with threshold awareness
- `getCompletionStatus()` - Get completion object with percent, isComplete, remaining
- `formatProgressFraction()` - Format as "3/10" string

### Inference (Smart Defaults)

- `inferRowActionDefaults()` - Auto-set icon, variant, confirm for actions
- `inferColumnDefaults()` - Auto-detect format/align from column name
- `applyFiltersDefaults()` - Normalize filter options
- `inferStatDefaults()` - Auto-detect format for stats

### Types

- `PageShellTheme` - Theme variants
- `RouterAdapter` - Framework-agnostic router interface
- `QueryState` / `PaginationInfo` - List query types
- `ColumnConfig` / `SortState` - Table types
- `FieldConfig` / `FieldRenderProps` - Form types
- `ActionConfig` / `EmptyStateConfig` - UI types

## Examples

### useModal

```tsx
function UsersPage() {
  const editModal = useModal<User>();

  return (
    <>
      <button onClick={() => editModal.open(selectedUser)}>
        Edit
      </button>

      {editModal.isOpen && (
        <EditUserModal
          user={editModal.data}
          onClose={editModal.close}
        />
      )}
    </>
  );
}
```

### Formatters

```tsx
formatCurrency(1999); // 'R$ 19,99'
formatDate(new Date()); // '01/01/2026'
formatRelativeTime(pastDate); // 'há 2 horas'
formatCompactNumber(1500000); // '1,5 mi'
```

### interpolateHref

```tsx
interpolateHref('/users/:id', { id: '123' });
// => '/users/123'

interpolateHref('/users/:user.id/posts/:postId', {
  user: { id: '123' },
  postId: '456'
});
// => '/users/123/posts/456'
```

### useInterval

```tsx
function PollingComponent() {
  const [count, setCount] = useState(0);

  // Runs every 1000ms, stops when delay is null
  useInterval(() => {
    setCount((c) => c + 1);
  }, isActive ? 1000 : null);

  return <span>{count}</span>;
}
```

### useServiceHealth

```tsx
function ServiceStatus() {
  const { status, lastChecked, isChecking } = useServiceHealth(
    async () => {
      const res = await fetch('/api/health');
      return res.ok;
    },
    { interval: 30000 } // Check every 30s
  );

  return (
    <div>
      Status: {status} {/* 'healthy' | 'offline' | 'unknown' */}
      {lastChecked && <span>Last checked: {lastChecked.toISOString()}</span>}
    </div>
  );
}
```

### useRelativeTime

```tsx
function TimeAgo({ date }: { date: Date }) {
  const { formatted, isRecent } = useRelativeTime(date, {
    updateInterval: 60000, // Update every minute
  });

  return <span className={isRecent ? 'text-green-500' : ''}>{formatted}</span>;
}
```

### Storage Utils

```tsx
// Safe localStorage operations (no-op on SSR)
safeSetItem('user-preferences', { theme: 'dark', lang: 'en' });
const prefs = safeGetItem<{ theme: string; lang: string }>('user-preferences');

// Raw string operations
safeSetRaw('session-token', 'abc123');
const token = safeGetRaw('session-token');
```

### Progress Calculations

```tsx
const progress = calculateProgress(7, 10); // 70
const usage = calculateUsagePercent(850, 1000); // 85

const status = getCompletionStatus(7, 10);
// { percent: 70, isComplete: false, remaining: 3 }

const fraction = formatProgressFraction(7, 10); // "7/10"
```

## License

MIT
