# Clinical QA Fixes - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 6 clinical QA issues from dentist testing: analysis errors, DSD false positives on lower teeth, DSD gengivoplasty not producing visible changes, diastema protocol simplification, "Gengiva reconturada" label removal, and DSD not making changes for some cases.

**Architecture:** Backend prompt/post-processing fixes in Supabase edge functions + frontend UI fix in CollapsibleDSD. All changes are isolated to specific files with no cross-cutting concerns.

**Tech Stack:** TypeScript (Deno edge functions + React frontend), Gemini 3.1 Pro (vision), Claude Haiku 4.5 (resin recommendations)

---

## Issue Summary

| # | Issue | Source | Priority | Files |
|---|-------|--------|----------|-------|
| 1 | Analysis error ("Erro na Analise") on valid photos | Screenshot | P0 | `analyze-dental-photo/index.ts` |
| 2 | DSD gengivoplasty layer shows no visual difference | PDF 1 | P1 | `generate-dsd/simulation.ts`, `dsd-simulation.ts` |
| 3 | DSD recommends lower teeth (31,41,32,42) not visible/worn | PDF 2 | P0 | `generate-dsd/post-processing.ts`, `dsd-analysis.ts` |
| 4 | Diastema protocol needs simplified technique for small gaps | PDF 2 | P1 | `recommend-resin.ts` |
| 5 | Remove "Gengiva reconturada" label from DSD image | PDF 2 | P1 | `CollapsibleDSD.tsx` |
| 6 | DSD not making changes (identical before/after) | PDF 1 | P1 | investigation needed |

---

### Task 1: Add thinkingLevel back to analyze-dental-photo

The analysis error is likely caused by Gemini 3.1 Pro unlimited thinking budget (commit d21cd35 removed `thinkingLevel`). Without a cap, the model can exceed the 55s timeout on complex images, causing both Gemini and Claude fallback to fail.

**Files:**
- Modify: `supabase/functions/analyze-dental-photo/index.ts:142-156`

**Step 1: Read the current Gemini call**

Run: Read `supabase/functions/analyze-dental-photo/index.ts` lines 139-165

**Step 2: Add thinkingLevel to Gemini call**

In `supabase/functions/analyze-dental-photo/index.ts`, add `thinkingLevel: "medium"` to the `callGeminiVisionWithTools` options at line 155. This balances clinical reasoning quality with latency safety.

```typescript
// Before (line 143-156):
const response = await callGeminiVisionWithTools(
  promptDef.model,
  userPrompt,
  base64Image,
  mimeType,
  ANALYZE_PHOTO_TOOL,
  {
    systemPrompt,
    temperature: 0.0,
    maxTokens: 3000,
    forceFunctionName: "analyze_dental_photo",
    timeoutMs: 55_000,
  }
);

// After:
const response = await callGeminiVisionWithTools(
  promptDef.model,
  userPrompt,
  base64Image,
  mimeType,
  ANALYZE_PHOTO_TOOL,
  {
    systemPrompt,
    temperature: 0.0,
    maxTokens: 3000,
    forceFunctionName: "analyze_dental_photo",
    timeoutMs: 55_000,
    thinkingLevel: "medium",
  }
);
```

**Step 3: Verify build**

Run: `cd /Users/gustavoparis/www/DentAI-Pro && pnpm turbo build --filter=web`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add supabase/functions/analyze-dental-photo/index.ts
git commit -m "fix: add thinkingLevel medium to analyze-dental-photo to prevent timeouts"
```

---

### Task 2: Add lower teeth filter to DSD post-processing

The DSD analysis recommends treatment for lower teeth (31, 41, 32, 42) that are not clearly visible or don't show evident wear. The `analyze-dental-photo` post-processing already has this filter (lines 73-92), but `generate-dsd/post-processing.ts` does not.

**Files:**
- Modify: `supabase/functions/generate-dsd/post-processing.ts`

**Step 1: Read the existing DSD post-processing**

Run: Read `supabase/functions/generate-dsd/post-processing.ts`

**Step 2: Add lower teeth filter after safety net #1**

Add a new safety net after the visagismo reset (after line 33) that filters out lower teeth suggestions when the photo predominantly shows the upper arch. The logic mirrors `analyze-dental-photo/post-processing.ts` lines 73-92 but adapted for DSD suggestions.

```typescript
// Add after line 33 (after visagismo reset, before gengivoplasty filter):

