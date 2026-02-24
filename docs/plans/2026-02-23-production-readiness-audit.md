---
title: Production Readiness Audit — Report
created: 2026-02-23
updated: 2026-02-23
status: published
tags:
  - type/audit
  - status/published
---

# Production Readiness Audit — Report

## Executive Summary

**Application:** ToSmile.ai (AURIA) — AI-powered dental clinical decision-support
**Audit date:** 2026-02-23
**Launch type:** Soft launch (invited beta, known dentists)
**Method:** 6 parallel code-analysis agents + synthesized checklist

| Priority | Count | Definition |
|----------|-------|------------|
| **P0 (Blocker)** | **27** | Must fix before launch — security vulns, data loss, clinical safety, crashes on happy path |
| **P1 (Important)** | **58** | Should fix before launch — poor UX on common flows, missing error handling, incomplete features |
| **P2 (Nice-to-have)** | **48** | Can launch without — polish, edge cases, optimization |
| **Total** | **133** | |

### Go/No-Go Recommendation

**NO-GO** in current state. The 27 P0 findings include critical RLS policy bypasses, broken CI pipeline, missing clinical safety nets, and data integrity gaps. Estimated effort for P0 fixes: **3-5 days**. After P0 resolution, the application is suitable for soft launch with P1 items tracked as fast-follows.

---

## Findings by Category

### 1. Security & Compliance (2 P0, 7 P1, 7 P2)

#### P0

| # | Title | File | Impact |
|---|-------|------|--------|
| SEC-P0-1 | `subscriptions` RLS policy allows any authenticated user to upgrade their plan | `migrations/005_subscriptions.sql` | Free subscription upgrades — `USING(true)` missing `auth.role() = 'service_role'` filter |
| SEC-P0-2 | `rate_limits` RLS policy allows any user to reset their own rate limit counters | `migrations/003_rate_limits.sql:46-50` | Bypasses all rate limiting — unlimited API calls |

#### P1

| # | Title | File |
|---|-------|------|
| SEC-P1-1 | `credit_transactions` table has RLS enabled but no explicit policy | `migrations/020_credit_transactions.sql` |
| SEC-P1-2 | Shared links migration ordering risk | `migrations/019_*` |
| SEC-P1-3 | CSP meta tag and vercel.json header conflict (see also INFRA-P0-2) | `index.html:6`, `vercel.json:19` |
| SEC-P1-4 | CORS defaults to localhost in development | `_shared/cors.ts` |
| SEC-P1-5 | LGPD data export selects non-existent columns (incomplete export) | `data-export/index.ts:99-114` |
| SEC-P1-6 | LGPD account deletion misses several tables + wrong column for profile | `delete-account/index.ts` |
| SEC-P1-7 | Gemini API key appears in URL query params (logged by infrastructure) | `_shared/gemini.ts` |

#### P2

| # | Title | File |
|---|-------|------|
| SEC-P2-1 | Supabase anon key in `.env` (normal for Supabase but worth noting) | `.env` |
| SEC-P2-2 | Health check leaks internal version/dependency info | `health-check/index.ts` |
| SEC-P2-3 | Prompt injection sanitization coverage gaps | `_shared/validation.ts` |
| SEC-P2-4 | CORS missing `Access-Control-Max-Age` | `_shared/cors.ts` |
| SEC-P2-5 | PII (email addresses) in production logs | `_shared/email.ts:54`, `credits.ts:219` |
| SEC-P2-6 | Delete-account response includes internal table structure | `delete-account/index.ts:260-272` |
| SEC-P2-7 | Idle timeout only enforced client-side | `AuthContext.tsx:50-73` |

---

### 2. Error Handling & Stability (5 P0, 8 P1, 8 P2)

#### P0

| # | Title | File | Impact |
|---|-------|------|--------|
| ERR-P0-1 | `recommend-cementation` missing try/catch around `req.json()` | `recommend-cementation/index.ts:~252` | Malformed body → 500 instead of 400 |
| ERR-P0-2 | `create-checkout-session` unprotected `req.json()` | `create-checkout-session/index.ts:~44` | Payment path — opaque 500 on body corruption |
| ERR-P0-3 | `stripe-webhook` non-null assertion on `session.metadata` | `stripe-webhook/index.ts:~322` | Credit pack purchase: user pays but doesn't receive credits |
| ERR-P0-4 | `handleSubmitTeeth` partial failure leaves session inconsistent | `useEvaluationDetail.ts` | 3 of 5 teeth fail — no retry, no indication which succeeded |
| ERR-P0-5 | `handleInvoiceFailed` non-atomic operations | `stripe-webhook/index.ts` | Subscription stays "active" after failed payment |

