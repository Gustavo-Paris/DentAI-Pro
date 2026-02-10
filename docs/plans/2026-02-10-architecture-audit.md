---
title: "Architecture Audit — AURIA Platform"
created: 2026-02-10
updated: 2026-02-10
status: draft
author: Architect Agent
tags:
  - type/audit
  - area/architecture
  - status/draft
related:
  - "[[2026-02-08-comprehensive-audit-design]]"
  - "[[06-ADRs/ADR-001-3-layer-frontend-architecture]]"
  - "[[06-ADRs/ADR-002-pageshell-design-system-adoption]]"
  - "[[06-ADRs/ADR-003-centralized-prompt-management]]"
---

# Architecture Audit — AURIA Platform

## Executive Summary

This audit is a deep-dive into the architectural health of the AURIA platform, examining dependency structure, edge function design, state management, data flow, scalability, ADR coverage, and monorepo health. It builds on the previous comprehensive audit (2026-02-08) and focuses specifically on structural concerns that affect long-term maintainability and scalability.

### Sub-Area Grades

| Sub-Area | Grade | Trend vs Feb 08 | Summary |
|----------|-------|-----------------|---------|
| Dependency Architecture | B+ | Stable | Clean 3-layer mostly respected; 14 files bypass data layer |
| Edge Function Architecture | B | Stable | Good shared code; inconsistent auth patterns across 10 functions |
| State Management | B | Stable | React Query + Context is sound; useWizardFlow is an outlier (1355 lines) |
| Data Flow | A- | Improved | Data layer is well-structured; barrel exports are clean |
| Scalability | C+ | New | No connection pooling, client-side aggregation, no caching layer |
| ADR Coverage | B- | Stable | 3 strong ADRs; at least 5 architectural decisions undocumented |
| Monorepo Health | B | Stable | Workspace setup works; `@pageshell/shell` build broken; 11 design system packages for 1 consumer |

**Overall Architecture Grade: B+** (up from B+ in the previous audit; several Feb-08 issues addressed but structural debt remains)

---

## 1. Dependency Architecture Analysis

### 1.1 3-Layer Compliance

The ADR-001 mandates: `Data Client -> Domain Hooks -> Page Adapters`. Each layer should only talk to its neighbor.

**Good compliance observed:**
- All 8 data modules (`apps/web/src/data/`) import only from `./client.ts`, which re-exports from integrations. No React, no business logic.
- All 11 domain hooks (`apps/web/src/hooks/domain/`) consume the data layer via `@/data` barrel imports.
- 12 of 15 pages import domain hooks from `@/hooks/domain/` and never touch `@/data` directly.

**Violations found (14 files bypass the data layer):**

| Severity | File | Violation | Layer Bypassed |
|----------|------|-----------|----------------|
| High | `pages/Pricing.tsx:35` | `supabase.functions.invoke('sync-subscription')` | Skips data layer entirely |
| High | `pages/SharedEvaluation.tsx:80,87,98` | `supabase.storage.from(...)` direct access | Skips data layer |
| High | `pages/SharedEvaluation.tsx:3` | Imports from `@/data/evaluations` directly (not barrel) | Minor — imports specific module |
| High | `pages/Profile.tsx:17` | Imports `subscriptions` from `@/data` — acceptable but page also should use a domain hook |
| High | `hooks/domain/useWizardFlow.ts:4` | `import { supabase } from '@/integrations/supabase/client'` | Bypasses data layer for direct DB writes |
| Medium | `components/AddTeethModal.tsx:292,308` | `supabase.functions.invoke()` direct calls | No data/hook layer |
| Medium | `components/wizard/DSDStep.tsx:119-486` | 7 direct `supabase.storage` calls | No data layer for storage operations |
| Medium | `components/PhotoUploader.tsx:70-108` | Direct `supabase.storage` calls | No data layer for uploads |
| Medium | `components/PatientAutocomplete.tsx:2` | Direct supabase import | Inline queries |
| Medium | `components/GlobalSearch.tsx:4` | Direct supabase import | Inline queries |
| Low | `pages/ForgotPassword.tsx:3` | Direct supabase import (auth-only, acceptable) | Auth boundary |
| Low | `pages/ResetPassword.tsx:5` | Direct supabase import (auth-only, acceptable) | Auth boundary |
| Low | `pages/Landing.tsx:18` | Direct supabase import (public page, acceptable) | Auth boundary |

