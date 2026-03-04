# Dashboard Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build Design OS prototypes for the Dashboard section with 3 tabs (Principal, Casos, Insights), premium visual polish matching the wizard.

**Architecture:** Standalone React components in `design-src/sections/dashboard/` that import mock data from `design/sections/dashboard/data.json` and types from `types.ts`. Each tab is a separate component composed in `DashboardPreview.tsx`. All styling via Tailwind v4 utilities + custom CSS classes from `preview-theme.css`.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4, lucide-react icons, Design OS preview system

---

### Task 1: Data Layer — types, mock data, spec

**Files:**
- Create: `apps/web/design/sections/dashboard/types.ts`
- Create: `apps/web/design/sections/dashboard/data.json`
- Create: `apps/web/design/sections/dashboard/spec.md`

**Step 1: Create types.ts**

```typescript
export interface DashboardMetrics {
  totalCases: number
  totalPatients: number
  pendingSessions: number
  weeklySessions: number
  completionRate: number
  pendingTeeth: number
}

export interface DashboardSession {
  session_id: string
  patient_name: string | null
  created_at: string
  teeth: string[]
  evaluationCount: number
  completedCount: number
  treatmentTypes: string[]
  patientAge: number | null
  hasDSD: boolean
}

export interface ClinicalInsights {
  treatmentDistribution: Array<{ label: string; value: number; color: string }>
  topResin: string | null
  topResins: Array<{ name: string; count: number }>
  inventoryRate: number
  totalEvaluated: number
  avgCompletionHours: number | null
}

export interface WeeklyTrendPoint {
  label: string
  value: number
}

export interface DraftInfo {
  patientName: string
  teethCount: number
  savedAt: string
}

export type DashboardTab = 'principal' | 'casos' | 'insights'
export type CasosFilter = 'todos' | 'progresso' | 'concluidos'
export type InsightsPeriod = '8sem' | '12sem' | '26sem'
```

**Step 2: Create data.json** with realistic mock data for all 3 tabs.

**Step 3: Create spec.md** following wizard spec pattern.

**Step 4: Commit**

```bash
git add apps/web/design/sections/dashboard/
git commit -m "feat(design): dashboard data layer — types, mock data, spec"
```

---

### Task 2: CSS — dashboard-specific styles

**Files:**
- Modify: `apps/web/design-src/preview-theme.css`

Add CSS classes needed by Dashboard that don't exist yet:

- `.dashboard-layout` — full page flex with tab content
- `.kpi-card` — glass card for metrics with hover glow
- `.cta-hero` — large glass card with gradient background
- `.progress-ring-sm` — smaller version of progress ring for KPI inline use
- `.session-card` — card with left border color accent
- `.chart-container` — wrapper for chart areas with consistent padding

**Step 1: Add CSS to preview-theme.css** (after wizard sections).

**Step 2: Commit**

```bash
git add apps/web/design-src/preview-theme.css
git commit -m "style: add dashboard CSS — kpi cards, cta hero, session cards"
```

---

### Task 3: PrincipalTab Component

**Files:**
- Create: `apps/web/design-src/sections/dashboard/PrincipalTab.tsx`

**Content:**
1. CTA Hero — glass card with Sparkles icon, "Iniciar Novo Caso" title, subtitle, primary button with btn-glow, "2 creditos" badge
2. KPI Banner — 4 metrics in horizontal glass card (Total Casos, Pacientes, Sessoes Semana, Taxa Conclusao with progress ring)
3. Acoes Rapidas — 3 compact cards grid (Pacientes, Inventario, Configuracoes)
4. Alertas — credit warning banner (conditional), draft pending card with shimmer border (conditional)

**Props:** All optional with defaults from data.json for standalone preview.

**Step 1: Create component.**

**Step 2: Commit**

```bash
git add apps/web/design-src/sections/dashboard/PrincipalTab.tsx
git commit -m "feat(design): PrincipalTab — CTA hero, KPI banner, quick actions, alerts"
```

---

### Task 4: CasosTab Component

**Files:**
- Create: `apps/web/design-src/sections/dashboard/CasosTab.tsx`

**Content:**
1. Header — "Seus Casos" with total count
2. Filter toggle — pill buttons: Todos | Em Progresso | Concluidos
3. Draft card (conditional) — shimmer border, patient name, teeth count, saved time, Continue/Discard buttons
4. Session list — glass-panel cards with border-l-4 (green=done, cyan=progress), patient name, age, date, treatment chips, progress bar, DSD badge
5. Empty state — icon + title + description + CTA button

**Props:** All optional with defaults for standalone preview. Internal state for filter.

**Step 1: Create component.**

**Step 2: Commit**

```bash
git add apps/web/design-src/sections/dashboard/CasosTab.tsx
git commit -m "feat(design): CasosTab — session list, filters, draft card, empty state"
```

---

### Task 5: InsightsTab Component

**Files:**
- Create: `apps/web/design-src/sections/dashboard/InsightsTab.tsx`

**Content:**
1. Period filter — pill toggle (8/12/26 sem)
2. Weekly trends — glass card with SVG area chart (simple polyline + fill)
3. Treatment distribution — glass card with SVG donut chart using `--color-treatment-*` tokens + legend
4. Top resins — glass card with horizontal bar chart (SVG rects) + #1 badge
5. Clinical summary — glass card with 2x2 grid (top resin, inventory rate progress, total evaluated, avg completion)
6. Patient growth — compact card with large number + growth badge

**Charts:** Simple SVG inline (no chart library needed for prototypes — keep it lightweight).

**Props:** All optional with defaults for standalone preview.

**Step 1: Create component.**

**Step 2: Commit**

```bash
git add apps/web/design-src/sections/dashboard/InsightsTab.tsx
git commit -m "feat(design): InsightsTab — charts, clinical summary, patient growth"
```

---

### Task 6: DashboardPreview — main wrapper

**Files:**
- Create: `apps/web/design-src/sections/dashboard/DashboardPreview.tsx`
- Create: `apps/web/design-src/sections/dashboard/index.ts`

**Content:**
1. DashboardPreview — main wrapper with:
   - Header: greeting (time-based icon + "Bom dia, Dr. [Name]") + credits badge
   - 3-tab bar using `wizard-tabs` CSS
   - Tab content: renders PrincipalTab, CasosTab, or InsightsTab
   - Background: `section-glow-bg` with glow orbs
   - Internal state for active tab
2. index.ts — barrel exports for all components

**Step 1: Create DashboardPreview.**

**Step 2: Create index.ts barrel exports.**

**Step 3: Commit**

```bash
git add apps/web/design-src/sections/dashboard/
git commit -m "feat(design): DashboardPreview — tabbed layout with greeting header"
```

---

### Task 7: Final commit — all dashboard prototype files

**Step 1: Verify all files exist and compile.**

Run: `ls -la apps/web/design/sections/dashboard/ apps/web/design-src/sections/dashboard/`

**Step 2: Final commit if any uncommitted changes remain.**

```bash
git add apps/web/design/sections/dashboard/ apps/web/design-src/sections/dashboard/
git commit -m "feat(design): dashboard prototype complete — 3 tabs, premium polish"
```