#### P1

| # | Title | File |
|---|-------|------|
| ERR-P1-1 | Circuit breaker is per-isolate — ineffective in serverless | `_shared/circuit-breaker.ts` |
| ERR-P1-2 | `getDashboardMetrics` uses `Promise.all` — single failure kills all metrics | `data/evaluations.ts:~113` |
| ERR-P1-3 | `generate-dsd` double body parsing (fragile pattern) | `generate-dsd/index.ts:25-64` |
| ERR-P1-4 | `send-email` provides no specific error context | `send-email/index.ts:~133` |
| ERR-P1-5 | `useProfile` `syncWithRetry` silently swallows errors after max retries | `useProfile.ts` |
| ERR-P1-6 | Error response format inconsistency (mixed PT/EN, inconsistent shape) | Multiple edge functions |
| ERR-P1-7 | `beforeunload` unreliable on mobile (iOS Safari, Android WebView) | `useWizardFlow.ts` |
| ERR-P1-8 | React Query default `retry: 1` may be insufficient for clinic WiFi | `App.tsx` QueryClient config |

#### P2

| # | Title | File |
|---|-------|------|
| ERR-P2-1 | `storage.ts` signed URL functions return null without logging | `data/storage.ts` |
| ERR-P2-2 | Health check doesn't test Supabase DB connectivity | `health-check/index.ts` |
| ERR-P2-3 | FLUX polling interval is fixed regardless of queue position | `_shared/flux.ts` |
| ERR-P2-4 | PDF export uses `Promise.all` — single image failure kills entire export | `useResult.ts:~287-292` |
| ERR-P2-5 | `useGroupResult` has unused `generatingPDF` state, no implementation | `useGroupResult.ts` |
| ERR-P2-6 | `errorHandler.ts` sensitive info filter is case-sensitive | `errorHandler.ts` |
| ERR-P2-7 | `syncGroupProtocols` doesn't surface partial failures to caller | `data/wizard.ts:~314-318` |
| ERR-P2-8 | `useAuthenticatedFetch` token refresh race condition | `useAuthenticatedFetch.ts` |

---

### 3. Clinical Safety (3 P0, 8 P1, 5 P2)

#### P0

| # | Title | File | Impact |
|---|-------|------|--------|
| CLIN-P0-1 | No FDI tooth number validation on DSD suggestion `tooth` field | `aiSchemas.ts:119`, `post-processing.ts` | AI-hallucinated tooth "19" or "gengiva" propagates to protocols |
| CLIN-P0-2 | No HF acid concentration safety net for cementation | `aiSchemas.ts:195-228`, `recommend-cementation/index.ts` | 10% HF on e.max = irreversible ceramic surface damage |
| CLIN-P0-3 | RecommendResin `protocol` is optional — user gets recommendation with no protocol | `aiSchemas.ts:277-296`, `recommend-resin/index.ts:402-406` | Dentist sees resin name but no layering instructions |

#### P1

| # | Title | File |
|---|-------|------|
| CLIN-P1-1 | No validation of VITA shade values from AI photo analysis | `aiSchemas.ts:102` |
| CLIN-P1-2 | `existingAnalysis` from client cast with `as` — no schema validation | `generate-dsd/validation.ts:80` |
| CLIN-P1-3 | No mandatory safety disclaimer in AI analysis response | `analyze-dental-photo/index.ts:242-249` |
| CLIN-P1-4 | DSD `confidence` field is `z.string()` — not bounded to enum | `aiSchemas.ts:138` |
| CLIN-P1-5 | Contralateral protocol copy ignores differing treatment types | `recommend-resin.ts:217-232` |
| CLIN-P1-6 | `syncGroupProtocols` copies protocol regardless of cavity class differences | `data/wizard.ts:248-319` |
| CLIN-P1-7 | DSD image cache hash uses only first 50KB — cross-patient risk | `generate-dsd/index.ts:125-131` |
| CLIN-P1-8 | Cementation `dsdContext` from client not sanitized for prompt injection | `recommend-cementation/index.ts:207-209` |