> **Key Finding**: The most significant violation is `useWizardFlow.ts`, which directly calls `supabase.from('evaluations').insert(...)`, `supabase.from('patients').insert(...)`, and `supabase.from('evaluations').update(...)`. This hook should delegate all DB writes to the data layer. The wizard's 1355-line hook is the single largest source of architectural debt.

**Recommendation**: Create `data/storage.ts` for all storage operations. Move wizard DB writes to `data/evaluations.ts` mutation functions. Refactor `AddTeethModal` to use a domain hook. **Effort: M** (2-3 days).

### 1.2 Import Graph Health

- No circular dependencies detected between data modules.
- The `data/index.ts` barrel is clean with namespace exports (`export * as evaluations`).
- `data/sample-case.ts` imports from `@/components/wizard/ReviewAnalysisStep` (types only) -- this is a **reverse dependency** (data layer depending on component types). The types should be extracted to `@/types/`.
- `hooks/useSubscription.ts` sits outside `hooks/domain/` despite being a domain hook. It is consumed by `useWizardFlow` and `useDashboard`. It should be moved to `hooks/domain/`.

**Recommendation**: Extract shared types to `@/types/wizard.ts`. Move `useSubscription` to `hooks/domain/`. **Effort: S** (half day).

---

## 2. Edge Function Architecture

### 2.1 Overview (10 Functions)

| Function | Lines | Auth Method | Rate Limit | Credits | Shared Code |
|----------|-------|-------------|------------|---------|-------------|
| `analyze-dental-photo` | 575 | `getClaims()` | AI_HEAVY | Yes (with refund) | Full |
| `generate-dsd` | 1130 | `getUser()` | AI_HEAVY | Yes (with refund) | Full |
| `recommend-resin` | 674 | `getClaims()` | AI_LIGHT | No | Full |
| `recommend-cementation` | 369 | `getUser()` | AI_LIGHT | No | Full |
| `create-checkout-session` | 231 | `getUser()` | None | No | Partial (CORS only) |
| `create-portal-session` | 98 | `getUser()` | None | No | Partial (CORS only) |
| `stripe-webhook` | 366 | Stripe signature | None | No | Logger only |
| `sync-subscription` | 130 | `getUser()` | None | No | None |
| `sync-credit-purchase` | 143 | `getUser()` | None | No | None |
| `health-check` | 38 | None | None | No | None |

### 2.2 Inconsistent Authentication (Critical)

Two different authentication patterns are used across edge functions:

**Pattern A — `auth.getClaims(token)` (newer)**
Used by: `analyze-dental-photo`, `recommend-resin`
- Creates an auth client with user's token, then calls `getClaims()` to extract `sub`
- Does NOT call `getUser()` (no DB round-trip to verify user still exists)

**Pattern B — `auth.getUser(token)` (older)**
Used by: `generate-dsd`, `recommend-cementation`, `create-checkout-session`, `create-portal-session`, `sync-subscription`, `sync-credit-purchase`
- Uses service role client to call `getUser(token)`
- Makes a DB round-trip to verify user existence

> **Impact**: `getClaims()` is faster (no DB call) but does not verify the user hasn't been deleted or disabled. A deleted user's JWT would still be accepted until token expiry. For a healthcare platform, this is a security concern.

**Recommendation**: Standardize on `getUser()` for all functions. The ~50ms overhead is negligible for AI functions that take 2-10 seconds. Create a shared `authenticateRequest()` helper in `_shared/auth.ts`. **Effort: S** (half day).

### 2.3 Shared Code Adoption

The `_shared/` directory provides excellent infrastructure:
- `cors.ts` — CORS headers, error response factory, request ID generation
- `credits.ts` — Atomic credit check/consume/refund with idempotency
- `rateLimit.ts` — Multi-window rate limiting (minute/hour/day)
- `gemini.ts` — Full Gemini API client with retry, vision, tools, image edit
- `validation.ts` — Input validation + prompt injection sanitization
- `prompts/` — Centralized prompt management with metrics
- `logger.ts` — Environment-aware logging
- `metrics-adapter.ts` — Supabase-backed metrics port

