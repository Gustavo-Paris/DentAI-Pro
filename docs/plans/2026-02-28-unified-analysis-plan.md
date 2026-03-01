# Unified Analysis Pipeline — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate `analyze-dental-photo` (clinical) and `generate-dsd/analysis` (aesthetic) into a single AI call, eliminating redundancy, data conflicts, and the DSD merge logic.

**Architecture:** One Gemini 3.1 Pro call produces a `UnifiedAnalysis` containing both clinical data (cavity class, substrate, shade) and aesthetic data (proportions, smile line, visagismo, suggestions). The `generate-dsd` edge function becomes simulation-only — it receives the pre-computed analysis and only generates images. Frontend merge logic (`useDSDIntegration`) is eliminated. Lip validation switches from Sonnet to Haiku.

**Tech Stack:** Deno (edge functions), TypeScript, React 18, Gemini 3.1 Pro Vision, Claude Haiku 4.5

**Design doc:** `docs/plans/2026-02-28-unified-analysis-design.md`

---

## Task 1: Unified Types (Backend)

**Files:**
- Modify: `supabase/functions/analyze-dental-photo/types.ts`
- Modify: `supabase/functions/generate-dsd/types.ts`

**Step 1: Extend `DetectedTooth` with aesthetic fields**

In `supabase/functions/analyze-dental-photo/types.ts`, add the DSD aesthetic fields to the existing `DetectedTooth` interface so each tooth carries both clinical AND aesthetic data:

```typescript
export interface DetectedTooth {
  // === Existing clinical fields (keep all) ===
  tooth: string;
  tooth_region: string | null;
  cavity_class: string | null;
  restoration_size: string | null;
  substrate: string | null;
  substrate_condition: string | null;
  enamel_condition: string | null;
  depth: string | null;
  priority: "alta" | "média" | "baixa";
  notes: string | null;
  treatment_indication?: TreatmentIndication;
  indication_reason?: string;
  tooth_bounds?: ToothBounds;

  // === NEW aesthetic fields (from DSD suggestions) ===
  current_issue?: string;       // What's wrong aesthetically
  proposed_change?: string;     // What DSD proposes (with mm measurements)
}
```

**Step 2: Extend `PhotoAnalysisResult` with DSD analysis fields**

In the same file, add ALL DSD analysis fields to `PhotoAnalysisResult` — making it the single unified result type:

```typescript
export interface PhotoAnalysisResult {
  // === Existing fields (keep all) ===
  detected: boolean;
  confidence: number;
  detected_teeth: DetectedTooth[];
  primary_tooth: string | null;
  vita_shade: string | null;
  observations: string[];
  warnings: string[];
  treatment_indication?: TreatmentIndication;
  indication_reason?: string;
  dsd_simulation_suitability?: number;

  // === NEW aesthetic/DSD fields ===
  facial_midline?: "centrada" | "desviada_esquerda" | "desviada_direita";
  dental_midline?: "alinhada" | "desviada_esquerda" | "desviada_direita";
  smile_line?: "alta" | "média" | "baixa";
  buccal_corridor?: "adequado" | "excessivo" | "ausente";
  occlusal_plane?: "nivelado" | "inclinado_esquerda" | "inclinado_direita";
  golden_ratio_compliance?: number;
  symmetry_score?: number;
  lip_thickness?: "fino" | "médio" | "volumoso";
  overbite_suspicion?: "sim" | "não" | "indeterminado";
  smile_arc?: "consonante" | "plano" | "reverso";
  face_shape?: "oval" | "quadrado" | "triangular" | "retangular" | "redondo";
  perceived_temperament?: "colérico" | "sanguíneo" | "melancólico" | "fleumático" | "misto";
  recommended_tooth_shape?: "quadrado" | "oval" | "triangular" | "retangular" | "natural";
  visagism_notes?: string;
}
```

All new fields are optional (`?`) so old analysis results (without aesthetic data) remain valid. No migration needed.

**Step 3: Add `AdditionalPhotos` and `PatientPreferences` to photo analysis types**

The `analyze-dental-photo` edge function now needs to accept the same additional inputs that `generate-dsd` accepted:

```typescript
export interface AdditionalPhotos {
  smile45?: string;
  face?: string;
}

export interface PatientPreferences {
  whiteningLevel?: 'natural' | 'white' | 'hollywood';
}

export interface AnalyzePhotoRequest {
  imageBase64: string;
  imageType?: string;
  additionalPhotos?: AdditionalPhotos;
  patientPreferences?: PatientPreferences;
}
```

**Step 4: Commit**

```
feat(types): extend photo analysis types with unified aesthetic fields
```

---

## Task 2: Unified Tool Schema (Backend)

