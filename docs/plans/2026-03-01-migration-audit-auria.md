---
title: Migration Audit Report - AURIA (DentAI Pro)
created: 2026-03-01
updated: 2026-03-01
status: published
tags:
  - type/audit
  - status/published
---

# Migration Audit Report: AURIA (DentAI Pro)

**Date:** 2026-03-01
**Current Stack:** Turborepo + Vite/React SPA + Supabase (Auth + DB + Edge Functions) + Stripe + Gemini/Claude AI
**Target Stack:** Canonical SaaS (saas-bootstrap): Turborepo + Next.js 15 + tRPC + Drizzle + Auth.js + Stripe + FastAPI + PageShell

## Executive Summary

O projeto AURIA está **parcialmente alinhado** com a stack canônica. Monorepo (Turborepo+pnpm), UI (PageShell+Tailwind+shadcn), e billing (Stripe) já são MATCH ou COMPATIBLE. Porém, as camadas de **framework** (Vite SPA → Next.js App Router), **API** (Supabase Edge Functions → tRPC), **ORM** (Supabase JS → Drizzle), **Auth** (Supabase Auth → Auth.js), e **AI Service** (Deno Edge Functions → FastAPI Python) representam divergências significativas. Com **~54.5k LOC em produção, 46 migrations, e Stripe ativo**, a migração completa é um empreendimento de **alto risco e alto esforço**. Recomendo **migração parcial seletiva** focada nas camadas que trazem valor real, não uma reescrita completa.

---

## Stack Comparison

| Layer | Current | Target | Status | Risk | Effort |
|-------|---------|--------|--------|------|--------|
| **Monorepo** | Turborepo 2.5 + pnpm 9.15 | Turborepo + pnpm | **MATCH** | — | 0 dias |
| **Framework** | Vite 5 + React 18 (SPA) | Next.js 15 (App Router) | **DIVERGENT** | HIGH | 15-25 dias |
| **API** | Supabase Edge Functions (15 funções Deno) | tRPC v11 | **DIVERGENT** | HIGH | 10-15 dias |
| **ORM** | Supabase JS client + raw SQL migrations | Drizzle ORM | **DIVERGENT** | MEDIUM | 5-8 dias |
| **Database** | PostgreSQL (Supabase hosted) | PostgreSQL (Neon) | **COMPATIBLE** | MEDIUM | 2-4 dias |
| **Auth** | Supabase Auth (email, MFA/TOTP) | Auth.js v5 | **DIVERGENT** | HIGH | 5-8 dias |
| **Billing** | Stripe (subs + credits + webhooks) | Stripe (subs + metered) | **COMPATIBLE** | LOW | 1-2 dias |
| **AI Service** | Supabase Edge Functions (Deno) — Gemini, Claude, image gen | FastAPI (Python) | **DIVERGENT** | HIGH | 8-12 dias |
| **UI** | PageShell + Tailwind 3 + shadcn/Radix | PageShell + Tailwind + shadcn | **MATCH** | — | 0 dias |
| **Deploy** | Vercel (front) + Supabase (back) | Vercel + Railway | **COMPATIBLE** | MEDIUM | 2-3 dias |
| **CI/CD** | GitHub Actions (3 workflows: CI 8-shard, Deploy Edge, CodeQL) | GitHub Actions 7-stage | **COMPATIBLE** | LOW | 2-3 dias |

### Resumo de Status

| Status | Contagem | Camadas |
|--------|----------|---------|
| **MATCH** | 2 | Monorepo, UI |
| **COMPATIBLE** | 4 | Database, Billing, Deploy, CI/CD |
| **DIVERGENT** | 5 | Framework, API, ORM, Auth, AI Service |
| **CONFLICTING** | 0 | — |
| **MISSING** | 0 | — |

**Effort total estimado (migração completa): 50-80 dias de desenvolvimento**

---

## Critical Risks

### 1. Framework Migration: Vite SPA → Next.js App Router (RISK: 20/25)

**Impact: 5 | Probability: 4**

