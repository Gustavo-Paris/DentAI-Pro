# AURIA — Pipeline Analysis Report

**Generated:** 2026-02-08
**Pipeline version:** 3-phase parallel extraction + cross-reference + consolidation

---

## Executive Summary

AURIA (formerly DentAI Pro) is a dental clinical decision-support system built on a modern stack: React 18 + TypeScript frontend with a Vite build, Supabase backend (Postgres + Edge Functions), Google Gemini AI for clinical analysis, and Stripe for billing. The monorepo comprises 1 app and 12 workspace packages organized via Turborepo + pnpm. The database layer is well-structured with 18 tables, 14 migrations, 35 indexes, and 38 RLS policies across 17 of those 18 tables. The backend consists of 9 Supabase Edge Functions (Deno runtime) supported by 12 shared modules and 5 prompt definitions. The credit-based pricing system is atomically sound, using `SELECT FOR UPDATE` row-locking to prevent race conditions, with proper refund handling for AI failures.

However, the analysis uncovered several issues that require attention. The most critical is the `prompt_executions` table lacking RLS entirely -- the only table in the database without row-level security -- which could expose AI operational intelligence (models, token counts, costs, error rates) to any authenticated user via PostgREST. A second critical finding is the `skipCreditCheck` parameter in `generate-dsd` that can be set to `true` by any client, bypassing the credit system entirely. There is also an authentication pattern inconsistency where 2 of 4 AI functions use `getClaims()` (which does not validate token revocation) while the other 2 use `getUser()` (full server-side validation). Additionally, the `.env.example` documents `GEMINI_API_KEY` but the actual code reads `GOOGLE_AI_API_KEY`, meaning anyone following setup docs will have non-functioning AI endpoints.

The system is architecturally solid overall. The 3-layer frontend pattern (Data Client -> Domain Hooks -> Page Adapters), the PageShell design system hierarchy, the centralized prompt management, and the atomic credit system all demonstrate thoughtful engineering. The findings below are prioritized to guide remediation efforts.

---

## 1. Database Schema Overview

### Table Inventory

| # | Table | Columns | Migration | Has RLS | Policies | Indexes |
|---|-------|---------|-----------|---------|----------|---------|
| 1 | `profiles` | 10 | 001 | Yes | 3 | 0 |
| 2 | `resins` | 12 | 001 | Yes | 1 | 0 |
| 3 | `resin_catalog` | 7 | 001 | Yes | 1 | 3 |
| 4 | `patients` | 9 | 001 | Yes | 4 | 3 |
| 5 | `evaluations` | 42 | 001 | Yes | 5 | 8 |
| 6 | `user_inventory` | 4 | 001 | Yes | 3 | 2 |
| 7 | `evaluation_drafts` | 5 | 001 | Yes | 4 | 1 |
| 8 | `session_detected_teeth` | 15 | 001 | Yes | 3 | 2 |
| 9 | `rate_limits` | 12 | 003 | Yes | 2 | 2 |
| 10 | `subscription_plans` | 17 | 005 | Yes | 1 | 1 |
| 11 | `subscriptions` | 19 | 005 | Yes | 2 | 4 |
| 12 | `payment_history` | 12 | 005 | Yes | 1 | 1 |
| 13 | `credit_costs` | 4 | 006 | Yes | 1 | 0 |
| 14 | `credit_usage` | 7 | 006 | Yes | 2 | 2 |
| 15 | `shared_links` | 6 | 008 | Yes | 2 | 2 |
| 16 | `prompt_executions` | 11 | 009 | **NO** | **0** | 2 |
| 17 | `credit_packs` | 7 | 012 | Yes | 1 | 0 |
| 18 | `credit_pack_purchases` | 8 | 012 | Yes | 1 | 0 |

**Totals:** 18 tables, 38 policies, 35 indexes, 14 migrations

### RLS Coverage

- **17 of 18 tables** have RLS enabled (94.4%)
- **1 table missing RLS:** `prompt_executions` -- stores AI execution metadata (prompt IDs, models, token counts, estimated costs, latency, errors). Without RLS, any authenticated client can read all rows via PostgREST.

