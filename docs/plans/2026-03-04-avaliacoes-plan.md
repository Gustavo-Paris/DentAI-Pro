# Avaliações Design OS Prototype — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create 3 Design OS prototypes for the Evaluations section (Session List, Session Detail, Protocol with Tabs) with premium visual polish matching the existing Wizard and Dashboard prototypes.

**Architecture:** Self-contained TSX components in `design-src/sections/evaluations/` with mock data in `design/sections/evaluations/data.json`. Each component imports `preview-theme.css` for token access and renders independently in the Design OS iframe. No external dependencies beyond React, lucide-react, and the CSS file.

**Tech Stack:** React 18 + TypeScript, Tailwind CSS (via preview-theme.css tokens), inline SVG for any charts, lucide-react for icons.

---

## Task 1: Data Layer — Types, Mock Data, Spec

**Files:**
- Create: `apps/web/design/sections/evaluations/types.ts`
- Create: `apps/web/design/sections/evaluations/data.json`
- Create: `apps/web/design/sections/evaluations/spec.md`

**Step 1: Create types.ts**

```typescript
// apps/web/design/sections/evaluations/types.ts

/** Session in the list view */
export interface EvalSession {
  session_id: string
  patient_name: string
  created_at: string
  teeth: string[]
  evaluationCount: number
  completedCount: number
  treatmentTypes: string[]
  patientAge: number
  hasDSD: boolean
}

/** Filter for session list */
export type SessionStatusFilter = 'todos' | 'progresso' | 'concluidos'

/** Treatment type filter */
export type TreatmentFilter = 'todos' | 'resina' | 'porcelana' | 'endodontia' | 'gengivoplastia' | 'coroa' | 'implante' | 'encaminhamento'

/** Individual evaluation in detail view */
export interface EvalItem {
  id: string
  tooth: string
  treatment_type: string
  status: 'completed' | 'planned' | 'error'
  resinName: string | null
  resinManufacturer: string | null
  checklistCurrent: number
  checklistTotal: number
}

/** Session header info */
export interface SessionHeader {
  patient_name: string
  created_at: string
  teeth: string[]
  completedCount: number
  evaluationCount: number
  hasDSD: boolean
  treatmentTypes: string[]
}

/** Evaluation group (teeth with same treatment) */
export interface EvalGroup {
  treatmentType: string
  label: string
  evaluations: EvalItem[]
  resinName?: string
}

/** Protocol layer for stratification */
export interface ProtoLayer {
  order: number
  name: string
  resin_brand: string
  shade: string
  thickness: string
  purpose: string
  technique: string
  optional?: boolean
}

/** Alternative simplified protocol */
export interface ProtoAlternative {
  resin: string
  shade: string
  technique: string
  tradeoff: string
}

/** Finishing step */
export interface FinishingStep {
  order: number
  tool: string
  speed: string
  time: string
  tip: string
}

/** Resin recommendation */
export interface ResinRecommendation {
  name: string
  manufacturer: string
  type: string
  opacity: string
  resistance: string
  polishing: string
  aesthetics: string
  justification: string
  isFromInventory: boolean
}

/** DSD layer for toggling */
export interface DSDLayer {
  type: string
  label: string
  active: boolean
}

/** Case summary clinical data */
export interface CaseSummary {
  patientAge: number
  tooth: string
  region: string
  cavityClass: string
  restorationSize: string
  toothColor: string
  aestheticLevel: string
  bruxism: boolean
  budget: string
}

/** Full protocol data for the Protocol view */
export interface ProtocolData {
  treatmentType: string
  treatmentLabel: string
  tooth: string
  region: string
  createdAt: string
  resin: ResinRecommendation
  layers: ProtoLayer[]
  alternative: ProtoAlternative
  finishing: {
    contouring: FinishingStep[]
    polishing: FinishingStep[]
    finalGlaze: string
    maintenanceAdvice: string
  }
  checklist: string[]
  alerts: string[]
  warnings: string[]
  confidence: 'alta' | 'média' | 'baixa'
  dsdLayers: DSDLayer[]
  caseSummary: CaseSummary
}

/** Tab identifiers for protocol view */
export type ProtocolTab = 'protocolo' | 'acabamento' | 'checklist' | 'dsd'
```

