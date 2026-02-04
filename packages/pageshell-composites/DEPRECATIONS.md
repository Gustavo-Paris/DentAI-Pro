# PageShell Composites - Deprecation Guide

This document lists deprecated APIs and their migration paths.

## DetailPage

### `backButton` prop

**Status:** Deprecated
**Replacement:** `backHref` + `backLabel`
**Removal:** Next major version

```tsx
// Before (deprecated)
<DetailPage
  backButton={{ label: 'Back', href: '/list', onClick: handleBack }}
  ...
/>

// After
<DetailPage
  backHref="/list"
  backLabel="Back"
  ...
/>
```

### `headerSlot` prop

**Status:** Deprecated
**Replacement:** `slots.header`
**Removal:** Next major version

```tsx
// Before (deprecated)
<DetailPage
  headerSlot={<CustomHeader />}
  ...
/>

// After
<DetailPage
  slots={{ header: <CustomHeader /> }}
  ...
/>
```

## DashboardPage

### `widgets` prop

**Status:** Deprecated
**Replacement:** `modules`
**Removal:** Next major version

```tsx
// Before (deprecated)
<DashboardPage
  widgets={[
    { id: 'chart', title: 'Chart', children: <Chart /> }
  ]}
  ...
/>

// After
<DashboardPage
  modules={[
    { id: 'chart', title: 'Chart', render: () => <Chart /> }
  ]}
  ...
/>
```

## ListPage

### `query` prop (direct usage)

**Status:** Deprecated
**Replacement:** `useQuery` or `procedure`
**Removal:** Next major version

The `query` prop only works with static data. For reactive queries that respond to filters, pagination, and sorting, use `useQuery` or `procedure`.

```tsx
// Before (deprecated - doesn't respond to filters/pagination)
<ListPage
  query={api.users.list.useQuery()}
  ...
/>

// After - Option 1: useQuery factory (recommended)
<ListPage
  useQuery={(input) => api.users.list.useQuery(input)}
  ...
/>

// After - Option 2: tRPC procedure
<ListPage
  procedure={api.users.list}
  ...
/>
```

## Shared Utilities

### `formatDuration` function

**Status:** Moved
**New Location:** `@pageshell/core`
**Removal:** Next major version

```tsx
// Before
import { formatDuration } from '@pageshell/composites';

// After
import { formatDuration } from '@pageshell/core';
```

---

## Timeline

| API | Deprecated In | Removal Target |
|-----|--------------|----------------|
| `backButton` | v0.1.0 | v1.0.0 |
| `headerSlot` | v0.1.0 | v1.0.0 |
| `widgets` | v0.1.0 | v1.0.0 |
| `query` (direct) | v0.1.0 | v1.0.0 |