### Index Coverage

Well-indexed tables include `evaluations` (8 indexes), `subscriptions` (4 indexes), `patients` (3 indexes with trigram for name search), and `resin_catalog` (3 indexes). Tables without indexes (`profiles`, `resins`, `credit_costs`, `credit_packs`, `credit_pack_purchases`) are either small lookup tables or accessed via primary key.

### Storage Buckets

| Bucket | Policies |
|--------|----------|
| `clinical-photos` | View, Upload, Update, Delete (own) |
| `dsd-simulations` | View, Upload, Delete (own) |
| `avatars` | View (all), Upload/Update/Delete (own) |

### SQL Functions (12)

| Function | Purpose |
|----------|---------|
| `update_updated_at_column()` | Trigger: auto-update timestamps |
| `handle_new_user()` | Trigger: create profile on signup |
| `cleanup_old_rate_limits()` | Maintenance: purge expired rate limits |
| `can_create_case(UUID)` | Check: legacy case creation permission |
| `increment_case_usage(UUID)` | Write: legacy case counter |
| `reset_monthly_usage()` | Cron: legacy monthly reset |
| `get_credit_cost(TEXT)` | Read: lookup credit cost by operation |
| `can_use_credits(UUID, TEXT)` | Check: verify credit availability |
| `use_credits(UUID, TEXT)` | Write: atomically deduct credits (SELECT FOR UPDATE) |
| `reset_monthly_usage_with_rollover()` | Cron: monthly reset with credit rollover |
| `add_bonus_credits(UUID, INTEGER)` | Write: add purchased bonus credits |
| `refund_credits(UUID, TEXT)` | Write: reverse credit deduction on AI failure |

---

## 2. Edge Functions Overview

### Function Inventory

| Function | Lines | Gemini | Stripe | Auth Pattern | Rate Limit | Credits |
|----------|-------|--------|--------|-------------|------------|---------|
| `analyze-dental-photo` | 547 | `gemini-3-flash-preview` | -- | getClaims | AI_HEAVY | case_analysis |
| `generate-dsd` | 1,080 | `gemini-2.5-pro`, `gemini-3-pro-image-preview` | -- | getUser | AI_HEAVY | dsd_simulation |
| `recommend-resin` | 645 | `gemini-2.0-flash` | -- | getClaims | AI_LIGHT | **None** |
| `recommend-cementation` | 367 | `gemini-2.5-pro` | -- | getUser | AI_LIGHT | **None** |
| `create-checkout-session` | 231 | -- | Checkout | getUser | -- | -- |
| `create-portal-session` | 98 | -- | Portal | getUser | -- | -- |
| `stripe-webhook` | 360 | -- | Webhook | Stripe sig | -- | -- |
| `sync-subscription` | 130 | -- | Subscriptions | getUser | -- | -- |
| `health-check` | 38 | -- | -- | None | -- | -- |

**Total function code:** 3,496 lines | **Shared modules:** 1,725 lines | **5 prompt definitions**

### Shared Module Dependency Matrix

| Module | analyze-dental-photo | generate-dsd | recommend-resin | recommend-cementation | checkout | portal | webhook | sync | health |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `cors.ts` | X | X | X | X | X | X | -- | X | -- |
| `logger.ts` | X | X | X | X | -- | -- | X | X | -- |
| `gemini.ts` | X | X | X | X | -- | -- | -- | -- | -- |
| `rateLimit.ts` | X | X | X | X | -- | -- | -- | -- | -- |
| `credits.ts` | X | X | -- | -- | -- | -- | -- | -- | -- |
| `validation.ts` | -- | -- | X | -- | -- | -- | -- | -- | -- |
| `metrics-adapter.ts` | X | X | X | X | -- | -- | -- | -- | -- |
| `prompts/*` | X | X | X | X | -- | -- | -- | -- | -- |

### Environment Variables Required

