---
title: Relatório QA Dental — Validação de Correções
created: 2026-02-05
updated: 2026-02-05
status: published
tags:
  - type/qa-report
  - status/published
---

# Relatório QA Dental — Validação de Correções (2026-02-05)

**Data:** 2026-02-05
**Modo:** E2E + JSON Review (caso "teste" existente + tentativa de novo caso)
**Outputs avaliados:** Análise de Foto, DSD, Protocolo de Estratificação, Protocolo de Cimentação

## Resultado: ⚠️ 1 bug novo crítico + 3 correções validadas + confirmação dos bugs originais

---

## Parte 1: Validação das Correções Aplicadas (commit `321dd1c`)

### Correções no Prompt `recommend-resin.ts`

#### ✅ Fix 1 — Alternativa Simplificada Contraditória (A7)
**Bug original:** Dente 23 recebeu alternativa com todos os campos "N/A" — `resin: "Técnica não aplicável..."`, `shade: "N/A"`, `technique: "N/A"`, `tradeoff: "N/A"`.
**Correção aplicada:** Adicionada regra explícita no schema: "DEVE ser uma opção REAL e DIFERENTE" e "NUNCA diga 'não aplicável' — SEMPRE forneça uma técnica simplificada real".
**Status:** ✅ Regra implementada corretamente no prompt. Validação efetiva requer nova geração.

#### ✅ Fix 2 — Ideal Resin Anti-Contradição (A8)
**Bug original:** IA dizia que a resina ideal "está fora do orçamento" quando era a mesma resina já recomendada.
**Correção aplicada:** Adicionada regra: "Se recommended_resin_name = ideal_resin_name, defina como null!" e "NÃO diga que a ideal 'está fora do orçamento' se ela já é a recomendação principal!"
**Status:** ✅ Regra implementada corretamente no prompt.

#### ✅ Fix 3 — Determinismo Contralateral (N2/C3)
**Bug original no caso "teste":**
- Dente 13: 3 camadas, confiança **alta**
- Dente 23: 2 camadas, confiança **média**
- Contralaterais com diagnóstico similar receberam protocolos completamente diferentes.
**Correção aplicada:** Nova regra "DETERMINISMO CONTRALATERAL" exigindo protocolos idênticos para contralaterais com mesmo diagnóstico.
**Status:** ✅ Regra implementada. Limitação arquitetural: cada dente é processado em chamada API independente, então o determinismo depende de a IA seguir os mesmos critérios objetivos.

### Correções no Prompt `recommend-cementation.ts`

#### ✅ Fix 4 — Concentração HF Explícita (A4)
**Bug original no caso "teste":**
- **Dente 11**: Ácido fluorídrico **5%** (Condac Porcelana FGM)
- **Dente 21**: Ácido fluorídrico **10%** (marca genérica)
- Contralaterais receberam concentrações DIFERENTES de HF — clinicamente inaceitável.
**Correção aplicada:** Regra explicitada: "Mesma concentração de ácido fluorídrico (ex: se 11 usa HF 5%, 21 DEVE usar HF 5%)" com exemplos ❌/✅.
**Evidência adicional:**
- Dente 11: cimento shade **White Opaque (WO)**, 6 etapas cerâmicas
- Dente 21: cimento shade **A2**, 5 etapas cerâmicas
- Mesmo caso, mesmos contralaterais — protocolos completamente assimétricos.
**Status:** ✅ Regra implementada. Mesma limitação arquitetural (chamadas API independentes).

---

## Parte 2: Bug Novo Descoberto

### 🔴 Crítico — Gemini retorna `"porcelain"` ao invés de `"porcelana"` (enum mismatch)

**Descrição:** Ao criar um novo caso E2E com 6 dentes estéticos (porcelana), a IA retornou `treatment_indication: "porcelain"` (inglês) ao invés de `"porcelana"` (português). O frontend esperava o valor em português.

**Impacto:** O switch case em `useWizardFlow.ts:714` compara `treatmentType` contra `'porcelana'`. Quando o valor é `"porcelain"`, nenhum case match ocorre, e o protocolo **não é gerado**. Os 6 casos foram criados com `status: "draft"` mas sem nenhum protocolo.

**Evidência:**
```json
// Novo caso (2026-02-05)
{
  "tooth": "11",
  "treatment_type": "porcelain",    // ❌ Inglês
  "ai_treatment_indication": "porcelain",  // ❌ Inglês
  "has_cement": false  // Protocolo NÃO gerado
}

// Caso "teste" (2026-02-04) - funcionou
{
  "tooth": "11",
  "treatment_type": "porcelana",    // ✅ Português
  "ai_treatment_indication": "porcelana",  // ✅ Português
  "has_cement": true   // Protocolo gerado
}
```

**Root cause:** O prompt `analyze-dental-photo.ts` define o enum como `["resina", "porcelana", "coroa", ...]` mas Gemini (Flash) às vezes ignora a constraint e retorna o equivalente em inglês. O tool schema no edge function também define o enum em português (linha 269), mas Gemini não é determinístico.

