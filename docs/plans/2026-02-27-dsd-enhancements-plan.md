# DSD Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 4 product features to the DSD module: proportion overlay lines, layer comparison modal, professional PDF report, and WhatsApp sharing.

**Architecture:** Feature 1 adds an SVG overlay system alongside the existing `AnnotationOverlay`. Feature 2 reuses `ComparisonSlider` in a modal with layer selectors. Feature 3 extends the existing `lib/pdf/` infrastructure. Feature 4 adds a `wa.me` link button next to the existing share button.

**Tech Stack:** React 18, TypeScript, SVG, jsPDF (existing), shadcn/ui, i18next

---

## Feature 1: Overlay de Proporções DSD

### Task 1: useProportionLines hook

**Files:**
- Create: `apps/web/src/hooks/domain/dsd/useProportionLines.ts`
- Create: `apps/web/src/hooks/domain/dsd/useProportionLines.test.ts`

**Context:** This hook computes geometric overlay lines from `toothBounds` (percentage-based coordinates) and `DSDAnalysis` data. Each `ToothBoundsPct` has `{ x, y, width, height }` in 0-100% of image dimensions. `x,y` are the center point.

**Step 1: Write the failing test**

```typescript
// apps/web/src/hooks/domain/dsd/useProportionLines.test.ts
import { describe, it, expect } from 'vitest';
import { computeProportionLines } from './useProportionLines';
import type { ToothBoundsPct, DSDAnalysis } from '@/types/dsd';

// 6 teeth: 13, 12, 11, 21, 22, 23 (sorted left-to-right by X)
const mockBounds: ToothBoundsPct[] = [
  { x: 20, y: 40, width: 8, height: 18 },   // 13
  { x: 32, y: 40, width: 9, height: 19 },   // 12
  { x: 45, y: 40, width: 11, height: 20 },  // 11
  { x: 57, y: 40, width: 11, height: 20 },  // 21
  { x: 69, y: 40, width: 9, height: 19 },   // 22
  { x: 80, y: 40, width: 8, height: 18 },   // 23
];

const mockAnalysis = {
  facial_midline: 'centrada',
  dental_midline: 'alinhada',
  smile_line: 'média',
  golden_ratio_compliance: 78,
  symmetry_score: 85,
} as DSDAnalysis;

describe('computeProportionLines', () => {
  it('computes midline as average X of the two widest central teeth', () => {
    const result = computeProportionLines(mockBounds, mockAnalysis);
    // Two widest teeth are at x=45 and x=57 → midline at 51%
    expect(result.midline).toEqual({ x: 51, yStart: 0, yEnd: 100 });
  });

  it('computes golden ratio brackets for 3 pairs (left side)', () => {
    const result = computeProportionLines(mockBounds, mockAnalysis);
    // Left side: central(11), lateral(12), canine(13) sorted by distance from midline
    expect(result.goldenRatio).toHaveLength(2); // central/lateral + lateral/canine
    expect(result.goldenRatio[0]).toHaveProperty('ratio');
    expect(result.goldenRatio[0]).toHaveProperty('ideal', 1.618);
  });

  it('computes smile arc curve through incisal edges', () => {
    const result = computeProportionLines(mockBounds, mockAnalysis);
    // Incisal edge = y + height/2 (bottom of bounding box)
    expect(result.smileArc).toHaveLength(6);
    expect(result.smileArc[0]).toEqual({ x: 20, y: 49 }); // 40 + 18/2
  });

  it('returns empty lines for empty bounds', () => {
    const result = computeProportionLines([], mockAnalysis);
    expect(result.midline).toBeNull();
    expect(result.goldenRatio).toEqual([]);
    expect(result.smileArc).toEqual([]);
  });

  it('handles fewer than 4 teeth gracefully', () => {
    const result = computeProportionLines(mockBounds.slice(0, 2), mockAnalysis);
    expect(result.midline).not.toBeNull();
    expect(result.goldenRatio).toEqual([]); // not enough teeth for ratio
    expect(result.smileArc).toHaveLength(2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/hooks/domain/dsd/useProportionLines.test.ts`
Expected: FAIL — module not found

**Step 3: Implement the hook**