**Gap**: Stripe functions (`create-checkout-session`, `create-portal-session`, `stripe-webhook`) do NOT use the shared `logger` or `generateRequestId()` consistently. They use raw `console.error` in several places.

### 2.4 Rate Limiting Gaps

Only 4 of 10 functions implement rate limiting. Missing:
- `create-checkout-session` — could be abused to create many Stripe sessions
- `create-portal-session` — same concern
- `sync-subscription` — called from Pricing page, could be hammered
- `sync-credit-purchase` — same concern

**Recommendation**: Apply `RATE_LIMITS.STANDARD` to all non-webhook functions. **Effort: S** (half day).

### 2.5 Credit System Gaps

Only 2 of 4 AI functions consume credits:
- `analyze-dental-photo` — consumes `case_analysis` credits with refund on error
- `generate-dsd` — consumes `dsd_simulation` credits with refund on error

Missing credit enforcement:
- `recommend-resin` — No credit check. Called per-tooth during submission (could be 6+ calls per case)
- `recommend-cementation` — No credit check. Same concern.

> **Impact**: The credit system charges for analysis and DSD but not for protocol generation. This means the cost model is front-loaded on analysis while the most expensive operations (per-tooth AI calls) run free. At scale, this could be exploited by users who analyze once and generate unlimited protocols.

**Recommendation**: Either charge credits for protocol generation or document the intentional decision. **Effort: S** (ADR) or **M** (implementation).

### 2.6 `generate-dsd` Is Too Large (1130 Lines)

This single edge function handles:
1. Authentication
2. Rate limiting + credit check
3. Photo validation
4. DSD analysis via Gemini Vision with tools
5. Multi-layer simulation generation (natural, whitening, complete-treatment)
6. Image upload to Supabase Storage
7. Error handling with credit refund

**Recommendation**: Extract simulation generation into a separate helper or even a separate edge function (`generate-dsd-simulation`). The analysis and simulation are independent steps. **Effort: M** (1-2 days).

---

## 3. State Management Assessment

### 3.1 Patterns In Use

| Pattern | Where | Purpose |
|---------|-------|---------|
| React Query (`@tanstack/react-query`) | Domain hooks | Server state management |
| React Context (`AuthContext`) | App root | Authentication state |
| Local `useState` | Domain hooks, components | UI state |
| `sessionStorage` / `localStorage` | Dashboard, wizard | Persistence flags |
| `useRef` | useWizardFlow | Mutable state without re-renders |

### 3.2 Strengths

- **Single context**: Only `AuthContext` exists. No context explosion.
- **React Query for all server state**: Query keys are factored well (e.g., `dashboardQueryKeys`).
- **Subscription state is reusable**: `useSubscription` hook is consumed by multiple domain hooks.
- **Stale times are intentional**: Profile (5min), dashboard metrics (30s), plans (1hr) -- appropriate for each.

### 3.3 Weaknesses

**useWizardFlow: 1355 lines, 25+ useState calls**

This hook is the single largest architectural liability. It manages:
- 6-step wizard navigation
- Image upload + analysis
- DSD integration
- Patient creation
- Multi-tooth protocol generation
- Draft save/restore
- Credit confirmation
- Treatment type management
- Form validation

A partial decomposition into `wizard/constants.ts`, `wizard/helpers.ts`, and `wizard/types.ts` was started but the core hook remains monolithic. The hook should be split into:
1. `useWizardNavigation` — step management, direction, back/forward
2. `useWizardAnalysis` — photo analysis, reanalysis, error handling
3. `useWizardSubmission` — patient creation, protocol generation, per-tooth loop
4. `useWizardDSD` — DSD integration, tooth merging
5. `useWizardFlow` — orchestrator that composes the above

**Recommendation**: Split into 4-5 sub-hooks following the existing `wizard/` directory pattern. **Effort: L** (3-5 days).

**useSubscription straddles two layers**

`useSubscription` lives in `hooks/` (not `hooks/domain/`) but behaves as a domain hook. It consumes `@/data` modules and provides domain-shaped data. It should be in `hooks/domain/`.

### 3.4 Missing State Patterns

