---
title: "Design: Correções de Feedback do Especialista"
created: 2026-02-17
updated: 2026-02-17
status: approved
tags:
  - type/design
  - status/approved
---

# Design: Correções de Feedback do Especialista

## Contexto

Especialista clínico revisou o sistema e identificou problemas recorrentes em 3 áreas:
1. **DSD Analysis** — falhas na detecção de resinas insatisfatórias e falso positivo de gengivoplastia
2. **DSD Simulation** — não corrige defeitos em caninos, qualidade inconsistente
3. **Protocolo de Estratificação** — sugere materiais/shades que não existem ou são inadequados

## A. Smile Line Classifier — Fix threshold

**Problema**: O numeric override em `smile-line-classifier.ts:70` força "alta" quando `gingival_exposure_mm >= 2`, mas a definição clínica no prompt diz `>3mm = alta`. Resultado: falso positivo de gengivoplastia em casos com 2mm de exposição (clinicamente "média").

**Correção**:
- `smile-line-classifier.ts:70`: alterar threshold de `>= 2` para `>= 3`
- `clinical-rules.ts` GINGIVAL_CRITERIA: confirmar que o threshold é consistente (`>=3mm = alta`)
- Prompt do classificador Haiku: reforçar que papilas entre dentes ≠ gengiva acima dos dentes

## B. DSD Analysis — Melhorar detecção

**Problema 1**: Critérios ultra-conservadores para detecção de restaurações existentes exigem 4 sinais simultâneos. Resinas pigmentadas/lascadas com interface sutil não são detectadas.

**Correção**: Relaxar para 2 de 4 critérios. Adicionar critérios específicos para pigmentação marginal e lascamento.

**Problema 2**: Linha 101 do `dsd-analysis.ts` bloqueia reclassificação se análise clínica anterior classificou como "íntegro". Mas a análise clínica pode perder problemas que o DSD (com visão mais ampla) detecta.

**Correção**: Tornar condicional — DSD pode adicionar achados NÃO detectados na análise clínica, mas não pode contradizer achados POSITIVOS.

**Problema 3**: Comparação de homólogos (largura dos centrais) está enterrada em prompt de ~320 linhas.

**Correção**: Mover seção de comparação de homólogos para mais perto do topo. Adicionar exemplo concreto.

## C. DSD Simulation — Corrigir caninos

**Problema**: `buildBaseCorrections()` diz genericamente "preencher lascas", mas Gemini não prioriza caninos fraturados.

**Correção**: Adicionar instrução explícita em `buildBaseCorrections()`:
- "Corrigir arestas incisais fraturadas/irregulares de caninos (13/23) — restaurar contorno pontudo natural do canino"
- Listar defeitos de bordo incisal como prioridade alta

## D. Protocolo de Estratificação — Hardcoded validation

**Problema 1**: Validação de cristas só avisa (alert) mas não corrige o material.

**Correção**: `shade-validation.ts` — quando cristas usa produto não permitido, substituir automaticamente por Harmonize XLE (ou Empress BL-L se Harmonize indisponível no inventário).

**Problema 2**: Zero validação para camadas de dentina/corpo e esmalte vestibular.

**Correção**: Novos blocos de validação em `shade-validation.ts`:
- Dentina/corpo: proibir shades de esmalte (WE/A1E/CT/BL1) → substituir por WB ou DA1
- Esmalte vestibular: proibir shades translúcidas (CT/GT/Trans) → forçar WE ou MW
- Proibir BL1 em qualquer camada Z350 (reforço da validação existente)

**Problema 3**: Validação de BL1/Z350 pode falhar se `resin_catalog` não tiver rows para Z350.

**Correção**: Verificar DB. Se rows faltam, adicionar. Adicionar fallback na validação para caso lineRows esteja vazio.

## E. Share Link — Resiliência (baixa prioridade)

**Problema**: Erro intermitente ao gerar link.

**Correção**: Adicionar 1 retry com delay 2s no `getOrCreateShareLink()`.

## Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/generate-dsd/smile-line-classifier.ts` | Threshold ≥2mm → ≥3mm |
| `supabase/functions/_shared/prompts/shared/clinical-rules.ts` | Alinhar threshold |
| `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts` | Relaxar detecção, mover homólogos |
| `supabase/functions/_shared/prompts/definitions/dsd-simulation.ts` | Caninos em baseCorrections |
| `supabase/functions/_shared/prompts/definitions/recommend-resin.ts` | Reforçar regras (se necessário) |
| `supabase/functions/recommend-resin/shade-validation.ts` | Fix cristas + nova validação dentina/esmalte |
| `apps/web/src/data/evaluations.ts` | Retry no getOrCreateShareLink |

## Riscos

- Relaxar detecção de restaurações pode gerar falsos positivos (recomendar substituição de dente íntegro). Mitigação: manter linguagem conservadora ("considerar avaliação").
- Subir threshold de 2mm para 3mm pode perder casos reais de sorriso gengival moderado. Mitigação: o prompt do classificador já tem bias para "alta" em caso de dúvida.
- Forçar substituição de materiais no protocolo pode gerar combinações incomuns se inventário for limitado. Mitigação: respeitar inventário disponível ao substituir.
