---
title: "Production Audit 360° — AURIA / ToSmile.ai"
created: 2026-02-27
updated: 2026-02-27
status: published
tags:
  - type/audit
  - status/published
  - scope/full-app
related:
  - "[[2026-02-26-full-application-audit]]"
  - "[[2026-02-26-audit-action-plan]]"
  - "[[../06-ADRs/ADR-Index]]"
  - "[[../00-Index/Home]]"
---

# Production Audit 360° — AURIA / ToSmile.ai

> 8 parallel agents audited the entire application across all dimensions on 2026-02-27.
> Compared against the previous audit from 2026-02-26 (7.2/10).

## Overall Score: 7.8 / 10 (previous: 7.2 → delta: +0.6)

| # | Dimension | Score | Prev | Delta | Verdict |
|---|-----------|-------|------|-------|---------|
| 1 | **Security** | **8.3** | 8.1 | +0.2 | Strongest. PHI fail-closed, RLS hardened, Stripe re-validated |
| 2 | **Frontend UX/A11y** | **7.9** | 7.6 | +0.3 | Good. PageShell 100% on pages. Sub-component touch targets remain |
| 3 | **Clinical Correctness** | **7.8** | — | new | Strong prompts (8-9/10). `faceta_resina`/`coroa_parcial` gap |
| 4 | **Architecture** | **7.8** | 7.6 | +0.2 | Clean 3-layer. `useDSDStep` 1024 LOC is the main debt |
| 5 | **Performance/PWA** | **7.8** | 7.5 | +0.3 | Good splitting. Sentry Replay + both locales eager |
| 6 | **i18n** | **7.5** | 6.5 | +1.0 | Key parity perfect (1869/1869). Edge function errors still PT-only |
| 7 | **Code Quality** | **7.4** | 7.1 | +0.3 | 0 `any` in prod. Error classification duplicated 4x |
| 8 | **Testing** | **7.1** | 5.7 | +1.4 | Biggest jump. 1834 tests. 12/15 edge functions still untested |

---

## Total Findings: 118

| Severity | Count | Breakdown |
|----------|-------|-----------|
| **Critical** | 4 | 2 i18n, 2 Testing |
| **High** | 23 | 5 i18n, 6 Testing, 4 Code Quality, 3 Architecture, 2 Clinical, 2 Performance, 1 Security |
| **Medium** | 49 | across all dimensions |
| **Low** | 42 | across all dimensions |

---

## Top 15 Issues — Priority for Production

### Critical (must fix)

| ID | Dimension | Issue | Location |
|----|-----------|-------|----------|
| I18N-001 | i18n | 13 `ERROR_MESSAGES` hardcoded in Portuguese in edge functions — EN users see PT errors | `_shared/cors.ts:66-80` |
| I18N-002 | i18n | Client does `error.includes('Creditos insuficientes')` — fragile PT string matching | `DSDErrorState.tsx:15`, `credits.ts:234` |
| TEST-001 | Testing | 3 tests failing — `getDashboardMetrics` refactored to RPC but tests mock old pattern | `evaluations-integration.test.ts` |
| TEST-002 | Testing | `stripe-webhook` (477 LOC) has zero tests — core billing logic | `stripe-webhook/index.ts` |

### High (fix before launch)

