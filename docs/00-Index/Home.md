---
title: DentAI Pro - Documentation Hub
created: 2026-02-04
updated: 2026-02-04
author: Team DentAI
status: published
tags:
  - type/index
  - status/published
---

# DentAI Pro Documentation

Sistema de apoio à decisão clínica odontológica com Inteligência Artificial.

## Quick Start

1. [[README|Instalar o projeto]]
2. [[apps/web/README|Configurar o app web]]
3. [[plans/2026-02-04-frontend-architecture-design|Entender a arquitetura]]

## Sections

| Section | Description |
|---------|-------------|
| [[#Architecture]] | System design, layers, data flow |
| [[#Apps]] | Application documentation |
| [[#Packages]] | PageShell design system & shared packages |
| [[#Edge Functions]] | Supabase Edge Functions (AI, Billing) |
| [[#Architecture Decision Records (ADRs)]] | Formal architecture decisions |
| [[#Glossary]] | Domain & technical term definitions |
| [[#Architecture Plans]] | Design documents & implementation plans |
| [[#Operations]] | Build, deploy, CI/CD |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                     apps/web                        │
│  ┌───────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │   Pages   │→ │ Domain Hooks │→ │ Data Client  │  │
│  │ (Adapters)│  │ (React Query)│  │ (Supabase)   │  │
│  └───────────┘  └──────────────┘  └─────────────┘  │
│        ↓                                            │
│  ┌───────────────────────────────────────────────┐  │
│  │          PageShell Design System              │  │
│  │  Composites → Features → Interactions →       │  │
│  │  Layouts → Primitives → Core                  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
         ↓                    ↓
┌─────────────────┐  ┌──────────────────┐
│    Supabase      │  │  Google Gemini   │
│ Auth + DB + Edge │  │  AI APIs         │
└─────────────────┘  └──────────────────┘
```

**3-Layer Frontend Pattern:**

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Data Client** | Typed Supabase wrappers, no business logic | `apps/web/src/data/` |
| **Domain Hooks** | React Query + business rules | `apps/web/src/hooks/` |
| **Page Adapters** | Map domain data → PageShell composites | `apps/web/src/pages/` |

> [!info] Architecture Details
> See [[plans/2026-02-04-frontend-architecture-design|Frontend Architecture Design]] for the full specification.

---

## Apps

### @dentai/web

Main clinical decision support application.

| Property | Value |
|----------|-------|
| **Path** | `apps/web/` |
| **Framework** | React 18 + Vite |
| **Docs** | [[apps/web/README]] |

**Core Features:**

- **Dental Photo Analysis** — AI-powered intraoral photo analysis with VITA color identification
- **Resin Recommendation** — Personalized stratification protocol with compatible resins
- **Cementation Recommendation** — Ideal cements and techniques per case
- **Digital Smile Design (DSD)** — Treatment simulations with dental proportion analysis
- **Patient Management** — Full CRUD with evaluation tracking
- **Billing** — Stripe subscription integration

---

## Packages

### PageShell Design System

Layered component library for rapid UI development. Import via barrel: `@repo/page-shell`.

```
L0  Core         — hooks, utils, types, formatters
L1  Primitives   — Radix UI wrappers (Button, Input, Dialog...)
L2  Layouts      — grids, sidebars, page structure
L2  Interactions — forms, dropdowns, search
L3  Features     — feature-level components
L4  Composites   — full page patterns (ListPage, FormPage, DetailPage...)
```

| Package | Scope | Docs |
|---------|-------|------|
| `@pageshell/core` | Hooks, utils, types | [[packages/pageshell-core/README]] |
| `@pageshell/primitives` | Radix UI primitives | [[packages/pageshell-primitives/README]] |
| `@pageshell/layouts` | Layout components | [[packages/pageshell-layouts/README]] |
| `@pageshell/interactions` | Interactive components | [[packages/pageshell-interactions/README]] |
| `@pageshell/features` | Feature components | [[packages/pageshell-features/README]] |
| `@pageshell/composites` | Page composites | [[packages/pageshell-composites/README]] |
| `@pageshell/shell` | Facade & query handling | [[packages/pageshell-shell/README]] |
| `@pageshell/theme` | Theme context & hooks | [[packages/pageshell-theme/README]] |
| `@pageshell/themes` | Theme presets (admin, creator, student) | [[packages/pageshell-themes/README]] |
| `@pageshell/domain` | Domain-specific UI | [[packages/pageshell-domain/README]] |

**Composites Available:**

| Composite | Use Case |
|-----------|----------|
| `ListPage` | CRUD lists with filtering, sorting, pagination |
| `FormPage` | Forms with validation |
| `FormModal` | Modal form dialogs |
| `DetailPage` | Detail/view with sections and tabs |
| `DashboardPage` | Stats & widgets |
| `WizardPage` | Multi-step flows |

> [!tip] Usage Guide
> See [[packages/pageshell-composites/README|Composites README]] for full API and examples.

### Shared Utilities

| Package | Purpose | Docs |
|---------|---------|------|
| `@repo/logger` | Structured logging (debug, info, warn, error) | [[packages/logger/README]] |
| `@repo/page-shell` | Barrel re-export of all @pageshell/* | [[packages/page-shell/README]] |

---

## Edge Functions

Supabase Edge Functions (Deno runtime) handling AI processing and billing.

| Function | Purpose |
|----------|---------|
| `analyze-dental-photo` | AI photo analysis via Google Gemini |
| `generate-dsd` | Digital Smile Design generation |
| `recommend-cementation` | Cementation protocol recommendation |
| `recommend-resin` | Resin stratification recommendation |
| `stripe-webhook` | Stripe event processing |
| `create-checkout-session` | Stripe Checkout session creation |
| `create-portal-session` | Stripe Customer Portal session |
| `sync-subscription` | Subscription state synchronization |

**Shared utilities:** `supabase/functions/_shared/` (CORS, auth helpers, prompt templates)

> [!info] Prompt Management
> See [[plans/2026-02-04-prompt-management-design|Prompt Management Design]] for the planned centralization of AI prompt templates.

---

## Architecture Decision Records (ADRs)

| ADR | Title | Status |
|-----|-------|--------|
| [[06-ADRs/ADR-001-3-layer-frontend-architecture\|ADR-001]] | 3-Layer Frontend Architecture | Accepted |
| [[06-ADRs/ADR-002-pageshell-design-system-adoption\|ADR-002]] | PageShell Design System Adoption | Accepted |
| [[06-ADRs/ADR-003-centralized-prompt-management\|ADR-003]] | Centralized Prompt Management | Accepted |

> [!info] Full Index
> See [[06-ADRs/ADR-Index]] for the complete ADR index with status legend and creation guide.

---

## Glossary

Domain and technical terms used across DentAI Pro — clinical (DSD, VITA, stratification), architecture (Data Client, Domain Hook, Page Adapter), and infrastructure (Edge Function, MetricsPort, PageShell).

→ [[08-Glossary/Terms]]

---

## Architecture Plans

| Document | Description | Status |
|----------|-------------|--------|
| [[plans/2026-02-04-frontend-architecture-design]] | 3-layer frontend architecture (Data Client → Domain Hooks → Page Adapters) | In Progress |
| [[plans/2026-02-04-prompt-management-design]] | Centralized prompt management module for Edge Functions | Planned |
| [[plans/2026-02-04-prompt-management-plan]] | Implementation tasks for prompt management (8 steps) | Planned |

---

## Operations

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Language** | TypeScript (strict mode) |
| **Frontend** | React 18.3 + Vite 5.4 |
| **Styling** | Tailwind CSS 3.4 + shadcn/ui |
| **State** | React Query 5.83 + React Hook Form 7.61 |
| **Validation** | Zod 3.25 |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions) |
| **AI** | Google Gemini APIs |
| **Billing** | Stripe |
| **Monorepo** | Turborepo 2.5 + pnpm 9.15 |
| **Testing** | Vitest 3.2 |
| **Deploy** | Vercel (frontend) + Supabase (backend) |

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development |
| `pnpm build` | Production build |
| `pnpm test` | Run tests |
| `pnpm lint` | Lint check |
| `pnpm type-check` | TypeScript validation |
| `pnpm clean` | Clean build artifacts |

### Deploy

- **Frontend:** Vercel (auto-deploy from `main`)
- **Edge Functions:** `supabase functions deploy`
- **Database:** Supabase migrations (`supabase/migrations/`)

### CI/CD

- GitHub Actions: `.github/workflows/test.yml` (runs on push/PR)
- Vercel: automatic preview deploys on PRs

---

## Agent Instructions

This project uses structured agent instructions for AI assistants:

| File | Scope |
|------|-------|
| [[CLAUDE.md]] | Entry point — read first |
| [[AGENTS.md]] | Global agent hierarchy & rules |
| [[apps/web/AGENTS.md]] | Web app specific instructions |
| [[packages/AGENTS.md]] | Packages index |

> [!warning] Conventions
> - **Package manager:** pnpm only (never npm/yarn)
> - **Commits:** Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`)
> - **TypeScript:** Strict mode everywhere
> - **Styling:** Tailwind + shadcn/ui only

---

## Quick Reference

### Prerequisites

- Node.js 18+
- pnpm 9+
- Supabase account
- Google AI API key (for Edge Functions)

### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Useful Links

- [[README|Project README]]
- [[AGENTS.md|Agent Instructions]]
- [GitHub Repository](https://github.com/org/dentai-pro)

---

*Updated: 2026-02-04*
