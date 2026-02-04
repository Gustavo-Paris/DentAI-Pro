# @pageshell/composites Deprecation Timeline

This document tracks deprecated APIs in `@pageshell/composites` and their planned removal schedule.

## Version Summary

| Version | Status | Release | Notes |
|---------|--------|---------|-------|
| v1.x | Current | - | Deprecated APIs emit warnings |
| v2.0.0 | Planned | TBD | Deprecated APIs removed |

## StrictMode for Enforcement

All composites support a `strictMode` prop to control deprecation behavior:

```tsx
// Default: Log warnings
<ListPage strictMode="warn" {...props} />

// Strict: Throw errors (useful for CI/testing)
<ListPage strictMode="error" {...props} />

// Silent: No output (gradual migration)
<ListPage strictMode="silent" {...props} />
```

## ListPage Deprecations

### Data Fetching

| Deprecated | Replacement | Status | Removal |
|------------|-------------|--------|---------|
| `query` | `useQuery` or `procedure` | Soft warn | v2.0.0 |

**Migration:**

```tsx
// Before (deprecated)
const usersQuery = api.users.list.useQuery();
<ListPage query={usersQuery} />

// After - Option 1: useQuery factory (recommended)
<ListPage
  useQuery={(state) => api.users.list.useQuery({
    page: state.page,
    search: state.search,
    ...state.filters,
  })}
/>

// After - Option 2: procedure shorthand
<ListPage procedure={api.users.list} />
```

### Actions

| Deprecated | Replacement | Status | Removal |
|------------|-------------|--------|---------|
| `rowActions` | `actions` | Soft warn | v2.0.0 |
| `cardActions` | `actions` | Soft warn | v2.0.0 |

**Migration:**

```tsx
// Before (deprecated)
<ListPage
  rowActions={{
    edit: { label: 'Edit', href: '/users/:id/edit' },
    delete: { label: 'Delete', onClick: handleDelete },
  }}
  cardActions={{
    edit: { label: 'Edit', href: '/users/:id/edit' },
  }}
/>

// After (unified)
<ListPage
  actions={{
    edit: {
      label: 'Edit',
      icon: 'pencil',
      href: '/users/:id/edit',
    },
    delete: {
      label: 'Delete',
      icon: 'trash',
      variant: 'destructive',
      onClick: handleDelete,
      confirm: { title: 'Delete user?' },
    },
  }}
/>
```

### Filtering & Sorting

| Deprecated | Replacement | Status | Removal |
|------------|-------------|--------|---------|
| `cardFilters` | `filters` | Soft warn | v2.0.0 |
| `cardSortConfig` | `sort` | Soft warn | v2.0.0 |
| `defaultSort` | `sort` | Soft warn | v2.0.0 |

**Migration (Filters):**

```tsx
// Before (deprecated)
<ListPage
  cardFilters={{
    status: {
      type: 'buttons',
      options: [{ value: 'all', label: 'All' }],
      default: 'all',
    },
  }}
/>

// After (unified)
<ListPage
  filters={{
    status: {
      type: 'select',
      options: [{ value: 'all', label: 'All' }],
      defaultValue: 'all',
      cardRenderAs: 'buttons', // Optional: button style for card mode
    },
  }}
/>
```

**Migration (Sorting):**

```tsx
// Before (deprecated)
<ListPage
  defaultSort={{ key: 'name', direction: 'asc' }}
  cardSortConfig={{
    options: [{ value: 'name', label: 'Name' }],
    default: 'name',
    compareFn: (key) => (a, b) => a[key].localeCompare(b[key]),
  }}
/>

// After (unified)
<ListPage
  sort={{
    options: [
      { value: 'name', label: 'Name', direction: 'asc' },
      { value: 'date', label: 'Date', direction: 'desc' },
    ],
    default: 'name',
    compareFn: (key) => (a, b) => a[key].localeCompare(b[key]),
  }}
/>
```

### Navigation

| Deprecated | Replacement | Status | Removal |
|------------|-------------|--------|---------|
| `cardHref` | `itemHref` | Soft warn | v2.0.0 |
| `onRowClick` | `itemHref` + `onItemClick` | Soft warn | v2.0.0 |

**Migration:**

```tsx
// Before (deprecated)
<ListPage
  cardHref="/products/:id"
  onRowClick={(item) => router.push(`/products/${item.id}`)}
/>

// After (unified)
<ListPage
  itemHref="/products/:id"
  onItemClick={(item) => trackAnalytics('viewed', item.id)} // Side effects only
/>
```

### Columns (Soft Deprecation)

| Deprecated | Replacement | Status | Removal |
|------------|-------------|--------|---------|
| `columns` + `renderCard` | `fields` | Soft warn | v2.0.0 |

The `columns` prop still works but `fields` is preferred for unified table+card configuration.

**Migration:**

```tsx
// Before (columns + renderCard)
<ListPage
  columns={[
    { key: 'title', label: 'Title' },
    { key: 'status', label: 'Status', format: 'badge' },
  ]}
  renderCard={(item) => <ProductCard item={item} />}
/>

// After (fields - auto-generates both)
<ListPage
  fields={[
    { key: 'title', label: 'Title', cardSlot: 'title' },
    {
      key: 'status',
      label: 'Status',
      valueType: 'badge',
      valueEnum: {
        active: { text: 'Active', status: 'success' },
        draft: { text: 'Draft', status: 'default' },
      },
      cardSlot: 'badge',
    },
  ]}
/>
```

### Slots

| Deprecated | Replacement | Status | Removal |
|------------|-------------|--------|---------|
| `headerSlot` | `slots.headerSlot` | Soft warn | v2.0.0 |
| `beforeTableSlot` | `slots.beforeTableSlot` | Soft warn | v2.0.0 |
| `afterTableSlot` | `slots.afterTableSlot` | Soft warn | v2.0.0 |

**Migration:**

```tsx
// Before (deprecated)
<ListPage
  headerSlot={<CustomHeader />}
  beforeTableSlot={<BeforeContent />}
  afterTableSlot={<AfterContent />}
/>

// After (unified slots object)
<ListPage
  slots={{
    headerSlot: <CustomHeader />,
    beforeTableSlot: <BeforeContent />,
    afterTableSlot: <AfterContent />,
    beforeFilters: <FilterPrefix />,
    afterFilters: <FilterSuffix />,
  }}
/>
```

## Migration Checklist

Use this checklist when migrating a ListPage:

- [ ] Replace `query` with `useQuery` or `procedure`
- [ ] Merge `rowActions` and `cardActions` into unified `actions`
- [ ] Convert `cardFilters` to `filters`
- [ ] Convert `defaultSort` and `cardSortConfig` to `sort`
- [ ] Replace `cardHref` with `itemHref`
- [ ] Replace `onRowClick` with `itemHref` + `onItemClick`
- [ ] Consider migrating `columns` to `fields`
- [ ] Move slot props into `slots` object
- [ ] Test with `strictMode="error"` to catch remaining issues

## Testing Migrations

Run your app with strict mode to catch deprecation issues:

```tsx
// In development/test environment
<ListPage strictMode="error" {...props} />
```

Or set globally in a test setup:

```tsx
// test-setup.ts
process.env.PAGESHELL_STRICT_MODE = 'error';
```

## Reporting Issues

If you encounter issues during migration:

1. Check this document for migration guides
2. Review the ADR for the relevant change
3. Open an issue with the `migration` label

## Version History

- **v1.0.0**: Initial deprecation warnings added
- **v1.1.0**: Added `strictMode` support
- **v2.0.0**: (Planned) Remove deprecated APIs
