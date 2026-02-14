---
title: "ToSmile.AI — Definição do Produto"
created: 2026-02-12
updated: 2026-02-12
status: published
tags:
  - type/guide
  - status/published
  - product
---

# ToSmile.AI — Definição do Produto

> [!info] Links relacionados
> [[Home]] | [[Overview]] | [[Tech-Stack]] | [[ADR-Index]]

## Visão

Ser a plataforma global de referência em apoio à decisão clínica estética para dentistas, unindo inteligência artificial, protocolos baseados em evidência e inventário real do consultório em um fluxo de trabalho único.

## Missão

Reduzir de 10+ minutos para menos de 2 minutos o tempo de seleção de cor, estratificação e planejamento estético por caso, democratizando o acesso a protocolos que hoje dependem de especialistas caros ou anos de experiência — para dentistas em qualquer lugar do mundo.

---

## 1. Público-Alvo

| Persona | Perfil | Dor Principal | Valor Entregue |
|---------|--------|---------------|----------------|
| **Dentista Estético** (primário) | 35-50 anos, consultório próprio, 20-50 casos/mês | Seleção manual de cor + layering demora 10+ min/caso | IA acelera para 2 min, DSD comunica resultado ao paciente |
| **Clínico Geral** (secundário) | 40-60 anos, prática mista, 5-15 casos estéticos/mês | Insegurança na estratificação sem ser especialista | IA como segunda opinião + protocolos padronizados |
| **Grupo/Escola** (terciário) | Coordenador, 50+ profissionais | Falta padronização entre profissionais | Protocolos consistentes, treinamento de equipe |

**Mercado:** Global — multi-idioma (i18n), pricing multi-moeda, compliance multi-jurisdição.

---

## 2. Seções de Desenvolvimento

### Seção A — Núcleo de IA (Motor do Produto)

**O que resolve:** Análise automatizada de fotos e geração de protocolos clínicos.

| Feature | Modelo IA | Input | Output | Créditos |
|---------|-----------|-------|--------|----------|
| Análise de foto dental | Gemini 3-Flash (vision) | 1-3 fotos intraorais | Até 8+ dentes detectados, cor VITA, tipo de tratamento | 1 |
| Estratificação de resina | Gemini 2.0 Flash (text) | Dente + inventário do consultório | 4-7 camadas com marca, cor e técnica de polimento | incl. |
| Protocolo de cimentação | Gemini 2.5 Pro (function calling) | Detalhes do caso | Passo-a-passo com materiais e checklist | incl. |
| DSD — Análise facial | Gemini 2.5 Pro (vision) | Foto de rosto | Proporções, linha do sorriso, corredor bucal | 2 |
| DSD — Simulação visual | Gemini Image Edit | Foto + mudanças propostas | Imagem antes/depois gerada por IA | incl. |

**Pós-processamento:** Deduplicação de dentes, filtro por arcada, normalização de enums multi-idioma, validação Zod, métricas por chamada.

> [!tip] Detalhes técnicos
> Ver [[ADR-006-ai-integration-strategy]] e [[ADR-003-centralized-prompt-management]]

---

### Seção B — Jornada do Caso Clínico (Core UX)

**O que resolve:** Fluxo completo do caso, da foto ao protocolo exportável.

| Feature | Descrição | Status |
|---------|-----------|--------|
| **Wizard completo** (6 steps) | Foto → Análise → Preferências → DSD → Revisão → Resultado | Implementado |
| **Quick Case** (4 steps) | Foto → Análise → Revisão → Resultado (sem DSD) | Implementado |
| **Caso de exemplo** | Demo pré-carregado sem consumir créditos | Implementado |
| **Detalhes do caso** | Sumário, DSD, tabela de camadas, cimentação, checklist | Implementado |
| **Export PDF** | PDF multi-página com logo, dados, protocolo completo | Implementado |
| **Link compartilhável** | URL pública com token (expira em 7 dias) | Implementado |
| **Score de complexidade** | Classificação 1-5 automática por caso | Implementado |

**Arquitetura Wizard (pós-refactor):**

```
useWizardFlow (orquestrador ~200 linhas)
  ├── usePhotoAnalysis
  ├── useDSDIntegration
  ├── useWizardSubmit (parallel per-tooth)
  ├── useWizardNavigation (state machine)
  ├── useWizardReview
  └── useWizardDraftRestore
```

> [!tip] Detalhes técnicos
> Ver [[ADR-008-wizard-architecture-post-refactor]]

---

### Seção C — Gestão de Pacientes e Inventário

**O que resolve:** Organização do consultório dentro da plataforma.

| Feature | Descrição | Status |
|---------|-----------|--------|
| **Pacientes** | CRUD completo, busca, histórico de casos | Implementado |
| **Avaliações** | Agrupamento por sessão, filtros, paginação, ações em lote | Implementado |
| **Inventário de resinas** | Catálogo visual, import/export CSV, 50+ marcas, paleta VITA | Implementado |
| **Integração inventário ↔ IA** | Recomendações usam estoque real do consultório | Implementado |

---

### Seção D — Monetização (Sistema de Créditos)

**O que resolve:** Receita recorrente + flexibilidade de consumo.

