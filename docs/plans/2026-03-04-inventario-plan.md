# Inventario Design OS Prototype — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create 1 Design OS prototype for the Inventory section (resin stock management) with premium visual polish matching existing prototypes.

**Architecture:** Self-contained TSX component in `design-src/sections/inventory/` with mock data in `design/sections/inventory/data.json`. Component imports `preview-theme.css` for token access and renders independently in the Design OS iframe. No external dependencies beyond React, lucide-react, and the CSS file.

**Tech Stack:** React 18 + TypeScript, Tailwind CSS (via preview-theme.css tokens), lucide-react for icons.

---

## Task 1: Data Layer — Types, Mock Data, Spec

**Files:**
- Create: `apps/web/design/sections/inventory/types.ts`
- Create: `apps/web/design/sections/inventory/data.json`
- Create: `apps/web/design/sections/inventory/spec.md`

**Step 1: Create types.ts**

```typescript
// apps/web/design/sections/inventory/types.ts

/** Resin type classification */
export type ResinType = 'Esmalte' | 'Dentina' | 'Body' | 'Opaco' | 'Translúcido' | 'Universal'

/** Sort option for inventory list */
export type InventorySortOption = 'brand-asc' | 'shade-asc' | 'by-type'

/** A resin in the inventory */
export interface InventoryResinItem {
  id: string
  shade: string
  brand: string
  product_line: string
  type: ResinType
  opacity: string | null
  /** Hex color or CSS gradient for shade swatch */
  shadeColor: string
}
```

**Step 2: Create data.json**

```json
{
  "_meta": {
    "models": {
      "InventoryResinItem": "A resin shade in the inventory with brand, type, and VITA shade color."
    }
  },
  "sampleResins": [
    {
      "id": "inv-001",
      "shade": "A2",
      "brand": "3M",
      "product_line": "Filtek Z350 XT",
      "type": "Esmalte",
      "opacity": null,
      "shadeColor": "#EBDAC8"
    },
    {
      "id": "inv-002",
      "shade": "A3",
      "brand": "3M",
      "product_line": "Filtek Z350 XT",
      "type": "Dentina",
      "opacity": null,
      "shadeColor": "#E0CEBD"
    },
    {
      "id": "inv-003",
      "shade": "Trans20",
      "brand": "Tokuyama",
      "product_line": "Estelite Omega",
      "type": "Translúcido",
      "opacity": "Alta",
      "shadeColor": "linear-gradient(135deg, #E8F4FC 0%, #D0E8F7 100%)"
    },
    {
      "id": "inv-004",
      "shade": "OA2",
      "brand": "Tokuyama",
      "product_line": "Estelite Omega",
      "type": "Opaco",
      "opacity": "Baixa",
      "shadeColor": "#EBE0D4"
    },
    {
      "id": "inv-005",
      "shade": "B1",
      "brand": "Ivoclar",
      "product_line": "IPS Empress Direct",
      "type": "Esmalte",
      "opacity": null,
      "shadeColor": "#F7EBD9"
    },
    {
      "id": "inv-006",
      "shade": "DA2",
      "brand": "FGM",
      "product_line": "Vittra APS",
      "type": "Dentina",
      "opacity": null,
      "shadeColor": "#E8D2C0"
    },
    {
      "id": "inv-007",
      "shade": "WE",
      "brand": "Tokuyama",
      "product_line": "Estelite Omega",
      "type": "Universal",
      "opacity": null,
      "shadeColor": "#FAFAFA"
    },
    {
      "id": "inv-008",
      "shade": "A2",
      "brand": "3M",
      "product_line": "Filtek Z350 XT",
      "type": "Body",
      "opacity": null,
      "shadeColor": "#EBDAC8"
    },
    {
      "id": "inv-009",
      "shade": "BL1",
      "brand": "Ivoclar",
      "product_line": "IPS Empress Direct",
      "type": "Esmalte",
      "opacity": null,
      "shadeColor": "#FFFFFF"
    },
    {
      "id": "inv-010",
      "shade": "MW",
      "brand": "Tokuyama",
      "product_line": "Estelite Omega",
      "type": "Universal",
      "opacity": null,
      "shadeColor": "#F8F8F6"
    }
  ],
  "brands": ["3M", "Tokuyama", "Ivoclar", "FGM"],
  "types": ["Esmalte", "Dentina", "Body", "Opaco", "Translúcido", "Universal"]
}
```

**Step 3: Create spec.md**

