---
title: DSD Face Mockup — Design
created: 2026-02-27
updated: 2026-02-27
status: approved
tags: [type/design, domain/dsd, priority/high]
---

# DSD Face Mockup

## Context

Today, DSD simulations only edit the intraoral close-up photo. Dentists want to show the patient how the new smile looks **on their face** — a powerful visual tool for case acceptance.

The wizard already accepts `additionalPhotos.face` (full face photo). This feature generates a face-level simulation by editing the mouth region in the face photo using Gemini image edit.

## User Flow

1. User uploads intraoral photo + face photo (existing flow)
2. DSD generates the 3 standard layers (restorations-only, whitening-restorations, complete-treatment)
3. In the DSD viewer, a **"Simular no rosto"** button appears (only if `additionalPhotos.face` exists)
4. User clicks → edge function call → Gemini edits the face photo
5. Result appears as a new **"Face Mockup"** tab in the layer viewer
6. `ComparisonSlider` shows original face vs face with new smile
7. Result saved to DB and available in EvaluationDetails + SharedEvaluation

## Architecture

### Backend — Edge Function

- Reuse `generate-dsd` with new `layerType: "face-mockup"`
- Input: face photo (from `additionalPhotos.face`), NOT intraoral
- Prompt: same treatment instructions adapted for face context — edit ONLY the mouth region, preserve everything else (eyes, skin, hair, background)
- Model: Gemini 3.1 Pro image edit (same as existing DSD)
- Storage: save as `SimulationLayer` with `type: "face-mockup"`
- Credits: no additional credit charge (follow-up layer, same as whitening/complete-treatment)

### Frontend

- New `SimulationLayerType`: `"face-mockup"`
- `DSDSimulationViewer`: conditional button "Simular no rosto" (visible only when `additionalPhotos.face` is truthy)
- Loading state while generating
- New tab in layer selector showing "Face Mockup" with face icon
- `ComparisonSlider`: face photo original (before) vs edited face (after)
- Available in `EvaluationDetails` and `SharedEvaluation` (same layer mechanism)

### Data Flow

```
User clicks "Simular no rosto"
  → useDSDStep.generateFaceMockup()
  → POST /generate-dsd { layerType: "face-mockup", facePhoto: base64 }
  → generate-dsd/index.ts detects layerType === "face-mockup"
  → Sends face photo to Gemini image edit with adapted prompt
  → Saves result to storage + appends to dsd_simulation_layers[]
  → Returns { simulation_url, layer }
  → Frontend adds tab, shows ComparisonSlider
```

### Prompt Strategy

The face mockup prompt reuses the DSD analysis data (suggestions, observations) but adapts instructions for the face photo scale:

- Focus editing on the **mouth region only**
- Preserve face identity, skin texture, lighting, background
- Apply same teeth modifications (shape, alignment, color, gaps)
- Apply gingival changes if complete-treatment layer
- Use the active layer's whitening level

## Scope — What This Does NOT Do

- Does NOT generate multiple face mockup variants (1 per click, based on active layer)
- Does NOT auto-generate — only on-demand via button click
- Does NOT require a new photo — uses existing `additionalPhotos.face`
- Does NOT add a new edge function — extends existing `generate-dsd`
- Does NOT block the main DSD flow — independent optional step

## Files to Modify

### Backend
- `supabase/functions/generate-dsd/index.ts` — handle `layerType: "face-mockup"`
- `supabase/functions/generate-dsd/simulation.ts` — new prompt variant for face context
- `supabase/functions/generate-dsd/prompts.ts` — face mockup prompt template (if separate)

### Frontend
- `apps/web/src/types/dsd.ts` — add `"face-mockup"` to `SimulationLayerType`
- `apps/web/src/components/wizard/dsd/DSDSimulationViewer.tsx` — "Simular no rosto" button + face mockup tab
- `apps/web/src/components/wizard/dsd/useDSDStep.ts` — `generateFaceMockup()` function
- `apps/web/src/pages/SharedEvaluation.tsx` — handle face-mockup layer display
- `apps/web/src/components/dsd/CollapsibleDSD.tsx` — handle face-mockup in collapsed view
- `apps/web/src/locales/pt-BR.json` + `en-US.json` — i18n keys

---
*Design approved: 2026-02-27*
