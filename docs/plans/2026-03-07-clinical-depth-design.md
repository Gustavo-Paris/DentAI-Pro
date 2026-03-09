# Clinical Depth Upgrade — Design

**Goal:** Improve treatment protocol quality, fix gengivoplasty detection + image quality, integrate radiograph analysis.

**Approach:** Prompt improvements first (no model changes), detection logic fixes, radiograph integration.

## Features

### 1. Improve recommend-resin/cementation prompts
- Add per-tooth treatment rationale
- Enforce single-shade rule (no alternatives)
- Add operative sequence with timing
- Feed tooth-specific DSD suggestion more prominently
- Files: `recommend-resin.ts`, `recommend-cementation.ts`

### 2. Fix gengivoplasty
- **Detection**: Include L3 when `gingivoplastyApproved === null` AND confidence is `recommended`
- **Detection**: Add missing keywords (`linha do sorriso alta`, `exposicao gengival`)
- **Image quality**: Remove contradictory magnitude instructions (standardize 2mm max)
- **Image quality**: Fix color transition for newly exposed enamel area
- Files: `useDSDGingivoplasty.ts`, `dsd-simulation-builders.ts`

### 3. Radiograph analysis integration
- Add RADIOGRAPH ANALYSIS section to analyze-dental-photo prompt
- Pass radiograph as second image in Gemini vision call
- Add `radiograph` field to `AdditionalPhotos` type
- Store `radiograph_type` from AI detection
- Files: `analyze-dental-photo.ts`, `analyze-dental-photo/index.ts`, `dsd.ts`, `usePhotoAnalysis.ts`

### 4. Fix model label
- Progress bar says "Gemini 3 Pro" but actual model is Gemini 2.5 Pro

---
*Created: 2026-03-07*