| ID | Dimension | Issue | Location |
|----|-----------|-------|----------|
| CLIN-001 | Clinical | DSD prompt lists `faceta_resina`/`coroa_parcial` — no normalization, no dispatch, no protocol | `dsd-analysis.ts:383`, all normalization maps |
| CLIN-002 | Clinical | `dispatchTreatmentProtocol` has no `default` case — unknown types produce no protocol silently | `protocol-dispatch.ts:140-177` |
| SEC-001 | Security | E2E credentials in git history (password appears rotated) | git commit `08c73f9` |
| PERF-001 | Performance | Sentry Replay (~100KB) bundled eagerly — 90% of users don't use it | `main.tsx:19` |
| PERF-002 | Performance | Both i18n locales (220KB) statically imported — en-US unused by 95%+ users | `i18n.ts:3-4` |
| ARCH-001 | Architecture | `lib/protocol-dispatch.ts` imports from `hooks/` — dependency inversion | `protocol-dispatch.ts:15` |
| ARCH-002 | Architecture | `useDSDStep` is 1024 lines in `components/` — should be in `hooks/domain/` | `useDSDStep.ts` |
| CQ-001 | Code Quality | Error classification pattern duplicated in 4 catch blocks | `usePhotoAnalysis`, `useWizardSubmit`, `useDSDStep` |
| CQ-002 | Code Quality | `evalClients` adapter copy-pasted between 2 hooks | `useEvaluationActions`, `useAddTeethFlow` |
| I18N-003 | i18n | Portuguese clinical strings written to DB and shown in UI | `useWizardSubmit.ts:262-345` |
| I18N-005 | i18n | PDF confidence labels hardcoded PT — `t` function already available | `confidence-config.ts:33-61` |

---

## Dimension Reports

### 1. Security — 8.3/10

**11 findings** (0 Critical, 1 High, 6 Medium, 4 Low)

**Key findings:**
- SEC-001 (High): E2E credentials in git history — password rotated but history persists
- SEC-002 (Medium): `check-photo-quality` missing rate limiting
- SEC-005 (Medium): CSP `unsafe-inline` for styles still present
- SEC-004 (Medium): `evaluation_drafts.draft_data` PHI unencrypted

**Strengths:** Robust RLS, atomic credits, PHI encryption (fail-closed), Stripe webhook verified, prompt injection sanitization, comprehensive security headers, strong password policy, MFA available.

**REMAINING items from previous audit:** CSP nonce (pending), PHI draft encryption (pending), DSD URLs in LGPD export (pending), CAPTCHA (pending), `deno audit` CI (pending).

---

### 2. Clinical Correctness — 7.8/10

**12 findings** (0 Critical, 2 High, 6 Medium, 4 Low)

**Key findings:**
- CLIN-001 (High): `faceta_resina`/`coroa_parcial` in DSD prompt but no downstream support — teeth get no protocol
- CLIN-002 (High): No `default` case in `dispatchTreatmentProtocol` — silent failure
- CLIN-007/008 (Medium): BL1 listed as default diastema shade option — contradicts whitening rules
- CLIN-003 (Medium): `aestheticLevel` derived from budget alone, not clinical indicators

**Treatment Type Matrix:** All 8 core types fully supported. `faceta_resina` and `coroa_parcial` exist ONLY in DSD prompt — zero downstream support.

**Prompt Quality:** recommend-resin 9/10, dsd-simulation 8.5/10, dsd-analysis 8/10, analyze-dental-photo 8.5/10, recommend-cementation 8/10, smile-line-classifier 8.5/10, clinical-rules 9/10.

---

### 3. Code Quality — 7.4/10

**18 findings** (0 Critical, 4 High, 9 Medium, 5 Low)

**Key findings:**
- CQ-001 (High): Error classification duplicated 4x with slight variations
- CQ-002 (High): `evalClients` adapter copy-pasted between 2 hooks
- CQ-003 (High): Hardcoded clinical defaults (`'Classe I'`, `'Media'`) in 6+ locations
- CQ-005 (Medium): Dead state `isCompositing` — never set to true
- CQ-009 (Medium): 8 `as unknown as` double casts in production

**Metrics:** 0 `any` in production, 0 empty catch blocks, 8 double casts, 24 files >300 LOC, 7 functions >100 LOC, 6 TODOs remaining.

---

### 4. Architecture — 7.8/10

**12 findings** (0 Critical, 3 High, 6 Medium, 3 Low)

**Key findings:**
- ARCH-001 (High): `lib/` imports from `hooks/` — `getGenericProtocol` in wrong layer
- ARCH-002 (High): `useDSDStep` 1024 lines in `components/` instead of `hooks/domain/`
- ARCH-003 (High): 6 hooks import types from component files
- ARCH-004 (Medium): Duplicate types across frontend/backend (`PatientPreferences`, `StratificationProtocol`)
- ARCH-005 (Medium): 2 edge functions still not using `withCreditProtection`