**Step 2: Create data.json**

```json
{
  "_meta": {
    "models": {
      "EvalSession": "A session in the evaluation list with patient info and progress.",
      "EvalItem": "Individual tooth evaluation with treatment type and status.",
      "ProtocolData": "Full protocol data for the Protocol view."
    }
  },
  "sampleSessions": [
    {
      "session_id": "sess-001",
      "patient_name": "Maria Clara Oliveira",
      "created_at": "2026-03-03T14:30:00Z",
      "teeth": ["11", "21", "12"],
      "evaluationCount": 3,
      "completedCount": 3,
      "treatmentTypes": ["resina"],
      "patientAge": 33,
      "hasDSD": true
    },
    {
      "session_id": "sess-002",
      "patient_name": "João Pedro Santos",
      "created_at": "2026-03-02T09:15:00Z",
      "teeth": ["14", "15", "24", "25"],
      "evaluationCount": 4,
      "completedCount": 2,
      "treatmentTypes": ["resina", "gengivoplastia"],
      "patientAge": 45,
      "hasDSD": false
    },
    {
      "session_id": "sess-003",
      "patient_name": "Ana Beatriz Lima",
      "created_at": "2026-03-01T16:45:00Z",
      "teeth": ["11", "21", "22", "12", "13"],
      "evaluationCount": 5,
      "completedCount": 5,
      "treatmentTypes": ["resina", "porcelana"],
      "patientAge": 28,
      "hasDSD": true
    },
    {
      "session_id": "sess-004",
      "patient_name": "Carlos Eduardo Ferreira",
      "created_at": "2026-02-28T11:00:00Z",
      "teeth": ["46", "47"],
      "evaluationCount": 2,
      "completedCount": 2,
      "treatmentTypes": ["endodontia", "coroa"],
      "patientAge": 52,
      "hasDSD": false
    },
    {
      "session_id": "sess-005",
      "patient_name": "Larissa Mendes",
      "created_at": "2026-02-26T08:30:00Z",
      "teeth": ["11", "21"],
      "evaluationCount": 2,
      "completedCount": 1,
      "treatmentTypes": ["resina"],
      "patientAge": 19,
      "hasDSD": true
    }
  ],
  "sampleSessionHeader": {
    "patient_name": "Maria Clara Oliveira",
    "created_at": "2026-03-03T14:30:00Z",
    "teeth": ["11", "21", "12"],
    "completedCount": 2,
    "evaluationCount": 3,
    "hasDSD": true,
    "treatmentTypes": ["resina", "gengivoplastia"]
  },
  "sampleEvaluations": [
    {
      "id": "eval-001",
      "tooth": "11",
      "treatment_type": "resina",
      "status": "completed",
      "resinName": "Z350 XT",
      "resinManufacturer": "3M",
      "checklistCurrent": 5,
      "checklistTotal": 5
    },
    {
      "id": "eval-002",
      "tooth": "21",
      "treatment_type": "resina",
      "status": "completed",
      "resinName": "Z350 XT",
      "resinManufacturer": "3M",
      "checklistCurrent": 5,
      "checklistTotal": 5
    },
    {
      "id": "eval-003",
      "tooth": "12",
      "treatment_type": "resina",
      "status": "planned",
      "resinName": "Z350 XT",
      "resinManufacturer": "3M",
      "checklistCurrent": 2,
      "checklistTotal": 5
    },
    {
      "id": "eval-004",
      "tooth": "GENGIVO",
      "treatment_type": "gengivoplastia",
      "status": "planned",
      "resinName": null,
      "resinManufacturer": null,
      "checklistCurrent": 0,
      "checklistTotal": 3
    }
  ],
  "sampleProtocol": {
    "treatmentType": "resina",
    "treatmentLabel": "Resina Composta",
    "tooth": "11",
    "region": "Anterior",
    "createdAt": "2026-03-03T14:30:00Z",
    "resin": {
      "name": "Z350 XT",
      "manufacturer": "3M",
      "type": "Nanoparticulada",
      "opacity": "Alta",
      "resistance": "9/10",
      "polishing": "9/10",
      "aesthetics": "9/10",
      "justification": "Resina nanoparticulada com excelente propriedade optica e mecanica, ideal para restauracoes anteriores classe IV com necessidade estetica alta. Comportamento cromatico estavel e alta resistencia ao desgaste.",
      "isFromInventory": true
    },
    "layers": [
      {
        "order": 1,
        "name": "Dentina",
        "resin_brand": "Z350 XT A3D",
        "shade": "A3D",
        "thickness": "1.0mm",
        "purpose": "Reconstrucao da camada de dentina, reproduzindo opacidade e fluorescencia natural",
        "technique": "Incremental obliqua, partindo da parede lingual"
      },
      {
        "order": 2,
        "name": "Corpo",
        "resin_brand": "Z350 XT A2B",
        "shade": "A2B",
        "thickness": "0.8mm",
        "purpose": "Transicao cromatica entre dentina e esmalte, construindo volume anatomico",
        "technique": "Incremento unico moldando cristas marginais e vertente triturante"
      },
      {
        "order": 3,
        "name": "Efeitos Incisais",
        "resin_brand": "Kolor+ Branco Azulado",
        "shade": "Branco Azulado",
        "thickness": "0.2mm",
        "purpose": "Reproducao de halo opalescente e mamelos incisais",
        "technique": "Pincel fino, aplicar nas pontas dos mamelos e borda incisal",
        "optional": true
      },
      {
        "order": 4,
        "name": "Esmalte",
        "resin_brand": "Z350 XT WE",
        "shade": "WE",
        "thickness": "0.5mm",
        "purpose": "Camada final de esmalte para selamento, translucidez e anatomia de superficie",
        "technique": "Camada continua envolvendo toda face vestibular, esculpir anatomia primaria"
      }
    ],
    "alternative": {
      "resin": "Z350 XT WE",
      "shade": "WE",
      "technique": "Camada unica com escultura anatomica — sem estratificacao de dentina/corpo",
      "tradeoff": "Resultado estetico aceitavel com menor tempo clinico, indicado para casos com menor exigencia estetica ou tempo limitado"
    },
    "finishing": {
      "contouring": [
        {
          "order": 1,
          "tool": "Ponta diamantada FF (granulacao extra-fina)",
          "speed": "Alta rotacao com refrigeracao",
          "time": "30-60s por face",
          "tip": "Movimentos leves e intermitentes para evitar superaquecimento"
        },
        {
          "order": 2,
          "tool": "Discos de lixa Sof-Lex (medio → fino)",
          "speed": "Baixa rotacao",
          "time": "20-30s por disco",
          "tip": "Sequencia decrescente de granulacao, unidirecional"
        }
      ],
      "polishing": [
        {
          "order": 1,
          "tool": "Borracha abrasiva Enhance (Dentsply)",
          "speed": "Baixa rotacao com pressao leve",
          "time": "30s",
          "tip": "Movimentos circulares sem pressao excessiva"
        },
        {
          "order": 2,
          "tool": "Pasta diamantada Diamond Excel (FGM)",
          "speed": "Baixa rotacao com feltro",
          "time": "60s",
          "tip": "Aplicar com feltro ou disco de algodao, brilho final"
        }
      ],
      "finalGlaze": "Aplicar selante de superficie (ex: Biscover LV) para brilho extra e protecao",
      "maintenanceAdvice": "Polimento de manutencao a cada 6-12 meses. Evitar alimentos pigmentantes nas primeiras 48h."
    },
    "checklist": [
      "Isolamento absoluto posicionado",
      "Condicionamento acido do esmalte (37%, 30s)",
      "Aplicacao do sistema adesivo (2 camadas, fotopolimerizar)",
      "Insercao das camadas conforme protocolo de estratificacao",
      "Verificar adaptacao marginal e anatomia oclusal",
      "Acabamento e polimento seguindo protocolo",
      "Verificar oclusao e ajustar contatos prematuros"
    ],
    "alerts": [
      "Paciente com alto nivel estetico — atentar para reproducao de texturas de superficie e brilho",
      "Dente adjacente (21) restaurado — buscar harmonizacao cromatica bilateral"
    ],
    "warnings": [
      "Evitar camada de esmalte com espessura maior que 0.5mm para prevenir trincas por estresse residual"
    ],
    "confidence": "alta",
    "dsdLayers": [
      { "type": "gingival", "label": "Gengival", "active": true },
      { "type": "whitening", "label": "Clareamento", "active": false },
      { "type": "composite", "label": "Resina", "active": false }
    ],
    "caseSummary": {
      "patientAge": 33,
      "tooth": "11",
      "region": "Anterior",
      "cavityClass": "Classe IV",
      "restorationSize": "Media",
      "toothColor": "A2",
      "aestheticLevel": "Alto",
      "bruxism": false,
      "budget": "Premium"
    }
  }
}
```

