---
title: "Auditoria de Validacao — ToSmile.ai (AURIA)"
created: 2026-02-16
updated: 2026-02-16
status: draft
tags: [type/plan, status/draft]
---

# Auditoria de Validacao — ToSmile.ai

> Re-analise pos-execucao das 4 fases do plano anterior.
> 6 agentes especializados - 2026-02-16

---

## Resumo Executivo

A auditoria anterior (4 fases) foi **bem-sucedida** — a maioria dos achados foi corrigida. Esta validacao confirma as correcoes e identifica **21 achados remanescentes ou novos**, organizados por prioridade.

### Validacao das Correcoes Anteriores

| Fase | Item | Status |
|------|------|--------|
| 1 | Acentos no send-email | CORRIGIDO |
| 1 | Auth redirect URLs (7 dominios) | CORRIGIDO |
| 1 | Import legado deno.land | NAO corrigido — 13 funcoes ainda usam `deno.land/std@0.168.0` |
| 2 | Landing.tsx h1 i18n | CORRIGIDO |
| 2 | Inventory.tsx title i18n | CORRIGIDO |
| 2 | EvaluationDetails badges i18n | CORRIGIDO |
| 2 | SharedEvaluation status i18n | CORRIGIDO |
| 2 | middleware.ts type safety | CORRIGIDO (UserAdminFields interface) |
| 3 | EvaluationDetails decomposicao | CORRIGIDO 603-509 linhas |
| 3 | analyze-dental-photo extracao | CORRIGIDO 648-563 linhas |
| 3 | getProtocolFingerprint unificado | CORRIGIDO lib/protocol-fingerprint.ts |
| 3 | Clinical rules consolidacao | Ja adequado |
| 4 | CI audit enforcement | CORRIGIDO - || true removido |
| 4 | Coverage thresholds | Ja existiam (22/76/44/22) |
| 4 | E2E graceful skip | CORRIGIDO |
| 4 | pageshell/shell DTS | Ja corrigido |
| 4 | jspdf vulnerabilidades | CORRIGIDO 2.5.2-4.1.0 |

---

## Achados por Severidade

### ALTA (8 achados)

| # | Area | Achado | Localizacao | Esforco |
|---|------|--------|-------------|---------|
| A1 | Backend | Import legado `deno.land/std@0.168.0` em TODAS as 13 edge functions | `*/index.ts:1` | S |
| A2 | Backend | generate-dsd 1.515 linhas — 3.8x acima do limite, multiplas responsabilidades | `generate-dsd/index.ts` | L |
| A3 | Backend | `any` types em stripe-webhook — 7 funcoes aceitam `supabase: any` | `stripe-webhook/index.ts:18,119,183,230,249,290,328` | S |
| A4 | AI | Model names hardcoded em edge functions em vez de usar `promptDef.model` do registry | `analyze-dental-photo:339`, `recommend-resin:328`, `generate-dsd:624,1005,1060` | S |
| A5 | i18n | helpers.ts — protocolos genericos hardcoded (~200 strings clinicas em portugues) | `hooks/domain/wizard/helpers.ts:68-254` | L |
| A6 | i18n | treatment-config.ts — labels hardcoded + formatToothLabel | `lib/treatment-config.ts:20-36` | M |
| A7 | i18n | ResinTypeLegend.tsx — tipos de resina hardcoded | `components/ResinTypeLegend.tsx:7-12` | S |
| A8 | Frontend | useDSDStep.ts usa Supabase direto — viola arquitetura 3-layer (7 chamadas) | `components/wizard/dsd/useDSDStep.ts` | M |

### MEDIA (10 achados)

| # | Area | Achado | Localizacao | Esforco |
|---|------|--------|-------------|---------|
| M1 | Backend | recommend-resin 700 linhas — 1.75x acima do limite | `recommend-resin/index.ts` | M |
| M2 | Backend | analyze-dental-photo 564 linhas — ainda 1.4x acima do limite | `analyze-dental-photo/index.ts` | M |
| M3 | Backend | console.error em vez de logger — 7 instancias em _shared e functions | `rateLimit.ts:99,154`, `recommend-resin:670`, etc. | S |
| M4 | Backend | health-check sem rate limit e CORS wildcard | `health-check/index.ts:6` | S |
| M5 | Security | CORS fail-open — origem nao autorizada recebe header da primeira producao | `_shared/cors.ts:47` | S |
| M6 | Security | MFA nao enforced para operacoes de alto risco | `AuthContext.tsx`, `config.toml` | M |
| M7 | Security | Error messages expoem detalhes internos (<100 chars mostrados ao user) | `lib/errorHandler.ts:68-71` | S |
| M8 | AI | Metrics nao aplicados a chamadas fallback em generate-dsd | `generate-dsd/index.ts` | S |
| M9 | i18n | CaseSummaryBox.tsx — procedimentos esteticos hardcoded | `components/protocol/CaseSummaryBox.tsx:18-23` | S |
| M10 | i18n | Keys i18n faltando — short labels de tratamento + tipos de resina extras | `locales/pt-BR.json` | S |

### BAIXA (3 achados)

