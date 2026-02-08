---
title: Codebase Health Report
created: 2026-02-08
updated: 2026-02-08
author: Team AURIA
status: published
tags:
  - type/guide
  - status/published
related:
  - "[[docs/00-Index/Home]]"
  - "[[plans/2026-02-08-comprehensive-audit-design]]"
  - "[[02-Architecture/Overview]]"
  - "[[02-Architecture/Tech-Stack]]"
---

# Codebase Health Report

> **Data**: 2026-02-08
> **Metodo**: 3 agentes autonomos em paralelo (TODO scan, test coverage, dependency audit)
> **Escopo**: Todo o monorepo AURIA

---

## Resumo Executivo

| Dimensao | Nota | Detalhe |
|----------|------|---------|
| Higiene de codigo (TODO/FIXME) | A | Apenas 7 TODOs, zero FIXME/HACK |
| Cobertura de testes | D | 3.8% (42/1111 arquivos) |
| Saude de dependencias | C- | 33 desatualizadas, 9 vulnerabilidades (1 critical) |

---

## 1. TODO/FIXME no Codebase

**Total: 7 TODOs | 0 FIXME | 0 HACK | 0 XXX**

Codebase muito limpo. Todos os 7 TODOs estao em `packages/pageshell-domain/` e sao stubs de componentes ainda nao implementados:

| Arquivo | Linha | Comentario |
|---------|:-----:|-----------|
| `packages/pageshell-domain/src/mentorship/index.ts` | 4 | `TODO: Implement mentorship-related domain components.` |
| `packages/pageshell-domain/src/courses/index.ts` | 4 | `TODO: Implement course-related domain components.` |
| `packages/pageshell-domain/src/gamification/index.ts` | 4 | `TODO: Implement gamification-related domain components.` |
| `packages/pageshell-domain/src/dashboard/PageMCPSetupSkeleton.tsx` | 4 | `TODO: Implement MCP setup loading skeleton.` |
| `packages/pageshell-domain/src/dashboard/PageRecommendedCourses.tsx` | 4 | `TODO: Implement recommended courses dashboard widget.` |
| `packages/pageshell-domain/src/dashboard/PageStudentDashboardSkeleton.tsx` | 4 | `TODO: Implement student dashboard loading skeleton.` |
| `packages/pageshell-domain/src/primitives/PageLeaderboardRow.tsx` | 4 | `TODO: Implement leaderboard row component.` |

> [!info] Nenhum FIXME ou HACK
> Nao foram encontrados marcadores de divida tecnica urgente no codebase. Os TODOs sao todos de features planejadas no design system, nao de bugs ou workarounds.

---

## 2. Arquivos Sem Testes

**Cobertura geral: 3.8%** — 42 de 1,111 arquivos com testes correspondentes.

### Por Area

| Area | Arquivos | Com Testes | Cobertura | Risco |
|------|:--------:|:----------:|:---------:|:-----:|
| Data Clients (`src/data/`) | 10 | 0 | **0%** | CRITICAL |
| Domain Hooks (`src/hooks/domain/`) | 10 | 0 | **0%** | CRITICAL |
| Components (`src/components/`) | 100 | 5 | **5%** | CRITICAL |
| Pages (`src/pages/`) | 26 | 2 | **7.7%** | CRITICAL |
| Edge Functions (`supabase/functions/`) | 8 | 0 | **0%** | CRITICAL |
| PageShell Packages (`packages/`) | 909 | 20 | **2.2%** | CRITICAL |
| Lib/Utils (`src/lib/`) | 17 | 8 | **47%** | HIGH |
| Hooks non-domain (`src/hooks/`) | 8 | 4 | **50%** | OK |

### Arquivos com Testes (42 total)

**Lib/Utils (8):**
- `branding.ts`, `dateUtils.ts`, `env.ts`, `errorHandler.ts`, `logger.ts`, `utils.ts`, `vitaShadeColors.ts`, `webVitals.ts`

**Components (5):**
- `CookieConsent.tsx`, `ErrorBoundary.tsx`, `ProtectedRoute.tsx`, `ThemeProvider.tsx`, `ThemeToggle.tsx`

**Pages (2):**
- `NotFound.tsx`, `SharedEvaluation.tsx`

**Hooks non-domain (4):**
- `useAuthenticatedFetch.ts`, `useSignedUrl.ts`, `useSubscription.ts`, `useWizardDraft.ts`

**PageShell Core (15):**
- Formatters e hooks no `pageshell-core`

**PageShell Layouts (2) + Primitives (2) + Composites (1):**
- Cobertura minima no design system