| Variable | Used By | Source |
|----------|---------|--------|
| `SUPABASE_URL` | All functions | Auto-injected by platform |
| `SUPABASE_ANON_KEY` | analyze-dental-photo, recommend-resin | Auto-injected by platform |
| `SUPABASE_SERVICE_ROLE_KEY` | All except health-check (indirectly) | Auto-injected by platform |
| `GOOGLE_AI_API_KEY` | gemini.ts (4 AI functions) | Manual secret |
| `STRIPE_SECRET_KEY` | checkout, portal, webhook, sync | Manual secret |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook | Manual secret |
| `ENVIRONMENT` | cors.ts, logger.ts | Optional config |
| `PROMPT_VERSION` | metrics-adapter.ts | Optional config |

---

## 3. Frontend & Build Configuration

### Monorepo Structure

```
dentai-pro/                          (Turborepo + pnpm@9.15.4)
  apps/
    web/                             (@dentai/web - React 18 + Vite + TypeScript)
  packages/
    logger/                          (@repo/logger - shared logging)
    page-shell/                      (@repo/page-shell - barrel re-export package)
    pageshell-core/                  (@pageshell/core)
    pageshell-primitives/            (@pageshell/primitives)
    pageshell-layouts/               (@pageshell/layouts)
    pageshell-interactions/          (@pageshell/interactions)
    pageshell-features/              (@pageshell/features)
    pageshell-composites/            (@pageshell/composites)
    pageshell-shell/                 (@pageshell/shell)
    pageshell-theme/                 (@pageshell/theme)
    pageshell-themes/                (@pageshell/themes)
    pageshell-domain/                (@pageshell/domain)
```

**Total packages:** 13 (1 app + 12 packages)

### PageShell Design System Hierarchy

```
@pageshell/core          (base: cn(), hooks, formatters, types, toast)
    |
    +---> @pageshell/primitives   (Button, Card, Input, Select, Dialog, Tabs, Badge, etc.)
    |         |
    |         +---> @pageshell/theme        (theme context, types)
    |         |         |
    |         |         +---> @pageshell/themes   (presets: admin, creator, student, marketplace; CSS tokens)
    |         |
    |         +---> @pageshell/layouts      (page layouts, sidebar, react-router adapter)
    |         |
    |         +---> @pageshell/interactions  (Modal, Drawer, Filters, Search, Pagination, Wizard, Form)
    |         |
    |         +---> @pageshell/features     (chat, advanced features)
    |
    +---> @pageshell/domain       (courses, sessions, credits, gamification, dashboard, profile, settings)
    |
    +---> @pageshell/composites   (ListPage, FormPage, DetailPage, DashboardPage, WizardPage, SettingsPage, etc.)
    |
    +---> @pageshell/shell        (full shell: wizard, skeletons, context, react-router adapter)
    |
    +---> @repo/page-shell        (barrel: re-exports all of the above)
```

### Vite Build Optimization

**Manual chunk splitting** configured for optimal code-splitting:

| Chunk | Contents |
|-------|----------|
| `vendor-react` | react, react-dom, react-router-dom |
| `vendor-radix` | 16 @radix-ui components |
| `vendor-query` | @tanstack/react-query |
| `vendor-date` | date-fns, react-day-picker |
| `vendor-supabase` | @supabase/supabase-js |
| `vendor-pdf` | jspdf |
| `vendor-heic` | heic-to |
| `vendor-recharts` | recharts (lazy loaded) |

**Chunk size warning limit:** 600 KB

### Key Dependency Versions

| Dependency | Version |
|------------|---------|
| React | ^18.3.1 |
| TypeScript | ^5.8.3 |
| Vite | ^5.4.19 |
| @supabase/supabase-js | ^2.91.0 |
| @tanstack/react-query | ^5.83.0 |
| Tailwind CSS | ^3.4.17 |
| Zod | ^3.25.76 |
| @sentry/react | ^10.37.0 |
| Turbo | ^2.5.0 |

---

## 4. Cross-Reference Analysis

### Table <-> Function Mapping

