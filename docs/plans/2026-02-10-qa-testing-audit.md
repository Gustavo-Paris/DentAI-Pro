---
title: "QA & Testing Audit — AURIA Platform"
created: 2026-02-10
updated: 2026-02-10
status: draft
author: QA Engineer Agent
tags:
  - type/audit
  - area/qa
  - area/testing
  - status/draft
related:
  - "[[2026-02-08-comprehensive-audit-design]]"
  - "[[2026-02-08-e2e-qa-report]]"
---

# QA & Testing Audit — AURIA Platform

## Executive Summary

| Area | Grade | Notes |
|------|-------|-------|
| **Unit Tests** | **B** | 295 tests, all passing. Good coverage of utilities and schemas. Major gaps in domain hooks and pages. |
| **Integration Tests** | **D** | No integration tests exist. No Supabase mock client, no data layer tests. |
| **E2E Tests** | **F** | No E2E test framework installed (no Cypress, Playwright, or similar). |
| **Error Handling** | **B+** | Edge functions have comprehensive try/catch. Credit refund on errors implemented. ErrorBoundary with Sentry integration exists. |
| **Monitoring** | **B-** | Sentry integrated for error tracking. Web Vitals tracked. No structured alerting, no edge function monitoring dashboard. |

**Overall Platform Risk: MEDIUM.** The codebase has solid foundational testing for utilities, validation schemas, and error handling patterns. However, the most critical user flows (wizard, AI photo analysis, DSD generation) have zero automated test coverage. The testing pyramid is inverted: there is no E2E or integration layer, and unit tests primarily cover leaf utilities rather than the integration-heavy domain logic where most bugs occur.

---

## 1. Test Coverage Inventory

### 1.1 Test Files Map

**28 test files** found, all in `apps/web/src/`:

| Area | File | Tests | Quality |
|------|------|-------|---------|
| **Components (6 files)** | | | |
| `components/__tests__/CookieConsent.test.tsx` | 6 | Good: tests behavior (show/hide, localStorage) |
| `components/__tests__/ProtectedRoute.test.tsx` | 3 | Good: tests auth states (loading, authenticated, redirect) |
| `components/__tests__/ThemeProvider.test.tsx` | 2 | Basic: tests rendering and prop passing |
| `components/__tests__/ThemeToggle.test.tsx` | 7 | Good: tests cycling, icons, aria-labels |
| `components/__tests__/ErrorBoundary.test.tsx` | 4 | Good: tests error capture, Sentry reporting, recovery UI |
| **Hooks (5 files)** | | | |
| `hooks/__tests__/useAuthenticatedFetch.test.ts` | 9 | Excellent: tests session, retry, refresh, timing, errors |
| `hooks/__tests__/useEvaluations.test.ts` | 9 | Moderate: tests extracted groupBySession logic, not the hook itself |
| `hooks/__tests__/useSignedUrl.test.ts` | 5 | Basic: only tests THUMBNAIL_PRESETS constants, not URL generation |
| `hooks/__tests__/useSubscription.test.ts` | 16 | Good: tests formatPrice, formatCredits, credit calculations |
| `hooks/__tests__/useWizardDraft.test.ts` | 5 | Moderate: tests extracted expiry logic, not the hook itself |
| **Lib (11 files)** | | | |
| `lib/__tests__/auth.test.ts` | 28 | Excellent: tests login/register/reset schemas, password rules |
| `lib/__tests__/dateUtils.test.ts` | 12 | Good: tests calculateAge, formatDateBR, toISODateString |
| `lib/__tests__/env.test.ts` | 6 | Good: tests env schema validation |
| `lib/__tests__/errorHandler.test.ts` | 20 | Excellent: tests handleError, handleApiError, handleSupabaseError, withErrorHandler |
| `lib/__tests__/utils.test.ts` | 6 | Good: tests cn() class merger |
| `lib/__tests__/vitaShadeColors.test.ts` | 16 | Good: tests shade map, lookup, gradient, contrast |
| `lib/__tests__/webVitals.test.ts` | 5 | Good: tests measureFlow, trackTiming, cleanup |
| `lib/__tests__/branding.test.ts` | 3 | Basic: tests BRAND_NAME constant |
| `lib/__tests__/logger.test.ts` | 3 | Basic: tests logger method existence |
| `lib/__tests__/evaluation.test.ts` | 44 | Excellent: comprehensive schema validation tests |
| `lib/__tests__/validation.test.ts` | 34 | Excellent: tests server-side validation (shared with edge functions) |
| **Pages (6 files)** | | | |
| `pages/__tests__/Inventory.csv.test.ts` | 13 | Good: tests CSV export/import/matching logic |
| `pages/__tests__/Login.error.test.ts` | 6 | Moderate: tests extracted error classification, not Login component |
| `pages/__tests__/NotFound.test.tsx` | 3 | Good: tests rendering, i18n, link navigation |
| `pages/__tests__/Patients.filter.test.ts` | 9 | Good: tests filter logic across name/phone/email |
| `pages/__tests__/Dashboard.credits.test.ts` | 12 | Good: tests banner visibility and pluralization |
| `pages/__tests__/SharedEvaluation.test.ts` | 8 | Good: tests treatment labels, expiry, statistics |
| **Other** | | | |
| `test/example.test.ts` | 1 | Placeholder: `expect(true).toBe(true)` |

