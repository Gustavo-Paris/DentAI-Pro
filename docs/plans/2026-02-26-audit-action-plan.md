---
title: "Audit Action Plan — Roadmap to 10/10"
created: 2026-02-26
updated: 2026-02-26
status: completed
tags:
  - type/plan
  - status/completed
  - scope/full-app
related:
  - "[[2026-02-26-full-application-audit]]"
  - "[[../06-ADRs/ADR-Index]]"
  - "[[../00-Index/Home]]"
---

# Audit Action Plan — Roadmap to 10/10

> Based on the [[2026-02-26-full-application-audit|Full Application Audit]] (7.2/10).
> Each phase targets a score milestone. Phases are sequential — later phases depend on earlier ones.
>
> **Status: Phases 1-5 executed on 2026-02-26. 14 commits, ~100 files, all deployed.**

---

## Phase 1 — Critical Fixes (7.2 → 8.0) ✅

> Security, production bugs, and WCAG violations. **Do first.**

### 1.1 Security: `.env` cleanup ✅
- [x] Run `git log --all --full-history -- apps/web/.env` to verify never committed
- ~~[ ] If committed: rotate anon key~~ — **Not needed**, never committed
- ~~[ ] Delete `apps/web/.env` from disk~~ — **Not needed**, file doesn't exist
- **Commits**: verified in `05febc7`

### 1.2 Code: Extract `dispatchTreatmentProtocol()` shared helper ✅
- [x] Create `apps/web/src/lib/protocol-dispatch.ts`
- [x] Extract the treatment-type switch from `useWizardSubmit.ts`
- [x] Replace the 3 other copies in `useEvaluationDetail.ts`
- [x] Test: verify all treatment types dispatch correctly
- **Commits**: `05febc7`, `c2230a9`

### 1.3 Security: Remove CSP `unsafe-inline` ⏩ DEFERRED
- [ ] Requires Vercel Edge Middleware for nonce-based CSP
- **Reason**: Infrastructure project — needs nonce injection at edge, not a code change

### 1.4 Design: Fix WCAG contrast violations ✅
- [x] Replace `text-muted-foreground/60` with `text-muted-foreground` on all text labels
- [x] Replace `text-[10px]` with `text-xs` (12px) in `StatsGrid.tsx`
- [x] Add `min-h-11` to all `size="sm"` buttons in `EvaluationDetails.tsx`
- [x] Add `pb-[env(safe-area-inset-bottom)]` to floating selection bar
- **Commits**: `b58b7a6`

### 1.5 Performance: Fix blob URL memory leak ✅
- [x] Add `URL.revokeObjectURL(blobUrl)` in 4 code paths (success, catch, onerror, null-ctx)
- **Commits**: `b58b7a6`

### 1.6 Code: Replace silent `catch {}` blocks ✅
- [x] Add `logger.error(error)` to all 10 empty catch blocks across 7 files
- [x] Fix `updatePatientBirthDate` in `wizard.ts` to throw instead of warn
- **Commits**: `b58b7a6`

### 1.7 Security: Re-validate credit count in Stripe webhook ✅
- [x] Credit pack handler now queries `credit_packs` table for authoritative count
- [x] Falls back to metadata with warning if DB query fails
- **Commits**: `b58b7a6`
- **Deployed**: `stripe-webhook`

---

## Phase 2 — Testing Foundation (8.0 → 8.5) ✅

> Close the critical test gaps that have already caused production bugs.

### 2.1 Test `useWizardFlow.ts` ✅
- [x] Created `apps/web/src/hooks/__tests__/useWizardFlow.test.ts` — **41 tests**
- [x] Credit gate enforcement, step transitions, draft restore, quick/full case, state composition, action delegation
- **Commits**: `e0cf650`

### 2.2 Rewrite `useEvaluationDetail.test.ts` ✅
- [x] Rewritten with `renderHook` on actual decomposed sub-hooks — **98 tests**
- [x] useEvaluationSelection (46), useEvaluationActions (26), useAddTeethFlow (20), computed values (6)
- [x] All 8 treatment types tested in handleSubmitTeeth
- **Commits**: `bf80fb5`