### Gaps Mais Criticos

> [!danger] Zero testes em business logic
> - **10 domain hooks** (ADR-001 middle layer) — orquestram toda logica de negocio
> - **10 data clients** — toda comunicacao com backend
> - **8 edge functions** — AI analysis + pagamentos Stripe
> - `AuthContext.tsx` — seguranca e sessao do usuario

> [!warning] Componentes core sem testes
> - Wizard: `DSDStep.tsx` (1458 LOC), `ReviewAnalysisStep.tsx` (1123 LOC), `PhotoUploadStep.tsx`
> - Protocol: `ProtocolTable.tsx`, `VeneerPreparationCard.tsx`, `ConfidenceIndicator.tsx`
> - Pricing: `PricingCard.tsx`, `SubscriptionStatus.tsx`, `CreditUsageHistory.tsx`

### Prioridade de Testes Recomendada

**P0 — Adicionar imediatamente:**
1. Domain hooks (10 files) — logica de negocio complexa
2. Data clients (10 files) — camada fundacional
3. Edge functions (8 files) — AI + financeiro
4. `AuthContext.tsx` — seguranca

**P1 — Alto valor:**
1. Wizard components — fluxo de usuario mais complexo
2. Protocol + DSD components — precisao clinica critica
3. `complexity-score.ts`, `generatePDF.ts`, `imageUtils.ts`

**P2 — Menor prioridade:**
1. Pages — integration testing
2. UI components restantes
3. PageShell packages (design system)

---

## 3. Dependencias Desatualizadas

**33 pacotes desatualizados** | **9 vulnerabilidades de seguranca**

### Vulnerabilidades de Seguranca

| Severidade | Pacote | Instalado | Corrigido em | Tipo |
|:----------:|--------|-----------|:------------:|------|
| **CRITICAL** | `jspdf` | 2.5.2 | >=4.0.0 | Path Traversal / Local File Inclusion |
| HIGH | `jspdf` | 2.5.2 | >=3.0.1 | ReDoS |
| HIGH | `jspdf` | 2.5.2 | >=3.0.2 | DoS |
| HIGH | `jspdf` | 2.5.2 | >=4.1.0 | PDF Injection / Arbitrary JS Execution |
| HIGH | `jspdf` | 2.5.2 | >=4.1.0 | DoS via BMP Dimensions |
| MODERATE | `jspdf` | 2.5.2 | >=4.1.0 | XMP Metadata Injection |
| MODERATE | `jspdf` | 2.5.2 | >=4.1.0 | Shared State Race Condition |
| MODERATE | `dompurify` (via jspdf) | 2.5.8 | >=3.2.4 | XSS |
| MODERATE | `esbuild` (via vite 5.x) | 0.21.5 | >=0.25.0 | Server request smuggling |

> [!danger] jspdf e critico
> Atualizar `jspdf` para 4.1.0 resolve 7 de 9 vulnerabilidades. Este pacote gera PDFs de protocolos clinicos contendo dados PHI de pacientes.

### Top 5 Atualizacoes Prioritarias

| # | Pacote | Atual | Latest | Urgencia | Notas |
|:-:|--------|:-----:|:------:|:--------:|-------|
| 1 | **jspdf** | 2.5.2 | 4.1.0 | CRITICAL | 7 vulnerabilidades, path traversal + JS execution |
| 2 | **vite** + vitest + coverage | 5.4 / 3.2 | 7.3 / 4.0 | HIGH | Resolve vuln esbuild, atualizar juntos |
| 3 | **@supabase/supabase-js** | 2.94 | 2.95 | SAFE | Minor bump, sem breaking changes |
| 4 | **zod** + @hookform/resolvers | 3.25 / 3.10 | 4.3 / 5.2 | HIGH | Atualizar juntos (resolvers v5 suporta zod v4) |
| 5 | **React 18 → 19** | 18.3 | 19.2 | PLAN | Migracão dedicada, afeta 11+ packages |

### Todas as Dependencias Desatualizadas

#### Major Bumps (26 pacotes — breaking changes provaveis)

