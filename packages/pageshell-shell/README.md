# @pageshell/shell

PageShell facade and query handling components.

## Features

- **Shell facade** - Unified API for PageShell
- **Query handling** - Loading, error, empty states
- **Wizard** - Multi-step wizard components
- **Skeletons** - Loading placeholder components

## Installation

```typescript
import { ... } from '@pageshell/shell'
```

## Usage

### Query Handling

```tsx
import { QueryHandler, QueryResult } from '@pageshell/shell'

<QueryHandler
  query={coursesQuery}
  loading={<CoursesSkeleton />}
  empty={<EmptyState message="No courses found" />}
  error={(err) => <ErrorState error={err} />}
>
  {(data) => <CourseList courses={data} />}
</QueryHandler>
```

### Wizard

```tsx
import { Wizard, WizardStep } from '@pageshell/shell/wizard'

<Wizard
  steps={[
    { id: 'info', title: 'Basic Info' },
    { id: 'content', title: 'Content' },
    { id: 'review', title: 'Review' },
  ]}
  currentStep={step}
  onStepChange={setStep}
>
  <WizardStep id="info">
    <BasicInfoForm />
  </WizardStep>
  <WizardStep id="content">
    <ContentForm />
  </WizardStep>
  <WizardStep id="review">
    <ReviewForm />
  </WizardStep>
</Wizard>
```

### Skeletons

```tsx
import { CardSkeleton, ListSkeleton, TableSkeleton } from '@pageshell/shell/skeletons'

// Single card skeleton
<CardSkeleton />

// List of skeletons
<ListSkeleton count={5} />

// Table skeleton
<TableSkeleton rows={10} columns={4} />
```

## Exports

| Export Path | Description |
|-------------|-------------|
| `.` | Main shell components |
| `./wizard` | Wizard components |
| `./skeletons` | Skeleton/loading components |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm build` | Build with tsup |
| `pnpm type-check` | TypeScript validation |

## Related

- [AGENTS.md](./AGENTS.md) - Agent instructions
- [@pageshell/composites](../pageshell-composites/README.md) - Page composites