```markdown
---
composite: InventorySection
---

# Inventory Specification

## Overview
Inventory section with 1 view: Resin Stock List. Covers browsing, filtering, and managing resin inventory with VITA shade-colored cards.

## Views

### Inventory List
1. **Header** — "Estoque de Resinas" title + "Adicionar Resina" CTA + CSV import/export buttons.
2. **Type Legend** — Color-coded type badge strip using layer tokens.
3. **Search + Filters** — Search input + Brand dropdown + Type dropdown.
4. **Sort Pills** — Marca A-Z | Cor A-Z | Por Tipo.
5. **Resin Cards** — Grid of glass cards with shade swatch, type badge, brand info.
6. **Empty State** — Premium: icon circle + title + description + CTA.
7. **Tip Banner** — Info banner when inventory is sparse.

## UI Requirements
- Glass containers (`.glass-panel`) for all cards
- Ambient background: `section-glow-bg` with glow orbs
- VITA shade swatches with hex colors and CSS gradients
- Type badges using `--layer-*-rgb` tokens
- All interactive: `focus-visible:ring-2`, `transition-colors`, `hover:shadow-md`
- `prefers-reduced-motion` fully supported

## Configuration
- shell: false
```

**Step 4: Commit**

```bash
git add apps/web/design/sections/inventory/
git commit -m "feat(design): inventory data layer — types, mock data, spec"
```

---

## Task 2: Inventory List View (`InventoryPreview`)

**Files:**
- Create: `apps/web/design-src/sections/inventory/InventoryPreview.tsx`

**Step 1: Create InventoryPreview.tsx**

This component renders:
- Glow orbs background (`section-glow-bg`)
- Root wrapper: `section-glow-bg relative min-h-screen p-6 sm:p-8 space-y-6`
- Header with title + CTA button + CSV buttons
- Type legend strip
- Search input + brand/type filter dropdowns
- Sort pills with state
- Resin cards grid (responsive 2-5 columns)
- Tip banner for sparse inventory
- Empty state when search/filters match nothing

Key patterns:
- Import `../../preview-theme.css`
- Import types from `../../../design/sections/inventory/types`
- Import mock data from `../../../design/sections/inventory/data.json`
- `glass-panel rounded-xl` for all cards
- `focus-visible:ring-2 focus-visible:ring-ring` on ALL interactive elements
- `btn-press btn-glow` on primary buttons
- `transition-colors` on all buttons

Glow orbs (same as all previews):
```tsx
<div className="pointer-events-none absolute inset-0 overflow-hidden">
  <div className="glow-orb glow-orb-1" />
  <div className="glow-orb glow-orb-2" />
  <div className="glow-orb glow-orb-3" />
</div>
```

Type legend strip:
```
glass-panel rounded-xl p-3 flex flex-wrap items-center gap-2
  "Tipos:" label (text-sm font-medium text-muted-foreground)
  Each type: rounded-full px-3 py-1 text-xs font-medium
    - Esmalte: bg with --layer-esmalte-rgb/15, text with --layer-esmalte-rgb
    - Dentina: bg with --layer-dentina-rgb/15, text with --layer-dentina-rgb
    - Body: bg-muted text-muted-foreground
    - Opaco: bg with --layer-opaco-rgb/15, text with --layer-opaco-rgb
    - Translucido: bg with --layer-translucido-rgb/15, text with --layer-translucido-rgb
    - Universal: bg with --layer-default-rgb/15, text with --layer-default-rgb
```

Use inline style for layer-token colors (same pattern as ProtocolPreview):
```typescript
function getTypeStyle(type: string): React.CSSProperties {
  const tokenMap: Record<string, string> = {
    'Esmalte': '--layer-esmalte-rgb',
    'Dentina': '--layer-dentina-rgb',
    'Opaco': '--layer-opaco-rgb',
    'Translúcido': '--layer-translucido-rgb',
    'Universal': '--layer-default-rgb',
  }
  const token = tokenMap[type]
  if (!token) return {} // Body — use Tailwind classes
  return {
    backgroundColor: `rgb(var(${token}) / 0.15)`,
    color: `rgb(var(${token}))`,
  }
}
```

Sort pills:
```typescript
const SORT_OPTIONS: { key: InventorySortOption; label: string }[] = [
  { key: 'brand-asc', label: 'Marca A-Z' },
  { key: 'shade-asc', label: 'Cor A-Z' },
  { key: 'by-type', label: 'Por Tipo' },
]
```

