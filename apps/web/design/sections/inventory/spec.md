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
