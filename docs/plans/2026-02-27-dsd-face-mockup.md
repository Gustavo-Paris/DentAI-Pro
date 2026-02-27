# DSD Face Mockup — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generate a full-face DSD simulation by editing the patient's face photo with Gemini image edit, showing the new smile in context.

**Architecture:** Extend the existing `generate-dsd` edge function with a new `layerType: "face-mockup"`. Frontend adds a "Simular no rosto" button in `DSDSimulationViewer` that triggers on-demand generation. Result stored as a `SimulationLayer` and displayed as a new tab.

**Tech Stack:** Gemini 3.1 Pro image edit, Supabase Edge Functions (Deno), React + TypeScript

---

## Task 1: Add `face-mockup` type to frontend types

**Files:**
- Modify: `apps/web/src/types/dsd.ts:63-101`

**Step 1: Add type to union**

In `apps/web/src/types/dsd.ts`, add `'face-mockup'` to `SimulationLayerType`:

```typescript
export type SimulationLayerType =
  | 'restorations-only'
  | 'whitening-restorations'
  | 'complete-treatment'
  | 'face-mockup';
```

**Step 2: Add label mappings**

Add to `LAYER_LABEL_KEYS`:
```typescript
'face-mockup': 'dsd.layers.faceMockup',
```

Add to `LAYER_LABEL_DEFAULTS`:
```typescript
'face-mockup': 'Simulação no Rosto',
```

**Step 3: Add i18n keys**

In `apps/web/src/locales/pt-BR.json`, add under `dsd.layers`:
```json
"faceMockup": "Simulação no Rosto"
```

In `apps/web/src/locales/en-US.json`, add under `dsd.layers`:
```json
"faceMockup": "Face Simulation"
```

Also add button labels under `components.wizard.dsd`:
```json
// pt-BR
"simulateOnFace": "Simular no rosto",
"generatingFaceMockup": "Gerando simulação no rosto...",
"faceMockupError": "Erro ao gerar simulação no rosto",
"facePhotoRequired": "Envie uma foto de rosto para usar esta funcionalidade"

// en-US
"simulateOnFace": "Simulate on face",
"generatingFaceMockup": "Generating face simulation...",
"faceMockupError": "Error generating face simulation",
"facePhotoRequired": "Upload a face photo to use this feature"
```

**Step 4: Commit**

```bash
git add apps/web/src/types/dsd.ts apps/web/src/locales/pt-BR.json apps/web/src/locales/en-US.json
git commit -m "feat(types): add face-mockup SimulationLayerType + i18n keys"
```

---

## Task 2: Backend — handle `face-mockup` in generate-dsd

**Files:**
- Modify: `supabase/functions/generate-dsd/index.ts:242-266`
- Modify: `supabase/functions/generate-dsd/simulation.ts`

**Step 1: Add face-mockup to layer label mapping in index.ts**

In `index.ts:244-249`, add the face-mockup case to the label resolution:

```typescript
const newLayer = {
  type: layerType,
  label: layerType === 'restorations-only' ? 'Apenas Restaurações'
    : layerType === 'complete-treatment' ? 'Tratamento Completo'
    : layerType === 'root-coverage' ? 'Recobrimento Radicular'
    : layerType === 'face-mockup' ? 'Simulação no Rosto'
    : 'Restaurações + Clareamento',
  simulation_url: simulationUrl,
  whitening_level: patientPreferences?.whiteningLevel || 'natural',
  includes_gengivoplasty: false, // face-mockup never has gengivoplasty flag
};
```

Also update `includes_gengivoplasty` logic to exclude face-mockup:

```typescript
includes_gengivoplasty: (layerType === 'complete-treatment' || layerType === 'root-coverage') && ...
```

This already excludes `face-mockup` — no change needed.

**Step 2: Handle face photo input in index.ts**

The face photo comes as `additionalPhotos.face` in the request body. When `layerType === 'face-mockup'`, the edge function should use `additionalPhotos.face` as the base image instead of `imageBase64`.

Near the `generateSimulation` call (~L216), add:

```typescript
// For face-mockup, use the face photo as base image
const simulationBaseImage = layerType === 'face-mockup' && additionalPhotos?.face
  ? additionalPhotos.face
  : imageBase64;

const simResult = await generateSimulation(
  simulationBaseImage, analysis, user.id, supabase,
  toothShape || 'natural', patientPreferences,
  layerType, inputAlreadyProcessed
);
```

**Step 3: Add face-mockup prompt variant in simulation.ts**

In `simulation.ts`, the prompt variant selection (~L239-243) needs a new case. Add before the existing selection:

```typescript
if (layerType === 'face-mockup') {
  promptType = 'face-mockup';
}
```

Then create the face-mockup prompt. The prompt should:
- Instruct Gemini to edit ONLY the mouth/smile region in the full face photo
- Apply the same dental corrections from the DSD analysis
- Preserve face identity, skin texture, lighting, background, hair, eyes
- Apply whitening level from patient preferences

