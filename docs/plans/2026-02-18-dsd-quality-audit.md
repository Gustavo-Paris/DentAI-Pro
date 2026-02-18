---
title: "DSD Quality Audit — Relatório Consolidado"
created: 2026-02-18
updated: 2026-02-18
status: published
tags:
  - type/audit
  - status/published
  - domain/dsd
  - domain/quality
---

# DSD Quality Audit — Relatório Consolidado

> Auditoria crítica extrema de qualidade do sistema DSD (Digital Smile Design).
> 6 agentes, 5 camadas, 60+ issues identificadas.

## Executive Summary

O sistema DSD é arquiteturalmente sofisticado e demonstra maturidade clínica considerável. O dual-pass classifier, pipeline de 3 camadas de simulação, credit atomicity, e safety nets defensivos mostram engenharia madura. No entanto, a auditoria encontrou **15 issues P0 críticas**, **19 issues P1 altas**, e dezenas de P2/P3, distribuídas em:

1. **Catálogo de resinas com erros factuais** — shades inexistentes (Estelite Omega WE, Palfique LX5 BL1/BL2/BL3), proibições falsas (Omega BL), atribuições à linha errada (JE), sequência Sof-Lex com cores erradas
2. **Infraestrutura Gemini frágil** — modelo preview com 45% de erro em pico, sem retry, sem circuit breaker, sem fallback
3. **Cache de análise sem versionamento** — prompts melhorados não atingem pacientes com cache existente
4. **Compressão de imagem agressiva** — JPEG 0.7 destrói micro-textura dental antes da IA ver
5. **Claude Sonnet 4.5 desatualizado** — 4.6 lançado 17/02/2026, mesmo preço, melhor qualidade

---

## Issues P0 — Críticas (Requerem Ação Imediata)

### Catálogo de Materiais (5 issues)

| #   | Issue                                                                                                                                                                      | Arquivo                      | Impacto                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------ |
| 1   | **Estelite Omega NÃO tem shade WE** — WE é do Sigma Quick. O prompt gera "Estelite Omega WE" que não existe no catálogo Tokuyama                                           | `recommend-resin.ts:399`     | Dentista não encontra o shade para comprar                         |
| 2   | **Palfique LX5 NÃO tem BL1/BL2/BL3** — os shades de bleach são BW (Bleach White) e SW (Snow White)                                                                         | `recommend-resin.ts:402`     | Shade inexistente em todo protocolo de clareamento com Palfique    |
| 3   | **Estelite Omega TEM shades BL** — a proibição "Estelite Omega NAO possui shades BL" é FALSA. Omega tem BL1 e BL2 confirmados pelo fabricante                              | `recommend-resin.ts:148-149` | Sistema rejeita shades válidos, força troca desnecessária de marca |
| 4   | **JE (Jewel Enamel) atribuído à linha errada** — JE é shade do Estelite Sigma Quick, não do Estelite Omega                                                                 | `recommend-resin.ts:141,399` | Dentista procura JE no catálogo Omega e não encontra               |
| 5   | **Sequência de cores Sof-Lex está ERRADA** — prompt diz "Preto → Azul Escuro → Azul Médio → Azul Claro". Real 3M: Laranja Escuro → Laranja Médio → Laranja Claro → Amarelo | `recommend-resin.ts:457-462` | Dentista não identifica os discos corretos                         |

### Infraestrutura Gemini (3 issues)

| # | Issue | Arquivo | Impacto |
|---|-------|---------|---------|
| 6 | **`callGeminiImageEdit` sem retry/circuit breaker** — função bypassa `makeGeminiRequest`. Gemini 3 Pro Preview tem 45% de erro em pico. Um único 503 mata a simulação | `gemini.ts:761-879` | ~45% das simulações falham em horário de pico |
| 7 | **Análise DSD + Simulação sequencial excede 60s** — análise (~40s) + simulação (~25s) = 65s, excedendo o hard limit do Supabase | `generate-dsd/index.ts` | Timeout em requests não-cacheados |
| 8 | **Seed determinístico impede regeneração** — SHA-256 do mesmo input + temperature 0.0 = output idêntico. Botão "regenerar" é placebo que consome créditos | `simulation.ts:257-262` | UX enganosa, crédito desperdiçado |