**Scalability:** Adding a new treatment type requires 6 files (above ideal but well-localized). No TypeScript `never` guard to catch missing cases at compile time.

---

### 5. Testing — 7.1/10

**19 findings** (2 Critical, 6 High, 7 Medium, 4 Low)

**Key findings:**
- TEST-001 (Critical): 3 failing tests from `getDashboardMetrics` RPC migration
- TEST-002 (Critical): `stripe-webhook` (477 LOC) zero tests
- TEST-004 (High): `protocol-dispatch.ts` (178 LOC, 4 call sites) zero tests
- TEST-008 (High): 14 `usePhotoAnalysis` tests skipped — core user journey
- TEST-011 (Medium): No coverage reporting in CI (thresholds configured but never enforced)

**Test Health:** 1812 passing, 3 failing, 19 skipped. 66 Deno tests. 5 E2E spec files (not running in CI). 12/15 edge functions have zero tests.

---

### 6. Performance/PWA — 7.8/10

**13 findings** (0 Critical, 2 High, 2 Medium, 9 Low)

**Key findings:**
- PERF-001 (High): Sentry Replay (~100KB) bundled eagerly — `replaysSessionSampleRate: 0.1`
- PERF-002 (High): Both i18n locales (220KB) statically imported at startup
- PERF-003 (Medium): `AuthContext.Provider` value not memoized — re-renders 30+ consumers
- PERF-012 (Medium): `vendor-pageshell` at 1069KB (294KB gzip) — largest eager dep

**Bundle:** Total eager JS ~680KB gzip. 92 chunks (good splitting). HEIC, PDF, Recharts, PostHog all lazy-loaded. PWA checklist mostly passing — missing maskable icon safe zone and apple splash screens.

---

### 7. i18n — 7.5/10

**19 findings** (2 Critical, 5 High, 8 Medium, 4 Low)

**Key findings:**
- I18N-001 (Critical): 13 `ERROR_MESSAGES` hardcoded Portuguese in edge functions
- I18N-002 (Critical): Client string-matches `'Creditos insuficientes'` for error branching
- I18N-003 (High): Portuguese clinical strings stored in DB via `useWizardSubmit`
- I18N-004 (High): Clinical enum values (`'Classe I'`, `'Media'`) displayed raw
- I18N-005 (High): PDF confidence labels hardcoded (easy fix — `t` already available)

**Key Coverage:** 1869/1869 perfect parity (was 85 gap). All `defaultValue` removed. 76 proper ICU plural keys. 191 interpolated keys consistent.

---

### 8. Frontend UX/A11y — 7.9/10

**14 findings** (0 Critical, 0 High, 5 Medium, 9 Low)

**Key findings:**
- UX-001 (Medium): ~40 sub-components import `@/components/ui/` instead of PageShell primitives
- UX-002 (Medium): `text-[10px]` in ~45 instances for non-decorative content
- UX-003/004/005 (Medium): Touch targets <44px on sub-component buttons (zoom, close, view)

**PageShell Adoption:** 100% on pages. All composites correctly applied. WCAG mostly passing. `prefers-reduced-motion` well-supported. Skip-to-content link, proper landmarks, keyboard wizard navigation all present.

---

## Delta vs Previous Audit (7.2 → 7.8)

### What Improved Most
1. **Testing (+1.4)**: 434 new tests, Deno tests in CI, 8-shard parallelism
2. **i18n (+1.0)**: Perfect key parity, PDF translated, pluralization fixed, 85 missing keys added
3. **Performance (+0.3)**: HEIC lazy-loaded, PostHog deferred, prefetch on hover, blob leaks fixed
4. **Frontend (+0.3)**: WCAG fixes, wizard migrated to PageShell, a11y improvements
5. **Code Quality (+0.3)**: 4x dispatch duplication eliminated, silent catches fixed, 0 `any`
6. **Architecture (+0.2)**: `useEvaluationDetail` decomposed, `withCreditProtection` HOF, layer fixes
7. **Security (+0.2)**: PHI fail-closed, RLS hardened, Stripe re-validated

