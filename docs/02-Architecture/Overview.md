---
title: Architecture Overview
created: 2026-02-08
updated: 2026-02-08
author: Team AURIA
status: published
tags:
  - type/guide
  - status/published
related:
  - "[[docs/00-Index/Home]]"
  - "[[06-ADRs/ADR-001-3-layer-frontend-architecture]]"
  - "[[06-ADRs/ADR-002-pageshell-design-system-adoption]]"
  - "[[02-Architecture/Tech-Stack]]"
---

# Architecture Overview

> System architecture for AURIA — clinical decision support with AI.

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        apps/web                             │
│                                                             │
│   src/pages/ (16)    src/hooks/domain/ (10)   src/data/ (10)│
│   ┌──────────┐       ┌──────────────┐       ┌────────────┐ │
│   │  Page     │──────→│ Domain Hooks │──────→│ Data Client│ │
│   │ Adapters  │       │ (React Query)│       │ (Supabase) │ │
│   └──────────┘       └──────────────┘       └────────────┘ │
│        │                                          │         │
│        ↓                                          │         │
│   src/components/ (104)                           │         │
│   ┌────────────────────────────────────────┐      │         │
│   │   PageShell Design System (11 pkgs)    │      │         │
│   │   Composites → Features → Interactions │      │         │
│   │   Layouts → Primitives → Core          │      │         │
│   └────────────────────────────────────────┘      │         │
└───────────────────────────────────────────────────┼─────────┘
                                                    │
            ┌───────────────────────────────────────┼──────┐
            │                                       ↓      │
            │   ┌─────────────────┐    ┌──────────────────┐│
            │   │   Supabase      │    │  Edge Functions   ││
            │   │  PostgreSQL     │    │  (Deno × 8)       ││
            │   │  Auth + Storage │    │                    ││
            │   └─────────────────┘    │  _shared/          ││
            │                          │  ├─ prompts/ (5)   ││
            │   ┌─────────────────┐    │  ├─ credits.ts     ││
            │   │ Google Gemini   │←───│  ├─ gemini.ts      ││
            │   │ AI APIs         │    │  └─ validation.ts  ││
            │   └─────────────────┘    └──────────────────┘│
            │                                              │
            │   ┌─────────────────┐                        │
            │   │  Stripe         │                        │
            │   │  Billing APIs   │                        │
            │   └─────────────────┘                        │
            └──────────────────────────────────────────────┘
```

---

## Directory Structure

```
auria/
├── apps/web/                    # React 18 + Vite app
│   ├── src/
│   │   ├── pages/               # 16 route pages (Page Adapters)
│   │   │   └── dashboard/       # Dashboard subcomponents
│   │   ├── components/          # ~104 component files
│   │   │   ├── wizard/          # Multi-step case analysis
│   │   │   ├── dsd/             # Digital Smile Design viz
│   │   │   ├── protocol/        # Treatment protocol display
│   │   │   ├── pricing/         # Subscription UI
│   │   │   └── ui/              # shadcn/ui primitives
│   │   ├── hooks/domain/        # 10 domain hooks
│   │   ├── data/                # 10 data client modules
│   │   ├── lib/                 # 28 utility modules + schemas
│   │   ├── contexts/            # AuthContext
│   │   ├── types/               # DSD + Protocol types
│   │   └── integrations/        # Supabase client + generated types
│   └── public/                  # Static assets
│
├── packages/                    # Shared packages
│   ├── page-shell/              # Barrel re-export
│   ├── pageshell-core/          # L0: hooks, utils, types
│   ├── pageshell-primitives/    # L1: Radix UI wrappers
│   ├── pageshell-theme/         # L1: Theme context
│   ├── pageshell-themes/        # L1: Theme presets
│   ├── pageshell-layouts/       # L2: Grid, sidebar, page structure
│   ├── pageshell-interactions/  # L2: Forms, dropdowns, search
│   ├── pageshell-features/      # L3: Feature components
│   ├── pageshell-composites/    # L4: 30+ composite subdirs
│   ├── pageshell-shell/         # Facade & query handling
│   ├── pageshell-domain/        # Domain-specific UI
│   └── logger/                  # Structured logging
│
├── supabase/
│   ├── functions/               # 8 Edge Functions (Deno)
│   │   ├── _shared/             # Shared: CORS, auth, prompts, credits
│   │   ├── analyze-dental-photo/
│   │   ├── generate-dsd/
│   │   ├── recommend-resin/
│   │   ├── recommend-cementation/
│   │   ├── stripe-webhook/
│   │   ├── create-checkout-session/
│   │   ├── create-portal-session/
│   │   └── sync-subscription/
│   └── migrations/              # 14 SQL migration files
│
├── docs/                        # Obsidian vault
│   ├── 00-Index/                # Entry points
│   ├── 02-Architecture/         # System design (this folder)
│   ├── 06-ADRs/                 # Architecture Decision Records
│   ├── 08-Glossary/             # Term definitions
│   ├── plans/                   # Design documents
│   └── Templates/               # Doc templates
│
├── tests/                       # E2E test suite
└── .claude/                     # Agent configurations
```

---

## 3-Layer Frontend Architecture

> See [[06-ADRs/ADR-001-3-layer-frontend-architecture|ADR-001]] for the full decision record.

| Layer | Location | Count | Responsibility |
|-------|----------|------:|----------------|
| **Data Client** | `src/data/` | 10 | Typed Supabase wrappers — no business logic, no React |
| **Domain Hooks** | `src/hooks/domain/` | 10 | React Query + business rules, derived state |
| **Page Adapters** | `src/pages/` | 16 | Map domain data → PageShell composites — no fetching |

**Key domain hooks:**

| Hook | Purpose |
|------|---------|
| `useDashboard` | Dashboard data, stats, greeting |
| `useWizardFlow` | Wizard navigation, case creation, AI calls |
| `useResult` | Result page orchestration |
| `useEvaluationDetail` | Case detail view |
| `useEvaluationSessions` | Case history list |
| `usePatientList` | Patient listing + search |
| `usePatientProfile` | Patient detail + evaluations |
| `useInventoryManagement` | Material CRUD |
| `useProfile` | User settings |

---

## PageShell Design System

> See [[06-ADRs/ADR-002-pageshell-design-system-adoption|ADR-002]] for the adoption decision.

11 packages organized in 5 layers:

```
L0  @pageshell/core          — hooks, utils, types, formatters
L1  @pageshell/primitives    — Radix UI wrappers (25 components)
    @pageshell/theme         — Theme context & hooks
    @pageshell/themes        — Theme presets