### Qualidade de Imagem (2 issues)

| # | Issue | Arquivo | Impacto |
|---|-------|---------|---------|
| 9 | **Dupla compressão JPEG para HEIC (iOS)** — HEIC → JPEG 0.7 → canvas → JPEG 0.7. Dupla compressão lossy antes do Gemini ver | `PhotoUploadStep.tsx:48-52` + `imageUtils.ts` | Artefatos visíveis em superfícies dentárias |
| 10 | **JPEG quality 0.7 destrói micro-textura dental** — periquimácies, craze lines, translucidez incisal perdidas antes da IA processar. Prompt pede para Gemini preservar o que já foi destruído | `imageUtils.ts:8` | Simulações parecem "plásticas", sem naturalidade |

### Cache (2 issues)

| # | Issue | Arquivo | Impacto |
|---|-------|---------|---------|
| 11 | **Cache sem prompt version** — hash usa só os primeiros 2000 chars da imagem. Melhorias de prompt (commits 458dcaf, a9a5f3, d94c2ed) são invisíveis para pacientes cacheados | `generate-dsd/index.ts:116-118` | Análises desatualizadas servidas indefinidamente |
| 12 | **Cache cross-user sem `user_id`** — a query de cache não filtra por usuário. Mesma imagem entre dentistas compartilha análise | `generate-dsd/index.ts:130-143` | Privacy leak + integridade clínica comprometida |

### Regras Clínicas (3 issues)

| # | Issue | Arquivo | Impacto |
|---|-------|---------|---------|
| 13 | **Smile line: >3mm vs >=3mm** — `dsd-analysis.ts` usa ">3mm = alta" enquanto `clinical-rules.ts` e classifier usam ">=3mm = alta". Exatamente 3mm cria churn de reclassificação | `dsd-analysis.ts:37` | Override desnecessário, observação espúria na análise |
| 14 | **Gengivoplastia permitida com 0mm de tecido visível** — smile_line "média" pode ter 0mm de gengiva exposta, mas post-processing só bloqueia gengivoplastia para "baixa" | `post-processing.ts:38-48` | Sugere cirurgia irreversível sem ver o tecido |
| 15 | **Overbite impossível de detectar em fotos padrão** — critério exige inferiores "claramente visíveis" E superiores cobrindo >2/3. Paradoxo: se >2/3 cobertos, inferiores não são visíveis | `dsd-analysis.ts:64-78` | Campo retorna "indeterminado" em 95%+ dos casos |

---

## Issues P1 — Altas (Próximo Sprint)

### Catálogo/Protocolos

| # | Issue | Impacto |
|---|-------|---------|
| 16 | **Vittra APS "INC" não existe** — shade real é Trans OPL / Trans N / EA1 | Shade inexistente |
| 17 | **Palfique LX5 "MW" não existe** — MW é shade do Estelite Omega | Cross-contaminação de linhas |
| 18 | **Z350 Cristas Proximais: regra contraditória** — tabela proíbe, texto permite WE, validação permite WE | AI comportamento imprevisível |
| 19 | **HF concentration ausente no prompt de cimentação** — sem decisão 5% vs 10% por tipo cerâmico | Protocolo pode ser clinicamente incorreto |
| 20 | **recommend-resin usa text mode (JSON frágil)** — parsing de markdown code block com regex fallback | Erros de parsing em produção |
| 21 | **Contralateral lookup limitado à sessão** — tratamento do 11 em Sessão A não é encontrado ao tratar 21 em Sessão B | Protocolos assimétricos entre homólogos |

### Modelos de IA

