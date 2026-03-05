---
title: DSD Page Improvements Implementation Plan
created: 2026-03-05
updated: 2026-03-05
status: ready
tags: [type/plan, domain/dsd]
---

# DSD Page Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the DSD page with smarter gengivoplasty banner logic, professional overlays, and a reorganized compare/layout.

**Architecture:** Three independent changes to the DSD wizard step. Task 1 changes the gengivoplasty detection from boolean to three-tier. Task 2 redesigns SVG overlays for a clinical-software look. Task 3 reorganizes the layout (image-first) and fixes the compare modal's cross-context bug.

**Tech Stack:** React 18, TypeScript, SVG, PageShell primitives (Popover, Button, Badge), Tailwind CSS, i18n (react-i18next)

---

## Task 1: Gengivoplasty Three-Tier Confidence

### Task 1.1: Update useDSDGingivoplasty hook

**Files:**
- Modify: `apps/web/src/components/wizard/dsd/useDSDGingivoplasty.ts:107-123`

**Step 1: Replace `hasGingivoSuggestion` with `getGingivoConfidence`**

Replace the `hasGingivoSuggestion` callback (lines 107-123) with:

```typescript
type GingivoConfidence = 'recommended' | 'optional' | 'none';

const getGingivoConfidence = useCallback((analysis: DSDAnalysis): GingivoConfidence => {
  // Check for explicit gengivoplasty treatment indication
  const hasExplicitIndication = !!analysis.suggestions?.some(s => {
    const indication = (s.treatment_indication || '').toLowerCase();
    return indication === 'gengivoplastia' || indication === 'gingivoplasty';
  });
  if (hasExplicitIndication) return 'recommended';

  // Check for gingival keywords in suggestions text
  const gingivoKeywords = ['gengivoplastia', 'excesso gengival', 'sorriso gengival', 'coroa clínica curta', 'coroa clinica curta'];
  const hasKeywordInSuggestions = !!analysis.suggestions?.some(s => {
    const text = `${s.current_issue} ${s.proposed_change}`.toLowerCase();
    return gingivoKeywords.some(kw => text.includes(kw));
  });

  if (analysis.smile_line === 'alta') {
    return hasKeywordInSuggestions ? 'recommended' : 'optional';
  }

  if (analysis.smile_line === 'média' && hasKeywordInSuggestions) {
    return 'recommended';
  }

  return 'none';
}, []);
```

**Step 2: Update the return object (line 185)**

Replace `hasGingivoSuggestion,` with `getGingivoConfidence,`

**Step 3: Export the type**

Add to the top of the file (after imports): `export type GingivoConfidence = 'recommended' | 'optional' | 'none';`

### Task 1.2: Update useDSDStep bridge

**Files:**
- Modify: `apps/web/src/components/wizard/dsd/useDSDStep.ts:541`

**Step 1:** Replace `hasGingivoSuggestion: gingivo.hasGingivoSuggestion,` with `getGingivoConfidence: gingivo.getGingivoConfidence,`

### Task 1.3: Update DSDStep.tsx caller

**Files:**
- Modify: `apps/web/src/components/wizard/DSDStep.tsx:147`

**Step 1:** Replace:
```tsx
hasGingivoSuggestion={state.result?.analysis ? state.hasGingivoSuggestion(state.result.analysis) : false}
```
With:
```tsx
gingivoConfidence={state.result?.analysis ? state.getGingivoConfidence(state.result.analysis) : 'none'}
```

### Task 1.4: Update DSDAnalysisView props and banner

**Files:**
- Modify: `apps/web/src/components/wizard/dsd/DSDAnalysisView.tsx:61, 112, 214-274`

**Step 1: Update prop type (line 61)**

Replace `hasGingivoSuggestion: boolean;` with:
```typescript
gingivoConfidence: 'recommended' | 'optional' | 'none';
```

**Step 2: Update destructured prop (line 112)**

Replace `hasGingivoSuggestion,` with `gingivoConfidence,`

**Step 3: Replace banner render logic (lines 214-274)**

Replace the entire gengivoplasty approval block with:

