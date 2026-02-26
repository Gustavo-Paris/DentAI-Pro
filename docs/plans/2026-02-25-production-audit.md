---
title: Production Readiness Audit — ToSmile.ai / AURIA
created: 2026-02-25
updated: 2026-02-25
status: published
tags:
  - type/audit
  - status/published
---

# Production Readiness Audit

**Date**: 2026-02-25
**Scope**: Full-platform audit across 8 domains
**Method**: 8 parallel read-only agents, each specialized by domain
**Total Findings**: 116 (9 Critical, 37 High, 43 Medium, 27 Low)

---

## Executive Summary

The platform has strong foundations: PHI encryption, RLS on all tables, CSP headers, rate limiting, prompt injection sanitization, code splitting, Sentry integration, and comprehensive i18n structure. However, **9 Critical findings block production**, primarily around incomplete `recobrimento_radicular` support, a DB CHECK constraint that will reject gengivoplastia/root coverage writes, and committed credentials.

### Scorecard

| Domain | Score | Critical | High | Medium | Low |
|--------|-------|----------|------|--------|-----|
| Clinical Correctness | 4/10 | 3 | 7 | 7 | 3 |
| Database Integrity | 5/10 | 2 | 5 | 6 | 4 |
| CI/CD & Deploy | 5/10 | 2 | 6 | 6 | 3 |
| Security | 7/10 | 0 | 4 | 4 | 3 |
| Error Handling | 6/10 | 0 | 4 | 4 | 4 |
| Frontend UX/A11y | 6/10 | 0 | 5 | 8 | 4 |
| Test Coverage | 5/10 | 2 | 4 | 3 | 1 |
| Code Quality | 7/10 | 0 | 2 | 5 | 5 |
| **Overall** | **5.6/10** | **9** | **37** | **43** | **27** |

---

## CRITICAL — Must Fix Before Production

### C1. `treatment_type` CHECK Constraint Blocks Gengivoplastia/Root Coverage DB Writes
- **Domain**: Database
- **File**: `supabase/migrations/037_production_readiness.sql:166`
- **Impact**: Every INSERT with `treatment_type = 'gengivoplastia'` or `'recobrimento_radicular'` fails with PostgreSQL constraint violation (ERROR 23514). The wizard submit flow creates these — they silently fail at DB layer.
- **Fix**: New migration adding both values to the CHECK constraint.

### C2. `recobrimento_radicular` Missing from AddTeethModal Type System
- **Domain**: Clinical
- **Files**: `AddTeethModal.tsx:25` (TreatmentType union), `useEvaluationDetail.ts:107` (TREATMENT_LABEL_KEYS), `useEvaluationDetail.ts:505` (handleSubmitTeeth switch)
- **Impact**: Root coverage teeth added via "Add More Teeth" are silently cast to `'resina'`, producing a resin stratification protocol for a periodontal surgery. The switch has no `recobrimento_radicular` case — evaluations get no protocol.
- **Fix**: Add `recobrimento_radicular` to TreatmentType, TREATMENT_LABEL_KEYS, handleSubmitTeeth switch, AddTeethModal SelectItems, and stratification_needed guard.

### C3. Migration 010 Inserts Into Wrong Table Schema
- **Domain**: Database
- **File**: `supabase/migrations/010_bleached_teeth_resins.sql:4-18`
- **Impact**: Uses `resins` table column list against `resin_catalog` table. Fresh migration replay will fail. Later migrations (017/018) partially recover the data.
- **Fix**: Correct migration to target the right table schema, or add a compensating migration.

### C4. E2E Session Token + Credentials Committed to Repository
- **Domain**: Security / CI/CD
- **Files**: `apps/web/.env.e2e`, `apps/web/e2e/.auth/user.json`
- **Impact**: Live refresh token (`luuuxbj7h574`) + plaintext password in git-accessible files. Token grants authenticated access to production Supabase project.
- **Fix**: Revoke refresh token, rotate password, remove files, add to .gitignore, move E2E credentials to GitHub Actions secrets.