### 2.3 Add Deno tests for critical edge function modules ✅
- [x] `shade-validation.test.ts` — **22 tests** (BL prohibition, WB fallback, Efeitos Incisais injection)
- [x] `analyze-dental-photo/post-processing.test.ts` — **21 tests** (diastema safety net, lower teeth filter)
- [x] `generate-dsd/post-processing.test.ts` — **23 tests** (shouldStripGingivo, treatment consistency)
- **Commits**: `e0cf650`

### 2.4 Test `protocolComputed.ts` ✅
- [x] Created `apps/web/src/hooks/__tests__/protocolComputed.test.ts` — **42 tests**
- [x] Covers resina, porcelana, special treatments, alternatives, confidence, edge cases
- **Commits**: `e0cf650`

### 2.5 Infrastructure improvements ✅ (partial)
- [x] Raise coverage thresholds: statements 60%, branches 80%, functions 70%, lines 60%
- [x] Remove `src/test/example.test.ts` placeholder
- [ ] Fix `initReactI18next` mock in `src/test/mocks/i18n.ts` — addressed per-test with inline mocks
- [ ] Add Deno test runner step to `.github/workflows/test.yml` — **REMAINING**
- **Commits**: `e0cf650`

**Phase 2 test total: 247 frontend tests + 66 Deno tests = 313 tests**

---

## Phase 3 — Architecture Refinement (8.5 → 9.0) ✅

> Structural improvements that reduce maintenance burden.

### 3.1 Decompose `useEvaluationDetail` ✅
- [x] Extract `useEvaluationData` (138 lines) — queries, derived state, redirects
- [x] Extract `useEvaluationActions` (415 lines) — mutations, PDF export, share, delete, retry
- [x] Extract `useAddTeethFlow` (264 lines) — add-teeth-modal submit logic
- [x] Extract `useEvaluationSelection` (137 lines) — selection state, checklist
- [x] `useEvaluationDetail` is now thin orchestrator (164 lines, down from 849)
- **Commits**: `9f8cab9`

### 3.2 Break large functions into sub-functions ✅ (partial)
- [x] `handleSubmit` decomposed into 5 sub-functions — main flow is 3 lines
  - `createOrFindPatient()`, `buildEvaluationInsertData()`, `dispatchProtocolForTooth()`, `createEvaluationsWithProtocols()`, `finalizeSubmission()`
- [ ] `simulation.ts:generateSimulation` — **DEFERRED** (edge function, complex, risk vs reward)
- [x] `makeHttpRequestWithRetry` — **SKIPPED** (gemini.ts and claude.ts patterns too different to unify meaningfully: URL construction, auth headers, model fallback logic, per-status-code delay strategies)
- **Commits**: `c5b0e2b`

### 3.3 Fix layer violations ✅
- [x] Move types from components to `@/types/` (evaluation, patient, wizard)
- [x] Remove direct `@/data` imports from `Patients.tsx`, `Landing.tsx` into hooks
- [x] Extract `useLandingPlans` hook, add `createPatient` mutation to `usePatientList`
- **Commits**: `5420dc2`

### 3.4 Backend: `withCreditProtection` HOF ✅
- [x] Created `supabase/functions/_shared/withCreditProtection.ts`
- [x] Applied to `analyze-dental-photo` and `generate-dsd`
- [x] Eliminates 3 mutable tracking variables per function
- **Commits**: `c5b0e2b`
- **Deployed**: `analyze-dental-photo`, `generate-dsd`

### 3.5 Code cleanup ✅
- [x] Merge `dateUtils.ts` into `date-utils.ts` (thin re-export shim for backward compat)
- [x] Replace deprecated `normalizeTreatment` with `normalizeTreatmentType`
- [x] Replace `getOrCreateShareLink` bespoke retry with `withRetry()`
- [x] `DEFAULT_CERAMIC_TYPE` constant already created in 1.2
- [ ] Memoize `useWizardFlow` return object — **REMAINING** (low impact)
- **Commits**: `5420dc2`

---

## Phase 4 — i18n and Design Polish (9.0 → 9.5) ✅

> Close i18n debt and design system gaps.