**Files:**
- Modify: `supabase/functions/analyze-dental-photo/tool-schema.ts`

**Step 1: Read the existing tool schema**

Read `supabase/functions/analyze-dental-photo/tool-schema.ts` to understand the current structure.

**Step 2: Add aesthetic fields to per-tooth schema**

Inside the `detected_teeth` array items, add `current_issue` and `proposed_change`:

```typescript
current_issue: {
  type: "string",
  description: "Problema estético identificado (ex: 'Restauração infiltrada com gap mesial de ~1mm')",
  nullable: true,
},
proposed_change: {
  type: "string",
  description: "Mudança proposta com medidas em mm (ex: 'Fechamento com resina composta ~1.5mm, harmonização com 21')",
  nullable: true,
},
```

**Step 3: Add top-level DSD fields to the tool schema**

Add ALL aesthetic analysis fields as new properties in the tool's parameters object (after `indication_reason`):

```typescript
facial_midline: {
  type: "string",
  enum: ["centrada", "desviada_esquerda", "desviada_direita"],
  description: "Posição da linha média facial em relação à dental",
},
dental_midline: {
  type: "string",
  enum: ["alinhada", "desviada_esquerda", "desviada_direita"],
  description: "Alinhamento da linha média dental",
},
smile_line: {
  type: "string",
  enum: ["alta", "média", "baixa"],
  description: "Classificação da linha do sorriso: alta (≥3mm gengiva), média (0-3mm), baixa (gengiva não visível)",
},
buccal_corridor: {
  type: "string",
  enum: ["adequado", "excessivo", "ausente"],
  description: "Corredor bucal",
},
occlusal_plane: {
  type: "string",
  enum: ["nivelado", "inclinado_esquerda", "inclinado_direita"],
  description: "Plano oclusal",
},
golden_ratio_compliance: {
  type: "number",
  description: "Conformidade com proporção áurea (0-100%)",
},
symmetry_score: {
  type: "number",
  description: "Score de simetria (0-100%)",
},
lip_thickness: {
  type: "string",
  enum: ["fino", "médio", "volumoso"],
  description: "Espessura dos lábios",
},
overbite_suspicion: {
  type: "string",
  enum: ["sim", "não", "indeterminado"],
  description: "Suspeita de sobremordida — 'indeterminado' se arcada inferior não claramente visível",
},
smile_arc: {
  type: "string",
  enum: ["consonante", "plano", "reverso"],
  description: "Arco do sorriso",
},
face_shape: {
  type: "string",
  enum: ["oval", "quadrado", "triangular", "retangular", "redondo"],
  description: "Formato do rosto (requer foto de rosto, senão null)",
  nullable: true,
},
perceived_temperament: {
  type: "string",
  enum: ["colérico", "sanguíneo", "melancólico", "fleumático", "misto"],
  description: "Temperamento percebido via visagismo (requer foto de rosto, senão null)",
  nullable: true,
},
recommended_tooth_shape: {
  type: "string",
  enum: ["quadrado", "oval", "triangular", "retangular", "natural"],
  description: "Formato dental recomendado baseado no visagismo",
  nullable: true,
},
visagism_notes: {
  type: "string",
  description: "Notas e justificativa do visagismo",
  nullable: true,
},
```

Update the `required` array to include the new mandatory fields:
```typescript
required: [
  "detected", "confidence", "detected_teeth", "observations", "warnings",
  "dsd_simulation_suitability",
  // New required fields:
  "facial_midline", "dental_midline", "smile_line", "buccal_corridor",
  "occlusal_plane", "golden_ratio_compliance", "symmetry_score",
  "lip_thickness", "overbite_suspicion", "smile_arc"
]
```

Note: `face_shape`, `perceived_temperament`, `recommended_tooth_shape`, `visagism_notes` are nullable — required only when face photo is provided.

**Step 4: Commit**

```
feat(schema): add aesthetic fields to unified tool schema
```

---