- **O que pode dar errado:**
  - 22 páginas com `react-router-dom` v6 precisam ser reescritas para App Router (`app/` directory)
  - `BrowserRouter` + `Routes` + `ProtectedRoute` pattern não existe no Next.js — precisa virar middleware + layout groups
  - `lazyRetry` custom lazy loading é incompatível — Next.js tem seu próprio code splitting
  - `QueryClientProvider` + `React Query` precisa ser adaptado para Server Components vs Client Components
  - `Suspense` boundaries e error boundaries manuais precisam ser migrados para `loading.tsx` / `error.tsx`
  - SPA-specific patterns: `useLocation`, `useNavigate`, `Navigate` — todos precisam ser substituídos
  - PWA (vite-plugin-pwa + workbox) precisa ser reimplementada
  - `AuthProvider` context (Supabase) wrapping tudo é incompatível com Server Components

- **Mitigação:**
  - Migração incremental page-by-page usando Next.js rewrites
  - Manter app Vite existente rodando em paralelo durante migração

- **Rollback:**
  - Manter branch Vite ativo, deploy pode reverter a qualquer momento

### 2. Auth Migration: Supabase Auth → Auth.js v5 (RISK: 20/25)

**Impact: 5 | Probability: 4**

- **O que pode dar errado:**
  - **Sessões de todos os usuários seriam invalidadas** — logout forçado em produção
  - Supabase Auth com MFA/TOTP ativo (config.toml confirma `enroll_enabled = true`) — Auth.js não tem suporte built-in equivalente
  - RLS policies no PostgreSQL dependem de `auth.uid()` (Supabase JWT) — Drizzle + Auth.js não geram JWTs compatíveis
  - 46 migrations usam `auth.users(id)` como FK — precisam de schema de auth diferente
  - Edge functions autenticam via `supabase.auth.getUser(token)` — 15 funções afetadas
  - Fluxos existentes: email confirm, password reset, redirect URLs — todos Supabase-specific

- **Mitigação:**
  - Se migrar auth, fazer migration window com notificação prévia aos usuários
  - Backup completo da tabela `auth.users` antes da migração
  - Script de migração user-by-user com dry-run

- **Rollback:**
  - Manter Supabase Auth funcional em paralelo por 30 dias

### 3. AI Service Migration: Deno Edge Functions → FastAPI Python (RISK: 16/25)

**Impact: 4 | Probability: 4**

- **O que pode dar errado:**
  - 15 edge functions com ~23k LOC de lógica de domínio dental (prompts, post-processing, validação clínica)
  - Prompts calibrados por semanas de QA dental (shade validation, diastema detection, gengivo, etc.)
  - Tool-calling patterns (Claude `callClaudeWithTools`, Gemini `callGeminiImageEdit`) precisam ser reimplementados em Python
  - Circuit breaker, rate limiting, credit management — tudo implementado em Deno/Supabase
  - Gemini SDK (Google AI) e Anthropic SDK têm APIs Python diferentes das Deno/npm
  - 172 arquivos de teste precisam ser reescritos em Python (pytest)

- **Mitigação:**
  - Manter prompts como arquivos de texto puro, importados por ambos os runtimes
  - Migrar uma função por vez, com A/B testing

- **Rollback:**
  - Edge functions continuam deployadas, toggle via env var

---

## Data Migration Assessment

### Database (PostgreSQL → PostgreSQL)

| Aspecto | Risco | Detalhe |
|---------|-------|---------|
| Schema | LOW | Mesmo RDBMS, migrations podem ser reusadas |
| RLS Policies | HIGH | 25+ policies usam `auth.uid()` — incompatível com Auth.js |
| Stored Functions | MEDIUM | 10+ functions (`can_create_case`, `reset_monthly_usage`, etc.) usam `auth.uid()` |
| Data Volume | LOW | Provavelmente <100k rows (SaaS dental recente) |
| FK to auth.users | HIGH | `profiles`, `evaluations`, `subscriptions`, `patients` — todas referenciam `auth.users(id)` |

### Auth Migration

