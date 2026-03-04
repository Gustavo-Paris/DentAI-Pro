# Profile/Settings Design OS Prototype — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create 1 Design OS prototype for the Profile/Settings section with 4 tabs showing personal info, subscription, invoices, and privacy controls.

**Architecture:** Self-contained TSX component in `design-src/sections/profile/` with mock data in `design/sections/profile/data.json`. Component imports `preview-theme.css` for token access and renders independently in the Design OS iframe.

**Tech Stack:** React 18 + TypeScript, Tailwind CSS (via preview-theme.css tokens), lucide-react for icons.

---

## Task 1: Data Layer — Types, Mock Data, Spec

**Files:**
- Create: `apps/web/design/sections/profile/types.ts`
- Create: `apps/web/design/sections/profile/data.json`
- Create: `apps/web/design/sections/profile/spec.md`

**Step 1: Create types.ts**

```typescript
/** Profile tab ID */
export type ProfileTabId = 'perfil' | 'assinatura' | 'faturas' | 'privacidade'

/** User profile data */
export interface UserProfile {
  full_name: string
  cro: string | null
  clinic_name: string | null
  phone: string | null
  avatar_url: string | null
  clinic_logo_url: string | null
}

/** Subscription info */
export interface SubscriptionInfo {
  plan_name: string
  price: number
  status: 'active' | 'trialing' | 'canceled' | 'inactive'
  next_billing_date: string | null
  credits_used: number
  credits_total: number
  rollover_credits: number
}

/** Credit pack option */
export interface CreditPack {
  id: string
  credits: number
  price: number
  popular: boolean
}

/** Payment record */
export interface PaymentRecord {
  id: string
  amount: number
  description: string
  status: 'succeeded' | 'failed' | 'pending' | 'refunded'
  created_at: string
  invoice_url: string | null
}

/** Referral info */
export interface ReferralInfo {
  code: string
  total_referrals: number
  credits_earned: number
}
```

**Step 2: Create data.json**

```json
{
  "_meta": {
    "models": {
      "UserProfile": "User's personal and professional info.",
      "SubscriptionInfo": "Current subscription plan and credit usage.",
      "CreditPack": "A purchasable credit pack.",
      "PaymentRecord": "A payment/invoice record.",
      "ReferralInfo": "Referral program stats."
    }
  },
  "sampleProfile": {
    "full_name": "Dr. Maria Clara Oliveira",
    "cro": "SP-12345",
    "clinic_name": "Clinica Sorriso Perfeito",
    "phone": "(11) 98765-4321",
    "avatar_url": null,
    "clinic_logo_url": null
  },
  "sampleSubscription": {
    "plan_name": "Profissional",
    "price": 149.90,
    "status": "active",
    "next_billing_date": "2026-04-03T00:00:00Z",
    "credits_used": 18,
    "credits_total": 30,
    "rollover_credits": 5
  },
  "sampleCreditPacks": [
    { "id": "pack-10", "credits": 10, "price": 49.90, "popular": false },
    { "id": "pack-25", "credits": 25, "price": 99.90, "popular": true },
    { "id": "pack-50", "credits": 50, "price": 179.90, "popular": false }
  ],
  "samplePayments": [
    { "id": "pay-001", "amount": 14990, "description": "Plano Profissional - Março 2026", "status": "succeeded", "created_at": "2026-03-03T10:00:00Z", "invoice_url": "#" },
    { "id": "pay-002", "amount": 9990, "description": "Pacote 25 creditos", "status": "succeeded", "created_at": "2026-02-15T14:30:00Z", "invoice_url": "#" },
    { "id": "pay-003", "amount": 14990, "description": "Plano Profissional - Fevereiro 2026", "status": "succeeded", "created_at": "2026-02-03T10:00:00Z", "invoice_url": "#" },
    { "id": "pay-004", "amount": 4990, "description": "Pacote 10 creditos", "status": "failed", "created_at": "2026-01-20T09:00:00Z", "invoice_url": null }
  ],
  "sampleReferral": {
    "code": "MARIA-2026",
    "total_referrals": 3,
    "credits_earned": 15
  }
}
```

**Step 3: Create spec.md**