Render as `glass-panel rounded-xl px-3 py-2 inline-flex gap-1` with active pill `bg-primary text-primary-foreground rounded-full`.

Search + Filters row:
```
flex flex-col sm:flex-row gap-3
  [Search: glass-panel rounded-xl flex-1 flex items-center gap-2 px-3 py-2
    Search icon (h-4 w-4 text-muted-foreground)
    input (bg-transparent border-none outline-none flex-1 text-sm text-foreground placeholder:text-muted-foreground)
  ]
  [Brand filter: glass-panel rounded-xl px-3 py-2
    select (bg-transparent border-none text-sm text-foreground) — "Todas as Marcas" + brand list
  ]
  [Type filter: glass-panel rounded-xl px-3 py-2
    select (bg-transparent border-none text-sm text-foreground) — "Todos os Tipos" + type list
  ]
```

Resin card grid:
```
grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4

Each card:
  glass-panel rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group
    [Shade swatch: h-16 w-full]
      - If solid hex: style={{ backgroundColor: shadeColor }}
      - If gradient: style={{ background: shadeColor }}
      - Centered shade label: text-sm font-semibold (contrast color)
    [Info: p-3 space-y-2]
      [Top: flex items-center justify-between]
        shade name (text-sm font-semibold text-foreground)
        type badge (text-xs rounded-full px-2 py-0.5 font-medium) — styled with getTypeStyle()
      [Brand: text-xs text-muted-foreground]
        brand · product_line
      [Remove: flex justify-end opacity-0 group-hover:opacity-100 transition-opacity]
        Trash2 icon button (h-3.5 w-3.5 text-destructive hover:text-destructive/80)
```

Shade swatch contrast text color:
```typescript
function getContrastColor(color: string): string {
  if (color.includes('linear-gradient')) return '#374151'
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#374151' : '#FAFAFA'
}
```

Tip banner (shown when filteredResins.length > 0 && filteredResins.length <= 10):
```
glass-panel rounded-xl p-4 flex items-start gap-3 border-l-4 border-primary
  Lightbulb icon (h-5 w-5 text-primary shrink-0 mt-0.5)
  div
    "Dica" (text-sm font-semibold text-foreground)
    "Importe seu estoque completo..." (text-xs text-muted-foreground)
```

CSV buttons in header:
```
flex gap-2
  [Import: glass-panel rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5 hover:bg-muted transition-colors]
    Upload icon + "Importar CSV"
  [Export: glass-panel rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5 hover:bg-muted transition-colors]
    Download icon + "Exportar CSV"
```

Empty state:
```
flex flex-col items-center py-12 space-y-4
  div p-4 rounded-full bg-muted > Package icon (h-8 w-8 text-muted-foreground)
  "Nenhuma resina encontrada" (font-medium text-foreground)
  "Ajuste os filtros..." (text-sm text-muted-foreground text-center max-w-sm)
  CTA button btn-press (Plus icon + "Adicionar Resina")
```

Header structure:
```
flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4
  div
    h1 "Estoque de Resinas" (text-2xl font-bold text-heading)
    p "Gerencie suas resinas compostas" (text-sm text-muted-foreground)
  flex items-center gap-2
    [CSV Import btn]
    [CSV Export btn]
    [Adicionar Resina: bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium btn-press btn-glow flex items-center gap-2]
      Plus icon + "Adicionar Resina"
```

Search filters by shade, brand, product_line. Brand filter by exact match. Type filter by exact match.

Sort logic:
- `brand-asc`: sort by brand, then shade
- `shade-asc`: sort by shade alphabetically
- `by-type`: group by type

**Step 2: Commit**

```bash
git add apps/web/design-src/sections/inventory/InventoryPreview.tsx
git commit -m "feat(design): inventory preview"
```

---

## Task 3: Barrel Exports + Final Commit

**Files:**
- Create: `apps/web/design-src/sections/inventory/index.ts`

**Step 1: Create index.ts**

```typescript
export { default as InventoryPreview } from './InventoryPreview'
```

**Step 2: Commit**

```bash
git add apps/web/design-src/sections/inventory/index.ts
git commit -m "feat(design): inventory barrel exports"
```

---

## Summary

| Task | Files | What |
|------|-------|------|
| 1 | types.ts, data.json, spec.md | Data layer |
| 2 | InventoryPreview.tsx | Inventory list with search, filters, sort, shade cards, legend, tip banner |
| 3 | index.ts | Barrel exports |

Total: 5 new files, 3 commits.
