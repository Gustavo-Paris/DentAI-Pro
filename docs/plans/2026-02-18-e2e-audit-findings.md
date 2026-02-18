---
title: E2E Audit Findings
created: 2026-02-18
updated: 2026-02-18
status: draft
tags:
  - type/plan
  - status/draft
---

# E2E Audit Findings - 2026-02-18

## Executive Summary

- **Total issues:** 164
- **By severity:** P0: 13, P1: 51, P2: 66, P3: 34
- **By dimension:**

| Dimension | P0 | P1 | P2 | P3 | Total |
|-----------|----|----|----|----|-------|
| Code Quality | 2 | 9 | 15 | 8 | 34 |
| Security | 1 | 5 | 6 | 4 | 16 |
| Functional/Bug | 3 | 7 | 9 | 4 | 23 |
| Performance | 1 | 6 | 8 | 4 | 19 |
| UX/Accessibility | 4 | 11 | 18 | 8 | 41 |
| Test Coverage | 2 | 13 | 10 | 6 | 31 |

## Top 20 Critical Issues (P0 + High-Impact P1)

### P0 - Critical (13 issues)

1. **[SECURITY] Client-provided reqId bypasses credit billing** - `generate-dsd/index.ts:20` - Attacker reuses reqId for unlimited free DSD simulations
2. **[FUNCTIONAL] Double-submit race condition** - `useWizardSubmit.ts:160` - Two rapid taps create duplicate evaluations and charge credits twice
3. **[FUNCTIONAL] Dashboard metrics corruption** - `evaluations.ts:132` - Legacy rows without session_id collapse into wrong session groups
4. **[FUNCTIONAL] handleSubmitTeeth no error handling** - `useEvaluationDetail.ts:553` - Failed tooth leaves orphaned records in "analyzing" status
5. **[CODE] sanitizeForPrompt duplicated between frontend/backend** - Divergence creates different sanitization behavior
6. **[CODE] getOrCreateShareLink double-insert race** - `evaluations.ts:295` - Retry inserts duplicate without checking existing
7. **[PERF] PostHog localStorage polling every 2s** - `PostHogProvider.tsx:57` - Burns CPU for entire app lifetime
8. **[UX] ProcessingOverlay no focus trap** - `ProcessingOverlay.tsx:32` - Keyboard users interact with controls under overlay
9. **[UX] AiDisclaimerModal no focus management** - `AiDisclaimerModal.tsx:85` - Blocking modal without focus on open
10. **[UX] EvaluationDetails clickable rows not keyboard-accessible** - `EvaluationDetails.tsx:309` - No role, tabIndex, or onKeyDown
11. **[UX] Result page not-found: no heading, no recovery** - `Result.tsx:50` - Blank screen with no navigation
12. **[TEST] retry.ts isRetryableError untested** - Drives ALL AI call retry decisions
13. **[TEST] complexity-score.ts algorithm untested** - Drives clinical complexity classification

### High-Impact P1 (top 7)

14. **[SECURITY] health-check is unauthenticated AI proxy** - `health-check/index.ts` - Anyone can proxy to Gemini API
15. **[SECURITY] Internal errors leaked in 500 responses** - `generate-dsd/index.ts:304` - Raw exception messages to client
16. **[SECURITY] simulation_debug leaks internal errors** - `generate-dsd/index.ts:278` - Gemini/storage error payloads to browser
17. **[SECURITY] CORS allowlist missing production domains** - `create-checkout-session/index.ts:47` - tosmile.ai/tosmile-ai.vercel.app absent
18. **[FUNCTIONAL] vitaShadeManuallySetRef never reset** - `useWizardReview.ts:38` - AI shade permanently disabled after manual edit
19. **[CODE] Referral fallback SET instead of INCREMENT** - `referral.ts:141` - Overwrites existing bonus credits
20. **[CODE] generateProtocolPDF is 700 lines** - `generatePDF.ts:30` - Untestable monolith

