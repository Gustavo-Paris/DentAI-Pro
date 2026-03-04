---
composite: ProfileSection
---

# Profile Specification

## Overview
Profile/Settings section with 4 tabs: Personal Info, Subscription, Invoices, Privacy. Covers user management, billing, and data privacy controls.

## Views

### Tab: Perfil
1. **Avatar Section** — User photo + clinic logo with upload overlays.
2. **Form Fields** — Name, CRO, clinic name, phone inputs.
3. **Save Button** — Primary CTA with loading state.
4. **Referral Card** — Gradient card with referral code, stats, share buttons.

### Tab: Assinatura
1. **Plan Card** — Current plan name, price, status badge, next billing date.
2. **Credits Card** — Progress bar showing usage, breakdown grid.
3. **Credit Packs** — 3-column grid of purchasable credit packs with popular badge.

### Tab: Faturas
1. **Payment History** — List of payment rows with amount, description, date, status badge, PDF link.
2. **Export Button** — CSV export.
3. **Empty State** — When no payments exist.

### Tab: Privacidade
1. **LGPD Rights Card** — Info card with rights list.
2. **Export Data** — Download button for data export.
3. **Delete Account** — Destructive card with confirmation.

## UI Requirements
- Glass containers (`.glass-panel`) for all cards
- Ambient background: `section-glow-bg` with glow orbs
- Tab bar with active indicator
- Status badges with semantic colors
- Progress bar for credit usage
- All interactive: `focus-visible:ring-2`, `transition-colors`, `hover:shadow-md`

## Configuration
- shell: false
