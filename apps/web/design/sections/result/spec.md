---
composite: DetailPage
---

# Result Specification

## Overview
Detail page for a single tooth evaluation result. Shows the AI-recommended resin, stratification protocol layers, finishing/polishing steps, clinical checklist, DSD simulation, case summary, and alternative resins. Supports tab navigation for resina treatments and PDF export.

## Views

### Result Detail
1. **Breadcrumbs** -- Dashboard > Avaliação > {Dente XX}.
2. **Treatment Type Header Card** -- Colored card with treatment icon, treatment label (e.g. "Resina Composta"), tooth label + region, date/time, direct/indirect badge. Background and border color vary by treatment type.
3. **Inventory Banner** -- Conditional card (resina without inventory) with Package icon, prompt to configure inventory, "Ir ao Inventario" button.
4. **Main Resin Recommendation** -- Glass card with ai-glow. Shows CheckCircle + resin name, manufacturer, type badge. 4-column stats grid: Opacidade, Resistência, Polimento, Estética. Justification text below border-t divider. Optional "No seu estoque" badge with pulse animation.
5. **Tab Navigation** -- Glass pill bar with 4 tabs (resina only): Protocolo, Acabamento, Checklist, DSD. Active tab has primary bg.
6. **Protocol Tab** -- ProtocolSections composite: stratification layer table (color-coded rows by layer type), finishing protocol, alerts/warnings, confidence badge.
7. **Finishing Tab** -- Finishing and polishing steps.
8. **Checklist Tab** -- Interactive checklist with progress persistence. Items checkable with optimistic updates.
9. **DSD Tab** -- CollapsibleDSD with before/after images, simulation layers, aesthetic analysis metrics.
10. **Whitening Preference Alert** -- Conditional card showing shade adjustment guidance based on patient aesthetic goals.
11. **Bruxism Alert** -- Warning card when bruxism detected, treatment-type-specific guidance.
12. **Ideal Resin Card** -- Secondary recommendation card with Sparkles icon and ai-dot animation, shown when ideal differs from recommended.
13. **Alternatives Section** -- List of alternative resin cards with name, manufacturer, reason.
14. **Case Summary** -- CaseSummaryBox with all evaluation parameters, secondary photos, AI indication reason.
15. **Patient Preferences** -- Heart icon card with quoted aesthetic goals.
16. **Disclaimer** -- Warning-styled card with AlertTriangle icon and clinical disclaimer text.
17. **Footer Actions** -- "Recalcular" (outline), "Baixar PDF" (outline, loading state), "Novo Caso" (primary).
18. **PDF Confirm Dialog** -- PageConfirmDialog warning variant for incomplete checklist.

## UI Requirements
- Glass containers (`.glass-panel`) for tab bar and cards
- `ai-glow` effect on main recommendation and ideal resin cards
- `ai-dot` animation on Sparkles icon
- `badge-pulse-ring` animation on inventory badge
- Ambient background: `section-glow-bg` with `ai-grid-pattern` overlay
- Protocol table: color-coded left border per layer type (incisal, opaco, dentina, effect, esmalte)
- All interactive: `focus-visible:ring-2`, `transition-colors`, `hover:shadow-md`
- Print styles: hidden navigation, visible print header with brand + date
- Loading overlay during PDF generation

## Configuration
- shell: false
- composite: DetailPage
- backHref: /evaluation/{session_id}
- maxWidth: max-w-5xl