```typescript
// apps/web/src/hooks/domain/dsd/useProportionLines.ts
import { useMemo } from 'react';
import type { ToothBoundsPct, DSDAnalysis } from '@/types/dsd';

export interface ProportionMidline {
  x: number;
  yStart: number;
  yEnd: number;
}

export interface GoldenRatioBracket {
  /** X position of wider tooth center */
  x1: number;
  /** Width of wider tooth */
  w1: number;
  /** X position of narrower tooth center */
  x2: number;
  /** Width of narrower tooth */
  w2: number;
  /** Actual ratio w1/w2 */
  ratio: number;
  /** Ideal ratio */
  ideal: number;
  /** Y position for bracket */
  y: number;
}

export interface ProportionLines {
  midline: ProportionMidline | null;
  goldenRatio: GoldenRatioBracket[];
  smileArc: Array<{ x: number; y: number }>;
}

/**
 * Pure function that computes proportion overlay lines from tooth bounds.
 * All coordinates are in percentage (0-100) of image dimensions.
 */
export function computeProportionLines(
  bounds: ToothBoundsPct[],
  _analysis: DSDAnalysis,
): ProportionLines {
  if (bounds.length === 0) {
    return { midline: null, goldenRatio: [], smileArc: [] };
  }

  // Sort bounds left-to-right by X position
  const sorted = [...bounds].sort((a, b) => a.x - b.x);

  // --- Midline ---
  // Find the two widest teeth (presumed centrals 11/21) and average their X
  const byWidth = [...sorted].sort((a, b) => b.width - a.width);
  const centrals = byWidth.slice(0, Math.min(2, byWidth.length));
  const midlineX = centrals.reduce((sum, b) => sum + b.x, 0) / centrals.length;
  const allYs = sorted.map(b => b.y);
  const allHeights = sorted.map(b => b.height);
  const topY = Math.min(...allYs.map((y, i) => y - allHeights[i] / 2));
  const bottomY = Math.max(...allYs.map((y, i) => y + allHeights[i] / 2));

  const midline: ProportionMidline = {
    x: Math.round(midlineX),
    yStart: Math.max(0, Math.round(topY - 5)),
    yEnd: Math.min(100, Math.round(bottomY + 5)),
  };

  // --- Golden Ratio ---
  // Split teeth into left (x < midline) and right (x >= midline), sorted by distance from midline
  const goldenRatio: GoldenRatioBracket[] = [];

  if (sorted.length >= 4) {
    const leftSide = sorted.filter(b => b.x < midlineX).sort((a, b) => b.x - a.x); // closest to midline first
    const rightSide = sorted.filter(b => b.x >= midlineX).sort((a, b) => a.x - b.x);

    // Compare adjacent pairs on each side (central/lateral, lateral/canine)
    for (const side of [leftSide, rightSide]) {
      for (let i = 0; i < side.length - 1 && i < 2; i++) {
        const wider = side[i];
        const narrower = side[i + 1];
        if (narrower.width > 0) {
          const ratio = wider.width / narrower.width;
          goldenRatio.push({
            x1: wider.x,
            w1: wider.width,
            x2: narrower.x,
            w2: narrower.width,
            ratio: Math.round(ratio * 1000) / 1000,
            ideal: 1.618,
            y: Math.max(wider.y + wider.height / 2, narrower.y + narrower.height / 2) + 3,
          });
        }
      }
    }
  }

  // --- Smile Arc ---
  // Incisal edge of each tooth = bottom of bounding box = y + height/2
  const smileArc = sorted.map(b => ({
    x: b.x,
    y: Math.round(b.y + b.height / 2),
  }));

  return { midline, goldenRatio, smileArc };
}

/**
 * React hook wrapper around computeProportionLines.
 */
export function useProportionLines(
  bounds: ToothBoundsPct[],
  analysis: DSDAnalysis | undefined,
): ProportionLines {
  return useMemo(() => {
    if (!analysis || bounds.length === 0) {
      return { midline: null, goldenRatio: [], smileArc: [] };
    }
    return computeProportionLines(bounds, analysis);
  }, [bounds, analysis]);
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/hooks/domain/dsd/useProportionLines.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add apps/web/src/hooks/domain/dsd/useProportionLines.ts apps/web/src/hooks/domain/dsd/useProportionLines.test.ts
git commit -m "feat(dsd): add useProportionLines hook with midline, golden ratio, smile arc"
```

---

### Task 2: ProportionOverlay SVG component

**Files:**
- Create: `apps/web/src/components/dsd/ProportionOverlay.tsx`

**Context:** This component renders SVG proportion lines on top of the smile photo, alongside the existing `AnnotationOverlay`. It receives pre-computed `ProportionLines` and a visibility map for toggles.

