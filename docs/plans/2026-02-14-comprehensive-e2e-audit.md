---
title: "Auditoria E2E Completa — AURIA Platform"
created: 2026-02-14
updated: 2026-02-14
status: draft
author: Team Lead (consolidado de 8 agentes especialistas)
tags:
  - type/audit
  - type/index
  - area/executive
  - status/draft
related:
  - "[[2026-02-10-executive-audit-report]]"
  - "[[2026-02-08-comprehensive-audit-design]]"
---

# Auditoria E2E Completa — AURIA Platform

> **Data**: 2026-02-14
> **Metodo**: 8 agentes especialistas analisando a plataforma completa em paralelo
> **Escopo**: Security, AI Pipeline, Frontend Architecture, Code Quality, Test Coverage, UX/Accessibility, Performance, Design System
> **Contexto**: Primeira auditoria completa pós-migração Claude AI e DSD improvements

---

## Score Geral da Plataforma

| Area | Agente | Nota | Feb-10 | Trend |
|------|--------|------|--------|-------|
| Security | Security Auditor | **B-** | N/A (parcial) | NEW |
| AI Pipeline | AI Pipeline Analyst | **B+** | N/A | NEW |
| Frontend Architecture | Frontend Architect | **A- (85/100)** | B+ | +1 |
| Code Quality | Code Quality Engineer | **A-** | B+ | +1 |
| Test Coverage | Test Coverage Auditor | **B-** | C+ | +1 |
| UX & Accessibility | UX/Accessibility Analyst | **A-** | B+ | +1 |
| Performance | Performance Analyst | **B+** | N/A | NEW |
| Design System | Design System Compliance | **A- (90/100)** | B+ | +1 |

**Score Composto: B+ (fundação sólida, gaps concentrados em segurança e testes)**

Evolução desde Feb-10: **5 áreas melhoraram**, 0 regrediram, 3 novas áreas auditadas.

---

## Top 15 Cross-Cutting Findings

### CRITICAL (P0) — Corrigir Antes de Escalar

| # | Finding | Agentes | Impacto | Esforço |
|---|---------|---------|---------|---------|
| 1 | **Créditos cobrados ANTES do AI call** — usuario paga mesmo se AI falha instantaneamente. `checkAndUseCredits()` chamado antes da invocação AI em todas as 4 funções. Refund existe no catch, mas pode falhar silenciosamente. | AI Pipeline, Security | Perda de receita, destruição de confiança | 2h |
| 2 | **Usuários deletados/banidos retêm acesso** — `getUser()` não valida `deleted_at`, `banned_at`, `email_confirmed_at`. Contas deletadas mantêm JWT válido até expirar (24h). | Security | Violação LGPD, acesso não autorizado | 2h |
| 3 | **Refund de créditos incompleto em alguns error paths** — Créditos reembolsados em erros de AI, mas NÃO em parse errors ou DB failures. Pattern inconsistente entre funções. | Security, AI Pipeline | Cobrança indevida | 4h |
| 4 | **pageSize: 1000 sem virtualização** — `useEvaluationSessions` e `usePatientList` carregam todos os registros de uma vez. App congela com >1000 itens. `@tanstack/react-virtual` instalado mas não usado. | Performance | App freeze, UX mobile terrível | 3h |

### HIGH (P1) — Corrigir no Próximo Sprint

| # | Finding | Agentes | Impacto | Esforço |
|---|---------|---------|---------|---------|
| 5 | **analyze-dental-photo timeout 55s/60s** — Claude Sonnet ~45-50s com imagens, apenas 5s de buffer para o limite de 60s da edge function. | AI Pipeline | FunctionsFetchError silenciosa, créditos perdidos | 1h |
| 6 | **Edge functions 0% test coverage** — Nenhum teste para analyze-dental-photo, recommend-resin, recommend-cementation, generate-dsd. Core value delivery sem testes. | Test Coverage | Regressões no core do produto | 2-3 dias |
| 7 | **Protocol components 0% test coverage** — 12 componentes de exibição de protocolo (ProtocolTable, CementationCard, StratificationCard) completamente sem testes. Output primário pro usuário. | Test Coverage | Regressões visuais no output principal | 1-2 dias |
| 8 | **5 strings hardcoded em PT-BR** — Treatment types em ToothSelectionCard, AddTeethModal, e PatientProfile bypassing i18n. Bloqueia internacionalização. | UX/Accessibility | Bloqueia multi-idioma | 30min |
| 9 | **CORS com 7 domínios legados** — Inclui tosmile-ai.vercel.app, tosmile.ai, dentai.pro, dentai-pro.vercel.app. Cada domínio = superfície de ataque para phishing. | Security | Risco de phishing via domínio legado | 1h |
| 10 | **4 violações de camada ADR-001** — SharedEvaluation.tsx e Pricing.tsx importam Supabase diretamente. ForgotPassword/ResetPassword fazem auth calls diretos. | Frontend Architect | Quebra abstração de backend | 4h |

