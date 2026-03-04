---
composite: PatientsSection
---

# Patients Specification

## Overview
Patients section with 2 views: Patient List and Patient Profile. Covers browsing patients and viewing individual patient details with metrics and session history.

## Views

### Patient List
1. **Header** — "Pacientes" title + "Novo Paciente" CTA button.
2. **Search** — Patient name/phone/email search input.
3. **Sort Pills** — Recentes | Nome A-Z | Nome Z-A | Mais Casos.
4. **Patient Cards** — Glass cards with initials avatar, contact info, case count, last visit.
5. **Pagination** — Page numbers with prev/next.
6. **Empty State** — Premium: icon circle + title + description + CTA.

### Patient Profile
1. **Breadcrumbs** — Pacientes > {Patient Name}.
2. **Header Card** — Glass card with large avatar, patient name, action buttons.
3. **Contact Info** — Phone, email, notes with icons.
4. **Metrics KPIs** — 4-card grid: sessions, cases, completed, first visit.
5. **Session History** — Session cards with progress bars and tooth badges.

## UI Requirements
- Glass containers (`.glass-panel`) for all cards
- Ambient background: `section-glow-bg` with glow orbs
- All interactive: `focus-visible:ring-2`, `transition-colors`, `hover:shadow-md`
- `prefers-reduced-motion` fully supported

## Configuration
- shell: false