### C5. E2E Tests Never Run in CI
- **Domain**: Test Coverage / CI/CD
- **File**: `.github/workflows/test.yml:167-176`
- **Impact**: 5 E2E test files covering wizard submission, LGPD export, auth, and sharing are silently skipped when GitHub secrets are absent. Job exits 0 — no failure signal.
- **Fix**: Configure E2E secrets in GitHub Actions, or fail the job when secrets are missing.

---

## HIGH — Fix Before Launch

### H1. Stripe Webhook Returns 200 on DB Failure
- **Domain**: Error Handling
- **File**: `supabase/functions/stripe-webhook/index.ts:236-240`
- **Impact**: Subscription update/cancel/invoice DB write failures return 200 to Stripe. Stripe stops retrying. Database left in stale state — expired subscriptions keep working, or active ones appear cancelled.
- **Fix**: Throw on DB error so `withErrorBoundary` returns 500, triggering Stripe retry.

### H2. `generate-dsd` DB Write After Simulation Is Silently Swallowed
- **Domain**: Error Handling
- **File**: `supabase/functions/generate-dsd/index.ts:275-280`
- **Impact**: User pays credits, simulation generated + uploaded, but if DB write fails, result never appears in UI. No retry possible.
- **Fix**: Check `.error` on the update call; if failed, attempt retry or return error to client.

### H3. PHI Encryption Fails Open (Silent Fallback)
- **Domain**: Security / Database
- **File**: `supabase/migrations/015_phi_encryption_infra.sql:103-105`
- **Impact**: If vault key unavailable, trigger continues silently (`RAISE WARNING`). PHI stored as plaintext with no alert. Violates LGPD Art. 46.
- **Fix**: Change to `RAISE EXCEPTION` — fail the INSERT rather than store unencrypted PHI.

### H4. Session Token in localStorage (XSS-Accessible)
- **Domain**: Security
- **File**: `apps/web/src/integrations/supabase/client.ts:10-11`
- **Impact**: Any XSS vulnerability allows token exfiltration and full account takeover (PHI access, payments, edge functions).
- **Note**: Supabase's default pattern. Mitigated by CSP but not eliminated. Consider `pkce` flow with `cookie` storage when Supabase supports it.

### H5. `credit_pack_purchases` Has No INSERT RLS Policy for Service Role
- **Domain**: Database
- **File**: `supabase/migrations/012_credit_bonus_packs.sql:51-55`
- **Impact**: Stripe webhook cannot record credit pack purchases. Credits may still be granted (SECURITY DEFINER function) but audit log is empty.
- **Fix**: Add INSERT policy for service_role.

### H6. `RouteErrorBoundary` Does Not Reset on Navigation
- **Domain**: Error Handling
- **File**: `apps/web/src/App.tsx:146-164`
- **Impact**: A transient error permanently breaks a route for the user's session. Only a full page reload recovers.
- **Fix**: Add a `key` prop based on route path, or add `getDerivedStateFromProps` reset logic.

### H7. `invokeEdgeFunction` Does Not Extract Error Body
- **Domain**: Error Handling
- **File**: `apps/web/src/data/evaluations.ts:515-518`
- **Impact**: 402/429/500 all show generic "Erro ao adicionar dentes" instead of specific messages (insufficient credits, rate limited).
- **Fix**: Parse `error.context.json()` like `useAuthenticatedFetch` does.

### H8. Inventory Fetch Error Silently Swallowed in `recommend-resin`
- **Domain**: Error Handling
- **File**: `supabase/functions/recommend-resin/index.ts:103-105`
- **Impact**: DB error causes AI to recommend resins as if user has no inventory — possibly expensive brands the dentist doesn't stock.
- **Fix**: Return 500 on inventory error rather than proceeding with empty inventory.

### H9. Shade Validation — Enamel Blacklist Incomplete
- **Domain**: Clinical
- **File**: `supabase/functions/recommend-resin/shade-validation.ts:251`
- **Impact**: Missing `XLE`, `Trans20`, `Trans30`, `Trans`, `Opal` from enamel-shade blacklist. AI could use translucent enamel shades as dentina/corpo → hollow-looking restoration.
- **Fix**: Add missing shades to `enamelShadesList`.

