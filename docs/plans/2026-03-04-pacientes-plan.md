# Pacientes Design OS Prototype — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create 2 Design OS prototypes for the Patients section (Patient List + Patient Profile) with premium visual polish matching existing prototypes.

**Architecture:** Self-contained TSX components in `design-src/sections/patients/` with mock data in `design/sections/patients/data.json`. Each component imports `preview-theme.css` for token access and renders independently in the Design OS iframe. No external dependencies beyond React, lucide-react, and the CSS file.

**Tech Stack:** React 18 + TypeScript, Tailwind CSS (via preview-theme.css tokens), lucide-react for icons.

---

## Task 1: Data Layer — Types, Mock Data, Spec

**Files:**
- Create: `apps/web/design/sections/patients/types.ts`
- Create: `apps/web/design/sections/patients/data.json`
- Create: `apps/web/design/sections/patients/spec.md`

**Step 1: Create types.ts**

```typescript
// apps/web/design/sections/patients/types.ts

/** Patient in the list view */
export interface PatientListItem {
  id: string
  name: string
  phone: string | null
  email: string | null
  caseCount: number
  lastVisit: string | null
}

/** Sort option for patient list */
export type PatientSortOption = 'recent' | 'name-asc' | 'name-desc' | 'cases'

/** Patient profile data */
export interface PatientProfile {
  id: string
  name: string
  phone: string | null
  email: string | null
  notes: string | null
}

/** Patient metrics */
export interface PatientMetrics {
  totalSessions: number
  totalCases: number
  completedCases: number
  firstVisit: string
}

/** Patient session in profile view */
export interface PatientSessionItem {
  session_id: string
  created_at: string
  teeth: string[]
  evaluationCount: number
  completedCount: number
}
```

**Step 2: Create data.json**

```json
{
  "_meta": {
    "models": {
      "PatientListItem": "A patient in the list view with contact info and case stats.",
      "PatientProfile": "Full patient profile data for the detail view.",
      "PatientSessionItem": "A session card in the patient profile."
    }
  },
  "samplePatients": [
    {
      "id": "pat-001",
      "name": "Maria Clara Oliveira",
      "phone": "(11) 98765-4321",
      "email": "maria.clara@email.com",
      "caseCount": 3,
      "lastVisit": "2026-03-03T14:30:00Z"
    },
    {
      "id": "pat-002",
      "name": "Joao Pedro Santos",
      "phone": "(21) 91234-5678",
      "email": null,
      "caseCount": 2,
      "lastVisit": "2026-03-02T09:15:00Z"
    },
    {
      "id": "pat-003",
      "name": "Ana Beatriz Lima",
      "phone": null,
      "email": "ana.beatriz@email.com",
      "caseCount": 5,
      "lastVisit": "2026-03-01T16:45:00Z"
    },
    {
      "id": "pat-004",
      "name": "Carlos Eduardo Ferreira",
      "phone": "(31) 99876-5432",
      "email": "carlos.ferreira@email.com",
      "caseCount": 0,
      "lastVisit": null
    },
    {
      "id": "pat-005",
      "name": "Larissa Mendes",
      "phone": "(41) 98765-1234",
      "email": "larissa.m@email.com",
      "caseCount": 1,
      "lastVisit": "2026-02-26T08:30:00Z"
    }
  ],
  "sampleProfile": {
    "id": "pat-001",
    "name": "Maria Clara Oliveira",
    "phone": "(11) 98765-4321",
    "email": "maria.clara@email.com",
    "notes": "Paciente com historico de sensibilidade dentaria. Preferencia por tratamentos esteticos."
  },
  "sampleMetrics": {
    "totalSessions": 3,
    "totalCases": 8,
    "completedCases": 6,
    "firstVisit": "2025-11-15T10:00:00Z"
  },
  "sampleSessions": [
    {
      "session_id": "sess-001",
      "created_at": "2026-03-03T14:30:00Z",
      "teeth": ["11", "21", "12"],
      "evaluationCount": 3,
      "completedCount": 3
    },
    {
      "session_id": "sess-002",
      "created_at": "2026-01-15T09:00:00Z",
      "teeth": ["14", "15"],
      "evaluationCount": 2,
      "completedCount": 2
    },
    {
      "session_id": "sess-003",
      "created_at": "2025-11-15T10:00:00Z",
      "teeth": ["46", "47", "36"],
      "evaluationCount": 3,
      "completedCount": 1
    }
  ]
}
```

**Step 3: Create spec.md**

```markdown
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
```

**Step 4: Commit**

```bash
git add apps/web/design/sections/patients/
git commit -m "feat(design): patients data layer — types, mock data, spec"
```

---

## Task 2: Patient List View (`PatientListPreview`)

**Files:**
- Create: `apps/web/design-src/sections/patients/PatientListPreview.tsx`

**Step 1: Create PatientListPreview.tsx**

This component renders:
- Glow orbs background (`section-glow-bg`)
- Header with title + CTA button
- Search input (glass-panel)
- Sort pills with state
- Patient cards with initials avatar, contact info, case count, last visit
- Empty state when search matches nothing
- Pagination footer

Key patterns:
- Import `../../preview-theme.css`
- Import types from `../../../design/sections/patients/types`
- Import mock data from `../../../design/sections/patients/data.json`
- `glass-panel rounded-xl` for all cards
- `focus-visible:ring-2 focus-visible:ring-ring` on ALL interactive elements
- `btn-press btn-glow` on primary buttons
- `transition-colors` on all buttons

Initials helper:
```typescript
function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}
```

Sort pills:
```typescript
const SORT_OPTIONS: { key: PatientSortOption; label: string }[] = [
  { key: 'recent', label: 'Recentes' },
  { key: 'name-asc', label: 'Nome A-Z' },
  { key: 'name-desc', label: 'Nome Z-A' },
  { key: 'cases', label: 'Mais Casos' },
]
```

