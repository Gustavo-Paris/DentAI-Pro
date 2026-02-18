---
title: "DSD Quality Audit — Design Document"
created: 2026-02-18
updated: 2026-02-18
status: approved
tags:
  - type/design
  - status/approved
  - domain/dsd
  - domain/audit
---

# DSD Quality Audit — Design Document

## Objetivo

Auditoria crítica extrema de qualidade do sistema DSD (Digital Smile Design) completo,
cobrindo prompts, modelos de IA, simulação visual, validações e fluxo de dados.

## Metodologia

Abordagem por **camada de IA** — cada componente analisado separadamente por agentes especializados.

## Camadas de Auditoria

### L1: Prompts Clínicos (2 agentes)

**Agente 1A — Prompts de Análise:**
- `dsd-analysis`: Visagismo, proporções, arco do sorriso, corredor bucal
- `analyze-dental-photo`: Detecção de dentes, classificação de cavidades, restaurações
- `smile-line-classifier`: Dual-pass classificação da linha do sorriso
- `clinical-rules.ts`: Regras compartilhadas (VISAGISM_RULES, SMILE_ARC_RULES, etc.)

Critérios: Precisão clínica, contradições internas, completude, ambiguidade, over-engineering.

**Agente 1B — Prompts de Protocolo + Simulação:**
- `recommend-resin`: Catálogo de resinas, estratificação 5 camadas, contralateral
- `recommend-cementation`: Protocolo de cimentação cerâmica
- `dsd-simulation`: Variantes de prompt (reconstruction/restoration/intraoral/standard + layers)

Critérios: Catálogo atualizado, regras lógicas, consistência contralateral, whitening.

### L2: Modelos de IA (1 agente)

Para cada modelo:
- Adequação à tarefa (é o melhor disponível?)
- Alternativas superiores (Claude 4.6, GPT-4o Vision, Gemini 2.5 Pro, etc.)
- Parâmetros (temperature, max_tokens, timeout)
- Análise de latência (tempo médio, gargalos)
- Custo vs qualidade

Modelos auditados:
- Claude Sonnet 4.5 → análise de foto + DSD
- Claude Haiku 4.5 → smile line + protocolos
- Gemini 3 Pro Image Preview → simulação visual

### L3: Simulação Visual (1 agente)

- Qualidade da imagem (realismo, micro-textura, gradiente de cor)
- Preservação de identidade (lábios, gengiva, pele)
- Pipeline 3 camadas (L1→L2→L3): degradação acumulada?
- Limitações do Gemini para edição dental
- Prompt de simulação: instruções respeitadas?
- Latência end-to-end

### L4: Validação & Safety Nets (1 agente)

- Smile line dual-pass: concordância Haiku vs Sonnet
- Numeric override (≥2mm): calibração correta?
- Lip movement detection: precisão
- Lip compositing fallback: qualidade
- Edge cases não cobertos (assimetria facial, gengiva pigmentada, fotos espelho, etc.)
- Validação Zod: completude dos schemas

### L5: Fluxo de Dados (1 agente)

- Perda de informação entre etapas
- Inconsistências (vita_shade AI vs dentista, treatment_indication mutável)
- Credit model: cobranças e refunds
- Cross-evaluation cache: segurança e colisões
- Contralateral sync: cenários com 3+ dentes

## Output Esperado

Documento `docs/plans/2026-02-18-dsd-quality-audit.md` com:
1. Diagnóstico por camada (problemas, severidade, evidência)
2. Matriz de riscos (probabilidade × impacto)
3. Plano de ação priorizado (P0 crítico → P3 nice-to-have)
4. Recomendações de modelos, prompts e validações

## Arquivos-Chave

| Arquivo | Propósito |
|---------|-----------|
| `supabase/functions/_shared/prompts/definitions/*.ts` | Definições de prompts |
| `supabase/functions/_shared/prompts/shared/clinical-rules.ts` | Regras clínicas compartilhadas |
| `supabase/functions/_shared/claude.ts` | Cliente Claude API |
| `supabase/functions/_shared/gemini.ts` | Cliente Gemini API |
| `supabase/functions/generate-dsd/` | Edge function DSD |
| `supabase/functions/analyze-dental-photo/` | Edge function análise de foto |
| `supabase/functions/recommend-resin/` | Edge function protocolo resina |
| `supabase/functions/recommend-cementation/` | Edge function protocolo cimentação |
| `apps/web/src/components/wizard/dsd/useDSDStep.ts` | Hook DSD frontend |
| `apps/web/src/hooks/domain/useWizardFlow.ts` | Orquestração do wizard |