### H10. Efeitos Incisais Auto-Injection Threshold Wrong
- **Domain**: Clinical
- **File**: `supabase/functions/recommend-resin/shade-validation.ts:451-455`
- **Impact**: Requires `>= 4` layers AFTER shade validation may have reduced count. Also `AESTHETIC_CLASSES` doesn't include `'classe i'`/`'classe ii'`.
- **Fix**: Lower threshold to `>= 3` or inject before shade validation; expand AESTHETIC_CLASSES.

### H11. Diastema Safety Net Strips Bilateral Cases at Low Confidence
- **Domain**: Clinical
- **File**: `supabase/functions/analyze-dental-photo/post-processing.ts:98-109`
- **Impact**: 2-tooth diastema with confidence < 65% (blurry photo) stripped entirely — genuine bilateral diastema missed.
- **Fix**: Add bilateral exception: if both 11+21 diagnosed, preserve regardless of confidence.

### H12. Lower-Tooth Filter Uses `>=` (Equal Counts Remove Lower Arch)
- **Domain**: Clinical
- **File**: `supabase/functions/analyze-dental-photo/post-processing.ts:146`
- **Impact**: Full-mouth photos with equal upper/lower findings → lower arch silently discarded.
- **Fix**: Change `>=` to `>`.

### H13. No Edge Function Deployment Automation
- **Domain**: CI/CD
- **Files**: No Supabase deploy workflow
- **Impact**: 14 edge functions deployed manually via `npx supabase functions deploy`. Risk of forgotten deploys, inconsistent versions.
- **Fix**: Add GitHub Actions workflow for sequential edge function deployment.

### H14. No Node.js Version Pinning
- **Domain**: CI/CD
- **File**: `.github/workflows/test.yml:22`
- **Impact**: `node-version: '20'` floats to latest 20.x patch. No `.nvmrc` for local parity.
- **Fix**: Add `.nvmrc` with exact version; reference it in CI.

### H15. Dead Code: `errorHandler.ts`, `compositeTeeth.ts`, `sanitizeForPrompt.ts` (Frontend)
- **Domain**: Code Quality
- **Files**: `apps/web/src/lib/errorHandler.ts`, `compositeTeeth.ts`, `sanitizeForPrompt.ts`
- **Impact**: ~400 lines of dead code shipping to production bundle. Misleading security posture (sanitizeForPrompt never called).
- **Fix**: Remove unused modules and their tests.

### H16. Duplicate `ProgressRing` — Dashboard Version Missing ARIA
- **Domain**: Code Quality
- **File**: `apps/web/src/pages/dashboard/StatsGrid.tsx:17`
- **Impact**: Local ProgressRing has no `role="progressbar"`, no ARIA attributes.
- **Fix**: Import canonical `@/components/ProgressRing` instead.

