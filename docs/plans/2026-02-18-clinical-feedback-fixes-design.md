---
title: "Clinical Feedback Fixes Design"
created: 2026-02-18
updated: 2026-02-18
status: draft
tags:
  - type/plan
  - status/draft
---

# Clinical Feedback Fixes Design

## Context

3 clinical feedback PDFs from the same dentist reviewer identified 11 issues in the AI analysis and treatment suggestion pipeline. Issues fall into 4 groups: misdiagnosis (A), over-treatment (B), DSD viability (C), and stratification protocol (D).

## Feedback Summary

### PDF 37 — Restorations confused with fluorosis/MIH
- Teeth 11/21 have unsatisfactory restorations, NOT fluorosis/MIH
- AI suggested porcelain veneers instead of composite resin
- Teeth 13/23 don't need treatment (normal canine color)
- Color difference resolved with whitening, not restorations

### PDF 36 — False diastema detection + DSD width reduction
- AI detected diastema between 11-21 but NO diastema exists
- Actual issues: white spots + inadequate width proportion (too wide)
- DSD reduced central incisor width — clinically unviable (requires invasive prep)
- Stratification: wrong shades for Aumento Incisal (should be Trans/CT)

### PDF 35 — Diastema location wrong + stratification issues
- Diastema exists only between 12-13, not 11-21
- Other teeth need aesthetic recontouring, not diastema closure
- Stratification: wrong resin/shade choices per layer

## Root Cause Analysis

The 11 symptoms trace to 3 root causes:

1. **Prompt gaps in `analyze-dental-photo.ts`**: No differential diagnosis for restoration vs fluorosis/MIH, no diastema confidence threshold, no canine color variation rule
2. **DSD analysis allows clinically unviable changes**: No prohibition against reducing tooth width in simulation
3. **shade-validation.ts incomplete**: Validates Cristas, Dentina/Corpo, and Esmalte Final but NOT Aumento Incisal

## Design

### Fix 1 — Prompt `analyze-dental-photo.ts` (resolves issues 1-8)

**1.1 Differential diagnosis: Restoration vs Fluorosis/MIH**
- Add after "DETECCAO DE RESTAURACOES EXISTENTES" section (after line 158)
- Criteria: interface visible → restoration (not fluorosis). Fluorosis is always bilateral/symmetric, diffuse. MIH has demarcated opacities.
- Rule: if ANY sign of material interface → classify as "Restauração insatisfatória", never fluorosis
- Treatment: restoration replacement → resina (never porcelain for isolated restoration)

**1.2 Canine color rule**
- Add new section after restoration detection
- Canines are naturally 1-2 shades more saturated than incisors — this is normal
- Never suggest aesthetic treatment for canines based solely on color saturation
- Color bothering the patient → suggest whitening first

**1.3 Diastema confidence threshold**
- Reinforce diastema detection conservatism
- Require clear gap between natural enamel surfaces (not shadows, not restoration interfaces)
- Common false positives: interproximal shadows, light reflections, restoration marginal gaps
- Rule: gap <0.5mm with intact proximal contact → not a diastema

**1.4 Whitening-first rule for color**
- Reinforce: if the only indication is color difference → suggest whitening as first-line treatment
- Do not suggest resina/faceta/porcelana just to unify color

### Fix 2 — Prompt `dsd-analysis.ts` + `dsd-simulation.ts` (resolves issue 9)

**2.1 Clinical viability rule in DSD analysis**
- Add after autovalidation section
- DSD NEVER reduces tooth width (requires enamel removal = invasive)
- If ideal proportion requires narrower tooth → keep current width, suggest alternative (length increase, adjacent harmonization)
- Add observation flagging the proportion issue without simulating it

**2.2 DSD simulation constraint**
- Add to Gemini simulation prompt: never make teeth narrower than original

### Fix 3 — `shade-validation.ts` (resolves issues 10-11)

**3.1 Aumento Incisal validation**
- Add validation: shade MUST be Trans/CT family
- Auto-replace non-translucent shades with CT(Z350) or Trans(FORMA)
- Insert after Cristas validation block

**3.2 Esmalte Final preference enforcement**
- If Estelite Omega or Palfique LX5 available in catalog, prefer over Z350 for esmalte vestibular final
- Auto-swap Z350 → Palfique WE or Estelite MW/WE

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/_shared/prompts/definitions/analyze-dental-photo.ts` | Add sections 1.1-1.4 |
| `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts` | Add section 2.1 |
| `supabase/functions/_shared/prompts/definitions/dsd-simulation.ts` | Add section 2.2 |
| `supabase/functions/recommend-resin/shade-validation.ts` | Add sections 3.1-3.2 |

## Deployment

All 3 affected edge functions need redeployment after changes:
- `analyze-dental-photo`
- `generate-dsd`
- `recommend-resin`

Deploy sequentially per project conventions.

## Risk Assessment

- **Low risk**: Prompt changes are additive (new rules added, existing rules unchanged)
- **Low risk**: shade-validation changes are additive (new validations after existing ones)
- **No breaking changes**: All modifications tighten constraints, they don't relax them
- **Conservative direction**: All changes make the system more conservative (fewer false positives, less invasive treatments)