| Table | Read By (Edge Functions) | Written By (Edge Functions) |
|-------|--------------------------|----------------------------|
| `profiles` | create-checkout-session | -- |
| `resins` | recommend-resin | -- |
| `resin_catalog` | recommend-resin | -- |
| `patients` | *Frontend only* | *Frontend only* |
| `evaluations` | generate-dsd, recommend-resin, recommend-cementation | generate-dsd, recommend-resin, recommend-cementation |
| `user_inventory` | recommend-resin | -- |
| `evaluation_drafts` | *Frontend only* | *Frontend only* |
| `session_detected_teeth` | *Frontend only* | *Frontend only* |
| `rate_limits` | 4 AI functions | 4 AI functions |
| `subscription_plans` | checkout, sync, webhook, credits.ts | -- |
| `subscriptions` | checkout, portal, sync, webhook, credits.ts | checkout, sync, webhook |
| `payment_history` | -- | stripe-webhook |
| `credit_costs` | credits.ts | -- |
| `credit_usage` | -- | credits.ts (via RPC) |
| `shared_links` | *Frontend only* | *Frontend only* |
| `prompt_executions` | -- | metrics-adapter.ts (4 AI functions) |
| `credit_packs` | create-checkout-session | -- |
| `credit_pack_purchases` | -- | stripe-webhook |

### Orphaned Tables (Frontend-Only Access)

These 4 tables are never accessed by any edge function -- they are managed entirely via the frontend Supabase client (PostgREST):

1. **`patients`** -- CRUD patient records (name, phone, email, birth_date, notes)
2. **`evaluation_drafts`** -- Auto-save draft evaluation data as JSONB
3. **`session_detected_teeth`** -- Stores teeth detected by AI photo analysis (written by frontend after receiving analyze-dental-photo results)
4. **`shared_links`** -- Token-based public sharing of evaluation cases

All 4 tables have RLS enabled with proper `user_id`-based policies, so this pattern is architecturally safe.

### Credit System Flow

```
                         SUBSCRIPTION SETUP
                         ==================
   Stripe Checkout --> stripe-webhook --> subscriptions table
                                          (plan_id, credits_per_month)
                                               |
   Credit Pack Purchase --> stripe-webhook --> add_bonus_credits()
                                              (credits_bonus += pack)

                         CREDIT CONSUMPTION
                         ==================
   Client Request (POST)
        |
        v
   [analyze-dental-photo]     [generate-dsd]
        |                          |
        v                          v
   credits.ts: checkAndUseCredits(userId, operation)
        |
        v
   RPC: use_credits(userId, operation)
        |
        +---> SELECT FOR UPDATE on subscriptions (row lock)
        +---> get_credit_cost(operation) from credit_costs
        +---> Verify: (credits_per_month + rollover + bonus - used) >= cost
        +---> UPDATE subscriptions SET credits_used_this_month += cost
        +---> INSERT INTO credit_usage (audit trail)
        |
        v
   AI Call (Gemini)
        |
        +---> Success: continue, record metrics to prompt_executions
        +---> Failure: refund_credits(userId, operation)
                       (reverses deduction, negative credit_usage entry)

                         FREE AI CALLS (no credits)
                         ==========================
   [recommend-resin]          (rate-limited AI_LIGHT, no credit deduction)
   [recommend-cementation]    (rate-limited AI_LIGHT, no credit deduction)

                         MONTHLY RESET
                         =============
   Cron: reset_monthly_usage_with_rollover()
         (resets credits_used_this_month, calculates rollover)
```

### Auth Pattern Analysis

