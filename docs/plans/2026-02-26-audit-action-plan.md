---
title: "Audit Action Plan — Roadmap to 10/10"
created: 2026-02-26
updated: 2026-02-26
status: draft
tags:
  - type/plan
  - status/draft
  - scope/full-app
related:
  - "[[2026-02-26-full-application-audit]]"
  - "[[../06-ADRs/ADR-Index]]"
  - "[[../00-Index/Home]]"
---

# Audit Action Plan — Roadmap to 10/10

> Based on the [[2026-02-26-full-application-audit|Full Application Audit]] (7.2/10).
> Each phase targets a score milestone. Phases are sequential — later phases depend on earlier ones.

---

## Phase 1 — Critical Fixes (7.2 → 8.0)

> Security, production bugs, and WCAG violations. **Do first.**

### 1.1 Security: `.env` cleanup
- [ ] Run `git log --all --full-history -- apps/web/.env` to verify never committed
- [ ] If committed: rotate anon key in Supabase dashboard, purge with `git filter-repo`
- [ ] Delete `apps/web/.env` from disk
- [ ] Create `apps/web/.env.local` (gitignored) for local dev
- **Files**: `apps/web/.env`, `.gitignore`
- **Effort**: 15 min
- **Impact**: Closes VULN-D1 (High)

### 1.2 Code: Extract `dispatchTreatmentProtocol()` shared helper
- [ ] Create `apps/web/src/lib/protocol-dispatch.ts`
- [ ] Extract the treatment-type switch from `useWizardSubmit.ts:302-391`
- [ ] Replace the 3 other copies in `useEvaluationDetail.ts` (lines 507-572, 663-704, 755-786)
- [ ] Test: verify all treatment types dispatch correctly
- **Files**: `src/lib/protocol-dispatch.ts` (new), `useWizardSubmit.ts`, `useEvaluationDetail.ts`
- **Effort**: 2-3 hours
- **Impact**: Eliminates P0 duplication, prevents future treatment-type addition bugs

### 1.3 Security: Remove CSP `unsafe-inline`
- [ ] Audit all inline `style` props in TSX — move to CSS classes or Tailwind utilities
- [ ] Update `vercel.json` CSP: remove `'unsafe-inline'` from `style-src`
- [ ] Test: verify no style breakage in production build
- **Files**: `vercel.json`, various TSX files
- **Effort**: 2-4 hours
- **Impact**: Closes VULN-X1 (Medium)

### 1.4 Design: Fix WCAG contrast violations
- [ ] Replace `text-muted-foreground/60` with `text-muted-foreground` on all text labels
- [ ] Replace `text-[10px]` with `text-xs` (12px) in `StatsGrid.tsx:218`
- [ ] Add `min-h-11` to all `size="sm"` buttons in `EvaluationDetails.tsx:150-186`
- [ ] Add `pb-[env(safe-area-inset-bottom)]` to floating selection bar in `EvaluationDetails.tsx:192`
- **Files**: `StatsGrid.tsx`, `AuthLayout.tsx`, `EvaluationDetails.tsx`
- **Effort**: 1 hour
- **Impact**: Closes WCAG 1.4.3 and 2.5.5 violations

### 1.5 Performance: Fix blob URL memory leak
- [ ] In `useDSDStep.ts` line 55: add `URL.revokeObjectURL(blobUrl)` after canvas draw completes
- [ ] Clear `imageBase64`, `dsdResult`, `analysisResult` from wizard state after `submissionComplete`
- **Files**: `useDSDStep.ts`, `useWizardFlow.ts`
- **Effort**: 30 min
- **Impact**: Prevents 4 blob URL leaks per DSD run

### 1.6 Code: Replace silent `catch {}` blocks
- [ ] Add `logger.error(error)` to all 9+ empty catch blocks:
  - `PatientProfile.tsx:62`
  - `AuthContext.tsx:127`
  - `useInventoryManagement.ts:204, 215, 321`
  - `useGroupResult.ts:205`
  - `useProfile.ts:297`
  - `usePatientProfile.ts:230`