Add a new prompt section in the prompt building logic or create a dedicated `getFaceMockupPrompt()` function:

```typescript
function buildFaceMockupPrompt(
  analysis: DSDAnalysis,
  whiteningLevel: string,
  colorInstruction: string,
): string {
  const suggestions = analysis.suggestions
    .map(s => `- Tooth ${s.tooth}: ${s.proposed_change}`)
    .join('\n');

  return `Edit this FULL FACE PHOTO to show a new smile.

CRITICAL RULES:
1. ONLY modify the TEETH visible in the smile. Do NOT change anything else.
2. PRESERVE the face exactly: eyes, nose, skin, hair, background, lighting, lip shape, lip color.
3. The lips must remain in EXACTLY the same position and shape.
4. Keep the same camera angle, lighting, and photo quality.

DENTAL CHANGES TO APPLY:
${suggestions}

WHITENING: ${colorInstruction}

The result should look like a natural photo of the same person with improved teeth.
Do NOT make the image look artificial or overly edited.`;
}
```

**Step 4: Skip lip validation for face-mockup**

In `simulation.ts`, the lip validation section should skip for face-mockup (the face context makes lip validation unreliable since the full face is different from close-up):

```typescript
// Skip lip validation for face-mockup (full face context differs from close-up)
if (layerType !== 'face-mockup') {
  // ... existing lip validation logic
}
```

**Step 5: Commit**

```bash
git add supabase/functions/generate-dsd/index.ts supabase/functions/generate-dsd/simulation.ts
git commit -m "feat(backend): handle face-mockup layerType in generate-dsd"
```

---

## Task 3: Frontend — generateFaceMockup in useDSDStep

**Files:**
- Modify: `apps/web/src/components/wizard/dsd/useDSDStep.ts`

**Step 1: Add state for face mockup generation**

Near the existing layer state declarations, add:

```typescript
const [isFaceMockupGenerating, setIsFaceMockupGenerating] = useState(false);
const [faceMockupError, setFaceMockupError] = useState<string | null>(null);
```

**Step 2: Create generateFaceMockup function**

After the `generateAllLayers` function (~L527), add:

```typescript
const generateFaceMockup = useCallback(async () => {
  if (!additionalPhotos?.face || !result?.analysis) return;

  setIsFaceMockupGenerating(true);
  setFaceMockupError(null);

  try {
    const response = await invokeFunction('generate-dsd', {
      body: {
        reqId: crypto.randomUUID(),
        imageBase64: additionalPhotos.face,
        regenerateSimulationOnly: true,
        existingAnalysis: result.analysis,
        patientPreferences,
        layerType: 'face-mockup',
        additionalPhotos: { face: additionalPhotos.face, smile45: null },
      },
    });

    if (response?.simulation_url) {
      const signedUrl = await resolveLayerUrl(response.simulation_url);
      const newLayer: SimulationLayer = {
        type: 'face-mockup',
        label: 'Simulação no Rosto',
        simulation_url: response.simulation_url,
        whitening_level: patientPreferences?.whiteningLevel || 'natural',
        includes_gengivoplasty: false,
      };

      setLayers(prev => {
        // Replace existing face-mockup or append
        const filtered = prev.filter(l => l.type !== 'face-mockup');
        return [...filtered, newLayer];
      });

      // Switch to the face-mockup tab
      setActiveLayerIndex(layers.length);
    } else {
      setFaceMockupError(response?.simulation_debug || 'Generation failed');
    }
  } catch (err) {
    setFaceMockupError((err as Error).message);
  } finally {
    setIsFaceMockupGenerating(false);
  }
}, [additionalPhotos?.face, result?.analysis, invokeFunction, patientPreferences, layers.length]);
```

**Step 3: Expose in return object**

Add to the hook's return object:

```typescript
return {
  // ... existing returns
  isFaceMockupGenerating,
  faceMockupError,
  generateFaceMockup,
  hasFacePhoto: !!additionalPhotos?.face,
};
```

**Step 4: Commit**

```bash
git add apps/web/src/components/wizard/dsd/useDSDStep.ts
git commit -m "feat(hook): add generateFaceMockup to useDSDStep"
```

---

## Task 4: Frontend — "Simular no rosto" button in DSDSimulationViewer

**Files:**
- Modify: `apps/web/src/components/wizard/dsd/DSDSimulationViewer.tsx`
- Modify: `apps/web/src/components/wizard/dsd/DSDAnalysisView.tsx` (if button goes in analysis view)
- Modify: `apps/web/src/components/wizard/DSDStep.tsx` (prop wiring)

**Step 1: Add props to DSDSimulationViewer**

Add to the props interface:

```typescript
hasFacePhoto?: boolean;
isFaceMockupGenerating?: boolean;
faceMockupError?: string | null;
onGenerateFaceMockup?: () => void;
```

**Step 2: Add button in the viewer**

Below the layer tabs, add the "Simular no rosto" button (only visible when face photo exists and no face-mockup layer yet):

```tsx
{hasFacePhoto && !layers.some(l => l.type === 'face-mockup') && (
  <Button
    variant="outline"
    size="sm"
    onClick={onGenerateFaceMockup}
    disabled={isFaceMockupGenerating || layersGenerating}
    className="gap-2"
  >
    {isFaceMockupGenerating ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('components.wizard.dsd.generatingFaceMockup')}
      </>
    ) : (
      <>
        <User className="h-4 w-4" />
        {t('components.wizard.dsd.simulateOnFace')}
      </>
    )}
  </Button>
)}
```

**Step 3: Handle face-mockup layer display**

The face-mockup layer uses the face photo as "before" instead of the intraoral photo. In the ComparisonSlider section, when the active layer is face-mockup, use the face photo:

```tsx
const isActiveFaceMockup = layers[activeLayerIndex]?.type === 'face-mockup';
const beforeImage = isActiveFaceMockup ? facePhotoBase64 : imageBase64;
```

Add `facePhotoBase64` as a new prop.

**Step 4: Wire props through DSDStep.tsx**

In `DSDStep.tsx`, pass the new props from `useDSDStep` to `DSDSimulationViewer`:

```tsx
<DSDSimulationViewer
  // ... existing props
  hasFacePhoto={hasFacePhoto}
  isFaceMockupGenerating={isFaceMockupGenerating}
  faceMockupError={faceMockupError}
  onGenerateFaceMockup={generateFaceMockup}
  facePhotoBase64={additionalPhotos?.face || null}
/>
```

**Step 5: Commit**

```bash
git add apps/web/src/components/wizard/dsd/DSDSimulationViewer.tsx apps/web/src/components/wizard/DSDStep.tsx
git commit -m "feat(ui): add 'Simular no rosto' button + face-mockup tab"
```

---

## Task 5: SharedEvaluation + EvaluationDetails support

**Files:**
- Modify: `apps/web/src/pages/SharedEvaluation.tsx`
- Modify: `apps/web/src/components/dsd/CollapsibleDSD.tsx`

**Step 1: Handle face-mockup in SharedEvaluation**

The face-mockup layer already gets stored in `dsd_simulation_layers[]`. The `SharedEvaluation` page iterates layers and shows tabs. The only change needed is:

- When the active layer is `face-mockup`, the "before" image should be the face photo, not the intraoral. However, SharedEvaluation uses signed URLs from storage, so the face photo needs to be available.

If the face photo is stored in Supabase storage (via the existing upload flow), add logic to resolve its URL. If it's only in the client (base64 in draft), then SharedEvaluation cannot show face-mockup comparison — only the simulation result.

**Pragmatic approach:** For SharedEvaluation, show only the face-mockup simulation image (no before/after slider). The comparison is most valuable during the wizard session.

In SharedEvaluation layer rendering:
```tsx
{layer.type === 'face-mockup' ? (
  <img src={layerUrl} alt="Face simulation" className="w-full rounded-lg" />
) : (
  <ComparisonSlider beforeImage={beforeImageUrl} afterImage={layerUrl} />
)}
```

**Step 2: Handle in CollapsibleDSD**

Similar approach — if layer is face-mockup, show the image without comparison slider.

**Step 3: Commit**

```bash
git add apps/web/src/pages/SharedEvaluation.tsx apps/web/src/components/dsd/CollapsibleDSD.tsx
git commit -m "feat(shared): support face-mockup layer in SharedEvaluation + CollapsibleDSD"
```

---

## Task 6: Deploy and test

**Step 1: Deploy edge function**

```bash
npx supabase functions deploy generate-dsd --no-verify-jwt --use-docker
```

**Step 2: Deploy Vercel**

```bash
npx vercel --prod
```

**Step 3: Test the full flow**

1. Create new case with intraoral + face photo
2. Run DSD analysis (generates 3 standard layers)
3. Click "Simular no rosto"
4. Verify face-mockup generates and appears as new tab
5. Verify ComparisonSlider shows face before/after in wizard
6. Verify SharedEvaluation shows face-mockup layer

**Step 4: Commit any fixes and push**

```bash
git push
```

---

## Summary

| Task | Description | Effort |
|------|-------------|--------|
| 1 | Types + i18n | 15min |
| 2 | Backend — generate-dsd face-mockup handling | 45min |
| 3 | Frontend — useDSDStep generateFaceMockup | 30min |
| 4 | Frontend — UI button + viewer | 30min |
| 5 | SharedEvaluation + CollapsibleDSD | 20min |
| 6 | Deploy + test | 15min |

**Total: ~2.5h estimated**