**Step 3: Create spec.md**

```markdown
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
```

**Step 4: Commit**

```bash
git add apps/web/design/sections/evaluations/
git commit -m "feat(design): evaluations data layer — types, mock data, spec"
```

---

## Task 2: Session List View (`SessionListPreview`)

**Files:**
- Create: `apps/web/design-src/sections/evaluations/SessionListPreview.tsx`
- Modify: `apps/web/design-src/preview-theme.css` (add layer color tokens if missing)

**Step 1: Create SessionListPreview.tsx**

This component renders:
- Glow orbs background
- Header with title + CTA button
- Search input (visual only, no state)
- Filter pills for Status and Treatment Type (with state)
- Session cards with glass-panel, treatment chips, progress bars
- First card with `ai-shimmer-border`
- Empty state when filters match nothing
- Pagination footer

Key patterns to follow:
- Import `../../preview-theme.css`
- Import types from `../../../design/sections/evaluations/types`
- Import mock data from `../../../design/sections/evaluations/data.json`
- Use `glass-panel rounded-xl` for cards
- Use `var(--color-treatment-*)` for treatment chip colors via `color-mix()`
- Use `focus-visible:ring-2 focus-visible:ring-ring` on ALL buttons
- Use `btn-press` and `btn-glow` on primary buttons
- Use `transition-colors` on all interactive elements