## Task 3: Unified Prompt (Backend — Most Critical)

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/analyze-dental-photo.ts`

This is the most sensitive task. The prompt must combine ALL clinical rules from `analyze-dental-photo.ts` with ALL aesthetic rules from `dsd-analysis.ts`, eliminating duplicates.

**Step 1: Read both prompt files completely**

Read:
- `supabase/functions/_shared/prompts/definitions/analyze-dental-photo.ts` (~350 lines)
- `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts` (~460 lines)
- `supabase/functions/_shared/prompts/definitions/clinical-rules.ts` (shared rules)

**Step 2: Identify overlapping rules to merge**

Both prompts contain (keep ONCE in unified):
- Smile line classification (DSD version is more detailed → keep DSD's)
- Smile arc rules (imported from `clinical-rules.ts` → keep import)
- Buccal corridor rules (imported from `clinical-rules.ts` → keep import)
- Existing restoration detection (DSD has 2+ signs rule → keep DSD's)
- Lower teeth absolute rule (both have it → keep one)
- Diastema detection (photo has confidence rules, DSD has vs-restoration rules → merge both)
- Canine evaluation (photo has color conservatism, DSD has cusp/arc completeness → merge both)
- Treatment priority hierarchy (imported → keep import)

**Step 3: Update the prompt definition**

The prompt definition must now:
1. Accept `additionalContext`, `preferencesContext`, `clinicalContext` parameters (like DSD does)
2. Combine the system prompt from both analyses
3. Keep the function name as `analyze_dental_photo` (existing)

Update the prompt metadata to increase maxTokens from 3000 to 4000 (aesthetic analysis needs more output space):

```typescript
export const analyzeDentalPhotoPrompt: PromptDefinition<AnalyzePhotoParams> = {
  id: 'analyze-dental-photo',
  name: 'Unified Dental Analysis',
  description: 'Combined clinical + aesthetic analysis of dental photos',
  model: 'gemini-3.1-pro-preview',
  mode: 'vision-tools' as PromptMode,
  provider: 'gemini',
  temperature: 0.0,
  maxTokens: 4000,  // Was 3000, increased for aesthetic output
  tags: ['clinical', 'aesthetic', 'analysis'],
  // ...
};
```

Add the parameter type:
```typescript
interface AnalyzePhotoParams {
  imageType: string;
  additionalContext?: string;
  preferencesContext?: string;
}
```

**Step 4: Write the unified system prompt**

Structure the unified prompt in this order:

```
ROLE: "Especialista em Odontologia Clínica, Digital Smile Design (DSD), Visagismo e Estética com 20+ anos"