| Pacote | Atual | Latest | Workspace |
|--------|:-----:|:------:|-----------|
| react | 18.3.1 | 19.2.4 | web + 5 pageshell |
| react-dom | 18.3.1 | 19.2.4 | web + 3 pageshell |
| @types/react | 18.3.27 | 19.2.13 | web + 10 pageshell |
| @types/react-dom | 18.3.7 | 19.2.3 | web + 7 pageshell |
| @types/node | 22.19.8 | 25.2.2 | web + 3 pageshell |
| vite | 5.4.21 | 7.3.1 | web |
| @vitejs/plugin-react-swc | 3.11.0 | 4.2.3 | web |
| vitest | 3.2.4 | 4.0.18 | web |
| @vitest/coverage-v8 | 3.2.4 | 4.0.18 | web |
| eslint | 9.39.2 | 10.0.0 | web |
| @eslint/js | 9.39.2 | 10.0.1 | web |
| eslint-plugin-react-hooks | 5.2.0 | 7.0.1 | web |
| zod | 3.25.76 | 4.3.6 | web |
| jspdf | 2.5.2 | 4.1.0 | web |
| jsdom | 20.0.3 | 28.0.0 | web |
| jsdom | 25.0.1 | 28.0.0 | 3 pageshell |
| date-fns | 3.6.0 | 4.1.0 | web |
| recharts | 2.15.4 | 3.7.0 | web |
| react-router-dom | 6.30.3 | 7.13.0 | web |
| @hookform/resolvers | 3.10.0 | 5.2.2 | web |
| react-resizable-panels | 2.1.9 | 4.6.2 | web |
| sonner | 1.7.4 | 2.0.7 | web |
| globals | 15.15.0 | 17.3.0 | web |
| tailwindcss | 3.4.19 | 4.1.18 | web |
| tailwind-merge | 2.6.1 | 3.4.0 | web |
| react-day-picker | 8.10.1 | 9.13.1 | web |

#### Minor Bumps (3 pacotes — retrocompativeis)

| Pacote | Atual | Latest | Workspace |
|--------|:-----:|:------:|-----------|
| @supabase/supabase-js | 2.94.0 | 2.95.3 | web |
| lucide-react | 0.462.0 | 0.563.0 | web |
| next-themes | 0.3.0 | 0.4.6 | web |

#### Patch / Pre-1.0 (2 pacotes)

| Pacote | Atual | Latest | Workspace |
|--------|:-----:|:------:|-----------|
| eslint-plugin-react-refresh | 0.4.26 | 0.5.0 | web |
| vaul | 0.9.9 | 1.1.2 | web |

> [!warning] Nao apressar
> **Tailwind 3→4** e **React Router 6→7** sao reescritas arquiteturais completas. Planejar como migracoes dedicadas com ADR.

---

## 4. Cruzamento entre Agentes

| Insight | Agentes | Impacto |
|---------|:-------:|---------|
| jspdf critical + gera PDFs com dados PHI de pacientes | Agent 3 | Vulnerabilidade de seguranca em dados clinicos |
| Edge Functions sem testes E com dependencias vulneraveis | Agent 2 + 3 | Risco duplo: sem validacao + sem seguranca |
| PageShell domain tem 7 TODOs de stubs E 0% cobertura | Agent 1 + 2 | Stubs sem testes = dead code sem guardrails |
| Domain hooks (0% testes) orquestram todo o fluxo core | Agent 2 | Maior gap de qualidade do projeto |
| `useWizardFlow.ts` (1626 LOC) sem teste nenhum | Agent 2 | Hook mais complexo do projeto, zero cobertura |

---

## 5. Roadmap Recomendado

### Sprint Atual

1. Atualizar `jspdf` para 4.1.0 (resolve 7 vulnerabilidades)
2. Atualizar `@supabase/supabase-js` para 2.95.3 (safe minor)
3. Adicionar testes para domain hooks (10 files)
4. Adicionar testes para data clients (10 files)

### Proximo Sprint

5. Atualizar `vite` + `vitest` + `@vitest/coverage-v8` (resolve vuln esbuild)
6. Atualizar `zod` + `@hookform/resolvers` juntos
7. Adicionar testes para edge functions (8 files)
8. Adicionar testes para `AuthContext.tsx`

### Backlog

9. Migrar React 18 → 19 (ADR necessario)
10. Migrar Tailwind 3 → 4 (ADR necessario)
11. Migrar React Router 6 → 7 (ADR necessario)
12. Adicionar testes para wizard/protocol/DSD components
13. Implementar stubs TODO no pageshell-domain ou remover

---

## Links

- [[docs/00-Index/Home]] — Documentation Hub
- [[plans/2026-02-08-comprehensive-audit-design]] — Auditoria completa (4 agentes + E2E)
- [[02-Architecture/Overview]] — Visao geral da arquitetura
- [[02-Architecture/Tech-Stack]] — Catalogo de dependencias
- [[06-ADRs/ADR-Index]] — ADRs

---
*Gerado por 3 agentes autonomos em paralelo — TODO scan, test coverage analysis, dependency audit*