Treatment color map (same as Dashboard CasosTab):
```typescript
const TREATMENT_COLOR_VARS: Record<string, string> = {
  resina: 'var(--color-primary)',
  porcelana: 'var(--color-treatment-porcelana)',
  gengivoplastia: 'var(--color-treatment-gengivoplastia)',
  endodontia: 'var(--color-treatment-endodontia)',
  coroa: 'var(--color-treatment-coroa)',
  implante: 'var(--color-treatment-implante)',
  encaminhamento: 'var(--color-treatment-encaminhamento)',
  recobrimento: 'var(--color-treatment-recobrimento)',
}

const TREATMENT_LABELS: Record<string, string> = {
  resina: 'Resina',
  porcelana: 'Porcelana',
  gengivoplastia: 'Gengivoplastia',
  endodontia: 'Endodontia',
  coroa: 'Coroa',
  implante: 'Implante',
  encaminhamento: 'Encaminhamento',
  recobrimento: 'Recobrimento',
}
```

Session card structure:
```
glass-panel rounded-xl p-4 border-l-4
  - border-left: green if completed, primary if in progress
  - First card: wrapped in ai-shimmer-border
  - Top row: patient name + "Novo" badge (first only) + treatment chips
  - Middle: tooth count + tooth badges (outline) + date
  - Bottom: progress bar h-2 + count
  - hover:shadow-md transition-shadow cursor-pointer
```

Filter pills (2 rows):
```
Row 1 - Status: glass-panel rounded-xl px-3 py-2 inline-flex
  - Todos | Em Progresso | Concluidos
Row 2 - Treatment: same pattern
  - Todos | Resina | Porcelana | Endodontia | etc.
```

Empty state:
```
flex flex-col items-center py-12 space-y-4
  - div p-4 rounded-full bg-muted > FileText icon
  - title + description
  - CTA button btn-glow
```

**Step 2: Verify rendering**