**Step 1: Write the component**

```tsx
// apps/web/src/components/dsd/ProportionOverlay.tsx
import { useTranslation } from 'react-i18next';
import type { ProportionLines } from '@/hooks/domain/dsd/useProportionLines';

export type ProportionLayerType = 'midline' | 'goldenRatio' | 'smileArc';

interface ProportionOverlayProps {
  lines: ProportionLines;
  visibleLayers: Set<ProportionLayerType>;
  containerWidth: number;
  containerHeight: number;
}

const COLORS = {
  midline: '#ef4444',      // red
  goldenRatio: '#f59e0b',  // amber
  smileArc: '#22c55e',     // green
} as const;

export function ProportionOverlay({
  lines,
  visibleLayers,
  containerWidth,
  containerHeight,
}: ProportionOverlayProps) {
  const { t } = useTranslation();

  if (containerWidth === 0 || containerHeight === 0) return null;

  const toX = (pct: number) => (pct / 100) * containerWidth;
  const toY = (pct: number) => (pct / 100) * containerHeight;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      viewBox={`0 0 ${containerWidth} ${containerHeight}`}
      width={containerWidth}
      height={containerHeight}
      aria-label={t('components.dsd.proportionOverlay.ariaLabel')}
    >
      {/* Midline */}
      {visibleLayers.has('midline') && lines.midline && (
        <g>
          <line
            x1={toX(lines.midline.x)}
            y1={toY(lines.midline.yStart)}
            x2={toX(lines.midline.x)}
            y2={toY(lines.midline.yEnd)}
            stroke={COLORS.midline}
            strokeWidth={2}
            strokeDasharray="6 4"
            opacity={0.8}
          />
          <text
            x={toX(lines.midline.x) + 6}
            y={toY(lines.midline.yStart) + 14}
            fill={COLORS.midline}
            fontSize={11}
            fontWeight="600"
          >
            {t('components.dsd.proportionOverlay.midline')}
          </text>
        </g>
      )}

      {/* Golden Ratio brackets */}
      {visibleLayers.has('goldenRatio') && lines.goldenRatio.map((br, i) => {
        const x1 = toX(br.x1 - br.w1 / 2);
        const x2 = toX(br.x1 + br.w1 / 2);
        const x3 = toX(br.x2 - br.w2 / 2);
        const x4 = toX(br.x2 + br.w2 / 2);
        const y = toY(br.y);
        const deviation = Math.abs(br.ratio - br.ideal);
        const isGood = deviation < 0.2;
        const color = isGood ? '#22c55e' : COLORS.goldenRatio;

        return (
          <g key={`gr-${i}`}>
            {/* Wider tooth bracket */}
            <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={2} opacity={0.7} />
            <line x1={x1} y1={y - 4} x2={x1} y2={y + 4} stroke={color} strokeWidth={2} opacity={0.7} />
            <line x1={x2} y1={y - 4} x2={x2} y2={y + 4} stroke={color} strokeWidth={2} opacity={0.7} />
            {/* Narrower tooth bracket */}
            <line x1={x3} y1={y + 8} x2={x4} y2={y + 8} stroke={color} strokeWidth={1.5} opacity={0.6} />
            {/* Ratio label */}
            <text
              x={(x1 + x4) / 2}
              y={y + 22}
              fill={color}
              fontSize={10}
              fontWeight="600"
              textAnchor="middle"
            >
              {br.ratio.toFixed(2)} {isGood ? '✓' : `(${br.ideal})`}
            </text>
          </g>
        );
      })}

      {/* Smile Arc curve */}
      {visibleLayers.has('smileArc') && lines.smileArc.length >= 2 && (
        <g>
          <path
            d={buildSmoothPath(lines.smileArc.map(p => ({ x: toX(p.x), y: toY(p.y) })))}
            fill="none"
            stroke={COLORS.smileArc}
            strokeWidth={2.5}
            strokeLinecap="round"
            opacity={0.7}
          />
          <text
            x={toX(lines.smileArc[0].x) - 4}
            y={toY(lines.smileArc[0].y) + 16}
            fill={COLORS.smileArc}
            fontSize={11}
            fontWeight="600"
          >
            {t('components.dsd.proportionOverlay.smileArc')}
          </text>
        </g>
      )}
    </svg>
  );
}

/** Build a smooth SVG path through a set of points using quadratic Bezier */
function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cpX = (curr.x + next.x) / 2;
    const cpY = (curr.y + next.y) / 2;
    d += ` Q ${curr.x} ${curr.y} ${cpX} ${cpY}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}
