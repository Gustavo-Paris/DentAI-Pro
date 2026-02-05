---
title: Dental AI Clinical Guardrails
created: 2026-02-05
updated: 2026-02-05
status: draft
tags:
  - type/plan
  - status/draft
---

# Dental AI Clinical Guardrails

## Problem

The AI analysis was generating clinically incorrect suggestions in 4 areas:

1. **Gengivoplastia without visible gingiva** — suggesting gingival treatment when gingiva isn't visible in the photo
2. **Visagismo without full face** — determining facial format and temperament from smile-only photos
3. **Over-aggressive buccal corridor classification** — classifying adequate corridors as "excessive"
4. **False lingual positioning of premolars** — diagnosing normal premolar position as "lingualized"

## Approach

**Hybrid: Prompt guardrails + Post-processing safety nets**

- **All 4 issues**: Fixed at the prompt level with explicit rules and conservatism constraints
- **Issues 1 and 2**: Additional deterministic post-processing in `generate-dsd/index.ts` as a safety net, since these have metadata we can check programmatically
- **Issues 3 and 4**: Prompt-only fixes, since these are subjective visual judgments that can't be validated programmatically

## Changes

### Prompt: `analyze-dental-photo.ts`

1. **Gengival visibility rule** — Added to ANALISE GENGIVAL section: gengivoplastia ONLY when gingiva is clearly visible. If lips cover gingiva (low/medium smile line), no gengivoplastia suggestions.
2. **Visagismo conditionality** — Added to VISAGISMO section: facial format and temperament analysis ONLY with full face visible. Smile arc and buccal corridor can still be assessed.
3. **Buccal corridor conservatism** — Added to CORREDOR BUCAL: default to "adequado" when in doubt. Only "excessivo" with clear, wide dark shadows.
4. **Premolar positioning** — New section: premolars naturally have less buccal prominence (that's normal, not lingualization). Only diagnose lingual position when clearly evident.

### Prompt: `dsd-analysis.ts`

1. **Visagismo conditionality** — Made visagismo section conditional on full face visibility. Added fallback defaults (face_shape="oval", temperament="fleumático", tooth_shape="natural") for smile-only photos.
2. **Gengivoplastia visibility** — Added rule: no gengivoplastia if gingiva not clearly visible.
3. **Buccal corridor conservatism** — Same rule as clinical prompt.
4. **Premolar conservatism** — Rewrote premolar section to be more conservative. Clear distinction between normal anatomy and pathological positioning.
5. **Consistency rules** — Updated buccal corridor vs premolar consistency check.

### Post-processing: `generate-dsd/index.ts`

Two deterministic safety nets added after AI analysis, before returning results:

1. **Visagismo stripping** — If no face photo was uploaded and the AI returned non-default visagismo values, reset to neutral defaults and add informational note.
2. **Gengivoplastia filtering** — If smile_line is not "alta" (meaning gingiva isn't significantly exposed), strip any gengivoplastia-related suggestions from the array.

## Guiding Principle

> Be conservative in treatment suggestions. When in doubt, do NOT suggest invasive treatment. Under-diagnosis is safer than over-diagnosis.

## Files Modified

- `supabase/functions/_shared/prompts/definitions/analyze-dental-photo.ts`
- `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts`
- `supabase/functions/generate-dsd/index.ts`

## Related

- [[06-ADRs/ADR-003|ADR-003: Centralized Prompt Management]]
- [[plans/2026-02-04-qa-specialist-fixes-design|QA Specialist Fixes]]