Open Design OS, navigate to evaluations/SessionListPreview. Verify:
- Glass panels render correctly
- Treatment chips show correct colors
- First card has shimmer border
- Filters toggle state
- Progress bars show correctly
- Empty state shows when all filtered out

**Step 3: Commit**

```bash
git add apps/web/design-src/sections/evaluations/SessionListPreview.tsx
git commit -m "feat(design): evaluations session list preview"
```

---

## Task 3: Session Detail View (`SessionDetailPreview`)

**Files:**
- Create: `apps/web/design-src/sections/evaluations/SessionDetailPreview.tsx`

**Step 1: Create SessionDetailPreview.tsx**

This component renders:
- Breadcrumb: Avaliações > Maria Clara Oliveira
- SessionHeader card (glass-panel with gradient, photo placeholder, info, progress)
- Action buttons row
- Evaluation groups with group headers
- Individual tooth cards with selection
- TipBanner for adding more teeth
- Floating selection bar (toggle via state)

SessionHeader structure:
```
glass-panel rounded-xl overflow-hidden
  bg-gradient-to-br from-primary/5
  p-5
  flex gap-6
    [Photo placeholder: rounded-lg bg-muted w-32 h-32 flex items-center justify-center > Image icon]
    [Info column:
      date + tooth count (muted-foreground text-xs)
      tooth badges (flex wrap gap-2)
      progress bar + count
    ]
```

Group header structure:
```
flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg mb-2
  Left: treatment icon + "Resina Composta — 3 dentes (11, 21, 12)"
  Right: "Ver Protocolo" ghost button
```

Tooth card structure:
```
glass-panel rounded-xl p-4 border-l-4
  border-left-color: treatment color var
  completed: var(--color-success), planned: var(--color-primary)
  Top: checkbox + treatment badge + tooth number
  Middle: resin name + manufacturer (if resina)
  Bottom: status badge (completed = check + "Concluido", planned = "2/5")
  hover:shadow-md transition-shadow cursor-pointer
```

Selection state: `useState<Set<string>>` for selected IDs. Show floating bar when size > 0.

Floating bar:
```
fixed bottom-6 left-1/2 -translate-x-1/2 z-40
glass-panel rounded-full px-4 py-2
flex items-center gap-3
  "2 selecionados" + [Concluir] btn + [X] close
  animate: slide-in-from-bottom
```

TipBanner:
```
glass-panel rounded-xl p-4 border-primary/20 bg-primary/5
flex items-center gap-3
  Lightbulb icon + text + action button
```

**Step 2: Verify rendering**

Check: header card, groups, tooth cards, selection toggles floating bar, tip banner.

**Step 3: Commit**

```bash
git add apps/web/design-src/sections/evaluations/SessionDetailPreview.tsx
git commit -m "feat(design): evaluations session detail preview"
```

---

## Task 4: Protocol View — Tabs Shell + Protocolo Tab (`ProtocolPreview`)

**Files:**
- Create: `apps/web/design-src/sections/evaluations/ProtocolPreview.tsx`
- Modify: `apps/web/design-src/preview-theme.css` (add `--layer-*-rgb` tokens)

**Step 1: Add layer color tokens to preview-theme.css**

Add these CSS custom properties to the `:root` block in `preview-theme.css`, alongside the existing treatment color vars:

```css
/* Layer stratification colors */
--layer-incisal-rgb: 20 184 166;
--layer-dentina-rgb: 245 158 11;
--layer-opaco-rgb: 249 115 22;
--layer-effect-rgb: 139 92 246;
--layer-esmalte-rgb: 16 185 129;
--layer-translucido-rgb: 96 165 250;
--layer-default-rgb: 168 85 247;
```

**Step 2: Create ProtocolPreview.tsx**

This is the largest component. It renders:

**Always visible (above tabs):**
- Treatment header card (glass-panel)
- Resin recommendation card (ai-shimmer-border)

**Tabbed content:**
- 4 tabs: Protocolo | Acabamento | Checklist | DSD
- Tab bar uses `wizard-tabs` CSS class (same pattern as Dashboard/Wizard)
- Active tab: `bg-primary text-primary-foreground rounded-full`