**Modelo:**

```
Assinatura mensal → créditos_do_plano
  + rollover (não usados acumulam)
  + bônus (indicação, promo, compra avulsa)
  = saldo disponível
```

| Plano | Créditos/mês | Faixa de preço | Público |
|-------|-------------|----------------|---------|
| Starter | 5-10 | Free | Trial |
| Pro | 30-50 | ~$19-29/mo | Consultório pequeno |
| Professional | 100+ | ~$39-49/mo | Consultório médio |
| Elite | "Ilimitado" | ~$59-69/mo | Consultório grande |

**Receita:**

1. Assinaturas recorrentes (Stripe — multi-moeda)
2. Pacotes avulsos de créditos
3. Bônus por indicação (5 créditos por referral)

**Segurança:** Consumo atômico server-side via Postgres RPC `use_credits()` com row locking.

> [!tip] Detalhes técnicos
> Ver [[ADR-004-credit-model-and-monetization]]

---

### Seção E — Autenticação e Segurança

**O que resolve:** Acesso seguro, privacidade, compliance global.

| Feature | Status |
|---------|--------|
| Email/senha + Google OAuth | Implementado |
| Verificação de email | Implementado |
| Recuperação de senha | Implementado |
| JWT ES256 + RLS em todas as tabelas | Implementado |
| Cookie consent + disclaimer clínico | Implementado |
| GDPR/LGPD — export de dados | Edge function existe, UI pendente |
| GDPR/LGPD — exclusão de conta | Edge function existe, UI pendente |

> [!tip] Detalhes técnicos
> Ver [[ADR-005-authentication-and-authorization]]

---

### Seção F — Perfil e Personalização

**O que resolve:** Identidade do profissional na plataforma.

| Feature | Status |
|---------|--------|
| Perfil (nome, registro profissional, clínica, fone, timezone) | Implementado |
| Upload de avatar e logo da clínica | Implementado |
| Dark mode | Implementado |
| Gestão de assinatura + portal Stripe | Implementado |
| i18n (multi-idioma) | ~80% cobertura, ~20% hardcoded |

---

### Seção G — Growth e Retenção

**O que resolve:** Aquisição, ativação e reengajamento global.

| Feature | Status |
|---------|--------|
| Onboarding checklist | Implementado |
| Caso de exemplo (sample case) | Implementado |
| Links compartilháveis (loop viral) | Implementado |
| Programa de indicação (referral) | Em desenvolvimento |
| Analytics (PostHog) | Montado, subutilizado |
| Email marketing / drip campaigns | Planejado, diferido |

---

## 3. Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind + shadcn/ui |
| Design System | PageShell (11 packages: composites, primitives, layouts) |
| Estado | React Query + React Hook Form + Zod |
| Backend | Supabase Edge Functions (Deno) |
| Banco | PostgreSQL (Supabase) com RLS |
| IA | Google Gemini (3 modelos: Flash, Pro, Image Edit) |
| Pagamentos | Stripe (subscriptions + webhooks, multi-moeda) |
| Deploy | Vercel (frontend) + Supabase (backend) |
| Monorepo | Turborepo + pnpm |

> [!info] Detalhes completos
> Ver [[Tech-Stack]] e [[Overview]]

---

## 4. Roadmap (Próximos 90 Dias)

### Semanas 1-2 — Estabilização (P0)

- Corrigir refund de créditos no DSD em todos os caminhos de erro
- Corrigir race condition no rate limiter
- Padronizar auth entre Edge Functions

### Semanas 3-6 — Fundação (P1)

- Product analytics completo (PostHog)
- i18n 100% + suporte a inglês (en-US)
- Cobertura de testes (target: 60%+)
- Performance: processamento paralelo por dente

### Semanas 7-12 — Crescimento Global (P2)

- Multi-usuário (equipes/clínicas grupo)
- Email automation (campanhas de drip)
- GDPR/LGPD self-service (export + exclusão)
- Pricing multi-moeda (USD, EUR, BRL, GBP)
- Landing page multi-idioma

---

## 5. Métricas de Sucesso

| Métrica | Atual | Meta Q2 |
|---------|-------|---------|
| Testes passando | 603 | 1000+ |
| Cobertura | ~15% | 60%+ |
| Erros TS | 0 | 0 |
| i18n cobertura | ~80% | 100% (pt-BR + en-US) |
| DSD success rate | ~70% | 95%+ |
| Tempo análise/caso | ~15s | <10s |

---

## 6. Posicionamento Competitivo

**Diferenciais únicos:**

1. Estratificação integrada ao inventário real do consultório
2. DSD com geração de imagem por IA (não templates estáticos)
3. Protocolo de cimentação dedicado (raro em concorrentes)
4. Multi-dente paralelo (8+ por foto)
5. Plataforma global com i18n nativo

**Gaps vs concorrentes:**

- Sem visualização 3D
- Sem app mobile nativo
- Sem suporte multi-usuário (ainda)

---

**Domínios:** `tosmile.ai`, `www.tosmile.ai`

**Maturidade do Produto: B+** — Fundação sólida, dívida técnica concentrada, caminho claro de evolução global.

---

*Atualizado: 2026-02-12*