**Total: 295 tests, 28 files, all passing (3.19s)**

### 1.2 Coverage Matrix by Area

| Area | Total Files | Tested Files | Approx. Coverage | Risk Level |
|------|-------------|-------------|------------------|------------|
| **Pages** | 19 | 6 (logic only) | ~15% | **CRITICAL** |
| **Components** | 28 | 5 | ~18% | HIGH |
| **Hooks (general)** | 9 | 5 (3 partial) | ~35% | HIGH |
| **Hooks (domain)** | 11 | 0 | **0%** | **CRITICAL** |
| **Data layer** | 11 | 0 | **0%** | **CRITICAL** |
| **Lib/Utilities** | 17 | 11 | ~65% | LOW |
| **Schemas** | 2 | 2 | ~95% | LOW |
| **Contexts** | 1 | 0 | **0%** | HIGH |
| **Edge Functions** | 10 | 0 (server-side) | **0%** | **CRITICAL** |
| **Shared (_shared/)** | 16 | 1 (via validation) | ~6% | HIGH |

### 1.3 Critical Untested Files

**Domain Hooks (0% coverage) -- HIGHEST RISK:**
- `apps/web/src/hooks/domain/useWizardFlow.ts` -- Core wizard orchestration
- `apps/web/src/hooks/domain/useEvaluationDetail.ts` -- Evaluation data loading
- `apps/web/src/hooks/domain/useResult.ts` -- Result display logic
- `apps/web/src/hooks/domain/useInventoryManagement.ts` -- Inventory CRUD
- `apps/web/src/hooks/domain/usePatientProfile.ts` -- Patient data
- `apps/web/src/hooks/domain/usePatientList.ts` -- Patient listing/filtering
- `apps/web/src/hooks/domain/useDashboard.ts` -- Dashboard aggregations
- `apps/web/src/hooks/domain/useEvaluationSessions.ts` -- Session management
- `apps/web/src/hooks/domain/useProfile.ts` -- User profile
- `apps/web/src/hooks/domain/useOnboardingProgress.ts` -- Onboarding state

**Data Layer (0% coverage) -- HIGH RISK:**
- `apps/web/src/data/evaluations.ts` -- Evaluation CRUD (touches patient data)
- `apps/web/src/data/patients.ts` -- Patient data operations
- `apps/web/src/data/subscriptions.ts` -- Subscription queries
- `apps/web/src/data/inventory.ts` -- Inventory operations
- `apps/web/src/data/payments.ts` -- Payment history
- `apps/web/src/data/profiles.ts` -- Profile queries
- `apps/web/src/data/credit-usage.ts` -- Credit usage tracking
- `apps/web/src/data/drafts.ts` -- Draft persistence

**Critical Pages (no component/integration tests):**
- `apps/web/src/pages/NewCase.tsx` -- Wizard entry point (most complex page)
- `apps/web/src/pages/EvaluationDetails.tsx` -- Evaluation result display
- `apps/web/src/pages/Result.tsx` -- AI recommendation results
- `apps/web/src/pages/Dashboard.tsx` -- Main dashboard
- `apps/web/src/pages/Inventory.tsx` -- Inventory management

**Critical Components (no tests):**
- `apps/web/src/components/PhotoUploader.tsx` -- Image upload/capture (touches AI)
- `apps/web/src/components/StratificationProtocol.tsx` -- Clinical protocol display
- `apps/web/src/components/DSDPreviewModal.tsx` -- DSD simulation viewer
- `apps/web/src/components/AddTeethModal.tsx` -- Multi-tooth selection
- `apps/web/src/components/CreditConfirmDialog.tsx` -- Credit consumption confirmation
- `apps/web/src/components/AppLayout.tsx` -- Main layout shell

**Untested Lib Files:**
- `apps/web/src/lib/retry.ts` -- Retry with exponential backoff (network resilience)
- `apps/web/src/lib/generatePDF.ts` -- PDF report generation
- `apps/web/src/lib/complexity-score.ts` -- Clinical complexity scoring
- `apps/web/src/lib/confidence-config.ts` -- AI confidence thresholds
- `apps/web/src/lib/imageUtils.ts` -- Image processing utilities
- `apps/web/src/lib/treatment-config.ts` -- Treatment type configuration
- `apps/web/src/lib/compositeTeeth.ts` -- Tooth mapping/grouping
- `apps/web/src/lib/i18n.ts` -- Internationalization

---

## 2. Test Quality Assessment

### 2.1 Strengths

1. **Schema validation is comprehensive.** `auth.test.ts` (28 tests) and `evaluation.test.ts` (44 tests) thoroughly cover Zod schemas for login, registration, password complexity, and clinical data forms. These prevent invalid data from reaching the backend.

2. **Server-side validation tested from frontend.** `validation.test.ts` (34 tests) imports and tests the shared edge function validation module (`supabase/functions/_shared/validation.ts`), providing cross-boundary validation assurance.

