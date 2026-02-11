---
title: Architecture Guidelines
created: 2026-02-11
updated: 2026-02-11
status: published
tags:
  - type/guide
  - status/published
related:
  - "[[06-ADRs/ADR-001-3-layer-frontend-architecture]]"
  - "[[06-ADRs/ADR-002-pageshell-design-system-adoption]]"
  - "[[06-ADRs/ADR-008-wizard-architecture-post-refactor]]"
  - "[[02-Architecture/Overview]]"
  - "[[docs/00-Index/Home]]"
---

# Architecture Guidelines

> Rules and patterns for building features in AURIA. Read this before writing your first page.

---

## 3-Layer Frontend Architecture

Every feature follows a strict **3-layer pattern** with neighbor-only communication. Pages never call Supabase. Domain hooks never import PageShell. The data client never imports React.

```
┌──────────────────────────────────────────────────────────┐
│  Layer 3 — Page Adapters        apps/web/src/pages/      │
│  Map domain data → PageShell composite props             │
├──────────────────────────────────────────────────────────┤
│  Layer 2 — Domain Hooks         apps/web/src/hooks/domain│
│  React Query + business rules, derived state             │
├──────────────────────────────────────────────────────────┤
│  Layer 1 — Data Client          apps/web/src/data/       │
│  Typed async Supabase wrappers, no business logic        │
├──────────────────────────────────────────────────────────┤
│  Infrastructure — Supabase SDK                           │
└──────────────────────────────────────────────────────────┘
```

> [!info] Decision Record
> See [[06-ADRs/ADR-001-3-layer-frontend-architecture|ADR-001]] for the full rationale and alternatives considered.

---

## Layer 1: Data Client

**Location:** `apps/web/src/data/`

The data client is a set of **typed async functions** that wrap Supabase queries. Each module corresponds to a domain entity or feature.

### Rules

1. **No React.** No hooks, no state, no JSX. Pure async functions only.
2. **No business logic.** Return raw data from the database. Filtering, sorting, and derived fields belong in domain hooks.
3. **Typed inputs and outputs.** Every function has explicit parameter and return types.
4. **One module per entity.** `patients.ts`, `evaluations.ts`, `wizard.ts`, etc.
5. **Error propagation.** Throw on failure -- let domain hooks handle error state via React Query.

### Example

```typescript
// apps/web/src/data/patients.ts

export async function fetchPatients(userId: string): Promise<Patient[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
```

### What NOT to do

```typescript
// WRONG: business logic in data client
export async function fetchActivePatients(userId: string) {
  const patients = await fetchPatients(userId);
  return patients.filter(p => p.lastVisit > thirtyDaysAgo); // belongs in domain hook
}
```

---

## Layer 2: Domain Hooks

**Location:** `apps/web/src/hooks/domain/`

Domain hooks own **business logic, server state, and derived data**. They use React Query for caching and data synchronization.

### Rules

1. **One hook per feature.** `useDashboard`, `usePatientList`, `useWizardFlow`, etc.
2. **Import from data client only.** Never import from `@supabase` directly.
3. **No UI awareness.** Do not import PageShell, components, or CSS. Return plain data and callbacks.
4. **React Query for server state.** Use `useQuery` for reads, `useMutation` for writes.
5. **Derived state in the hook.** Computed properties, loading aggregation, and formatting belong here.
6. **Return a typed interface.** Export both the hook and its return type for the page adapter.

### Example

```typescript
// apps/web/src/hooks/domain/usePatientList.ts

export interface PatientWithStats {
  id: string;
  name: string;
  caseCount: number;
  lastVisitFormatted: string;
}

export function usePatientList() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['patients', user?.id],
    queryFn: () => fetchPatients(user!.id),
    enabled: !!user,
  });

  const patients: PatientWithStats[] = useMemo(
    () => (query.data ?? []).map(p => ({
      ...p,
      caseCount: p.evaluations_count,
      lastVisitFormatted: format(p.last_visit, 'dd/MM/yyyy'),
    })),
    [query.data],
  );

  return { patients, loading: query.isLoading, error: query.error };
}
```