**Below tabs:**
- Case summary (collapsible)
- Disclaimer card
- Footer action buttons

Treatment header structure:
```
glass-panel rounded-xl p-5
  flex items-center gap-3
  [icon div: p-3 rounded-lg bg-primary/10 > Layers icon]
  [flex-1: treatment label (text-xl font-semibold), tooth + region (text-sm muted)]
  [Badge: "Direta"]
```

Resin recommendation structure:
```
ai-shimmer-border rounded-xl
  glass-panel rounded-xl p-5
    Top: CheckCircle icon (success) + resin name (text-xl font-semibold) + manufacturer
    Grid 2x2: opacity, resistance, polishing, aesthetics
      each: bg-secondary/30 rounded-xl p-3, label (text-muted-foreground text-xs) + value (font-medium)
    Separator
    Justification text (text-sm text-muted-foreground)
    "No Estoque" badge (if applicable): bg-primary/10 text-primary border-primary/20
```

**Protocolo tab content:**

Layer cards:
```
For each layer:
  glass-panel rounded-xl p-4 border-l-4
    border-left-color based on layer name (use getLayerColor helper):
      - dentina → rgb(var(--layer-dentina-rgb))
      - corpo → rgb(var(--layer-dentina-rgb))
      - efeito/corante → rgb(var(--layer-effect-rgb))
      - esmalte → rgb(var(--layer-translucido-rgb))
      - incisal → rgb(var(--layer-incisal-rgb))
    Background: color-mix(in srgb, rgb(var(--layer-X-rgb)) 8%, transparent)
    Header: order number circle + layer name + optional badge
    Content: key-value pairs in grid
      - Resina: resin_brand
      - Cor: shade
      - Espessura: thickness
      - Tecnica: technique
```

Helper function for layer colors:
```typescript
function getLayerColor(name: string): { borderColor: string; bgColor: string } {
  const n = name.toLowerCase()
  if (n.includes('dentina') || n.includes('corpo'))
    return { borderColor: 'rgb(var(--layer-dentina-rgb))', bgColor: 'color-mix(in srgb, rgb(245 158 11) 8%, transparent)' }
  if (n.includes('efeito') || n.includes('corante'))
    return { borderColor: 'rgb(var(--layer-effect-rgb))', bgColor: 'color-mix(in srgb, rgb(139 92 246) 8%, transparent)' }
  if (n.includes('esmalte'))
    return { borderColor: 'rgb(var(--layer-translucido-rgb))', bgColor: 'color-mix(in srgb, rgb(96 165 250) 8%, transparent)' }
  if (n.includes('incisal'))
    return { borderColor: 'rgb(var(--layer-incisal-rgb))', bgColor: 'color-mix(in srgb, rgb(20 184 166) 8%, transparent)' }
  return { borderColor: 'var(--color-border)', bgColor: 'transparent' }
}
```

Alternative card:
```
glass-panel rounded-xl p-4 bg-muted/30
  Sparkles icon + "Alternativa Simplificada" title
  resin + shade + technique
  tradeoff in text-sm muted-foreground italic
```

Alert/Warning cards:
```
rounded-xl p-4 border border-warning/20 bg-warning/5
  AlertTriangle icon + text
```

**Step 3: Verify rendering**

Check: treatment header, resin card with shimmer, tab switching, layer cards with colors, alternative, alerts.

**Step 4: Commit**

```bash
git add apps/web/design-src/sections/evaluations/ProtocolPreview.tsx apps/web/design-src/preview-theme.css
git commit -m "feat(design): evaluations protocol preview — tabs + stratification layers"
```

---

## Task 5: Protocol Tabs — Acabamento, Checklist, DSD

**Files:**
- Modify: `apps/web/design-src/sections/evaluations/ProtocolPreview.tsx`

**Step 1: Implement Acabamento tab**

Two sections: Contouring + Polishing, each with numbered step cards.

Step card:
```
glass-panel rounded-xl p-4
  flex gap-3
  [Number circle: w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center]
  [Content:
    tool (font-medium)
    speed + time (text-xs muted-foreground)
    tip (text-sm muted-foreground italic)
  ]
```