## All Issues by Severity

### P0 - Critical (13)

**Security:**
- Client-provided reqId as billing idempotency key (`generate-dsd/index.ts:20`)

**Code Quality:**
- sanitizeForPrompt duplicated frontend/backend (`lib/sanitizeForPrompt.ts` + `_shared/validation.ts`)
- getOrCreateShareLink double-insert on conflict (`evaluations.ts:295`)

**Functional/Bug:**
- Double-submit race condition (`useWizardSubmit.ts:160`)
- Dashboard session-grouping corrupts metrics (`evaluations.ts:132`)
- handleSubmitTeeth no error handling, orphaned records (`useEvaluationDetail.ts:553`)

**Performance:**
- PostHog localStorage polling every 2 seconds (`PostHogProvider.tsx:57`)

**UX/Accessibility:**
- ProcessingOverlay no focus trap (`ProcessingOverlay.tsx:32`)
- AiDisclaimerModal no focus management (`AiDisclaimerModal.tsx:85`)
- EvaluationDetails clickable rows not keyboard-accessible (`EvaluationDetails.tsx:309`)
- Result page not-found: no heading/recovery (`Result.tsx:50`)

**Test Coverage:**
- retry.ts isRetryableError untested
- complexity-score.ts algorithm untested

### P1 - High (51)

**Security (5):**
- health-check unauthenticated AI proxy
- Internal error in 500 responses (generate-dsd)
- simulation_debug leaks internal errors
- CORS allowlist missing tosmile.ai domains
- Referral code unvalidated from localStorage

**Code Quality (9):**
- generateProtocolPDF 700-line monolith
- Duplicate countByUserId across 3 data modules
- Unsafe `as never` cast on insert payloads
- updatePatientBirthDate/updateEvaluationStatus no error check
- Referral fallback SET instead of INCREMENT
- Duplicate circuit breaker in claude.ts/gemini.ts
- Duplicate parseDataUrl in claude.ts/gemini.ts
- Duplicate sleep helper
- Email templates point to auria-ai.vercel.app

**Functional/Bug (7):**
- vitaShadeManuallySetRef never reset
- handlePatientProfile redirect during render
- handleSubmit sets isSubmitting(false) twice
- updatePatientBirthDate errors swallowed
- useWizardDraftRestore missing deps in useCallback
- usePatientProfile tooth as session key (not unique)
- SharedEvaluation async setState after unmount

**Performance (6):**
- Landing page eagerly loaded
- DSDStep inline arrow defeats React.memo
- GlobalSearch fetches all evals on every keystroke
- PhotoUploadStep handler recreated every render
- PatientAutocomplete analytics on every filter
- AnalyzingStep array recomputed every 110ms

**UX/Accessibility (11):**
- PatientProfile: blank screen on not-found
- ComparisonSlider: no keyboard/ARIA
- AnnotationOverlay: color-only encoding, no ARIA
- DSDWhiteningComparison: divs with onClick, no keyboard
- DSDSimulationViewer: layer tabs no tablist/aria-selected
- Patients: hardcoded Portuguese aria-label
- ProtocolChecklist: label association broken
- AddTeethModal: divs not keyboard-accessible
- WelcomeModal: dots no aria-current

**Test Coverage (13):**
- protocol-fingerprint tested via inline copies
- drafts.ts upsert logic untested
- referral.ts credit mutation untested
- useWizardSubmit full flow untested
- CreditConfirmDialog untested
- storage.ts signed URL functions untested
- imageUtils.ts compressImage untested
- compositeGingivo.ts pixel compositing untested
- EvaluationDetails page+helpers untested
- PhotoUploader component untested
- AddTeethModal component untested
- DSDSimulationViewer untested
- usePatientProfile hook untested

### P2 - Medium (66)

**Security (6):**
- localStorage token storage (XSS risk)
- chart.tsx CSS injection via unsanitized color values
- recommend-cementation unvalidated prompt fields
- delete-account DB error strings exposed
- data-export over-disclosure via select(*)
- handleError short-message leak

