# Inventario Design OS Prototype — Design Document

**Data**: 2026-03-04
**Status**: Approved

## Overview

Single-view Design OS prototype for the Inventory (Estoque de Resinas) section. Covers browsing resin inventory with search, filters, sort, and VITA shade-colored cards.

## Approach: Polish & Elevate

Same pattern as all previous prototypes:
- Glass panels, glow orbs, ai-shimmer-border
- Self-contained TSX with mock data
- `preview-theme.css` for tokens

## Single View: Inventory List

1. **Header** — "Estoque de Resinas" title + "Adicionar Resina" CTA + CSV import/export buttons
2. **Type Legend** — Color-coded type badges strip (Esmalte, Dentina, Body, Opaco, Translucido, Universal)
3. **Search + Filters** — Search input + Brand dropdown + Type dropdown
4. **Sort Pills** — Marca A-Z | Cor A-Z | Por Tipo
5. **Resin Cards Grid** — 2-5 column responsive grid with shade color swatch, shade name, type badge, brand, product line
6. **Empty State** — Premium empty state with icon + description + CTA
7. **Tip Banner** — When inventory is sparse (<=10 items): tip encouraging CSV import

## Resin Card Design

Each card is a glass-panel with:
- **Shade swatch** — Top: colored rectangle using VITA shade hex colors
- **Shade label** — Below swatch: shade name (e.g., "A2")
- **Type badge** — Color-coded with `--layer-*-rgb` tokens (Esmalte=green, Dentina=amber, etc.)
- **Brand + product** — Text below: brand name, product line
- **Remove button** — Trash icon, hover state

## Mock Data

8 sample resins covering different types (Esmalte, Dentina, Body, Opaco, Translucido, Universal) from brands like 3M Z350 XT, Tokuyama Estelite, Ivoclar Empress Direct, FGM Vittra APS.
