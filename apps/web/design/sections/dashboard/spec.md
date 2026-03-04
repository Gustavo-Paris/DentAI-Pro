---
composite: DashboardPage
---

# Dashboard Specification

## Overview
Main landing page for clinicians showing practice overview, recent cases, and clinical analytics. Three-tab layout: Principal (action-oriented), Casos (session list), Insights (charts and analytics). Premium visual polish with glass panels, glow effects, and treatment color tokens.

## User Flows

### Principal Tab (default)
1. **CTA Hero** — Large glass card prompting "Iniciar Novo Caso" with credit cost badge.
2. **KPI Banner** — 4 horizontal metrics (Total Cases, Patients, Weekly Sessions, Completion Rate with progress ring).
3. **Quick Actions** — 3 card grid (Patients, Inventory, Settings).
4. **Alerts** — Credit warning banner and/or pending draft card with shimmer border.

### Casos Tab
1. **Filter** — Pill toggle: Todos | Em Progresso | Concluidos.
2. **Draft Card** — Highlighted at top with shimmer border if draft exists.
3. **Session List** — Glass cards with left border color by status, treatment chips, progress bars, DSD badges.
4. **Empty State** — Icon + title + description + CTA.

### Insights Tab
1. **Period Filter** — Pill toggle: 8 sem | 12 sem | 26 sem.
2. **Weekly Trends** — Area chart showing evaluations/week.
3. **Treatment Distribution** — Donut chart with treatment color tokens + legend.
4. **Top Resins** — Horizontal bar chart (top 5) with #1 highlight badge.
5. **Clinical Summary** — 2x2 grid card (top resin, inventory rate, total evaluated, avg completion time).
6. **Patient Growth** — Compact card with month count + growth % badge.

## UI Requirements
- Glass containers (`.glass-panel`) for all cards
- Ambient background: `section-glow-bg` with glow orbs
- Tab navigation: `wizard-tabs` CSS pattern
- Treatment colors: `--color-treatment-*` tokens
- All interactive elements: `focus-visible:ring-2`, `transition-colors`, `hover:shadow-md`
- Charts: inline SVG (no external library)
- `prefers-reduced-motion` fully supported

## Configuration
- shell: false