SECTION 1: CLINICAL ANALYSIS (from analyze-dental-photo)
- Multi-tooth detection rules
- Black classification decision tree
- Substrate, enamel condition, depth
- DSD simulation suitability scoring
- Restoration detection (from DSD's 2+ signs rule)
- Diastema detection (merged: photo's confidence rules + DSD's vs-restoration rules)
- Canine rules (merged: photo's color conservatism + DSD's cusp/arc completeness)
- Lower teeth absolute rule (one version)
- Whitening as first-line

SECTION 2: AESTHETIC ANALYSIS (from dsd-analysis)
- Visagism rules (conditional on face photo)
- Smile line calibration (DSD's 3-zone with 4-step auto-verification)
- Lip thickness
- Overbite suspicion (conservative)
- Bruxism detection
- Facial/dental midline analysis
- Golden ratio compliance
- Buccal corridor (from clinical-rules import)
- Smile arc (from clinical-rules import)
- Gengivoplasty rules (DSD's detailed rules, NOT photo's simple version)
- Homolog comparison (11/21, 12/22, 13/23) with mm measurements
- DSD-treatment coherence matrix
- Clinical viability / tooth width rule
- Arc anterior completeness

SECTION 3: PER-TOOTH OUTPUT FORMAT
- Each tooth: clinical fields + aesthetic fields (current_issue, proposed_change)
- One treatment_indication per tooth — no conflicts
- Priority logic: alta (patologias) > média (restaurações) > baixa (estética)

SECTION 4: TOP-LEVEL OUTPUT FORMAT
- observations (3-6, merged clinical+aesthetic)
- facial proportions (midline, smile line, etc.)
- visagism (if face photo present)

SECTION 5: VALIDATION RULES
- Internal consistency check
- DSD-treatment coherence
- Arc completeness verification
```

**CRITICAL:** Copy all clinical rules EXACTLY from the existing prompts. Do NOT rephrase, simplify, or "improve" clinical instructions — they have been calibrated with real patient cases.

**Step 5: Update the user prompt**

```typescript
user: (params: AnalyzePhotoParams) => {
  let prompt = `Analise esta foto dental e forneça uma análise COMPLETA:
1. ANÁLISE CLÍNICA: identifique TODOS os dentes com problemas (cáries, restaurações, fraturas)
2. ANÁLISE ESTÉTICA: avalie proporções, simetria, linha do sorriso, corredor bucal
3. SUGESTÕES POR DENTE: para cada dente, forneça current_issue e proposed_change com medidas em mm

Tipo de foto: ${params.imageType}

Use a função analyze_dental_photo para retornar a análise estruturada completa.`;

  if (params.additionalContext) {
    prompt += `\n\n${params.additionalContext}`;
  }
  if (params.preferencesContext) {
    prompt += `\n\n${params.preferencesContext}`;
  }
  return prompt;
},
```

**Step 6: Run prompt regression tests**

```bash
cd supabase/functions/_shared/prompts && deno test prompts.test.ts
```

Fix any failures — tests check for specific keywords and model assignments.

**Step 7: Commit**

```
feat(prompt): create unified clinical+aesthetic analysis prompt
```

---

## Task 4: Update `analyze-dental-photo` Edge Function

**Files:**
- Modify: `supabase/functions/analyze-dental-photo/index.ts`
- Modify: `supabase/functions/analyze-dental-photo/post-processing.ts`

**Step 1: Accept additional photos and preferences in request**

In `index.ts`, update the request validation to extract new fields:

```typescript
const { imageBase64, imageType, additionalPhotos, patientPreferences } = validatedData;
```

**Step 2: Build context for additional photos**

Add context-building logic (adapted from `generate-dsd/proportions-analysis.ts`):

```typescript
let additionalContext = '';
if (additionalPhotos?.face) {
  additionalContext += '\nFoto de ROSTO fornecida: análise de visagismo OBRIGATÓRIA (formato facial, temperamento, formato dental recomendado).';
}
if (additionalPhotos?.smile45) {
  additionalContext += '\nFoto de SORRISO 45° fornecida: avaliar corredor bucal, projeção labial e curvatura do arco com mais precisão.';
}

let preferencesContext = '';
if (patientPreferences?.whiteningLevel) {
  preferencesContext += `\nNível de clareamento desejado: ${patientPreferences.whiteningLevel}`;
}
```

**Step 3: Pass additional images to Gemini**

Update the `callGeminiVisionWithTools` call to include additional images:

```typescript
const additionalImages: Array<{ data: string; mimeType: string }> = [];
if (additionalPhotos?.face) {
  additionalImages.push({ data: extractBase64(additionalPhotos.face), mimeType: 'image/jpeg' });
}
if (additionalPhotos?.smile45) {
  additionalImages.push({ data: extractBase64(additionalPhotos.smile45), mimeType: 'image/jpeg' });
}

const result = await callGeminiVisionWithTools(
  promptDef.model,
  userPrompt,
  base64Image,
  mimeType,
  ANALYZE_PHOTO_TOOL,
  {
    systemPrompt,
    temperature: 0.0,
    maxTokens: 4000,  // Was 3000
    forceFunctionName: "analyze_dental_photo",
    timeoutMs: 55_000,
    thinkingLevel: "low",
    additionalImages: additionalImages.length > 0 ? additionalImages : undefined,
  }
);
```

**Step 4: Update post-processing for unified data**

In `post-processing.ts`, the existing safety nets (diastema, lower teeth, Black class) remain valid. Add handling for new aesthetic fields — ensure smile line and gengivoplasty consistency:

```typescript
// After existing post-processing, add:

// If smile_line is "baixa", remove gengivoplasty suggestions from detected_teeth
if (result.smile_line === 'baixa') {
  result.detected_teeth = result.detected_teeth.filter(
    t => t.treatment_indication !== 'gengivoplastia'
  );
}

// If no face photo, clear visagism fields
if (!hasAdditionalPhotos?.face) {
  result.face_shape = undefined;
  result.perceived_temperament = undefined;
  result.recommended_tooth_shape = undefined;
  result.visagism_notes = undefined;
}
```

**Step 5: Update response structure**

The response now returns the full unified result — no changes needed since `PhotoAnalysisResult` was extended in Task 1.

**Step 6: Commit**

```
feat(edge): update analyze-dental-photo for unified analysis
```

---

## Task 5: Simplify `generate-dsd` Edge Function (Simulation-Only)

**Files:**
- Modify: `supabase/functions/generate-dsd/index.ts`
- Delete: `supabase/functions/generate-dsd/proportions-analysis.ts` (analysis logic removed)
- Delete: `supabase/functions/generate-dsd/smile-line-classifier.ts` (redundant)

**Step 1: Read `generate-dsd/index.ts` current flow**

Understand the cache lookup chain (lines 117-168) and where `analyzeProportions()` is called.

**Step 2: Remove `analyzeProportions()` call**

The `generate-dsd` edge function should now REQUIRE `existingAnalysis` (the unified analysis from `analyze-dental-photo`). Remove the entire analysis branch:

Replace the cache lookup chain with a simple requirement:

```typescript
// Analysis MUST be provided — generate-dsd is now simulation-only
const analysis = validated.existingAnalysis;
if (!analysis) {
  return new Response(
    JSON.stringify({ error: 'existingAnalysis is required — run analyze-dental-photo first' }),
    { status: 400, headers: corsHeaders }
  );
}
```

**Step 3: Convert DSD analysis to the format simulation expects**

The simulation code (`simulation.ts`) expects a `DSDAnalysis` object. Create a converter from the unified `PhotoAnalysisResult`:

```typescript
function unifiedToDSDAnalysis(unified: PhotoAnalysisResult): DSDAnalysis {
  return {
    facial_midline: unified.facial_midline ?? 'centrada',
    dental_midline: unified.dental_midline ?? 'alinhada',
    smile_line: unified.smile_line ?? 'média',
    buccal_corridor: unified.buccal_corridor ?? 'adequado',
    occlusal_plane: unified.occlusal_plane ?? 'nivelado',
    golden_ratio_compliance: unified.golden_ratio_compliance ?? 50,
    symmetry_score: unified.symmetry_score ?? 50,
    suggestions: unified.detected_teeth
      .filter(t => t.current_issue && t.proposed_change)
      .map(t => ({
        tooth: t.tooth,
        current_issue: t.current_issue!,
        proposed_change: t.proposed_change!,
        treatment_indication: t.treatment_indication,
      })),
    observations: unified.observations,
    confidence: 'alta',
    lip_thickness: unified.lip_thickness,
    overbite_suspicion: unified.overbite_suspicion,
    face_shape: unified.face_shape,
    perceived_temperament: unified.perceived_temperament,
    smile_arc: unified.smile_arc,
    recommended_tooth_shape: unified.recommended_tooth_shape,
    visagism_notes: unified.visagism_notes,
  };
}
```

**Step 4: Remove imports of deleted modules**

Remove imports of `analyzeProportions`, `applySmileLineOverride`, and anything from `proportions-analysis.ts` or `smile-line-classifier.ts`.

**Step 5: Delete `proportions-analysis.ts` and `smile-line-classifier.ts`**

```bash
rm supabase/functions/generate-dsd/proportions-analysis.ts
rm supabase/functions/generate-dsd/smile-line-classifier.ts
```

**Step 6: Simplify credit logic**

Since analysis is now done in `analyze-dental-photo`, `generate-dsd` should ALWAYS be a follow-up call (simulation only). Ensure `isFollowUpCall = true` so no double-charging.

**Step 7: Commit**

```
refactor(edge): simplify generate-dsd to simulation-only
```

---

## Task 6: Lip Validation Model Change

**Files:**
- Modify: `supabase/functions/generate-dsd/simulation.ts`
- Modify: `supabase/functions/_shared/prompts/definitions/smile-line-classifier.ts` (if lip validation uses this prompt's model)

**Step 1: Read `simulation.ts` lip validation section**

Find the exact line where the Claude model is specified for lip validation (around lines 384-423).

**Step 2: Change model from Sonnet to Haiku**

The lip validation is a binary question ("did the lips move? SIM/NÃO") with `maxTokens: 10`. Change the model:

```typescript
// Was: claude-sonnet-4-6 (or from smileLinePromptDef.model)
// Now: claude-haiku-4-5-20251001
const lipValidationModel = 'claude-haiku-4-5-20251001';
```

**Step 3: Verify the change doesn't affect behavior**

The validation is binary (SIM/NÃO parsing) and fail-closed. Haiku handles this level of reasoning easily.

**Step 4: Commit**

```
perf(edge): switch lip validation from Sonnet to Haiku
```

---

## Task 7: Frontend Types

**Files:**
- Modify: `apps/web/src/types/wizard.ts`
- Modify: `apps/web/src/types/dsd.ts`

**Step 1: Extend frontend `DetectedTooth` with aesthetic fields**

In `apps/web/src/types/wizard.ts`, mirror the backend changes:

```typescript
export interface DetectedTooth {
  // ... existing fields ...

  // NEW aesthetic fields (from unified analysis)
  current_issue?: string;
  proposed_change?: string;
}
```

**Step 2: Extend frontend `PhotoAnalysisResult` with DSD fields**

```typescript
export interface PhotoAnalysisResult {
  // ... existing fields ...

  // NEW aesthetic/DSD fields
  facial_midline?: "centrada" | "desviada_esquerda" | "desviada_direita";
  dental_midline?: "alinhada" | "desviada_esquerda" | "desviada_direita";
  smile_line?: "alta" | "média" | "baixa";
  buccal_corridor?: "adequado" | "excessivo" | "ausente";
  occlusal_plane?: "nivelado" | "inclinado_esquerda" | "inclinado_direita";
  golden_ratio_compliance?: number;
  symmetry_score?: number;
  lip_thickness?: "fino" | "médio" | "volumoso";
  overbite_suspicion?: "sim" | "não" | "indeterminado";
  smile_arc?: "consonante" | "plano" | "reverso";
  face_shape?: string;
  perceived_temperament?: string;
  recommended_tooth_shape?: string;
  visagism_notes?: string;
}
```

**Step 3: Commit**

```
feat(types): extend frontend types for unified analysis
```

---

## Task 8: Frontend — Update `usePhotoAnalysis`

**Files:**
- Modify: `apps/web/src/hooks/domain/wizard/usePhotoAnalysis.ts`

**Step 1: Accept additional photos and preferences as params**

Add `additionalPhotos` and `patientPreferences` to the hook's input:

```typescript
export function usePhotoAnalysis({
  // ... existing params ...
  additionalPhotos?: AdditionalPhotos;
  patientPreferences?: PatientPreferences;
})
```

**Step 2: Pass additional data to edge function call**

In the `analyzePhoto` function, update the request body:

```typescript
const requestBody: Record<string, unknown> = {
  imageBase64: analysisImage,
  imageType: 'intraoral',
};
if (additionalPhotos?.face || additionalPhotos?.smile45) {
  requestBody.additionalPhotos = additionalPhotos;
}
if (patientPreferences) {
  requestBody.patientPreferences = patientPreferences;
}

const { data, error } = await invokeFunction<{ analysis: PhotoAnalysisResult }>(
  'analyze-dental-photo',
  { body: requestBody }
);
```

**Step 3: Commit**

```
feat(hooks): pass additional photos to unified analysis
```

---

## Task 9: Frontend — Remove `useDSDIntegration`

**Files:**
- Delete: `apps/web/src/hooks/domain/wizard/useDSDIntegration.ts`
- Modify: `apps/web/src/hooks/domain/useWizardFlow.ts`

**Step 1: Read `useWizardFlow.ts` to find DSD integration usage**

Find where `useDSDIntegration` is instantiated and used (around lines 181-188).

**Step 2: Remove `useDSDIntegration` import and instantiation**

In `useWizardFlow.ts`:
- Remove the import of `useDSDIntegration`
- Remove the `const dsd = useDSDIntegration({...})` block
- Replace `dsd.handleDSDComplete` with inline logic that:
  1. Stores DSD result (`setDsdResult`)
  2. Auto-includes gengivoplasty if analysis suggests it (move this logic from the deleted hook)
  3. Sets step to next

```typescript
// Replace dsd.handleDSDComplete with:
const handleDSDComplete = useCallback((result: DSDResult | null) => {
  setDsdResult(result);

  // Auto-include gengivoplasty from unified analysis
  const hasDsdGingivo = analysisResult?.detected_teeth?.some(
    t => t.treatment_indication === 'gengivoplastia'
  );
  if (hasDsdGingivo && result?.gingivoplastyApproved !== false) {
    setSelectedTeeth(prev => prev.includes('GENGIVO') ? prev : [...prev, 'GENGIVO']);
    setToothTreatments(prev => ({ ...prev, GENGIVO: 'gengivoplastia' }));
  }

  nav.setStep(5); // Review
}, [analysisResult, nav]);
```

**Step 3: Delete `useDSDIntegration.ts`**

```bash
rm apps/web/src/hooks/domain/wizard/useDSDIntegration.ts
```

**Step 4: Commit**

```
refactor(hooks): remove useDSDIntegration — analysis is unified
```

---

## Task 10: Frontend — Simplify `useDSDStep`

**Files:**
- Modify: `apps/web/src/components/wizard/dsd/useDSDStep.ts`

**Step 1: Remove DSD analysis call**

The `analyzeDSD` function currently calls `generate-dsd` with `analysisOnly: true` first. Remove this — analysis is already done. The DSD step should ONLY handle simulation generation.

**Step 2: Update `analyzeDSD` to pass pre-computed analysis**

Instead of requesting analysis, pass it:

```typescript
const requestBody = {
  imageBase64: compressedImage,
  evaluationId: evaluationId,
  regenerateSimulationOnly: true,  // Always true now — no analysis needed
  existingAnalysis: convertToLegacyDSD(analysisResult),  // From unified analysis
  toothShape: 'natural',
  additionalPhotos,
  patientPreferences,
  layerType,
};
```

Create a converter function:

```typescript
function convertToLegacyDSD(analysis: PhotoAnalysisResult): DSDAnalysis {
  return {
    facial_midline: analysis.facial_midline ?? 'centrada',
    dental_midline: analysis.dental_midline ?? 'alinhada',
    smile_line: analysis.smile_line ?? 'média',
    buccal_corridor: analysis.buccal_corridor ?? 'adequado',
    occlusal_plane: analysis.occlusal_plane ?? 'nivelado',
    golden_ratio_compliance: analysis.golden_ratio_compliance ?? 50,
    symmetry_score: analysis.symmetry_score ?? 50,
    suggestions: analysis.detected_teeth
      .filter(t => t.current_issue && t.proposed_change)
      .map(t => ({
        tooth: t.tooth,
        current_issue: t.current_issue!,
        proposed_change: t.proposed_change!,
        treatment_indication: t.treatment_indication,
      })),
    observations: analysis.observations,
    confidence: 'alta',
    lip_thickness: analysis.lip_thickness,
    overbite_suspicion: analysis.overbite_suspicion,
    smile_arc: analysis.smile_arc,
    face_shape: analysis.face_shape,
    perceived_temperament: analysis.perceived_temperament,
    recommended_tooth_shape: analysis.recommended_tooth_shape,
    visagism_notes: analysis.visagism_notes,
  };
}
```

**Step 3: Remove credits check for analysis**

DSD step no longer does analysis — only simulation. Adjust credit check to use `'dsd_simulation'` operation.

**Step 4: Commit**

```
refactor(dsd): simplify DSD step to simulation-only
```

---

## Task 11: Frontend — Update `useWizardSubmit`

**Files:**
- Modify: `apps/web/src/hooks/domain/wizard/useWizardSubmit.ts`

**Step 1: Simplify DSD context extraction**

Currently, `dispatchProtocolForTooth()` looks up DSD suggestions in `dsdResult.analysis.suggestions`. Now, the data is directly in `analysisResult.detected_teeth`:

```typescript
// Before:
const dsdSuggestion = dsdResult?.analysis?.suggestions?.find(s => s.tooth === tooth);

// After:
const toothData = getToothData(analysisResult, tooth);
// toothData already has current_issue and proposed_change
const dsdContext = toothData?.current_issue ? {
  currentIssue: toothData.current_issue,
  proposedChange: toothData.proposed_change,
  observations: analysisResult?.observations,
  smileLine: analysisResult?.smile_line,
  symmetryScore: analysisResult?.symmetry_score,
  smileArc: analysisResult?.smile_arc,
} : undefined;
```

**Step 2: Remove DSD result dependency for evaluation insert**

In `buildEvaluationInsertData()`, the DSD analysis was pulled from `dsdResult.analysis`. Now pull from `analysisResult`:

```typescript
// Before:
dsd_analysis: dsdResult?.analysis ?? null,

// After:
dsd_analysis: analysisResult ? {
  facial_midline: analysisResult.facial_midline,
  dental_midline: analysisResult.dental_midline,
  smile_line: analysisResult.smile_line,
  // ... other aesthetic fields
  suggestions: analysisResult.detected_teeth
    .filter(t => t.current_issue)
    .map(t => ({
      tooth: t.tooth,
      current_issue: t.current_issue,
      proposed_change: t.proposed_change,
      treatment_indication: t.treatment_indication,
    })),
  observations: analysisResult.observations,
} : null,
```

**Step 3: Commit**

```
refactor(submit): use unified analysis data in protocol dispatch
```

---

## Task 12: Update Prompt Regression Tests

**Files:**
- Modify: `supabase/functions/_shared/prompts/prompts.test.ts`

**Step 1: Update model assignment tests**

The test that checks `dsd-analysis` model assignment may need updating since the prompt is being replaced:

- Remove test for `smile-line-classifier` prompt (deleted)
- Update test for `analyze-dental-photo` to verify it now includes aesthetic keywords
- Add test that unified prompt contains both clinical AND aesthetic rules

**Step 2: Add cross-section consistency test**

```typescript
Deno.test("unified prompt contains clinical AND aesthetic rules", () => {
  const prompt = getPrompt('analyze-dental-photo');
  const system = prompt.system({ imageType: 'intraoral' });

  // Clinical rules present
  assert(system.includes("Classe I"), "Missing Black classification");
  assert(system.includes("substrato"), "Missing substrate analysis");
  assert(system.includes("dsd_simulation_suitability"), "Missing DSD suitability");

  // Aesthetic rules present
  assert(system.includes("facial_midline") || system.includes("linha média facial"), "Missing facial midline");
  assert(system.includes("golden_ratio") || system.includes("proporção áurea"), "Missing golden ratio");
  assert(system.includes("visagism") || system.includes("VISAGISMO"), "Missing visagism");
  assert(system.includes("homólog"), "Missing homolog comparison");
});
```

**Step 3: Remove smile-line-classifier tests**

Remove tests referencing the deleted `smile-line-classifier` prompt.

**Step 4: Run all tests**

```bash
cd supabase/functions/_shared/prompts && deno test prompts.test.ts
```

**Step 5: Commit**

```
test: update prompt regression tests for unified analysis
```

---

## Task 13: Remove `dsd-analysis` and `smile-line-classifier` Prompts from Registry

**Files:**
- Modify: `supabase/functions/_shared/prompts/registry.ts`
- Delete: `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts`
- Delete: `supabase/functions/_shared/prompts/definitions/smile-line-classifier.ts` (if exists as separate file)

**Step 1: Remove from registry**

In `registry.ts`, remove the imports and registrations for `dsdAnalysis` and `smileLineClassifier`.

**Step 2: Keep `dsd-simulation` prompt**

The simulation prompt (`dsd-simulation.ts`, `dsd-simulation-shared.ts`, `dsd-simulation-builders.ts`) must NOT be deleted — it's used by `simulation.ts` for image generation.

**Step 3: Delete unused prompt files**

```bash
rm supabase/functions/_shared/prompts/definitions/dsd-analysis.ts
```

Check if `smile-line-classifier.ts` exists as a separate prompt definition file and delete it too.

**Step 4: Run tests again**

```bash
cd supabase/functions/_shared/prompts && deno test prompts.test.ts
```

**Step 5: Commit**

```
refactor(prompts): remove redundant dsd-analysis and smile-line-classifier prompts
```

---

## Task 14: Integration Verification

**Step 1: Check TypeScript compilation**

```bash
cd apps/web && npx tsc --noEmit
```

Fix any type errors from the refactoring.

**Step 2: Check edge function compilation**

```bash
cd supabase/functions && deno check analyze-dental-photo/index.ts
cd supabase/functions && deno check generate-dsd/index.ts
```

**Step 3: Run prompt tests**

```bash
cd supabase/functions/_shared/prompts && deno test prompts.test.ts
```

**Step 4: Run frontend build**

```bash
cd apps/web && npm run build
```

**Step 5: Commit any fixes**

```
fix: resolve compilation errors from unified analysis refactoring
```

---

## Task 15: Deploy & Validate

**Step 1: Deploy updated edge functions**

```bash
# Docker must be running: open -a Docker
# Deploy SEQUENTIALLY (parallel deploys cause ENOTEMPTY race conditions)
npx supabase functions deploy analyze-dental-photo --no-verify-jwt --use-docker
npx supabase functions deploy generate-dsd --no-verify-jwt --use-docker
```

**Step 2: Deploy frontend**

```bash
npx vercel deploy --prod
```

**Step 3: Manual validation with real cases**

Test with at least 3 case types:
1. **Simple anterior case** — verify unified analysis detects teeth and provides aesthetic suggestions
2. **Case with face photo** — verify visagism analysis is included
3. **Case WITHOUT DSD** — verify analysis works standalone for protocol generation
4. **DSD simulation** — verify simulation receives pre-computed analysis correctly

**Step 4: Compare outputs**

For each test case, compare:
- Number of teeth detected (should be consistent, no 8 vs 4)
- Treatment indications (should be coherent, no conflicts)
- Smile line classification (one classification, no 3x redundancy)
- Aesthetic fields (proportions, visagism) present in analysis result

---

## Summary of Changes

| Action | File | Impact |
|--------|------|--------|
| Extend | `analyze-dental-photo/types.ts` | Unified types |
| Extend | `analyze-dental-photo/tool-schema.ts` | Unified schema |
| Rewrite | `_shared/prompts/definitions/analyze-dental-photo.ts` | Unified prompt |
| Modify | `analyze-dental-photo/index.ts` | Accept additional photos |
| Modify | `analyze-dental-photo/post-processing.ts` | Aesthetic safety nets |
| Simplify | `generate-dsd/index.ts` | Simulation-only |
| Delete | `generate-dsd/proportions-analysis.ts` | Analysis removed |
| Delete | `generate-dsd/smile-line-classifier.ts` | Redundant |
| Modify | `generate-dsd/simulation.ts` | Lip validation → Haiku |
| Extend | `apps/web/src/types/wizard.ts` | Frontend unified types |
| Modify | `apps/web/src/hooks/.../usePhotoAnalysis.ts` | Pass additional photos |
| Delete | `apps/web/src/hooks/.../useDSDIntegration.ts` | No more merge |
| Simplify | `apps/web/src/components/.../useDSDStep.ts` | Simulation-only |
| Modify | `apps/web/src/hooks/.../useWizardFlow.ts` | Remove DSD integration |
| Modify | `apps/web/src/hooks/.../useWizardSubmit.ts` | Use unified data |
| Update | `_shared/prompts/prompts.test.ts` | Updated tests |
| Delete | `_shared/prompts/definitions/dsd-analysis.ts` | Redundant prompt |
| Modify | `_shared/prompts/registry.ts` | Remove deleted prompts |
