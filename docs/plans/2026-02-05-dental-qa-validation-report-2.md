---
title: Relatório QA Dental — Validação E2E Completa (Post-Fixes)
created: 2026-02-05
updated: 2026-02-05
status: published
tags:
  - type/qa-report
  - status/published
---

# Relatório QA Dental — Validação E2E Completa (2026-02-05, #2)

**Data:** 2026-02-05
**Modo:** E2E via Playwright (caso novo com 7 dentes)
**Outputs avaliados:** Análise de Foto, DSD, Protocolo de Cimentação (6 dentes porcelana + 1 encaminhamento)
**Session ID:** `9261127f-2d3d-4cb4-a8da-34f0963ab2a9`

## Resultado: ✅ 3 bugs críticos corrigidos + 2 atenções menores

---

## Parte 1: Bugs Corrigidos Validados

### ✅ Bug 1 — `recommend-cementation` 401 (JWT ES256 vs Relay HS256)

**Bug:** Edge function `recommend-cementation` retornava 401 "Invalid JWT" porque faltava `verify_jwt = false` no `supabase/config.toml`. As outras 4 funções já tinham essa config. O relay do Supabase rejeitava JWTs ES256 (novo formato de auth token).

**Fix aplicado:**
1. Adicionado `[functions.recommend-cementation]` / `verify_jwt = false` ao `config.toml`
2. Redeployado com `npx supabase functions deploy recommend-cementation --no-verify-jwt`

**Evidência:**
- Antes: `POST /functions/v1/recommend-cementation` → 401 `{"code":401,"message":"Invalid JWT"}`
- Depois: `POST /functions/v1/recommend-cementation` → 200 (6/6 chamadas bem sucedidas)

**Status:** ✅ **CORRIGIDO E VALIDADO**

### ✅ Bug 2 — `normalizedTreatment` Temporal Dead Zone (ReferenceError)

**Bug:** `const normalizedTreatment` era usado na linha 682 (insert) mas declarado na linha 715 (antes do switch), causando `Cannot access 'normalizedTreatment' before initialization`.

**Fix aplicado:** Movido declaração para linha 659 (logo após `getToothTreatment`), removida declaração duplicada na linha 715.

**Evidência:** 7 evaluations criadas, 6 protocolos gerados, 0 erros de runtime.

**Status:** ✅ **CORRIGIDO E VALIDADO**

### ✅ Bug 3 — `treatment_indication` "porcelain" vs "porcelana" (Relatório #1)

**Bug original:** Gemini retornava "porcelain" (inglês) ao invés de "porcelana" (português), e o switch case não fazia match.

**Evidência do fix:**
```
Todos os 6 dentes de porcelana: treatment_type = "porcelana" ✅
Dente 31 (encaminhamento): treatment_type = "encaminhamento" ✅
```

**Status:** ✅ **CORRIGIDO E VALIDADO** (normalização no edge function + fallback no frontend)

---

## Parte 2: Validação dos Fixes de Prompt (commit `321dd1c`)

### ✅ Fix 4 — Concentração HF Contralateral (A4)

**Bug original (caso "teste"):**
- Dente 11: HF **5%** (Condac Porcelana FGM)
- Dente 21: HF **10%** (genérico)

**Resultado atual (caso novo):**

| Dente | HF Concentração | Marca | Tempo |
|-------|----------------|-------|-------|
| 11 | 5% | Condac Porcelana - FGM | 20s |
| 12 | 5% | Condac Porcelana - FGM | 20s |
| 13 | 5% | Condac Porcelana - FGM | 20s |
| 21 | 5% | Condac Porcelana - FGM | 20s |
| 22 | 5% | Condac Porcelana - FGM | 20s |
| 23 | 5% | Condac Porcelana - FGM | 20s |

**Status:** ✅ **CORRIGIDO** — Todos 6 dentes usam HF 5%, mesma marca, mesmo tempo.

### ✅ Cimento Consistente

**Bug original:** 11 usava WO, 21 usava A2.

| Dente | Cimento | Marca |
|-------|---------|-------|
| 11 | Allcem Veneer APS (FGM) | WO |
| 12 | Allcem Veneer APS (FGM) | WO |
| 13 | Allcem Veneer APS (FGM) | WO |
| 21 | Allcem Veneer APS (FGM) | Trans/OW |
| 22 | Allcem Veneer APS (FGM) | WO |
| 23 | Allcem Veneer APS (FGM) | WO |

**Status:** ✅ Parcialmente corrigido. A marca é consistente. O shade do 21 é diferente (ver ⚠️ abaixo).

### ✅ Confiança Consistente

