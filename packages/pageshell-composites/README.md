# @pageshell/composites

Declarative page composites built on PageShell primitives. Provides high-level, configuration-driven components for common page patterns.

## Installation

```bash
npm install @pageshell/composites
# or
pnpm add @pageshell/composites
```

## Composites

| Composite | Description |
|-----------|-------------|
| `ListPage` | CRUD list page with filtering, sorting, pagination, and row/bulk actions |
| `FormPage` | Form page with field rendering, validation, and submission |
| `FormModal` | Modal form dialog |
| `DetailPage` | Detail/view page with sections or tabs |
| `DashboardPage` | Dashboard page with stats and widgets |
| `WizardPage` | Multi-step wizard with progress tracking |

## Card Helpers

Reusable components for CRUD card patterns with delete confirmation dialogs.

### DeleteConfirmDialog

Reusable delete confirmation dialog.

```tsx
import { DeleteConfirmDialog, useDeleteDialog } from '@pageshell/composites';

function MyCard({ item, onDelete }) {
  const deleteDialog = useDeleteDialog();

  return (
    <>
      <button onClick={deleteDialog.open}>Delete</button>

      <DeleteConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setIsOpen}
        title="Delete Item"
        description={`Are you sure you want to delete "${item.name}"?`}
        onConfirm={async () => {
          await onDelete(item.id);
        }}
        confirmText="Delete"
        cancelText="Cancel"
        loadingText="Deleting..."
      />
    </>
  );
}
```

### InlineDeleteButton

Delete button with built-in confirmation dialog.

```tsx
import { InlineDeleteButton } from '@pageshell/composites';

<InlineDeleteButton
  onDelete={async () => {
    await deleteMutation.mutateAsync({ id: item.id });
  }}
  isDeleting={deleteMutation.isPending}
  entityName={item.name}
  labels={{
    delete: 'Delete',
    cancel: 'Cancel',
    deleting: 'Deleting...',
    confirmDescription: `Delete "${item.name}"?`,
  }}
/>
```

### CardActionButtons

Edit and Delete button pair for CRUD cards.

```tsx
import { CardActionButtons } from '@pageshell/composites';

<CardActionButtons
  onEdit={() => router.push(`/items/${item.id}/edit`)}
  onDelete={async () => {
    await deleteMutation.mutateAsync({ id: item.id });
  }}
  isDeleting={deleteMutation.isPending}
  entityName={item.name}
  labels={{
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    deleting: 'Deleting...',
    confirmTitle: 'Delete Item',
    confirmDescription: `Delete "${item.name}"?`,
  }}
/>
```

### useDeleteDialog

Hook for managing delete dialog state.

```tsx
import { useDeleteDialog } from '@pageshell/composites';

const deleteDialog = useDeleteDialog();

// Open dialog
deleteDialog.open();

// Check state
deleteDialog.isOpen; // boolean

// Close dialog
deleteDialog.close();

// Toggle or set state
deleteDialog.setIsOpen(true);
```

## Usage

### ListPage

```tsx
import { ListPage } from '@pageshell/composites';

<ListPage
  theme="admin"
  title="Users"
  useQuery={(state) => api.users.list.useQuery({
    page: state.page,
    search: state.search,
    status: state.filters.status || 'all',
  })}
  fields={[
    { key: 'name', label: 'Name', cardSlot: 'title' },
    { key: 'email', label: 'Email', valueType: 'email', cardSlot: 'subtitle' },
    {
      key: 'status',
      label: 'Status',
      valueType: 'badge',
      cardSlot: 'badge',
      valueEnum: {
        active: { text: 'Active', status: 'success' },
        inactive: { text: 'Inactive', status: 'default' },
      },
    },
    { key: 'createdAt', label: 'Created', valueType: 'relativeTime', cardSlot: 'footer' },
  ]}
  actions={{
    edit: { label: 'Edit', href: '/users/:id/edit' },
    delete: { label: 'Delete', mutation: deleteMutation, confirm: { title: 'Delete user?' } },
  }}
  filters={[
    { key: 'status', options: ['all', 'active', 'inactive'] },
  ]}
  viewMode="auto"
  createAction={{ label: 'Add User', href: '/users/new' }}
/>
```

### FormPage

```tsx
import { FormPage } from '@pageshell/composites';

<FormPage
  title="Create User"
  fields={[
    { name: 'name', type: 'text', label: 'Name', required: true },
    { name: 'email', type: 'email', label: 'Email', required: true },
    { name: 'role', type: 'select', label: 'Role', options: ['admin', 'user'] },
  ]}
  mutation={createUserMutation}
  onSuccess={() => router.push('/users')}
/>
```

### FormModal