**Code Quality (15):**
- getAvatarPublicUrl needless wrapper
- invokeEdgeFunction unused/superseded
- withQuery hides null with cast
- getMonthlyStats client-side GROUP BY
- Broad unknown types in DraftRow/DataExport
- blurMask unused kernelSize variable
- validateCaseData dead code
- Prompt registry uses any (5 lint suppressions)
- cors.ts stale auria-ai.vercel.app origin
- email.ts templates wrong domain
- metrics.ts stale model ID
- getContralateralTooth in wrong layer
- getDashboardMetrics suspicious status fallback
- blurMask quadratic complexity
- console.warn in generatePDF instead of logger

**Functional/Bug (9):**
- validateForm DOB warning non-blocking
- Auto-save triggers at step 6
- getContralateralTooth rejects deciduous teeth
- drafts.save TOCTOU race
- useEvaluationSessions 100-item limit
- useGroupResult checklistMutation no rollback
- useResult handleExportPDF missing t dep
- useProfile Stripe redirect no guard
- usePatientProfile pagination off-by-one

**Performance (8):**
- TreatmentBanners duplicate filter
- ProportionsCard unmemoized array
- CaseSummaryCard IIFE every render
- DSDAnalysisView unused layerUrls defeats memo
- CementationProtocolCard inline .sort() mutates
- ProtocolChecklist index as key
- Google Fonts @import render-blocking
- DSDWhiteningComparison heavy ComparisonSliders

**UX/Accessibility (18):**
- AuthLayout div role="main" instead of main element
- ResetPassword missing autoComplete
- PatientDataSection label not associated
- Dashboard decorative icons no aria-hidden
- StepIndicator dots color-only state
- GlobalSearch loading no aria-live
- OfflineBanner no "back online" announcement
- ConfidenceIndicator color-only bars
- EvaluationDetails selection bar no focus/aria
- PatientProfile inline button tiny touch target
- NewCase processing text no aria-live
- Inventory search input no label
- Profile logo upload not keyboard-accessible
- SubscriptionStatus progress bar no label
- DSDErrorState window.location.href loses state
- Evaluations success banner no role="status"
- DSDLoadingState progress ring not announced
- PhotoUploadStep drop zone no ARIA

**Test Coverage (10):**
- useResult/useGroupResult hooks never instantiated
- useWizardSubmit weak assertion coverage
- useWizardFlow.integration misleading name
- useWizardDraft debounce untested
- deleteAccount negative test weak
- evaluations share link mock limitation
- useAuthenticatedFetch token refresh untested
- data/utils foundational wrappers untested
- useSpeechToText untested
- useVirtualList untested

### P3 - Low (34)

(Cosmetic, naming, minor refactoring — listed in individual agent reports)

## Action Plan

### Batch 1: P0 Critical Fixes (13 items)
- Security: Server-side reqId generation
- Functional: Double-submit ref guard, dashboard metrics fix, handleSubmitTeeth try/catch
- Code: sanitizeForPrompt sync check, shareLink upsert
- Performance: PostHog event-based consent
- UX: Focus traps, keyboard access, error states
- Tests: retry.ts + complexity-score.ts

### Batch 2: P1 High-Priority Fixes (51 items)
- Security: health-check auth, error leaks, CORS sync, referral validation
- Functional: Shade ref reset, render-time redirect, isSubmitting timing
- Code: Dedup circuit breaker/parseDataUrl/sleep, email domain fix, referral increment
- Performance: Lazy-load Landing, memoize callbacks, search caching
- UX: Keyboard access for sliders/modals, ARIA labels
- Tests: Critical untested files (drafts, referral, storage, imageUtils, etc.)

### Batch 3: P2 Medium Fixes (66 items)
- Broad improvements across all dimensions

### Batch 4: P3 Low Fixes (34 items)
- Cosmetic and minor consistency improvements