- **No optimistic updates**: All mutations wait for server confirmation. For operations like marking evaluations as "completed", optimistic updates would improve UX.
- **No global error state**: Error handling is per-hook with `toast.error()`. No centralized error boundary per route.
- **No query key factory convention**: `dashboardQueryKeys` is well-structured, but other hooks use inline array keys (`['subscription', user?.id]`, `['inventory', 'list', 0]`). Should standardize.

---

## 4. Data Flow Analysis

### 4.1 Happy Path: New Evaluation

```
User uploads photo
  -> useWizardFlow.analyzePhoto()
    -> useAuthenticatedFetch.invokeFunction('analyze-dental-photo')
      -> Edge: auth + rate limit + credits + Gemini Vision
    <- PhotoAnalysisResult
  -> User reviews & edits form
  -> useWizardFlow.handleSubmit()
    -> supabase.from('patients').insert()  [VIOLATION: direct DB]
    -> supabase.from('evaluations').insert()  [VIOLATION: direct DB]
    -> For each tooth:
      -> supabase.functions.invoke('recommend-resin' | 'recommend-cementation')
        -> Edge: auth + rate limit + Gemini + DB update
    <- Navigate to /evaluation/{sessionId}
```

**Issues identified:**
1. Patient creation and evaluation insertion bypass the data layer (see section 1.1).
2. The per-tooth loop in `handleSubmit()` runs sequentially, not in parallel. For 6 teeth, this means 6 serial AI calls (~12-30 seconds).
3. `handleSubmit()` catches errors per-tooth but has no rollback mechanism. Partial failures leave orphaned evaluations in "analyzing" status.

### 4.2 Data Layer Completeness

| Entity | List | Get | Create | Update | Delete | Notes |
|--------|------|-----|--------|--------|--------|-------|
| Evaluations | Yes | Yes | **No** (wizard does it directly) | Yes | No | Missing create in data layer |
| Patients | Yes | Yes | **No** (wizard does it directly) | Yes | No | Missing create in data layer |
| Profiles | Yes | Yes | No (auto-created) | Yes | No | OK |
| Inventory | Yes | No | Yes | No | Yes | OK |
| Subscriptions | Yes | Yes | No (Stripe-managed) | No | No | OK |
| Drafts | Yes | No | Yes (upsert) | No | Yes | OK |
| Payments | Yes | No | No | No | No | OK (read-only) |
| Credit Usage | Yes | No | No | No | No | OK (read-only) |

**Gap**: `evaluations.create()` and `patients.create()` don't exist in the data layer. These mutations are inlined in `useWizardFlow`.

### 4.3 Storage Operations

Storage (photo upload, signed URLs, download) has NO data layer abstraction. All storage calls are direct:
- `useWizardFlow` — uploads clinical photos
- `DSDStep.tsx` — downloads/uploads DSD photos and simulations
- `PhotoUploader.tsx` — uploads and manages photos
- `SharedEvaluation.tsx` — downloads photos via signed URLs

**Recommendation**: Create `data/storage.ts` with typed functions: `uploadClinicalPhoto()`, `getSignedUrl()`, `downloadFile()`, etc. **Effort: M** (1-2 days).

---

## 5. Scalability Assessment

### 5.1 Database Scalability

**Client-side aggregation** (`apps/web/src/data/credit-usage.ts:65-94`):
The `getMonthlyStats()` function fetches ALL credit usage rows for the month and aggregates client-side with a `Map`. Comment says: "Supabase JS doesn't support GROUP BY natively". At scale (1000 users, 200 credits/month), this fetches 200K+ rows/month to the client.

**Recommendation**: Use a Postgres function or view for aggregation. **Effort: S**.

**Dashboard metrics** (`data/evaluations.ts:106-157`):
`getDashboardMetrics()` fetches ALL evaluations for a user (`select('session_id, status')` without pagination), then computes metrics client-side. A user with 5000 evaluations would transfer all of them on every dashboard load.

**Recommendation**: Create a Postgres function `get_dashboard_metrics(p_user_id)` that computes metrics server-side. **Effort: M**.

### 5.2 Rate Limiting at Scale

The rate limiter uses a database table (`rate_limits`) with per-user, per-function rows. With 1000 concurrent users:
- Each AI request does 2 DB queries (SELECT + UPSERT on `rate_limits`)
- The SELECT + UPSERT pattern is NOT atomic -- two concurrent requests could both read count=9, both write count=10, allowing 11 requests against a limit of 10