```
   Pattern A: getClaims() -- Lightweight JWT Claims Extraction
   ===========================================================
   Functions: analyze-dental-photo, recommend-resin
   Flow: Bearer token -> createClient(ANON_KEY) -> auth.getClaims(token)
   Security: Extracts 'sub' from JWT without server-side validation.
             Does NOT check token revocation or expiration against auth server.
             Relies solely on JWT signature validity.

   Pattern B: getUser() -- Full Server-Side Token Validation
   =========================================================
   Functions: generate-dsd, recommend-cementation, create-checkout-session,
              create-portal-session, sync-subscription
   Flow: Bearer token -> createClient(SERVICE_ROLE_KEY) -> auth.getUser(token)
   Security: Makes server-side call to validate token is active and not revoked.
             Returns full user object. More secure but adds latency.

   Pattern C: Stripe Webhook Signature
   ====================================
   Functions: stripe-webhook
   Flow: stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET)
   Security: Verifies request came from Stripe. No user JWT involved.

   Pattern D: No Auth
   ==================
   Functions: health-check
   Flow: Public endpoint, no authentication required.
```

---

## 5. Validation Results

### Config.toml Coverage

| Status | Function |
|--------|----------|
| Properly configured | analyze-dental-photo, create-checkout-session, create-portal-session, generate-dsd, health-check, recommend-cementation, recommend-resin, stripe-webhook, sync-subscription |
| Config without function (orphaned) | **analyze-photos** (ghost entry, function was renamed) |
| Function without config | None |

### JWT Compliance

All 10 entries in `config.toml` (including the orphaned `analyze-photos`) have `verify_jwt = false`. All functions handle authentication internally. **100% compliant** with the project's ES256 JWT workaround (see MEMORY.md).

### Import Resolution Status

| Function | All Imports Resolve | Missing |
|----------|:---:|---------|
| analyze-dental-photo | Yes | -- |
| create-checkout-session | Yes | -- |
| create-portal-session | Yes | -- |
| generate-dsd | Yes | -- |
| health-check | Yes | -- |
| recommend-cementation | Yes | -- |
| recommend-resin | Yes | -- |
| stripe-webhook | Yes | -- |
| sync-subscription | Yes | -- |

**9/9 functions have all imports resolving correctly.**

### CORS Configuration Status

| Function | Uses shared cors.ts | Preflight Handler | Notes |
|----------|:---:|:---:|-------|
| analyze-dental-photo | Yes | Yes | -- |
| create-checkout-session | Yes | Yes | -- |
| create-portal-session | Yes | Yes | -- |
| generate-dsd | Yes | Yes | -- |
| health-check | **No** | **No** | Uses inline `Access-Control-Allow-Origin: *` (wildcard) |
| recommend-cementation | Yes | Yes | -- |
| recommend-resin | Yes | Yes | -- |
| stripe-webhook | N/A | N/A | Server-to-server (correct: no CORS needed) |
| sync-subscription | Yes | Yes | -- |

### Deployment Readiness Matrix

| Function | Config | JWT | Imports | CORS | Ready |
|----------|:---:|:---:|:---:|:---:|:---:|
| analyze-dental-photo | OK | OK | OK | OK | **YES** |
| create-checkout-session | OK | OK | OK | OK | **YES** |
| create-portal-session | OK | OK | OK | OK | **YES** |
| generate-dsd | OK | OK | OK | OK | **YES** |
| health-check | OK | OK | OK | WARN | **YES** (with warning) |
| recommend-cementation | OK | OK | OK | OK | **YES** |
| recommend-resin | OK | OK | OK | OK | **YES** |
| stripe-webhook | OK | OK | OK | N/A | **YES** |
| sync-subscription | OK | OK | OK | OK | **YES** |

**All 9 functions are deployment-ready.** No blocking issues found.

---

## 6. Critical Findings & Recommendations

### CRITICAL

**C1. `prompt_executions` table missing RLS**
- **Location:** Migration `009_prompt_executions.sql`
- **Risk:** The only table in the entire database (1 of 18) without Row-Level Security. It stores AI execution metadata: prompt IDs, models used, token counts (in/out), estimated costs, latency, success/failure status, and error messages. Without RLS, any authenticated user can read all rows via PostgREST using the anon key.
- **Impact:** Leaks operational intelligence -- AI model selection, cost data, error rates, and usage patterns across all users.
- **Recommendation:** Enable RLS and add a policy restricting reads to service role only. The table is only written by `metrics-adapter.ts` via service role, so no user-facing read access is needed.