```tsx
{gingivoplastyApproved === null && gingivoConfidence !== 'none' && (
  <Card className={gingivoConfidence === 'recommended'
    ? "border-warning/60 bg-warning/5"
    : "border-border bg-secondary/30"
  }>
    <CardContent className="py-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <AlertCircle className={`w-5 h-5 mt-0.5 shrink-0 ${gingivoConfidence === 'recommended' ? 'text-warning' : 'text-muted-foreground'}`} />
          <div>
            <div className="flex items-center gap-2">
              <p className={`text-sm font-medium ${gingivoConfidence === 'recommended' ? 'text-warning-foreground dark:text-warning' : 'text-foreground'}`}>
                {gingivoConfidence === 'recommended'
                  ? t('components.wizard.dsd.analysisView.gingivoplastyDetected')
                  : t('components.wizard.dsd.analysisView.gingivoplastyOption')
                }
              </p>
              <Badge
                variant={gingivoConfidence === 'recommended' ? 'default' : 'secondary'}
                className={gingivoConfidence === 'recommended'
                  ? 'bg-warning text-warning-foreground text-xs px-1.5 py-0'
                  : 'text-xs px-1.5 py-0'
                }
              >
                {gingivoConfidence === 'recommended'
                  ? t('components.wizard.dsd.analysisView.aiRecommended')
                  : t('components.wizard.dsd.analysisView.optional')
                }
              </Badge>
            </div>
            <p className={`text-xs mt-1 ${gingivoConfidence === 'recommended' ? 'text-warning-foreground dark:text-warning' : 'text-muted-foreground'}`}>
              {gingivoConfidence === 'recommended'
                ? t('components.wizard.dsd.analysisView.gingivoplastyDesc')
                : t('components.wizard.dsd.analysisView.gingivoplastyOptionalDesc')
              }
            </p>
          </div>
        </div>
        <div className="flex gap-2 ml-8">
          <Button
            variant="default"
            size="sm"
            onClick={onApproveGingivoplasty}
            className="gap-1"
          >
            <CheckCircle className="w-3 h-3" />
            {t('components.wizard.dsd.analysisView.approveGingivoplasty')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDiscardGingivoplasty}
            className="gap-1"
          >
            <XCircle className="w-3 h-3" />
            {t('components.wizard.dsd.analysisView.discardGingivoplasty')}
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

**Step 4: Commit**

```bash
git add apps/web/src/components/wizard/dsd/useDSDGingivoplasty.ts \
       apps/web/src/components/wizard/dsd/useDSDStep.ts \
       apps/web/src/components/wizard/DSDStep.tsx \
       apps/web/src/components/wizard/dsd/DSDAnalysisView.tsx