- [ ] Fix `updatePatientBirthDate` in `wizard.ts:77` to throw instead of warn
- **Files**: 7 files listed above
- **Effort**: 30 min
- **Impact**: Makes production errors visible

### 1.7 Security: Re-validate credit count in Stripe webhook
- [ ] In `stripe-webhook/index.ts:398-408`: after receiving `session.metadata.credits`, re-query `credit_packs` from DB using `pack_id` and use DB value
- **Files**: `supabase/functions/stripe-webhook/index.ts`
- **Effort**: 30 min
- **Impact**: Closes VULN-PAY1 (Medium)

**Phase 1 total effort**: ~8-10 hours
**Expected score after Phase 1**: **8.0/10**

---

## Phase 2 — Testing Foundation (8.0 → 8.5)

> Close the critical test gaps that have already caused production bugs.

### 2.1 Test `useWizardFlow.ts`
- [ ] Create `apps/web/src/hooks/__tests__/useWizardFlow.test.ts`
- [ ] Test cases:
  - Credit gate enforcement (`canUseCredits()` called, not boolean-checked)
  - Step transitions (forward/backward)
  - Draft restore trigger (step=3, no analysis, re-triggers `analyzePhoto`)
  - Sample case flow
- **Effort**: 3-4 hours

### 2.2 Rewrite `useEvaluationDetail.test.ts`
- [ ] Use `renderHook` on actual hook (not copied helpers)
- [ ] Test: `handleSubmitTeeth` for all treatment types including `gengivoplastia`, `recobrimento_radicular`
- [ ] Test: `handleAddMoreTeeth`, `handleRegenerateWithBudget`
- **Effort**: 4-5 hours

### 2.3 Add Deno tests for critical edge function modules
- [ ] `supabase/functions/recommend-resin/shade-validation.test.ts`:
  - BL1/BL2 prohibition for Dentina/Corpo
  - WB hard fallback when catalog empty
  - Efeitos Incisais injection for anterior aesthetic
- [ ] `supabase/functions/analyze-dental-photo/post-processing.test.ts`:
  - Diastema confidence safety net (threshold, bilateral rule, multi-tooth override)
  - Lower-teeth filter
- [ ] `supabase/functions/generate-dsd/post-processing.test.ts`:
  - `shouldStripGingivo` logic
  - Gengivoplasty preservation for media smile line
- **Effort**: 4-5 hours

### 2.4 Test `protocolComputed.ts`
- [ ] Create `apps/web/src/hooks/__tests__/protocolComputed.test.ts`
- [ ] Pure function, ~10 test cases cover full surface
- **Effort**: 1 hour

### 2.5 Infrastructure improvements
- [ ] Raise coverage thresholds in `vitest.config.ts`: statements 60%, branches 80%, functions 70%, lines 60%
- [ ] Remove `src/test/example.test.ts` placeholder
- [ ] Fix `initReactI18next` mock in `src/test/mocks/i18n.ts`
- [ ] Add Deno test runner step to `.github/workflows/test.yml`
- **Effort**: 1-2 hours

**Phase 2 total effort**: ~14-17 hours
**Expected score after Phase 2**: **8.5/10**

---

## Phase 3 — Architecture Refinement (8.5 → 9.0)

> Structural improvements that reduce maintenance burden.

### 3.1 Decompose `useEvaluationDetail`
- [ ] Extract `useEvaluationData` — queries, loading states
- [ ] Extract `useEvaluationActions` — status mutations, bulk complete, delete, share
- [ ] Extract `useAddTeethFlow` — handleSubmitTeeth, pending teeth, protocol sync
- [ ] Extract `useEvaluationSelection` — selection state, checklist
- [ ] Keep `useEvaluationDetail` as thin orchestrator composing the 4 sub-hooks
- **Files**: `useEvaluationDetail.ts` → 4 new files + orchestrator
- **Effort**: 4-5 hours

### 3.2 Break large functions into sub-functions
- [ ] `useWizardSubmit.handleSubmit` (375 lines) → `createOrFindPatient()`, `createEvaluationsWithProtocols()`, `finalizeSubmission()`
- [ ] `simulation.ts:generateSimulation` (430 lines) → `resolveWhiteningConfig()`, `buildSimulationPrompt()`, `executeSimulation()`, `uploadResult()`
- [ ] Extract shared `makeHttpRequestWithRetry` from `gemini.ts` + `claude.ts`
- **Effort**: 3-4 hours

