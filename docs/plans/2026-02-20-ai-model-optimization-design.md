---
title: AI Model Optimization — Design
created: 2026-02-20
updated: 2026-02-20
status: draft
tags:
  - type/design
  - ai/models
  - clinical/reliability
---

# AI Model Optimization Design

> Análise de modelos de IA e otimização de fallbacks para confiabilidade clínica.

## Contexto

Sistema clínico odontológico (AURIA/ToSmile.ai) com 6 funções de IA em produção.
Motivação: acurácia clínica, latência/UX, qualidade de simulações de imagem, fallbacks inconsistentes.

## Mapa Atual (Fev 2026)

| Função Clínica | Modelo | Modo | Temp | Fallback |
|---|---|---|---|---|
| Análise de foto dental | Claude Sonnet 4.6 | Vision + Tool-calling | 0.0 | Nenhum |
| Análise DSD (proporções) | Claude Sonnet 4.6 | Vision + Tool-calling | 0.0 | Sonnet 4.5 (529) |
| Smile Line Classifier | Claude Haiku 4.5 | Vision (texto) | 0.0 | Resultado Sonnet (dual-pass) |
| Recommend Resin | Claude Haiku 4.5 | Tool-calling | 0.0 | Nenhum |
| Recommend Cementation | Claude Haiku 4.5 | Tool-calling | 0.0 | Nenhum |
| DSD Simulation | Gemini 3 Pro Image | Image Edit | 0.4 | Nenhum (fail graceful) |

## Análise por Função

### 1. Photo Analysis + DSD Analysis (Claude Sonnet 4.6) — MANTER

- Sonnet 4.6 é o melhor custo/benefício para visão clínica (MMMU 74.2%, MMMU Pro 75.6%)
- Estudo dez/2025 (*Scientific Reports*) mostrou Gemini 2.5 Pro sem ganho em imagens médicas orais
- Opus 4.6 tem maior ceiling de raciocínio mas TTFT de 1.88s vs 0.64s — risco de timeout em edge functions (60s)
- **Gap:** Photo Analysis não tem fallback (primeira interação do usuário)

### 2. Protocol Functions — Resin + Cementation (Claude Haiku 4.5) — MANTER

- Haiku 4.5: 109 t/s, TTFT 0.52s, ~5s por protocolo — headroom confortável
- Não existe Haiku 4.6; melhor modelo da linha para velocidade + tool-calling
- `forceFunctionName` garante JSON estruturado
- **Gap:** Sem fallback — Haiku sobrecarregado = dentista parado

### 3. Smile Line Classifier (Claude Haiku 4.5) — MANTER

- Dual-pass paralelo + override numérico (>=3mm = alta) é robusto
- Arquitetura compensa imprecisões do modelo

### 4. DSD Simulation (Gemini 3 Pro Image) — MANTER + ADICIONAR FALLBACK

- Gemini 3 Pro Image: World Simulator engine, forte em inpainting
- **Problema crítico:** sem fallback, sem provider alternativo
- **FLUX Kontext Pro** (Black Forest Labs): superior em identity preservation em testes head-to-head
- Gemini perdeu consistência facial em edits complexos; FLUX manteve identidade

## Decisão: Abordagem B (Otimizada)

### Mudanças Planejadas

#### 4.1 Fallback em Photo Analysis
- Adicionar fallback `claude-sonnet-4-5-20250929` (mesmo pattern do DSD Analysis)
- Trigger: erro 529 (overload) ou timeout
- Implementação: reusar `callClaudeVisionWithTools` existente com model param

#### 4.2 Fallback em Protocol Functions (Resin + Cementation)
- Adicionar fallback Haiku → Sonnet 4.6 se Haiku falhar
- Trigger: erro 529, 500, timeout após retries
- Trade-off: Sonnet é 2x mais lento mas ainda dentro dos 60s

#### 4.3 FLUX Kontext Pro como fallback de DSD Simulation
- Primário: Gemini 3 Pro Image (mantém)
- Fallback: FLUX Kontext Pro via Black Forest Labs API
- Trigger: Gemini 503/timeout após retries
- Requer: nova integração API, secret `BFL_API_KEY`
- Identity preservation superior em FLUX = melhor fallback que "null"

#### 4.4 Padronizar Circuit Breaker
- Garantir pattern consistente em todas as 6 funções:
  - Retry com backoff exponencial
  - Fallback para modelo alternativo
  - Fail graceful como último recurso (nunca crash)

### O Que NÃO Mudar

- Não migrar para Opus 4.6 (risco de timeout)
- Não adicionar GPT-5.2 como terceiro provider (over-engineering)
- Não trocar Haiku por GPT-4.1-mini (sendo descontinuado)
- Não trocar Gemini por FLUX como primário (Gemini é bom quando funciona)

## Modelos de Referência (Fev 2026)

| Modelo | Velocidade | TTFT | Custo (in/out per 1M) | Uso em AURIA |
|---|---|---|---|---|
| Claude Opus 4.6 | 66-73 t/s | 1.88s | $5/$25 | Não usar (timeout risk) |
| Claude Sonnet 4.6 | 57 t/s | 0.64s | $3/$15 | Primário: photo, DSD |
| Claude Sonnet 4.5 | ~55 t/s | ~0.7s | $3/$15 | Fallback: photo, DSD |
| Claude Haiku 4.5 | 109 t/s | 0.52s | $0.80/$4.00 | Primário: resin, cementation, smile-line |
| Gemini 3 Pro Image | ~3-5s | N/A | Pay per image | Primário: DSD simulation |
| FLUX Kontext Pro | ~5-10s | N/A | Pay per image | Fallback: DSD simulation |

## Fontes

- Scientific Reports (dez/2025): Vision-based diagnostic gain of ChatGPT-5 and Gemini 2.5 Pro in oral lesion assessment
- Artificial Analysis: Claude model benchmarks (fev/2026)
- Nexxant: AI Image Model Comparison — FLUX vs Gemini identity preservation
- Anthropic: Claude Sonnet 4.6, Opus 4.6 announcements

## Links

- [[06-ADRs/ADR-Index|ADR Index]]
- [[plans/2026-02-18-dsd-quality-audit|DSD Quality Audit]]
- [[plans/2026-02-13-claude-migration-design|Claude Migration Design]]