| Aspecto | Risco | Detalhe |
|---------|-------|---------|
| User sessions | CRITICAL | Todos invalidados na migração |
| MFA/TOTP | HIGH | Sem equivalente direto em Auth.js — precisa ser implementado custom |
| Email verification | MEDIUM | Auth.js suporta, mas fluxo diferente |
| Password hashes | HIGH | Supabase usa bcrypt — precisa verificar compatibilidade |

### Billing Migration (Stripe)

| Aspecto | Risco | Detalhe |
|---------|-------|---------|
| Subscriptions ativas | LOW | Stripe continua igual, só mudam os webhooks |
| Credit system | LOW | Credit management é app-level, não Stripe-specific |
| Webhook endpoints | MEDIUM | URLs precisam apontar para novo backend |

---

## Assets That Transfer Directly

Estes componentes podem ser **reutilizados como estão**:

| Asset | LOC Aprox. | Notas |
|-------|-----------|-------|
| PageShell composites (ListPage, DetailPage, etc.) | external pkg | Já é o target |
| Tailwind config + design tokens | ~200 | Tokens alinhados com PageShell |
| i18n keys (pt-BR + en-US) | ~2000 | JSON transferível |
| Zod schemas (validação) | ~500 | Funciona em qualquer runtime |
| AI prompts (text content) | ~5000 | Prompt text é runtime-agnostic |
| SQL migrations (schema) | 46 files | PostgreSQL → PostgreSQL |
| Stripe product/price config | — | Stripe Dashboard, não muda |
| Domain types (`@parisgroup-ai/domain-odonto-ai`) | external pkg | TypeScript types, transferível |
| React components (UI layer) | ~15k | PageShell + shadcn, reusável (precisa adaptar imports) |
| PDF generation (jspdf) | ~500 | Client-side, transferível |
| Recharts dashboards | ~800 | Client-side, transferível |

**Total reutilizável: ~24k LOC (~44% do total)**

## Assets That Need Rewriting

| Asset | LOC Aprox. | Razão |
|-------|-----------|-------|
| 15 Supabase Edge Functions | ~23k | Deno → Python (FastAPI) |
| Routing (react-router-dom) | ~500 | → Next.js App Router |
| Auth context + hooks | ~800 | Supabase Auth → Auth.js |
| Data layer (Supabase JS calls) | ~3000 | → Drizzle ORM queries |
| `useAuthenticatedFetch` hook | ~200 | → tRPC client |
| `AuthProvider` context | ~300 | → Auth.js `SessionProvider` |
| E2E tests (Playwright) | ~500 | URLs/routes mudam |
| Edge function tests (Deno) | ~5000 | → pytest |
| CI/CD workflows | ~300 | Adaptação (não rewrite total) |

**Total a reescrever: ~33.6k LOC (~62% do total)**

---

## Migration Plan (IF full migration chosen)

### Strategy: Strangler Fig (Recommended)

Com >54k LOC em produção, usuários ativos, e Stripe com subscriptions ativas, recomendo **Strangler Fig**: novas features na nova stack, features existentes migradas gradualmente.

### Phase Schedule

| Phase | What | Depends On | Effort | Risk |
|-------|------|-----------|--------|------|
| 1 | Monorepo restructure (add `apps/api`) | — | 1-2 dias | LOW |
| 2 | Database: add Drizzle schemas mirroring Supabase | Phase 1 | 5-8 dias | MEDIUM |
| 3 | Auth: Auth.js v5 setup + user migration | Phase 2 | 5-8 dias | HIGH |
| 4 | API: tRPC router + migrate edge functions 1-by-1 | Phase 2 | 10-15 dias | HIGH |
| 5 | Billing: rewire Stripe webhooks to new backend | Phase 3+4 | 1-2 dias | LOW |
| 6 | Framework: Next.js App Router, migrate pages | Phase 3+4+5 | 15-25 dias | HIGH |
| 7 | AI: FastAPI service for Gemini/Claude calls | Phase 4 | 8-12 dias | HIGH |
| 8 | CI/CD: update workflows for new stack | Phase 7 | 2-3 dias | LOW |