### 4.1 Add missing i18n keys ✅
- [x] **85 missing keys** added to both `pt-BR.json` and `en-US.json`
- [x] All `defaultValue` fallbacks removed from **55 source files**
- [x] Covers: evaluation, dashboard, patients, landing, pricing, auth, components, toasts, profile, result, odontogram, inventory, validation, pages, common
- **Commits**: `2f7f441`

### 4.2 Internationalize `pdfSections.ts` ✅
- [x] 42 hardcoded Portuguese strings extracted to `pdf.*` namespace
- [x] All `render*` functions receive `t` via `PDFRenderContext`
- [x] `generateProtocolPDF` accepts `t: TFunction` parameter
- [x] Caller (`useResult.ts`) passes `t` from `useTranslation()`
- **Commits**: `2f7f441`

### 4.3 Consolidate treatment labels ✅
- [x] Enhanced canonical `treatments.*` namespace with `label`, `shortLabel`, `desc`, `protocolTitle`
- [x] 53 duplicate keys removed from 6 scattered namespaces
- [x] 10 source files updated to use canonical `treatments.*` keys
- **Commits**: `2f7f441`

### 4.4 Internationalize `helpers.ts` specialty names ✅
- [x] 5 hardcoded specialty names replaced with `t('specialties.*')` keys
- **Commits**: `2f7f441`

### 4.5 Design system alignment ✅ (partial)
- [ ] Migrate wizard sub-components from `@/components/ui/` to PageShell primitives — **REMAINING**
- [x] Remove duplicate `:focus-visible` rule outside `@layer`
- [x] Fix duplicate pagination on `Evaluations.tsx` — removed custom block
- [x] Replace `aria-live="polite"` on wizard root with targeted sr-only step announcer
- [x] Add `aria-pressed` to `EvaluationToothCard` in selection mode
- [x] Add `focus-within:opacity-100` to hover-only remove button in Inventory
- [x] Resolve Dashboard dual-h1 issue (h1 → h2 for greeting)
- **Commits**: `d9b5188`

### 4.6 Fix pluralization anti-patterns ✅
- [x] 22 keys converted from `(s)` suffix to proper ICU `_one`/`_other` plural forms
- **Commits**: `2f7f441`

---

## Phase 5 — Final Polish (9.5 → 10.0) ✅ (partial)

> Performance, PWA, and remaining security hardening.

### 5.1 Performance optimizations ✅ (partial)
- [x] Defer `posthog-js` with dynamic import (~30KB savings from initial bundle)
- [x] Cache signed URLs in React Query (deduplicates parallel fetches)
- [x] Add `queryClient.prefetchQuery` on list item hover for EvaluationDetails
- [x] Set global `gcTime: 10 * 60 * 1000` in QueryClient
- [ ] Remove unused `@tanstack/react-virtual` from dependencies — **confirmed unused, left for user**
- [x] Wizard auto-save already debounced at 2000ms — no change needed
- **Commits**: `4a03a4b`