### Complex features: sub-hook decomposition

When a domain hook exceeds ~300 lines, decompose it into sub-hooks in a subdirectory. The main hook becomes an **orchestrator** that composes sub-hooks.

```
hooks/domain/
├── useWizardFlow.ts              ← orchestrator
└── wizard/
    ├── usePhotoAnalysis.ts       ← sub-hook
    ├── useDSDIntegration.ts      ← sub-hook
    ├── useWizardSubmit.ts        ← sub-hook
    ├── useWizardNavigation.ts    ← sub-hook
    ├── useWizardReview.ts        ← sub-hook
    ├── useWizardDraftRestore.ts  ← sub-hook
    ├── types.ts                  ← shared types
    ├── constants.ts              ← initial values
    └── helpers.ts                ← pure functions
```

> [!info] Wizard Details
> See [[06-ADRs/ADR-008-wizard-architecture-post-refactor|ADR-008]] for the full wizard decomposition pattern, including circular dependency resolution with forward refs.

---

## Layer 3: Page Adapters

**Location:** `apps/web/src/pages/`

Page adapters are **thin mapping functions** that connect domain hooks to PageShell composites. They should be the simplest layer.

### Rules

1. **Import from domain hooks and PageShell only.** Never import from `src/data/` or `@supabase`.
2. **No business logic.** No filtering, sorting, or data transformation. If you need computed data, add it to the domain hook.
3. **Map, don't compute.** The page adapter translates the domain hook's return type into composite props.
4. **One composite per page.** Each page uses a single PageShell composite (`DashboardPage`, `ListPage`, `DetailPage`, etc.) as its root layout.
5. **Presentation-only subcomponents are OK.** Card renderers, custom slots, and formatting helpers can live in the page file or a `pages/<feature>/` subdirectory.

### Example

```typescript
// apps/web/src/pages/Evaluations.tsx

import { ListPage } from '@pageshell/composites/list';
import { useEvaluationSessions } from '@/hooks/domain/useEvaluationSessions';

export default function Evaluations() {
  const { sessions, loading, error, ... } = useEvaluationSessions();

  return (
    <ListPage
      title={t('evaluations.title')}
      items={sessions}
      loading={loading}
      emptyState={{ ... }}
      renderItem={(session, index) => <SessionCard session={session} index={index} />}
      slots={{ ... }}
    />
  );
}
```

---

## PageShell Composites

PageShell provides **pre-built page patterns** that enforce consistent UX. Each composite accepts domain data as props and renders a complete page layout.

> [!info] Design System Details
> See [[06-ADRs/ADR-002-pageshell-design-system-adoption|ADR-002]] for the full adoption rationale.

### Available Composites

| Composite | Import | Use Case |
|-----------|--------|----------|
| `DashboardPage` | `@pageshell/composites/dashboard` | Stats, modules, tabs |
| `ListPage` | `@pageshell/composites/list` | CRUD lists with filtering and sorting |
| `FormPage` | `@pageshell/composites/form` | Forms with validation |
| `FormModal` | `@pageshell/composites/form` | Modal form dialogs |
| `DetailPage` | `@pageshell/composites/detail` | Detail views with sections and tabs |
| `WizardPage` | `@pageshell/composites` | Multi-step flows |
| `SettingsPage` | `@pageshell/composites/settings` | Settings and configuration |

### Customization Hierarchy

When you need to customize a composite, follow this precedence order (least to most invasive):

1. **Config props** -- Use the composite's built-in props (`title`, `emptyState`, `loading`, etc.)
2. **Render props** -- Use `renderItem`, `renderHeader`, etc. for custom content within the composite's layout
3. **Slots** -- Use the `slots` prop to inject content into predefined insertion points (`header`, `afterHeader`, `stats`, etc.)
4. **Children** -- Pass children for fully custom body content
5. **New variant** -- If none of the above work, create a new composite variant in `packages/pageshell-composites/`, never inline a custom layout in the page

> [!warning] Never bypass composites
> If a page pattern doesn't fit any existing composite, create a new variant in `packages/pageshell-composites/`. Do not build page layouts with raw shadcn/ui primitives in `src/pages/`.

