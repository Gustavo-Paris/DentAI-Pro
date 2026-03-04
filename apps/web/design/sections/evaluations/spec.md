---
composite: EvaluationsSection
---

# Evaluations Specification

## Overview
Evaluations section with 3 views: Session List, Session Detail, and Protocol. Covers the full workflow from browsing cases to viewing detailed treatment protocols.

## Views

### Session List
1. **Header** — "Avaliações" title + "Novo Caso" CTA button.
2. **Search** — Patient name search input.
3. **Filters** — Status pills (Todos | Em Progresso | Concluídos) + Treatment pills.
4. **Session Cards** — Glass cards with left border color, treatment chips, progress bars. Most recent has shimmer border.
5. **Pagination** — Page numbers with prev/next.
6. **Empty State** — Premium: icon circle + title + description + CTA.

### Session Detail
1. **SessionHeader** — Glass card with photo placeholder, patient info, tooth badges, progress bar.
2. **Action Buttons** — Share, WhatsApp, Mark All, Delete.
3. **Evaluation Groups** — Grouped by treatment type. Group header + individual tooth cards.
4. **Tooth Cards** — Glass cards with treatment-colored left border, tooth number, resin info, status.
5. **TipBanner** — Suggestion to add more teeth.
6. **Floating Selection Bar** — Shows when cards selected: count + bulk action + dismiss.

### Protocol (Tabbed)
1. **Treatment Header** — Glass card with icon, type, tooth, region, date.
2. **Resin Recommendation** — Shimmer border card with properties grid + justification.
3. **Tabs** — Protocolo | Acabamento | Checklist | DSD.
4. **Case Summary** — Collapsible clinical data below tabs.
5. **Disclaimer** — Warning card.
6. **Footer Actions** — Recalculate, PDF, New Case.

## UI Requirements
- Glass containers (`.glass-panel`) for all cards
- Ambient background: `section-glow-bg` with glow orbs
- Treatment colors: `--color-treatment-*` tokens
- Layer colors: `--layer-*-rgb` tokens for protocol stratification
- All interactive: `focus-visible:ring-2`, `transition-colors`, `hover:shadow-md`
- `prefers-reduced-motion` fully supported

## Configuration
- shell: false