#### P2

| # | Title | File |
|---|-------|------|
| CLIN-P2-1 | `normalizeAnalysisEnums` missing `recommended_tooth_shape` | `aiSchemas.ts:159-189` |
| CLIN-P2-2 | Lower teeth filter uses weak count-based heuristic | `post-processing.ts:38-53` |
| CLIN-P2-3 | Cementation FDI regex allows deciduous teeth (quadrants 5-8) | `recommend-cementation/index.ts:58` |
| CLIN-P2-4 | `simulation_limitation` field in Zod schema but not in TS type | `aiSchemas.ts:139`, `types.ts` |
| CLIN-P2-5 | `tooth_bounds` percentages have no 0-100 range validation | `aiSchemas.ts:68-75` |

---

### 4. UX Completeness (5 P0, 16 P1, 13 P2)

#### P0

| # | Title | File | Impact |
|---|-------|------|--------|
| UX-P0-1 | No "Delete Patient" functionality anywhere in the app | `PatientProfile.tsx` | LGPD right-to-deletion gap, data clutter |
| UX-P0-2 | No credits check before wizard submission on quick-case flow | `NewCase.tsx:356-374` | Zero-credits user hits confusing backend error |
| UX-P0-3 | Wizard result step (step 6) shows blank page when not submitting | `NewCase.tsx:236-243` | Dead-end blank screen |
| UX-P0-4 | EvaluationDetails shows empty content when session has no evaluations | `EvaluationDetails.tsx:46-47` | Blank page with no explanation |
| UX-P0-5 | `beforeunload` guard fires before user has done anything meaningful | `useWizardFlow.ts:360-367` | Annoying dialog on step 1 before any user input |

#### P1

| # | Title | File |
|---|-------|------|
| UX-P1-1 | No confirmation dialog for "Mark All as Completed" | `EvaluationDetails.tsx:103` |
| UX-P1-2 | Create Patient dialog lacks validation feedback | `Patients.tsx:229-279` |
| UX-P1-3 | No skip-to-content link for keyboard navigation | `App.tsx` |
| UX-P1-4 | Landing page pricing fallback has hardcoded Portuguese strings | `Landing.tsx:487-636` |
| UX-P1-5 | DraftRestoreModal cannot be dismissed (no explanation) | `NewCase.tsx:385` |
| UX-P1-6 | Profile page may flash empty form fields before data loads | `Profile.tsx:82` |
| UX-P1-7 | No persistent error state for photo upload failures in wizard | `PhotoUploadStep.tsx:162-178` |
| UX-P1-8 | Evaluation list filters may not actually filter data | `Evaluations.tsx:143-164` |
| UX-P1-9 | No feedback when sharing an evaluation fails | `EvaluationDetails.tsx:88` |
| UX-P1-10 | Inventory item remove button too small for mobile (24x24px) | `Inventory.tsx:38-46` |
| UX-P1-11 | SharedEvaluation shows "expired" for invalid tokens (misleading) | `SharedEvaluation.tsx:32` |
| UX-P1-12 | Wizard Back button not disabled during submission | `NewCase.tsx:337-378` |
| UX-P1-13 | CookieConsent and OfflineBanner may overlap | `OfflineBanner.tsx` |
| UX-P1-14 | No empty state for patient profile sessions list | `PatientProfile.tsx:139-149` |
| UX-P1-15 | Pricing page has no error state when plans fail to load | `Pricing.tsx:267-278` |
| UX-P1-16 | GroupResult "Mark All Completed" has no confirmation | `GroupResult.tsx:53` |

#### P2

| # | Title | File |
|---|-------|------|
| UX-P2-1 | Hardcoded Portuguese strings in landing page fallback plans | `Landing.tsx:416-461` |
| UX-P2-2 | Hardcoded Portuguese in Pricing page feature values | `Pricing.tsx:60-88` |
| UX-P2-3 | Missing `aria-label` on several interactive elements | Multiple files |
| UX-P2-4 | No focus management after wizard step transitions | `NewCase.tsx` |
| UX-P2-5 | Missing `focus-visible` styles on most interactive elements | Multiple wizard components |
| UX-P2-6 | `id="main-content"` landmark only on Dashboard | `Dashboard.tsx:217` |
| UX-P2-7 | No "Load more" indicator for patient sessions | `PatientProfile.tsx:143-148` |
| UX-P2-8 | DSD Initial State has no "Start Analysis" button (auto-starts) | `DSDInitialState.tsx` |
| UX-P2-9 | No color contrast validation for treatment type badges | `EvaluationDetails.helpers.tsx` |
| UX-P2-10 | Wizard step indicator not navigable via arrow keys | `StepIndicator.tsx` |
| UX-P2-11 | No unsaved changes warning in Patient edit dialog | `PatientProfile.tsx:195-252` |
| UX-P2-12 | "New" session badge depends on navigation state | `Evaluations.tsx:132-136` |
| UX-P2-13 | No `prefers-reduced-motion` support | Multiple files |