**Recommendation**: Use a Postgres function with `SELECT FOR UPDATE` or Redis for rate limiting. **Effort: M**.

### 5.3 Connection Pooling

Edge functions create a new `createClient()` on every request. Supabase Edge Functions run on Deno Deploy, which reuses isolates, but each function creates 1-3 Supabase clients per request:
- One with user's auth token (for auth verification)
- One with service role key (for rate limit, credits, DB operations)
- Sometimes a third for metrics logging

This is within Supabase's design, but at scale the connection overhead adds up.

### 5.4 No Caching Layer

- No CDN caching for static API responses (plans, credit costs, resin catalog)
- No edge caching for Gemini responses (same photo could be analyzed twice)
- React Query provides client-side caching but no shared/server cache

**Recommendation**: Add `stale-while-revalidate` headers for catalog-type data. Consider deduplicating identical Gemini requests with a hash-based cache. **Effort: M-L**.

### 5.5 Sequential Per-Tooth Processing

In `useWizardFlow.handleSubmit()`, protocol generation for each tooth runs sequentially:
```typescript
for (const [index, tooth] of teethToProcess.entries()) {
  // ... insert evaluation
  // ... call AI function
  // ... update status
}
```

For 6 teeth, this takes 12-30 seconds. The operations are independent and could run in parallel with `Promise.all()` (with concurrency limit).

**Recommendation**: Use `Promise.allSettled()` with a concurrency limiter (e.g., 3 at a time) for protocol generation. **Effort: S** (half day).

---

## 6. ADR Gap Analysis

### 6.1 Existing ADRs

| ADR | Status | Coverage |
|-----|--------|----------|
| ADR-001: 3-Layer Frontend Architecture | Accepted | Good -- defines the core pattern |
| ADR-002: PageShell Design System Adoption | Accepted | Good -- defines composite mapping |
| ADR-003: Centralized Prompt Management | Accepted | Good -- defines prompt registry |

### 6.2 Missing ADRs

The following architectural decisions are currently implicit and should be documented:

**ADR-004: Credit-Based Pricing Model** (Critical)
- **What**: How credits are checked, consumed, and refunded across edge functions
- **Why**: The current system has inconsistencies (only 2 of 4 AI functions charge credits)
- **Includes**: Atomic credit consumption via `use_credits()` RPC, idempotent operations, refund on failure
- **Risk**: Without documentation, future developers may add functions without credit enforcement

**ADR-005: Edge Function Authentication Strategy** (High)
- **What**: Two auth patterns coexist (`getClaims()` vs `getUser()`), `verify_jwt = false` everywhere
- **Why**: ES256 JWT migration forced `verify_jwt = false`, functions do their own auth internally
- **Includes**: Why JWTs are verified in-function, which method to use, session refresh strategy

**ADR-006: AI Model Selection and Retry Strategy** (High)
- **What**: Which Gemini model is used for each function, retry logic, timeout handling
- **Why**: Models are hardcoded per-function (`gemini-3-flash-preview`, `gemini-2.5-pro`, `gemini-3-pro-image-preview`), retry logic differs between frontend (`lib/retry.ts`) and backend (`gemini.ts`)
- **Includes**: Model selection rationale, cost/quality tradeoffs, when to retry vs fail

**ADR-007: Storage Access Patterns** (Medium)
- **What**: How clinical photos, DSD simulations, avatars, and logos are stored and accessed
- **Why**: Storage operations are scattered across 6+ files with no abstraction layer
- **Includes**: Bucket structure, access policies, signed URL strategy, HEIC conversion

**ADR-008: Wizard State Management Pattern** (Medium)
- **What**: How the 6-step wizard manages state, drafts, and multi-tooth submissions
- **Why**: The wizard is the most complex feature with 1355 lines of state management
- **Includes**: Draft persistence strategy, credit pre-confirmation, per-tooth error handling

---

## 7. Monorepo Health

### 7.1 Workspace Structure