### MEDIUM (P2) — Planejar para Próximo Quarter

| # | Finding | Agentes | Impacto | Esforço |
|---|---------|---------|---------|---------|
| 11 | **useDSDStep.ts 920 linhas** — 23 useState, 10+ useEffect. Lógica movida do componente para hook, mas hook cresceu demais. | Code Quality | Manutenibilidade | L |
| 12 | **generatePDF.ts 731 linhas** — Função procedural única. Impossível testar seções individuais. | Code Quality | Testabilidade | M |
| 13 | **Clickable divs sem keyboard handlers** — ToothSelectionCard usa `<div onClick>` em vez de `<button>`. Não acessível via teclado. | UX/Accessibility | WCAG 2.1 Level A | 1h |
| 14 | **Auth layout duplicado 120+ linhas** — 4 auth pages (Login, Register, ForgotPassword, ResetPassword) com brand panel idêntico copy-pasted. | Design System | DRY, manutenção de branding | M |
| 15 | **Sem WebP image format** — OptimizedImage usa apenas JPEG. WebP é ~30% menor. Supabase Storage já suporta transforms WebP. | Performance | Bandwidth em mobile | M |

---

## O Que Melhorou Desde Feb-10

Todas as melhorias confirmadas pelos agentes com evidência no código:

| Area | Melhoria | Evidência |
|------|----------|-----------|
| **Architecture** | Wizard decomposição: 1,355 → 467 linhas | `useWizardFlow.ts` + 6 sub-hooks |
| **Architecture** | DSDStep: 1,334 → 107 linhas | Lógica extraída para `useDSDStep.ts` |
| **Security** | Rate limiter race condition CORRIGIDO | Migration 022: atomic `INSERT ON CONFLICT DO UPDATE` |
| **Security** | sanitizeForPrompt com 573 linhas de testes | 60+ test cases, cobertura excelente |
| **i18n** | 0% → 98% cobertura (1,339 keys) | `pt-BR.json` com namespacing completo |
| **LGPD** | Data export + delete account implementados | Edge functions com rate limiting e confirmação |
| **Testing** | C+ → B- (data layer 50%, hooks 36%) | 56 test files, 603 testes passando |
| **Branding** | text-primary → text-gradient-gold consistente | Todas as auth pages alinhadas |
| **AI** | Migração para Claude completa | Sonnet para análise, Haiku para protocolos |
| **AI** | Prompt management centralizado | Registry, versioning, metrics, clinical rules |
| **AI** | Zod validation para AI responses | `parseAIResponse` em 99% dos paths |

---

## Pontos Fortes da Plataforma

Identificados independentemente por múltiplos agentes:

1. **Arquitetura 3-camadas** — 95% compliance ADR-001 (data → hooks → pages)
2. **TypeScript strict** — Zero `@ts-ignore`, zero `@ts-expect-error`
3. **React Query** — Stale time strategy multi-nível, query key factories
4. **Prompt injection defense** — 573 linhas de testes, sanitização robusta
5. **Credit system** — Atomic operations com `SELECT FOR UPDATE`, operationId idempotent
6. **PageShell adoption** — 73% das páginas elegíveis, composites bem utilizados
7. **Icon consistency** — 100% Lucide, zero mixed libraries
8. **Theme token compliance** — Zero cores hardcoded na UI
9. **Lazy loading** — 12/20 rotas lazy, chunk splitting manual otimizado
10. **Web Vitals monitoring** — LCP, INP, CLS, FCP, TTFB com Sentry

---

## Plano de Ação Priorizado

### Sprint 1: Security & Credits (P0) — ~2 dias

| Task | Files | Esforço | Agente(s) |
|------|-------|---------|-----------|
| Mover credit deduction para DEPOIS do AI call com sucesso | 4 edge functions | 2h | AI Pipeline |
| Adicionar validação de auth state (deleted_at, banned_at, email_confirmed_at) em middleware | `_shared/middleware.ts` | 2h | Security |
| Auditar e corrigir TODOS os error paths de refund de créditos | 4 edge functions | 4h | Security, AI Pipeline |
| Reduzir timeout de analyze-dental-photo para 50s | `claude.ts`, `analyze-dental-photo/index.ts` | 30min | AI Pipeline |
| Adicionar Zod validation no fallback path de generate-dsd | `generate-dsd/index.ts:896-905` | 30min | AI Pipeline |

### Sprint 2: Performance & UX Quick Wins (P1) — ~2 dias

