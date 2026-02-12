---
title: "Gengivoplasty Lip-Fix Compositing"
created: 2026-02-12
updated: 2026-02-12
status: draft
tags: [type/plan, status/draft]
---

# Gengivoplasty Lip-Fix Compositing

## Problem

The L3 (gengivoplasty) simulation consistently lifts the upper lip instead of only trimming gum tissue. Despite extensive prompt instructions telling Gemini not to move the lips, the image edit model finds it easier to "reveal more tooth" by lifting the lip rather than surgically trimming gum tissue. L1 and L2 look great; only L3 has this issue.

## Solution

Post-generation client-side compositing: after L3 is generated, composite L2 (correct lips) and L3 (recontoured gums) pixel-by-pixel using canvas. Lip pixels from L2 are restored; gum/tooth pixels from L3 are preserved.

## Algorithm

```
For each pixel (x, y):
  1. Classify pixel in L2: is it "lip"?
  2. Compute difference between L2[x,y] and L3[x,y]

  If lip AND changed → use L2 (restore lip position)
  Otherwise → use L3 (keep gengivoplasty result)
```

### Lip Detection Heuristic

Tuned for dental clinical photos (bright, neutral white lighting):

- **Vertical constraint**: top 60% of image only (lips are always in upper portion)
- **Brightness**: 40 < brightness < 190 (teeth are brighter, shadows are darker)
- **Red dominance**: `(R - G) > 20` (lips are redder than gum/tooth/skin)
- **Saturation**: `max(R,G,B) - min(R,G,B) > 30`

### Why This Works

| Pixel type | In L2 | Classified as lip? | Changed in L3? | Result |
|---|---|---|---|---|
| Lip (moved up in L3) | Lip color | Yes | Yes | Use L2 (restore) |
| Gum (trimmed in L3) | Pink, less red | No | Yes | Use L3 (keep trim) |
| Tooth (taller in L3) | Bright white | No | Yes | Use L3 (keep) |
| Face/skin | Skin tone | No | No | Use L3 (unchanged) |
| Lip (didn't move) | Lip color | Yes | No | Use L3 (same as L2) |

### Post-Processing

1. Dilate lip mask by 2px to catch edge artifacts
2. Apply 1px Gaussian blur at mask boundary for smooth blending

## Files

1. **NEW**: `apps/web/src/lib/compositeGingivo.ts` — compositing utility (~80 lines)
2. **MODIFY**: `apps/web/src/components/wizard/dsd/useDSDStep.ts` — integrate compositing after L3 generation

## No Backend Changes

Edge function and prompts unchanged. Compositing is purely client-side.

## Verification

1. TypeScript: `pnpm --filter web exec tsc --noEmit`
2. Build: `pnpm --filter web run build`
3. Visual: generate L3 and verify lips match L2 pixel-perfectly while gum recontouring is visible