| # | Issue | Impacto |
|---|-------|---------|
| 22 | **Claude Sonnet 4.5 desatualizado** — 4.6 lançado 17/02/2026, mesmo preço ($3/$15 MTok), melhor instruction following | Qualidade subótima em prompts complexos |
| 23 | **Gemini 3 Pro Image Preview é modelo preview sem GA** — pode ser descontinuado a qualquer momento. Sem fallback definido | Risco de indisponibilidade total |
| 24 | **Cost tracking do Gemini 16-24x subestimado** — metrics.ts usa $0.00125 input, real é $2.00/MTok | Revenue leak, créditos subprecificados |
| 25 | **Lip validation usa Sonnet para task binária** — SIM/NÃO com maxTokens=10, Haiku faria 3.75x mais barato | Custo desnecessário |
| 26 | **Sem `thinkingLevel` no Gemini image edit** — pode defaultar para "high", consumindo latência dentro do timeout de 55s | Risco de timeout |

### Validação

| # | Issue | Impacto |
|---|-------|---------|
| 27 | **DSD tooth field aceita qualquer string** — sem validação FDI. "tooth 9", "19", "11, 12" passam pela schema Zod | Sugestões corrompidas na simulação |
| 28 | **Enum normalization incompleta** — lip_thickness, overbite, face_shape, temperament sem mapeamento EN→PT | Valores em inglês chegam ao cliente |
| 29 | **Restauration detection: thresholds assimétricos** — analyze-photo exige 1 sinal, dsd-analysis exige 2+. Mesmo dente pode ter diagnósticos conflitantes | Falso positivo em uma pipeline lock o resultado na outra |

### Fluxo de Dados

| # | Issue | Impacto |
|---|-------|---------|
| 30 | **vitaShadeManuallySetRef não persiste no draft** — refresh da página perde a proteção contra override de shade | Shade manual sobrescrito pela IA |
| 31 | **Double-charge em retry após timeout** — reqId gerado por request, novo request = novo reqId = nova cobrança | Usuário cobrado em dobro |
| 32 | **Silent DB write failure em recommend-cementation** — update falha, log registra, mas retorna HTTP 200 com protocolo | Protocolo retornado ao cliente mas não persistido |
| 33 | **dsdContext parcial para protocolos** — smile_line, occlusal_plane, face_shape, symmetry_score não passados ao recommend-resin | Protocolo não considera contexto clínico completo |
| 34 | **Post-submission sync gap** — syncGroupProtocols roda 1x na submissão. Dentes adicionados depois não recebem sync | Dentes tardios sem protocolo |

---

## Issues P2 — Médias

| # | Issue | Camada |
|---|-------|--------|
| 35 | Gingival asymmetry 1mm threshold (deveria ser 1.5mm) | L1A |
| 36 | Visagism leaking into suggestion text when no face photo | L1A |
| 37 | Treatment hierarchy mismatch (clinical-rules vs dsd-analysis) | L1A |
| 38 | Missing: bruxism/wear pattern detection | L1A |
| 39 | Missing: recession classification (Miller/Cairo) | L1A |
| 40 | Missing: implants/prosthetic detection | L1A |
| 41 | "OBRIGATÓRIO" overuse (35+ ocorrências) degrada atenção do modelo | L1A |
| 42 | Golden ratio: métrica não validada apresentada como fato | L1A |
| 43 | Recontorno desgaste vs stratification conflict | L1B |
| 44 | Harmonize shade table incomplete (missing A1E-C2E) | L1B |
| 45 | Budget rules leak Premium resins to AI para "padrão" | L1B |
| 46 | Simulation missing lower arch scenario | L1B |
| 47 | Circuit breaker state lost on Deno cold starts | L2 |
| 48 | DSD prompt size (~10k tokens) increases timeout risk | L2 |
| 49 | Comparison slider `aspect-[4/3]` crops images | L3 |
| 50 | No white balance instruction in simulation prompt | L3 |
| 51 | Compositing box blur (radius=2) shows rectangular seam | L3 |
| 52 | Main thread blocking during compositing | L3 |
| 53 | No fallback model when gemini-3-pro-image-preview unavailable | L3 |
| 54 | Lip validator fail-open (error = accept simulation) | L4 |
| 55 | No min/max on numeric scores (golden_ratio, symmetry) | L4 |
| 56 | Unsanitized AI text in Gemini simulation prompt | L4 |
| 57 | No minimum image size validation | L4 |
| 58 | Rate limit off-by-one (allows N+1 requests) | L4 |
| 59 | SimulationLayer.whitening_level type mismatch ('white' not in type) | L5 |
| 60 | Narrow destructive-keyword filter in simulation | L5 |
| 61 | lip_thickness and overbite_suspicion not used downstream | L5 |