Render as `glass-panel rounded-xl px-3 py-2 inline-flex gap-1` with active pill `bg-primary text-primary-foreground rounded-full`.

Patient card structure:
```
glass-panel rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer
  flex gap-4
    [Avatar: w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm]
    [Content: flex-1
      Top row: flex items-center justify-between
        name (font-semibold text-foreground)
        case count badge (bg-muted rounded-full text-xs px-2 py-0.5 text-muted-foreground) — "3 avaliacoes"
      Contact row: flex gap-4 mt-1 text-xs text-muted-foreground
        Phone icon + phone (if exists)
        Mail icon + email (if exists)
      Last visit: flex items-center gap-1 mt-1.5 text-xs text-muted-foreground
        Calendar icon + formatted date (or "Sem visitas" if null)
    ]
```

Search: `glass-panel rounded-xl` container with Search icon, filters by name/phone/email.

Empty state:
```
flex flex-col items-center py-12 space-y-4
  div p-4 rounded-full bg-muted > Users icon
  title + description
  CTA button btn-glow
```

Pagination: same pattern as Evaluations — page numbers + chevrons.

**Step 2: Commit**

```bash
git add apps/web/design-src/sections/patients/PatientListPreview.tsx
git commit -m "feat(design): patients list preview"
```

---

## Task 3: Patient Profile View (`PatientProfilePreview`)

**Files:**
- Create: `apps/web/design-src/sections/patients/PatientProfilePreview.tsx`

**Step 1: Create PatientProfilePreview.tsx**

This component renders:
- Glow orbs background
- Breadcrumb: Pacientes > Maria Clara Oliveira
- Header card with large avatar, name, actions
- Contact info section
- Metrics KPI grid
- Session history cards
- Empty session state

Breadcrumb:
```
nav flex items-center gap-1
  "Pacientes" (text-sm text-primary font-medium)
  ChevronRight icon
  patient name (text-sm text-muted-foreground)
```

Header card:
```
glass-panel rounded-xl overflow-hidden
  bg-gradient-to-br from-primary/5 to-transparent p-5
  flex flex-col sm:flex-row gap-4
    [Avatar: w-16 h-16 rounded-full bg-primary/10 text-primary text-xl font-semibold flex items-center justify-center shrink-0]
    [Info: flex-1
      name (text-xl font-semibold text-heading)
      "Perfil do Paciente" (text-sm text-muted-foreground)
    ]
    [Actions: flex gap-2 self-start
      "Nova Avaliacao" (bg-primary text-primary-foreground btn-press btn-glow + Sparkles icon)
      "Editar" (border border-border hover:bg-muted + Pencil icon)
      "Excluir" (text-destructive hover:bg-destructive/10 + Trash2 icon)
    ]
```

Contact info:
```
glass-panel rounded-xl p-4
  flex flex-wrap gap-4 text-sm
  Phone icon + phone value (text-muted-foreground)
  Mail icon + email value
  Separator + FileText icon + notes (full width, whitespace-pre-wrap)
```

Metrics KPIs:
```
grid grid-cols-2 lg:grid-cols-4 gap-4
  Each metric card:
    glass-panel rounded-xl p-4 text-center
    value (text-2xl font-semibold) — completedCases uses text-primary
    label (text-xs text-muted-foreground)

  Cards:
    [totalSessions, "Avaliacoes"]
    [totalCases, "Casos"]
    [completedCases, "Concluidos"] — text-primary highlight
    [firstVisit formatted, "Primeira Visita"]
```

Session history:
```
space-y-3
  Section header: "Historico de Sessoes" (text-sm font-semibold text-muted-foreground uppercase tracking-wider)

  Each session:
    glass-panel rounded-xl p-4 border-l-4 hover:shadow-md transition-shadow cursor-pointer
    borderLeftColor: green (--color-success) if completed, primary if in progress

    Top row: flex items-center justify-between
      date (text-sm font-medium) + status badge
        completed: bg-success/10 text-success rounded-full text-xs + CheckCircle icon
        in-progress: bg-muted text-muted-foreground rounded-full text-xs + Clock icon

    Middle: tooth badges (flex flex-wrap gap-1.5)
      Each: text-xs rounded-full px-2 py-0.5 border border-border

    Bottom: progress bar
      h-2 rounded-full bg-primary/20 + inner bar
      + count (text-xs text-muted-foreground)
```

Empty session state:
```
glass-panel rounded-xl p-8 text-center
  Calendar icon (h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50)
  title (font-medium)
  description (text-sm text-muted-foreground)
  CTA button (btn-press)
```

**Step 2: Commit**

```bash
git add apps/web/design-src/sections/patients/PatientProfilePreview.tsx
git commit -m "feat(design): patients profile preview"
```

---

## Task 4: Barrel Exports + Final Commit

**Files:**
- Create: `apps/web/design-src/sections/patients/index.ts`

**Step 1: Create index.ts**

```typescript
export { default as PatientListPreview } from './PatientListPreview'
export { default as PatientProfilePreview } from './PatientProfilePreview'
```

**Step 2: Commit**

```bash
git add apps/web/design-src/sections/patients/index.ts
git commit -m "feat(design): patients barrel exports"
```

---

## Summary

| Task | Files | What |
|------|-------|------|
| 1 | types.ts, data.json, spec.md | Data layer |
| 2 | PatientListPreview.tsx | Patient list with search, sort, cards, pagination |
| 3 | PatientProfilePreview.tsx | Profile with avatar, contact, metrics, sessions |
| 4 | index.ts | Barrel exports |

Total: 6 new files, 4 commits.
