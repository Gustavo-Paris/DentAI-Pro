---
composite: DetailPage
---

# Patient Profile Specification

## Overview
Detail page for an individual patient. Shows patient identity, contact info, KPI metrics, treatment timeline, and paginated session history. Supports inline editing and patient deletion via dialogs.

## Views

### Patient Profile Detail
1. **Breadcrumbs** -- Dashboard > Pacientes > {Nome do Paciente}.
2. **Header** -- Patient name as title, "Perfil do Paciente" subtitle, initials avatar circle. Actions: "Nova Avaliação" (primary), "Editar" (outline), "Excluir" (ghost/destructive).
3. **Contact Info Card** -- Glass card with phone (Phone icon), email (Mail icon), clinical notes (FileText icon) separated by a border-t divider. Empty state links to edit dialog.
4. **Metrics KPIs** -- 4-card grid (2x2 mobile, 4x1 desktop): Avaliações (total sessions), Casos (total cases), Concluídos (completed, highlighted primary color), Primeira Visita (formatted date). Each card uses glass-card + glow-card + staggered fade-in-up animation.
5. **Treatment Timeline** -- PageTreatmentTimeline composite showing sessions as chronological procedure entries with status badges (completed / in-progress).
6. **Session History** -- Chronological list of session cards. Each card has: left gradient accent bar (green=completed, primary=in-progress), date label, status badge, tooth badges (max 4 + overflow), progress bar with fraction label, chevron-right hover indicator. "Carregar mais" button for pagination. Empty state with Calendar icon + CTA.
7. **Edit Dialog** -- Modal with name, phone, email, clinical notes fields. Cancel + Save buttons.
8. **Delete Confirm Dialog** -- PageConfirmDialog destructive variant for patient deletion.

## UI Requirements
- Glass containers (`.glass-panel`, `.glass-card`) for all cards
- Ambient background: `section-glow-bg` with 3 glow orbs + `ai-grid-pattern` overlay
- Session cards: left 3px gradient accent bar, `glow-card` class, staggered `fade-in-up` animation
- Progress bars: colored fill with box-shadow glow, `role="progressbar"` with aria attributes
- All interactive elements: `focus-visible:ring-2`, `transition-colors`, `hover:shadow-md`
- `prefers-reduced-motion` fully supported
- Tooth badges: `formatToothLabel` formatted, outline variant

## Configuration
- shell: false
- composite: DetailPage
- backHref: /patients
- maxWidth: max-w-5xl