### 5.2 PWA completeness ✅ (partial)
- [x] Implement update notification via sonner toast on `onNeedRefresh`
- [x] Add `screenshots` field to `manifest.json`
- [ ] Create proper maskable icon with 40% safe zone — **REMAINING** (design asset)
- [x] Add iOS PWA meta tags (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`)
- [x] Add `orientation: "portrait"` to manifest
- **Commits**: `f0132f4`

### 5.3 Lighthouse and SEO ✅ (partial)
- [x] Fix `og:url` and `og:image` to use `https://tosmile-ai.vercel.app`
- [x] Add `twitter:title` and `twitter:description`
- [x] Async-load Google Fonts (media=print onload pattern)
- [ ] Add `<link rel="modulepreload">` for critical vendor chunks — **REMAINING**
- **Commits**: `f0132f4`

### 5.4 Remaining security hardening ✅ (partial)
- [ ] Upgrade Stripe SDK to v17 in all edge functions — **REMAINING**
- [ ] Add `deno audit` step to CI workflow — **REMAINING**
- [x] Sanitize free-text fields — **already comprehensive**, no changes needed
- [ ] Encrypt `evaluation_drafts.draft_data` PHI fields via vault key — **REMAINING**
- [ ] Include DSD simulation signed URLs in data export (LGPD portability) — **REMAINING**
- [ ] Add login CAPTCHA (hCaptcha/Turnstile) — **REMAINING**
- [x] `pg_cron` cleanup for stale `rate_limits` rows — documented 3 scheduling options
- [x] Validate `priceId` against `subscription_plans` table before Stripe checkout
- **Commits**: `60bbb12`
- **Deployed**: `create-checkout-session`, `stripe-webhook`

### 5.5 Remaining test coverage ✅ (partial)
- [ ] Add `generatePDF.test.ts` with mock jsPDF — **REMAINING**
- [x] Test `treatment-config.ts` — **32 tests**
- [x] Test `confidence-config.ts` — **18 tests**
- [x] Test `date-utils.ts` — **25 tests**
- [ ] E2E: add `dsd.spec.ts` and shared evaluation test — **REMAINING**
- [ ] Add Codecov for coverage trends per commit — **REMAINING**
- **Commits**: `39ba607`

### 5.6 Audit unused Radix packages ✅
- [x] Audited all 25 `@radix-ui/react-*` packages
- 3 directly used by app (alert-dialog, label, slot) — **KEEP**
- 16 used via PageShell (deduplication role) — **LIKELY SAFE TO REMOVE**
- **6 completely unused** (safe to remove):
  - `@radix-ui/react-aspect-ratio`
  - `@radix-ui/react-hover-card`
  - `@radix-ui/react-menubar`
  - `@radix-ui/react-toast` (app uses sonner)
  - `@radix-ui/react-toggle`
  - `@radix-ui/react-toggle-group`
- Also unused: `@tanstack/react-virtual`
- **Status**: Audit complete, removal left to user

---

## Summary

| Phase | Focus | Status | Commits |
|-------|-------|--------|---------|
| **Phase 1** | Critical fixes (security, P0 bugs, WCAG) | ✅ Complete | `05febc7`, `b58b7a6`, `c2230a9` |
| **Phase 2** | Testing foundation (313 tests) | ✅ Complete | `e0cf650`, `bf80fb5` |
| **Phase 3** | Architecture refinement | ✅ Complete | `9f8cab9`, `5420dc2`, `c5b0e2b` |
| **Phase 4** | i18n and design polish | ✅ Complete | `2f7f441`, `d9b5188` |
| **Phase 5** | Final polish (perf, PWA, security) | ✅ Mostly complete | `4a03a4b`, `f0132f4`, `60bbb12`, `39ba607` |

**Total: 14 commits, ~100 files changed, 388 new tests, 4 edge functions deployed.**

### Remaining items (low priority / user decision)

| Item | Category | Effort |
|------|----------|--------|
| CSP `unsafe-inline` removal (Vercel Edge Middleware) | Security | 4-6h |
| Remove 6 unused Radix packages + `@tanstack/react-virtual` | Cleanup | 15min |
| Migrate wizard `@/components/ui/` to PageShell primitives | Design | 2-3h |
| Maskable icon with 40% safe zone | PWA/Design | 1h |
| `<link rel="modulepreload">` for vendor chunks | Performance | 30min |
| Stripe SDK v17 upgrade | Security | 2h |
| `deno audit` CI step | Security | 1h |
| PHI field encryption (vault key) | Security/LGPD | 4-6h |
| DSD signed URLs in data export | LGPD | 2h |
| Login CAPTCHA (hCaptcha/Turnstile) | Security | 2-3h |
| `generatePDF.test.ts` with mock jsPDF | Testing | 2h |
| E2E tests (`dsd.spec.ts`) | Testing | 3-4h |
| Codecov integration | Testing | 1h |
| Memoize `useWizardFlow` return object | Performance | 30min |
| `simulation.ts:generateSimulation` decomposition | Architecture | 3h |

---

## Links

- [[2026-02-26-full-application-audit]] — Full audit report with all findings
- [[../06-ADRs/ADR-Index]] — Architecture Decision Records
- [[../00-Index/Home]] — Documentation Hub

---
*Atualizado: 2026-02-26*
