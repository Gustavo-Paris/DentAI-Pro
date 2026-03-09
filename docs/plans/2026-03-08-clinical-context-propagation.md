# Clinical Context Propagation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ensure all patient data collected in the wizard (anamnesis, clinical notes, substrate condition, enamel condition, depth, whitening preference) reaches every AI call — including retry and regeneration flows — and that the photo analysis prompt uses the anamnesis to actively guide specific diagnoses.

**Architecture:** All context data is already persisted in the evaluations DB. The gaps are: (1) `clinicalNotes` is never saved, (2) retry/regeneration flows dispatch to edge functions without reading the stored context fields, (3) `addTeethFlow` misses the same fields, (4) `analyze-dental-photo` prompt uses anamnesis generically without keyword-triggered specifics. Fix is purely frontend data-wiring + one prompt strengthening — no schema migrations required.

**Tech Stack:** React 18, TypeScript, Supabase (Deno edge functions), React Query, i18n

---

## Task 1: Add missing fields to `SessionEvaluationRow` + `listBySession` query

**Files:**
- Modify: `apps/web/src/data/evaluations.ts:42-85` (interface) + `:160-183` (query)

**Step 1: Add fields to interface**

In `SessionEvaluationRow` (after line 67 `substrate: string | null;`), add:

```typescript
  substrate_condition: string | null;
  enamel_condition: string | null;
  depth: string | null;
  anamnesis: string | null;
```

**Step 2: Add fields to `listBySession` SELECT**

In the `.select(...)` string (lines 165-175), add `substrate_condition, enamel_condition, depth, anamnesis,` to the list. The updated select should include:

```typescript
      .select(`
        id, created_at, patient_name, patient_id, patient_age, tooth,
        cavity_class, restoration_size, status, photo_frontal,
        checklist_progress, stratification_protocol, treatment_type,
        ai_treatment_indication, ai_indication_reason, cementation_protocol, generic_protocol,
        tooth_color, bruxism, aesthetic_level, budget, longevity_expectation, patient_aesthetic_goals,
        region, substrate, substrate_condition, enamel_condition, depth, stratification_needed,
        recommendation_text, alternatives, protocol_layers, alerts, warnings, session_id,
        dsd_analysis, dsd_simulation_url, dsd_simulation_layers,
        anamnesis,
        resins:resins!recommended_resin_id (*),
        ideal_resin:resins!ideal_resin_id (*)
      `)
```

**Step 3: Verify TypeScript compiles**

```bash
cd /Users/gustavoparis/www/DentAI-Pro
pnpm --filter web tsc --noEmit 2>&1 | head -30
```

Expected: no new errors on these fields (they exist in the DB view).

**Step 4: Commit**

```bash
git add apps/web/src/data/evaluations.ts
git commit -m "fix: add anamnesis + clinical fields to SessionEvaluationRow query"
```

---

## Task 2: Add `anamnesis` to `PatientDataForModal` + `useEvaluationData`

**Files:**
- Modify: `apps/web/src/hooks/domain/useEvaluationDetail.ts:26-37` (interface)
- Modify: `apps/web/src/hooks/domain/evaluation/useEvaluationData.ts` (patientDataForModal memo)

**Step 1: Extend `PatientDataForModal` interface**

In `useEvaluationDetail.ts`, add `anamnesis` field:

```typescript
export interface PatientDataForModal {
  name: string | null;
  age: number;
  id: string | null;
  vitaShade: string;
  bruxism: boolean;
  aestheticLevel: string;
  budget: string;
  longevityExpectation: string;
  photoPath: string | null;
  aestheticGoals: string | null;
  anamnesis: string | null;   // ADD THIS
}
```

**Step 2: Populate `anamnesis` in `useEvaluationData.ts`**

Find the `patientDataForModal` `useMemo` (around line 110). Add `anamnesis: firstEval?.anamnesis ?? null` to the returned object. The `firstEval` variable should already exist (the first evaluation in the session gives the session-level data).

**Step 3: TypeScript check**

```bash
pnpm --filter web tsc --noEmit 2>&1 | head -30
```

Expected: only errors about places that construct `PatientDataForModal` without `anamnesis` (these will be fixed in next steps).

**Step 4: Commit**

```bash
git add apps/web/src/hooks/domain/useEvaluationDetail.ts apps/web/src/hooks/domain/evaluation/useEvaluationData.ts
git commit -m "fix: add anamnesis to PatientDataForModal interface and data source"
```