```

**Step 2: Run lint/type-check**

Run: `cd apps/web && npx tsc --noEmit --pretty`
Expected: No new errors

**Step 3: Commit**

```bash
git add apps/web/src/components/dsd/ProportionOverlay.tsx
git commit -m "feat(dsd): add ProportionOverlay SVG component"
```

---

### Task 3: Integrate overlay into DSDSimulationViewer + toggles

**Files:**
- Modify: `apps/web/src/components/wizard/dsd/DSDSimulationViewer.tsx`
- Modify: `apps/web/src/components/wizard/dsd/useDSDStep.ts` (add state for visible proportion layers)

**Context:** Add toggle buttons for proportion overlay layers (midline, golden ratio, smile arc) to the DSD viewer header, alongside the existing "Annotations" toggle. The `ProportionOverlay` renders as a second overlay inside the `ComparisonSlider` annotation slot.

**Step 1: Add proportion state to useDSDStep**

In `apps/web/src/components/wizard/dsd/useDSDStep.ts`, add state management for visible proportion layers. Find the existing `showAnnotations` state (around line 141) and add after it:

```typescript
// After line 141: const [showAnnotations, setShowAnnotations] = useState(false);
const [visibleProportionLayers, setVisibleProportionLayers] = useState<Set<ProportionLayerType>>(new Set());
```

Add import at top:
```typescript
import type { ProportionLayerType } from '@/components/dsd/ProportionOverlay';
```

Add toggle callback:
```typescript
const toggleProportionLayer = useCallback((layer: ProportionLayerType) => {
  setVisibleProportionLayers(prev => {
    const next = new Set(prev);
    if (next.has(layer)) {
      next.delete(layer);
    } else {
      next.add(layer);
    }
    return next;
  });
}, []);
```

Return these new values from the hook alongside existing return values:
```typescript
visibleProportionLayers,
toggleProportionLayer,
```

**Step 2: Update DSDSimulationViewer props and rendering**

In `apps/web/src/components/wizard/dsd/DSDSimulationViewer.tsx`:

Add imports:
```typescript
import { ProportionOverlay, type ProportionLayerType } from '@/components/dsd/ProportionOverlay';
import { useProportionLines } from '@/hooks/domain/dsd/useProportionLines';
import { Ruler, Ratio, SmilePlus } from 'lucide-react';
```

Add new props to `DSDSimulationViewerProps` (after line 41):
```typescript
analysis?: DSDAnalysis;
visibleProportionLayers: Set<ProportionLayerType>;
onToggleProportionLayer: (layer: ProportionLayerType) => void;
```

Inside the component, compute proportion lines:
```typescript
const proportionLines = useProportionLines(toothBounds, analysis);
```

Add proportion toggle buttons after the annotation toggle button (after line 91), inside the same `flex items-center gap-2` div:

```tsx
{toothBounds.length >= 2 && (
  <>
    <Button
      variant={visibleProportionLayers.has('midline') ? 'default' : 'outline'}
      size="sm"
      onClick={() => onToggleProportionLayer('midline')}
      className="text-xs"
      aria-pressed={visibleProportionLayers.has('midline')}
    >
      <Ruler className="w-3 h-3 mr-1" />
      {t('components.dsd.proportionOverlay.midline')}
    </Button>
    <Button
      variant={visibleProportionLayers.has('goldenRatio') ? 'default' : 'outline'}
      size="sm"
      onClick={() => onToggleProportionLayer('goldenRatio')}
      className="text-xs"
      aria-pressed={visibleProportionLayers.has('goldenRatio')}
    >
      <Ratio className="w-3 h-3 mr-1" />
      {t('components.dsd.proportionOverlay.goldenRatio')}
    </Button>
    <Button
      variant={visibleProportionLayers.has('smileArc') ? 'default' : 'outline'}
      size="sm"
      onClick={() => onToggleProportionLayer('smileArc')}
      className="text-xs"
      aria-pressed={visibleProportionLayers.has('smileArc')}
    >
      <SmilePlus className="w-3 h-3 mr-1" />
      {t('components.dsd.proportionOverlay.smileArc')}
    </Button>
  </>
)}
```

Update the `annotationOverlay` prop on `ComparisonSlider` (line 198) to include both overlays:

```tsx
annotationOverlay={!isActiveFaceMockup && (showAnnotations || visibleProportionLayers.size > 0) ? (
  <>
    {showAnnotations && (
      <AnnotationOverlay
        suggestions={suggestions || []}
        toothBounds={toothBounds}
        visible={showAnnotations}
        containerWidth={annotationDimensions.width}
        containerHeight={annotationDimensions.height}
      />
    )}
    {visibleProportionLayers.size > 0 && (
      <ProportionOverlay
        lines={proportionLines}
        visibleLayers={visibleProportionLayers}
        containerWidth={annotationDimensions.width}
        containerHeight={annotationDimensions.height}
      />
    )}
  </>
) : undefined}
```

**Step 3: Wire through DSDAnalysisView**

In `apps/web/src/components/wizard/dsd/DSDAnalysisView.tsx`, pass `analysis`, `visibleProportionLayers`, and `onToggleProportionLayer` through to `DSDSimulationViewer`. Add these to the props interface and forward them.

**Step 4: Run type-check + build**

Run: `cd apps/web && npx tsc --noEmit --pretty`
Expected: No errors

**Step 5: Commit**

```bash
git add apps/web/src/components/wizard/dsd/DSDSimulationViewer.tsx apps/web/src/components/wizard/dsd/useDSDStep.ts apps/web/src/components/wizard/dsd/DSDAnalysisView.tsx
git commit -m "feat(dsd): integrate proportion overlay toggles into simulation viewer"
```

---

### Task 4: i18n keys for proportion overlay

**Files:**
- Modify: `apps/web/src/locales/pt-BR.json`
- Modify: `apps/web/src/locales/en-US.json`

**Step 1: Add keys to pt-BR.json**

Add under `components.dsd` (create if nested path doesn't exist):

```json
"proportionOverlay": {
  "ariaLabel": "Linhas de proporção DSD",
  "midline": "Linha Média",
  "goldenRatio": "Proporção Áurea",
  "smileArc": "Arco do Sorriso"
}
```

**Step 2: Add keys to en-US.json**

```json
"proportionOverlay": {
  "ariaLabel": "DSD proportion lines",
  "midline": "Midline",
  "goldenRatio": "Golden Ratio",
  "smileArc": "Smile Arc"
}
```

**Step 3: Verify keys resolve**

Run: `node -e "const j = JSON.parse(require('fs').readFileSync('apps/web/src/locales/pt-BR.json','utf8')); console.log(j.components?.dsd?.proportionOverlay?.midline);"`
Expected: `Linha Média`

**Step 4: Commit**

```bash
git add apps/web/src/locales/pt-BR.json apps/web/src/locales/en-US.json
git commit -m "feat(i18n): add proportion overlay keys (pt-BR, en-US)"
```

---

## Feature 2: Comparação entre Layers

### Task 5: LayerComparisonModal component

**Files:**
- Create: `apps/web/src/components/dsd/LayerComparisonModal.tsx`

**Context:** Modal that lets the user pick two DSD simulation layers (left/right) and compare them using the existing `ComparisonSlider`. The modal receives the available layers and their signed image URLs.

**Step 1: Write the component**

```tsx
// apps/web/src/components/dsd/LayerComparisonModal.tsx
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Label,
} from '@parisgroup-ai/pageshell/primitives';
import { ComparisonSlider } from './ComparisonSlider';
import type { SimulationLayer, SimulationLayerType } from '@/types/dsd';
import { getLayerLabel } from '@/types/dsd';

