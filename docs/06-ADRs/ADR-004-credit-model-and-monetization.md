---
title: "ADR-004: Credit Model & Monetization"
adr_id: ADR-004
created: 2026-02-10
updated: 2026-02-10
status: accepted
deciders: Team AURIA
tags:
  - type/adr
  - status/accepted
  - domain/backend
  - domain/billing
related:
  - "[[ADR-006-ai-integration-strategy]]"
  - "[[docs/00-Index/Home]]"
---

# ADR-004: Credit Model & Monetization

## Status

**Accepted** (2026-02-10)

## Context

AURIA offers AI-powered dental clinical decision support. Each AI operation (photo analysis, DSD simulation, resin recommendation, cementation protocol) has a real cost in API calls to Google Gemini. The platform needs a monetization model that:

1. **Reflects actual cost** -- different operations consume different amounts of AI compute (e.g., DSD simulation with image generation is heavier than text-only resin recommendation).
2. **Prevents abuse** -- free or unpaid users should not be able to consume unlimited AI resources.
3. **Supports tiered plans** -- from free/starter to professional/elite tiers.
4. **Handles failures gracefully** -- if the AI call fails after credits are deducted, the user must not lose credits.
5. **Integrates with Stripe** -- the industry-standard payment processor for SaaS subscriptions.

Before credits, the system used a per-feature counter (cases per month, DSD simulations per month) that was inflexible and could not account for new operation types without schema changes.

## Decision

Adopt a **credit-based monetization model** with the following structure:

### Credit Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  subscription_plans  →  credits_per_month per tier          │
├─────────────────────────────────────────────────────────────┤
│  credit_costs        →  per-operation cost (e.g., 1 or 2)  │
├─────────────────────────────────────────────────────────────┤
│  subscriptions       →  credits_used_this_month, rollover   │
├─────────────────────────────────────────────────────────────┤
│  credit_transactions →  idempotent consume/refund log       │
├─────────────────────────────────────────────────────────────┤
│  credit_packs        →  one-time purchasable credit bundles │
└─────────────────────────────────────────────────────────────┘
```

### Per-Operation Costs (from `credit_costs` table)

| Operation | Credits | Edge Function |
|-----------|---------|---------------|
| `case_analysis` | 1 | `analyze-dental-photo` |
| `dsd_simulation` | 2 | `generate-dsd` |

### Atomic Credit Deduction

Credits are consumed server-side in edge functions via the shared module `supabase/functions/_shared/credits.ts`. The `checkAndUseCredits()` function calls the `use_credits` Postgres RPC, which uses `SELECT FOR UPDATE` row locking to prevent race conditions:

```typescript
const creditResult = await checkAndUseCredits(
  supabaseService, userId, "case_analysis", reqId
);
if (!creditResult.allowed) {
  return createInsufficientCreditsResponse(creditResult, corsHeaders);
}
```

> [!warning] Fail-Closed Design
> On any error from the credit system, the request is **denied** (`allowed: false`). This prevents users from getting free usage when the credit system is temporarily unavailable.

### Idempotent Operations

Each credit operation accepts an optional `operationId` (typically the request ID). Before consuming, it checks `credit_transactions` for an existing consume record with the same `operationId`, preventing double-charge on retries.

### Credit Refund on AI Failure

If the AI call fails *after* credits are consumed, the edge function calls `refundCredits()`:

```typescript
if (creditsConsumed && supabaseForRefund && userIdForRefund) {
  await refundCredits(supabaseForRefund, userIdForRefund, "case_analysis", reqId);
}
```

Refunds are also idempotent -- a refund for a given `operationId` can only be issued once.

### Credit Pool Calculation

Total available credits combine three sources:

```
creditsTotal = plan.credits_per_month + subscription.credits_rollover + subscription.credits_bonus
creditsRemaining = max(0, creditsTotal - credits_used_this_month)
```

- **Rollover**: Unused credits carry over (if plan allows, up to `rollover_max`).
- **Bonus**: One-time credits from purchased credit packs or promotions.

### Stripe Integration

| Edge Function | Purpose |
|---------------|---------|
| `create-checkout-session` | Creates Stripe Checkout for subscriptions and credit packs |
| `create-portal-session` | Opens Stripe Customer Portal for plan management |
| `stripe-webhook` | Handles Stripe events (subscription changes, payments) |
| `sync-subscription` | Syncs subscription state from Stripe to Supabase |
| `sync-credit-purchase` | Syncs one-time credit pack purchases |

### Frontend Integration

The `useSubscription` hook (`apps/web/src/hooks/useSubscription.ts`) provides:
- `creditsRemaining`, `creditsTotal`, `creditsPercentUsed` -- for UI display
- `canUseCredits(operation)` -- pre-check before starting a workflow
- `getCreditCost(operation)` -- display cost to user before confirmation
- `checkout()`, `purchasePack()`, `openPortal()` -- Stripe actions
- `estimatedDaysRemaining` -- based on rolling 30-day usage average

The data layer (`apps/web/src/data/subscriptions.ts`, `apps/web/src/data/credit-usage.ts`) provides typed queries for plans, subscriptions, credit costs, credit packs, and usage history.

### Credit Confirmation Flow

Before consuming credits, the wizard presents a confirmation dialog showing:
- Operation name and cost
- Current credits remaining
- Whether the user can afford the full workflow (analysis + DSD)

This is managed by `confirmCreditUse()` in `useWizardFlow`, which returns a Promise that resolves when the user confirms or cancels.

## Alternatives Considered

### 1. Flat Per-Feature Limits

- **Pros:** Simple to understand (e.g., "10 cases/month")
- **Cons:** Cannot differentiate operations by cost, requires schema changes for new features, no flexibility for users who use one feature heavily
- **Rejected because:** Inflexible. Adding a new AI operation (e.g., cementation protocol) would require a new column in the subscription table.

### 2. Pay-Per-Call (No Subscription)

- **Pros:** Users only pay for what they use
- **Cons:** Unpredictable costs for users, no recurring revenue, higher friction per operation
- **Rejected because:** Dental professionals prefer predictable monthly costs. Credits within a subscription provide the best of both models.

### 3. Unlimited Plans Only

- **Pros:** Simplest UX, no credit tracking needed
- **Cons:** Unsustainable at scale with real AI API costs, no way to offer affordable entry tiers
- **Rejected because:** Gemini API costs are non-trivial per call. Unlimited access at low price points would be unprofitable.

## Consequences

### Positive

- **Granular cost control** -- Each operation type has its own credit cost, adjustable via the `credit_costs` table without code changes.
- **Fair pricing** -- Heavier operations (DSD with image generation) cost more credits than lighter ones.
- **Failure safety** -- Automatic refund on AI errors ensures users never lose credits for failed operations.
- **Extensible** -- New AI operations can be added by inserting a row in `credit_costs`.
- **Flexible purchasing** -- Users can buy credit packs for burst usage beyond their plan.

### Negative

- **Complexity** -- Credit tracking adds server-side logic to every AI edge function.
- **UX overhead** -- Users must understand credits, see confirmation dialogs, and manage their balance.
- **Refund edge cases** -- Partial failures (e.g., analysis succeeds but simulation fails) require careful tracking of which operations were charged.

### Risks

- **Race conditions** -- Mitigated by `SELECT FOR UPDATE` row locking in the `use_credits` RPC.
- **Double-charge on retry** -- Mitigated by idempotent `operationId` tracking.
- **Stripe webhook reliability** -- Mitigated by `sync-subscription` manual sync endpoint.

## Implementation

Key files:

- `supabase/functions/_shared/credits.ts` -- Shared credit check/consume/refund logic
- `apps/web/src/data/subscriptions.ts` -- Frontend data layer for plans and subscriptions
- `apps/web/src/data/credit-usage.ts` -- Frontend data layer for usage history
- `apps/web/src/hooks/useSubscription.ts` -- Domain hook for credit state and Stripe actions
- `supabase/functions/create-checkout-session/` -- Stripe Checkout edge function
- `supabase/functions/stripe-webhook/` -- Stripe event handler

## Links

- [[ADR-006-ai-integration-strategy]] -- AI functions that consume credits
- [[ADR-Index]] -- ADR Index

---
*Created: 2026-02-10 | Last updated: 2026-02-10*
