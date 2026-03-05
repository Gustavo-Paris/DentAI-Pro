---
title: DSD Page Improvements Design
created: 2026-03-05
updated: 2026-03-05
status: approved
tags: [type/design, domain/dsd]
---

# DSD Page Improvements Design

Three improvements to the DSD (Digital Smile Design) step in the wizard.

## 1. Gengivoplasty Banner Logic

**Problem:** Banner shows for almost every case (any smile_line !== 'baixa'), even without clinical indication.

**Solution:** Three-tier confidence system replacing the boolean `hasGingivoSuggestion`.

| Confidence | Condition | UI |
|---|---|---|
| `'none'` | `smile_line === 'baixa'` AND no gingival findings | Nothing shown |
| `'recommended'` | Explicit `treatment_indication === 'gengivoplastia'` in suggestions, OR `smile_line === 'alta'` WITH gingival keywords | Strong warning banner, "IA Recomendada" badge |
| `'optional'` | `smile_line === 'alta'` without explicit findings | Subtle muted banner, easily dismissible |

### Files changed

- `useDSDGingivoplasty.ts`: Replace `hasGingivoSuggestion(): boolean` with `gingivoConfidence(): 'recommended' | 'optional' | 'none'`
- `DSDAnalysisView.tsx`: Replace condition at line 214, use confidence to style banner
- Props: `hasGingivoSuggestion: boolean` -> `gingivoConfidence: 'recommended' | 'optional' | 'none'`

---

## 2. Professional Overlay Annotations

**Problem:** Overlays look amateurish -- thick colored ellipses, large opaque rectangles, competing for attention with the clinical photo.

### AnnotationOverlay redesign

- **Remove ellipses** -- replace with subtle dot marker (4px circle, semi-transparent) at tooth center
- **Tooth labels** -- replace 48x16 opaque rectangles with small glass-pill badges (`bg-black/60 backdrop-blur-sm text-white`, auto-width, 10px font, rounded-full)
- **Measurement rulers** -- thinner strokes (1px), softer colors, lower opacity, glass-pill measurement labels
- **Gingival line** -- 1px, opacity 0.5 (was 2px, 0.8)

### ProportionOverlay redesign

- **Midline** -- 1px stroke, 0.6 opacity, smaller label. Drag handle: subtle ring with backdrop-blur instead of solid red circle
- **Golden ratio brackets** -- hairline strokes (0.75px). Ratio labels use glass-pill style. Keep green/amber color coding
- **Smile arc** -- 1.5px stroke, 0.7 opacity. Remove text label (toggle button already identifies it)

### Toolbar reorganization

Current: row of 6+ individual buttons (Marcacoes, Linha Media, Proporcao Aurea, Arco do Sorriso, Comparar, Nova Simulacao).

New: floating toolbar inside the image.
- **Annotations dropdown** -- single "Analises" button that opens a popover with checkboxes for each overlay type
- Declutters toolbar from 6+ buttons to 3-4

### Files changed

- `AnnotationOverlay.tsx`: Full redesign of SVG rendering
- `ProportionOverlay.tsx`: Refine strokes, colors, label styles
- `DSDSimulationViewer.tsx`: Replace button row with floating toolbar + popover

---

## 3. Compare View & Layout Reorganization

**Problem:** LayerComparisonModal allows cross-context comparison (face photo vs intraoral), which looks absurd. Layout has no visual hierarchy.

### Compare modal -- photo context separation

Two groups in the Select dropdowns:
- **Sorriso**: Original (intraoral), L1, L2, L3
- **Rosto** (if face photos exist): Face Original, Face Mockup

Cross-group blocked: selecting a Sorriso item on one side filters the other side to Sorriso-only (and vice versa).

Pass both `originalImage` and `facePhotoBase64` to the modal so each group resolves correctly.

### Layout reorganization

Current:
```
Section title
  -> Row of toggle buttons
  -> Row of layer tabs
  -> ComparisonSlider
  -> Whitening comparison
```

New:
```
ComparisonSlider (hero, image IS the section)
  |-- Floating toolbar (top-left): "Analises" dropdown
  |-- Floating zoom controls (top-right, already exists)
  |-- Labels (bottom corners, already exists)

Layer bar (below image):
  |-- Segmented control: L1 | L2 | L3 | Face

Action bar (below layer bar):
  |-- Left: "Comparar" button
  |-- Right: "Nova Simulacao (gratis)" button
```

Image first, controls below. Annotation controls inside image as floating dropdown.

### Files changed

- `LayerComparisonModal.tsx`: Add photo grouping, cross-group filtering, accept `facePhotoBase64` prop
- `DSDSimulationViewer.tsx`: Reorganize layout -- image hero, layer bar below, action bar below that
- `DSDAnalysisView.tsx`: Pass `facePhotoBase64` to modal

---

## Files Summary

| File | Change |
|---|---|
| `useDSDGingivoplasty.ts` | Three-tier confidence replaces boolean |
| `DSDAnalysisView.tsx` | Banner logic, pass facePhotoBase64 to modal |
| `DSDSimulationViewer.tsx` | Layout reorganization, floating toolbar, popover |
| `AnnotationOverlay.tsx` | Full SVG redesign |
| `ProportionOverlay.tsx` | Refine strokes/colors/labels |
| `LayerComparisonModal.tsx` | Photo context groups, cross-group blocking |
