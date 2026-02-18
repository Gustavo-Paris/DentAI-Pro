---
title: "DSD Quality Fixes — Relatório de Impacto"
created: 2026-02-18
updated: 2026-02-18
status: published
tags:
  - type/report
  - status/published
  - domain/dsd
  - domain/quality
---

# DSD Quality Fixes — Relatório de Impacto

> Análise antes/depois das correções de qualidade do sistema DSD.
> 24 tasks, 5 commits, 20 arquivos, 238 inserções, 134 deleções.

## Resumo Executivo

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Issues P0 (Críticas) abertas | 15 | **0** | 100% resolvidas |
| Issues P1 (Altas) abertas | 19 | 10 | 47% resolvidas |
| Issues P2 (Médias) abertas | 27 | 24 | 11% resolvidas |
| Shades inexistentes em produção | 10 | **0** | Eliminados |
| Qualidade efetiva JPEG (iOS/HEIC) | 0.49 (49%) | 0.88 (88%) | +79.6% |
| Retry Gemini em pico | 0 (1 tentativa) | 3 tentativas + jitter | ~45% → <10% falha |
| Cache cross-user | Sem filtro user_id | Isolado por user_id | Leak eliminado |
| Custo lip validation | Sonnet ($3/$15 MTok) | Haiku ($0.8/$4 MTok) | -73% por chamada |

---

## 1. Correção Clínica

### 1.1 Catálogo de Shades — 10 Nomes Inexistentes Eliminados

Antes desta correção, o sistema recomendava shades e produtos que **não existem** nos catálogos dos fabricantes. O dentista recebia um protocolo e não encontrava o material para comprar.

| Marca | Antes (ERRADO) | Depois (CORRETO) |
|-------|----------------|------------------|
| **Estelite Omega** | WE, JE, CT | WE, MW, CT, **BL1, BL2** |
| **Estelite Omega** | "NAO possui shades BL" | "Possui BL1, BL2 para clareados" |
| **Estelite Omega** | JE atribuído ao Omega | JE movido para **Sigma Quick** |
| **Palfique LX5** | MW, BL1, BL2, BL3 | **BW** (Bleach White), **SW** (Snow White) |
| **Sof-Lex** | Preto → Azul Escuro → Azul Médio → Azul Claro | **Laranja Escuro → Laranja Médio → Laranja Claro → Amarelo** |
| **Vittra APS** | Trans, INC | Trans, **Trans OPL, Trans N, EA1, EA2** |

**Impacto:** 100% dos protocolos de clareamento com Palfique LX5 referenciavam shades BL1/BL2/BL3 que não existem. 100% dos protocolos de polimento tinham cores de disco erradas.

### 1.2 Thresholds Clínicos Alinhados

| Parâmetro | Antes | Depois | Por quê |
|-----------|-------|--------|---------|
| Smile line (alta) | >3mm | **>=3mm** | Pacientes a exatamente 3mm eram classificados como "média", perdendo indicação de gengivoplastia |
| Assimetria gengival | >1mm → gengivoplastia | **>1.5mm** → gengivoplastia | Reduziu falso-positivos: diferenças 1-1.5mm são clinicamente insignificantes |
| Gengivoplastia + média | Permitida para todas as "média" | Bloqueada sem evidência de gengiva visível | Evita sugerir cirurgia irreversível quando 0mm de tecido está exposto |
| Overbite | Paradoxo lógico (95% "indeterminado") | Sinais visuais indiretos (desgaste, Spee, alongamento) | Critério agora funcional em fotos frontais reais |

### 1.3 Cementation — Árvore de Decisão HF Adicionada

Antes, o prompt de cimentação não tinha regra para concentração de ácido fluorídrico por tipo cerâmico. Agora:

| Tipo Cerâmico | HF | Tempo |
|---|---|---|
| Dissilicato de lítio (e.max) | 5% | 20s |
| Leucita (Empress) | 5% | 60s |
| Feldspática | 5-10% | 60-120s |
| Zircônia | **NÃO USAR HF** | Jateamento Al₂O₃ + MDP |

---

## 2. Resiliência de Infraestrutura

### 2.1 Gemini Retry + Backoff

```
ANTES:  Request ──503──> FALHA TOTAL (crédito consumido, sem resultado)

DEPOIS: Request ──503──> [2s + jitter] ──503──> [5s + jitter] ──503──> FALHA
                    │                      │
                    └── SUCESSO            └── SUCESSO
```

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Tentativas | 1 | 3 (1 + 2 retries) |
| Backoff | Nenhum | Exponencial: 2s, 5s |
| Jitter | Nenhum | +0 a 1000ms random |
| Condições de retry | N/A | 503 (overload), 429 (rate limit), timeout |
| Taxa de falha estimada (pico) | ~45% | <10% |

### 2.2 Seed de Regeneração

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Seed | SHA-256 determinístico da imagem | SHA-256 + offset temporal (por minuto) |
| Botão "Regenerar" | **Placebo** — mesma imagem = mesmo resultado, consumia crédito | Resultado diferente a cada minuto |