---

### 5. Data Integrity (7 P0, 10 P1, 7 P2)

#### P0

| # | Title | File | Impact |
|---|-------|------|--------|
| DATA-P0-1 | Missing FK on `patients.user_id` — orphan patients on user deletion | `migrations/001:224` | PHI persists after account deletion (LGPD) |
| DATA-P0-2 | Missing FK on `evaluation_drafts.user_id` — orphan drafts | `migrations/001:377` | Draft data persists after user deletion |
| DATA-P0-3 | Missing FK on `session_detected_teeth.user_id` — orphan detected teeth | `migrations/001:414` | Orphan rows on user deletion |
| DATA-P0-4 | Missing FK on `user_inventory.user_id` — orphan inventory | `migrations/001:351` | Orphan rows on user deletion |
| DATA-P0-5 | Credit race condition for free-tier users (no row lock) | `migrations/014:110-128` | Free-tier users can exceed 3-evaluation limit |
| DATA-P0-6 | `handleInvoiceFailed` not idempotent — duplicate failed payment records | `stripe-webhook/index.ts:300-310` | Duplicate records on webhook retry |
| DATA-P0-7 | `referral.applyReferralCode` calls non-existent RPC `increment_credits_bonus` | `data/referral.ts:135-153` | Referral program completely broken |

#### P1

| # | Title | File |
|---|-------|------|
| DATA-P1-1 | No `ON DELETE CASCADE` on `evaluations.patient_id` — blocks patient deletion | `migrations/001:265` |
| DATA-P1-2 | Delete-account misses several tables + profile deletion uses wrong column | `delete-account/index.ts` |
| DATA-P1-3 | No automatic draft cleanup — abandoned drafts accumulate | `migrations/001:375-405` |
| DATA-P1-4 | Storage orphans on evaluation deletion (photos, DSD simulations) | `data/evaluations.ts:377` |
| DATA-P1-5 | No `updated_at` column on `evaluations_raw` | `migrations/001:262-320` |
| DATA-P1-6 | `evaluations.status` has no CHECK constraint — invalid values accepted | `migrations/001:283` |
| DATA-P1-7 | `shared_links.session_id` has no FK — can reference deleted sessions | `migrations/008:9` |
| DATA-P1-8 | `referral_conversions` missing `ON DELETE CASCADE` — blocks user deletion | `migrations/030:12-13` |
| DATA-P1-9 | `credit_pack_purchases.user_id` missing `ON DELETE CASCADE` | `migrations/012:42` |
| DATA-P1-10 | `handleCheckoutCompleted` upsert resets credit counters on plan change | `stripe-webhook/index.ts:156-171` |

#### P2

| # | Title | File |
|---|-------|------|
| DATA-P2-1 | No cleanup of expired `shared_links` | `migrations/008` |
| DATA-P2-2 | No partial index on non-completed evaluations | `migrations/029` |
| DATA-P2-3 | `credit_transactions` has RLS but no explicit policy | `migrations/020:21-22` |
| DATA-P2-4 | `data-export` selects non-existent columns (see also SEC-P1-5) | `data-export/index.ts:99-114` |
| DATA-P2-5 | Monthly usage reset has no cron job scheduled | `migrations/005`, `006` |
| DATA-P2-6 | `resin_catalog` migration 010 inserts into wrong table schema | `migrations/010` |
| DATA-P2-7 | No UNIQUE constraint on `referral_conversions.referred_id` | `migrations/030:13` |

---

### 6. Build, Deploy & Infra (5 P0, 9 P1, 8 P2)

#### P0