git commit -m "feat(dsd): three-tier gengivoplasty confidence (recommended/optional/none)"
```

---

## Task 2: Professional Overlay Annotations

### Task 2.1: Redesign AnnotationOverlay

**Files:**
- Modify: `apps/web/src/components/dsd/AnnotationOverlay.tsx` (full rewrite of SVG rendering, lines 62-225)

**Step 1: Rewrite SVG rendering**

Replace the entire SVG content inside the `<svg>` (lines 62-225) with refined annotations:

- **Remove ellipses** — replace with small circle dot (r=3, fillOpacity=0.4)
- **Tooth labels** — replace 48x16 rect with auto-width pill: `<rect rx={8}` with `fill="rgba(0,0,0,0.6)"`, smaller text (fontSize=8, fontWeight=500)
- **Measurement rulers** — reduce strokeWidth to 1, strokeOpacity to 0.6, measurement pill same glass style
- **Gingival line** — strokeWidth=1, strokeOpacity=0.5 (was 2, 0.8)

Key changes for each `<g key={idx}>`:

```tsx
<g key={idx}>
  {/* Subtle dot marker at tooth center */}
  <circle
    cx={cx}
    cy={cy}
    r={3}
    fill={color}
    fillOpacity={0.4}
  />
  {/* Glass-pill tooth label */}
  <rect
    x={cx - 14}
    y={cy + ry + 4}
    width={28}
    height={14}
    rx={7}
    fill="rgba(0,0,0,0.6)"
  />
  <text
    x={cx}
    y={cy + ry + 14}
    textAnchor="middle"
    fill="white"
    fontSize={8}
    fontWeight={500}
  >
    {suggestion.tooth}
  </text>

  {/* Cervical measurement (gengivoplasty) */}
  {isGingivo && (
    <>
      <line
        x1={cx - rx}
        y1={cy - ry * 0.8}
        x2={cx + rx}
        y2={cy - ry * 0.8}
        stroke="#ec4899"
        strokeWidth={1}
        strokeDasharray="4 2"
        strokeOpacity={0.5}
      />
      <line
        x1={cx + rx + 4}
        y1={cy - ry}
        x2={cx + rx + 4}
        y2={cy - ry * 0.6}
        stroke="#ec4899"
        strokeWidth={1}
        strokeOpacity={0.6}
        markerStart="url(#arrowUp)"
        markerEnd="url(#arrowDown)"
      />
      <rect
        x={cx + rx + 8}
        y={cy - ry * 0.9}
        width={measurement ? 30 : 18}
        height={12}
        rx={6}
        fill="rgba(0,0,0,0.6)"
      />
      <text
        x={cx + rx + 8 + (measurement ? 15 : 9)}
        y={cy - ry * 0.9 + 9}
        textAnchor="middle"
        fill="white"
        fontSize={7}
        fontWeight={500}
      >
        {measurement || '...'}
      </text>
    </>
  )}

  {/* Incisal measurement */}
  {isIncisal && !isGingivo && (
    <>
      <line
        x1={cx + rx + 4}
        y1={cy + ry * 0.6}
        x2={cx + rx + 4}
        y2={cy + ry}
        stroke="#3b82f6"
        strokeWidth={1}
        strokeOpacity={0.6}
        markerStart="url(#arrowUp)"
        markerEnd="url(#arrowDown)"
      />
      <rect
        x={cx + rx + 8}
        y={cy + ry * 0.7}
        width={measurement ? 30 : 18}
        height={12}
        rx={6}
        fill="rgba(0,0,0,0.6)"
      />
      <text
        x={cx + rx + 8 + (measurement ? 15 : 9)}
        y={cy + ry * 0.7 + 9}
        textAnchor="middle"
        fill="white"
        fontSize={7}
        fontWeight={500}
      >
        {measurement || '...'}
      </text>
    </>
  )}
</g>
```

Also update the arrow markers (lines 72-78) to be thinner: `strokeWidth="1"`.

**Step 2: Commit**

```bash
git add apps/web/src/components/dsd/AnnotationOverlay.tsx
git commit -m "feat(dsd): redesign annotation overlay with glass-pill style"
```

### Task 2.2: Refine ProportionOverlay

**Files:**
- Modify: `apps/web/src/components/dsd/ProportionOverlay.tsx`

**Step 1: Midline refinements (lines 169-224)**

- Line stroke: `strokeWidth={1}` (was 1.5), `strokeOpacity={0.6}` (was 0.85)
- Drag handle circle: `r={5}` (was 6), add `filter="url(#blur)"` or just use lower opacity: `fillOpacity={isDragging ? 0.7 : 0.4}`, `strokeWidth={1}` (was 1.5)
- Label text: `fontSize={9}` (was 10), `fontWeight={500}` (was 600), `opacity={0.7}`

**Step 2: Golden ratio refinements (lines 229-348)**

- All bracket lines: `strokeWidth={0.75}` (was 1.5), `strokeOpacity={0.7}` (was 0.85)
- End cap height: `capH = 3` (was 4)
- Tooth pair label: `fontSize={8}` (was 9), wrap in glass-pill rect:
```tsx
<rect
  x={(cx1 + cx2) / 2 - 18}
  y={bracketY + capH + 2}
  width={36}
  height={24}
  rx={6}
  fill="rgba(0,0,0,0.5)"
