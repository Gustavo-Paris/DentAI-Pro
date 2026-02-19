# AppLayout → PageShell Layout Migration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace custom AppLayout.tsx with ReactRouterAppShell from pageshell/layouts, reducing ~190 lines to ~40 declarative lines.

**Architecture:** Use `ReactRouterAppShell` from `@parisgroup-ai/pageshell/layouts/adapters/react-router` which auto-wires Link, navigation, and active route detection. Custom components (CreditBadge, ThemeToggle, HelpButton) go into designated slots.

**Tech Stack:** React 18, react-router-dom v6, @parisgroup-ai/pageshell@2.8.0, i18next, lucide-react

**Design doc:** `docs/plans/2026-02-18-applayout-migration-design.md`

---

### Task 1: Rewrite AppLayout.tsx with ReactRouterAppShell

**Files:**
- Modify: `apps/web/src/components/AppLayout.tsx`

**Step 1: Rewrite AppLayout.tsx**

Replace the entire file with the new declarative implementation:

```tsx
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ReactRouterAppShell } from '@parisgroup-ai/pageshell/layouts/adapters/react-router';
import { useAuth } from '@/contexts/AuthContext';
import { BRAND_NAME } from '@/lib/branding';
import { CreditBadge } from '@/components/CreditBadge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { HelpButton } from '@/components/HelpButton';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  User,
} from 'lucide-react';

export default function AppLayout() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  return (
    <ReactRouterAppShell
      theme="odonto-ai"
      brand={{
        icon: LayoutDashboard,
        title: BRAND_NAME,
        href: '/dashboard',
      }}
      navigation={[
        {
          items: [
            { title: t('components.layout.home'), href: '/dashboard', icon: LayoutDashboard, exact: true },
            { title: t('components.layout.evaluations'), href: '/evaluations', icon: FileText },
            { title: t('components.layout.patients'), href: '/patients', icon: Users },
            { title: t('components.layout.inventory'), href: '/inventory', icon: Package },
            { title: t('components.layout.profile'), href: '/profile', icon: User },
          ],
        },
      ]}
      user={{
        name: user?.user_metadata?.full_name ?? user?.email,
        email: user?.email,
        image: user?.user_metadata?.avatar_url,
      }}
      userMenuItems={[
        { label: t('components.layout.profile'), href: '/profile', icon: User },
      ]}
      onSignOut={signOut}
      themeToggle={<ThemeToggle />}
      footer={<CreditBadge variant="compact" className="w-full justify-center" />}
      headerRight={<CreditBadge variant="compact" />}
    >
      <HelpButton />
      <Outlet />
    </ReactRouterAppShell>
  );
}
```

**Step 2: Verify type-check passes**

Run: `cd apps/web && npx tsc --noEmit`
Expected: Clean (zero errors)

If there are type errors:
- Check `user` object shape — `useAuth()` returns Supabase `User` type, may need different property paths for name/email/avatar
- Check `ReactRouterAppShell` import path — try `@parisgroup-ai/pageshell/layouts/adapters/react-router`
- Check `icon` prop accepts lucide components (type is `IconProp = LucideIcon | string | React.ComponentType`)

**Step 3: Commit**

```bash
git add apps/web/src/components/AppLayout.tsx
git commit -m "feat(layout): replace custom AppLayout with ReactRouterAppShell"
```

---

### Task 2: Clean up duplicate skip-to-content in App.tsx

**Files:**
- Modify: `apps/web/src/App.tsx`

**Step 1: Remove the duplicate skip-to-content link**

In `App.tsx`, remove the `<a href="#main-content" ...>` element (lines 89-94) since `ReactRouterAppShell` includes one internally.

**Step 2: Verify build passes**

Run: `cd apps/web && npx vite build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add apps/web/src/App.tsx
git commit -m "refactor: remove duplicate skip-to-content (AppShell includes one)"
```

---

### Task 3: Fix brand gradient styling

**Files:**
- Modify: `apps/web/src/index.css` (if CSS override needed)

**Step 1: Check if brand text has the gold gradient**

Start the dev server and inspect the sidebar brand. The current `text-gradient-gold` class gives the brand name a gold gradient. `SidebarBrand` renders the title as a plain `<span>`.

**Step 2: Add CSS override if needed**

If the gradient is missing, add a CSS rule targeting the SidebarBrand title element. Inspect the rendered DOM to find the correct selector. Example approach:

```css
/* Brand gradient override for SidebarBrand */
[data-slot="sidebar-brand"] .sidebar-brand-title,
.ps-sidebar-brand span {
  @apply text-gradient-gold font-display tracking-[0.2em];
}
```

The exact selector depends on the rendered markup — inspect the DOM first.

**Step 3: Verify visually**

Open `http://localhost:8083/dashboard` and confirm the brand text has the gold gradient in both desktop sidebar and mobile header.

**Step 4: Commit (if changes were needed)**

```bash
git add apps/web/src/index.css
git commit -m "style: restore brand gradient in PageShell SidebarBrand"
```

---

### Task 4: Update AppLayout tests

**Files:**
- Modify: `apps/web/src/components/__tests__/AppLayout.test.tsx` (if exists)

**Step 1: Check if there are existing tests**

Look for `AppLayout.test.tsx` or any test that mocks the old AppLayout structure (NavLink items, bottom nav, mobile header).

**Step 2: Update or remove stale tests**

If tests exist that test the old custom markup (e.g., checking for bottom nav, specific CSS classes, NavLink rendering), update them to test the new structure:
- Verify `ReactRouterAppShell` is rendered
- Verify navigation items are passed
- Verify CreditBadge appears
- Verify signOut callback is wired

If no tests exist, skip this task.

**Step 3: Run test suite**

Run: `cd apps/web && npx vitest run`
Expected: Same pass rate as before (1165/1171, 6 pre-existing failures)

**Step 4: Commit (if changes were made)**

```bash
git add apps/web/src/components/__tests__/
git commit -m "test: update AppLayout tests for ReactRouterAppShell"
```

---

### Task 5: Smoke test + visual verification

**Step 1: Start dev server**

Run: `cd apps/web && npx vite`

**Step 2: Test desktop layout**

Navigate to `http://localhost:<port>/dashboard`:
- Sidebar visible on desktop with brand, 5 nav items, credit badge, theme toggle
- Navigation works (click each item, verify active state)
- Sign out button works (redirects to login)
- Main content renders correctly

**Step 3: Test mobile layout**

Resize browser to mobile width (< 1024px):
- Top header visible with brand and hamburger menu
- Hamburger opens sidebar drawer with nav items
- CreditBadge visible in header
- Navigation works from drawer (closes after selection)
- No bottom nav bar (removed)

**Step 4: Test page transitions**

Navigate between dashboard → evaluations → patients → inventory → profile:
- Each page renders correctly
- Active nav state highlights the correct item
- No console errors

**Step 5: Check console for errors**

Open browser DevTools console — should be zero errors.

---

### Task 6: Final verification

**Step 1: Type-check**

Run: `cd apps/web && npx tsc --noEmit`
Expected: Clean

**Step 2: Build**

Run: `cd apps/web && npx vite build`
Expected: Clean

**Step 3: Tests**

Run: `cd apps/web && npx vitest run`
Expected: 1165/1171 pass (6 pre-existing)

**Step 4: Report final status**
