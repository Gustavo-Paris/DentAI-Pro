---
title: AURIA - Documentation Hub
created: 2026-02-04
updated: 2026-02-08
author: Team AURIA
status: published
tags:
  - type/index
  - status/published
---

# AURIA Documentation

Sistema de apoio à decisão clínica odontológica com Inteligência Artificial.

> [!info] Codebase Snapshot (2026-02-08)
> **222,904 linhas** em **2,103 arquivos** | TypeScript + TSX = 85% do codebase
> Monorepo Turborepo + pnpm com 11 pacotes PageShell + 8 Edge Functions

## Quick Start

1. [[README|Instalar o projeto]]
2. [[apps/web/README|Configurar o app web]]
3. [[02-Architecture/Overview|Entender a arquitetura]]
4. [[plans/2026-02-08-comprehensive-audit-design|Ver auditoria completa]]

## Sections

| Section | Description |
|---------|-------------|
| [[#Architecture]] | System design, layers, data flow |
| [[#Codebase Statistics]] | Lines of code, file counts by language |
| [[#Apps]] | Application documentation |
| [[#Packages]] | PageShell design system & shared packages |
| [[#Edge Functions]] | Supabase Edge Functions (AI, Billing) |
| [[#Architecture Decision Records (ADRs)]] | Formal architecture decisions |
| [[#Glossary]] | Domain & technical term definitions |
| [[#Architecture Plans]] | Design documents & implementation plans |
| [[#Operations]] | Build, deploy, CI/CD |
| [[#Audit & Health]] | Comprehensive audit results |

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

**3-Layer Frontend Pattern** ([[06-ADRs/ADR-001-3-layer-frontend-architecture|ADR-001]]):

| Layer | Responsibility | Location | Files |
|-------|---------------|----------|-------|
| **Data Client** | Typed Supabase wrappers, no business logic | `apps/web/src/data/` | 10 modules |
| **Domain Hooks** | React Query + business rules | `apps/web/src/hooks/domain/` | 10 hooks |
| **Page Adapters** | Map domain data → PageShell composites | `apps/web/src/pages/` | 16 pages |

> [!info] Architecture Details
> See [[02-Architecture/Overview|Architecture Overview]] and [[plans/2026-02-04-frontend-architecture-design|Frontend Architecture Design]] for the full specification.

---

## Codebase Statistics

| Language | Files | Lines | % |
|----------|------:|------:|--:|
| TypeScript (`.ts`) | 1,223 | 103,591 | 46% |
| TSX (`.tsx`) | 537 | 86,302 | 39% |
| CSS | 21 | 10,834 | 5% |
| Markdown | 71 | 8,996 | 4% |
| SQL | 14 | 2,005 | 1% |
| JSON | 221 | 2,033 | 1% |
| Outros | 16 | 9,143 | 4% |
| **Total** | **2,103** | **222,904** | **100%** |

> [!tip] Detalhamento Completo
> Ver [[02-Architecture/Tech-Stack|Tech Stack]] para dependências detalhadas.

---

## Apps

### @auria/web

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
- **Quick Case** — Simplified 1-credit analysis for fast assessments
- **Complexity Score** — Automated case difficulty rating
- **Patient Management** — Full CRUD with evaluation tracking
- **Billing** — Stripe subscription integration (Elite R$249/mês)

**Frontend Stats:** ~104 component files, 16 route pages, 10 domain hooks, 10 data clients

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
| `SettingsPage` | Settings and configuration pages |

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

**Shared utilities:** `supabase/functions/_shared/` — CORS, auth, rate limiting, metrics, prompt templates (7 subdirectories)

> [!info] Prompt Management
> Centralized prompt management module with 5 AI prompts across 4 Edge Functions. See [[06-ADRs/ADR-003-centralized-prompt-management|ADR-003]] and [[plans/2026-02-04-prompt-management-design|Prompt Management Design]].

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
| [[plans/2026-02-04-frontend-architecture-design]] | 3-layer frontend architecture (Data Client → Domain Hooks → Page Adapters) | Implemented |
| [[plans/2026-02-04-prompt-management-design]] | Centralized prompt management module for Edge Functions | Implemented |
| [[plans/2026-02-04-prompt-management-plan]] | Implementation tasks for prompt management (8 steps) | Implemented |
| [[plans/2026-02-04-qa-specialist-fixes-design]] | Dental QA specialist corrections | Completed |
| [[plans/2026-02-05-dental-qa-specialist-design]] | Dental QA validation system | Completed |
| [[plans/2026-02-05-dental-ai-clinical-guardrails]] | Clinical AI guardrails and safety | Completed |
| [[plans/2026-02-08-comprehensive-audit-design]] | Full-system audit (4 agents + E2E) | Published |

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
| **Error Tracking** | Sentry |
| **Testing** | Vitest 3.2 + Testing Library |
| **Deploy** | Vercel (frontend) + Supabase (backend) |

> [!tip] Full Dependency Catalog
> See [[02-Architecture/Tech-Stack|Tech Stack]] for the complete dependency list across all workspaces.

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

## Audit & Health

> [!warning] Auditoria Completa (2026-02-08)
> Auditoria com 4 agentes de análise + teste funcional E2E via browser.

| Area | Grade | Key Finding |
|------|-------|-------------|
| Arquitetura Frontend | A- | 95% compliance com padrão 3-camadas |
| Qualidade de Código | B+ | Debt em componentes grandes (useWizardFlow 1626 LOC) |
| Backend/Edge Functions | B | Race condition no credit system |
| Seguranca | C+ | PHI exposto em shared links, JWT verify off |
| UX/Fluxo Funcional | A- | DSD edge function retorna 500 |
| i18n | D | Zero infraestrutura, ~1000 strings hardcoded |
| Acessibilidade | C+ | Parcial — falta focus indicators, aria-labels |

> [!info] Detalhes
> [[plans/2026-02-08-comprehensive-audit-design|Relatório completo da auditoria]] com 30 itens no roadmap prioritizado.

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

*Updated: 2026-02-08*