3. **Error handling well-tested.** `errorHandler.test.ts` (20 tests) covers error classification, toast display, network errors, JWT expiry, and the `withErrorHandler` wrapper. This is a strong safety net.

4. **Auth flow hook tested.** `useAuthenticatedFetch.test.ts` (9 tests) tests session management, 401 retry, token refresh, timing tracking, and network errors. This is the most complex hook test in the codebase.

5. **Mocking patterns are consistent.** Tests consistently mock `@sentry/react`, `sonner`, shadcn components, and `lucide-react`. This pattern is reusable for new tests.

### 2.2 Weaknesses

1. **Most "hook tests" test extracted logic, not hooks.** `useEvaluations.test.ts`, `useWizardDraft.test.ts`, `useSubscription.test.ts` -- these re-implement internal functions to test them, rather than testing the actual hook behavior with `renderHook()`. This means the integration between the function logic and React state/effects is untested.

2. **Most "page tests" test extracted logic, not pages.** `Patients.filter.test.ts`, `Dashboard.credits.test.ts`, `Login.error.test.ts`, `SharedEvaluation.test.ts` -- these re-implement filtering, banner visibility, and error classification logic inline, rather than rendering the actual page components. The actual pages themselves are never rendered in tests.

3. **No data layer tests.** The `apps/web/src/data/` directory contains 11 files with Supabase queries, CRUD operations, and data transformations. Zero of these are tested. Any change to a query or data shape is invisible to the test suite.

4. **No context tests.** `AuthContext.tsx` (the sole React context) is tested only indirectly through `ProtectedRoute.test.tsx`. Its initialization, sign-in/sign-out flows, and token refresh behavior are untested.

5. **Placeholder test exists.** `test/example.test.ts` contains only `expect(true).toBe(true)` and should be removed or replaced.

---

## 3. Error Handling Audit

### 3.1 Edge Functions Error Handling

#### `recommend-resin` (`supabase/functions/recommend-resin/index.ts`)
- **Auth validation**: Checks Bearer token, validates JWT claims. Returns 401 on failure.
- **Rate limiting**: AI_LIGHT limits (20/min, 100/hour, 500/day). Returns 429 with retry headers.
- **Input validation**: Uses `validateEvaluationData()` with strict schema. Returns 400 on failure.
- **Ownership check**: Verifies `userId` matches evaluation owner. Returns 403.
- **Gemini error handling**: Catches `GeminiError` separately for 429 vs other errors. Returns appropriate status.
- **JSON parse safety**: Double-try with fallback regex extraction. Returns 500 on parse failure.
- **Protocol validation**: Checks for empty protocol layers/checklist after AI call.
- **Catch-all**: Top-level try/catch returns 500 with request ID for tracing.
- **ISSUE: No credit refund.** Unlike `analyze-dental-photo`, this function does NOT refund credits on 500 errors. However, `recommend-resin` does not consume credits (it is a lighter operation), so this is acceptable.
- **ISSUE: `console.error` used instead of `logger.error`** at line 649 for database save errors.

#### `recommend-cementation` (`supabase/functions/recommend-cementation/index.ts`)
- **Auth validation**: Checks Bearer token, validates via `supabase.auth.getUser()`. Returns 401.
- **Rate limiting**: AI_LIGHT limits. Returns 429.
- **Input validation**: Custom `validateRequest()` function. Less comprehensive than `validateEvaluationData`.
- **Ownership check**: Verifies evaluation ownership via DB query. Returns 403.
- **Gemini error handling**: Same pattern as recommend-resin.
- **ISSUE: DB update error silently swallowed.** Line 353: `if (updateError) { console.error("Update error:", updateError); }` -- the function still returns success even if the DB update fails. The user sees a protocol that was never saved.
- **ISSUE: `req.json()` not wrapped in try/catch.** If the request body is not valid JSON, the function will throw an unhandled exception caught only by the top-level catch.

#### `analyze-dental-photo` (`supabase/functions/analyze-dental-photo/index.ts`)
- **Auth validation**: JWT claims verification. Returns 401.
- **Rate limiting**: AI_HEAVY limits (10/min, 50/hour, 200/day). Applied BEFORE credit consumption.
- **Credit management**: Credits consumed atomically. Refunded on Gemini 429, AI errors, and top-level catch. This is the best-implemented credit flow.
- **Input validation**: Image format validation with magic bytes check (JPEG/PNG/WEBP). Size limit 10MB.
- **Base64 validation**: Regex check for valid base64 characters.
- **Treatment normalization**: Maps English Gemini responses to Portuguese enums.
- **Post-processing**: Deduplication of detected teeth, upper/lower arch filtering, Black classification removal for aesthetic cases, priority sorting.
- **ISSUE: No timeout on Gemini call.** The Gemini vision call has no explicit timeout configured, unlike `generate-dsd` which uses `SIMULATION_TIMEOUT = 55_000`.