| # | Area | Achado | Localizacao | Esforco |
|---|------|--------|-------------|---------|
| B1 | i18n | "AURIA" no WhatsApp referral — deveria ser "ToSmile.ai" | `locales/pt-BR.json:1521` | S |
| B2 | Security | Conteudo controlado em chart.tsx mas pode usar JSX children em vez de innerHTML | `components/ui/chart.tsx:70` | S |
| B3 | AI | DEFAULT_MODEL nao usado em claude.ts e gemini.ts — codigo morto | `_shared/claude.ts:16`, `_shared/gemini.ts:6` | S |

---

## Pontos Positivos Confirmados

- 3-layer architecture bem seguida (exceto useDSDStep)
- Lazy loading + ErrorBoundary + Suspense em TODAS as rotas
- Zero `@ts-ignore`/`@ts-expect-error` em codigo fonte
- Zero `any` em codigo frontend (so testes)
- Clinical rules 100% consolidadas em `clinical-rules.ts`
- Prompt injection protection consistente (`sanitizeForPrompt`)
- Rate limiting atomico fail-closed via PostgreSQL RPC
- LGPD compliant (data-export, delete-account, cookie consent)
- RLS em todas as tabelas
- CI completo com 5 jobs + CodeQL
- Seguranca ALTA — headers, HSTS, CSP, bcrypt
- Error handling com circuit breaker + retry + credit refund
- Schema validation (Zod) em todas as respostas AI
- Skip-to-content + ARIA labels + keyboard shortcuts

---

## Plano de Execucao em 3 Fases

### Fase 1: Quick Wins (Esforco: ~2h)

> Alto impacto, baixo risco, execucao rapida

| Item | Acao | Arquivos |
|------|------|----------|
| A1 | Migrar `deno.land/std@0.168.0/http/server.ts` para serve nativo do Deno em todas as 13 functions | 13 arquivos |
| A4 | Substituir model names hardcoded por `promptDef.model` do registry | 3 edge functions |
| M3 | Substituir `console.error` por `logger.error` (7 instancias) | 4 arquivos |
| M4 | Usar `getCorsHeaders(req)` no health-check (remover wildcard) | 1 arquivo |
| B1 | Trocar "AURIA" para "ToSmile.ai" no WhatsApp referral | pt-BR.json |
| B3 | Remover `DEFAULT_MODEL` nao usado em claude.ts e gemini.ts | 2 arquivos |

### Fase 2: i18n e Type Safety (Esforco: ~4-6h)

> Elimina strings hardcoded remanescentes

| Item | Acao | Arquivos |
|------|------|----------|
| A6 | Fazer `getTreatmentConfig` aceitar `t` function, usar keys i18n existentes | treatment-config.ts + callers |
| A7 | Internacionalizar labels no ResinTypeLegend.tsx | 1 componente + pt-BR.json |
| M9 | Internacionalizar AESTHETIC_PROCEDURES no CaseSummaryBox.tsx | 1 componente + pt-BR.json |
| M10 | Adicionar keys faltantes (short labels + resin types) | pt-BR.json |
| A3 | Substituir `any` por `SupabaseClient` em stripe-webhook (7 funcoes) | 1 arquivo |
| A5 | Extrair ~200 strings de `helpers.ts` para i18n (protocolos genericos) | helpers.ts + pt-BR.json |
| M5 | Corrigir CORS fail-open — retornar vazio para origens nao autorizadas | cors.ts |
| M7 | Sanitizar error messages antes de mostrar ao usuario | errorHandler.ts |

### Fase 3: Arquitetura (Esforco: ~6-8h)

> Decomposicao de arquivos grandes

| Item | Acao | Arquivos |
|------|------|----------|
| A2 | Decompor generate-dsd (1.515 para menor que 500 linhas) — extrair DSD analysis, simulation, lip check | 1 para 3+ arquivos |
| M1 | Extrair shade validation e inventory logic de recommend-resin (700 para menor que 400) | 1 para 2+ arquivos |
| M2 | Extrair multi-tooth processing de analyze-dental-photo (564 para menor que 400) | 1 para 2+ arquivos |
| A8 | Mover chamadas Supabase de useDSDStep.ts para data layer | useDSDStep.ts + data/dsd.ts |
| M8 | Aplicar `withMetrics` a chamadas fallback em generate-dsd | generate-dsd/index.ts |

---

## Metricas de Acompanhamento

| Metrica | Antes (pos-4-fases) | Meta pos-validacao |
|---------|---------------------|-------------------|
| Import legado (deno.land) | 13 funcoes | 0 |
| Maior edge function | 1.515 linhas (generate-dsd) | menor que 500 linhas |
| `any` em backend | 8 (stripe-webhook 7 + generate-dsd 1) | 0 |
| Model names hardcoded | 5 ocorrencias | 0 (usar registry) |
| i18n coverage | ~90% | ~97% |
| Strings hardcoded (helpers.ts) | ~200 strings | 0 |
| CORS fail-open | Sim | Nao |
| console.error (em vez de logger) | 7 instancias | 0 |

---

## Notas

- **Nao incluido**: Testes unitarios para domain hooks (22 arquivos sem teste) — divida tecnica real mas fora do escopo desta auditoria de codigo
- **Nao incluido**: E2E test data seeding — requer infraestrutura Supabase local
- **Acompanhar**: MFA enforcement (M6) — decisao de produto, nao tecnica
- **Acompanhar**: CSP unsafe-inline — necessario para Stripe

---

*Gerado por auditoria de validacao com 6 agentes especializados — 2026-02-16*
