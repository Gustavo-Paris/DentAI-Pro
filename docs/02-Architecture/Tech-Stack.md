---
title: Technology Stack & Dependencies
created: 2026-02-08
updated: 2026-02-08
author: Team AURIA
status: published
tags:
  - type/guide
  - status/published
related:
  - "[[docs/00-Index/Home]]"
  - "[[02-Architecture/Overview]]"
---

# Technology Stack & Dependencies

> Complete dependency catalog for AURIA, organized by workspace.

---

## Summary

| Category | Key Technologies |
|----------|-----------------|
| **Frontend** | React 18, Vite 5.4, TypeScript 5.8 |
| **Styling** | Tailwind CSS 3.4, shadcn/ui, 25 Radix UI primitives |
| **State** | React Query 5.83, React Hook Form 7.61, Zod 3.25 |
| **Backend** | Supabase (PostgreSQL + Auth + Edge Functions) |
| **AI** | Google Gemini APIs (via custom client) |
| **Billing** | Stripe (npm:stripe@14.14.0) |
| **Monitoring** | Sentry, Web Vitals |
| **Testing** | Vitest 3.2, Testing Library |
| **Monorepo** | Turborepo 2.5, pnpm 9.15 |
| **Deploy** | Vercel (frontend), Supabase (backend) |

---

## Root Workspace

Build orchestration and monorepo configuration.

| Package | Version | Purpose |
|---------|---------|---------|
| turbo | ^2.5.0 | Monorepo task orchestration |
| pnpm | 9.15.4 | Package manager with workspaces |

**Overrides** (pinned across all workspaces):
- `react` / `react-dom`: ^18.3.1
- `@types/react` / `@types/react-dom`: ^18.3.18 / ^18.3.5

---

## Web App (`apps/web`)

### Runtime Dependencies

**Core:**

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.3.1 | UI framework |
| react-dom | ^18.3.1 | DOM renderer |
| react-router-dom | ^6.30.1 | Client-side routing |
| @tanstack/react-query | ^5.83.0 | Server state management |
| @supabase/supabase-js | ^2.91.0 | Supabase client |
| react-hook-form | ^7.61.1 | Form state management |
| @hookform/resolvers | ^3.10.0 | Zod resolver for RHF |
| zod | ^3.25.76 | Schema validation |

**UI & Styling:**

| Package | Version | Purpose |
|---------|---------|---------|
| @pageshell/composites | workspace:* | Internal page composites |
| class-variance-authority | ^0.7.1 | CSS variant composition |
| tailwind-merge | ^2.6.0 | Tailwind class dedup |
| tailwindcss-animate | ^1.0.7 | Animation plugin |
| lucide-react | ^0.462.0 | Icon library |
| cmdk | ^1.1.1 | Command menu |
| sonner | ^1.7.4 | Toast notifications |
| vaul | ^0.9.9 | Drawer/sheet component |
| recharts | ^2.15.4 | Charting library |
| embla-carousel-react | ^8.6.0 | Carousel |
| react-resizable-panels | ^2.1.9 | Resizable panels |
| react-day-picker | ^8.10.1 | Date picker |
| input-otp | ^1.4.2 | OTP input |

**Radix UI Primitives** (25 packages):
accordion, alert-dialog, aspect-ratio, avatar, checkbox, collapsible, context-menu, dialog, dropdown-menu, hover-card, label, menubar, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, slot, switch, tabs, toast, toggle, toggle-group, tooltip

**Utilities:**

| Package | Version | Purpose |
|---------|---------|---------|
| date-fns | ^3.6.0 | Date manipulation |
| clsx | ^2.1.1 | Class name utility |
| next-themes | ^0.3.0 | Dark mode support |
| jspdf | ^4.0.0 | PDF generation |
| heic-to | ^1.3.0 | HEIC image conversion |
| @sentry/react | ^10.37.0 | Error tracking |
| web-vitals | ^5.1.0 | Core Web Vitals |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| vite | ^5.4.19 | Build tool |
| @vitejs/plugin-react-swc | ^3.11.0 | SWC support for Vite |
| typescript | ^5.8.3 | Type checking |
| vitest | ^3.2.4 | Testing framework |
| @vitest/coverage-v8 | ^3.2.4 | Coverage |
| @testing-library/react | ^16.0.0 | React testing |
| @testing-library/jest-dom | ^6.6.0 | DOM matchers |
| jsdom | ^20.0.3 | DOM implementation |
| eslint | ^9.32.0 | Linting |
| typescript-eslint | ^8.38.0 | TS ESLint |
| tailwindcss | ^3.4.17 | CSS framework |
| postcss | ^8.5.6 | CSS processing |
| autoprefixer | ^10.4.21 | Vendor prefixes |

---

## PageShell Packages (11 packages)

**Shared across all PageShell packages:**

| Package | Version | Purpose |
|---------|---------|---------|
| tsup | ^8.5.1 | TypeScript build tool |
| typescript | ^5.8–5.9 | Type checking |
| vitest | ^4.0.18 | Testing |
| @testing-library/react | ^16.3.2 | Component testing |

**Key per-package dependencies:**

| Package | Key Deps |
|---------|----------|
| `@pageshell/core` | clsx, tailwind-merge |
| `@pageshell/primitives` | 25 Radix UI packages, lucide-react, CVA |
| `@pageshell/domain` | date-fns ^4.1.0, core, layouts, primitives, theme |
| `@pageshell/composites` | All @pageshell/* packages, CVA |

**Logger** (`@repo/logger`): Zero external dependencies — pure TypeScript utility.

---

## Supabase Edge Functions (Deno)

| Import | Version | Purpose |
|--------|---------|---------|
| `jsr:@supabase/supabase-js` | @2 | Supabase client |
| `npm:stripe` | @14.14.0 | Stripe API |
| `deno.land/std` | @0.168.0 | Deno HTTP server |

**Custom shared modules** (no external deps):
- Gemini API client (`gemini.ts` — 19KB)
- Input validation (`validation.ts` — 11KB)
- Prompt management (5 templates, 7 subdirs)
- Credit system, rate limiting, CORS, metrics, logger

> [!info] Import Convention
> All `esm.sh` imports have been migrated to `jsr:` (Supabase) and `npm:` (Stripe) for reliability.

---

## Database

| Technology | Details |
|-----------|---------|
| PostgreSQL | Supabase-managed |
| Migrations | 14 SQL files in `supabase/migrations/` |
| Auth | Supabase Auth (ES256 JWTs) |
| Storage | Supabase Storage (intraoral photos) |

---

## Related

- [[02-Architecture/Overview]] — System architecture and directory structure
- [[docs/00-Index/Home]] — Documentation Hub
- [[plans/2026-02-08-comprehensive-audit-design]] — Audit with dependency analysis

---
*Updated: 2026-02-08*