#### `generate-dsd` (`supabase/functions/generate-dsd/index.ts`)
- **Auth validation**: Token-based via `supabase.auth.getUser()`. Returns 401.
- **Rate limiting**: AI_HEAVY limits. Returns 429.
- **Credit management**: Credits consumed with follow-up call bypass (regeneration skips credit check if evaluation already has analysis). Refunded on analysis failure and top-level catch.
- **Input validation**: `validateRequest()` with base64 pattern check, tooth shape validation, additional photos parsing, patient preferences parsing, clinical context parsing.
- **Ownership verification**: Done BEFORE credit consumption (good pattern).
- **Post-processing safety nets**: 5 layers of AI output correction:
  1. Visagism reset without face photo
  2. Gengivoplastia removal for low smile line
  3. Gengivoplastia removal for overbite suspicion
  4. Treatment suggestion consistency checks
  5. Destructive change filtering for simulation
- **Simulation failure non-fatal**: If simulation generation fails, analysis is still returned.
- **ISSUE: Image upload errors return null silently.** The `generateSimulation()` function returns `null` on upload errors, which is handled gracefully, but the user is not informed that the simulation was not generated.

#### `stripe-webhook` (`supabase/functions/stripe-webhook/index.ts`)
- **Signature verification**: Uses `stripe.webhooks.constructEvent()`. Returns 400 on failure.
- **Secret validation**: Rejects all webhooks if `STRIPE_WEBHOOK_SECRET` is not configured. Returns 503.
- **Idempotency**: Invoice paid uses upsert with `stripe_invoice_id` conflict. Checkout uses upsert with `user_id` conflict. Credit pack uses upsert with `stripe_session_id` conflict.
- **Error isolation**: Each event handler has internal error logging. Top-level catch returns 500.
- **ISSUE: Credit pack non-null assertion.** Line 329: `session.metadata!.supabase_user_id` -- if metadata is missing, this will crash. Should have null check.
- **ISSUE: `handleInvoiceFailed` does not check for upsert errors** on the `payment_history` insert.

#### `health-check` (`supabase/functions/health-check/index.ts`)
- **Minimal**: Tests DB connectivity with `profiles.select("id").limit(1)`.
- **Returns 503** on degraded state. Includes latency measurement.
- **ISSUE: CORS is `*`** for health check, which is acceptable but inconsistent with other functions that use origin-restricted CORS.

### 3.2 Frontend Error Handling

#### ErrorBoundary (`apps/web/src/components/ErrorBoundary.tsx`)
- Catches React rendering errors, reports to Sentry with component stack.
- Shows user-friendly error UI in Portuguese with reload and home buttons.
- **Wrapped around**: `<App />` in `main.tsx`.
- **Tested**: 4 tests covering normal rendering, error capture, Sentry reporting, and recovery buttons.

#### Error Handler (`apps/web/src/lib/errorHandler.ts`)
- Maps database error codes (23505 duplicate, 23503 reference) to Portuguese messages.
- Maps auth errors (invalid_credentials, email_not_confirmed) to Portuguese messages.
- Detects network errors, JWT expiry, and duplicate key violations from message strings.
- Shows toast notifications via `sonner`.
- Provides `withErrorHandler()` wrapper for async operations.
- **Well-tested**: 20 tests.

#### Missing Frontend Error Handling
- **No offline detection in wizard.** `useOnlineStatus.ts` exists but is only used in `OfflineBanner.tsx`. If a user goes offline mid-wizard-step, the AI call will fail silently with a generic error.
- **No session expiry handling in wizard.** The wizard can take 5-10 minutes. If the session expires during this time, the next API call fails with a generic auth error. `useAuthenticatedFetch` does proactive refresh (tested), but only when `expires_at` is within 60 seconds.
- **No file upload retry.** `PhotoUploader.tsx` does not appear to use the `retry.ts` utility for image uploads.

---

## 4. Edge Cases & Reliability Gaps

### 4.1 Race Conditions

| Scenario | Status | Risk |
|----------|--------|------|
| Concurrent `recommend-resin` calls for same evaluation | **UNPROTECTED** -- Two calls could overwrite each other's results | Medium |
| Double-click on "Analyze" button | Frontend likely has loading state, but no server-side dedup beyond credit idempotency | Low |
| Credit consumption during concurrent requests | **PROTECTED** -- `use_credits` RPC uses `SELECT FOR UPDATE` | Low |
| Rate limit check-then-update | **PARTIALLY PROTECTED** -- fetch-then-upsert pattern could have TOCTOU window | Low |

### 4.2 Network Failure Handling

| Scenario | Status | Notes |
|----------|--------|-------|
| `fetch` network error | **HANDLED** -- `useAuthenticatedFetch` returns error, `errorHandler` shows toast | OK |
| Gemini API timeout | **PARTIALLY HANDLED** -- Only `generate-dsd` has explicit timeout (55s). Others rely on Deno's default. | Medium risk |
| Supabase connection failure | **HANDLED** -- Rate limiter and credit system fail-closed on DB errors | OK |
| Image upload failure (storage) | **HANDLED** -- `generateSimulation` returns null, analysis still returned | OK but silent |

### 4.3 Session Expiration

