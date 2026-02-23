---
title: "AGENTS.md (supabase)"
created: 2026-02-23
updated: 2026-02-23
author: Team AURIA
status: published
tags:
  - type/guide
  - status/published
  - scope/supabase
related:
  - "[[../AGENTS.md]]"
  - "[[../CLAUDE.md]]"
---

# Agente: Supabase Backend

> Instruções para edge functions (backend Deno).

## Navegação

- [[../CLAUDE.md]] — Entry point raiz
- [[../AGENTS.md]] — Índice geral (pai)

## Herança

- **Pai**: [[../AGENTS.md]]

## Project Context

Backend do AURIA: 13 edge functions em Deno que proveem análise dental com IA, recomendações clínicas, billing (Stripe), e conformidade LGPD. Toda lógica compartilhada vive em `functions/_shared/`.

## Key Locations

| Diretório | Conteúdo |
|-----------|----------|
| `functions/` | 13 edge functions |
| `functions/_shared/` | Middleware, AI clients, credits, rate limiting, prompts |
| `functions/_shared/prompts/definitions/` | Definições de prompts IA (6 prompts) |
| `migrations/` | 20+ migrações SQL (schema, RLS, indexes) |
| `config.toml` | Configuração Supabase (auth, JWT, functions) |

## Edge Functions

| Função | Tipo | AI | Descrição |
|--------|------|-----|-----------|
| `analyze-dental-photo` | vision-tools | Gemini + Claude fallback | Detecta cavidades, manchas, fraturas |
| `generate-dsd` | multi-step | Gemini vision + image-edit + Haiku | Digital Smile Design completo |
| `recommend-resin` | text-tools | Claude tool-calling | Protocolo de estratificação de resina |
| `recommend-cementation` | text-tools | Claude tool-calling | Protocolo de cimentação cerâmica |
| `stripe-webhook` | webhook | — | Sync assinaturas e créditos |
| `create-checkout-session` | API | — | Sessão Stripe checkout |
| `create-portal-session` | API | — | Portal de assinaturas Stripe |
| `sync-subscription` | API | — | Fallback pós-checkout assinaturas |
| `sync-credit-purchase` | API | — | Fallback pós-checkout créditos |
| `send-email` | API | — | Despacho de emails por template |
| `health-check` | API | — | Monitoramento de conectividade |
| `data-export` | API | — | LGPD: portabilidade de dados |
| `delete-account` | API | — | LGPD: exclusão de conta |

## Regras Críticas

> [!danger] Obrigatório
> Violar estas regras causa falhas em produção.

### Runtime & Imports

| Regra | Detalhe |
|-------|---------|
| **Runtime** | Deno — NÃO pode usar packages pnpm workspace |
| **Supabase** | `import { createClient } from "jsr:@supabase/supabase-js@2"` |
| **Stripe** | `import Stripe from "npm:stripe@14.14.0"` |
| **Relativos** | Sempre com extensão `.ts`: `import { x } from "../_shared/foo.ts"` |
| **Nunca** | `esm.sh`, packages sem prefixo `jsr:` ou `npm:` |

### Auth

| Regra | Detalhe |
|-------|---------|
| **verify_jwt** | TODAS as functions: `verify_jwt = false` em `config.toml` |
| **Deploy** | SEMPRE com `--no-verify-jwt` |
| **Validação** | Manual via `supabase.auth.getUser(token)` com service role key |
| **Soft delete** | Verificar `deleted_at` e `banned_until` após auth |

### Deploy

| Regra | Detalhe |
|-------|---------|
| **Comando** | `npx supabase functions deploy <nome> --no-verify-jwt --use-docker` |
| **Docker** | Docker Desktop DEVE estar rodando |
| **Sequencial** | NUNCA deployar em paralelo — causa ENOTEMPTY em cache npx |
| **Ordem** | Uma função por vez, esperar completar antes da próxima |

### AI Calls

| Regra | Detalhe |
|-------|---------|
| **Gemini vision** | OBRIGATÓRIO `thinkingLevel: "low"` — "medium" causa WORKER_LIMIT (150s timeout) |
| **Claude recommendations** | Usar Haiku 4.5 (~10-15s), NÃO Sonnet (~50s, timeout 60s) |
| **Tool-calling** | `tool_choice: { type: "tool", name }` para forçar structured output |
| **DSD simulation** | Apenas Gemini 3 Pro — outros modelos produzem resultado artificial |
| **Timeout** | Edge functions têm 60s timeout. FunctionsFetchError no browser = timeout |

### Credits & Rate Limiting

| Regra | Detalhe |
|-------|---------|
| **Atomicidade** | `use_credits()` usa SELECT FOR UPDATE — nunca fazer manualmente |
| **Idempotência** | Sempre passar `operationId` para evitar cobrança dupla em retry |
| **Refund** | Chamar `refundCredits()` ANTES de retornar erro se créditos já consumidos |
| **Rate limit** | Usar `>=` (não `>`) para comparação — off-by-one |

### Resiliência

| Padrão | Implementação |
|--------|---------------|
| **Retry** | Exponential backoff (1s → 16s), max 5 retries em 429/5xx |
| **Fallback** | Claude: Sonnet → Haiku. Gemini image-edit: Pro → Flash |
| **Circuit breaker** | 5 falhas consecutivas → bloqueia 60s |
| **Fail-closed** | Validações safety-critical rejeitam em caso de erro |

## Prompts

6 definições em `_shared/prompts/definitions/`:

| Prompt | Provider | Modo | Model |
|--------|----------|------|-------|
| `analyze-dental-photo` | Gemini | vision-tools | gemini-3.1-pro |
| `dsd-analysis` | Gemini | vision | gemini-3.1-pro |
| `dsd-simulation` | Gemini | image-edit | gemini-3-pro |
| `recommend-resin` | Claude | text-tools | claude-haiku-4-5 |
| `recommend-cementation` | Claude | text-tools | claude-haiku-4-5 |
| `smile-line-classifier` | Claude | vision | claude-haiku-4-5 |

## Comandos

| Comando | Descrição |
|---------|-----------|
| `npx supabase functions deploy <nome> --no-verify-jwt --use-docker` | Deploy de função |
| `npx supabase functions serve` | Dev server local |
| `npx supabase db push` | Aplicar migrações |
| `npx supabase db diff --use-migra` | Gerar diff de schema |

## Links

- [[../CLAUDE.md]] — Entry point raiz
- [[../AGENTS.md]] — Índice geral

---
*Atualizado: 2026-02-23*