---

## Task 3: Wire `clinicalNotes` into `anamnesis` at wizard submit time

**Files:**
- Modify: `apps/web/src/hooks/domain/wizard/useWizardSubmit.ts`

**Context:** `formData.clinicalNotes` is the dentist's manual clinical notes (speech-to-text or typed). It's never saved to the DB. `anamnesis` is the patient's voice-recorded history. Both should reach the AI as a single enriched anamnesis field.

**Step 1: Build merged anamnesis before save**

In `useWizardSubmit` function body (after destructuring params), build `fullAnamnesis`:

```typescript
// Merge clinicalNotes into anamnesis so it persists and reaches all AI calls
const fullAnamnesis = [
  anamnesis?.trim(),
  formData.clinicalNotes?.trim() ? `Notas clínicas do dentista: ${formData.clinicalNotes.trim()}` : undefined,
].filter(Boolean).join('\n\n') || null;
```

**Step 2: Replace `anamnesis` with `fullAnamnesis` in evaluation save**

Find line: `anamnesis: anamnesis || null,`
Replace with: `anamnesis: fullAnamnesis,`

**Step 3: Replace `anamnesis` with `fullAnamnesis` in resinParams and cementationParams**

In `dispatchProtocolForTooth`, the `resinParams` and `cementationParams` both have `anamnesis,`. Replace both with `anamnesis: fullAnamnesis,`.

Note: `fullAnamnesis` must be in scope — it's a variable in the outer hook function, so inner functions (`dispatchProtocolForTooth`) can close over it.

**Step 4: TypeScript check + commit**

```bash
pnpm --filter web tsc --noEmit 2>&1 | head -30
git add apps/web/src/hooks/domain/wizard/useWizardSubmit.ts
git commit -m "fix: merge clinicalNotes into anamnesis before saving and dispatching protocols"
```

---

## Task 4: Wire full context into `handleRetryEvaluation`

**Files:**
- Modify: `apps/web/src/hooks/domain/evaluation/useEvaluationActions.ts:245-322`

**Context:** When "Reprocessar caso" is triggered, the edge function receives LESS context than the original wizard submit. Missing: `anamnesis`, `aestheticGoals`, `substrateCondition`, `enamelCondition`, `depth`.

**Step 1: Enrich `resinParams` in `handleRetryEvaluation`**

Current `resinParams` block (around line 265-279). Add the missing fields:

```typescript
resinParams: treatmentType === 'resina' ? {
  userId: user.id,
  patientAge: String(evaluation.patient_age),
  tooth: evaluation.tooth,
  region: evaluation.region || getFullRegion(evaluation.tooth),
  cavityClass: evaluation.cavity_class || 'Classe I',
  restorationSize: evaluation.restoration_size || 'Média',
  substrate: evaluation.substrate || 'Esmalte e Dentina',
  substrateCondition: evaluation.substrate_condition ?? undefined,   // ADD
  enamelCondition: evaluation.enamel_condition ?? undefined,          // ADD
  depth: evaluation.depth ?? undefined,                               // ADD
  bruxism: evaluation.bruxism,
  aestheticLevel: evaluation.aesthetic_level,
  toothColor: evaluation.tooth_color,
  stratificationNeeded: true,
  budget: evaluation.budget,
  longevityExpectation: evaluation.longevity_expectation,
  aestheticGoals: resolveAestheticGoalsForAI(evaluation.patient_aesthetic_goals),  // ADD
  anamnesis: evaluation.anamnesis ?? undefined,                       // ADD
} : undefined,
```

**Step 2: Enrich `cementationParams` in `handleRetryEvaluation`**

Add to the cementation block (around line 280-287):

```typescript
cementationParams: treatmentType === 'porcelana' ? {
  teeth: [evaluation.tooth],
  shade: evaluation.tooth_color,
  ceramicType: DEFAULT_CERAMIC_TYPE,
  substrate: evaluation.substrate || 'Esmalte e Dentina',
  substrateCondition: 'Saudável',
  aestheticGoals: resolveAestheticGoalsForAI(evaluation.patient_aesthetic_goals),  // ADD
  anamnesis: evaluation.anamnesis ?? undefined,                                      // ADD
} : undefined,
```

**Step 3: TypeScript check + commit**