| Dente | Confiança |
|-------|-----------|
| 11 | alta |
| 12 | alta |
| 13 | alta |
| 21 | alta |
| 22 | alta |
| 23 | alta |

**Status:** ✅ Todos alta — sem inconsistência.

---

## Parte 3: Atenções Menores

### ⚠️ Atenção 1 — Dente 21 Cement Shade Indeciso

**Evidência:** O campo `shade` do dente 21 contém DUAS opções ao invés de uma recomendação definitiva:
```
"Trans (para máxima translucidez, permitindo que a cor da faceta BL1/BL2 se expresse)
 ou OW (Opaque White, se precisar de um pouco mais de valor/brilho)"
```

**Preocupação:** Um protocolo clínico deve ser assertivo. "Trans ou OW" obriga o dentista a decidir sem critérios claros. Contudo, a diferença é clinicamente justificável: o dente 21 tem melhor cor natural que o 11 (não precisa de WO para mascarar), então Trans pode funcionar.

**Sugestão:** Adicionar regra no prompt: "NUNCA forneça alternativas no campo shade — SEMPRE escolha UMA opção definitiva."

### ⚠️ Atenção 2 — Variação de Step Count Entre Contralaterais

| Par | Ceramic Steps | Tooth Steps | Total |
|-----|--------------|-------------|-------|
| 11 | 5 | 2 | 7 |
| 21 | 6 | 3 | 9 |
| 12 | 6 | 5 | 11 |
| 22 | 6 | 4 | 10 |
| 13 | 4 | 2 | 6 |
| 23 | 4 | 2 | 6 |

**Preocupação:** 13/23 são idênticos (6 steps cada) ✅. 12/22 são quase iguais (11 vs 10). 11/21 têm a maior diferença (7 vs 9), o que é aceitável considerando substratos diferentes.

**Status:** Aceitável clinicamente — variação reflete condições clínicas diferentes.

---

## Parte 4: Validações OK

- ✅ **Notação FDI:** Todos válidos (11-23, 31) e consistentes entre análise, DSD e protocolo
- ✅ **treatment_type normalizado:** Todos "porcelana" (6) + "encaminhamento" (1)
- ✅ **HF 5% uniforme:** Todos os 6 dentes usam mesma concentração, marca e tempo
- ✅ **Cimento fotopolimerizável:** Todos usam Allcem Veneer APS (FGM) — linha consistente
- ✅ **Fotopolimerização:** Todos usam 40s por face
- ✅ **Confiança alta:** 6/6 protocolos
- ✅ **Encaminhamento correto:** Dente 31 sem protocolo de cimentação (correto para encaminhamento)
- ✅ **Protocolos gerados:** 6/6 porcelana com cementation_protocol completo
- ✅ **Whitening considerado:** Cimento WO mencionado em warnings como essencial para atingir BL1/BL2
- ✅ **Checklist completo:** 10 items por protocolo
- ✅ **Alertas adequados:** "O que NÃO fazer" presente em todos
- ✅ **Try-In obrigatório:** Mencionado em todos os protocolos

---

## Resumo por Dente

| Dente | Tipo | Protocolo | HF | Shade | Confiança | Status |
|-------|------|-----------|-----|-------|-----------|--------|
| 11 | porcelana | ✅ cementation | 5% | WO | alta | ✅ |
| 12 | porcelana | ✅ cementation | 5% | WO | alta | ✅ |
| 13 | porcelana | ✅ cementation | 5% | WO | alta | ✅ |
| 21 | porcelana | ✅ cementation | 5% | Trans/OW | alta | ⚠️ Shade indeciso |
| 22 | porcelana | ✅ cementation | 5% | WO | alta | ✅ |
| 23 | porcelana | ✅ cementation | 5% | WO | alta | ✅ |
| 31 | encaminhamento | — (correto) | — | — | — | ✅ |

---

## Ações Recomendadas

### Prioridade 1 — Já Feito ✅
1. ~~Fix `recommend-cementation` verify_jwt~~ → Deployed
2. ~~Fix normalizedTreatment TDZ~~ → Código corrigido
3. ~~Fix treatment_indication normalization~~ → Commit `9ece4d6`

### Prioridade 2 — Prompt Refinement
4. Adicionar regra "ONE definitive shade choice, never alternatives" no prompt `recommend-cementation`

### Prioridade 3 — Commits Pendentes
5. Commit do fix `normalizedTreatment` no `useWizardFlow.ts`
6. Commit do fix `verify_jwt` no `supabase/config.toml`

---

*Gerado pelo dental-qa-specialist skill em 2026-02-05*