### What Still Blocks 9+
1. Edge function test coverage (12/15 have 0 tests)
2. Edge function error messages in Portuguese only
3. `useDSDStep` 1024-line god hook
4. DSD prompt `faceta_resina`/`coroa_parcial` gap
5. Sentry Replay + both locales in critical path (~55KB gzip savings available)
6. CSP nonce (requires Vercel Edge Middleware)
7. PHI encryption for `evaluation_drafts.draft_data`

---

## Recommended Action Plan

### Phase 1 — Critical Fixes (7.8 → 8.2)

| # | Item | Effort | Dimension |
|---|------|--------|-----------|
| 1 | Fix 3 failing tests (`getDashboardMetrics` RPC mock) | 30min | Testing |
| 2 | Add `default` case to `dispatchTreatmentProtocol` | 15min | Clinical |
| 3 | Add `faceta_resina`/`coroa_parcial` to normalization maps | 30min | Clinical |
| 4 | Edge function errors: return `code` field, match on code not text | 1h | i18n |
| 5 | Fix PDF confidence labels (use `t()` — already available) | 15min | i18n |
| 6 | Add rate limiting to `check-photo-quality` | 15min | Security |
| 7 | Add `check-photo-quality` to CI deploy list | 5min | Security |

### Phase 2 — High-Impact Quick Wins (8.2 → 8.5)

| # | Item | Effort | Dimension |
|---|------|--------|-----------|
| 8 | Lazy-load Sentry Replay (~30KB gzip savings) | 30min | Performance |
| 9 | Lazy-load en-US locale (~25KB gzip savings) | 1h | Performance |
| 10 | Memoize `AuthContext.Provider` value | 30min | Performance |
| 11 | Extract `classifyEdgeFunctionError()` shared helper | 1h | Code Quality |
| 12 | Extract `createEvalClients()` factory | 30min | Code Quality |
| 13 | Move `getGenericProtocol` to `lib/` (fix layer inversion) | 30min | Architecture |
| 14 | Move types from components to `@/types/` (PatientPreferences) | 30min | Architecture |
| 15 | Remove BL1 from diastema default shade options | 15min | Clinical |

### Phase 3 — Structural Improvements (8.5 → 9.0)

| # | Item | Effort | Dimension |
|---|------|--------|-----------|
| 16 | Decompose `useDSDStep` into 4 sub-hooks | 3h | Architecture |
| 17 | Add tests for `protocol-dispatch.ts` | 1h | Testing |
| 18 | Add tests for `stripe-webhook` | 3h | Testing |
| 19 | Fix 14 skipped `usePhotoAnalysis` tests | 1h | Testing |
| 20 | Migrate remaining `@/components/ui/` to PageShell primitives | 2h | Frontend |
| 21 | Replace `text-[10px]` with `text-xs` (45 instances) | 1h | Frontend |
| 22 | Fix sub-component touch targets (<44px) | 1h | Frontend |
| 23 | Clinical enum display values: i18n translation layer | 2h | i18n |
| 24 | Migrate `recommend-resin`/`cementation` to `withCreditProtection` | 1h | Architecture |

### Phase 4 — Infrastructure (9.0 → 9.5+)

| # | Item | Effort | Dimension |
|---|------|--------|-----------|
| 25 | CSP nonce via Vercel Edge Middleware | 4-6h | Security |
| 26 | PHI encryption for `evaluation_drafts.draft_data` | 4-6h | Security |
| 27 | DSD signed URLs in LGPD data export | 2h | Security |
| 28 | Coverage reporting in CI (Codecov) | 1h | Testing |
| 29 | E2E tests in CI with local Supabase | 4h | Testing |
| 30 | Login CAPTCHA (Turnstile) | 2-3h | Security |
| 31 | Maskable icon with 40% safe zone | 1h | PWA |
| 32 | Apple splash screens | 30min | PWA |

---

## Links

- [[2026-02-26-full-application-audit]] — Previous audit (7.2/10)
- [[2026-02-26-audit-action-plan]] — Previous action plan (executed)
- [[../06-ADRs/ADR-Index]] — Architecture Decision Records
- [[../00-Index/Home]] — Documentation Hub

---
*Atualizado: 2026-02-27*