// Safety net #1.5: Strip lower teeth suggestions when photo predominantly shows upper arch.
// The DSD prompt says "Inferiores: incluir APENAS quando CLARAMENTE VISIVEIS com desgaste EVIDENTE"
// but the AI frequently ignores this rule. This is a deterministic backend guardrail.
const upperSuggestions = analysis.suggestions.filter(s => {
  const num = parseInt(s.tooth);
  return num >= 11 && num <= 28;
});
const lowerSuggestions = analysis.suggestions.filter(s => {
  const num = parseInt(s.tooth);
  return num >= 31 && num <= 48;
});

if (upperSuggestions.length > 0 && lowerSuggestions.length > 0 && upperSuggestions.length >= lowerSuggestions.length) {
  const removedNumbers = lowerSuggestions.map(s => s.tooth);
  logger.log(`DSD post-processing: removing lower teeth suggestions ${removedNumbers.join(', ')} — photo predominantly shows upper arch (${upperSuggestions.length} upper vs ${lowerSuggestions.length} lower)`);
  analysis.suggestions = upperSuggestions;
  analysis.observations = analysis.observations || [];
  analysis.observations.push(`Dentes inferiores (${removedNumbers.join(', ')}) removidos da análise DSD — foto mostra predominantemente a arcada superior.`);
}
```

**Step 3: Verify build**

Run: `cd /Users/gustavoparis/www/DentAI-Pro && pnpm turbo build --filter=web`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add supabase/functions/generate-dsd/post-processing.ts
git commit -m "fix: filter lower teeth from DSD suggestions when upper arch predominant"
```

---

### Task 3: Strengthen DSD analysis prompt for lower teeth

In addition to the backend filter, strengthen the prompt rule so the AI is less likely to include lower teeth inappropriately.

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts:317`

**Step 1: Read the current rule**

Line 317: `Inferiores: incluir APENAS quando CLARAMENTE VISIVEIS com desgaste EVIDENTE.`

**Step 2: Expand the lower teeth rule**

Replace line 317 with a stronger, more explicit rule:

```typescript
// Before:
Inferiores: incluir APENAS quando CLARAMENTE VISIVEIS com desgaste EVIDENTE.

// After:
=== REGRA ABSOLUTA PARA DENTES INFERIORES (31-48) ===
NÃO incluir dentes inferiores nas sugestões EXCETO quando TODAS as condições forem atendidas:
1. O dente inferior está CLARAMENTE VISÍVEL na foto (borda incisal inteira visível, não apenas parcial)
2. O desgaste/dano é EVIDENTE e INEQUÍVOCO (não sutil ou interpretativo)
3. A borda incisal do dente inferior mostra alteração CLARA comparada ao normal
Se a borda incisal inferior NÃO está claramente visível → NÃO incluir. Na dúvida → NÃO incluir.
PROIBIDO: sugerir tratamento para dentes inferiores baseado em suposição de desgaste não visível na foto.
```

**Step 3: Verify build**

Run: `cd /Users/gustavoparis/www/DentAI-Pro && pnpm turbo build --filter=web`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/dsd-analysis.ts
git commit -m "fix: strengthen DSD prompt to reject lower teeth without clear visibility"
```

---

### Task 4: Remove "Gengiva reconturada" label from DSD comparison

The `CollapsibleDSD.tsx` passes a `changeIndicator` to ComparisonSlider when the active layer includes gengivoplasty. The dentist wants this label removed from the image viewport.

**Files:**
- Modify: `apps/web/src/components/dsd/CollapsibleDSD.tsx:171-175`

**Step 1: Read the current code**

Run: Read `apps/web/src/components/dsd/CollapsibleDSD.tsx` lines 165-177

**Step 2: Remove the changeIndicator prop**

Replace the ComparisonSlider call to remove `changeIndicator`:

```typescript
// Before (lines 167-176):
<ComparisonSlider
  beforeImage={beforeImage}
  afterImage={activeAfterImage}
  afterLabel={activeLayer?.label || t('dsd.simulation')}
  changeIndicator={
    activeLayer?.includes_gengivoplasty
      ? t('components.dsd.collapsible.gingivaRecontoured')
      : undefined
  }
/>

// After:
<ComparisonSlider
  beforeImage={beforeImage}
  afterImage={activeAfterImage}
  afterLabel={activeLayer?.label || t('dsd.simulation')}
/>
```

**Step 3: Verify build**