/>
```
- Ratio value text: `fontSize={9}` (was 10), `fill="white"` (instead of color), adjust y to be inside the pill rect

**Step 3: Smile arc refinements (lines 353-377)**

- Path: `strokeWidth={1.5}` (was 2), `strokeOpacity={0.7}` (was 0.85)
- **Remove the text label** (lines 367-375) — the toggle button already identifies the layer

**Step 4: Commit**

```bash
git add apps/web/src/components/dsd/ProportionOverlay.tsx
git commit -m "feat(dsd): refine proportion overlay with subtle strokes and glass labels"
```

### Task 2.3: Floating Annotations Toolbar (Popover)

**Files:**
- Modify: `apps/web/src/components/wizard/dsd/DSDSimulationViewer.tsx:101-320`

**Step 1: Add Popover import**

Add to the imports (line 4):
```typescript
import { Button, Badge, Popover, PopoverContent, PopoverTrigger } from '@parisgroup-ai/pageshell/primitives';
```

Add icon import: `SlidersHorizontal` from lucide-react (line 5).

**Step 2: Replace the button row (lines 103-195) with the new layout**

The new structure is: image first (hero), then layer bar, then action bar.

Replace the entire return (lines 101-321) with:

```tsx
return (
  <div className="space-y-3">
    {/* Hero: Comparison Slider */}
    <div ref={annotationContainerRef} className="relative">
      <ComparisonSlider
        beforeImage={beforeImage}
        afterImage={simulationImageUrl || ''}
        afterLabel={layers.length > 0 ? layers[activeLayerIndex]?.label || t('components.wizard.dsd.simulationViewer.defaultLabel') : t('components.wizard.dsd.simulationViewer.defaultLabel')}
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
                isMidlineAdjusted={isMidlineAdjusted}
                onMidlineOffsetChange={onMidlineOffsetChange}
              />
            )}
          </>
        ) : undefined}
      />

      {/* Floating annotations toolbar (top-left, inside image) */}
      {(toothBounds.length > 0) && (
        <div className="absolute top-2 left-2 z-20">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="bg-background/80 backdrop-blur-sm hover:bg-background text-xs gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {t('components.wizard.dsd.simulationViewer.analysisTools')}
                {(showAnnotations || visibleProportionLayers.size > 0) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-48 p-2">
              <div className="space-y-1">
                {suggestions?.length > 0 && (
                  <button
                    onClick={onToggleAnnotations}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                      showAnnotations ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-foreground'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {t('components.wizard.dsd.simulationViewer.annotations')}
                    {showAnnotations && <Check className="w-3 h-3 ml-auto" />}
                  </button>
                )}
                {toothBounds.length >= 2 && (
                  <>
                    <button
                      onClick={() => onToggleProportionLayer('midline')}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                        visibleProportionLayers.has('midline') ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-foreground'
                      }`}
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      {t('components.wizard.dsd.proportionOverlay.midline')}
                      {isMidlineAdjusted && <span className="text-[10px] opacity-60">*</span>}
                      {visibleProportionLayers.has('midline') && <Check className="w-3 h-3 ml-auto" />}
                    </button>
                    {isMidlineAdjusted && visibleProportionLayers.has('midline') && onResetMidline && (
                      <button
                        onClick={onResetMidline}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-muted-foreground hover:bg-secondary"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        {t('components.wizard.dsd.proportionOverlay.resetMidline')}
                      </button>
                    )}
                    <button
                      onClick={() => onToggleProportionLayer('goldenRatio')}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                        visibleProportionLayers.has('goldenRatio') ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-foreground'
                      }`}
                    >
                      <Ratio className="w-3.5 h-3.5" />
                      {t('components.wizard.dsd.proportionOverlay.goldenRatio')}
                      {visibleProportionLayers.has('goldenRatio') && <Check className="w-3 h-3 ml-auto" />}
                    </button>
                    <button
                      onClick={() => onToggleProportionLayer('smileArc')}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                        visibleProportionLayers.has('smileArc') ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-foreground'
                      }`}
                    >
                      <SmilePlus className="w-3.5 h-3.5" />
                      {t('components.wizard.dsd.proportionOverlay.smileArc')}
                      {visibleProportionLayers.has('smileArc') && <Check className="w-3 h-3 ml-auto" />}
                    </button>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>

    {/* Layer bar (below image) */}
    {(layers.length > 0 || failedLayers.length > 0) && (
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('components.wizard.dsd.simulationViewer.layerTabs')}>
        {layers.map((layer, idx) => (
          <button
            key={layer.type}
            role="tab"
            aria-selected={activeLayerIndex === idx}
            onClick={() => {
              trackEvent('dsd_layer_toggled', { layer_type: layer.type, visible: activeLayerIndex !== idx });
              onSelectLayer(idx, layer.type);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              activeLayerIndex === idx
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
            }`}
          >
            <Check className="w-3 h-3" />
            {layer.label}
            {layer.includes_gengivoplasty && (
              <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                {t('components.wizard.dsd.simulationViewer.gingiva')}
              </Badge>
            )}
          </button>
        ))}
        {/* Generating tab for complete-treatment */}
        {retryingLayer === 'complete-treatment' &&
          !layers.some(l => l.type === 'complete-treatment') &&
          !failedLayers.includes('complete-treatment') && (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-primary/30 bg-primary/5 text-primary animate-pulse"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            {getLayerLabel('complete-treatment', t)}
            <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
              {t('components.wizard.dsd.simulationViewer.gingiva')}
            </Badge>
          </span>
        )}
        {failedLayers.map((layerType) => (
          <button
            key={layerType}
            onClick={() => onRetryFailedLayer(layerType)}
            disabled={retryingLayer === layerType}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
          >
            {retryingLayer === layerType ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            {getLayerLabel(layerType, t)}
          </button>
        ))}
        {/* Face mockup button */}
        {hasFacePhoto && !hasFaceMockupLayer && onGenerateFaceMockup && (
          <button
            onClick={onGenerateFaceMockup}
            disabled={isFaceMockupGenerating || layersGenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            {isFaceMockupGenerating ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                {t('components.wizard.dsd.generatingFaceMockup')}
              </>
            ) : (
              <>
                <User className="w-3 h-3" />
                {t('components.wizard.dsd.simulateOnFace')}
              </>
            )}
          </button>
        )}
      </div>
    )}

    {/* Action bar (below layer bar) */}
    <div className="flex items-center justify-between">
      <div>
        {layers.length >= 2 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowComparison(true)}
            className="text-xs"
          >
            <Columns2 className="w-3 h-3 mr-1" />
            {t('components.wizard.dsd.layerComparison.button')}
          </Button>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRegenerateSimulation}
        disabled={isRegeneratingSimulation || isCompositing || layersGenerating}
      >
        {isRegeneratingSimulation || isCompositing || layersGenerating ? (
          <>
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            {isCompositing ? t('components.wizard.dsd.simulationViewer.adjusting') : t('components.wizard.dsd.simulationViewer.generating')}
          </>
        ) : (
          <>
            <RefreshCw className="w-3 h-3 mr-1" />
            {t('components.wizard.dsd.simulationViewer.newSimulation')}
            <span className="text-xs opacity-60 ml-0.5">{t('components.wizard.dsd.simulationViewer.free')}</span>
          </>
        )}
      </Button>
    </div>

    {showComparison && (
      <Suspense fallback={null}>
        <LayerComparisonModal
          open={showComparison}
          onOpenChange={setShowComparison}
          originalImage={imageBase64}
          facePhotoBase64={facePhotoBase64}
          layers={layers
            .filter(l => l.simulation_url && layerUrls?.[l.type])
            .map(l => ({ ...l, resolvedUrl: layerUrls![l.type] }))}
        />
      </Suspense>
    )}
  </div>
);
```

**Step 3: Add i18n key for "analysisTools"**

In `apps/web/src/locales/pt-BR.json` under `components.wizard.dsd.simulationViewer`:
```json
"analysisTools": "Analises"
```

In `apps/web/src/locales/en-US.json`:
```json
"analysisTools": "Analysis"
```

**Step 4: Commit**

```bash
git add apps/web/src/components/wizard/dsd/DSDSimulationViewer.tsx \
       apps/web/src/locales/pt-BR.json \
       apps/web/src/locales/en-US.json