```tsx
import { FormModal } from '@pageshell/composites';

<FormModal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Edit User"
  query={userQuery}
  fields={[
    { name: 'name', type: 'text', label: 'Name', required: true },
  ]}
  mutation={updateMutation}
  closeOnSuccess
/>
```

### DetailPage

```tsx
import { DetailPage } from '@pageshell/composites';

<DetailPage
  title="User Details"
  query={userQuery}
  sections={[
    { id: 'info', title: 'Information', children: <UserInfo /> },
    { id: 'activity', title: 'Activity', children: <ActivityLog /> },
  ]}
  headerActions={[
    { label: 'Edit', href: '/users/:id/edit' },
  ]}
/>
```

### DashboardPage

```tsx
import { DashboardPage } from '@pageshell/composites';

<DashboardPage
  title="Analytics"
  query={analyticsQuery}
  stats={[
    { key: 'totalUsers', label: 'Users', format: 'number' },
    { key: 'revenue', label: 'Revenue', format: 'currency' },
  ]}
  widgets={[
    { id: 'chart', title: 'Sales', colSpan: 2, children: <SalesChart /> },
    { id: 'recent', title: 'Recent', children: <ActivityList /> },
  ]}
/>
```

### WizardPage

```tsx
import { WizardPage } from '@pageshell/composites';

<WizardPage
  title="Setup Wizard"
  steps={[
    { id: 'info', title: 'Information', children: <InfoStep /> },
    { id: 'config', title: 'Configuration', children: <ConfigStep /> },
    { id: 'review', title: 'Review', children: <ReviewStep /> },
  ]}
  onComplete={(values) => console.log('Done!', values)}
  resumable
/>
```

## Unified Fields API (ListPage)

The `fields` prop provides a unified configuration for both table and card views, replacing the separate `columns` and `cardFields` props (ADR-0051).

### Basic Example

```tsx
<ListPage
  fields={[
    { key: 'title', label: 'Title', cardSlot: 'title' },
    {
      key: 'status',
      label: 'Status',
      valueType: 'badge',
      cardSlot: 'badge',
      valueEnum: {
        draft: { text: 'Draft', status: 'default' },
        active: { text: 'Active', status: 'success' },
        archived: { text: 'Archived', status: 'warning' },
      },
    },
    { key: 'updatedAt', label: 'Updated', valueType: 'relativeTime', cardSlot: 'footer' },
  ]}
  viewMode="auto" // Responsive: cards on mobile, table on desktop
/>
```

### Value Types

| Type | Description | Example |
|------|-------------|---------|
| `text` | Plain text (default) | "John Doe" |
| `number` | Formatted number | 1,234 |
| `currency` | Currency with symbol | R$ 1.234,56 |
| `percent` | Percentage | 75% |
| `date` | Date only | 01/01/2026 |
| `dateTime` | Date and time | 01/01/2026 10:30 |
| `relativeTime` | Relative time | "5 days ago" |
| `boolean` | Yes/No | Yes |
| `badge` | Status badge with colors | (colored badge) |
| `tag` | Single tag | (tag pill) |
| `tags` | Multiple tags | (tag list) |
| `avatar` | Avatar image | (circular image) |
| `image` | Image | (image) |
| `link` | Clickable link | (hyperlink) |
| `email` | Email link | (mailto link) |
| `phone` | Phone link | (tel link) |
| `progress` | Progress bar | (progress bar) |
| `rating` | Star rating | ★★★★☆ |

### Card Slots

Fields can specify which card slot they render in:

| Slot | Description |
|------|-------------|
| `title` | Card title (primary text) |
| `subtitle` | Card subtitle |
| `description` | Card description |
| `badge` | Status badge (top right) |
| `avatar` | Avatar/image slot |
| `meta` | Metadata row (icons + text) |
| `footer` | Footer area |
| `action` | Action area |
| `media` | Media slot for thumbnails |
| `content` | Content slot for progress bars |
| `hidden` | Don't show in card |

### Table-Specific Configuration

```tsx
fields={[
  {
    key: 'name',
    label: 'Name',
    tableConfig: {
      width: 200,
      align: 'left',
      sortable: true,
      fixed: 'left', // Pin column
    },
  },
]}
```

### View Modes

```tsx
// Table only (default)
<ListPage viewMode="table" fields={[...]} />

// Cards only
<ListPage viewMode="cards" fields={[...]} />

// Responsive: cards on mobile, table on desktop
<ListPage viewMode="auto" fields={[...]} />

// Toggle between views
<ListPage
  viewModeToggle
  defaultViewMode="cards"
  persistViewMode="users-list-view"
  fields={[...]}
/>
```

### Real-World Examples

#### E-commerce Products List