Final glaze + maintenance advice as info cards at bottom.

**Step 2: Implement Checklist tab**

Progress indicator at top:
```
glass-panel rounded-xl p-4 mb-4
  flex items-center gap-3
  progress bar (h-2 rounded-full) + "X/Y completos"
```

Checklist items with interactive checkboxes:
```
useState with checkedItems: Set<number>

Each item:
  flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer
  [Checkbox div: w-5 h-5 rounded border-2
    unchecked: border-border
    checked: bg-primary border-primary + CheckCircle icon
  ]
  [Text: text-sm, if checked: line-through text-muted-foreground]
```

**Step 3: Implement DSD tab**

Simple layout for prototype:
```
glass-panel rounded-xl p-5
  "Simulacao DSD" heading
  [Image placeholder: rounded-xl bg-muted h-64 flex items-center justify-center > Image icon + "Antes / Depois"]
  Layer toggle buttons:
    flex gap-2 mt-4
    Each layer: button with toggle state
      active: bg-primary text-primary-foreground
      inactive: text-muted-foreground hover:text-foreground
      rounded-full px-3 py-1 text-xs
```

**Step 4: Add Case Summary (below tabs)**

Collapsible section using `useState<boolean>`:
```
glass-panel rounded-xl overflow-hidden
  button onClick toggle:
    flex items-center justify-between p-4
    "Resumo Clinico" + ChevronDown icon (rotate when open)
  {isOpen &&
    div p-4 pt-0
    grid grid-cols-2 gap-3
      Each: label (text-xs muted-foreground) + value (text-sm font-medium)
  }
```

**Step 5: Add Disclaimer + Footer Actions**

Disclaimer:
```
rounded-xl p-4 border border-warning/20 bg-warning/5 mt-4
  flex items-start gap-3
  AlertTriangle icon + text
```

Footer actions:
```
flex items-center justify-end gap-3 mt-6
  [Recalcular] outline button
  [Baixar PDF] outline button + Download icon
  [Novo Caso] primary button + btn-glow + Sparkles icon
```

**Step 6: Verify all tabs**

Switch between all 4 tabs. Verify:
- Acabamento shows numbered steps
- Checklist toggles work, progress updates
- DSD shows placeholder with layer toggles
- Case summary collapses/expands
- Disclaimer and footer render correctly

**Step 7: Commit**

```bash
git add apps/web/design-src/sections/evaluations/ProtocolPreview.tsx
git commit -m "feat(design): evaluations protocol — acabamento, checklist, DSD tabs"
```

---

## Task 6: Barrel Exports + Final Integration

**Files:**
- Create: `apps/web/design-src/sections/evaluations/index.ts`

**Step 1: Create index.ts**

```typescript
export { default as SessionListPreview } from './SessionListPreview'
export { default as SessionDetailPreview } from './SessionDetailPreview'
export { default as ProtocolPreview } from './ProtocolPreview'
```

**Step 2: Final review**

Open Design OS and verify all 3 prototypes render correctly:
1. `SessionListPreview` — filters work, cards show, shimmer on first
2. `SessionDetailPreview` — groups render, selection works, floating bar appears
3. `ProtocolPreview` — all 4 tabs work, layer colors correct, checklist interactive

**Step 3: Commit**

```bash
git add apps/web/design-src/sections/evaluations/index.ts
git commit -m "feat(design): evaluations barrel exports"
```

---

## Summary

| Task | Files | What |
|------|-------|------|
| 1 | types.ts, data.json, spec.md | Data layer |
| 2 | SessionListPreview.tsx | Session list with filters, cards, pagination |
| 3 | SessionDetailPreview.tsx | Detail view with groups, selection, floating bar |
| 4 | ProtocolPreview.tsx, preview-theme.css | Protocol tabs shell + Protocolo tab |
| 5 | ProtocolPreview.tsx | Acabamento, Checklist, DSD tabs + summary + disclaimer |
| 6 | index.ts | Barrel exports + final review |

Total: 7 new files, 1 modified file (preview-theme.css), 6 commits.
