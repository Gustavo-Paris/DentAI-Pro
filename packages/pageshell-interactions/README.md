# @pageshell/interactions

Interactive UI components for PageShell (Layer 3).

## Installation

```typescript
import { ... } from '@pageshell/interactions'
```

## Components

### PageList

Versatile list component for displaying items with icons, actions, and metadata. Ideal for notifications, activity feeds, comments, and simple data lists.

```tsx
import { PageList } from '@pageshell/interactions';

<PageList
  items={notifications}
  renderItem={(notification) => (
    <PageList.Item
      icon="bell"
      title={notification.title}
      description={notification.message}
      timestamp={notification.createdAt}
    />
  )}
/>
```

**With selection:**
```tsx
<PageList
  items={tasks}
  variant="card"
  selectable
  selectedKeys={selectedKeys}
  onSelectionChange={setSelectedKeys}
  renderItem={(task) => (
    <PageList.Item
      icon="check-square"
      title={task.title}
      badge={{ label: task.priority, variant: 'warning' }}
    />
  )}
/>
```

**When to use PageList vs ListPage:**

| Use `PageList` (interactions) | Use `ListPage` (composites) |
|------------------------------|----------------------------|
| Simple list display | Full CRUD operations |
| Notifications, activity feeds | Data tables with sorting |
| Embedded list in detail page | Filtering and pagination |
| No server-side operations | API-connected data |

### Form Components

React Hook Form integration with accessible form elements.

```tsx
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@pageshell/interactions';

<Form {...form}>
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

### Modal Components

```tsx
import { PageModal, PageConfirmDialog } from '@pageshell/interactions';

<PageModal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Edit Profile"
>
  {/* Modal content */}
</PageModal>

<PageConfirmDialog
  open={showConfirm}
  onOpenChange={setShowConfirm}
  title="Delete Item?"
  description="This action cannot be undone."
  onConfirm={handleDelete}
/>
```

### Filter Components

```tsx
import { PageFilters } from '@pageshell/interactions';

<PageFilters
  filters={[
    { id: 'status', label: 'Status', type: 'select', options: [...] },
    { id: 'search', label: 'Search', type: 'text' },
  ]}
  values={filterValues}
  onChange={setFilterValues}
/>
```

### Wizard Components

Multi-step form wizard with navigation and validation.

```tsx
import { PageShellWizard } from '@pageshell/interactions';

<PageShellWizard
  steps={steps}
  currentStep={currentStep}
  onStepChange={setCurrentStep}
/>
```

### Infinite Scroll

```tsx
import { PageInfiniteScroll } from '@pageshell/interactions';

<PageInfiniteScroll
  hasMore={hasNextPage}
  loadMore={fetchNextPage}
  isLoading={isFetchingNextPage}
>
  {items.map(item => <ItemCard key={item.id} {...item} />)}
</PageInfiniteScroll>
```

### Floating Action

```tsx
import { PageFloatingAction } from '@pageshell/interactions';

<PageFloatingAction
  icon="plus"
  label="Add Item"
  onClick={handleAdd}
/>
```

## Hooks

### useClipboard

Clipboard copy hook with state management and feedback.

```tsx
import { useClipboard } from '@pageshell/interactions';

function CopyButton({ text }: { text: string }) {
  const { copied, copy, error } = useClipboard({ successDuration: 2000 });

  return (
    <button onClick={() => copy(text)}>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
```

**Options:**
- `successDuration` - How long `copied` stays true (default: 2000ms)

**Returns:**
- `copied` - Boolean indicating recent copy success
- `copy(text)` - Function to copy text to clipboard
- `copyToClipboard(text)` - Alias for `copy` (backward compatibility)
- `error` - Error object if copy failed
- `reset()` - Manually reset the copied state

## Layer Architecture

```text
Layer 5: @pageshell/composites (full pages: ListPage, FormPage, etc.)
    ↓
Layer 4: @pageshell/features (compound features)
    ↓
Layer 3: @pageshell/interactions ← YOU ARE HERE
    ↓
Layer 2: @pageshell/primitives (base: Button, Skeleton, Dialog)
    ↓
Layer 1: @pageshell/core (hooks, utils)
```

### Choosing the Right Layer

| Need | Use |
|------|-----|
| Full CRUD page with API | `ListPage` from `@pageshell/composites` |
| Simple list display | `PageList` from `@pageshell/interactions` |
| Modal dialog | `PageModal` from `@pageshell/interactions` |
| Full form page | `FormPage` from `@pageshell/composites` |
| Confirmation dialog | `PageConfirmDialog` from `@pageshell/interactions` |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm build` | Build with tsup |
| `pnpm type-check` | TypeScript validation |

## Related

- [AGENTS.md](./AGENTS.md) - Agent instructions
- [@pageshell/primitives](../pageshell-primitives/README.md) - Layer 2 components
- [@pageshell/features](../pageshell-features/README.md) - Layer 4 components
- [@pageshell/composites](../pageshell-composites/README.md) - Layer 5 composites