| Scenario | Status | Notes |
|----------|--------|-------|
| Session expires during wizard flow | **PARTIALLY HANDLED** -- `useAuthenticatedFetch` refreshes within 60s of expiry, retries on 401 | Medium risk: long flows may lose state |
| Session expires during DSD generation (up to 55s) | **UNHANDLED** -- If session expires between credit consumption and completion, no recovery | Low risk |
| Concurrent tabs invalidating session | **UNHANDLED** -- No cross-tab session sync | Low risk |

### 4.4 File Upload Edge Cases

| Scenario | Status | Notes |
|----------|--------|-------|
| Image > 10MB | **HANDLED** -- Server-side check in `analyze-dental-photo` | OK |
| Invalid image format | **HANDLED** -- Magic bytes validation (JPEG/PNG/WEBP only) | OK |
| Corrupted base64 data | **HANDLED** -- Regex check for valid base64 characters | OK |
| Camera permission denied | Depends on `PhotoUploader.tsx` implementation (untested) | Unknown |
| Upload interrupted | No retry mechanism visible | Medium risk |

### 4.5 Gemini API Reliability

| Scenario | Status | Notes |
|----------|--------|-------|
| Empty response from Gemini | **HANDLED** -- Checked in all edge functions | OK |
| Non-JSON response from Gemini | **HANDLED** -- Fallback regex extraction in `recommend-resin`, function call extraction in others | OK |
| 429 rate limit from Gemini | **HANDLED** -- All functions return 429 with RATE_LIMITED code, credits refunded | OK |
| English enum values from Gemini | **HANDLED** -- `normalizeTreatmentIndication()` in `analyze-dental-photo` maps English to Portuguese | OK |
| Incorrect shade values from Gemini | **HANDLED** -- Batch shade validation against `resin_catalog` in `recommend-resin` with automatic substitution | OK |
| Hallucinated product names | **PARTIALLY HANDLED** -- Post-AI inventory validation in `recommend-resin` with fallback | OK |
| Function call not returned | **HANDLED** -- Fallback to JSON extraction from text response | OK |

---

## 5. Data Validation Report

### 5.1 Client-Side Validation

| Form/Input | Schema | Coverage | Notes |
|------------|--------|----------|-------|
| Login form | `loginSchema` (Zod) | Tested (5 tests) | Email format, required fields, length limits |
| Register form | `registerSchema` (Zod) | Tested (11 tests) | Password complexity (12 chars, upper, lower, number, special), terms acceptance |
| Forgot password | `forgotPasswordSchema` (Zod) | Tested (2 tests) | Email validation |
| Reset password | `resetPasswordSchema` (Zod) | Tested (3 tests) | Password match, complexity |
| Evaluation form | `reviewFormSchema` (Zod) | Tested (44 tests) | Age bounds (0-120), tooth region, restoration size, cavity class, aesthetic level, budget, treatment type, clinical notes length |
| Patient preferences | `patientPreferencesSchema` (Zod) | Tested (4 tests) | Aesthetic goals length limit (500) |
| Environment variables | `envSchema` (Zod) | Tested (6 tests) | SUPABASE_URL as URL, required keys |

### 5.2 Server-Side Validation

| Edge Function | Validation | Coverage | Notes |
|---------------|-----------|----------|-------|
| `recommend-resin` | `validateEvaluationData()` | Tested (34 tests via validation.test.ts) | UUID, FDI tooth, VITA shade, enums, string lengths |
| `recommend-cementation` | Custom `validateRequest()` | **NOT tested** | Basic type checks only, no FDI/VITA validation |
| `analyze-dental-photo` | `validateImageRequest()` + magic bytes | **NOT tested** | Image format, type whitelist, size check |
| `generate-dsd` | Custom `validateRequest()` | **NOT tested** | Base64 pattern, tooth shape enum, additional photos parsing |
| `stripe-webhook` | Stripe signature verification | **NOT tested** | Cryptographic signature check |

### 5.3 Prompt Injection Defense

- `sanitizeForPrompt()` in `supabase/functions/_shared/validation.ts` strips:
  - Markdown system/instruction blocks
  - Role override patterns (system:, assistant:, etc.)
  - "Ignore previous instructions" patterns
  - "You are now" / "act as" patterns
  - XML/HTML injection tags
- Applied to `clinicalNotes`, `aestheticGoals` in `recommend-resin`
- Applied to `aestheticGoals` in `recommend-cementation`
- Applied to `patientPreferences.aestheticGoals`, `clinicalObservations`, `clinicalTeethFindings` in `generate-dsd`
- **NOT tested in any test file.** The `sanitizeForPrompt` function is exported but never tested.

### 5.4 Type Safety at API Boundaries

- **Frontend-to-Edge**: Zod schemas on frontend match manual validation on backend, but schemas are NOT shared (dual maintenance risk). The `reviewFormSchema` in `apps/web/src/lib/schemas/evaluation.ts` and `validateEvaluationData` in `supabase/functions/_shared/validation.ts` must be kept in sync manually.
- **Edge-to-Gemini**: AI outputs are cast with `as unknown as` (e.g., `result.functionCall.args as unknown as PhotoAnalysisResult`). No runtime validation of AI response shapes.
- **Gemini-to-Database**: Recommendation objects are stored directly from AI output after partial validation (layers, checklist). Protocol shapes are enforced by TypeScript interfaces but not runtime validated.

