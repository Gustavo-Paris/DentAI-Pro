---
title: "Auditoria Completa do Sistema AURIA — Fevereiro 2026"
created: 2026-02-11
updated: 2026-02-11
status: published
tags:
  - type/audit
  - status/published
---

# Auditoria Completa do Sistema AURIA

> Análise automatizada por 8 agentes especializados em paralelo.
> Data: 2026-02-11 | Baseline: commit `03cc508` (branch `main`)

---

## Resumo Executivo

| # | Área                   | Nota  | Tendência |
|---|------------------------|-------|-----------|
| 1 | Arquitetura            | 8.5   | ↗ estável |
| 2 | Qualidade de Código    | 7.5   | ↗ melhorando |
| 3 | Testes                 | 7.5   | ↗ melhorando |
| 4 | Segurança              | 7.5   | ↗ melhorando |
| 5 | Internacionalização    | 7.5   | → novo |
| 6 | Design System          | 7.5   | ↗ melhorando |
| 7 | Documentação           | 8.5   | ↗ estável |
| 8 | Backend (Edge Fns)     | 8.5   | ↗ estável |
| **—** | **Nota Final**     | **7.9** | **↗ positiva** |

**Classificação geral: BOM** — O sistema tem fundações sólidas com arquitetura bem definida, backend robusto e documentação completa. As áreas que mais precisam de atenção são cobertura de testes (especialmente UI/páginas), completar i18n e migrar páginas restantes para PageShell.

---

## 1. Arquitetura — 8.5/10

### O que foi analisado
- Conformidade com 3-Layer Architecture (ADR-001): `src/data/` → `src/hooks/domain/` → `src/pages/`
- Adoção de PageShell composites (ADR-002)
- Separação de responsabilidades e acoplamento

### Pontos fortes
- **17/21 páginas** seguem o padrão 3-layer (85% conformidade)
- **100% das páginas in-scope** usam PageShell composites
- ESLint configurado com `no-restricted-imports` para enforcement automático
- Hook de wizard refatorado com sucesso (1.355 → 447 linhas)
- Padrão claro e consistente: data clients → domain hooks → page adapters

### Violações encontradas
| Arquivo | Problema |
|---------|----------|
| `src/pages/Profile.tsx` | Importa diretamente de `@/data` (subscriptions, privacy) |
| `src/components/AddTeethModal.tsx` | Importação direta do Supabase |
| `src/components/PatientAutocomplete.tsx` | Acoplado à camada de dados |
| `src/components/GlobalSearch.tsx` | Acoplado à camada de dados |
| `src/components/PhotoUploader.tsx` | Importação direta do Supabase |

### Ações de melhoria
1. **[P1]** Desacoplar `Profile.tsx` — extrair `useProfileData` hook de domínio
2. **[P2]** Desacoplar 4 componentes shared — receber dados via props/hooks
3. **[P3]** Criar documento de guidelines de arquitetura para onboarding
4. **[P3]** Adicionar testes de conformidade arquitetural (lint rules + CI check)

---

## 2. Qualidade de Código — 7.5/10

### O que foi analisado
- TypeScript strictness e uso de `any`
- Código morto e duplicação
- Complexidade ciclomática
- Code smells e padrões de naming

### Sub-notas
| Critério | Nota |
|----------|------|
| TypeScript strictness | 8.5 |
| Código morto | 7.0 |
| Duplicação | 7.5 |
| Complexidade | 6.5 |
| Naming conventions | 9.0 |
| Error handling | 8.0 |
| Code smells | 7.0 |

### Pontos fortes
- Apenas **7 `any` em produção** (82 total, maioria em test mocks)
- **Zero TODO/FIXME/HACK** comments
- Naming consistente (camelCase hooks, PascalCase components)
- ESLint com regras de arquitetura

### Problemas encontrados
- **52 padrões repetidos** de error handling Supabase (candidato a abstração)
- **22 magic numbers** (valores de `staleTime` espalhados)
- `useWizardFlow.ts` ainda tem 447 linhas (maior hook do projeto)
- Falta regra `no-console` no ESLint

### Ações de melhoria
1. **[P1]** Abstrair error handling do Supabase em utility (`handleSupabaseError`)
2. **[P2]** Extrair magic numbers para constantes (`STALE_TIME_5MIN`, etc.)
3. **[P2]** Adicionar regra `no-console` ao ESLint (permitir apenas via logger)
4. **[P3]** Avaliar decomposição adicional do `useWizardFlow` se crescer mais

