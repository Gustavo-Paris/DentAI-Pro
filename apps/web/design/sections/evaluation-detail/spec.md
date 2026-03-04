---
composite: EvaluationDetailSection
---

# Evaluation Detail Specification

## Overview
Detail view of a clinical evaluation session showing patient photo, treatment progress, grouped evaluations by treatment type, and action controls.

## Views

### Evaluation Detail
1. **Session Header Card** — Clinical photo thumbnail, patient name, date, tooth badges, progress bar.
2. **Action Buttons** — New evaluation, share, add more teeth, mark all completed, delete session.
3. **Treatment Groups** — Evaluations grouped by treatment type with status badges and protocol indicators.
4. **Evaluation Rows** — Individual tooth evaluations with tooth number, treatment badge, status, and actions.
5. **Tip Banner** — Contextual suggestion to add more teeth or start new case.

## UI Requirements
- Glass containers (`.glass-panel`) for all cards
- Ambient background: `section-glow-bg` with glow orbs
- Treatment type badges with semantic colors
- Progress bar for session completion
- Tooth number badges in compact row
- Status badges (completed=success, pending=muted, error=destructive)
- All interactive: `focus-visible:ring-2`, `transition-colors`, `hover:shadow-md`
- `prefers-reduced-motion` fully supported

## Configuration
- shell: false