---

## Anti-Patterns

### 1. Direct Supabase calls in pages

```typescript
// WRONG
function Dashboard() {
  const { data } = await supabase.from('evaluations').select('*');
  // ...
}

// CORRECT
function Dashboard() {
  const { sessions, loading } = useDashboard(); // domain hook handles data fetching
  // ...
}
```

### 2. Business logic in page adapters

```typescript
// WRONG
function Evaluations() {
  const { sessions } = useEvaluationSessions();
  const completed = sessions.filter(s => s.status === 'completed'); // belongs in hook
  // ...
}

// CORRECT — the hook exposes the derived data
function Evaluations() {
  const { completedSessions } = useEvaluationSessions();
  // ...
}
```

### 3. UI imports in domain hooks

```typescript
// WRONG
import { toast } from '@/components/ui/sonner';

export function usePatientList() {
  // toast.success('Patient created'); -- hooks should not trigger UI side effects
}

// CORRECT — return status, let the page adapter react to it
export function usePatientList() {
  return { createStatus, ... };
}
```

### 4. Skipping the data client layer

```typescript
// WRONG — domain hook calls Supabase directly
import { supabase } from '@/integrations/supabase/client';

export function usePatientList() {
  useQuery({ queryFn: () => supabase.from('patients').select('*') });
}

// CORRECT — go through the data client
import { fetchPatients } from '@/data/patients';

export function usePatientList() {
  useQuery({ queryFn: () => fetchPatients(user.id) });
}
```

### 5. Building page layouts from raw primitives

```typescript
// WRONG — hand-built list page (300+ lines)
function Evaluations() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1>Evaluations</h1>
      <input placeholder="Search..." />
      {/* 250 more lines of layout... */}
    </div>
  );
}

// CORRECT — use PageShell composite (~50-80 lines)
function Evaluations() {
  return <ListPage title="Evaluations" items={sessions} renderItem={...} />;
}
```

### 6. God hooks (>300 lines)

When a domain hook grows beyond ~300 lines, decompose it into sub-hooks following the wizard pattern in [[06-ADRs/ADR-008-wizard-architecture-post-refactor|ADR-008]].

---

## Reference Implementations

| Pattern | Page | Composite | Domain Hook | Data Client |
|---------|------|-----------|-------------|-------------|
| Dashboard | `pages/Dashboard.tsx` | `DashboardPage` | `useDashboard` | `dashboard.ts` |
| List | `pages/Evaluations.tsx` | `ListPage` | `useEvaluationSessions` | `evaluations.ts` |
| List | `pages/Patients.tsx` | `ListPage` | `usePatientList` | `patients.ts` |
| Wizard | `pages/NewCase.tsx` | `WizardPage` | `useWizardFlow` | `wizard.ts` |

All files are under `apps/web/src/`. Use `Dashboard.tsx` as the canonical reference for the 3-layer pattern.

---

## Checklist: Adding a New Page

1. **Data client** -- Create `src/data/<entity>.ts` with typed async functions
2. **Domain hook** -- Create `src/hooks/domain/use<Feature>.ts` with React Query + business logic
3. **Pick a composite** -- Choose the appropriate PageShell composite from the table above
4. **Page adapter** -- Create `src/pages/<Feature>.tsx` that maps the hook output to composite props
5. **Route** -- Add the route to the router configuration
6. **i18n** -- Add all user-facing strings to the translation files

---

## Related

- [[06-ADRs/ADR-001-3-layer-frontend-architecture|ADR-001]] -- 3-Layer Frontend Architecture decision
- [[06-ADRs/ADR-002-pageshell-design-system-adoption|ADR-002]] -- PageShell Design System adoption
- [[06-ADRs/ADR-008-wizard-architecture-post-refactor|ADR-008]] -- Wizard decomposition pattern
- [[02-Architecture/Overview]] -- System architecture overview
- [[docs/00-Index/Home]] -- Documentation hub

---
*Created: 2026-02-11 | Last updated: 2026-02-11*