L2  @pageshell/layouts       — Grid, sidebar, page structure
    @pageshell/interactions  — Forms, dropdowns, search
L3  @pageshell/features      — Feature-level components
L4  @pageshell/composites    — 30+ composite subdirectories
    @pageshell/shell         — Facade & query handling
    @pageshell/domain        — Domain-specific UI
```

**Available composites:** ListPage, FormPage, FormModal, DetailPage, DashboardPage, WizardPage, SettingsPage

---

## Edge Functions

8 Deno Edge Functions split into AI (4) and Billing (4):

| Function | Type | Purpose |
|----------|------|---------|
| `analyze-dental-photo` | AI | Photo analysis via Gemini (23KB) |
| `generate-dsd` | AI | Digital Smile Design generation |
| `recommend-resin` | AI | Resin stratification recommendation |
| `recommend-cementation` | AI | Cementation protocol recommendation |
| `stripe-webhook` | Billing | Stripe event processing |
| `create-checkout-session` | Billing | Stripe Checkout session |
| `create-portal-session` | Billing | Stripe Customer Portal |
| `sync-subscription` | Billing | Subscription state sync |

**Shared modules** (`_shared/`): CORS, Gemini client (19KB), validation (11KB), credits, rate limiting, metrics adapter, logger, prompt templates (7 dirs).

> [!warning] Deploy Requirements
> All edge functions must have `verify_jwt = false` in `config.toml` and be deployed with `--no-verify-jwt --use-docker`. Functions perform auth internally via `supabase.auth.getUser()`.

---

## Codebase Statistics

| Language | Files | Lines | Share |
|----------|------:|------:|------:|
| TypeScript (`.ts`) | 1,223 | 103,591 | 46% |
| TSX (`.tsx`) | 537 | 86,302 | 39% |
| CSS | 21 | 10,834 | 5% |
| Markdown | 71 | 8,996 | 4% |
| SQL | 14 | 2,005 | 1% |
| JSON | 221 | 2,033 | 1% |
| Others | 16 | 9,143 | 4% |
| **Total** | **2,103** | **222,904** | **100%** |

---

## Related

- [[docs/00-Index/Home]] — Documentation Hub
- [[02-Architecture/Tech-Stack]] — Full dependency catalog
- [[06-ADRs/ADR-Index]] — Architecture Decision Records
- [[08-Glossary/Terms]] — Domain & technical terms
- [[plans/2026-02-08-comprehensive-audit-design]] — Comprehensive audit results

---
*Updated: 2026-02-08*