Run: `cd /Users/gustavoparis/www/DentAI-Pro && pnpm turbo build --filter=web`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add apps/web/src/components/dsd/CollapsibleDSD.tsx
git commit -m "fix: remove 'Gengiva reconturada' label from DSD comparison slider"
```

---

### Task 5: Add simplified diastema protocol to recommend-resin prompt

For pure diastema closure cases, the protocol should be simplified:
- Diastema >1mm: DENTINA/BODY + WE or W3 enamel layer (for bleached teeth)
- Small diastemas (<1mm): only lighter enamel resins

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts:234-303`

**Step 1: Read the current diastema handling**

Run: Read `supabase/functions/_shared/prompts/definitions/recommend-resin.ts` lines 234-303

**Step 2: Update the diastema layer cap section**

Modify the `buildLayerCapSection` function to differentiate between large and small diastemas:

```typescript
// In buildLayerCapSection, update the diastema section (lines 247-258):

if (isDiastema || (isAnteriorAesthetic && isAnteriorRegion)) {
  if (isDiastema) {
    if (sizeNorm.includes('pequen')) {
      // Small diastema (<1mm): simplified technique — enamel resins only
      maxLayers = 2
      scenario = 'Diastema Pequeno (<1mm): Técnica SIMPLIFICADA — 2 camadas (Corpo + Esmalte claro). Apenas resinas de esmalte mais claro (WE, W3, BL1). Sem necessidade de camada de dentina opaca.'
    } else if (sizeNorm.includes('médi') || sizeNorm.includes('medi')) {
      // Medium diastema (1-2mm): DENTINA/BODY + enamel
      maxLayers = 3
      scenario = 'Diastema Médio (1-2mm): 3 camadas — Dentina/Body + Cristas Proximais + Esmalte (WE ou W3 para dentes clareados). Se dentes clareados: usar DENTINA ou BODY + camada final WE ou W3.'
    } else {
      // Large diastema (>2mm): full stratification
      maxLayers = 4
      scenario = 'Diastema Grande/Extenso (>2mm): Mín 4 camadas + Efeitos Incisais recomendado (5 camadas). Se dentes clareados: DENTINA ou BODY + camada esmalte final WE ou W3.'
    }
  } else {
    maxLayers = 4
    scenario = 'Recontorno/Faceta Anterior Estético: Mín 4 camadas (Aumento Incisal + Cristas Proximais + Corpo + Esmalte)'
  }
}
```

**Step 3: Update the aesthetic enforcement section to handle 2-layer diastema**

The section after the maxLayers assignment (lines 276-302) needs to handle the simplified diastema case:

```typescript
if (isAesthetic || forceAesthetic) {
  // Small diastema has a simplified protocol — different messaging
  if (isDiastema && maxLayers === 2) {
    return `=== PROTOCOLO SIMPLIFICADO DIASTEMA PEQUENO ===
Cenário detectado: ${scenario}
MAXIMO DE CAMADAS: 2
Diastema pequeno (<1mm) usa técnica SIMPLIFICADA:
1. Corpo/Dentina (shade compatível com substrato)
2. Esmalte vestibular claro (WE, W3, ou BL1 — 1 tom mais claro que corpo)
Para dentes clareados: resinas de esmalte mais claro apenas.
PROIBIDO gerar 4-5 camadas para diastema pequeno — é sobretratamento.
`
  }

  if (isDiastema && maxLayers === 3) {
    return `=== PROTOCOLO DIASTEMA MEDIO (TECNICA INTERMEDIARIA) ===
Cenário detectado: ${scenario}
CAMADAS OBRIGATORIAS: 3
1. Dentina/Body (shade VITA compatível com substrato — DENTINA ou BODY shade)
2. Cristas Proximais (esmalte 1 tom mais claro)
3. Esmalte Vestibular Final (WE ou W3 para dentes clareados, BL1 caso contrário)
Se dentes clareados: usar DENTINA ou BODY + camada final WE ou W3.
PROIBIDO gerar menos de 3 ou mais de 4 camadas para diastema médio.
`
  }

  // Original 4+ layer aesthetic protocol for large diastema and other aesthetic procedures
  return `=== CAMADAS OBRIGATORIAS (PROCEDIMENTO ESTETICO ANTERIOR) ===
Cenário detectado: ${scenario}
MINIMO DE CAMADAS OBRIGATORIO: ${maxLayers}
...` // (keep existing content)
}
```

**Step 4: Verify build**