---

## 6. Monitoring & Observability

### 6.1 Current State

| Layer | Tool | Status |
|-------|------|--------|
| Frontend errors | Sentry (`@sentry/react`) | Integrated in `main.tsx`, ErrorBoundary reports with component stack |
| Web Vitals | `web-vitals` + Sentry | LCP, INP, CLS, FCP, TTFB tracked. Custom `measureFlow` and `trackTiming` for edge function calls |
| Edge function logging | Custom `logger.ts` | Dev-only `log/info/debug`, always-on `warn/error/important`. No structured logging format. |
| Health check | `health-check` edge function | Tests DB connectivity with latency. No automated polling or alerting. |
| Payment tracking | Stripe webhooks | Events logged via `logger.important`. Idempotent recording. |
| Cookie consent | LGPD-compliant banner | Sentry consent integration detected |

### 6.2 Gaps

1. **No edge function error monitoring.** Edge function errors are logged to `console.error` but there is no Sentry SDK for Deno edge functions. Errors are only visible in Supabase dashboard logs.

2. **No alerting.** There are no automated alerts for:
   - High error rates on AI functions
   - Credit refund frequency (indicator of AI instability)
   - Rate limit hit frequency
   - Webhook processing failures
   - Health check failures

3. **No structured logging.** Edge functions use `console.log/warn/error` with string interpolation. No JSON-structured logs that could be queried or aggregated. Request IDs are generated but not consistently threaded through all log lines.

4. **No AI response quality monitoring.** There is no mechanism to track:
   - Gemini response times (only frontend `trackTiming` exists)
   - Response quality metrics (empty responses, parse failures)
   - Shade validation hit rate (how often does AI recommend invalid shades)
   - Treatment indication normalization frequency

5. **No user session tracking.** There is no mechanism to understand:
   - Wizard completion rate
   - Drop-off points in the flow
   - Time-to-completion for evaluations

---

## 7. Testing Strategy Roadmap

### 7.1 Testing Pyramid (Current vs Target)

```
Current:                         Target:

                                    /\
                                   /E2E\        ~10 tests
                                  /------\
                                 /Integr. \     ~40 tests
                                /----------\
   /\                          /   Unit      \  ~400 tests
  /  \   295 unit tests       /--------------\
 /----\
/      \  0 integration
--------  0 E2E
```

### 7.2 Priority Order

**Phase 1: Critical Safety Nets (Week 1-2)**
1. Test `sanitizeForPrompt()` -- prompt injection is a direct security risk
2. Test `retry.ts` -- network resilience is critical for AI-dependent flows
3. Test `complexity-score.ts` -- clinical accuracy depends on this
4. Test `confidence-config.ts` -- clinical decision thresholds
5. Add integration test for `useAuthenticatedFetch` + credit consumption flow

**Phase 2: Domain Logic (Week 3-4)**
6. Test `useWizardFlow.ts` with mocked Supabase
7. Test `useEvaluationDetail.ts` data transformation
8. Test `useResult.ts` result rendering logic
9. Test `useInventoryManagement.ts` CRUD operations
10. Test data layer (`data/evaluations.ts`, `data/patients.ts`)

**Phase 3: Component Integration (Week 5-6)**
11. Test `PhotoUploader.tsx` -- file selection, validation, upload flow
12. Test `CreditConfirmDialog.tsx` -- credit deduction confirmation
13. Test `StratificationProtocol.tsx` -- protocol rendering correctness
14. Test `AddTeethModal.tsx` -- multi-tooth selection

**Phase 4: E2E Setup (Week 7-8)**
15. Install Playwright
16. Write E2E for login/registration flow
17. Write E2E for complete wizard flow (with mocked AI)
18. Write E2E for inventory CSV import/export
19. Write E2E for DSD flow (with mocked AI)
20. Write E2E for payment/pricing flow

---

## 8. Critical Test Plan -- The 20 Tests That Catch 80% of Bugs

These are the highest-impact tests that would prevent the most production incidents, ordered by risk mitigation value:

### Security & Data Integrity (Tests 1-5)

1. **`sanitizeForPrompt` injection prevention**
   - File: `supabase/functions/_shared/validation.ts`
   - Test: Verify all injection patterns are stripped (system:, ignore previous, act as, XML tags)
   - Risk: Prompt injection could leak system prompts or generate harmful clinical advice

2. **Credit consumption atomicity**
   - File: `supabase/functions/_shared/credits.ts`
   - Test: Verify `checkAndUseCredits` is idempotent (same operationId does not double-charge)
   - Risk: Users charged twice for same operation

3. **Credit refund on all error paths**
   - File: `analyze-dental-photo/index.ts`, `generate-dsd/index.ts`
   - Test: Verify credits refunded on Gemini 429, AI error, parse error, and top-level catch
   - Risk: Users lose credits without receiving service

4. **Auth token validation in edge functions**
   - Files: All edge function `index.ts`
   - Test: Verify all functions reject missing/invalid/expired tokens
   - Risk: Unauthorized access to clinical data

