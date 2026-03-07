---
composite: DetailPage
---

# Group Result Specification

## Overview
Detail page for a unified treatment protocol shared across multiple teeth in the same treatment group. Displays the same protocol as the Result page but applied to N teeth simultaneously. Supports bulk checklist updates, bulk mark-as-completed, and protocol retry for the entire group.

## Views

### Group Result Detail
1. **Breadcrumbs** -- Dashboard > Avaliação > Protocolo Unificado (N dentes).
2. **Treatment Type Header Card** -- Colored card with treatment icon, "Protocolo Unificado" title, treatment type subtitle, tooth badges for all group teeth, "{N} dentes" count badge. Background/border color varies by treatment type.
3. **Header Actions** -- "Marcar Todos Concluídos" button (outline, CheckCircle icon).
4. **Protocol Unavailable Alert** -- Conditional fallback when no protocol exists for resina type. Retry button with loading state.
5. **Resin Recommendation Card** -- Glass card with ai-glow showing resin name, manufacturer, type badge. Message: "Aplique protocolo identico para: {teeth list}".
6. **DSD Section** -- CollapsibleDSD with before/after images, simulation layers, layer URLs. Shown when DSD analysis exists on primary evaluation.
7. **Protocol Sections** -- ProtocolSections composite with full protocol: stratification layers, finishing, checklist (shared across group), alerts, warnings, confidence. Identical to Result page but with `treatmentStyleLabel` prop.
8. **Footer Actions** -- "Recalcular" button (outline, RefreshCw icon).
9. **Mark All Completed Dialog** -- PageConfirmDialog warning variant confirming bulk status change.

## UI Requirements
- Glass containers (`.glass-panel`) for all cards
- `ai-glow` effect on resin recommendation card
- Ambient background: `section-glow-bg` with `ai-grid-pattern` overlay
- Tooth badges: outline variant, `formatToothLabel` formatted, flex-wrap layout
- All interactive: `focus-visible:ring-2`, `transition-colors`, `hover:shadow-md`
- Checklist changes propagate to ALL evaluations in the group (optimistic update)
- Protocol retry regenerates for primary evaluation then syncs to group

## Configuration
- shell: false
- composite: DetailPage
- backHref: /evaluation/{session_id}
- maxWidth: max-w-5xl
