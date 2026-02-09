---
title: Testing Guide
created: 2026-02-09
updated: 2026-02-09
author: Team AURIA
status: published
tags:
  - type/guide
  - status/published
related:
  - "[[docs/00-Index/Home]]"
  - "[[04-Development/Setup-Guide]]"
  - "[[02-Architecture/Overview]]"
---

# Testing Guide

Conventions, patterns, and utilities for testing in the AURIA monorepo.

---

## Stack

| Tool | Version | Purpose |
|------|---------|---------|
| **Vitest** | 3.2+ (web), 4.0+ (packages) | Test runner |
| **@testing-library/react** | 16.x | Component rendering & queries |
| **@testing-library/jest-dom** | 6.x | DOM matchers (`toBeInTheDocument()`, etc.) |
| **@testing-library/user-event** | 14.x | User interaction simulation |
| **jsdom** | Latest | DOM environment |
| **v8** | Built-in | Coverage provider |

---

## Running Tests

```bash
# All tests (monorepo-wide via Turborepo)
pnpm test

# Web app only
pnpm -C apps/web test
pnpm -C apps/web test:watch

# Specific package
pnpm -C packages/pageshell-core test
pnpm -C packages/pageshell-composites test

# With coverage (core package)
pnpm -C packages/pageshell-core test:coverage
```

---

## Configuration

All packages share the same Vitest config pattern:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,                    // No need to import describe/it/expect
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

**Web app additions** (`apps/web/vitest.config.ts`):
- Path alias: `@` → `./src`
- React SWC plugin via Vite
- Coverage config (v8 provider, lcov + json-summary reporters)
- Excludes: `src/components/ui/**` (shadcn), `src/integrations/supabase/types.ts` (generated)

**Setup files** extend Jest-DOM matchers and provide browser polyfills:

```typescript
// src/test-setup.ts (packages)
import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';
expect.extend(matchers);

// src/test/setup.ts (web app) — also adds:
Object.defineProperty(window, 'matchMedia', {
  value: (query) => ({ matches: false, media: query, ... }),
});
```

---

## File Organization

Tests live in `__tests__/` directories alongside source code:

```
src/
├── components/
│   ├── __tests__/
│   │   ├── CookieConsent.test.tsx
│   │   ├── ErrorBoundary.test.tsx
│   │   ├── ProtectedRoute.test.tsx
│   │   └── ThemeProvider.test.tsx
│   └── CookieConsent.tsx
├── pages/
│   └── __tests__/
│       └── NotFound.test.tsx
└── test/
    ├── setup.ts                  # Test setup (matchMedia polyfill)
    └── example.test.ts
```

Packages follow the same pattern:

```
packages/pageshell-composites/src/
└── linear-flow/
    ├── __tests__/
    │   └── LinearFlowPage.test.tsx
    └── LinearFlowPage.tsx
```

**Naming:** `ComponentName.test.tsx` for components, `utility.test.ts` for pure functions.

---

## Writing Tests

### Structure

```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the main content', () => {
      render(<Component />);
      expect(screen.getByText('Expected text')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls handler on click', async () => {
      const onClick = vi.fn();
      render(<Component onClick={onClick} />);
      await userEvent.click(screen.getByRole('button', { name: /submit/i }));
      expect(onClick).toHaveBeenCalledOnce();
    });
  });
});
```

### Query Priority

Follow Testing Library's [query priority](https://testing-library.com/docs/queries/about#priority):

1. `getByRole` — accessible roles (preferred)
2. `getByText` — visible text
3. `getByTestId` — last resort

```typescript
// Prefer role-based queries
screen.getByRole('button', { name: /aceitar/i });
screen.getByRole('heading', { level: 2 });

// Text for content assertions
screen.getByText('Paciente cadastrado com sucesso');

// Test IDs when no accessible alternative exists
screen.getByTestId('loader');
```

### Accessibility Testing

The project emphasizes ARIA attribute testing:

```typescript
describe('accessibility', () => {
  it('applies aria-current to active step', () => {
    render(<LinearFlowPage steps={steps} currentStep={0}>{() => <div />}</LinearFlowPage>);
    const steps = screen.getAllByRole('button');
    expect(steps[0]).toHaveAttribute('aria-current', 'step');
  });

  it('marks non-clickable steps as disabled', () => {
    render(<LinearFlowPage steps={steps} allowStepNavigation={false}>{() => <div />}</LinearFlowPage>);
    screen.getAllByRole('button').forEach((btn) => {
      expect(btn).toHaveAttribute('aria-disabled', 'true');
    });
  });
});
```