5. **Evaluation ownership enforcement**
   - Files: `recommend-resin/index.ts`, `generate-dsd/index.ts`
   - Test: Verify user A cannot access user B's evaluations
   - Risk: HIPAA/LGPD violation -- cross-user data access

### Clinical Accuracy (Tests 6-10)

6. **Treatment indication normalization**
   - File: `analyze-dental-photo/index.ts`
   - Test: Verify English-to-Portuguese mapping for all treatment types + unknown fallback
   - Risk: Incorrect treatment type displayed to dentist

7. **VITA shade validation**
   - File: `supabase/functions/_shared/validation.ts`
   - Test: Verify all classic, bleach, and opaque shades accepted; invalid shades rejected
   - Risk: Invalid shade data corrupting clinical recommendations

8. **Shade correction in protocol layers**
   - File: `recommend-resin/index.ts`
   - Test: Verify that shades not found in resin_catalog are replaced with valid alternatives
   - Risk: Dentist uses non-existent shade, clinical error

9. **FDI tooth notation validation**
   - File: `supabase/functions/_shared/validation.ts`
   - Test: Verify only valid FDI teeth (11-18, 21-28, 31-38, 41-48) accepted
   - Risk: Invalid tooth numbers corrupt evaluation data

10. **Evaluation form schema validation**
    - File: `apps/web/src/lib/schemas/evaluation.ts`
    - Test: Verify patientAge bounds, enum values, treatment type defaults
    - Risk: Invalid data reaches AI, generating nonsensical recommendations

### Core Flow Reliability (Tests 11-15)

11. **Wizard draft expiry and recovery**
    - File: `apps/web/src/hooks/useWizardDraft.ts`
    - Test: Verify draft saves to localStorage/Supabase, expires after 7 days, recovers on page reload
    - Risk: User loses multi-step wizard progress

12. **Session refresh before expiry**
    - File: `apps/web/src/hooks/useAuthenticatedFetch.ts`
    - Test: Verify proactive refresh within 60s of expiry, 401 retry with new token
    - Risk: Auth failure during long flows (wizard, DSD)

13. **Retry with exponential backoff**
    - File: `apps/web/src/lib/retry.ts`
    - Test: Verify retry on network errors, 429, 5xx; no retry on 4xx; proper delay escalation
    - Risk: Transient failures become permanent failures for users

14. **Gemini response parsing fallback**
    - File: `recommend-resin/index.ts`
    - Test: Verify JSON extraction from markdown-fenced, raw JSON, and text-wrapped responses
    - Risk: Valid AI responses discarded due to format mismatch

15. **Rate limiting enforcement**
    - File: `supabase/functions/_shared/rateLimit.ts`
    - Test: Verify per-minute/hour/day limits, window reset, retry-after calculation
    - Risk: Abuse leading to excessive Gemini API costs

### User Experience (Tests 16-20)

16. **Error message mapping**
    - File: `apps/web/src/lib/errorHandler.ts`
    - Test: (Already tested -- 20 tests). Verify all database codes and network patterns map to Portuguese
    - Status: DONE

17. **CSV import/export round-trip**
    - File: `apps/web/src/pages/Inventory.tsx` logic
    - Test: (Already tested -- 13 tests). Verify CSV generation, parsing, catalog matching
    - Status: DONE

18. **Patient filter across fields**
    - File: `apps/web/src/pages/Patients.tsx` logic
    - Test: (Already tested -- 9 tests). Verify search across name, phone, email with null safety
    - Status: DONE

19. **DSD safety nets (gengivoplastia, visagism)**
    - File: `generate-dsd/index.ts`
    - Test: Verify gengivoplastia removed for low smile line and overbite, visagism reset without face photo
    - Risk: Clinically inappropriate suggestions displayed to dentist

20. **ErrorBoundary Sentry integration**
    - File: `apps/web/src/components/ErrorBoundary.tsx`
    - Test: (Already tested -- 4 tests). Verify error capture, Sentry reporting, recovery UI
    - Status: DONE

**Summary: 12 of 20 critical tests need to be written. 8 already exist.**

---

## 9. CI/CD Pipeline Assessment

### 9.1 Current Pipeline

File: `.github/workflows/test.yml`

| Job | What It Does | Grade |
|-----|-------------|-------|
| `lint` | `pnpm turbo run lint` | OK |
| `typecheck` | `pnpm turbo run type-check` | OK |
| `test` | `pnpm turbo run test` with coverage upload | OK |
| `build` | Production build + bundle size check (2MB limit) | Good |

**Pipeline triggers**: Push to `main`, PR to `main`.

### 9.2 Pipeline Strengths
- Build blocks on lint + typecheck + test success (proper dependency chain)
- Coverage reports uploaded as artifacts (14-day retention)
- Bundle size check prevents accidental bloat (2MB JS limit)
- Uses `pnpm --frozen-lockfile` for reproducible installs
- Proper env var placeholders for CI (no real secrets needed)

### 9.3 Pipeline Gaps

