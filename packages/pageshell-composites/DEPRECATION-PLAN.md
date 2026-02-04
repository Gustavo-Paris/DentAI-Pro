# PageShell Composites - Deprecation Plan

> **Generated:** 2026-01-09
> **Updated:** 2026-02-03
> **Target Version:** v0.2.0 (removal) | v0.1.x (deprecation warnings)
> **Verification Status:** ✅ All v0.2.0 removals verified complete

---

## Summary

| API | Status | Consumers | Migration Effort | Target Removal |
|-----|--------|-----------|------------------|----------------|
| `DetailPage.backButton` | ✅ **REMOVED** | 0 | Done | v0.2.0 |
| `DetailPage.headerSlot` | ✅ **REMOVED** | 0 | Done | v0.2.0 |
| `DashboardPage.widgets` | ✅ **REMOVED** | 0 | Done | v0.2.0 |
| `WidgetConfig` type | ✅ **REMOVED** | 0 | Done | v0.2.0 |
| `formatDuration` (analytics) | ✅ **REMOVED** | 0 | Done | v0.2.0 |
| `ListPage.query` pattern | Soft Deprecated | ~20 | Medium | v0.3.0 |

---

## 1. DetailPage.backButton

### Current API
```typescript
// detail/types.ts:156
backButton?: {
  label?: string;
  href?: string;
  onClick?: () => void;
};
```

### Replacement
```typescript
// Use separate props instead:
backHref?: string;    // Navigation URL
backLabel?: string;   // Button text (default: 'Voltar')
```

### Migration Guide

```diff
// Before
<DetailPage
- backButton={{ href: '/admin/curadoria', label: 'Voltar' }}
  ...
/>

// After
<DetailPage
+ backHref="/admin/curadoria"
+ backLabel="Voltar"
  ...
/>
```

### Known Consumers
**None found** - Verified 2026-02-03, all consumers already migrated to `backHref` + `backLabel`.

### Action Items
- [x] ~~Migrate `apps/web/src/app/admin/creators/[creatorId]/page.tsx`~~ (verified: no consumers)
- [x] Add console.warn in v0.1.x when `backButton` is used (via `warnDeprecatedProp`)
- [x] Remove `backButton` prop in v0.2.0 ✅ **COMPLETE**

---

## 2. DetailPage.headerSlot

### Current API
```typescript
// detail/types.ts:243
headerSlot?: ReactNode;
```

### Replacement
```typescript
// Use slots object instead:
slots?: {
  header?: ReactNode | ((data: TData) => ReactNode);
  // ... other slots
};
```

### Migration Guide

```diff
// Before
<DetailPage
- headerSlot={<CustomHeader />}
  ...
/>

// After
<DetailPage
+ slots={{ header: <CustomHeader /> }}
  ...
/>
```

### Known Consumers
**None found** - Safe to remove immediately.

### Action Items
- [x] Add console.warn in v0.1.x when `headerSlot` is used (via `warnDeprecatedProp`)
- [x] Remove `headerSlot` prop in v0.2.0 ✅ **COMPLETE**

---

## 3. DashboardPage.widgets & WidgetConfig

### Current API
```typescript
// dashboard/types.ts:108-121, 200-202
interface WidgetConfig {
  id: string;
  title: string;
  colSpan?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2;
  children: ReactNode;
}

widgets?: WidgetConfig[];
```

### Replacement
```typescript
// Use modules instead:
interface ModuleConfig {
  id: string;
  title: string;
  icon?: IconProp;
  colSpan?: 1 | 2 | 3 | 4;
  children: ReactNode;
  // ... additional features
}

modules?: ModuleConfig[];
```

### Migration Guide

```diff
// Before
<DashboardPage
- widgets={[
-   { id: 'chart', title: 'Analytics', colSpan: 2, children: <Chart /> }
- ]}
  ...
/>

// After
<DashboardPage
+ modules={[
+   { id: 'chart', title: 'Analytics', colSpan: 2, children: <Chart /> }
+ ]}
  ...
/>
```

### Known Consumers
**None found** - Safe to remove immediately.

### Action Items
- [x] Add console.warn in v0.1.x when `widgets` is used (via `warnDeprecatedProp`)
- [x] Remove `WidgetConfig` type and `widgets` prop in v0.2.0 ✅ **COMPLETE**

---

## 4. formatDuration (analytics/utils)

### Current API
```typescript
// analytics/utils.ts:47-49
/** @deprecated Use formatDurationMinutes from @pageshell/core */
export { formatDurationMinutes as formatDuration } from '@pageshell/core';
```

### Replacement
```typescript
// Import directly from @pageshell/core
import { formatDurationMinutes } from '@pageshell/core';
```

### Migration Guide

```diff
// Before
- import { formatDuration } from '@pageshell/composites/analytics';
+ import { formatDurationMinutes } from '@pageshell/core';

- formatDuration(45)
+ formatDurationMinutes(45)
```

### Known Consumers
**None found** - Safe to remove immediately.

### Action Items
- [x] Remove re-export in v0.2.0 ✅ **COMPLETE**

---

## 5. ListPage.query Pattern (Soft Deprecation)

### Current API
```typescript
// list/types.ts:132-135
query?: CompositeQueryResult<TData>;
```

### Replacement
```typescript
// Use procedure (tRPC) or useQuery pattern:
procedure?: ListPageProcedure<TData, TInput>;
useQuery?: ListPageUseQuery<TData, TInput>;
```

### Migration Guide

```diff
// Before (external state management)
const query = trpc.users.list.useQuery({ page: 1 });
<ListPage
- query={query}
  columns={columns}
/>

// After (reactive - recommended)
<ListPage
+ procedure={trpc.users.list}
+ queryInput={(state) => ({
+   page: state.page,
+   search: state.search,
+   ...state.filters,
+ })}
  columns={columns}
/>
```

### Known Consumers
~67 files using `query=` pattern (verified 2026-02-03). This is a soft deprecation - the pattern still works but new implementations should use `procedure` or `useQuery`.

### Action Items
- [x] Document migration path in README
- [x] Add deprecation notice in JSDoc
- [ ] Gradual migration in v0.2.x releases
- [ ] Remove in v0.3.0 (breaking change)

---

## Implementation Timeline

### v0.1.x (Current) ✅ COMPLETE
- [x] Add `@deprecated` JSDoc to all deprecated APIs
- [x] Add runtime console.warn for deprecated props usage (via `warnDeprecatedProp` utility)

### v0.2.0 (Next Minor) ✅ COMPLETE
- [x] Remove `backButton`, `headerSlot`, `widgets`, `WidgetConfig`
- [x] Remove `formatDuration` re-export
- [ ] Update CHANGELOG (pending release)

### v0.3.0 (Future)
- [ ] Remove `query` prop from ListPage (~67 consumers to migrate)
- [ ] Require `procedure` or `useQuery`

---

## Runtime Deprecation Warnings

Add this helper to composites:

```typescript
// shared/utils.ts

function warnDeprecated(
  component: string,
  prop: string,
  replacement: string
): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `[PageShell] ${component}: "${prop}" is deprecated. Use "${replacement}" instead.`
    );
  }
}

// Usage in DetailPage:
if (props.backButton) {
  warnDeprecated('DetailPage', 'backButton', 'backHref + backLabel');
}
```

---

## References

- [[ADR-0036-listpage-reactive-queries]]
- [[ADR-0045-state-component-consolidation]]
- `packages/pageshell-composites/src/shared/types/`