**C2. `skipCreditCheck` bypass vector in `generate-dsd`**
- **Location:** `generate-dsd/index.ts` (request body parameter)
- **Risk:** The function accepts `skipCreditCheck=true` from the client request body. This was intended for multi-layer DSD generation where the initial call already charged credits. However, there is no server-side validation that the initial call actually occurred. A malicious client can always send `skipCreditCheck=true` to bypass the credit system entirely.
- **Impact:** Unlimited free DSD simulations (normally costs credits), resulting in uncontrolled Gemini API costs.
- **Recommendation:** Replace the client-sent flag with server-side state. For example, store a `dsd_layers_charged` boolean on the evaluation record after the first DSD call, and check that flag server-side instead of trusting the client.

**C3. Environment variable name mismatch: `GEMINI_API_KEY` vs `GOOGLE_AI_API_KEY`**
- **Location:** `.env.example` documents `GEMINI_API_KEY`; `gemini.ts` reads `GOOGLE_AI_API_KEY`
- **Risk:** Anyone following the `.env.example` for setup will set the wrong variable name. All 4 AI functions will fail at runtime with a missing API key error.
- **Impact:** Complete AI failure for new deployments or new developers following documentation.
- **Recommendation:** Update `.env.example` to reference `GOOGLE_AI_API_KEY`.

### WARNING

**W1. Auth pattern inconsistency: `getClaims()` vs `getUser()`**
- **Functions using getClaims:** `analyze-dental-photo`, `recommend-resin`
- **Functions using getUser:** `generate-dsd`, `recommend-cementation`, `create-checkout-session`, `create-portal-session`, `sync-subscription`
- **Risk:** `getClaims()` extracts the `sub` claim from the JWT without server-side token validation. It does not check if the token has been revoked. A revoked user session would still be able to call `analyze-dental-photo` and `recommend-resin` until the JWT naturally expires (typically 1 hour).
- **Recommendation:** Standardize on `getUser()` for all functions that require authentication, or document the deliberate tradeoff (performance vs security) if `getClaims()` is intentional for high-throughput endpoints.

**W2. recommend-resin and recommend-cementation do not consume credits**
- **Location:** `recommend-resin/index.ts`, `recommend-cementation/index.ts`
- **Risk:** Both functions call Gemini AI (consuming API costs) but do not deduct user credits. They are rate-limited (AI_LIGHT tier) but have no credit cost. If a user has 100 existing evaluations, they can trigger unlimited resin and cementation recommendations without spending credits.
- **Impact:** Potential unbounded Gemini API costs not reflected in user billing.
- **Recommendation:** Confirm this is by design (bundled into `case_analysis` cost) or add credit consumption for these operations.

**W3. Orphaned `analyze-photos` config.toml entry**
- **Location:** `supabase/config.toml` -- `[functions.analyze-photos]`
- **Risk:** Ghost entry from a function rename (now `analyze-dental-photo`). While not breaking, it adds confusion to the configuration. The Supabase CLI may attempt to deploy a non-existent function.
- **Recommendation:** Remove `[functions.analyze-photos]` from `config.toml`.

**W4. Rate limiting fails open**
- **Location:** `_shared/rateLimit.ts`
- **Risk:** If the `rate_limits` table is unreachable (DB outage), the rate limiter allows all requests through. This is a deliberate availability-over-security tradeoff.
- **Impact:** During database outages, rate limiting is not enforced, potentially allowing request floods to AI endpoints.
- **Recommendation:** Document this behavior explicitly. Consider an in-memory fallback or circuit breaker for sustained outages.

**W5. `@pageshell/shell` build failure**
- **Location:** `packages/pageshell-shell/`
- **Risk:** Pre-existing DTS (TypeScript declaration) build error. The shell package fails to build. This is a known issue documented in MEMORY.md.
- **Recommendation:** Fix the DTS error. Since `@pageshell/shell` is in the dependency chain (`@repo/page-shell` -> `@pageshell/shell`), this could block the full monorepo build pipeline.

