---
title: AppLayout → PageShell Layout Migration Design
created: 2026-02-18
updated: 2026-02-18
status: approved
tags:
  - type/design
  - status/approved
---

# AppLayout → PageShell Layout Migration Design

## Goal

Replace the custom `AppLayout.tsx` (~190 lines) with `ReactRouterAppShell` from `@parisgroup-ai/pageshell/layouts/adapters/react-router`, eliminating custom sidebar, mobile header, and mobile bottom nav in favor of the design system's built-in layout shell.

## Context

The PageShell migration (2026-02-18) successfully migrated primitives, composites, and theme. The **layout layer** (`@parisgroup-ai/pageshell/layouts`) was not migrated — the app still uses a custom `AppLayout.tsx` with hand-built sidebar, mobile top bar, and mobile bottom nav.

## Architecture

### Current State

```
AppLayout.tsx (192 lines)
├── Desktop: Fixed sidebar (w-56) with brand, nav, credits, theme toggle, sign out
├── Mobile: Sticky top bar with brand + action buttons
├── Main: <Outlet /> with route transition animation
├── Mobile: Fixed bottom nav bar (5 tabs)
└── Floating: HelpButton
```

### Target State

```
ReactRouterAppShell (declarative config)
├── brand: { icon, title, href }
├── navigation: NavSection[] (5 items with icons)
├── user: { name, email, image }
├── onSignOut: callback
├── themeToggle: <ThemeToggle />
├── footer: <CreditBadge /> (sidebar)
├── headerRight: <CreditBadge /> (mobile header)
├── children: <HelpButton /> + <Outlet />
└── Mobile: hamburger → sidebar drawer (replaces bottom nav)
```

## Key Decisions

### Mobile Navigation: Bottom Nav → Sidebar Drawer

**Decision:** Accept the AppShell's sidebar drawer pattern on mobile.

- Current: 5 tabs always visible at bottom
- New: Hamburger menu opens sidebar drawer
- Trade-off: Fewer visible taps, but consistent with design system

### Custom Components Placement

| Component | Slot |
|-----------|------|
| `CreditBadge` (compact) | `footer` (sidebar) + `headerRight` (mobile) |
| `ThemeToggle` | `themeToggle` prop |
| `HelpButton` | Inside `children`, stays as floating FAB |
| `GlobalSearch` | Stays outside layout (App.tsx), triggered via custom event |

### What Gets Removed

- Custom desktop sidebar markup
- Custom mobile top bar markup
- Custom mobile bottom nav bar
- Duplicate `skip-to-content` link (AppShell includes one)
- Manual `NavLink` rendering with active state logic
- Route transition `key` + CSS class

### What Gets Preserved

- All 5 navigation items with lucide icons
- CreditBadge in both desktop and mobile contexts
- ThemeToggle cycling behavior
- HelpButton floating FAB
- GlobalSearch (independent of layout)
- All routes and lazy loading (App.tsx unchanged)

## Attention Points

- **Brand gradient:** Current uses `text-gradient-gold` CSS class on brand text. `SidebarBrand` renders `title` as plain text — may need CSS override to restore gradient.
- **User menu items:** Can add Profile and Pricing links to `userMenuItems` dropdown.
- **i18n:** Navigation item titles need `t()` calls — verify AppShell supports dynamic strings.
- **Theme value:** `'odonto-ai'` as `LayoutTheme` — verify it's accepted (type is `string & {}`).

## Estimated Impact

- **Lines removed:** ~190 (AppLayout.tsx gutted)
- **Lines added:** ~40 (declarative config)
- **Net reduction:** ~150 lines
- **Files changed:** 2 (AppLayout.tsx, App.tsx for skip-to-content cleanup)
- **Files unchanged:** All pages, all routes, all other components