```tsx
<ListPage
  title="Products"
  useQuery={(state) => api.products.list.useQuery(state)}
  fields={[
    {
      key: 'thumbnail',
      label: '',
      valueType: 'image',
      cardSlot: 'media',
      tableConfig: { width: 60 },
    },
    { key: 'name', label: 'Product', cardSlot: 'title' },
    { key: 'sku', label: 'SKU', cardSlot: 'subtitle' },
    {
      key: 'price',
      label: 'Price',
      valueType: 'currency',
      cardSlot: 'meta',
    },
    {
      key: 'stock',
      label: 'Stock',
      valueType: 'number',
      cardSlot: 'footer',
      render: (value) => value === 0 ? 'Out of stock' : `${value} units`,
    },
    {
      key: 'status',
      label: 'Status',
      valueType: 'badge',
      cardSlot: 'badge',
      valueEnum: {
        active: { text: 'Active', status: 'success' },
        draft: { text: 'Draft', status: 'default' },
        archived: { text: 'Archived', status: 'warning' },
      },
    },
  ]}
  viewMode="auto"
  actions={{
    edit: { label: 'Edit', href: '/products/:id' },
    duplicate: { label: 'Duplicate', onClick: (item) => handleDuplicate(item) },
    delete: {
      label: 'Delete',
      mutation: deleteMutation,
      confirm: { title: 'Delete product?', variant: 'destructive' },
    },
  }}
/>
```

#### Course Catalog with Progress

```tsx
<ListPage
  title="My Courses"
  useQuery={(state) => api.courses.enrolled.useQuery(state)}
  fields={[
    { key: 'title', label: 'Course', cardSlot: 'title' },
    { key: 'instructor', label: 'Instructor', cardSlot: 'subtitle' },
    {
      key: 'progress',
      label: 'Progress',
      valueType: 'progress',
      cardSlot: 'content',
    },
    {
      key: 'completedAt',
      label: 'Completed',
      valueType: 'relativeTime',
      cardSlot: 'footer',
    },
    {
      key: 'rating',
      label: 'Rating',
      valueType: 'rating',
      cardSlot: 'meta',
    },
  ]}
  viewMode="cards"
  itemHref="/courses/:id/learn"
/>
```

#### Team Members with Avatars

```tsx
<ListPage
  title="Team"
  useQuery={(state) => api.team.members.useQuery(state)}
  fields={[
    {
      key: 'avatar',
      label: '',
      valueType: 'avatar',
      cardSlot: 'avatar',
      tableConfig: { width: 50 },
    },
    { key: 'name', label: 'Name', cardSlot: 'title' },
    {
      key: 'email',
      label: 'Email',
      valueType: 'email',
      cardSlot: 'subtitle',
    },
    {
      key: 'role',
      label: 'Role',
      valueType: 'tag',
      cardSlot: 'badge',
    },
    {
      key: 'lastActive',
      label: 'Last Active',
      valueType: 'relativeTime',
      cardSlot: 'footer',
    },
  ]}
  viewModeToggle
  defaultViewMode="table"
  filters={[
    { key: 'role', label: 'Role', options: ['all', 'admin', 'member', 'viewer'] },
  ]}
/>
```

### Migration from columns

| Old Prop | New Prop |
|----------|----------|
| `columns` | `fields` |
| `cardFields` | `fields` with `cardSlot` |
| `column.format` | `field.valueType` |
| `column.statusOptions` | `field.valueEnum` |
| `rowActions` | `actions` (unified) |
| `cardActions` | `actions` (unified) |
| `cardHref` | `itemHref` (unified) |
| `onRowClick` | `onItemClick` (unified) |

## Choosing a Wizard

The wizard module provides two components for different use cases. Use the decision tree below to pick the right one:

```
                    ┌─────────────────────────────────┐
                    │  Need a multi-step wizard?      │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────▼──────────────────┐
                    │  AI chat assistance needed?     │
                    └──────────────┬──────────────────┘
                          Yes │           │ No
                              ▼           │
                ┌─────────────────────┐   │
                │  EnhancedWizardPage │   │
                └─────────────────────┘   │
                                          ▼
                    ┌─────────────────────────────────┐
                    │  Complex form validation        │
                    │  with react-hook-form?          │
                    └──────────────┬──────────────────┘
                          Yes │           │ No
                              ▼           │
                ┌─────────────────────┐   │
                │  EnhancedWizardPage │   │
                └─────────────────────┘   │
                                          ▼
                    ┌─────────────────────────────────┐
                    │  Declarative field definitions  │
                    │  per step needed?               │
                    └──────────────┬──────────────────┘
                          Yes │           │ No
                              ▼           │
                ┌─────────────────────┐   │
                │  EnhancedWizardPage │   │
                └─────────────────────┘   │
                                          ▼
                    ┌─────────────────────────────────┐
                    │  tRPC query integration         │
                    │  for step data?                 │
                    └──────────────┬──────────────────┘
                          Yes │           │ No
                              ▼           ▼
                ┌─────────────────────┐ ┌─────────────┐
                │  EnhancedWizardPage │ │  WizardPage │
                └─────────────────────┘ └─────────────┘
```