**Sugestão de fix:**
1. **Normalização no edge function** `analyze-dental-photo/index.ts`: Após receber a resposta, mapear valores em inglês para português:
   ```ts
   const TREATMENT_MAP = { porcelain: 'porcelana', resin: 'resina', crown: 'coroa', implant: 'implante', ... };
   tooth.treatment_indication = TREATMENT_MAP[tooth.treatment_indication] || tooth.treatment_indication;
   ```
2. **Fallback no frontend** `useWizardFlow.ts`: Adicionar normalização antes do switch:
   ```ts
   const normalizedType = treatmentType === 'porcelain' ? 'porcelana' : treatmentType;
   ```

**Severidade:** 🔴 Crítica — silenciosamente impede a geração de protocolos para casos porcelana.

---

## Parte 3: Resumo do Caso "teste" (2026-02-04) — Confirmação de Bugs

### Resumo por Dente

| Dente | Tipo | Protocolo | Camadas | Confiança | Issues |
|-------|------|-----------|---------|-----------|--------|
| 11 | porcelana | ✅ cementation | — | alta | HF 5%, WO shade |
| 13 | resina | ✅ stratification | 3 | alta | OK |
| 21 | porcelana | ✅ cementation | — | alta | HF 10%, A2 shade ❌ |
| 23 | resina | ✅ stratification | 2 | média | Alt "N/A" ❌ |
| 31 | encaminhamento | generic | — | — | OK |
| 41 | encaminhamento | generic | — | — | OK |

### Inconsistências Confirmadas

1. **11 vs 21 (cementation):** HF 5% vs 10%, WO vs A2, 6 vs 5 etapas — ❌ Fix 4 endereça isso
2. **13 vs 23 (resina):** 3 camadas vs 2, alta vs média — ❌ Fix 3 endereça isso
3. **23 alternativa:** Todos campos "N/A" — ❌ Fix 1 endereça isso

---

## Parte 4: Novo Caso E2E (2026-02-05) — Análise e DSD

### Dados do Caso
- **Paciente:** sem nome, 35 anos (nascimento 14/02/1990)
- **Foto:** Sorriso saudável (Pexels stock photo)
- **Whitening:** Branco (BL1/BL2)
- **Budget:** moderado
- **Estética:** alto
- **Longevidade:** médio

### Resultado da Análise de Foto
- **6 dentes detectados:** 11, 21, 12, 22, 13, 23 (todos estéticos)
- **Confiança:** 95%
- **Cor VITA:** B1
- **Todos porcelana** (facetas para harmonização estética)

### Validações da Análise ✅
- ✅ **Tooth Notation (FDI):** Todos válidos (11-23, anterior superior)
- ✅ **Visagism:** Face oval, temperamento sanguíneo/colérico, arco consonante, corredor bucal adequado
- ✅ **Contralateral symmetry:** Pares reconhecidos (11/21, 12/22, 13/23)
- ✅ **Treatment hierarchy:** Todos estéticos opcionais com prioridade "baixa" — conservador
- ✅ **Warnings adequados:** "Alto padrão estético; intervenções são puramente eletivas"

### Resultado do DSD ✅
- **Golden Ratio:** 90%
- **Symmetry:** 95%
- **Midlines:** Centered/Aligned
- **Smile line:** Medium (ideal)
- **Buccal corridor:** Adequate
- **Gengivoplasty:** Not needed
- ✅ Sugestões coerentes entre contralaterais (11↔21, 12↔22, 13↔23)

### Protocolo ❌
- **Não gerado** devido ao bug "porcelain" vs "porcelana"
- 0/6 protocolos criados

---

## Validações OK

- ✅ Notação FDI correta em todos os outputs
- ✅ Classificação Black coerente (Classe I em todos os anteriores — reflete caso estético)
- ✅ VITA shades válidos (B1)
- ✅ Visagismo coerente (face oval, temperamento, arco do sorriso)
- ✅ DSD cross-consistência (análise ↔ DSD alinhados)
- ✅ Hierarquia de tratamento (conservador — todos estéticos opcionais)
- ✅ Whitening preference registrada ("Clareamento notável - BL1/BL2")

---

## Ações Recomendadas

### Prioridade 1 — Fix Imediato
1. **Normalização de treatment_indication** no edge function `analyze-dental-photo/index.ts` — mapear "porcelain" → "porcelana" antes de retornar ao frontend

### Prioridade 2 — Defesa em Profundidade
2. **Normalização no frontend** `useWizardFlow.ts` — fallback no switch case para valores em inglês
3. **Teste E2E automatizado** que verifica se `treatment_type` está no enum português após análise

### Prioridade 3 — Validação Futura
4. Após o fix do enum, criar novo caso E2E para validar que os fixes dos prompts (commit `321dd1c`) produzem protocolos clinicamente corretos

---

*Gerado pelo dental-qa-specialist skill em 2026-02-05*
