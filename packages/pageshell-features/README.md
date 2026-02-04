# @pageshell/features

Compound feature components for PageShell (Layer 4).

## Installation

```typescript
import { ... } from '@pageshell/features'
```

## Components

### Stats Components

| Component | Description |
|-----------|-------------|
| `PageStats` | Stats display with multiple variants (cards, bars, live, grid) |
| `PageStatsCard` | Individual stat card with trends and comparisons |

```tsx
import { PageStats, PageStatsCard } from '@pageshell/features';

<PageStats
  variant="cards"
  items={[
    { label: 'Users', value: 1250, trend: { value: 12, direction: 'up' } },
    { label: 'Revenue', value: '$45,000', trend: { value: 8, direction: 'up' } },
  ]}
/>

<PageStatsCard
  label="Total Courses"
  value={42}
  icon="book-open"
  trend={{ value: 15, direction: 'up' }}
/>
```

### Loading & Error States

| Component | Description | Use Case |
|-----------|-------------|----------|
| `PageLoadingState` | Spinner with optional message | Full page/section loading |
| `PageLoadingSkeleton` | Skeleton placeholder | Content preview loading |
| `PageErrorState` | Error display with retry action | Error recovery |

```tsx
import { PageLoadingState, PageErrorState } from '@pageshell/features';

// Loading
<PageLoadingState size="lg" message="Loading data..." />

// Error
<PageErrorState
  title="Failed to load"
  description="Please try again"
  onRetry={refetch}
/>
```

**Note:** For inline skeletons (text lines, form fields), use `Skeleton` from `@pageshell/primitives`. Use `PageLoadingState` for page/section-level loading indicators.

### Form Components

| Component | Description | Use Case |
|-----------|-------------|----------|
| `FormPanel` | Form section container | Embedded forms in detail pages |

```tsx
import { FormPanel } from '@pageshell/features';

<FormPanel
  title="Profile Settings"
  description="Update your profile information"
  icon="user"
  footer={
    <PageButton onClick={handleSave} loading={isSaving}>
      Save Changes
    </PageButton>
  }
>
  <SettingInput label="Name" value={name} onChange={setName} />
  <SettingInput label="Email" value={email} onChange={setEmail} />
</FormPanel>
```

**When to use FormPanel:**
- Form section embedded in a detail page
- Settings panel with save button
- Profile editing section

**When to use FormPage/FormModal (composites):**
- Full page dedicated to a form
- Modal form for creating/editing records

### Content Components

| Component | Description |
|-----------|-------------|
| `PageBenefitsGrid` | Feature/benefit grid display |
| `PageFAQ` | FAQ accordion sections |
| `PageEligibilityAlert` | Eligibility status alerts |
| `PageSystemInfo` | System status information |

```tsx
import { PageBenefitsGrid, PageFAQ } from '@pageshell/features';

<PageBenefitsGrid
  benefits={[
    { icon: 'zap', title: 'Fast', description: 'Lightning fast performance' },
    { icon: 'shield', title: 'Secure', description: 'Enterprise security' },
  ]}
/>

<PageFAQ
  sections={[
    { title: 'General', items: [{ question: 'How?', answer: 'Like this.' }] },
  ]}
/>
```

### Chat Components

```tsx
import { Chat } from '@pageshell/features';
import '@pageshell/features/chat/styles/chat.css';

<Chat
  messages={messages}
  onSend={handleSend}
  assistant={{ name: 'AI Assistant', avatar: '/ai.png' }}
/>
```

### Recovery Codes

| Component | Description |
|-----------|-------------|
| `PageRecoveryCodesList` | Display recovery codes |
| `PageRecoveryCodesModal` | Modal for regenerating codes |

### Layout Components

| Component | Description |
|-----------|-------------|
| `PageFooterActions` | Footer action buttons container |

## Layer Architecture

```text
Layer 5: @pageshell/composites (full pages: ListPage, FormPage, etc.)
    ↓
Layer 4: @pageshell/features (compound features) ← YOU ARE HERE
    ↓
Layer 3: @pageshell/interactions (interactive: PageList, modals)
    ↓
Layer 2: @pageshell/primitives (base: Button, Skeleton, Dialog)
    ↓
Layer 1: @pageshell/core (hooks, utils)
```

### Choosing the Right Layer

| Need | Use |
|------|-----|
| Full CRUD page | `ListPage` from `@pageshell/composites` |
| Simple list display | `PageList` from `@pageshell/interactions` |
| Form section in page | `FormPanel` from `@pageshell/features` |
| Full form page | `FormPage` from `@pageshell/composites` |
| Spinner loading | `PageLoadingState` from `@pageshell/features` |
| Skeleton placeholders | `Skeleton` from `@pageshell/primitives` |
| Error with retry | `PageErrorState` from `@pageshell/features` |

## Exports

| Export Path | Description |
|-------------|-------------|
| `.` | All feature components |
| `./chat/styles/chat.css` | Chat component styles |

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm build` | Build with tsup |
| `pnpm type-check` | TypeScript validation |

## Related

- [AGENTS.md](./AGENTS.md) - Agent instructions
- [@pageshell/interactions](../pageshell-interactions/README.md) - Layer 3 components
- [@pageshell/primitives](../pageshell-primitives/README.md) - Layer 2 components
- [@pageshell/composites](../pageshell-composites/README.md) - Layer 5 composites