---

## Mocking Patterns

### Module Mocks

```typescript
// Mock an entire module
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock with minimal implementation
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

// Mock icon library
vi.mock('lucide-react', () => ({
  Shield: (props) => <span data-testid="icon-shield" {...props} />,
  AlertTriangle: (props) => <span data-testid="icon-alert" {...props} />,
}));
```

### Hook Mocks

```typescript
import { useAuth } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth');
const mockUseAuth = vi.mocked(useAuth);

it('shows loader when loading', () => {
  mockUseAuth.mockReturnValue({ user: null, loading: true });
  render(<ProtectedRoute><div>Content</div></ProtectedRoute>);
  expect(screen.getByTestId('loader')).toBeInTheDocument();
});

it('renders children when authenticated', () => {
  mockUseAuth.mockReturnValue({ user: { id: '1' }, loading: false });
  render(<ProtectedRoute><div>Content</div></ProtectedRoute>);
  expect(screen.getByText('Content')).toBeInTheDocument();
});
```

### External Services

```typescript
// Sentry
vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}));

// localStorage
beforeEach(() => localStorage.clear());

it('persists consent', () => {
  render(<CookieConsent />);
  fireEvent.click(screen.getByRole('button', { name: /aceitar/i }));
  expect(localStorage.getItem('cookie-consent')).toBe('accepted');
});
```

### Console Suppression

```typescript
// Suppress expected errors in ErrorBoundary tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});
```

---

## Routing Tests

Use `MemoryRouter` for components that depend on React Router:

```typescript
import { MemoryRouter } from 'react-router-dom';

it('redirects unauthenticated users to login', () => {
  mockUseAuth.mockReturnValue({ user: null, loading: false });
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <ProtectedRoute><div>Protected</div></ProtectedRoute>
    </MemoryRouter>
  );
  expect(screen.queryByText('Protected')).not.toBeInTheDocument();
});
```

---

## Performance Testing

The `@pageshell/core` package provides `RenderCounter` utilities for detecting unnecessary re-renders:

```typescript
import { createRenderCounter, assertRenderCounts } from '@pageshell/core/test-utils';

it('memoized child does not re-render on parent update', () => {
  const counter = createRenderCounter();
  const { rerender } = render(<Parent />);

  expect(counter.get('Parent')).toBe(1);
  expect(counter.get('Child')).toBe(1);

  rerender(<Parent someProp="new" />);

  assertRenderCounts(counter, [
    { key: 'Parent', expected: 2 },
    { key: 'Child', expected: 1 },   // Should NOT re-render
  ]);
});
```

---

## Coverage

Coverage is configured for the web app with v8 provider:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov', 'json-summary'],
  include: ['src/**/*.{ts,tsx}'],
  exclude: [
    'src/test/**',
    'src/**/*.test.{ts,tsx}',
    'src/components/ui/**',                // shadcn (third-party)
    'src/integrations/supabase/types.ts',  // generated
  ],
}
```

CI uploads coverage as an artifact (14-day retention).

---

## What NOT to Test

- **shadcn/ui components** — Third-party, already tested upstream
- **Generated Supabase types** — Auto-generated, no logic
- **Snapshot tests** — Not used in this project; prefer behavioral assertions
- **Implementation details** — Test behavior, not internal state

---

## Conventions Summary

| Convention | Rule |
|------------|------|
| Runner | Vitest with `globals: true` |
| Environment | `jsdom` |
| Queries | Role-based preferred, test IDs as last resort |
| Mocks | `vi.mock()` at module level, `vi.fn()` for callbacks |
| Structure | `describe` by feature area, `it` for specific behavior |
| Language | Test descriptions in English, UI assertions match Portuguese strings |
| Snapshots | Not used |
| Coverage | v8 provider, excludes shadcn + generated types |

---

## Related

- [[docs/00-Index/Home]] — Documentation Hub
- [[04-Development/Setup-Guide]] — Environment Setup
- [[02-Architecture/Overview]] — System Architecture

---
*Updated: 2026-02-09*