git commit -m "feat(dsd): floating annotations popover and image-first layout"
```

---

## Task 3: Compare Modal Photo Context Separation

### Task 3.1: Update LayerComparisonModal

**Files:**
- Modify: `apps/web/src/components/dsd/LayerComparisonModal.tsx`

**Step 1: Add facePhotoBase64 prop and photo grouping**

Replace the full file with:

```tsx
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@parisgroup-ai/pageshell/primitives';
import { ComparisonSlider } from '@/components/dsd/ComparisonSlider';
import type { SimulationLayer } from '@/types/dsd';
import { getLayerLabel } from '@/types/dsd';

const ORIGINAL_SMILE = '__original_smile__';
const ORIGINAL_FACE = '__original_face__';

type PhotoContext = 'smile' | 'face';

function getPhotoContext(value: string): PhotoContext {
  if (value === ORIGINAL_FACE) return 'face';
  if (value === ORIGINAL_SMILE) return 'smile';
  // face-mockup layer is in "face" context
  return value === 'face-mockup' ? 'face' : 'smile';
}

interface LayerComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalImage: string;
  facePhotoBase64?: string | null;
  layers: Array<SimulationLayer & { resolvedUrl: string }>;
}

export function LayerComparisonModal({
  open,
  onOpenChange,
  originalImage,
  facePhotoBase64,
  layers,
}: LayerComparisonModalProps) {
  const { t } = useTranslation();

  const smileLayers = useMemo(() => layers.filter(l => l.type !== 'face-mockup'), [layers]);
  const faceLayers = useMemo(() => layers.filter(l => l.type === 'face-mockup'), [layers]);
  const hasFaceContext = !!facePhotoBase64 && faceLayers.length > 0;

  const [leftValue, setLeftValue] = useState(ORIGINAL_SMILE);
  const [rightValue, setRightValue] = useState(
    smileLayers.length > 0 ? smileLayers[0].type : ORIGINAL_SMILE,
  );

  const leftContext = getPhotoContext(leftValue);

  const resolveImage = (value: string): string => {
    if (value === ORIGINAL_SMILE) return originalImage;
    if (value === ORIGINAL_FACE) return facePhotoBase64 || originalImage;
    const layer = layers.find((l) => l.type === value);
    return layer?.resolvedUrl ?? originalImage;
  };

  const resolveLabel = (value: string): string => {
    if (value === ORIGINAL_SMILE) return t('components.wizard.dsd.simulationViewer.before');
    if (value === ORIGINAL_FACE) return t('components.wizard.dsd.layerComparison.faceOriginal');
    return getLayerLabel(value as SimulationLayer['type'], t);
  };

  // When left side changes context, reset right side to match
  const handleLeftChange = (value: string) => {
    setLeftValue(value);
    const newContext = getPhotoContext(value);
    const rightContext = getPhotoContext(rightValue);
    if (newContext !== rightContext) {
      // Reset right to first item in same context
      if (newContext === 'face') {
        setRightValue(faceLayers.length > 0 ? faceLayers[0].type : ORIGINAL_FACE);
      } else {
        setRightValue(smileLayers.length > 0 ? smileLayers[0].type : ORIGINAL_SMILE);
      }
    }
  };

  const renderSelectOptions = (context: PhotoContext) => (
    <>
      <SelectGroup>
        <SelectLabel>{t('components.wizard.dsd.layerComparison.smileGroup')}</SelectLabel>
        {context === 'smile' && (
          <>
            <SelectItem value={ORIGINAL_SMILE}>
              {t('components.wizard.dsd.simulationViewer.before')}
            </SelectItem>
            {smileLayers.map((layer) => (
              <SelectItem key={layer.type} value={layer.type}>
                {getLayerLabel(layer.type, t)}
              </SelectItem>
            ))}
          </>
        )}
      </SelectGroup>
      {hasFaceContext && (
        <SelectGroup>
          <SelectLabel>{t('components.wizard.dsd.layerComparison.faceGroup')}</SelectLabel>
          {context === 'face' && (
            <>
              <SelectItem value={ORIGINAL_FACE}>
                {t('components.wizard.dsd.layerComparison.faceOriginal')}
              </SelectItem>
              {faceLayers.map((layer) => (
                <SelectItem key={layer.type} value={layer.type}>
                  {getLayerLabel(layer.type, t)}
                </SelectItem>
              ))}
            </>
          )}
        </SelectGroup>
      )}
    </>
  );

  // Right side only shows items from same context as left
  const renderRightOptions = () => {
    if (leftContext === 'face') {
      return (
        <>
          <SelectItem value={ORIGINAL_FACE}>
            {t('components.wizard.dsd.layerComparison.faceOriginal')}
          </SelectItem>
          {faceLayers.map((layer) => (
            <SelectItem key={layer.type} value={layer.type}>
              {getLayerLabel(layer.type, t)}
            </SelectItem>
          ))}
        </>
      );
    }
    return (
      <>
        <SelectItem value={ORIGINAL_SMILE}>
          {t('components.wizard.dsd.simulationViewer.before')}
        </SelectItem>
        {smileLayers.map((layer) => (
          <SelectItem key={layer.type} value={layer.type}>
            {getLayerLabel(layer.type, t)}
          </SelectItem>
        ))}
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>
            {t('components.wizard.dsd.layerComparison.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                {t('components.wizard.dsd.layerComparison.leftSide')}
              </label>
              <Select value={leftValue} onValueChange={handleLeftChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ORIGINAL_SMILE}>
                    {t('components.wizard.dsd.simulationViewer.before')}
                  </SelectItem>
                  {smileLayers.map((layer) => (
                    <SelectItem key={layer.type} value={layer.type}>
                      {getLayerLabel(layer.type, t)}
                    </SelectItem>
                  ))}
                  {hasFaceContext && (
                    <>
                      <SelectItem value={ORIGINAL_FACE}>
                        {t('components.wizard.dsd.layerComparison.faceOriginal')}
                      </SelectItem>
                      {faceLayers.map((layer) => (
                        <SelectItem key={layer.type} value={layer.type}>
                          {getLayerLabel(layer.type, t)}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                {t('components.wizard.dsd.layerComparison.rightSide')}
              </label>
              <Select value={rightValue} onValueChange={setRightValue}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {renderRightOptions()}
                </SelectContent>
              </Select>
            </div>
          </div>

          <ComparisonSlider
            beforeImage={resolveImage(leftValue)}
            afterImage={resolveImage(rightValue)}
            beforeLabel={resolveLabel(leftValue)}
            afterLabel={resolveLabel(rightValue)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LayerComparisonModal;
```

**Step 2: Add i18n keys**

In `apps/web/src/locales/pt-BR.json` under `components.wizard.dsd.layerComparison`:
```json
"smileGroup": "Sorriso",
"faceGroup": "Rosto",
"faceOriginal": "Rosto Original"
```

In `apps/web/src/locales/en-US.json`:
```json
"smileGroup": "Smile",
"faceGroup": "Face",
"faceOriginal": "Original Face"
```

**Step 3: Commit**

```bash
git add apps/web/src/components/dsd/LayerComparisonModal.tsx \
       apps/web/src/locales/pt-BR.json \
       apps/web/src/locales/en-US.json
git commit -m "feat(dsd): compare modal photo context separation (smile vs face)"
```

---

## Task 4: Final Integration & Verification

### Task 4.1: Verify TypeScript builds

**Step 1: Run type check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors.

**Step 2: Fix any type errors from the prop rename (`hasGingivoSuggestion` -> `gingivoConfidence`)**

Check all references are updated — search for any remaining `hasGingivoSuggestion`:

```bash
grep -r "hasGingivoSuggestion" apps/web/src/
```

Expected: no results.

### Task 4.2: Visual smoke test

**Step 1:** Run `pnpm dev` and navigate to an existing evaluation with DSD results. Verify:

1. Gengivoplasty banner does NOT show for cases with `smile_line === 'baixa'` and no gingival findings
2. Gengivoplasty banner shows as "recommended" for explicit gingival findings
3. Gengivoplasty banner shows as "optional" (muted) for alta smile line without findings
4. Overlay annotations use subtle dot + glass-pill style
5. Proportion overlays use thin lines
6. Floating "Analises" popover opens from top-left of image
7. Layer bar sits below the image
8. Compare modal prevents face vs smile cross-comparison
9. Action bar (Comparar, Nova Simulacao) sits below layer bar

### Task 4.3: Final commit

```bash
git add -A
git commit -m "feat(dsd): DSD page improvements - gengivoplasty logic, overlays, layout"
```