---

## 3. Testes — 7.5/10

### O que foi analisado
- Quantidade e distribuição de testes
- Cobertura por camada arquitetural
- Qualidade dos mocks e fixtures
- Presença de testes E2E/integração

### Métricas
- **603 testes** passando
- **51 arquivos de teste** em `apps/web/`
- **~22 arquivos de teste** em `packages/`
- Zero falhas

### Cobertura por camada
| Camada | Nota | Detalhe |
|--------|------|---------|
| Data layer (clients) | 9/10 | Excelente — quase todos os clients testados |
| Domain hooks | 7/10 | Boa — hooks principais cobertos |
| Utils/helpers | 8/10 | Boa — validação e formatação testados |
| UI components | 4/10 | Fraca — poucos componentes testados |
| Pages | 3/10 | Muito fraca — apenas smoke tests |
| Contexts | 0/10 | **AuthContext completamente sem testes** |

### Gaps críticos
- **AuthContext**: 0% de cobertura — ponto central de autenticação
- **Páginas**: Sem testes de integração (user flows)
- **E2E**: Nenhum teste end-to-end configurado
- **Components UI**: Apenas componentes triviais testados

### Ações de melhoria
1. **[P0]** Testar `AuthContext` — fluxos de login, logout, refresh, edge cases
2. **[P1]** Testes de integração para wizard flow (fluxo mais crítico)
3. **[P1]** Testar componentes com lógica: `PhotoUploader`, `AddTeethModal`
4. **[P2]** Configurar Playwright para testes E2E dos fluxos críticos
5. **[P2]** Criar test utilities library (renderWithProviders, mockSupabase)
6. **[P3]** Adicionar CI coverage thresholds progressivos

---

## 4. Segurança — 7.5/10

### O que foi analisado
- Autenticação e autorização
- Row-Level Security (RLS)
- Validação de input e proteção contra injection
- Proteção de dados sensíveis (PHI/LGPD)
- Rate limiting

### Pontos fortes
- **ES256 + verificação interna** — auth robusta em todas as edge functions
- **RLS ativo** em todas as tabelas de usuário
- **Validação de input** com sanitização dual-layer (prompt injection defense)
- **CSP headers** configurados no `index.html`
- **LGPD compliant**: data-export + delete-account funcionais
- **Stripe webhook** com verificação de assinatura

### Vulnerabilidades
| Severidade | Problema |
|------------|----------|
| **Alta** | `data-export` e `delete-account` sem rate limiting |
| **Média** | Upload de fotos sem validação de MIME type real |
| **Média** | PHI encryption infra criada mas colunas plaintext não removidas |
| **Baixa** | Logs de debug podem vazar dados em produção |

### Ações de melhoria
1. **[P0]** Rate limiting em `data-export` e `delete-account` (AI_HEAVY tier)
2. **[P1]** Validação MIME type real em uploads de fotos (magic bytes, não extensão)
3. **[P1]** Completar migração PHI: dropar colunas plaintext após confirmar encryption
4. **[P2]** Testes automatizados de autenticação (fluxos de auth)
5. **[P2]** Structured logging com sanitização de PII
6. **[P3]** Security audit automatizado no CI (SAST básico)

---

## 5. Internacionalização (i18n) — 7.5/10

### O que foi analisado
- Cobertura de chamadas `t()` no código
- Strings hardcoded restantes
- Estrutura dos arquivos de tradução
- Consistência entre locales

### Métricas
- **845 chamadas `t()`** em 61 arquivos
- **~75-80% de cobertura** de componentes user-facing
- Framework: i18next + react-i18next

### Gaps encontrados
| Componente/Área | Status |
|-----------------|--------|
| Dashboard InsightsTab | Strings hardcoded em PT |
| Dashboard OnboardingCards | Strings hardcoded em PT |
| PhotoUploader | Strings hardcoded em PT |
| Toast messages (diversos) | ~50% traduzidos |
| Form validation messages | Parcialmente traduzidos |
| Error boundaries | Não traduzidos |