### 3.3 Fix layer violations
- [ ] Move direct `@/data` imports out of `Patients.tsx`, `PatientProfile.tsx`, `Landing.tsx` into hooks
- [ ] Move types from component files (`AddTeethModal`, `ReviewAnalysisStep`, `PatientAutocomplete`) to `@/types/`
- [ ] Remove `i18n` direct import from `helpers.ts:getGenericProtocol` — accept `t` callback
- **Effort**: 2-3 hours

### 3.4 Backend: `withCreditProtection` HOF
- [ ] Create `supabase/functions/_shared/withCreditProtection.ts`
- [ ] Encapsulate the 3-variable credit refund pattern (`creditsConsumed`, `supabaseForRefund`, `userIdForRefund`)
- [ ] Apply to `analyze-dental-photo` and `generate-dsd`
- **Effort**: 1-2 hours

### 3.5 Code cleanup
- [ ] Merge `dateUtils.ts` into `date-utils.ts`
- [ ] Remove deprecated `normalizeTreatment`, update callers to `normalizeTreatmentType`
- [ ] Replace `getOrCreateShareLink` bespoke retry with `withRetry`
- [ ] Replace `'Dissilicato de lítio'` magic string with `DEFAULT_CERAMIC_TYPE` constant
- [ ] Memoize `useWizardFlow` return object
- **Effort**: 1-2 hours

**Phase 3 total effort**: ~12-16 hours
**Expected score after Phase 3**: **9.0/10**

---

## Phase 4 — i18n and Design Polish (9.0 → 9.5)

> Close i18n debt and design system gaps.

### 4.1 Add 44 missing i18n keys
- [ ] Add all `evaluation.regenerate*`, `evaluation.tipAddMore*`, `evaluation.markAllCompleted*` keys
- [ ] Add all `patients.deletePatient*`, `patients.unsavedChanges*` keys
- [ ] Add all `pricing.*`, `profile.weeklyDigest*`, `components.layout.*`, `auth.socialProof` keys
- [ ] Add to BOTH `pt-BR.json` and `en-US.json`
- [ ] Replace all `defaultValue` fallbacks with proper `t('key')` calls
- **Effort**: 2-3 hours

### 4.2 Internationalize `pdfSections.ts`
- [ ] Refactor all `render*` functions to accept `t: TFunction` parameter
- [ ] Extract 20+ hardcoded Portuguese strings to `pdf.*` namespace in JSON
- [ ] Add matching en-US translations
- **Effort**: 3-4 hours

### 4.3 Consolidate treatment labels
- [ ] Create single `treatments.*` namespace with all treatment labels
- [ ] Remove duplicates from `dashboard.*`, `evaluation.*`, `pages.*`, `components.wizard.review.*`, `components.addTeeth.*`
- [ ] Update all `t()` calls to use canonical `treatments.*` keys
- **Effort**: 2-3 hours

### 4.4 Internationalize `helpers.ts` specialty names
- [ ] Replace hardcoded `'Ortodontia'`, `'Endodontia'`, etc. with `t('specialties.*')` keys
- **Effort**: 30 min

### 4.5 Design system alignment
- [ ] Migrate wizard sub-components from `@/components/ui/` to PageShell primitives
- [ ] Remove duplicate `:focus-visible` rule at `index.css:1149`
- [ ] Fix duplicate pagination on `Evaluations.tsx` — remove custom block
- [ ] Replace `aria-live="polite"` on wizard root with targeted sr-only announcer
- [ ] Add `aria-pressed` to `EvaluationToothCard` in selection mode
- [ ] Add `focus-within:opacity-100` to hover-only remove button in Inventory
- [ ] Resolve Dashboard dual-h1 issue
- **Effort**: 3-4 hours

### 4.6 Fix pluralization anti-patterns
- [ ] Replace `(s)` suffix in `common.selected_other` and `evaluation.deleteSessionDescription`
- **Effort**: 15 min