```
dentai-pro/
  apps/web/              # Main app (only consumer of PageShell)
  packages/
    logger/              # Shared logger (used by apps/web)
    page-shell/          # Barrel re-export (used by apps/web)
    pageshell-composites/   # ListPage, DetailPage, FormPage, etc.
    pageshell-core/         # Core hooks and types
    pageshell-domain/       # Domain-specific UI (courses, sessions)
    pageshell-features/     # Compound feature components
    pageshell-interactions/ # Interactive components
    pageshell-layouts/      # Layout components
    pageshell-primitives/   # Radix-based primitives
    pageshell-shell/        # Facade (BUILD BROKEN)
    pageshell-theme/        # Theme context
    pageshell-themes/       # Theme presets
```

### 7.2 Issues

**`@pageshell/shell` build is broken** (known pre-existing issue, DTS error). This means the full `turbo build` pipeline fails. Since `apps/web` uses `@pageshell/composites` directly (which re-exports from other packages), this doesn't block development but blocks CI/CD from running full builds.

**11 PageShell packages for 1 consumer**: All 11 `pageshell-*` packages are consumed exclusively by `apps/web`. The granular package split (`primitives`, `interactions`, `features`, `layouts`, `theme`, `themes`, `core`, `domain`, `shell`, `composites`) makes sense for a multi-project design system, but AURIA is the only consumer. This means:
- Build time includes 11 package compilations
- `turbo.json` `dependsOn: ["^build"]` creates a deep dependency chain
- Version management across 11 packages adds overhead

**`@pageshell/domain` description says "courses, sessions, credits, gamification"**: These are generic LMS concepts, not dental domain concepts. This package appears to be from a different project context, not AURIA-specific.

**React version overrides in root `package.json`**: The monorepo forces React 18.3.1 via pnpm overrides. This is correct for avoiding version conflicts but should be documented.

### 7.3 Turbo Pipeline

```json
{
  "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
  "dev": { "cache": false, "persistent": true },
  "lint": { "dependsOn": ["^build"] },
  "test": { "dependsOn": ["^build"] },
  "type-check": { "dependsOn": ["^build"] }
}
```

- `lint` depends on `^build` -- this means linting only runs after ALL dependencies build. Since `@pageshell/shell` build is broken, `turbo lint` for the entire repo will fail.
- No `clean` task outputs defined (cache invalidation concern).

**Recommendation**: Fix `@pageshell/shell` build or exclude it from the dependency chain. Consider consolidating PageShell packages if multi-project reuse is not planned. **Effort: M** (1-2 days for build fix).

---

## 8. Prioritized Action Plan

| Priority | Finding | Files | Effort | Impact |
|----------|---------|-------|--------|--------|
| **P0 Critical** | Standardize edge function auth (getClaims vs getUser inconsistency) | 8 edge functions | S | Security: deleted users can access AI functions |
| **P0 Critical** | Rate limiting race condition (non-atomic check-then-update) | `_shared/rateLimit.ts` | M | Abuse: rate limits can be bypassed under concurrency |
| **P1 High** | Move wizard DB writes to data layer (evaluations.create, patients.create) | `useWizardFlow.ts`, `data/evaluations.ts`, `data/patients.ts` | M | Architecture: largest 3-layer violation |
| **P1 High** | Create `data/storage.ts` abstraction for all storage operations | 6 component files, new `data/storage.ts` | M | Architecture: scattered storage calls |
| **P1 High** | Add rate limiting to Stripe functions | 4 edge functions | S | Security: abuse prevention |
| **P1 High** | Document credit charging model (only 2/4 AI functions charge) | ADR-004 | S | Clarity: prevents inconsistent future work |
| **P2 Medium** | Split useWizardFlow into sub-hooks | `hooks/domain/wizard/` | L | Maintainability: 1355-line hook |
| **P2 Medium** | Server-side aggregation for dashboard metrics | `data/evaluations.ts`, new PG function | M | Scalability: client fetches all rows |
| **P2 Medium** | Parallelize per-tooth protocol generation | `useWizardFlow.ts:525-728` | S | UX: 12-30s sequential -> 4-10s parallel |
| **P2 Medium** | Standardize query key factories across all hooks | All domain hooks | S | Consistency: prevents stale cache bugs |
| **P2 Medium** | Extract shared types to `@/types/` (remove data -> component dependency) | `data/sample-case.ts`, new `types/wizard.ts` | S | Architecture: reverse dependency |
| **P2 Medium** | Move useSubscription to hooks/domain/ | `hooks/useSubscription.ts` | S | Architecture: consistent layering |
| **P3 Low** | Fix @pageshell/shell build | `packages/pageshell-shell/` | M | CI/CD: full build pipeline blocked |
| **P3 Low** | Evaluate PageShell package consolidation | 11 packages | L | DevEx: reduce build overhead |
| **P3 Low** | Add CDN caching for catalog data (plans, resins, credit costs) | Edge functions + headers | S | Scalability: reduce DB load |
| **P3 Low** | Server-side credit usage aggregation | `data/credit-usage.ts`, new PG function | S | Scalability: client-side GROUP BY |