### H17. Clickable Cards Missing Keyboard Navigation (Mobile)
- **Domain**: Frontend/A11y
- **File**: `apps/web/src/components/evaluation/EvaluationCards.tsx:95-99`
- **Impact**: Keyboard users on mobile viewport cannot activate evaluation cards.
- **Fix**: Add `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space).

### H18. ProcessingOverlay Live Progress Silent to Screen Readers
- **Domain**: Frontend/A11y
- **File**: `apps/web/src/components/ProcessingOverlay.tsx:86-116`
- **Impact**: `aria-live` is on static "Do not close" text, not on changing step labels. 30-90s of silence.
- **Fix**: Move `aria-live="polite"` to the step label text element.

### H19. Priority Labels ("alta", "média") Untranslated
- **Domain**: Frontend/A11y
- **Files**: `AddTeethModal.tsx:205`, `ToothSelectionCard.tsx:131`
- **Impact**: English-locale users see raw Portuguese enum values.
- **Fix**: Add i18n keys for priority labels and use `t()`.

### H20. Pagination Keys Missing from i18n Files
- **Domain**: Frontend/A11y
- **File**: `apps/web/src/pages/Evaluations.tsx:339-355`
- **Impact**: Accent-stripped Portuguese fallback strings shown in both locales.
- **Fix**: Add `common.pageOf`, `common.previous`, `common.next` to both locale files.

### H21. Date Formatting Hardcoded to Portuguese Locale
- **Domain**: Frontend/A11y
- **Files**: 14 files across pages/ and components/
- **Impact**: English-locale users see "10 de fev." format everywhere.
- **Fix**: Create locale-aware date format helper using `i18n.language`.

---

## MEDIUM — Fix Soon After Launch (Selected)

| # | Finding | Domain | File |
|---|---------|--------|------|
| M1 | `evaluations_view_update()` COALESCE prevents setting fields to NULL | Database | `026_phi_drop_plaintext.sql:302` |
| M2 | Duplicate credit reset functions (006 vs 042) — double-reset risk | Database | `042_monthly_credit_reset.sql` |
| M3 | `getDashboardMetrics` fetches 5000 rows client-side | Database | `data/evaluations.ts:186` |
| M4 | Circuit breaker per-isolate — no real protection in production | Error | `_shared/circuit-breaker.ts` |
| M5 | `syncGroupProtocols` failure treated as non-critical | Error | `useEvaluationDetail.ts:621` |
| M6 | Partial failure in `handleRegenerateWithBudget` — misleading toast | Error | `useEvaluationDetail.ts:779` |
| M7 | `generate-dsd` aestheticGoals unbounded string length | Security | `generate-dsd/validation.ts:55` |
| M8 | `weekly-digest` trusts client-supplied statistics | Security | `send-email/index.ts:135` |
| M9 | `get_shared_dsd` returns storage path to unauthenticated callers | Security | `021_shared_dsd_data.sql:10` |
| M10 | Gengivoplasty keyword filter checks text not `treatment_indication` | Clinical | `useDSDIntegration.ts:49` |
| M11 | `inferCavityClass` returns unrecognized `'Reparo de Restauração'` | Clinical | `helpers.ts:36` |
| M12 | FLUX fallback contradicts documented "fail gracefully" decision | Clinical | `simulation.ts:435` |
| M13 | DSD error state uses `string.includes` for credit error detection | Frontend | `DSDErrorState.tsx:15` |
| M14 | Floating bar dismiss button 28px (below 44px minimum) | Frontend | `EvaluationDetails.tsx:201` |
| M15 | `AiDisclaimerModal` broken ARIA reference on enabled button | Frontend | `AiDisclaimerModal.tsx:98` |
| M16 | Patient edit dialog missing `DialogDescription` | Frontend | `PatientProfile.tsx:223` |
| M17 | Toast notifications no assertive ARIA for errors | Frontend | `ui/sonner.tsx` |
| M18 | ESLint `no-unused-vars` disabled — dead exports accumulate | Code Quality | `eslint.config.js:23` |
| M19 | `console.error` in webVitals.ts bypasses logger abstraction | Code Quality | `lib/webVitals.ts:92` |
| M20 | `DSDSimulationThumbnail` exported but never used | Code Quality | `OptimizedImage.tsx:129` |
| M21 | No Dependabot/Renovate for dependency updates | CI/CD | (missing) |
| M22 | No branch protection rules visible | CI/CD | (missing) |

---

## LOW — Backlog (Selected)

| # | Finding | Domain |
|---|---------|--------|
| L1 | CORS legacy domains (`dentai.pro`, `dentai-pro.vercel.app`) — remove if unused | Security |
| L2 | `health-check` base path unauthenticated | Security |
| L3 | `evaluation_drafts` UNIQUE(user_id) limits to 1 draft | Database |
| L4 | `can_use_credits()` non-atomic client-side check | Database |
| L5 | `@repo/logger` package unused by web app | Code Quality |
| L6 | Deprecated `normalizeTreatment` still called internally | Code Quality |
| L7 | `DSDWhiteningComparison` uses full ComparisonSliders for thumbnails | Code Quality |
| L8 | Dashboard chart silent on load error | Error |
| L9 | `updatePatientBirthDate` silently swallows write failure | Error |
| L10 | Referral code farming via mass account creation | Security |

---

## Architecture Strengths (Positive Findings)

The following are done well and should be preserved:

1. **Stripe webhook signature verification** — `constructEvent()` with crypto validation + idempotency
2. **Rate limiting fails closed** — returns denied on DB error
3. **Auth middleware checks deleted/banned users** — validates on every request
4. **Prompt injection sanitization** — covers EN/PT patterns on all user-controlled fields
5. **EXIF stripping + magic byte validation** — on all uploaded photos
6. **CORS origin allowlist** — explicit list, no wildcards, localhost only in dev
7. **RLS on all tables** — per-user scoping via `auth.uid()`
8. **PHI column-level encryption** — pgcrypto + Vault for patient PII
9. **Credit refund on AI failure** — all 4 AI functions refund on error
10. **Idempotent credit consumption** — `credit_transactions` prevents double-charge
11. **Code splitting** — all 13 protected pages lazy-loaded with stale-chunk resilience
12. **Sentry integration** — `browserTracingIntegration`, `replayIntegration`, error boundaries report
13. **Web Vitals monitoring** — LCP, INP, CLS, FCP, TTFB reported to Sentry
14. **TypeScript strict mode** — `strict: true`, `noImplicitAny`, `noUnusedLocals`, zero `@ts-ignore`
15. **React Query configuration** — no retry on 4xx, 2 retries with backoff for 5xx
16. **Skip-to-content link** — accessible navigation implemented
17. **Open redirect prevention** — success/cancel URLs validated against origin allowlist
18. **Edge function email redaction** — regex strips email addresses from all log output (LGPD)

---

## Recommended Fix Order

### Phase 1: Blockers (Before Production)
1. **C1** — DB CHECK constraint (new migration)
2. **C2** — `recobrimento_radicular` type system completeness
3. **C4** — Revoke E2E tokens, rotate password, gitignore
4. **H1** — Stripe webhook return 500 on DB error
5. **H3** — PHI encryption fail-closed
6. **H5** — `credit_pack_purchases` RLS INSERT policy

### Phase 2: Launch Quality (First Week)
7. **H2** — generate-dsd DB write error handling
8. **H6** — RouteErrorBoundary reset
9. **H7** — invokeEdgeFunction error body extraction
10. **H8** — Inventory fetch error handling
11. **H9-H12** — Clinical correctness (shade list, efeitos threshold, diastema, lower-tooth filter)
12. **H17-H21** — Frontend a11y (keyboard nav, ARIA, i18n)

### Phase 3: Hardening (First Month)
13. **C3** — Migration 010 fix
14. **C5** — E2E CI enablement
15. **H13-H14** — Deploy automation, Node version pinning
16. **H15-H16** — Dead code removal, ProgressRing dedup
17. All Medium findings

### Phase 4: Polish (Ongoing)
18. All Low findings
19. Test coverage improvement (raise thresholds)
20. Observability unification (Sentry ↔ edge function logs)

---

## Agent Reports (Source Data)

Each agent's full report is preserved in the conversation transcript. Summary:

| Agent | Findings | Key Critical |
|-------|----------|-------------|
| Database Integrity | 17 | CHECK constraint, migration 010 |
| Clinical Correctness | 20 | `recobrimento_radicular` 3-way gap |
| Security | 11 | E2E credentials, PHI fail-open |
| Error Handling | 12 | Stripe webhook 200, DSD DB write |
| CI/CD & Deploy | 17 | E2E skipped, no deploy automation |
| Test Coverage | 10 | Zero edge function tests, E2E never runs |
| Frontend UX/A11y | 17 | Keyboard nav, ARIA, i18n gaps |
| Code Quality | 12 | Dead code, duplicate ProgressRing |

---
*Audited by 8 parallel read-only agents. No files modified during audit.*
