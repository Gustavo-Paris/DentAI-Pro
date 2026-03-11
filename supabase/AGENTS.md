---
title: "AGENTS.md (supabase)"
created: 2026-02-23
updated: 2026-03-10
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

Backend do AURIA: 15 edge functions em Deno que proveem análise dental com IA, recomendações clínicas, billing (Stripe), e conformidade LGPD. Toda lógica compartilhada vive em `functions/_shared/`.

## Key Locations

| Diretório | Conteúdo |
|-----------|----------|
| `functions/` | 15 edge functions |
| `functions/_shared/` | Middleware, AI clients, credits, rate limiting, prompts |
| `functions/_shared/prompts/definitions/` | Definições de prompts IA (4 prompts) |
| `migrations/` | 20+ migrações SQL (schema, RLS, indexes) |
| `config.toml` | Configuração Supabase (auth, JWT, functions) |

## Edge Functions

| Função | Tipo | AI | Descrição |
|--------|------|-----|-----------|
| `analyze-dental-photo` | vision-tools | Gemini + Claude fallback | Análise unificada clínica + estética (cores, cavidades, proporções, DSD) |
| `check-photo-quality` | vision | Gemini | Validação de qualidade de foto antes da análise |
| `generate-dsd` | simulation-only | NB2 (primary) + G3PI (fallback) + Haiku (lip validation) | Simulação DSD (requer existingAnalysis da análise unificada) |
| `recommend-resin` | text-tools | Gemini 3 Flash (primary) + Claude Sonnet 4.6 (fallback) | Protocolo de estratificação de resina |
| `recommend-cementation` | text-tools | Gemini 3 Flash (primary) + Claude Sonnet 4.6 (fallback) | Protocolo de cimentação cerâmica |
| `stripe-webhook` | webhook | — | Sync assinaturas e créditos |
| `create-checkout-session` | API | — | Sessão Stripe checkout |
| `create-portal-session` | API | — | Portal de assinaturas Stripe |
| `sync-subscription` | API | — | Fallback pós-checkout assinaturas |
| `sync-credit-purchase` | API | — | Fallback pós-checkout créditos |
| `send-email` | API | — | Despacho de emails por template |
| `health-check` | API | — | Monitoramento de conectividade |
| `data-export` | API | — | LGPD: portabilidade de dados |
| `delete-account` | API | — | LGPD: exclusão de conta |
| `apply-referral` | API | — | Aplica código de referral e concede créditos bônus |

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
| **authenticateRequest()** | OBRIGATÓRIO em toda edge function. Sem chamada = endpoint público sem proteção. Única exceção: `health-check` (GET only, sem acesso a dados) |

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
| **Resin/Cementation** | Gemini 3 Flash (primary, 50s) → Claude Sonnet 4.6 (fallback, remaining budget). Elapsed-time-aware fallback |
| **Tool-calling** | `tool_choice: { type: "tool", name }` para forçar structured output |
| **DSD simulation** | Nano Banana 2 (primary) → Gemini 3 Pro Image (fallback). `callGeminiImageEdit` default model is NB2 |
| **Timeout** | Edge functions têm **150s** timeout server-side. Browser client tem split timeouts: 55s auth/db, 150s edge functions. `FunctionsFetchError` no browser = timeout |

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
| **Fallback** | Resin/Cementation: Gemini 3 Flash → Claude Sonnet 4.6. DSD image-edit: Nano Banana 2 → Gemini 3 Pro Image. Analysis: Gemini 3.1 Pro → Claude Sonnet 4.6 |
| **Circuit breaker** | 5 falhas consecutivas → bloqueia 60s |
| **Fail-closed** | Validações safety-critical rejeitam em caso de erro |

## Prompts

4 definições em `_shared/prompts/definitions/`:

| Prompt | Provider | Modo | Model |
|--------|----------|------|-------|
| `analyze-dental-photo` | Gemini + Claude fallback | vision-tools | gemini-3.1-pro (primary) / claude-sonnet-4-6 (fallback) |
| `dsd-simulation` | Gemini | image-edit | NB2 (primary) / gemini-3-pro-image (fallback) |
| `recommend-resin` | Gemini + Claude fallback | text-tools | gemini-3-flash (primary) / claude-sonnet-4-6 (fallback) |
| `recommend-cementation` | Gemini + Claude fallback | text-tools | gemini-3-flash (primary) / claude-sonnet-4-6 (fallback) |

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
*Atualizado: 2026-03-10*