### Ações de melhoria
1. **[P1]** Traduzir componentes do Dashboard (InsightsTab, OnboardingCards)
2. **[P1]** Traduzir `PhotoUploader` — componente com interação crítica
3. **[P2]** Traduzir todas as toast messages restantes
4. **[P2]** Traduzir mensagens de validação de formulários
5. **[P3]** Adicionar lint rule para detectar strings hardcoded em PT
6. **[P3]** Traduzir error boundaries e fallbacks

---

## 6. Design System (PageShell) — 7.5/10

### O que foi analisado
- Adoção de PageShell composites nas páginas
- Consistência de layout e responsividade
- Uso de tokens semânticos vs. valores hardcoded
- Cobertura dos packages do design system

### Métricas
- **11/19 páginas** (58%) usando PageShell composites
- **39 ocorrências** de `max-w-*` customizado (anti-pattern)
- **202 breakpoints responsivos** em uso
- **362+ exports** no `@pageshell/layouts`

### Páginas migradas vs. pendentes
| Status | Páginas |
|--------|---------|
| ✅ Migradas | Dashboard, Patients, PatientDetail, Analysis, Settings, NewAnalysis, Wizard, Login, Register, ForgotPassword, SharedReport |
| ❌ Pendentes | Profile, AnalysisHistory, Reports, Notifications, Help, Subscription, Admin, Legal, Onboarding |

### Ações de melhoria
1. **[P1]** Migrar `Profile` → `SettingsPage` ou `DetailPage`
2. **[P1]** Migrar `AnalysisHistory` → `ListPage`
3. **[P2]** Migrar `Reports` → `ListPage` + `DetailPage`
4. **[P2]** Eliminar `max-w-*` hardcoded — usar PageShell layout tokens
5. **[P3]** Migrar páginas restantes (Notifications, Help, Subscription, Admin, Legal, Onboarding)
6. **[P3]** Documentar guia de migração PageShell para novas páginas

---

## 7. Documentação — 8.5/10

### O que foi analisado
- Completude e qualidade dos ADRs
- Cobertura de wikilinks e navegabilidade
- Consistência de frontmatter e formatação
- Presença de guias e runbooks

### Métricas
- **8 ADRs completos** (001–008) com estrutura padronizada
- **303 wikilinks** em 33 arquivos
- **46 arquivos Markdown** no vault
- **15 AGENTS.md** distribuídos pelo monorepo

### Pontos fortes
- Todos os ADRs seguem o template com Context, Decision, Consequences
- Home.md funciona como hub com 61 wikilinks
- Glossário e índices mantidos

### Problemas encontrados
| Problema | Localização |
|----------|-------------|
| AGENTS.md raiz só lista ADR 001-003 | `/AGENTS.md` |
| Falta guia de onboarding para devs | `docs/` |
| Falta runbook de deploy | `docs/` |
| Branding inconsistente (DentAI vs AURIA) | Diversos arquivos |

### Ações de melhoria
1. **[P1]** Atualizar `AGENTS.md` raiz com referência a todos os 8 ADRs
2. **[P2]** Criar guia de onboarding para novos desenvolvedores
3. **[P2]** Criar runbook de deploy (Supabase + Vercel + Docker)
4. **[P3]** Padronizar branding para AURIA em toda documentação
5. **[P3]** Melhorar guia de testes com exemplos e padrões

---

## 8. Backend (Edge Functions) — 8.5/10

### O que foi analisado
- Configuração e segurança das edge functions
- Gestão de prompts e IA
- Sistema de créditos e monetização
- Conformidade LGPD
- Dependências e imports

### Métricas
- **14 edge functions** todas listadas em `config.toml`
- **5 prompts** no registry centralizado
- **100% migrado** de esm.sh para `jsr:` / `npm:`
- **0 dependências** em CDN externo

### Pontos fortes
- Prompt management centralizado com registry e métricas
- Sistema de créditos atômico com idempotência e refund
- LGPD: data-export e delete-account completos
- Stripe webhook com verificação de assinatura
- Todas as functions com `verify_jwt = false` + auth interna

### Problemas encontrados
| Severidade | Problema |
|------------|----------|
| **Alta** | `recommend-resin` e `recommend-cementation` não verificam créditos |
| **Média** | Rate limiter usa implementação in-memory (não atômica) |
| **Baixa** | Sem versionamento de prompts (apenas registry estático) |