| # | Title | File | Impact |
|---|-------|------|--------|
| INFRA-P0-1 | CI build fails — missing GITHUB_TOKEN for @parisgroup-ai/pageshell | `.github/workflows/test.yml`, `.npmrc` | Entire CI pipeline non-functional |
| INFRA-P0-2 | Dual CSP headers — conflicting policies break Stripe, Sentry, PostHog | `index.html:6`, `vercel.json:19` | Payment flow, error reporting, analytics all potentially blocked |
| INFRA-P0-3 | Sitemap uses wrong domain (`auria.dental` instead of `tosmile.ai`) | `public/sitemap.xml` | SEO completely broken |
| INFRA-P0-4 | Missing `og-image.png` — social share image 404 | `index.html:15,19` | WhatsApp/social shares show no preview image |
| INFRA-P0-5 | `robots.txt` has no Disallow rules — protected routes get indexed | `public/robots.txt` | Google indexes protected pages as thin content |

#### P1

| # | Title | File |
|---|-------|------|
| INFRA-P1-1 | No service worker — PWA install prompt will not trigger | `manifest.json` |
| INFRA-P1-2 | `theme_color` mismatch between `index.html` and `manifest.json` | `index.html:27`, `manifest.json:16` |
| INFRA-P1-3 | No Node version pinning (`.nvmrc` / `.node-version`) | Project root |
| INFRA-P1-4 | Test coverage thresholds very low (22% statements for clinical app) | `vitest.config.ts:27-32` |
| INFRA-P1-5 | E2E tests silently skipped in CI when secrets not configured | `.github/workflows/test.yml:151-203` |
| INFRA-P1-6 | `VITE_SUPABASE_PROJECT_ID` in .env.example but unused; PostHog vars bypass validation | `.env.example`, `env.ts` |
| INFRA-P1-7 | `VITE_STRIPE_PUBLISHABLE_KEY` defaults to empty string — silent payment failure | `env.ts:7` |
| INFRA-P1-8 | `chunkSizeWarningLimit` raised to 600KB — suppresses warnings | `vite.config.ts:79` |
| INFRA-P1-9 | No Vercel caching headers for static files beyond `/assets/` | `vercel.json:24-29` |

#### P2

| # | Title | File |
|---|-------|------|
| INFRA-P2-1 | No `.gitignore` exception for PNG icons (fragile) | `.gitignore:48` |
| INFRA-P2-2 | React version mismatch: `domain-odonto-ai` has React 19 devDeps | `packages/domain-odonto-ai/package.json` |
| INFRA-P2-3 | CSP includes `generativelanguage.googleapis.com` in connect-src (may be unused client-side) | `vercel.json:19` |
| INFRA-P2-4 | Security audit uses `audit-level=high` — misses medium CVEs | `.github/workflows/test.yml:30` |
| INFRA-P2-5 | No Dependabot or Renovate configuration | Missing `.github/dependabot.yml` |
| INFRA-P2-6 | Vercel preview domains in production CSP | `index.html:6` |
| INFRA-P2-7 | No source maps upload to Sentry | `vite.config.ts` |
| INFRA-P2-8 | Playwright E2E uses dev server instead of production build | `playwright.config.ts:43` |

---

## Positive Observations

The audit also identified significant strengths across all areas:

**Security:** PHI encryption with Supabase Vault, Stripe webhook signature verification, EXIF GPS stripping, open redirect prevention, MFA enabled, prompt injection sanitization, comprehensive security headers in vercel.json.

**Error Handling:** Credit refunds on AI call failure, Error Boundaries with Sentry reporting, `withQuery`/`withMutation` wrappers, `lazyRetry` for stale deploy chunk errors, offline detection.

**Clinical:** Strong prompt engineering with detailed clinical rules, multi-model fallback chain, tool-calling for resin recommendations, contralateral tooth lookup, DSD post-processing safety nets.

**UX:** Comprehensive empty states on list pages, draft persistence with restore modal, AI disclaimer modal with mandatory acceptance, onboarding flow, HEIC support for iOS, i18n coverage.

**Data:** Atomic credit system with idempotency, RLS on most tables, PHI encryption migration path, session-based evaluation grouping.

**Infra:** Sentry with session replay, Web Vitals tracking, lazy routes with code splitting, Zod env validation, PostHog LGPD-compliant analytics.

---

*Design: [[2026-02-23-production-readiness-design.md]]*
*Related: [[2026-02-18-dsd-quality-audit.md]], [[2026-02-23-clinical-qa-fixes.md]]*