### Comparison Table

| Feature | WizardPage | EnhancedWizardPage |
|---------|------------|-------------------|
| Step indexing | 0-based | 1-based |
| Form library | Optional | react-hook-form required |
| AI Chat | No | Yes |
| Declarative fields | No | Yes |
| Query integration | No | Yes (tRPC/React Query) |
| State management | Internal (uncontrolled) | Controlled |
| Side panel | Via slots | Built-in config |
| Dependencies | Lightweight | Heavier |

### WizardPage

Use `WizardPage` for:
- Simple onboarding flows
- Configuration wizards without complex forms
- Surveys or multi-step questionnaires
- Lightweight dependency requirements

```tsx
import { WizardPage } from '@pageshell/composites/wizard';

<WizardPage
  title="Account Setup"
  steps={[
    { id: 'welcome', title: 'Welcome', children: <WelcomeStep /> },
    { id: 'preferences', title: 'Preferences', children: <PreferencesStep /> },
    { id: 'confirm', title: 'Confirm', children: <ConfirmStep /> },
  ]}
  onComplete={(values) => router.push('/dashboard')}
  resumable
  keyboardNavigation
/>
```

### EnhancedWizardPage

Use `EnhancedWizardPage` for:
- AI-assisted creation flows (course creation, brainstorms)
- Complex forms with validation per step
- Need declarative field definitions
- Integrating with tRPC queries
- Theme context required

```tsx
import { EnhancedWizardPage } from '@pageshell/composites/wizard';

<EnhancedWizardPage
  theme="creator"
  title="Create Course"
  currentStep={step}
  totalSteps={3}
  onStepChange={setStep}
  steps={[
    {
      step: 1,
      label: 'Identity',
      fields: [
        { name: 'title', type: 'text', label: 'Course Title', required: true },
        { name: 'description', type: 'textarea', label: 'Description' },
      ],
    },
    {
      step: 2,
      label: 'Direction',
      fields: [
        { name: 'audience', type: 'select', label: 'Target Audience', options: [...] },
      ],
    },
    { step: 3, label: 'Review' },
  ]}
  aiChat={{
    messages,
    onSendMessage: handleSend,
    isSending,
    placeholder: 'Ask the AI for help...',
  }}
  form={form}
  onComplete={handleComplete}
/>
```

## Customizing Defaults

Each composite exports its default configuration, allowing you to reference or extend defaults:

```tsx
import { formPageDefaults } from '@pageshell/composites/form';
import { wizardPageDefaults } from '@pageshell/composites/wizard';

// Reference defaults
console.log(formPageDefaults.submitText); // 'Save'

// Extend for custom composite
const myFormDefaults = {
  ...formPageDefaults,
  submitText: 'Create',
};
```

Available defaults exports:

| Export | Composite |
|--------|-----------|
| `formPageDefaults` | FormPage |
| `formModalDefaults` | FormModal |
| `detailPageDefaults` | DetailPage |
| `dashboardPageDefaults` | DashboardPage |
| `wizardPageDefaults` | WizardPage |
| `enhancedWizardPageDefaults` | EnhancedWizardPage |
| `sectionedFormPageDefaults` | SectionedFormPage |
| `cardSettingsPageDefaults` | CardSettingsPage |
| `helpCenterPageDefaults` | HelpCenterPage |
| `progressiveExtractionPageDefaults` | ProgressiveExtractionPage |

## Tree-Shaking

Import from subpaths for better tree-shaking:

```tsx
import { ListPage } from '@pageshell/composites/list';
import { FormPage, FormModal, formPageDefaults } from '@pageshell/composites/form';
import { DetailPage, detailPageDefaults } from '@pageshell/composites/detail';
import { DashboardPage, dashboardPageDefaults } from '@pageshell/composites/dashboard';
import { WizardPage, wizardPageDefaults } from '@pageshell/composites/wizard';
import {
  DeleteConfirmDialog,
  InlineDeleteButton,
  CardActionButtons,
  useDeleteDialog,
} from '@pageshell/composites/card-helpers';
```

## Query Result Interface

Composites accept a standardized query result interface compatible with tRPC, React Query, SWR, and Apollo:

```typescript
interface CompositeQueryResult<TData> {
  data: TData | undefined;
  isLoading: boolean;
  isError?: boolean;
  error?: Error | null;
  refetch?: () => void;
}
```

## Value Types

Fields and stats support automatic formatting via `valueType`. See "Unified Fields API" section for the complete list.

## Peer Dependencies

- React 18+ or 19+
- @pageshell/core
- @pageshell/primitives

## License

MIT
