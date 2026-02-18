# PageShell Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate all 28 pages from local `@pageshell/*` packages to the published `@parisgroup-ai/pageshell` package, then remove local packages.

**Architecture:** Big-bang migration. Swap root theme provider, replace all `@pageshell/*` imports with `@parisgroup-ai/pageshell/*`, rewrite auth/static/landing pages to use new composites, then delete local packages.

**Tech Stack:** React 18, TypeScript, @parisgroup-ai/pageshell@2.8.0, React Router v7, Tailwind CSS

**Design Doc:** `docs/plans/2026-02-18-pageshell-migration-design.md`

---

### Task 1: Foundation — CSS + Theme Provider

**Files:**
- Modify: `apps/web/src/index.css`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/components/ThemeProvider.tsx`

**Step 1: Add PageShell CSS imports to index.css**

At the top of `apps/web/src/index.css`, before the Google Fonts import, add:

```css
@import '@parisgroup-ai/pageshell/theme/tokens.css';
@import '@parisgroup-ai/pageshell/theme/portal-base.css';
@import '@parisgroup-ai/pageshell/theme/presets/odonto-ai.css';
```

Keep ALL existing CSS (tokens, keyframes, utilities) — they don't conflict, and custom animations (scroll-reveal, wizard, AI) are not in the package.

**Step 2: Replace ThemeProvider with PageShellProvider**

Replace `apps/web/src/components/ThemeProvider.tsx` contents:

```tsx
import { PageShellProvider } from '@parisgroup-ai/pageshell/theme';
import type { ReactNode } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <PageShellProvider theme="odonto-ai">
      {children}
    </PageShellProvider>
  );
}
```

This keeps the same export name so `App.tsx` doesn't need to change its import.

**Step 3: Verify the app renders**

Run: `cd apps/web && pnpm dev`
Expected: App starts, no CSS conflicts, theme loads

**Step 4: Commit**

```bash
git add apps/web/src/index.css apps/web/src/components/ThemeProvider.tsx
git commit -m "feat: add PageShell theme provider and CSS tokens"
```

---

### Task 2: Import Swap — 12 Existing Page Files

**Files:**
- Modify: `apps/web/src/pages/Dashboard.tsx` (lines 4-5)
- Modify: `apps/web/src/pages/dashboard/PrincipalTab.tsx` (lines 3-4)
- Modify: `apps/web/src/pages/Evaluations.tsx` (line 4)
- Modify: `apps/web/src/pages/Patients.tsx` (line 3)
- Modify: `apps/web/src/pages/Inventory.tsx` (line 36)
- Modify: `apps/web/src/pages/EvaluationDetails.tsx` (line 52)
- Modify: `apps/web/src/pages/Result.tsx` (line 34)
- Modify: `apps/web/src/pages/GroupResult.tsx` (line 15)
- Modify: `apps/web/src/pages/PatientProfile.tsx` (line 30)
- Modify: `apps/web/src/pages/Profile.tsx` (line 25)
- Modify: `apps/web/src/pages/Pricing.tsx` (line 11)
- Modify: `apps/web/src/pages/NewCase.tsx` (line 22)

**Step 1: Replace all @pageshell imports**

Exact replacements (mechanical find-and-replace):

| File | Old Import | New Import |
|------|-----------|------------|
| Dashboard.tsx:4 | `import { DashboardPage } from '@pageshell/composites/dashboard'` | `import { DashboardPage } from '@parisgroup-ai/pageshell/composites'` |
| Dashboard.tsx:5 | `import type { ModuleConfig, DashboardTab } from '@pageshell/composites/dashboard'` | `import type { ModuleConfig, DashboardTab } from '@parisgroup-ai/pageshell/composites'` |
| PrincipalTab.tsx:3 | `import { DashboardModuleCard } from '@pageshell/composites/dashboard'` | `import { DashboardModuleCard } from '@parisgroup-ai/pageshell/composites'` |
| PrincipalTab.tsx:4 | `import type { ModuleConfig } from '@pageshell/composites/dashboard'` | `import type { ModuleConfig } from '@parisgroup-ai/pageshell/composites'` |
| Evaluations.tsx:4 | `import { ListPage } from '@pageshell/composites/list'` | `import { ListPage } from '@parisgroup-ai/pageshell/composites'` |
| Patients.tsx:3 | `import { ListPage } from '@pageshell/composites/list'` | `import { ListPage } from '@parisgroup-ai/pageshell/composites'` |
| Inventory.tsx:36 | `import { ListPage } from '@pageshell/composites/list'` | `import { ListPage } from '@parisgroup-ai/pageshell/composites'` |
| EvaluationDetails.tsx:52 | `import { DetailPage } from '@pageshell/composites'` | `import { DetailPage } from '@parisgroup-ai/pageshell/composites'` |
| Result.tsx:34 | `import { DetailPage } from '@pageshell/composites'` | `import { DetailPage } from '@parisgroup-ai/pageshell/composites'` |
| GroupResult.tsx:15 | `import { DetailPage } from '@pageshell/composites'` | `import { DetailPage } from '@parisgroup-ai/pageshell/composites'` |
| PatientProfile.tsx:30 | `import { DetailPage } from '@pageshell/composites'` | `import { DetailPage } from '@parisgroup-ai/pageshell/composites'` |
| Profile.tsx:25 | `import { DetailPage } from '@pageshell/composites'` | `import { DetailPage } from '@parisgroup-ai/pageshell/composites'` |
| Pricing.tsx:11 | `import { DetailPage } from '@pageshell/composites'` | `import { DetailPage } from '@parisgroup-ai/pageshell/composites'` |
| NewCase.tsx:22 | `import { WizardPage } from '@pageshell/composites'` | `import { WizardPage } from '@parisgroup-ai/pageshell/composites'` |

**Step 2: Type-check**

Run: `cd apps/web && pnpm tsc --noEmit`
Expected: No new type errors from import changes. If any composite prop types differ between old/new, fix them here.

**Step 3: Commit**

```bash
git add apps/web/src/pages/
git commit -m "refactor: swap @pageshell/* imports to @parisgroup-ai/pageshell"
```

---

### Task 3: Auth Pages — Login

**Files:**
- Modify: `apps/web/src/pages/Login.tsx`

**Step 1: Read current Login.tsx fully**

Understand the current auth flow: email/password form, Google OAuth button, validation, error handling.

**Step 2: Rewrite using FormPage**

Replace the custom layout with FormPage from the new package. Keep all existing auth logic (useAuth hook, Google OAuth, form validation with zod). The page structure becomes:

```tsx
import { FormPage } from '@parisgroup-ai/pageshell/composites';
```

Use FormPage with `slots` for the OAuth button and navigation links. Keep the same form fields (email, password). Keep the same submit handler. Keep the same error/loading states.

**Important:** Do NOT change auth logic — only the presentation wrapper. If FormPage doesn't fit the exact layout needed (e.g., split layout with branding panel), use PageSection from layouts instead and keep the form components.

**Step 3: Verify login flow works**

Run dev server, test: email login, Google OAuth, validation errors, forgot password link.

**Step 4: Commit**

```bash
git add apps/web/src/pages/Login.tsx
git commit -m "refactor: migrate Login page to PageShell composites"
```

---

### Task 4: Auth Pages — Register, ForgotPassword, ResetPassword

**Files:**
- Modify: `apps/web/src/pages/Register.tsx`
- Modify: `apps/web/src/pages/ForgotPassword.tsx`
- Modify: `apps/web/src/pages/ResetPassword.tsx`

**Step 1: Read each file fully**

**Step 2: Rewrite each using the same pattern as Login (Task 3)**

Same approach: replace layout wrapper, keep auth logic. These are simpler forms than Login.

- Register: email, password, confirm password, name fields + Google OAuth
- ForgotPassword: single email field
- ResetPassword: password + confirm password fields

**Step 3: Verify all auth flows**

Test each page in dev mode: form validation, submit, navigation between pages.

**Step 4: Remove AuthLayout.tsx**

Delete `apps/web/src/components/auth/AuthLayout.tsx` — no longer needed.

Run: `cd apps/web && pnpm tsc --noEmit` to verify no remaining references.

**Step 5: Commit**

```bash
git add apps/web/src/pages/Register.tsx apps/web/src/pages/ForgotPassword.tsx apps/web/src/pages/ResetPassword.tsx
git rm apps/web/src/components/auth/AuthLayout.tsx
git commit -m "refactor: migrate auth pages to PageShell composites"
```

---

### Task 5: Static Pages — Terms, Privacy, NotFound

**Files:**
- Modify: `apps/web/src/pages/Terms.tsx`
- Modify: `apps/web/src/pages/Privacy.tsx`
- Modify: `apps/web/src/pages/NotFound.tsx`

**Step 1: Read each file**

**Step 2: Rewrite Terms and Privacy**

Use layout components from the new package:

```tsx
import { PageSection, PageHeading } from '@parisgroup-ai/pageshell/layouts';
```

Wrap content in PageSection. Keep the same text content and i18n keys.

**Step 3: Rewrite NotFound**

Use EmptyState from primitives:

```tsx
import { EmptyState } from '@parisgroup-ai/pageshell/primitives';
```

Show 404 icon, message, and back button using EmptyState component.

**Step 4: Verify pages render**

**Step 5: Commit**

```bash
git add apps/web/src/pages/Terms.tsx apps/web/src/pages/Privacy.tsx apps/web/src/pages/NotFound.tsx
git commit -m "refactor: migrate static pages to PageShell components"
```

---

### Task 6: Landing Page

**Files:**
- Modify: `apps/web/src/pages/Landing.tsx`
- Modify: `apps/web/src/components/landing/HeroMockup.tsx`
- Modify: `apps/web/src/components/landing/FeaturePreview.tsx`

**Step 1: Read Landing.tsx and landing components fully**

**Step 2: Replace shadcn primitives with package primitives**

In Landing.tsx, replace imports:
- `@/components/ui/button` → `@parisgroup-ai/pageshell/primitives` (Button)
- `@/components/ui/badge` → `@parisgroup-ai/pageshell/primitives` (Badge)
- `@/components/ui/card` → `@parisgroup-ai/pageshell/primitives` (Card)
- Accordion from the package primitives

**Important:** Keep scroll-reveal CSS classes and IntersectionObserver logic — these are custom and not in the package. Keep all content/copy unchanged.

**Step 3: Apply same primitive replacements in HeroMockup.tsx and FeaturePreview.tsx**

**Step 4: Verify landing page renders with animations**

**Step 5: Commit**

```bash
git add apps/web/src/pages/Landing.tsx apps/web/src/components/landing/
git commit -m "refactor: migrate Landing page to PageShell primitives"
```

---

### Task 7: SharedEvaluation Page

**Files:**
- Modify: `apps/web/src/pages/SharedEvaluation.tsx`

**Step 1: Read SharedEvaluation.tsx fully**

**Step 2: Wrap with DetailPage composite**

```tsx
import { DetailPage } from '@parisgroup-ai/pageshell/composites';
```

This page is a readonly view of evaluation results — DetailPage is the natural fit. Keep all protocol components as slot content.

**Step 3: Replace any shadcn imports with package primitives where applicable**

**Step 4: Verify shared link flow works**

**Step 5: Commit**

```bash
git add apps/web/src/pages/SharedEvaluation.tsx
git commit -m "refactor: migrate SharedEvaluation page to PageShell DetailPage"
```

---

### Task 8: Cleanup — Remove Local Packages

**Files:**
- Delete: `packages/pageshell-core/`
- Delete: `packages/pageshell-composites/`
- Delete: `packages/pageshell-domain/`
- Delete: `packages/pageshell-features/`
- Delete: `packages/pageshell-interactions/`
- Delete: `packages/pageshell-layouts/`
- Delete: `packages/pageshell-primitives/`
- Delete: `packages/pageshell-shell/`
- Delete: `packages/pageshell-theme/`
- Delete: `packages/pageshell-themes/`
- Delete: `packages/page-shell/`
- Modify: `apps/web/package.json` (remove local @pageshell/* deps)

**Step 1: Verify no remaining @pageshell/ imports**

Run: `grep -r "from '@pageshell/" apps/web/src/` — must return empty.

Run: `grep -r "from '@page-shell" apps/web/src/` — must return empty.

**Step 2: Remove @pageshell/* dependencies from apps/web/package.json**

Remove all entries like `"@pageshell/composites": "workspace:*"` etc.

**Step 3: Remove next-themes dependency**

No longer needed since PageShellProvider handles theme. Remove from package.json.

**Step 4: Delete local packages**

```bash
rm -rf packages/pageshell-core packages/pageshell-composites packages/pageshell-domain packages/pageshell-features packages/pageshell-interactions packages/pageshell-layouts packages/pageshell-primitives packages/pageshell-shell packages/pageshell-theme packages/pageshell-themes packages/page-shell
```

**Step 5: Reinstall deps**

```bash
pnpm install
```

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove local pageshell packages (replaced by @parisgroup-ai/pageshell)"
```

---

### Task 9: Final Verification

**Step 1: Type-check**

Run: `cd apps/web && pnpm tsc --noEmit`
Expected: No new errors.

**Step 2: Build**

Run: `cd apps/web && pnpm build`
Expected: Clean build.

**Step 3: Run tests**

Run: `cd apps/web && pnpm test`
Expected: All existing tests pass.

**Step 4: Manual smoke test**

Start dev server and verify:
- [ ] Landing page renders with animations
- [ ] Login/Register/ForgotPassword/ResetPassword work
- [ ] Dashboard loads with tabs and modules
- [ ] Evaluations list loads
- [ ] New case wizard works
- [ ] Result/GroupResult pages display protocols
- [ ] Patient list and profile work
- [ ] Inventory page works
- [ ] Profile page with all tabs works
- [ ] Pricing page works
- [ ] SharedEvaluation (public link) works
- [ ] Terms/Privacy pages render
- [ ] 404 page works
- [ ] Dark/light theme toggle works
- [ ] Mobile responsive layout works

**Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve migration issues found during smoke test"
```