1. **No coverage threshold enforcement.** Coverage is collected but there is no minimum threshold. Tests could theoretically be deleted and CI would still pass.
   - **Recommendation**: Add `--coverage.thresholds.lines=50` (starting target) and increase over time.

2. **No edge function tests in CI.** The CI pipeline only runs `apps/web` tests. Edge functions in `supabase/functions/` have no test runner configured.
   - **Recommendation**: Add Deno test runner for `supabase/functions/_shared/` pure functions.

3. **No E2E test job.** There is no E2E test execution in CI.
   - **Recommendation**: Add Playwright job triggered on PR to `main`, running against a preview deployment or local dev server.

4. **No Supabase migration testing.** Database migrations are not validated in CI.
   - **Recommendation**: Add `supabase db reset && supabase db push` step to verify migration integrity.

5. **No security scanning.** No dependency vulnerability scanning (e.g., `pnpm audit`) in CI.
   - **Recommendation**: Add `pnpm audit --audit-level=high` step.

6. **No branch protection enforcement visible.** While CI runs on PRs, there is no indication that branch protection rules require CI to pass before merge.

---

## 10. Appendix: Test Infrastructure

### 10.1 Vitest Configuration

File: `apps/web/vitest.config.ts`

```typescript
environment: "jsdom"
globals: true
setupFiles: ["./src/test/setup.ts"]
include: ["src/**/*.{test,spec}.{ts,tsx}"]
coverage:
  provider: "v8"
  reporter: ["text", "lcov", "json-summary"]
  include: ["src/**/*.{ts,tsx}"]
  exclude: ["src/test/**", "src/**/*.test.*", "src/components/ui/**", "src/integrations/supabase/types.ts"]
```

### 10.2 Test Setup

File: `apps/web/src/test/setup.ts`

```typescript
import "@testing-library/jest-dom";
// + matchMedia polyfill for jsdom
```

Minimal setup. No global mocks for Supabase, no test utilities, no fixtures.

### 10.3 Mocking Patterns

| Dependency | Mock Pattern | Used In |
|-----------|-------------|---------|
| `@sentry/react` | `vi.mock` with stub functions | CookieConsent, ErrorBoundary, webVitals |
| `lucide-react` | `vi.mock` with stub components | ProtectedRoute, ThemeToggle, ErrorBoundary, NotFound |
| `@/components/ui/*` | `vi.mock` with basic HTML elements | CookieConsent, ThemeToggle, ErrorBoundary |
| `next-themes` | `vi.mock` with controlled `useTheme` | ThemeProvider, ThemeToggle |
| `sonner` | `vi.mock` with `toast.error` spy | errorHandler |
| `@/lib/logger` | `vi.mock` with no-op functions | errorHandler, NotFound |
| `@/integrations/supabase/client` | `vi.mock` with controlled `invoke`/`getSession` | useAuthenticatedFetch |
| `@/contexts/AuthContext` | `vi.mock` with controlled `useAuth` | ProtectedRoute |
| `@/lib/webVitals` | `vi.mock` with stub `trackTiming` | useAuthenticatedFetch |

### 10.4 Missing Test Utilities

The following test utilities would accelerate test development:

1. **Supabase mock client factory** -- A reusable mock that simulates `supabase.from().select()`, `.insert()`, `.update()`, `.eq()` chains with configurable responses.
2. **Auth context wrapper** -- A test helper that wraps components in `AuthContext.Provider` with configurable user state.
3. **QueryClient wrapper** -- For testing hooks that use TanStack Query (all domain hooks).
4. **Edge function test harness** -- A Deno-compatible test runner that can simulate `req` objects and validate `Response` outputs.
5. **Fixture data factories** -- Reusable test data for evaluations, patients, resins, protocols, etc.

---

## 11. Key Recommendations Summary

### Immediate (This Week)
1. Write tests for `sanitizeForPrompt()` -- security risk
2. Write tests for `retry.ts` -- network resilience
3. Remove `test/example.test.ts` placeholder
4. Fix `console.error` usage in `recommend-cementation` line 353 (should be `logger.error`)
5. Wrap `req.json()` in try/catch in `recommend-cementation`

### Short-Term (2 Weeks)
6. Create Supabase mock client utility for data layer tests
7. Add coverage threshold to CI (start at 50% lines)
8. Add `pnpm audit` to CI pipeline
9. Test domain hooks with mocked Supabase (priority: `useWizardFlow`)
10. Add timeout to Gemini calls in `analyze-dental-photo`

### Medium-Term (1 Month)
11. Install Playwright and write first 5 E2E tests
12. Add Deno test runner for edge function shared modules
13. Implement structured JSON logging in edge functions
14. Add edge function error rate monitoring
15. Create test data factories for clinical data

### Long-Term (Quarter)
16. Achieve 70% unit test coverage across all areas
17. Implement contract tests between frontend schemas and backend validation
18. Add AI response quality monitoring dashboard
19. Implement wizard flow analytics (completion rate, drop-off points)
20. Add visual regression testing for clinical protocol displays

---

*This audit was generated on 2026-02-10 by the QA Engineer Agent based on a comprehensive review of 28 test files (295 tests), 10 edge functions, 16 shared modules, and the CI/CD pipeline configuration.*
