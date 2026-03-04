---
title: Pacientes Design OS Prototype
created: 2026-03-04
status: approved
tags: [type/design, design-os, patients]
---

# Pacientes — Design OS Prototype

> **Status**: Approved (2026-03-04)

**Goal**: Prototype 2 views of the Patients section in Design OS with premium polish matching existing prototypes.

**Approach**: Polish & Elevate. Same cyberpunk/glass visual style as Wizard, Dashboard, and Evaluations prototypes.

---

## Architecture

2 independent prototypes, each renderable in Design OS iframe:

| Component | File | Mock Data |
|---|---|---|
| `PatientListPreview` | `design-src/sections/patients/PatientListPreview.tsx` | `samplePatients` |
| `PatientProfilePreview` | `design-src/sections/patients/PatientProfilePreview.tsx` | `sampleProfile` + `sampleSessions` |

Shared: `design/sections/patients/types.ts`, `data.json`, `spec.md`, barrel `index.ts`.

---

## View 1: Patient List (`PatientListPreview`)

### Layout
- Background: glow-orbs (same as Dashboard/Evaluations)
- Header: "Pacientes" title + "+ Novo Paciente" button (`btn-press btn-glow`)
- Search bar + Sort pills
- Patient cards stacked vertically
- Pagination at bottom

### Patient Card Design
- `glass-panel rounded-xl p-4` with `hover:shadow-md transition-shadow cursor-pointer`
- Left: initials avatar (`w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold`)
- Content: patient name (font-semibold) + case count badge (`bg-muted rounded-full text-xs px-2 py-0.5`)
- Contact row: Phone icon + phone, Mail icon + email (text-xs text-muted-foreground)
- Last visit: Calendar icon + date (text-xs text-muted-foreground)

### Sort Pills
- `glass-panel rounded-xl px-3 py-2 inline-flex gap-1`
- Options: Recentes | Nome A-Z | Nome Z-A | Mais Casos
- Active: `bg-primary text-primary-foreground rounded-full`

### Empty State
Premium: icon in circle bg + title + description + CTA button with btn-glow

---

## View 2: Patient Profile (`PatientProfilePreview`)

### Layout
- Breadcrumbs: Pacientes > {Patient Name}
- Header card with avatar and actions
- Contact info section
- Metrics KPI grid
- Session history cards

### Header Card
- `glass-panel rounded-xl overflow-hidden`
- `bg-gradient-to-br from-primary/5 to-transparent p-5`
- Large initials avatar: `w-16 h-16 rounded-full bg-primary/10 text-primary text-xl font-semibold`
- Patient name (text-xl font-semibold) + "Perfil do Paciente" (text-sm text-muted-foreground)
- Action buttons row: Nova Avaliacao (primary, btn-glow), Editar (outline), Excluir (ghost destructive)

### Contact Info
- `glass-panel rounded-xl p-4`
- Icon + value pairs: Phone, Mail, FileText (notes)
- Empty state: "Nenhuma informacao adicional" + "Adicionar" link

### Metrics KPIs
- `grid grid-cols-2 lg:grid-cols-4 gap-4`
- Each: `glass-panel rounded-xl p-4 text-center`
- Value (text-2xl font-semibold) + label (text-xs text-muted-foreground)
- Completed count uses `text-primary` for highlight

### Session History
- Session cards: `glass-panel rounded-xl p-4 border-l-4`
  - Green border if completed, primary if in progress
  - Date + status badge (completed=success, in-progress=muted)
  - Tooth badges (outline rounded-full)
  - Progress bar (h-2 rounded-full)
- Empty state: Calendar icon + title + CTA

---

## Mock Data Scope

- 5 sample patients with varied data (phone, email, case counts)
- 1 detailed profile with contact info, metrics, 3 sessions
- Session cards with teeth arrays and progress data

---

## Design Tokens

Reuses all existing tokens from `preview-theme.css`:
- Glass panels, glow effects, ai-shimmer-border
- Semantic colors (primary, success, warning, destructive)
- btn-press, btn-glow, card-elevated
- focus-visible:ring-2 on ALL interactive elements

---

*Linked: [[2026-03-04-avaliacoes-design|Evaluations Design]]* | *Plan: [[2026-03-04-pacientes-plan]]* (TBD)