interface LayerComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Original (before) image base64 or signed URL */
  originalImage: string;
  /** Available layers with resolved image URLs */
  layers: Array<SimulationLayer & { resolvedUrl: string }>;
}

export function LayerComparisonModal({
  open,
  onOpenChange,
  originalImage,
  layers,
}: LayerComparisonModalProps) {
  const { t } = useTranslation();

  // Options include "original" plus all available layers
  const options = useMemo(() => {
    const items: Array<{ value: string; label: string; url: string }> = [
      { value: 'original', label: t('components.wizard.dsd.simulationViewer.before'), url: originalImage },
      ...layers.map(l => ({
        value: l.type,
        label: getLayerLabel(l.type as SimulationLayerType, t),
        url: l.resolvedUrl,
      })),
    ];
    return items;
  }, [layers, originalImage, t]);

  const [leftValue, setLeftValue] = useState('original');
  const [rightValue, setRightValue] = useState(layers[0]?.type || 'original');

  const leftUrl = options.find(o => o.value === leftValue)?.url || originalImage;
  const rightUrl = options.find(o => o.value === rightValue)?.url || originalImage;
  const leftLabel = options.find(o => o.value === leftValue)?.label || '';
  const rightLabel = options.find(o => o.value === rightValue)?.label || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('components.dsd.layerComparison.title')}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t('components.dsd.layerComparison.leftSide')}
            </Label>
            <Select value={leftValue} onValueChange={setLeftValue}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map(o => (
                  <SelectItem key={`left-${o.value}`} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t('components.dsd.layerComparison.rightSide')}
            </Label>
            <Select value={rightValue} onValueChange={setRightValue}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map(o => (
                  <SelectItem key={`right-${o.value}`} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ComparisonSlider
          beforeImage={leftUrl}
          afterImage={rightUrl}
          beforeLabel={leftLabel}
          afterLabel={rightLabel}
        />
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Run type-check**

Run: `cd apps/web && npx tsc --noEmit --pretty`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/components/dsd/LayerComparisonModal.tsx
git commit -m "feat(dsd): add LayerComparisonModal with dual layer selector"
```

---

### Task 6: Integrate comparison button + i18n

**Files:**
- Modify: `apps/web/src/components/wizard/dsd/DSDSimulationViewer.tsx`
- Modify: `apps/web/src/components/dsd/CollapsibleDSD.tsx`
- Modify: `apps/web/src/locales/pt-BR.json`
- Modify: `apps/web/src/locales/en-US.json`

**Step 1: Add i18n keys**

In pt-BR.json, under `components.dsd`:

```json
"layerComparison": {
  "title": "Comparar Camadas",
  "leftSide": "Lado Esquerdo",
  "rightSide": "Lado Direito",
  "button": "Comparar"
}
```

In en-US.json:

```json
"layerComparison": {
  "title": "Compare Layers",
  "leftSide": "Left Side",
  "rightSide": "Right Side",
  "button": "Compare"
}
```

**Step 2: Add "Compare" button to DSDSimulationViewer**

In `DSDSimulationViewer.tsx`, add a "Comparar" button in the header area (next to annotation/proportion toggles). Only show when `layers.length >= 2`. The button opens the comparison modal.

Add state and import:
```typescript
import { useState } from 'react';
import { Columns2 } from 'lucide-react';
const LayerComparisonModal = lazy(() => import('@/components/dsd/LayerComparisonModal').then(m => ({ default: m.LayerComparisonModal })));
```

Add new props:
```typescript
/** Resolved signed URLs per layer type, for comparison modal */
layerUrls?: Record<string, string>;
```

Add state inside the component:
```typescript
const [showComparison, setShowComparison] = useState(false);
```

Add button after proportion toggles:
```tsx
{layers.length >= 2 && (
  <Button
    variant="outline"
    size="sm"
    onClick={() => setShowComparison(true)}
    className="text-xs"
  >
    <Columns2 className="w-3 h-3 mr-1" />
    {t('components.dsd.layerComparison.button')}
  </Button>
)}
```

Add modal at end of component (before closing `</div>`):
```tsx
{showComparison && (
  <Suspense fallback={null}>
    <LayerComparisonModal
      open={showComparison}
      onOpenChange={setShowComparison}
      originalImage={imageBase64}
      layers={layers
        .filter(l => l.simulation_url && layerUrls?.[l.simulation_url])
        .map(l => ({ ...l, resolvedUrl: layerUrls![l.simulation_url!] }))}
    />
  </Suspense>
)}
```

**Step 3: Also add button to CollapsibleDSD (EvaluationDetails page)**

In `apps/web/src/components/dsd/CollapsibleDSD.tsx`, add a "Comparar" button next to the layer tabs when multiple layers exist. Follow the same pattern (lazy modal + button).

**Step 4: Run type-check + build**

Run: `cd apps/web && npx tsc --noEmit --pretty`
Expected: No errors

**Step 5: Commit**

```bash
git add apps/web/src/components/wizard/dsd/DSDSimulationViewer.tsx apps/web/src/components/dsd/CollapsibleDSD.tsx apps/web/src/components/dsd/LayerComparisonModal.tsx apps/web/src/locales/pt-BR.json apps/web/src/locales/en-US.json
git commit -m "feat(dsd): integrate layer comparison button in viewer and details page"
```

---

## Feature 3: Relatório PDF Profissional

### Task 7: Add DSD before/after + suggestions to PDF

**Files:**
- Modify: `apps/web/src/lib/pdf/pdfSections.ts`
- Modify: `apps/web/src/lib/generatePDF.ts`
- Modify: `apps/web/src/locales/pt-BR.json`
- Modify: `apps/web/src/locales/en-US.json`

**Context:** The existing `renderDSDAnalysis` shows scores and parameters. We need to add: (1) a suggestions table (tooth, issue, proposed change), and (2) observations list. The PDF already uses jsPDF. Images (before/after) would require base64 embedding which is complex — defer image embedding, focus on text data first.

**Step 1: Add `renderDSDSuggestions` section to pdfSections.ts**

After `renderDSDAnalysis` (line 291), add:

```typescript
// ============ DSD SUGGESTIONS TABLE ============
export function renderDSDSuggestions(ctx: PDFRenderContext, data: PDFData) {
  if (!data.dsdAnalysis?.suggestions?.length) return;

  const { pdf, margin, contentWidth, t } = ctx;
  const suggestions = data.dsdAnalysis.suggestions;

  checkPageBreak(ctx, 30 + suggestions.length * 8);

  addText(ctx, t('pdf.dsd.suggestionsTitle'), margin, ctx.y, { fontSize: 10, fontStyle: 'bold', color: [37, 99, 235] });
  ctx.y += 6;

  // Table header
  const colWidths = [15, (contentWidth - 15) * 0.35, (contentWidth - 15) * 0.35, (contentWidth - 15) * 0.3];
  const headerLabels = [
    t('pdf.dsd.tooth'),
    t('pdf.dsd.currentIssue'),
    t('pdf.dsd.proposedChange'),
    t('pdf.dsd.treatment'),
  ];

  pdf.setFillColor(241, 245, 249);
  pdf.roundedRect(margin, ctx.y - 3, contentWidth, 7, 1, 1, 'F');

  let x = margin;
  headerLabels.forEach((label, i) => {
    addText(ctx, label, x + 2, ctx.y, { fontSize: 7, fontStyle: 'bold', color: [71, 85, 105] });
    x += colWidths[i];
  });
  ctx.y += 7;

  // Table rows
  suggestions.forEach((s) => {
    checkPageBreak(ctx, 8);

    x = margin;
    addText(ctx, sanitizeText(s.tooth), x + 2, ctx.y, { fontSize: 7 });
    x += colWidths[0];
    addText(ctx, sanitizeText(s.current_issue || '-'), x + 2, ctx.y, { fontSize: 7, maxWidth: colWidths[1] - 4 });
    x += colWidths[1];
    addText(ctx, sanitizeText(s.proposed_change || '-'), x + 2, ctx.y, { fontSize: 7, maxWidth: colWidths[2] - 4 });
    x += colWidths[2];
    addText(ctx, sanitizeText(s.treatment_indication || '-'), x + 2, ctx.y, { fontSize: 7, maxWidth: colWidths[3] - 4 });
    ctx.y += 6;
  });

  ctx.y += 4;
}
```

**Step 2: Add `renderDSDObservations` section**

```typescript
// ============ DSD OBSERVATIONS ============
export function renderDSDObservations(ctx: PDFRenderContext, data: PDFData) {
  if (!data.dsdAnalysis?.observations?.length) return;

  const { margin, t } = ctx;
  const observations = data.dsdAnalysis.observations;

  checkPageBreak(ctx, 10 + observations.length * 5);

  addText(ctx, t('pdf.dsd.observationsTitle'), margin, ctx.y, { fontSize: 10, fontStyle: 'bold', color: [37, 99, 235] });
  ctx.y += 6;

  observations.forEach((obs) => {
    checkPageBreak(ctx, 6);
    addText(ctx, `• ${sanitizeText(obs)}`, margin + 3, ctx.y, { fontSize: 7.5, maxWidth: ctx.contentWidth - 6 });
    ctx.y += 5;
  });

  ctx.y += 4;
}
```

**Step 3: Wire into generatePDF.ts**

In `apps/web/src/lib/generatePDF.ts`, import and call the new sections after `renderDSDAnalysis`:

```typescript
import { renderDSDSuggestions, renderDSDObservations } from './pdf/pdfSections';

// In the render sequence, after renderDSDAnalysis(ctx, data):
renderDSDSuggestions(ctx, data);
renderDSDObservations(ctx, data);
```

**Step 4: Add i18n keys**

In pt-BR.json under `pdf.dsd`:
```json
"suggestionsTitle": "Sugestões de Tratamento DSD",
"tooth": "Dente",
"currentIssue": "Situação Atual",
"proposedChange": "Alteração Proposta",
"treatment": "Tratamento",
"observationsTitle": "Observações DSD"
```

In en-US.json under `pdf.dsd`:
```json
"suggestionsTitle": "DSD Treatment Suggestions",
"tooth": "Tooth",
"currentIssue": "Current Issue",
"proposedChange": "Proposed Change",
"treatment": "Treatment",
"observationsTitle": "DSD Observations"
```

**Step 5: Run type-check**

Run: `cd apps/web && npx tsc --noEmit --pretty`
Expected: No errors

**Step 6: Commit**

```bash
git add apps/web/src/lib/pdf/pdfSections.ts apps/web/src/lib/generatePDF.ts apps/web/src/locales/pt-BR.json apps/web/src/locales/en-US.json
git commit -m "feat(pdf): add DSD suggestions table and observations to PDF report"
```

---

## Feature 4: Compartilhamento WhatsApp

### Task 8: WhatsApp share button

**Files:**
- Modify: `apps/web/src/hooks/domain/evaluation/useEvaluationActions.ts`
- Modify: `apps/web/src/pages/EvaluationDetails.tsx`
- Modify: `apps/web/src/locales/pt-BR.json`
- Modify: `apps/web/src/locales/en-US.json`

**Context:** Add a WhatsApp share button next to the existing "Compartilhar" (copy link) button. It reuses the same `getOrCreateShareLink` infrastructure but opens `wa.me` instead of copying to clipboard.

**Step 1: Add `handleShareWhatsApp` to useEvaluationActions**

In `apps/web/src/hooks/domain/evaluation/useEvaluationActions.ts`, after `handleShareCase` (line 174), add:

```typescript
const handleShareWhatsApp = useCallback(async () => {
  if (!user || !sessionId) return;
  setIsSharing(true);

  try {
    const token = await evaluations.getOrCreateShareLink(sessionId, user.id);
    const shareUrl = `${window.location.origin}/shared/${token}`;
    const message = t('toasts.evaluationDetail.whatsappMessage', { url: shareUrl });
    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    trackEvent('evaluation_shared', { method: 'whatsapp' });
  } catch (error) {
    logger.error('Error sharing via WhatsApp:', error);
    toast.error(t('toasts.evaluationDetail.shareError'));
  } finally {
    setIsSharing(false);
  }
}, [user, sessionId]);
```

Return `handleShareWhatsApp` from the hook.

**Step 2: Add WhatsApp button to EvaluationDetails.tsx**

In `apps/web/src/pages/EvaluationDetails.tsx`, after the existing Share button (line 162), add:

```tsx
<Button
  variant="outline"
  size="sm"
  className="min-h-11"
  onClick={detail.handleShareWhatsApp}
  disabled={detail.isSharing}
>
  {detail.isSharing ? (
    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
  ) : (
    <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )}
  WhatsApp
</Button>
```

**Step 3: Add i18n keys**

In pt-BR.json under `toasts.evaluationDetail`:
```json
"whatsappMessage": "Confira a análise do seu sorriso: {{url}}"
```

In en-US.json under `toasts.evaluationDetail`:
```json
"whatsappMessage": "Check out your smile analysis: {{url}}"
```

**Step 4: Run type-check**

Run: `cd apps/web && npx tsc --noEmit --pretty`
Expected: No errors

**Step 5: Commit**

```bash
git add apps/web/src/hooks/domain/evaluation/useEvaluationActions.ts apps/web/src/pages/EvaluationDetails.tsx apps/web/src/locales/pt-BR.json apps/web/src/locales/en-US.json
git commit -m "feat: add WhatsApp share button for evaluation sharing"
```

---

## Summary

| Task | Feature | Files | Estimated Complexity |
|------|---------|-------|---------------------|
| 1 | Proportion Overlay | hook + test | Medium |
| 2 | Proportion Overlay | SVG component | Medium |
| 3 | Proportion Overlay | integration + toggles | Medium |
| 4 | Proportion Overlay | i18n | Simple |
| 5 | Layer Comparison | modal component | Medium |
| 6 | Layer Comparison | integration + i18n | Medium |
| 7 | PDF Report | sections + i18n | Medium |
| 8 | WhatsApp Share | button + handler | Simple |

**Total: 8 tasks, 4 features, ~15 files touched**
