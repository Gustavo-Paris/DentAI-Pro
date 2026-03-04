---
title: Avaliações Design OS Prototype
created: 2026-03-04
status: approved
tags: [type/design, design-os, evaluations]
---

# Avaliações — Design OS Prototype

> **Status**: Approved (2026-03-04)

**Goal**: Prototype 3 views of the Evaluations section in Design OS with premium polish + structural reorganization (Protocol tabs).

**Approach**: Polish & Elevate + Reorganize. Same cyberpunk/glass visual style as Wizard and Dashboard prototypes.

---

## Architecture

3 independent prototypes, each renderable in Design OS iframe:

| Component | File | Mock Data |
|---|---|---|
| `SessionListPreview` | `design-src/sections/evaluations/SessionListPreview.tsx` | `sampleSessions` |
| `SessionDetailPreview` | `design-src/sections/evaluations/SessionDetailPreview.tsx` | `sampleEvaluations` + `sampleSessionHeader` |
| `ProtocolPreview` | `design-src/sections/evaluations/ProtocolPreview.tsx` | `sampleProtocol` |

Shared: `design/sections/evaluations/types.ts`, `data.json`, `spec.md`, barrel `index.ts`.

---

## View 1: Session List (`SessionListPreview`)

### Layout
- Background: glow-orbs (same as Dashboard)
- Header: "Avaliações" title + "+ Novo Caso" button
- Search bar + Status filter pills + Treatment type filter pills
- Session cards stacked vertically
- Pagination at bottom

### Session Card Design
- `glass-panel rounded-xl` with `border-l-4`
  - Green (`var(--color-success)`) = completed
  - Primary = in progress
- Most recent card: `ai-shimmer-border` + "Novo" badge
- Treatment type chips: colored with `var(--color-treatment-*)` tokens and `color-mix()` backgrounds
- Progress bar: `h-2 rounded-full`, green if 100%, primary otherwise
- Patient name + teeth badges + date + status badge

### Filters
- **Pills** (not Select dropdowns) for visual consistency with Dashboard
- Status: Todos | Em Progresso | Concluídos
- Treatment: Todos | Resina | Porcelana | Endodontia | etc.

### Empty State
Premium: icon in circle bg + title + description + CTA button with btn-glow

---

## View 2: Session Detail (`SessionDetailPreview`)

### Layout
- Breadcrumbs: Avaliações > {Patient Name}
- SessionHeader card (glass-panel)
- Action buttons row
- Grouped evaluation cards
- TipBanner (optional)
- Floating selection bar (when cards selected)

### SessionHeader Card
- `glass-panel` with gradient `from-primary/5`
- Photo placeholder (rounded-lg bg-muted with Image icon)
- Patient name, date, teeth count
- Tooth number badges (outline)
- Progress bar with count

### Evaluation Groups
- Group header: treatment type label + tooth count + "Ver Protocolo" button
- Background: `bg-muted/30 rounded-lg`
- Treatment icon + label + resin name (if applicable)

### Tooth Cards
- `glass-panel rounded-xl` with `border-l-4` using treatment color
- Content: tooth number, treatment type, resin name (if resina), status badge
- Completed: green left border + check badge
- Pending: primary left border + progress badge (X/Y)
- Checkbox for selection
- `hover:shadow-md transition-shadow`

### Action Buttons
- Row of outline buttons: Compartilhar, WhatsApp, Concluir Todos, Excluir
- All with appropriate icons

### Floating Selection Bar
- `glass-panel` fixed bottom center
- Selection count + "Concluir" button + dismiss X
- `animate-in slide-in-from-bottom`

### TipBanner
- Tip for adding more teeth
- `border-primary/20 bg-primary/5 rounded-xl`
- Lightbulb icon + text + action button

---

## View 3: Protocol (`ProtocolPreview`)

### Structure (top to bottom)
1. **Treatment Header** (always visible)
2. **Resin Recommendation** (always visible)
3. **Tabbed Content** (4 tabs)
4. **Case Summary** (collapsible, below tabs)
5. **Disclaimer**
6. **Footer Actions**

### Treatment Header
- `glass-panel rounded-xl`
- Treatment icon + type label + tooth number + region
- Date + Direct/Indirect badge

### Resin Recommendation Card
- `ai-shimmer-border` wrapping glass-panel
- CheckCircle icon + resin name + manufacturer
- 2x2 grid of properties: Opacity, Resistance, Polishing, Aesthetics
  - Each in `bg-secondary/30 rounded-xl p-3`
- AI justification text below separator
- "No Estoque" badge if applicable

### 4 Tabs

| Tab | Content |
|-----|---------|
| **Protocolo** | Layer cards (numbered), alternative simplified, alerts/warnings |
| **Acabamento** | Finishing & polishing steps as cards |
| **Checklist** | Interactive checklist with progress indicator |
| **DSD** | Before/after with layer toggles (only if DSD available) |

### Tab: Protocolo
- **Layer cards**: glass-panel, numbered (1, 2, 3...), layer name as title
  - Properties as key-value pairs: Resin, Shade, Opacity, Thickness, Technique
- **Alternative**: card with Sparkles icon, more subtle bg
- **Alerts**: cards with `border-warning/20 bg-warning/5`, AlertTriangle icon

### Tab: Acabamento
- Step cards with numbered sequence
- Each step: title + description
- Glass-panel cards

### Tab: Checklist
- Progress indicator at top (X/Y completed)
- Vertical list of checkbox items
- Checkboxes with text labels

### Tab: DSD
- Before/after image comparison
- Layer toggle buttons (Gengival, Whitening, etc.)
- Placeholder images in prototype

### Case Summary
- Collapsible section below tabs
- 2-column grid of clinical data: age, tooth, region, cavity class, color, bruxism, etc.

### Disclaimer
- Warning card at bottom: `border-warning/20 bg-warning/5`
- AlertTriangle icon + disclaimer text

### Footer Actions
- 3 buttons: Recalcular (outline), Baixar PDF (outline), Novo Caso (primary with btn-glow)

---

## Mock Data Scope

Focus on the **richest case** (resina with stratification):
- 3-4 stratification layers with full shade/technique data
- Simplified alternative
- 2 alerts, 1 warning
- Finishing protocol with 4 steps
- 5-item checklist
- DSD analysis with 3 layers

Cementation protocol (porcelana) and special treatments excluded from prototype (YAGNI).

---

## Design Tokens

Reuses all existing tokens from `preview-theme.css`:
- Glass panels, glow effects, ai-shimmer-border
- Treatment color vars (`--color-treatment-*`)
- Semantic colors (primary, success, warning, destructive)
- btn-press, btn-glow, card-elevated
- focus-visible:ring-2 focus-visible:ring-ring on ALL interactive elements

---

## Changes vs Production

| Area | Production | Prototype |
|------|-----------|-----------|
| List filters | `<Select>` dropdowns | Pills (consistency with Dashboard) |
| List cards | Card component | glass-panel + glow effects |
| Treatment chips | Badge variant | Colored with treatment CSS vars |
| Detail: desktop | Table view | Cards only (unified mobile/desktop) |
| Detail: grouping | Simple bg-muted/40 | Glass-panel with treatment icon |
| Detail: selection bar | bg-background | glass-panel |
| Protocol structure | Long vertical scroll | 4 tabs (Protocolo, Acabamento, Checklist, DSD) |
| Protocol resin card | Simple Card | ai-shimmer-border + properties grid |

---

*Linked: [[2026-03-03-dashboard-redesign-design|Dashboard Design]]* | *Plan: [[2026-03-04-avaliacoes-plan]]* (TBD)