```markdown
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
```

**Step 4: Commit**

```bash
git add apps/web/design/sections/profile/
git commit -m "feat(design): profile data layer — types, mock data, spec"
```

---

## Task 2: Profile Preview Component (`ProfilePreview`)

**Files:**
- Create: `apps/web/design-src/sections/profile/ProfilePreview.tsx`

Single component with 4 switchable tabs rendered as glass-panel tab bar + content panels.

Key patterns from existing previews:
- Root: `section-glow-bg relative min-h-screen p-6 sm:p-8 space-y-6` with glow orbs
- Import `../../preview-theme.css`
- Tab bar: glass-panel with tab buttons, active tab highlighted
- All 4 tab panels rendered conditionally

### Tab Bar
```
glass-panel rounded-xl p-1 flex gap-1
  Each tab button:
    rounded-lg px-4 py-2 text-sm font-medium transition-colors
    Active: bg-primary text-primary-foreground
    Inactive: text-muted-foreground hover:text-foreground
```

### Perfil Tab Content
- Avatar section: two side-by-side circles
  - User avatar: w-20 h-20 rounded-full bg-primary/10 with initials + camera icon overlay
  - Clinic logo: w-20 h-20 rounded-full border-2 border-dashed border-border with ImageIcon
- Form: glass-panel rounded-xl p-6 space-y-4
  - 4 input fields: Nome Completo, CRO, Nome da Clinica, Telefone
  - Each: label (text-sm font-medium text-foreground) + input (glass-panel rounded-lg px-3 py-2 text-sm)
  - Save button: bg-primary text-primary-foreground btn-press btn-glow
- Referral card: glass-panel rounded-xl overflow-hidden
  - Header: bg-gradient-to-br from-primary/10 to-transparent p-4
  - Code: font-mono bg-muted rounded-lg px-3 py-2
  - Stats: 2-col grid (referrals count + credits earned)
  - Share: WhatsApp + Copy buttons

### Assinatura Tab Content
- 2-col grid:
  - Plan card: glass-panel rounded-xl p-5
    - Plan name + price + status badge (bg-success/10 text-success for active)
    - Next billing date
    - Manage button (outline)
  - Credits card: glass-panel rounded-xl p-5
    - Progress bar: h-3 rounded-full bg-primary/20 + inner bg-primary
    - Usage text: "18 de 30 creditos usados"
    - Rollover badge if > 0
- Credit packs: grid grid-cols-3 gap-4
  - Each: glass-panel rounded-xl p-4 text-center hover:shadow-md
  - Popular: ai-shimmer-border
  - Credits count + price + Buy button

### Faturas Tab Content
- Glass-panel header with "Exportar CSV" button
- Payment list: space-y-3
  - Each row: glass-panel rounded-xl p-4 flex justify-between
  - Amount (font-semibold) + description + date + status badge + PDF link icon
  - Status colors: succeeded=success, failed=destructive, pending=muted, refunded=primary

### Privacidade Tab Content
- LGPD card: glass-panel rounded-xl p-5
  - ShieldCheck icon + title + rights list (bullet points)
- Export card: glass-panel rounded-xl p-5
  - Download icon + title + description + export button (outline)
- Delete card: glass-panel rounded-xl p-5 border border-destructive/30
  - AlertTriangle icon (text-destructive) + title + description + delete button (bg-destructive)

**Step 2: Commit**

```bash
git add apps/web/design-src/sections/profile/ProfilePreview.tsx
git commit -m "feat(design): profile preview"
```

---

## Task 3: Barrel Exports + Final Commit

**Files:**
- Create: `apps/web/design-src/sections/profile/index.ts`

```typescript
export { default as ProfilePreview } from './ProfilePreview'
```

```bash
git add apps/web/design-src/sections/profile/index.ts
git commit -m "feat(design): profile barrel exports"
```

---

## Summary

| Task | Files | What |
|------|-------|------|
| 1 | types.ts, data.json, spec.md | Data layer |
| 2 | ProfilePreview.tsx | 4-tab profile with personal info, subscription, invoices, privacy |
| 3 | index.ts | Barrel exports |

Total: 5 new files, 3 commits.
