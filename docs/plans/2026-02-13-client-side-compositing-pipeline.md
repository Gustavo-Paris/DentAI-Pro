---
title: "Client-Side Compositing Pipeline for DSD"
created: 2026-02-13
updated: 2026-02-13
status: draft
tags: [type/plan, status/draft]
---

# Client-Side Compositing Pipeline for DSD

## Problem

Gemini's image edit model ignores preservation instructions:
1. **L2** proactively trims gums (gengivoplasty) even without instructions
2. **L1** dewhitening adds yellow tint instead of reducing brightness
3. **L3** has minimal effect because L2 already modified the gum line

Root cause: prompt-based preservation has hit its ceiling. The model "sees" problems and "fixes" them regardless of instructions.

## Solution

Post-generation client-side compositing pipeline that FORCES preservation of non-tooth areas.

## Architecture

```
Original → Gemini(L2: corrections + whitening) → L2 raw
                                                    ↓
                                        compositeTeethOnly(original, L2 raw)
                                        → keep L2 teeth, restore original gum/lips/skin
                                                    ↓
                                                L2 final
                                                    ↓
                                    ┌───────────────┴───────────────┐
                                    ↓                               ↓
                        dewhitenTeeth(L2 final)            Gemini(L3: gengivoplasty from L2)
                        → reduce tooth brightness              ↓
                        10-15% via canvas                 compositeGingivoLips(L2, L3)
                        (NO Gemini call)                  → restore lips from L2
                                    ↓                               ↓
                                L1 final                        L3 final
```

## Algorithm: Tooth Zone Detection

For separating "teeth" from "gum/lips/skin" in a dental photo:

```
For each pixel (x, y):
  isToothPixel = ALL of:
    1. In dental zone (vertical: 25-75% of image height)
    2. High brightness in L2: (R+G+B)/3 > 160
    3. Low saturation in L2: max(R,G,B) - min(R,G,B) < 60
    4. Significantly changed from original: RGB diff > 30

  If isToothPixel: use L2 pixel (corrected/whitened tooth)
  Otherwise: use original pixel (preserve gum/lip/skin)

  Post-processing:
  - Dilate tooth mask by 2px (catch edge pixels)
  - Blur mask boundary by 3px (smooth blending)
```

### Why This Works

| Element | Brightness | Saturation | Changed? | Result |
|---------|-----------|------------|----------|--------|
| Tooth (corrected) | >160 | <60 | Yes | Use L2 |
| Gum (modified by Gemini) | <150 | >60 (pink) | Yes | Use original |
| Lip | <170 | >45 (red) | Maybe | Use original |
| Skin | <150 | >30 | No | Use original |
| Background | <100 | varies | No | Use original |

## L1 Dewhitening (Canvas-Only)

No Gemini call. Pure client-side:

```
For each pixel in L2 composited:
  If isToothPixel (same detection as above):
    Reduce brightness by 12% (multiply RGB by 0.88)
    Keep same hue (no yellow shift)
  Else:
    Keep pixel unchanged
```

Benefits:
- Zero API cost
- Instantaneous (< 100ms)
- 100% deterministic
- Impossible to add yellow tint (pure brightness reduction)
- Inherits L2's correct gum line

## Files

1. **NEW**: `apps/web/src/lib/compositeTeethOnly.ts` — tooth extraction compositing
2. **MODIFY**: `apps/web/src/lib/compositeGingivo.ts` — add dewhitenTeeth function
3. **MODIFY**: `apps/web/src/components/wizard/dsd/useDSDStep.ts` — new generation flow

## No Backend Changes

All compositing is purely client-side. Edge function and prompts unchanged.

## Verification

1. TypeScript: `pnpm --filter web exec tsc --noEmit`
2. Build: `pnpm --filter web run build`
3. Visual: generate simulation and verify:
   - L2: gum line identical to original, only teeth changed
   - L1: same as L2 but slightly less bright (no yellow)
   - L3: visible gengivoplasty effect compared to L2
