---
title: "Migração AI: Gemini → Claude Sonnet 4.5"
created: 2026-02-13
updated: 2026-02-13
status: draft
tags: [type/design, domain/ai, priority/high]
---

# Migração AI: Gemini → Claude Sonnet 4.5

## Problema

A análise de foto dental (`analyze-dental-photo`) com Gemini 3 Flash Preview apresenta intermitência na detecção de gengivoplastia. Mesma foto, mesmos parâmetros, resultados diferentes entre runs — inclusive em casos clinicamente óbvios.

**Causa raiz:** Gemini Flash é um modelo menor, otimizado para velocidade. Mesmo com temperature 0.1, a análise gengival (que depende de julgamento visual sutil — proporções, assimetrias >1mm) oscila entre runs. `thinkingLevel: "low"` agrava o problema limitando o raciocínio.

## Decisão

Migrar 4 de 5 edge functions AI para **Claude Sonnet 4.5** (`claude-sonnet-4-5-20250929`). Manter apenas `dsd-simulation` no Gemini 3 Pro (único provider que faz edição/geração de imagem).

### Justificativa

- Claude é superior em raciocínio estruturado e seguir instruções clínicas detalhadas
- Temperature 0.0 no Claude = altamente determinístico
- Um provider para toda lógica = coerência (mesma "mente" analisa e gera protocolo)
- Qualidade > custo (produto clínico onde consistência = confiança do dentista)

## Mapa de Migração

| Edge Function | Antes | Depois |
|---|---|---|
| `analyze-dental-photo` | Gemini 3 Flash (vision-tools) | **Claude Sonnet 4.5** (vision + tool_use) |
| `dsd-analysis` | Gemini 2.5 Pro (vision-tools) | **Claude Sonnet 4.5** (vision + tool_use) |
| `recommend-resin` | Gemini 2.0 Flash (text) | **Claude Sonnet 4.5** (text + tool_use) |
| `recommend-cementation` | Gemini 2.5 Pro (text-tools) | **Claude Sonnet 4.5** (text + tool_use) |
| `dsd-simulation` | Gemini 3 Pro Image (image-edit) | **MANTÉM** (Claude não edita imagens) |

## Arquitetura

### Novo arquivo: `_shared/claude.ts`

Cliente Claude API espelhando a interface do `gemini.ts`:

- `callClaude(model, messages, options)` — text
- `callClaudeVision(model, prompt, imageBase64, mimeType, options)` — vision
- `callClaudeWithTools(model, messages, tools, options)` — text + tool_use
- `callClaudeVisionWithTools(model, prompt, imageBase64, mimeType, tools, options)` — vision + tool_use

Inclui: circuit breaker, retry com backoff, timeout configurável, extração de tokens.

**SDK:** `npm:@anthropic-ai/sdk` (compatível com Deno)
**API Key:** `ANTHROPIC_API_KEY` como Supabase secret

### Tool calling: conversão automática

Edge functions continuam passando tools no formato OpenAI-compatible existente. O `claude.ts` converte internamente:

```
OpenAI format (input):           Claude format (internal):
{ type: "function",              { name: "...",
  function: {                      description: "...",
    name, description,             input_schema: { ... }
    parameters: { ... }          }
  }
}
```

### Mudanças por edge function

Cada uma das 4 funções:
1. Import: `gemini.ts` → `claude.ts`
2. Caller: `callGeminiVisionWithTools` → `callClaudeVisionWithTools`
3. Remove `thinkingLevel` (não existe no Claude)
4. Parsing: Claude `tool_use` content blocks vs Gemini `functionCall`

### Prompt definitions

Instruções sistema/user continuam iguais. Mudanças:
- `model` → `'claude-sonnet-4-5-20250929'`
- `temperature` → `0.0`
- Novo campo: `provider: 'claude' | 'gemini'`

### Metrics

Adicionar pricing Claude em `metrics.ts`:
```ts
'claude-sonnet-4-5-20250929': { input: 0.003, output: 0.015 }
```

## Custo

| Cenário | Gemini (atual) | Claude (novo) |
|---|---|---|
| Por caso (4 dentes) | ~$0.005 | ~$0.05 |
| 1000 casos/mês | ~$5 | ~$50 |

Custo ~10x maior, mas aceitável para produto clínico premium.

## Verificação

1. **Gengivoplastia:** mesma foto executada 5x → todos devem detectar gengivoplastia
2. **Regressão:** casos existentes passados pelo Claude, comparar qualidade
3. **Type check:** `npx tsc --noEmit` em cada edge function
4. **Deploy:** `npx supabase functions deploy <name> --no-verify-jwt --use-docker`
5. **Teste E2E:** wizard completo com caso multi-dente