---

## Matriz de Riscos Consolidada

```
                    IMPACTO
         Baixo      Médio      Alto       Crítico
    ┌──────────┬──────────┬──────────┬──────────┐
 A  │ P3-x     │ P2-41    │ P1-28    │ P0-6,7   │  Alta
 L  │ (12)     │ P2-47    │ P1-22    │ P0-9,10  │  Probabilidade
 T  │          │ P2-52    │ P1-23    │ P0-11,12 │
 O  │          │          │ P1-33    │ P0-1-5   │
    ├──────────┼──────────┼──────────┼──────────┤
    │ P3-x     │ P2-35,50 │ P1-29    │ P0-13    │  Média
 M  │ (8)      │ P2-56    │ P1-31    │ P0-14    │  Probabilidade
 É  │          │ P2-58    │ P1-34    │ P0-8     │
 D  │          │          │ P1-21    │          │
 I  │          │          │ P1-30    │          │
 O  ├──────────┼──────────┼──────────┼──────────┤
    │ P3-x     │ P2-43,46 │ P1-19,20 │ P0-15    │  Baixa
 B  │ (5)      │ P2-49    │ P1-25,26 │ P0-7*    │  Probabilidade
 A  │          │ P2-53    │ P1-32    │          │
 I  │          │          │ P1-16,17 │          │
 X  │          │          │ P1-18    │          │
 O  └──────────┴──────────┴──────────┴──────────┘
```

---

## Plano de Ação Priorizado

### Sprint 1 — Críticos (Esta Semana)

**Catálogo de Resinas (1 dia):**
- [ ] Corrigir Estelite Omega shades: remover WE/JE/CT, adicionar EA1/EA2/EA3/EB1/BL1/BL2
- [ ] Corrigir Palfique LX5 shades: remover BL1/BL2/BL3/MW, adicionar BW/SW
- [ ] Remover proibição falsa "Omega NAO possui BL"
- [ ] Mover JE para Estelite Sigma Quick
- [ ] Corrigir Sof-Lex: Laranja Escuro → Laranja Médio → Laranja Claro → Amarelo
- [ ] Corrigir Vittra APS: remover INC, adicionar Trans OPL/Trans N/EA1/EA2
- [ ] Expandir Harmonize shade table com A1E-C2E, XLE

**Infraestrutura Gemini (1 dia):**
- [ ] Adicionar retry + backoff exponencial a `callGeminiImageEdit` (3 tentativas para 503)
- [ ] Adicionar `thinkingConfig: { thinkingLevel: "low" }` ao request Gemini image edit
- [ ] Implementar variação de seed para regeneração (seed ± random offset)

**Cache (0.5 dia):**
- [ ] Incluir `PROMPT_VERSION` no hash source do cache
- [ ] Ampliar hash para 50,000 chars (em vez de 2000)
- [ ] Adicionar `.eq("user_id", user.id)` à query de cache

**Regras Clínicas (0.5 dia):**
- [ ] Alinhar smile line: mudar `dsd-analysis.ts` de ">3mm" para ">=3mm"
- [ ] Adicionar guard no post-processing: se smile_line="média" E gingival_exposure_mm < 1 → strip gengivoplastia
- [ ] Reformular critério de overbite para sinais visuais indiretos