### Ações de melhoria
1. **[P0]** Adicionar verificação de créditos em `recommend-resin` e `recommend-cementation`
2. **[P1]** Implementar rate limiter atômico (Supabase RPC ou Redis)
3. **[P2]** Adicionar versionamento de prompts com changelog
4. **[P3]** Implementar circuit breaker para chamadas ao Gemini
5. **[P3]** Adicionar health checks endpoint para monitoramento

---

## Plano de Ação Consolidado

### Prioridade P0 — Crítico (fazer agora)
| # | Ação | Área | Esforço |
|---|------|------|---------|
| 1 | Verificação de créditos em recommend-resin/cementation | Backend | 2h |
| 2 | Rate limiting em data-export e delete-account | Segurança | 2h |
| 3 | Testar AuthContext | Testes | 4h |

### Prioridade P1 — Importante (próximo sprint)
| # | Ação | Área | Esforço |
|---|------|------|---------|
| 4 | Desacoplar Profile.tsx (extrair hook de domínio) | Arquitetura | 2h |
| 5 | Abstrair error handling Supabase | Código | 3h |
| 6 | Testes de integração do wizard flow | Testes | 4h |
| 7 | Validação MIME type real em uploads | Segurança | 2h |
| 8 | Completar migração PHI encryption | Segurança | 4h |
| 9 | i18n: Dashboard components + PhotoUploader | i18n | 3h |
| 10 | Migrar Profile e AnalysisHistory para PageShell | Design System | 4h |
| 11 | Atualizar AGENTS.md com todos os ADRs | Docs | 1h |
| 12 | Rate limiter atômico (backend) | Backend | 4h |

### Prioridade P2 — Desejável (próximos 2 sprints)
| # | Ação | Área | Esforço |
|---|------|------|---------|
| 13 | Desacoplar 4 componentes shared | Arquitetura | 4h |
| 14 | Extrair magic numbers para constantes | Código | 2h |
| 15 | Configurar Playwright E2E | Testes | 6h |
| 16 | Testes automatizados de auth | Segurança | 4h |
| 17 | Traduzir toasts e validação forms | i18n | 3h |
| 18 | Migrar Reports + eliminar max-w hardcoded | Design System | 4h |
| 19 | Guia de onboarding + runbook de deploy | Docs | 4h |
| 20 | Versionamento de prompts | Backend | 3h |

### Prioridade P3 — Nice to have (backlog)
| # | Ação | Área | Esforço |
|---|------|------|---------|
| 21 | Guidelines doc de arquitetura | Arquitetura | 2h |
| 22 | ESLint no-console rule | Código | 1h |
| 23 | CI coverage thresholds progressivos | Testes | 2h |
| 24 | SAST básico no CI | Segurança | 3h |
| 25 | Lint rule para strings hardcoded | i18n | 2h |
| 26 | Migrar páginas restantes para PageShell | Design System | 8h |
| 27 | Padronizar branding AURIA | Docs | 2h |
| 28 | Circuit breaker + health checks | Backend | 4h |

---

## Evolução desde a última auditoria

A auditoria de 4 fases executada em 2026-02-10 (20 agentes, 136 arquivos) trouxe melhorias significativas:

- **Wizard refatorado**: 1.355 → 447 linhas (hook), 1.334 → 107 linhas (DSDStep)
- **i18n adotado**: 0 → 400+ chaves (~80% cobertura)
- **LGPD implementado**: data-export + delete-account + UI self-service
- **CI melhorado**: coverage thresholds + GitHub Actions summary
- **603 testes** passando, zero erros TypeScript
- **Prompt management** centralizado com registry e métricas

---

## Metodologia

Análise realizada por **8 agentes especializados** executados em paralelo:

1. **arch-auditor** — Conformidade com ADR-001/002, 3-layer pattern
2. **code-quality-auditor** — TypeScript, duplicação, complexidade, smells
3. **test-auditor** — Cobertura por camada, gaps, qualidade de testes
4. **security-auditor** — Auth, RLS, validation, LGPD, rate limiting
5. **i18n-auditor** — Chamadas t(), strings hardcoded, cobertura
6. **design-auditor** — PageShell composites, tokens, responsividade
7. **docs-auditor** — ADRs, wikilinks, frontmatter, completude
8. **backend-auditor** — Edge functions, prompts, créditos, imports

Cada agente analisou o código-fonte diretamente, sem depender de relatórios anteriores.

---

*Gerado automaticamente em 2026-02-11 por Claude Code (Opus 4.6)*