```bash
pnpm --filter web tsc --noEmit 2>&1 | head -30
git add apps/web/src/hooks/domain/evaluation/useEvaluationActions.ts
git commit -m "fix: pass full clinical context (anamnesis, aestheticGoals, substrate/enamel/depth) in retry flow"
```

---

## Task 5: Wire full context into `handleRegenerateWithBudget`

**Files:**
- Modify: `apps/web/src/hooks/domain/evaluation/useEvaluationActions.ts:324-430`

**Step 1: Enrich `resinParams` in `handleRegenerateWithBudget`**

Find the `resinParams` block (around lines 360-375). Add:

```typescript
substrateCondition: evaluation.substrate_condition ?? undefined,
enamelCondition: evaluation.enamel_condition ?? undefined,
depth: evaluation.depth ?? undefined,
anamnesis: evaluation.anamnesis ?? undefined,
```

Note: `aestheticGoals` is already passed here — don't duplicate.

**Step 2: Enrich `cementationParams` in `handleRegenerateWithBudget`**

Find the `cementationParams` block (around lines 376-383). Add:

```typescript
anamnesis: evaluation.anamnesis ?? undefined,
```

**Step 3: TypeScript check + commit**

```bash
pnpm --filter web tsc --noEmit 2>&1 | head -30
git add apps/web/src/hooks/domain/evaluation/useEvaluationActions.ts
git commit -m "fix: pass anamnesis and detected clinical fields in budget regeneration flow"
```

---

## Task 6: Wire full context into `useAddTeethFlow`

**Files:**
- Modify: `apps/web/src/hooks/domain/evaluation/useAddTeethFlow.ts:155-188`

**Step 1: Enrich `resinParams` in `useAddTeethFlow`**

Find the resinParams block (around lines 162-175). Add:

```typescript
substrateCondition: toothData.substrate_condition ?? undefined,
enamelCondition: toothData.enamel_condition ?? undefined,
depth: toothData.depth ?? undefined,
aestheticGoals: resolveAestheticGoalsForAI(patientDataForModal.aestheticGoals),
anamnesis: patientDataForModal.anamnesis ?? undefined,
```

**Step 2: Enrich `cementationParams` in `useAddTeethFlow`**

Add to cementation block (around line 176-183):

```typescript
anamnesis: patientDataForModal.anamnesis ?? undefined,
```

**Step 3: TypeScript check + commit**

```bash
pnpm --filter web tsc --noEmit 2>&1 | head -30
git add apps/web/src/hooks/domain/evaluation/useAddTeethFlow.ts
git commit -m "fix: pass anamnesis + clinical fields when adding teeth to existing case"
```

---

## Task 7: Strengthen anamnesis-guided analysis in `analyze-dental-photo`

**Files:**
- Modify: `supabase/functions/analyze-dental-photo/index.ts` (around line 127-128)

**Context:** The current prompt adds anamnesis context with generic guidance ("correlacione achados visuais com a queixa"). The QA found that fluorose/hipoplasia mentioned in anamnesis was ignored by the AI. The fix adds keyword-triggered specific search instructions.

**Step 1: Replace the anamnesis context block**

Find lines 127-128:
```typescript
      additionalContext += `\n\nTRANSCRICAO DA ANAMNESE DO PACIENTE:\n"""${sanitizeForPrompt(anamnesis.trim())}"""\n\nCORRELACIONE os achados visuais com a queixa do paciente. Priorize problemas que o paciente reportou. Se o paciente mencionar sintomas nao visiveis na foto (sensibilidade, dor), registre em observations como informacao clinica relevante.`;
```

Replace with:

```typescript
      const anamnesisLower = anamnesis.toLowerCase();
      const extraInstructions: string[] = [
        'CORRELACIONE os achados visuais com a queixa do paciente. Priorize problemas que o paciente reportou.',
        'Se o paciente mencionar sintomas nao visiveis na foto (sensibilidade, dor), registre em observations como informacao clinica relevante.',
      ];
      if (anamnesisLower.includes('fluorose') || anamnesisLower.includes('hipoplasia') || anamnesisLower.includes('mancha') || anamnesisLower.includes('leucoma')) {
        extraInstructions.push('OBRIGATORIO: Paciente reportou fluorose/hipoplasia/manchas. Inspecionar ATIVAMENTE manchas brancas opacas (leucomas), manchas marrons e irregularidades de superficie. Diferenciar de carie (carie: marron/preta, localizada; fluorose: branca/creme, difusa/bilateral). Registrar em cada dente afetado.');
      }
      if (anamnesisLower.includes('bruxismo') || anamnesisLower.includes('apertamento') || anamnesisLower.includes('ranger')) {
        extraInstructions.push('OBRIGATORIO: Paciente reportou bruxismo/apertamento. Inspecionar ATIVAMENTE facetas de desgaste (superficies oclusais/incisais planas, brilhantes), desgaste generalizado e abfracao cervical. Registrar urgencia adequada para dentes com desgaste severo.');
      }
      if (anamnesisLower.includes('trauma') || anamnesisLower.includes('queda') || anamnesisLower.includes('acidente')) {
        extraInstructions.push('OBRIGATORIO: Paciente reportou trauma. Inspecionar ATIVAMENTE alteracao de cor (escurecimento intriseco), fraturas coronais/radiculares, restauracoes antigas pos-trauma. Considerar vitalidade pulpar comprometida em dentes com historico de trauma.');
      }
      if (anamnesisLower.includes('sensibilidade') || anamnesisLower.includes('sensivel') || anamnesisLower.includes('dor ao frio') || anamnesisLower.includes('dor ao quente')) {
        extraInstructions.push('Paciente reportou sensibilidade/dor. Registrar em observations. O protocolo deve incluir dessensibilizante se indicado.');
      }
      additionalContext += `\n\nTRANSCRICAO DA ANAMNESE DO PACIENTE:\n"""${sanitizeForPrompt(anamnesis.trim())}"""\n\n${extraInstructions.join('\n')}`;
```

**Step 2: Verify Deno types (no imports needed — uses only string methods)**

```bash
cd /Users/gustavoparis/www/DentAI-Pro
# Quick syntax check
deno check supabase/functions/analyze-dental-photo/index.ts 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add supabase/functions/analyze-dental-photo/index.ts
git commit -m "fix: strengthen anamnesis-guided analysis — keyword triggers for fluorose, bruxismo, trauma"
```

---

## Task 8: Deploy + verify

**Step 1: Deploy analyze-dental-photo edge function**

```bash
# Ensure Docker is running
open -a Docker
# Wait ~10s for Docker, then deploy
rm -f deno.lock
npx supabase functions deploy analyze-dental-photo --no-verify-jwt --use-docker
```

**Step 2: Deploy frontend to Vercel**

```bash
git push origin main
```

Vercel auto-deploys from main. Check https://tosmile-ai.vercel.app in ~2 minutes.

**Step 3: Smoke test**

Create a new case with:
- Anamnesis mentioning "fluorose" or "bruxismo"
- Fill clinical notes field with specific dentist observations
- Complete wizard
- Verify protocol is generated (timeout bug already fixed)
- Verify the analysis mentions the anamnesis-triggered findings

**Step 4: Final commit (if any loose ends)**

```bash
git status
# If anything unstaged:
git add -A
git commit -m "fix: clinical context propagation — full end-to-end data coherence"
```

---

## Summary of changes

| File | What changes |
|------|-------------|
| `data/evaluations.ts` | Add `anamnesis`, `substrate_condition`, `enamel_condition`, `depth` to `SessionEvaluationRow` + query |
| `hooks/domain/useEvaluationDetail.ts` | Add `anamnesis` to `PatientDataForModal` |
| `hooks/domain/evaluation/useEvaluationData.ts` | Populate `anamnesis` in patientDataForModal memo |
| `hooks/domain/wizard/useWizardSubmit.ts` | Merge `clinicalNotes` → `fullAnamnesis` before save + AI dispatch |
| `hooks/domain/evaluation/useEvaluationActions.ts` | Add `anamnesis`, `aestheticGoals`, `substrate_condition`, `enamel_condition`, `depth` to retry + regen flows |
| `hooks/domain/evaluation/useAddTeethFlow.ts` | Add `anamnesis`, `aestheticGoals`, `substrate_condition`, `enamel_condition`, `depth` to add-teeth flow |
| `supabase/functions/analyze-dental-photo/index.ts` | Keyword-triggered anamnesis instructions (fluorose, bruxismo, trauma) |

**No schema migrations needed** — all DB columns exist (migration 051 added `anamnesis`; `substrate_condition`/`enamel_condition`/`depth` are in the base schema).