Run: `cd /Users/gustavoparis/www/DentAI-Pro && pnpm turbo build --filter=web`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/recommend-resin.ts
git commit -m "fix: simplify diastema protocol — small gaps use 2 layers, medium use 3"
```

---

### Task 6: Investigate DSD gengivoplasty not producing visible changes

The DSD complete-treatment layer with gengivoplasty produces an identical image to the before. This needs investigation.

**Files:**
- Investigate: `supabase/functions/generate-dsd/simulation.ts:214-230` (gingivoSuggestions building)
- Investigate: `supabase/functions/_shared/prompts/definitions/dsd-simulation.ts:400-434` (gengivoplasty prompt)
- Investigate: `supabase/functions/generate-dsd/post-processing.ts:35-58` (shouldStripGingivo logic)

**Step 1: Check if gengivoplasty suggestions are being stripped**

The `shouldStripGingivo` logic at `generate-dsd/post-processing.ts:38-46` strips gengivoplasty suggestions when:
- `smile_line === 'baixa'`
- `smile_line === 'média'` AND no gingival evidence in observations

This is aggressive — it can strip gengivoplasty even when the DSD analysis detected it. If the smile line is classified as "média" (which is common), and the observations don't explicitly mention gingival asymmetry, ALL gengivoplasty suggestions are removed BEFORE the simulation prompt is built.

**Step 2: Verify the issue by reading the simulation code path**

In `simulation.ts:216-230`, the `gingivoSuggestions` are built from `analysis.suggestions` — but if post-processing already stripped them, this will be empty, and the gengivoplasty prompt will have no specific teeth to reshape.

**Step 3: Fix — Preserve gengivoplasty suggestions for complete-treatment layer**

The fix is in `generate-dsd/post-processing.ts`. The `shouldStripGingivo` logic should NOT strip when smile line is "média" if the analysis itself detected gengivoplasty needs (i.e., suggestions contain gengivoplasty). The analysis model is the source of truth for when gengivoplasty is clinically appropriate.

```typescript
// In generate-dsd/post-processing.ts, modify the shouldStripGingivo logic:

// Before (lines 39-46):
const shouldStripGingivo = smileLine === 'baixa' || (
  smileLine === 'média' && !analysis.observations?.some(obs => {
    const lower = obs.toLowerCase();
    return lower.includes('assimetria gengival') ||
           lower.includes('coroa clínica curta') ||
           (lower.includes('gengiva') && lower.includes('visível'));
  })
);

// After:
const hasExplicitGingivoSuggestions = analysis.suggestions.some(s =>
  (s.treatment_indication || '').toLowerCase() === 'gengivoplastia'
);
const shouldStripGingivo = smileLine === 'baixa' || (
  smileLine === 'média' && !hasExplicitGingivoSuggestions && !analysis.observations?.some(obs => {
    const lower = obs.toLowerCase();
    return lower.includes('assimetria gengival') ||
           lower.includes('coroa clínica curta') ||
           (lower.includes('gengiva') && lower.includes('visível'));
  })
);
```

This preserves gengivoplasty suggestions when the DSD analysis explicitly recommended them, even with "média" smile line.

**Step 4: Verify build**

Run: `cd /Users/gustavoparis/www/DentAI-Pro && pnpm turbo build --filter=web`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add supabase/functions/generate-dsd/post-processing.ts
git commit -m "fix: preserve gengivoplasty suggestions when DSD analysis explicitly recommends them"
```

---

### Task 7: Deploy edge functions

Deploy all modified edge functions sequentially.

**Step 1: Deploy analyze-dental-photo**

Run: `open -a Docker && sleep 5 && npx supabase functions deploy analyze-dental-photo --no-verify-jwt --use-docker`
Expected: Deployment success

**Step 2: Deploy generate-dsd**

Run: `npx supabase functions deploy generate-dsd --no-verify-jwt --use-docker`
Expected: Deployment success

**Step 3: Deploy recommend-resin**

Run: `npx supabase functions deploy recommend-resin --no-verify-jwt --use-docker`
Expected: Deployment success

**Step 4: Commit deployment config if changed**

Check for any config changes and commit if needed.

---

## Testing Checklist

After all tasks are complete:

- [ ] Photo analysis succeeds on the photo from the screenshot (no "Erro na Analise")
- [ ] DSD analysis on a photo with upper teeth only does NOT suggest lower teeth treatment
- [ ] DSD complete-treatment layer with gengivoplasty shows VISIBLE difference from base
- [ ] Small diastema (<1mm) generates 2-layer protocol (not 4-5)
- [ ] Medium diastema (1-2mm) generates 3-layer protocol with DENTINA/BODY + WE/W3
- [ ] "Gengiva reconturada" label does NOT appear in DSD comparison slider
- [ ] CollapsibleDSD still shows layer tabs with "Gengiva" badge (badge is on the tab button, not the image)