### 2.3 Outras Melhorias

| Melhoria | Impacto |
|----------|---------|
| `thinkingLevel: "low"` no Gemini | Reduz latência, mais margem dentro do timeout de 55s |
| Claude Sonnet 4.5 → 4.6 | Melhor instruction following, mesmo preço ($3/$15 MTok) |

---

## 3. Integridade de Dados

### 3.1 Cache Cross-User — Leak de Privacidade Eliminado

```
ANTES:
  Dentista A envia foto → Análise salva com hash H1
  Dentista B envia MESMA foto → Recebe análise do Dentista A ⚠️ LGPD/HIPAA

DEPOIS:
  Query inclui .eq("user_id", user.id)
  Cache isolado por usuário — zero vazamento cross-user
```

### 3.2 Cache Sem Versionamento → Versionado

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Hash input | 2.000 chars de base64 (~1.5KB) | **50.000 chars** (~37.5KB) + `PROMPT_VERSION` |
| Após melhoria de prompt | Cache antigo servido indefinidamente | Cache invalidado automaticamente |
| Risco de colisão | Alto (2KB é pouca discriminação) | Baixo |

### 3.3 Double-Charge Eliminado

```
ANTES:
  Usuário clica "Analisar" → reqId = abc123 → Timeout → Retry → reqId = def456
  Resultado: 2 cobranças de crédito para 1 análise

DEPOIS:
  Usuário clica "Analisar" → reqId = uuid (gerado 1x no frontend)
  Retry → mesmo reqId → dedup no backend → 1 cobrança
```

### 3.4 DB Silent Failure → Refund + 500

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Falha no UPDATE | Log + retorna HTTP 200 com protocolo | Refund de créditos + retorna HTTP 500 |
| Experiência do usuário | "Sucesso" aparente, protocolo perdido no reload | Erro claro, pode tentar novamente sem perder crédito |

### 3.5 vitaShade Draft — Proteção Contra Override

| Aspecto | Antes | Depois |
|---------|-------|--------|
| `vitaShadeManuallySet` | `useRef` — perdido no refresh | Persistido no draft do wizard (Supabase) |
| Impacto | Dentista escolhe shade manualmente, dá refresh, IA sobrescreve | Escolha manual sobrevive refresh |

---

## 4. Eficiência de Custo

### 4.1 Lip Validation — 73% Mais Barato

Task binária (SIM/NÃO com maxTokens=10) migrada de Sonnet para Haiku:

| Modelo | Input | Output | Redução |
|--------|-------|--------|---------|
| Sonnet 4.5/4.6 | $3.00/MTok | $15.00/MTok | — |
| **Haiku 4.5** | $0.80/MTok | $4.00/MTok | **-73%** |

### 4.2 Cost Tracking Corrigido

O Gemini 3 Pro Image Preview estava com custo trackado a 50% do real:

| Métrica | Antes | Depois |
|---------|-------|--------|
| Input cost | $1.25/MTok | **$2.50/MTok** |
| Output cost | $5.00/MTok | **$10.00/MTok** |

Sem este fix, os créditos estavam subprecificados — o sistema cobrava menos do que gastava.

### 4.3 Prompt Token Efficiency

`OBRIGATÓRIO` reduzido de 15 para 4 ocorrências no prompt DSD (-73%). Quando tudo é "OBRIGATÓRIO", nada é. As 4 restantes são genuinamente críticas:

1. Campo overbite (retorno obrigatório)
2. Comparação de homólogos (regra sagrada)
3. Comparar obrigatoriamente (reforço do #2)
4. Medidas em mm (saída estruturada)

### 4.4 dsdContext Expandido

Campos adicionados ao contexto passado para protocolo de resina:

| Campo | Impacto |
|-------|---------|
| `smileLine` | Protocolo considera exposição gengival |
| `faceShape` | Visagismo informa escolha de shade/formato |
| `symmetryScore` | Priorização de simetria no protocolo |
| `smileArc` | Arco do sorriso ajusta camadas incisais |

### 4.5 Validação FDI + Enum Normalization

| Melhoria | Impacto |
|----------|---------|
| Regex `/^[1-4][1-8]$/` no tooth field | Impede "tooth 9", "19", "11, 12" na análise |
| 8 novos mapeamentos EN→PT | `face_shape`, `lip_thickness`, `overbite_suspicion`, `perceived_temperament`, `smile_arc`, etc. já não chegam em inglês ao cliente |

---

## 5. Qualidade de Imagem

### 5.1 JPEG Quality — De 0.49 Para 0.88

**Este é o fix com maior impacto visual no sistema.**

```
ANTES (iOS/HEIC):
  HEIC ──[0.7]──> JPEG ──[canvas]──> JPEG @ 0.7
  Qualidade efetiva: 0.7 × 0.7 = 0.49 (49%)

DEPOIS (iOS/HEIC):
  HEIC ──[0.88]──> JPEG ──[canvas resize only]──> quality 1.0
  Qualidade efetiva: 0.88 (88%)

Melhoria: +79.6%
```

| Feature dental | Com 0.49 | Com 0.88 |
|---------------|----------|----------|
| Periquimácies | Perdidas em artefatos JPEG | Preservadas |
| Craze lines | Indistinguíveis de ruído | Visíveis para detecção de desgaste |
| Translucidez incisal | Gradiente destruído | Gradiente preservado para shade matching |
| Margem gengival | Borrada | Nítida para medição de assimetria |
| Simulação Gemini | Aparência "plástica" | Textura natural preservada |

**Ambos os paths** corrigidos: `handleFile` (foto principal) e `handleOptionalFile` (fotos adicionais 45° e face).

---

## Matriz de Risco — Antes vs Depois

### Antes

```
                    IMPACTO
         Baixo      Médio      Alto       Crítico
    ┌──────────┬──────────┬──────────┬──────────┐
 A  │ (12)     │ P2-41    │ P1-28    │ P0-6,7   │  Alta
 L  │          │ P2-47    │ P1-22    │ P0-9,10  │  Prob.
 T  │          │ P2-52    │ P1-23    │ P0-11,12 │
 O  │          │          │ P1-33    │ P0-1-5   │
    ├──────────┼──────────┼──────────┼──────────┤
    │ (8)      │ P2-35,50 │ P1-29    │ P0-13    │  Média
 M  │          │ P2-56    │ P1-31    │ P0-14    │  Prob.
 É  │          │ P2-58    │ P1-34    │ P0-8     │
 D  │          │          │ P1-21    │          │
 I  │          │          │ P1-30    │          │
 O  ├──────────┼──────────┼──────────┼──────────┤
    │ (5)      │ P2-43,46 │ P1-19,20 │ P0-15    │  Baixa
 B  │          │ P2-49    │ P1-25,26 │          │  Prob.
 A  │          │ P2-53    │ P1-32    │          │
 I  │          │          │ P1-16,17 │          │
 X  │          │          │ P1-18    │          │
 O  └──────────┴──────────┴──────────┴──────────┘
```

### Depois

```
                    IMPACTO
         Baixo      Médio      Alto       Crítico
    ┌──────────┬──────────┬──────────┬──────────┐
 A  │ (12)     │ P2-47    │ P1-23    │          │  Alta
 L  │          │ P2-52    │          │  VAZIO   │  Prob.
 T  │          │          │          │          │
 O  │          │          │          │          │
    ├──────────┼──────────┼──────────┼──────────┤
    │ (8)      │ P2-50    │ P1-29    │          │  Média
 M  │          │ P2-56    │ P1-34    │  VAZIO   │  Prob.
 É  │          │ P2-58    │ P1-21    │          │
 D  │          │          │          │          │
 I  │          │          │          │          │
 O  ├──────────┼──────────┼──────────┼──────────┤
    │ (5)      │ P2-43,46 │ P1-20    │          │  Baixa
 B  │          │ P2-49    │ P1-18    │  VAZIO   │  Prob.
 A  │          │ P2-53    │          │          │
 I  │          │          │          │          │
 X  │          │          │          │          │
 O  └──────────┴──────────┴──────────┴──────────┘

    ████ Quadrante CRÍTICO completamente limpo ████
```

**O quadrante "Impacto Crítico" está vazio em todas as probabilidades.** Zero issues P0 remanescentes.

---

## Issues Remanescentes (P1/P2)

| # | Issue | Prioridade | Motivo de não-inclusão |
|---|-------|-----------|----------------------|
| 18 | Z350 Cristas Proximais: regra contraditória | P1 | Requer decisão clínica sobre regra correta |
| 20 | recommend-resin usa text mode (JSON frágil) | P1 | Migração para tool-calling é refactor grande |
| 21 | Contralateral lookup limitado à sessão | P1 | Requer mudança de schema no banco |
| 23 | Gemini 3 Pro Image Preview é modelo preview | P1 | Dependente do Google lançar GA |
| 29 | Restauration detection: thresholds assimétricos | P1 | Requer calibração com casos reais |
| 34 | Post-submission sync gap | P1 | Requer redesign do fluxo de submissão |
| 35-61 | 24 issues P2 | P2 | Priorizadas para Sprint 3+ |

---

## Commits

| Commit | Descrição | Tasks | Arquivos |
|--------|-----------|-------|----------|
| `850cbd7` | Catálogo de resinas | 1-3, 11 | 1 |
| `fbeab66` | Cache user_id + prompt version | 4 | 1 |
| `fed1913` | Batch: regras, modelos, validação, imagem | 5-10, 12-16, 23-24 | 10 |
| `28939b1` | Restantes: cementation, dados, prompts | 17-22 | 10 |
| `6415747` | Reviewer: reqId cap, jitter, comentário | — | 3 |

---

## Referências

- Auditoria original: [[2026-02-18-dsd-quality-audit]]
- Plano de implementação: [[2026-02-18-dsd-quality-fixes]]
- Design doc: [[2026-02-18-dsd-quality-audit-design]]