### INFO

**I1. Orphaned tables are architecturally valid**
- 4 tables (`patients`, `evaluation_drafts`, `session_detected_teeth`, `shared_links`) are frontend-only via PostgREST. All have RLS enabled with proper policies. This is a valid pattern for CRUD-heavy tables that don't need server-side business logic.

**I2. Credit system design is robust**
- The `use_credits()` SQL function uses `SELECT FOR UPDATE` row-locking to prevent race conditions. The `refund_credits()` function properly reverses deductions on AI failures. The billing pipeline has idempotency guards (unique constraints on Stripe IDs). This is well-engineered.

**I3. Credit system fails closed (correct behavior)**
- Unlike rate limiting (fails open), the credit system fails closed -- if the credit check encounters a database error, the request is denied. This prevents free usage during errors.

**I4. health-check uses wildcard CORS**
- Uses inline `Access-Control-Allow-Origin: *` instead of the shared `cors.ts` origin whitelist. Acceptable for a public health endpoint but inconsistent with the security posture of other functions.

**I5. stripe-webhook correctly omits CORS**
- Server-to-server endpoint from Stripe. No browser CORS handling needed. This is correct.

**I6. Gemini model diversity**
- 4 different Gemini models are used across functions: `gemini-3-flash-preview` (photo analysis), `gemini-2.5-pro` (DSD analysis, cementation), `gemini-3-pro-image-preview` (DSD simulation), and `gemini-2.0-flash` (resin recommendation). Each is chosen based on the task's complexity and latency requirements.

**I7. Billing idempotency is well-handled**
- `stripe-webhook` uses upsert with `stripe_invoice_id` as conflict key for `payment_history`, and `stripe_session_id` for `credit_pack_purchases`. This prevents duplicate entries from Stripe webhook retries.

---

## 7. Pipeline Execution Metadata

### Architecture

```
Phase 1: Extraction (3 parallel agents)
  Agent 1: Schema Extractor     -> extract-schemas.json    (29,510 bytes)
  Agent 2: Config Extractor      -> extract-configs.json    (28,774 bytes)
  Agent 3: Function Extractor    -> extract-functions.json  (18,916 bytes)

Phase 2: Transformation (2 parallel agents)
  Agent 4: Cross-Reference Analysis -> transform-analysis.json   (14,487 bytes)
  Agent 5: Validation Checker       -> transform-validation.json  (9,784 bytes)

Phase 3: Consolidation (1 agent)
  Agent 6: Report Generator     -> report.md (this file)
```

### Pipeline Output Files

| File | Size | Generated |
|------|------|-----------|
| `/tmp/pipeline/extract-schemas.json` | 29,510 bytes | Phase 1 |
| `/tmp/pipeline/extract-configs.json` | 28,774 bytes | Phase 1 |
| `/tmp/pipeline/extract-functions.json` | 18,916 bytes | Phase 1 |
| `/tmp/pipeline/transform-analysis.json` | 14,487 bytes | Phase 2 |
| `/tmp/pipeline/transform-validation.json` | 9,784 bytes | Phase 2 |
| `/tmp/pipeline/report.md` | -- | Phase 3 (this file) |

### Key Metrics Summary

| Metric | Value |
|--------|-------|
| Database tables | 18 |
| RLS policies | 38 |
| Database indexes | 35 |
| SQL functions | 12 |
| Storage buckets | 3 |
| Migrations | 14 |
| Edge functions | 9 |
| Shared modules | 12 |
| Prompt definitions | 5 |
| Gemini models in use | 4 |
| Workspace packages | 13 |
| External dependencies | 63 unique |
| Total edge function LOC | 3,496 |
| Total shared module LOC | 1,725 |
| Environment variables | 8 |
| Critical findings | 3 |
| Warnings | 5 |
| Info observations | 7 |

---

*Report generated by Pipeline Phase 3 Consolidation Agent on 2026-02-08*