### Sprint 2 — Altas (Próxima Semana)

**Qualidade de Imagem (0.5 dia):**
- [ ] Aumentar JPEG quality de 0.7 para 0.88
- [ ] Corrigir dupla compressão HEIC: converter HEIC → JPEG 0.88, NÃO recomprimir em `compressImage`
- [ ] Adicionar validação mínima de imagem (300x200px)

**Modelos (0.5 dia):**
- [ ] Upgrade Claude Sonnet 4.5 → 4.6 (confirmar model ID exato)
- [ ] Mover lip validation de Sonnet para Haiku 4.5
- [ ] Corrigir cost tracking Gemini em metrics.ts

**Validação (1 dia):**
- [ ] Adicionar `z.string().regex(/^[1-4][1-8]$/)` ao DSDSuggestionSchema.tooth
- [ ] Completar ENUM_MAPPINGS para todos os campos (lip_thickness, overbite, face_shape, etc.)
- [ ] Alinhar restauration detection: 2+ sinais em ambos os prompts
- [ ] Adicionar HF concentration decision tree ao cementation prompt
- [ ] Migrar recommend-resin para tool-calling mode

**Fluxo de Dados (1 dia):**
- [ ] Persistir vitaShadeManuallySet no draft
- [ ] Gerar reqId no cliente para idempotência de retry
- [ ] Tratar DB write failure em recommend-cementation (retornar 500)
- [ ] Expandir dsdContext para incluir smile_line, face_shape, symmetry_score
- [ ] Expandir contralateral lookup para cross-session

### Sprint 3 — Médias (2-4 Semanas)

- [ ] Adicionar fallback model chain para Gemini (Pro → Flash)
- [ ] Mover compositing para Web Worker
- [ ] Implementar Anthropic prompt caching para prompt estático do DSD
- [ ] Upload de L3 composited para Supabase storage (em vez de base64 data URL)
- [ ] Adicionar UI indicator quando lips_moved=true no resultado final
- [ ] Reduzir "OBRIGATÓRIO" a ≤5 usos, usar checklists numerados
- [ ] Adicionar detecção de bruxism pattern, implantes, próteses
- [ ] Corrigir absolutePreservation no gengivoplasty-only prompt
- [ ] Adicionar white balance instruction no simulation prompt
- [ ] Adicionar flag `user_overrode_treatment` na evaluations table

---

## Pontos Fortes do Sistema

1. **Dual-pass smile line classifier** — Haiku paralelo + numeric override + bidirectional text override. Arquitetura robusta.
2. **Pipeline L1→L2→L3** — Single-responsibility por camada (restaurações → clareamento → gengivoplastia). Elegante.
3. **Credit atomicity** — `SELECT FOR UPDATE`, charge-after-success, refund on error. Correto.
4. **Primary-tooth optimization** — 1 AI call por grupo de tratamento, sync para siblings. Eficiente.
5. **Lip validation com Claude Vision** — Quality gate criativo para detectar lip movement.
6. **Conservative bias** — Defaults consistentes para não recomendar procedimentos irreversíveis.
7. **Contralateral enforcement** — Regra SAGRADA de consistência bilateral. Clinicamente correto.
8. **Prompt injection defense** — sanitizeForPrompt no frontend + server-side context sanitization.
9. **Post-processing safety nets** — 5 categorias de correção lógica pós-IA.
10. **Gengivoplasty gating** — Aprovação explícita do paciente antes de L3.

---

## Referências

- Design doc: [[2026-02-18-dsd-quality-audit-design]]
- L1A Report: Audit de prompts de análise (21 issues)
- L1B Report: Audit de prompts de protocolo + simulação (24 issues)
- L2 Report: Audit de modelos de IA + latência (10 issues)
- L3 Report: Audit de simulação visual (13 issues)
- L4 Report: Audit de validação e safety nets (17 issues)
- L5 Report: Audit de fluxo de dados (17 issues)
