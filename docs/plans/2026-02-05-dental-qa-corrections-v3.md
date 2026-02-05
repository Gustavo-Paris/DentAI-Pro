---
title: Dental QA Corrections V3
created: 2026-02-05
updated: 2026-02-05
status: draft
tags:
  - type/plan
  - status/draft
---

# Dental QA Corrections V3

## Summary

8 corrections to the dental AI system based on clinical QA review. Covers prompt fixes (layer order, materials, diagnostics), DSD personalization, and frontend card grouping.

## Corrections

### Prompt: `recommend-resin.ts` (4 changes)

1. **Layer Reorder (#4+#5)**: Aumento Incisal → Cristas Proximais → Dentina/Corpo → Efeitos Incisais → Esmalte Vestibular Final
2. **Diamond Bur (#6)**: 2135FF → 2200FF, tip: "Remover excessos cervicais e vestibulares"
3. **Sof-Lex (#7)**: Vermelho Escuro → Vermelho Claro → Laranja → Amarelo
4. **Resin Preference (#9)**: WE-PALFIQUE first, MW-ESTELITE second, A1E-Z350 XT third

### Prompt: `analyze-dental-photo.ts` (1 change)

5. **Microdontia (#2)**: Strengthen guardrail — laterals (12/22) with reduced proportions are more likely unsatisfactory restorations than microdontia

### Prompt: `dsd-simulation.ts` (1 change)

6. **DSD Personalization (#1)**: Anti-template language — force unique per-patient results

### Frontend: `DSDStep.tsx` (1 change)

7. **Unify Cards (#8)**: Group DSD suggestions by tooth number, show dente+gengiva in same card

### Already Implemented (skipped)

- **#3 Hide Black for facetas**: Already done in `CaseSummaryBox.tsx` via `showCavityInfo: false`

## Files Modified

- `supabase/functions/_shared/prompts/definitions/recommend-resin.ts`
- `supabase/functions/_shared/prompts/definitions/analyze-dental-photo.ts`
- `supabase/functions/_shared/prompts/definitions/dsd-simulation.ts`
- `apps/web/src/components/wizard/DSDStep.tsx`