| Task | Files | Esforço | Agente(s) |
|------|-------|---------|-----------|
| Implementar virtual scrolling em Evaluations e Patients | `useEvaluationSessions.ts`, `usePatientList.ts`, `Evaluations.tsx`, `Patients.tsx` | 3h | Performance |
| Corrigir 5 strings hardcoded i18n | `ToothSelectionCard.tsx`, `AddTeethModal.tsx`, `PatientProfile.tsx` | 30min | UX |
| Remover domínios legados do CORS (após verificar DNS) | `_shared/cors.ts` | 1h | Security |
| Corrigir 4 violações de camada ADR-001 | `SharedEvaluation.tsx`, `Pricing.tsx` | 4h | Frontend |
| Converter clickable divs para buttons no ToothSelectionCard | `ToothSelectionCard.tsx:89-97` | 1h | UX |

### Sprint 3: Test Coverage (P1) — ~5 dias

| Task | Files | Esforço | Agente(s) |
|------|-------|---------|-----------|
| Setup Deno test runner para edge functions | `supabase/functions/` | 4h | Test Coverage |
| Testes para 4 AI edge functions com fixtures | 4 function dirs | 2 dias | Test Coverage |
| Testes para 12 protocol display components | `components/protocol/` | 1-2 dias | Test Coverage |
| Testes para data layer gaps (credit-usage, payments, referral) | `data/` | 1 dia | Test Coverage |
| Aumentar coverage thresholds (statements: 18→35, functions: 42→55) | `vitest.config.ts` | 15min | Test Coverage |

### Sprint 4: Code Quality & Polish (P2) — ~3 dias

| Task | Files | Esforço | Agente(s) |
|------|-------|---------|-----------|
| Extrair AuthLayout component | 4 auth pages | 3h | Design System |
| Decompor generatePDF.ts em section generators | `lib/generatePDF.ts` | 4h | Code Quality |
| Extrair edge function middleware wrapper (DRY auth/credits/CORS) | `_shared/middleware.ts`, 8 functions | 6h | Code Quality |
| Adicionar bundle analyzer (rollup-plugin-visualizer) | `vite.config.ts` | 30min | Performance |
| Mover computeInsights para dentro do queryFn | `useDashboard.ts` | 15min | Performance |
| Adicionar WebP support em OptimizedImage | `OptimizedImage.tsx`, `imageUtils.ts` | 3h | Performance |
| Migrar EvaluationDetails para DetailPage composite | `EvaluationDetails.tsx` | 4h | Design System |

---

## Estimativa Total

| Sprint | Foco | Duração | Items |
|--------|------|---------|-------|
| Sprint 1 | Security & Credits (P0) | 2 dias | 5 tasks |
| Sprint 2 | Performance & UX (P1) | 2 dias | 5 tasks |
| Sprint 3 | Test Coverage (P1) | 5 dias | 5 tasks |
| Sprint 4 | Code Quality & Polish (P2) | 3 dias | 7 tasks |
| **Total** | | **~12 dias** | **22 tasks** |

---

## Métricas de Saúde Pós-Plano

| Métrica | Atual | Meta Pós-Sprints |
|---------|-------|-------------------|
| Security Grade | B- | A- |
| Test Coverage (statements) | 18% | 35%+ |
| Test Coverage (functions) | 42% | 55%+ |
| i18n Coverage | 98% | 100% |
| ADR-001 Compliance | 81% (4 violations) | 100% (0 violations) |
| PageShell Adoption (eligible) | 73% | 82% (+EvaluationDetails) |
| Edge Function Test Coverage | 0% | 80% |
| Protocol Component Tests | 0% | 60% |
| P0 Open Issues | 4 | 0 |
| Virtual Scrolling | Not implemented | All list pages |

---

## Relatórios Detalhados por Agente

Cada agente produziu um relatório completo com findings, evidência, e line references:

1. **Security Auditor** — Auth, CORS, rate limiting, LGPD, prompt injection, secrets
2. **AI Pipeline Analyst** — Claude/Gemini integration, prompts, schemas, credits, timeouts
3. **Frontend Architect** — ADR-001/008 compliance, routing, state management, wizard
4. **Code Quality Engineer** — TypeScript, dead code, complexity, duplication, error handling
5. **Test Coverage Auditor** — Coverage per layer, test quality, CI integration
6. **UX/Accessibility Analyst** — i18n, WCAG 2.1, keyboard nav, mobile, error states
7. **Performance Analyst** — Bundle, lazy loading, React perf, data fetching, images
8. **Design System Compliance** — PageShell adoption, shadcn, theme tokens, visual consistency

---
*Auditoria completa: 2026-02-14*
*8 agentes | ~180 arquivos analisados | ~15,000 linhas de código revisadas*