**Phase 4 total effort**: ~12-15 hours
**Expected score after Phase 4**: **9.5/10**

---

## Phase 5 — Final Polish (9.5 → 10.0)

> Performance, PWA, and remaining security hardening.

### 5.1 Performance optimizations
- [ ] Defer `posthog-js` with dynamic import after cookie consent
- [ ] Cache signed URLs in React Query (deduplicate 20 parallel requests/page)
- [ ] Add `queryClient.prefetchQuery` on list item hover for EvaluationDetails
- [ ] Set global `gcTime: 10 * 60 * 1000` in QueryClient
- [ ] Remove unused `@tanstack/react-virtual` from dependencies (or implement virtualization)
- [ ] Add debounce to wizard auto-save `useEffect`
- **Effort**: 3-4 hours

### 5.2 PWA completeness
- [ ] Implement update notification in `onNeedRefresh` callback (toast prompting refresh)
- [ ] Add `screenshots` field to `manifest.json`
- [ ] Create proper maskable icon with 40% safe zone
- [ ] Add iOS PWA meta tags (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`)
- [ ] Add `orientation: "portrait"` to manifest
- **Effort**: 2-3 hours

### 5.3 Lighthouse and SEO
- [ ] Fix `og:url` and `og:image` to use actual Vercel URL
- [ ] Add `twitter:title` and `twitter:description`
- [ ] Self-host Google Fonts or async-load them
- [ ] Add `<link rel="modulepreload">` for critical vendor chunks
- **Effort**: 1-2 hours

### 5.4 Remaining security hardening
- [ ] Upgrade Stripe SDK to v17 in all edge functions
- [ ] Add `deno audit` step to CI workflow
- [ ] Enforce `sanitizeFieldsForPrompt` on all free-text fields in every edge function
- [ ] Encrypt `evaluation_drafts.draft_data` PHI fields via vault key
- [ ] Include DSD simulation signed URLs in data export (LGPD portability)
- [ ] Add login CAPTCHA (hCaptcha/Turnstile)
- [ ] Add `pg_cron` cleanup for stale `rate_limits` rows
- [ ] Validate `priceId` against `subscription_plans` table before Stripe subscription update
- **Effort**: 4-6 hours

### 5.5 Remaining test coverage
- [ ] Add `generatePDF.test.ts` with mock jsPDF
- [ ] Test `treatment-config.ts` and `confidence-config.ts` (trivially testable pure functions)
- [ ] E2E: add `dsd.spec.ts` and shared evaluation test
- [ ] Add Codecov for coverage trends per commit
- **Effort**: 3-4 hours

### 5.6 Audit unused Radix packages
- [ ] Check if `@radix-ui/react-menubar`, `react-navigation-menu`, `react-context-menu`, `react-hover-card` are actually used
- [ ] Remove unused packages from `package.json`
- **Effort**: 30 min

**Phase 5 total effort**: ~14-20 hours
**Expected score after Phase 5**: **10.0/10**

---

## Summary

| Phase | Focus | Effort | Score Target |
|-------|-------|--------|--------------|
| **Phase 1** | Critical fixes (security, P0 bugs, WCAG) | 8-10h | 7.2 → **8.0** |
| **Phase 2** | Testing foundation | 14-17h | 8.0 → **8.5** |
| **Phase 3** | Architecture refinement | 12-16h | 8.5 → **9.0** |
| **Phase 4** | i18n and design polish | 12-15h | 9.0 → **9.5** |
| **Phase 5** | Final polish (perf, PWA, security) | 14-20h | 9.5 → **10.0** |
| **Total** | | **60-78h** | **10.0/10** |

> [!tip] Recommended Approach
> Phase 1 can be done in a single focused day. Phase 2 in 2-3 days. Phases 3-5 can be interleaved with feature work over 2-3 weeks.

---

## Links

- [[2026-02-26-full-application-audit]] — Full audit report with all findings
- [[../06-ADRs/ADR-Index]] — Architecture Decision Records
- [[../00-Index/Home]] — Documentation Hub

---
*Atualizado: 2026-02-26*