---

## 9. Proposed ADRs

### ADR-004: Credit-Based Pricing Model

**Scope**: Define which operations consume credits, the atomic consumption mechanism, refund policy, and idempotency strategy.

**Key decisions to document**:
- Why `analyze-dental-photo` and `generate-dsd` charge but `recommend-resin` and `recommend-cementation` don't
- The `use_credits()` RPC with row-level locking
- The `credit_transactions` table for idempotent consumption and refund
- Frontend credit confirmation UX (pre-confirm full flow cost)

### ADR-005: Edge Function Authentication Strategy

**Scope**: Standardize JWT verification across all edge functions.

**Key decisions to document**:
- Why `verify_jwt = false` in config.toml (ES256 migration)
- In-function auth via service role key
- `getClaims()` vs `getUser()` tradeoff and chosen standard
- Session refresh strategy in `useAuthenticatedFetch`

### ADR-006: AI Model Selection and Retry Strategy

**Scope**: Document model selection per function and retry behavior.

**Key decisions to document**:
- Model mapping: `gemini-3-flash-preview` for analysis/resin, `gemini-2.5-pro` for DSD analysis/cementation, `gemini-3-pro-image-preview` for simulation
- Frontend retry (`lib/retry.ts`): 2 retries with exponential backoff, skips 4xx
- Backend retry (`gemini.ts`): 3 retries for 429, 1 retry for 500/503
- Timeout handling (60s for image generation)

### ADR-007: Storage Access Patterns

**Scope**: Standardize how clinical photos and generated images are managed.

**Key decisions to document**:
- Bucket structure (`clinical-photos`, `avatars`, `dsd-simulations`)
- Folder-based isolation (`{userId}/...`)
- Signed URL generation strategy
- HEIC-to-JPEG conversion pipeline

### ADR-008: Wizard State Management Pattern

**Scope**: Document the wizard's complex state orchestration.

**Key decisions to document**:
- 6-step navigation model
- Draft persistence to Supabase (debounced upsert, 7-day expiry)
- Credit pre-confirmation for full flow
- Per-tooth sequential processing with partial failure handling
- Treatment type normalization (English->Portuguese)

---

## Appendix: File Reference

| Path | Description |
|------|-------------|
| `apps/web/src/data/` | Data layer (8 modules + barrel + client) |
| `apps/web/src/hooks/domain/` | Domain hooks (11 hooks + barrel + wizard/) |
| `apps/web/src/hooks/useSubscription.ts` | Subscription/credits hook (should be in domain/) |
| `apps/web/src/hooks/useAuthenticatedFetch.ts` | Edge function invocation with session refresh |
| `apps/web/src/hooks/useWizardDraft.ts` | Draft persistence hook |
| `apps/web/src/lib/retry.ts` | Frontend retry utility |
| `apps/web/src/contexts/AuthContext.tsx` | Auth context + idle timeout |
| `supabase/functions/_shared/cors.ts` | CORS + error response helpers |
| `supabase/functions/_shared/credits.ts` | Atomic credit check/consume/refund |
| `supabase/functions/_shared/rateLimit.ts` | Multi-window rate limiting |
| `supabase/functions/_shared/gemini.ts` | Gemini API client (715 lines) |
| `supabase/functions/_shared/validation.ts` | Input validation + prompt sanitization |
| `supabase/functions/_shared/prompts/` | Centralized prompt management |
| `supabase/config.toml` | Edge function config (all verify_jwt = false) |
| `docs/06-ADRs/` | Existing ADRs (001-003) |
| `turbo.json` | Turborepo pipeline config |
| `pnpm-workspace.yaml` | Workspace definition |

---

*Generated: 2026-02-10 by Architect Agent*
*Previous audit: [[2026-02-08-comprehensive-audit-design]]*
