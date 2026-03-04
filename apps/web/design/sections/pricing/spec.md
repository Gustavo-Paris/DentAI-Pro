---
composite: PricingSection
---

# Pricing Specification

## Overview
Standalone pricing page with billing cycle toggle, plan cards, and feature comparison table.

## Views

### Pricing Page
1. **Header** — "Planos e Precos" title + subtitle.
2. **Billing Toggle** — Monthly / Annual switch with discount badge.
3. **Plan Cards** — 4-col grid with name, price, credits, features, CTA button.
4. **Feature Comparison** — Full table comparing all plans across all features.
5. **Footer Note** — Credit explanation and guarantee text.

## UI Requirements
- Glass containers for all cards
- Ambient background: `section-glow-bg` with glow orbs
- `ai-shimmer-border` on popular plan card
- Billing toggle with active state
- Feature comparison with check/dash icons
- All interactive: `focus-visible:ring-2`, `transition-colors`

## Configuration
- shell: false