**Total: 47-75 dias** (single developer, sequential)

---

## Recommendation: **MIGRAR PARCIALMENTE**

### Análise Custo-Benefício

| Migração | Benefício Real | Custo | Veredicto |
|----------|---------------|-------|-----------|
| Monorepo (Turbo+pnpm) | — | 0 | **JÁ MATCH** |
| UI (PageShell) | — | 0 | **JÁ MATCH** |
| Framework (Vite → Next.js) | SSR, SEO, Server Components | 15-25d | **CONSIDERAR** se SEO for necessário |
| API (Edge → tRPC) | Type-safety E2E, DX | 10-15d | **CONSIDERAR** se crescer equipe |
| ORM (Supabase JS → Drizzle) | Type-safe queries, migrations | 5-8d | **RECOMENDADO** (valor alto, risco médio) |
| Auth (Supabase → Auth.js) | Flexibilidade de providers | 5-8d | **NÃO RECOMENDADO** (alto risco, baixo benefício) |
| Billing (Stripe) | — | 1-2d | **JÁ COMPATIBLE** |
| AI (Deno → FastAPI) | Python ML ecosystem | 8-12d | **NÃO RECOMENDADO** (23k LOC de domínio calibrado) |
| Deploy (Vercel+Supabase) | — | 2-3d | **JÁ COMPATIBLE** |
| CI/CD | — | 2-3d | **JÁ COMPATIBLE** |

### Recomendação Final

**"Migração significativa com benefício questionável."**

O AURIA tem uma stack funcional e coesa. As divergências principais (framework, auth, AI) representam **alto risco com baixo ROI** dado que:

1. **Supabase Auth funciona bem** — tem MFA, RLS, é mantido, e migrar invalidaria todas as sessões
2. **Edge Functions Deno são estáveis** — 23k LOC calibrados com testes, prompts QA'd, circuit breakers
3. **Vite SPA atende** — app é 100% authenticated (não precisa de SSR/SEO para o core)

#### O que EU faria (pragmático):

1. **Manter** Supabase Auth, Edge Functions, e deploy atual
2. **Avaliar** Next.js apenas se SEO da landing page se tornar crítico (pode ser resolvido com hybrid: Next.js landing + Vite app)
3. **Considerar** Drizzle ORM para novas tabelas/queries (coexistência com Supabase JS)
4. **Investir** em melhorias na stack atual: E2E tests, Codecov, CSP nonce, LGPD export (itens do audit anterior)

#### Se migração for mandatória (e.g., consolidação de stack em equipe maior):

- Usar **Strangler Fig**
- Começar por **Drizzle ORM** (menor risco, maior aprendizado)
- **Auth por último** (maior risco, precisa de migration window)
- **AI service**: manter em Deno, expor via API Gateway — NÃO reescrever 23k LOC em Python

---

## Environment Variables Mapping

| Current (Supabase/Vite) | Target (Next.js/Neon) | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | `DATABASE_URL` (Neon) + `NEXT_PUBLIC_SUPABASE_URL` | Split: DB vs Auth |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` ou removido | Depende de auth migration |
| `STRIPE_SECRET_KEY` | `STRIPE_SECRET_KEY` | Idêntico |
| `STRIPE_WEBHOOK_SECRET` | `STRIPE_WEBHOOK_SECRET` | Idêntico (nova URL) |
| `GOOGLE_AI_API_KEY` | `GOOGLE_AI_API_KEY` | Idêntico |
| `VITE_SENTRY_DSN` | `NEXT_PUBLIC_SENTRY_DSN` | Rename |
| `VITE_POSTHOG_KEY` | `NEXT_PUBLIC_POSTHOG_KEY` | Rename |
| `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_ROLE_KEY` | Se manter auth |
| `ANTHROPIC_API_KEY` | `ANTHROPIC_API_KEY` | Idêntico |

---

*Este relatório é somente diagnóstico. Nenhuma alteração de código foi feita.*
