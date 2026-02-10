---
title: "Code Quality & Technical Debt Audit — AURIA Platform"
created: 2026-02-10
updated: 2026-02-10
status: draft
author: Senior Developer Agent
tags:
  - type/audit
  - area/code-quality
  - status/draft
related:
  - "[[2026-02-08-comprehensive-audit-design]]"
  - "[[2026-02-08-codebase-health-report]]"
---

# Code Quality & Technical Debt Audit — AURIA Platform

> **Date**: 2026-02-10
> **Scope**: Frontend (`apps/web/src/`), Backend (`supabase/functions/`), Build & Tooling
> **Codebase Size**: ~180 source files, ~27,900 lines (frontend) + ~8,200 lines (edge functions)
> **Previous Audit**: 2026-02-08 gave Code Quality B+

---

## Executive Summary

| Category | Grade | Delta | Notes |
|----------|-------|-------|-------|
| Architecture & Layering | A- | = | 3-layer pattern well followed, data layer clean |
| Type Safety | A- | UP | Zero `any` usage in frontend, strict mode enabled |
| Component Design | C+ | -- | 5 files >500 lines, 1 file >1300 lines (God Hook) |
| Code Duplication | C | NEW | TreatmentType defined 5 times, DetectedTooth 2 times |
| Performance Patterns | B+ | = | Good lazy loading, manual chunks, selective memo |
| Error Handling | B | = | ErrorBoundary on every route, try/catch patterns consistent |
| Edge Function Quality | B | = | Consistent patterns but Stripe webhook has 7 `any` suppressions |
| Build & Tooling | A- | = | Strict TS, good Vite config, manual chunk splitting |
| Test Coverage | C- | NEW | 28 test files for 180 source files (~15% file coverage) |
| Dead Code | B+ | NEW | Minimal; no commented-out code, no unused exports found |

**Overall: B (up from B+ context -- deeper analysis revealed structural issues)**

---

## 1. Technical Debt Inventory

### 1.1 Large Files (>300 lines)

| File | Lines | Role | Issues | Priority |
|------|-------|------|--------|----------|
| `hooks/domain/useWizardFlow.ts` | 1,355 | Wizard orchestrator hook | God Hook: 30+ useState, 7 useEffect, 25+ callbacks. Too many responsibilities. | P0 CRITICAL |
| `components/wizard/DSDStep.tsx` | 1,333 | DSD analysis UI | Mixed concerns: API calls + UI + compositing logic + state management. Should be split. | P0 CRITICAL |
| `components/wizard/ReviewAnalysisStep.tsx` | 1,116 | Review form UI | Monolith component. PillToggle defined inline. Contains type exports. | P1 HIGH |
| `lib/generatePDF.ts` | 731 | PDF generation | Procedural, single function. No helper extraction. Hardcoded styles. | P1 HIGH |
| `components/wizard/PhotoUploadStep.tsx` | 609 | Photo upload UI | Acceptable for complex upload logic. | P2 MEDIUM |
| `components/AddTeethModal.tsx` | 570 | Add teeth modal | Contains duplicate TreatmentType. Direct supabase import. | P2 MEDIUM |
| `hooks/domain/useResult.ts` | 544 | Result page hook | TreatmentStyles config (100 lines) should be extracted. | P2 MEDIUM |
| `pages/EvaluationDetails.tsx` | 542 | Evaluation detail page | Presentation helpers defined inline. Could use extraction. | P3 LOW |
| `pages/Landing.tsx` | 521 | Landing page | Acceptable for a marketing page. | P3 LOW |
| `pages/Result.tsx` | 495 | Result page | Mostly JSX composition. Acceptable with the useResult hook. | P3 LOW |
| `hooks/domain/useDashboard.ts` | 459 | Dashboard hook | Complex aggregation logic. Could benefit from splitting. | P3 LOW |
| `hooks/domain/useEvaluationDetail.ts` | 455 | Evaluation detail hook | Well structured with query keys factory. Acceptable. | P3 LOW |

**Backend large files:**

| File | Lines | Issues | Priority |
|------|-------|--------|----------|
| `generate-dsd/index.ts` | 1,130 | Largest edge function. Multiple image processing paths. | P1 HIGH |
| `_shared/prompts/definitions/recommend-resin.ts` | 923 | Prompt definition file -- size is inherent to the detailed prompt. | P3 LOW |
| `_shared/gemini.ts` | 714 | AI client shared module. Multiple call patterns. | P2 MEDIUM |
| `recommend-resin/index.ts` | 674 | Second largest function. Has whitening color maps duplicated. | P2 MEDIUM |
| `_shared/prompts/definitions/dsd-analysis.ts` | 676 | Large prompt definition. Expected. | P3 LOW |
| `analyze-dental-photo/index.ts` | 575 | Photo analysis function. Treatment normalization logic duplicated. | P2 MEDIUM |
| `_shared/validation.ts` | 420 | Shared validation utilities. | P3 LOW |

### 1.2 Complexity Hotspots

| File:Location | Cyclomatic Complexity Estimate | Issue |
|---|---|---|
| `useWizardFlow.ts:467-841` (`handleSubmit`) | ~25 | 375-line function with nested loops, try/catch, multiple switch cases, per-tooth retry logic |
| `useWizardFlow.ts:240-377` (`analyzePhoto`) | ~15 | 137-line function with nested error classification |
| `DSDStep.tsx:313-413` (`generateAllLayers`) | ~12 | Parallel promise handling + compositing + state updates |
| `DSDStep.tsx:533-668` (`analyzeDSD`) | ~15 | Retry logic, credit checks, analysis + simulation orchestration |
| `generatePDF.ts:30-731` (`generateProtocolPDF`) | ~20+ | Single 700-line procedural function, no decomposition |

---

## 2. Code Patterns Analysis

### 2.1 Good Patterns Found

1. **3-Layer Architecture (A-)**: `src/data/` -> `src/hooks/domain/` -> `src/pages/` adapter pattern is well followed. Data layer (`evaluations.ts`, `patients.ts`, etc.) is clean, query-only, no business logic.

2. **ESLint Architecture Guard** (`eslint.config.js:48-62`): Custom rule prevents direct Supabase imports in pages/domain hooks, enforcing the data layer. Well-designed with explicit exceptions for auth pages and wizard.

3. **Lazy Loading (A)** (`App.tsx:29-41`): All protected pages are lazily loaded. Dashboard sub-tabs also lazy-loaded. Good `PageLoader` fallback.

4. **Error Boundaries (A)** (`App.tsx:91-108`): Every route wrapped in `<ErrorBoundary>`. Dedicated test file exists.

5. **Query Key Factories** (`useEvaluationDetail.ts:18-25`): Proper TanStack Query key factories with consistent naming.

6. **Manual Chunk Splitting** (`vite.config.ts:23-58`): Thoughtful chunking -- React, Radix, Query, Supabase, PDF, HEIC, Recharts all in separate chunks. PDF and HEIC are lazy-loaded chunks.

7. **Optimistic Updates** (`useResult.ts:318-344`): Checklist mutations use proper optimistic updates with rollback on error.

8. **Strict TypeScript** (`tsconfig.app.json`): `strict: true`, `noImplicitAny: true`, `noUnusedLocals: true`, `noUnusedParameters: true`.

9. **Zero `any` Usage**: The frontend has **zero** instances of `: any` or `as any` across all 180 source files. Only 2 `as never` casts (for Supabase insert typing workaround).

10. **Centralized Logger** (`lib/logger.ts`): All logging goes through a centralized logger that suppresses non-error logs in production.

11. **Consistent Edge Function Pattern**: All AI edge functions follow the same structure: CORS -> Auth -> Rate limit -> Credits -> AI call -> Response. Shared utilities in `_shared/`.

12. **Retry with Exponential Backoff** (`lib/retry.ts`): Used consistently across wizard flow and DSD step for network resilience.

13. **memo Usage on Leaf Components**: Protocol display components (`ProtocolTable`, `AlertsSection`, `ConfidenceIndicator`, etc.) are properly memoized.

14. **beforeunload Guard** (`useWizardFlow.ts:1240-1250`): Prevents accidental data loss during wizard steps 2-5.

### 2.2 Anti-Patterns Found

1. **God Hook: `useWizardFlow.ts` (1,355 lines)** -- CRITICAL
   - 30+ `useState` declarations (lines 65-100)
   - 7 `useRef` declarations (lines 103-120)
   - 7 `useEffect` hooks (lines 1159-1284)
   - 25+ `useCallback` functions
   - Returns 50+ values (lines 1290-1354)
   - Mixes concerns: photo upload, AI analysis, credit management, form validation, draft persistence, DSD orchestration, submission logic, navigation, patient management

   **Recommendation**: Extract into 5-6 focused hooks:
   - `useWizardPhotos` (image state, upload, reanalyze)
   - `useWizardCredits` (credit checks, confirmation dialog)
   - `useWizardSubmission` (handleSubmit, progress tracking)
   - `useWizardDSD` (DSD result handling, gengivoplasty logic)
   - `useWizardNavigation` (step management, back/forward)
   - `useWizardPatient` (patient selection, birth date)

2. **Duplicated Type Definitions** -- HIGH
   - `TreatmentType` defined in 4 separate files with subtle differences:
     - `ReviewAnalysisStep.tsx:37` -- includes `recobrimento_radicular`
     - `AddTeethModal.tsx:26` -- missing `recobrimento_radicular`
     - `treatment-config.ts:9` -- includes `recobrimento_radicular`
     - `types/dsd.ts:14` -- as `TreatmentIndication`, same values
   - `DetectedTooth` interface defined in both `ReviewAnalysisStep.tsx:40` and `analyze-dental-photo/index.ts:55`

   **Impact**: Risk of enum drift. AddTeethModal already diverges (missing `recobrimento_radicular`).

   **Recommendation**: Single source of truth in `src/types/treatment.ts`, re-exported from components.

3. **Direct Supabase Imports in Components** -- MEDIUM
   - `DSDStep.tsx:2` -- imports supabase directly for storage operations
   - `AddTeethModal.tsx:2` -- imports supabase directly for inserts
   - `PatientAutocomplete.tsx:2` -- imports supabase for patient search
   - `PhotoUploader.tsx:2` -- imports supabase for file upload
   - `GlobalSearch.tsx:4` -- imports supabase for search queries

   These bypass the data layer architecture. The ESLint rule only covers pages and domain hooks, not components.

   **Recommendation**: Extend ESLint rule to cover `src/components/` or create data layer functions for these operations.

4. **Type Exports from UI Components** -- MEDIUM
   - `ReviewAnalysisStep.tsx` exports: `TreatmentType`, `DetectedTooth`, `PhotoAnalysisResult`, `ReviewFormData`, `TREATMENT_LABELS`, `TREATMENT_DESCRIPTIONS`
   - `DSDStep.tsx` re-exports: `TreatmentIndication`, `DSDSuggestion`, `DSDAnalysis`, `DSDResult`

   UI components should not be the canonical source of domain types.

5. **Inline Component Definitions** -- LOW
   - `ReviewAnalysisStep.tsx:160-193`: `PillToggle` component defined inside the file
   - `EvaluationDetails.tsx:64-121`: `getTreatmentBadge`, `getStatusBadge`, `groupByTreatment` helper functions defined inline

6. **Prop Count Explosion** -- MEDIUM
   - `ReviewAnalysisStepProps` interface has 18 props (lines 128-152)
   - `DSDStepProps` interface has 10 props (lines 42-59)
   - Indicates these components are doing too much; consider composition or context.

7. **`as never` Casts** -- LOW (2 instances)
   - `useWizardFlow.ts:587` -- `.insert(insertData as never)`
   - `AddTeethModal.tsx:282` -- `.insert(insertData as never)`
   - These are Supabase typing workarounds. Not ideal but contained.

---

## 3. Performance Assessment

### 3.1 Good Performance Patterns

- **Route-Level Code Splitting**: All 11 protected pages are lazily loaded via `React.lazy`
- **Dashboard Sub-Tab Splitting**: `StatsGrid` and `InsightsTab` are separately lazy-loaded
- **Manual Vendor Chunks**: 8 explicit chunks in `vite.config.ts` for optimal caching
- **Selective memo**: 10 components properly memoized (protocol display components, resin components)
- **Stale Time Configuration**: Queries use appropriate `staleTime` (30s for evaluations, 5min for profiles)
- **Optimistic Updates**: Checklist progress updates optimistically
- **Chunk Size Limit**: Set to 600KB (appropriate since PDF/HEIC are lazy)

### 3.2 Performance Concerns

1. **Missing `useMemo`/`useCallback` in Large Components** -- MEDIUM
   - `ReviewAnalysisStep.tsx`: `treatmentBreakdown` (line 300) is recalculated in the component body using an IIFE instead of `useMemo`. The `renderToothCard` function (line 313) is not memoized despite being called in a loop.
   - `DSDStep.tsx`: `toothBounds` is properly memoized, but `analysisSteps` (line 61) is recreated every render (move outside component).

2. **Large Base64 Images in State** -- MEDIUM
   - `useWizardFlow.ts:69`: `imageBase64` stores the full base64-encoded image in React state. This is passed through multiple components. For high-res dental photos, this can be several MB.
   - **Recommendation**: Use an Object URL (`URL.createObjectURL`) instead, or store in a ref.

3. **Auto-Save Triggering Too Often** -- LOW
   - `useWizardFlow.ts:1210-1237`: Auto-save effect depends on 10 values including `formData`, `selectedTeeth`, `toothTreatments`. Any change triggers a save. Consider debouncing.

4. **No Image Optimization for Uploaded Photos** -- MEDIUM
   - Photos are uploaded at full resolution to Supabase storage (`useWizardFlow.ts:173-197`). No client-side resize before upload or before base64 conversion.

5. **No Virtualization for Tooth Lists** -- LOW
   - `ReviewAnalysisStep.tsx` renders all detected teeth at once. For typical cases (1-10 teeth), this is fine. The `useVirtualList` hook exists but is not used here.

### 3.3 Bundle Size Notes

- `jspdf` chunk is lazy-loaded (only on PDF export) -- good
- `heic-to` chunk is lazy-loaded (only for HEIC image conversion) -- good
- `recharts` chunk is only used in Dashboard InsightsTab (lazy-loaded) -- good
- `lucide-react` icons are tree-shaken (named imports throughout) -- good

---

## 4. Dead Code Report

### 4.1 Findings

The codebase is remarkably clean of dead code:

- **No commented-out code blocks found** across all source files
- **No TODO/FIXME/HACK comments** -- zero instances
- **No unused imports** detected (enforced by `noUnusedLocals` and `noUnusedParameters` in tsconfig)
- **`eslint-disable` suppressions**: 7 instances, all for `react-refresh/only-export-components` (legitimate for files that export both components and utilities)

### 4.2 Potentially Unused Code

1. **`useVirtualList.ts`** (hook exists but `Grep` shows no imports outside tests) -- Verify if this is used anywhere. May be dead code.

2. **`sample-case.ts`** (`data/sample-case.ts`) -- Used only when `?sample=true` URL param is present. Feature flag gating. Verify if still needed.

3. **`use-toast.ts`** vs `use-toast.ts` in `components/ui/` -- Two toast-related files. One in `hooks/`, one in `components/ui/`. Verify they serve different purposes.

4. **`TREATMENT_DESCRIPTIONS`** (`ReviewAnalysisStep.tsx:85-94`) -- Exported constant. Verify if imported anywhere else.

---

## 5. Edge Function Quality

### 5.1 Consistent Patterns (Good)

All AI edge functions follow a shared architecture:
```
CORS preflight -> Auth (manual via supabase.auth.getUser) -> Rate limit check
  -> Credit check/deduction -> AI call (Gemini) -> Save result -> Respond
  -> On error: refund credits + structured error response
```

Shared modules are well-factored:
- `_shared/cors.ts` (82 lines) -- CORS + error response helpers
- `_shared/logger.ts` (28 lines) -- Structured logger
- `_shared/rateLimit.ts` (238 lines) -- Per-user rate limiting
- `_shared/credits.ts` (213 lines) -- Credit management
- `_shared/gemini.ts` (714 lines) -- Gemini AI client wrapper
- `_shared/validation.ts` (420 lines) -- Input validation
- `_shared/prompts/` -- Centralized prompt management (ADR-003)

### 5.2 Issues Found

1. **`stripe-webhook/index.ts` has 7 `eslint-disable` for `@typescript-eslint/no-explicit-any`** -- The Stripe webhook handler uses `any` extensively. This is the only backend file with type safety concerns.

2. **`generate-dsd/index.ts` is 1,130 lines** -- The largest edge function. It handles both analysis-only and simulation modes, multi-layer generation, image editing, and compositing. Should be split into orchestration + analysis + simulation modules.

3. **Duplicated Treatment Normalization** -- Treatment indication normalization exists in both `analyze-dental-photo/index.ts:24-46` (TREATMENT_INDICATION_MAP) and `useWizardFlow.ts:530-534` (inline normalization map). Should have a single shared normalization.

4. **Whitening Color Maps Duplicated** -- `recommend-resin/index.ts:67-88` defines a `whiteningColorMap` that maps VITA shades to lighter variants. This clinical data should be in `_shared/` if used by multiple functions.

5. **No Request Body Size Limit** -- Edge functions accept `imageBase64` without apparent size validation (beyond format check). The base64 image could be very large.

### 5.3 Error Handling Consistency

| Function | Auth | Rate Limit | Credits | Error Response | Request ID |
|----------|------|-----------|---------|----------------|------------|
| `analyze-dental-photo` | Yes | Yes | Yes (check+use) | Structured | Yes |
| `generate-dsd` | Yes | Yes | Yes (check+use+refund) | Structured | Yes |
| `recommend-resin` | Yes | Yes | No (deducted by caller) | Structured | Yes |
| `recommend-cementation` | Yes | Yes | No (deducted by caller) | Structured | Yes |
| `stripe-webhook` | Stripe signature | N/A | N/A | Basic | No |
| `create-checkout-session` | Yes | No | N/A | Basic | No |
| `sync-subscription` | Yes | No | N/A | Basic | No |
| `health-check` | No | No | N/A | Basic | No |

> [!warning]
> `create-checkout-session` and `sync-subscription` lack rate limiting. A malicious user could hammer the Stripe API.

---

## 6. Build & Tooling Assessment

### 6.1 TypeScript Configuration (A-)

**`tsconfig.app.json`**:
- `strict: true` -- enables all strict checks
- `noImplicitAny: true` -- no implicit any
- `noUnusedLocals: true` -- catches dead variables
- `noUnusedParameters: true` -- catches unused params
- `noFallthroughCasesInSwitch: false` -- intentionally disabled (not ideal, but not critical)

**Minor issue**: `skipLibCheck: true` skips type-checking of `.d.ts` files. This is standard for build performance but can mask issues in dependencies.

### 6.2 ESLint Configuration (B+)

**Good**:
- Uses flat config (`eslint.config.js`)
- TypeScript-ESLint recommended rules enabled
- React Hooks rules enabled
- Custom architecture guard rule for data layer boundaries

**Issues**:
- `@typescript-eslint/no-unused-vars: "off"` -- This is disabled, which means unused variables won't be caught by ESLint. TypeScript's `noUnusedLocals` partially compensates, but ESLint could catch more edge cases.
- Architecture guard only covers `pages/` and `hooks/domain/`, not `components/`. 5 components bypass the data layer.

### 6.3 Vite Configuration (A-)

**Good**:
- React SWC plugin (faster than Babel)
- Manual chunk splitting for 8 vendor groups
- Chunk size warning at 600KB (reasonable for lazy-loaded chunks)
- HMR overlay disabled (prevents dev-time UX issues)

**Minor issue**: No `sourcemap` configuration. Consider enabling source maps in production for error tracking (e.g., with Sentry).

### 6.4 Test Infrastructure (C-)

- 28 test files for 180 source files (~15% file coverage)
- Tests exist for: ErrorBoundary, CookieConsent, ThemeToggle, ProtectedRoute, ThemeProvider, useEvaluations, useSignedUrl, useSubscription, useAuthenticatedFetch, useWizardDraft
- No tests for: useWizardFlow, DSDStep, ReviewAnalysisStep, generatePDF, any edge function, any data layer function

> [!danger]
> The most complex and critical code (useWizardFlow at 1,355 lines, DSDStep at 1,333 lines) has zero test coverage.

---

## 7. Refactoring Roadmap

### Priority Tiers

| # | Task | Priority | Effort | Impact | Files Affected |
|---|------|----------|--------|--------|----------------|
| 1 | Split `useWizardFlow.ts` into 5-6 focused hooks | P0 | XL | Reduces cognitive load, enables testing, prevents bugs | `hooks/domain/useWizardFlow.ts`, `pages/NewCase.tsx` |
| 2 | Extract shared `TreatmentType` to `src/types/treatment.ts` | P0 | S | Eliminates enum drift risk | 5+ files |
| 3 | Split `DSDStep.tsx` into `DSDAnalysisView`, `DSDSimulationView`, `useDSDAnalysis` hook | P1 | L | Separates concerns, enables testing | `components/wizard/DSDStep.tsx` |
| 4 | Extract `ReviewAnalysisStep.tsx` type exports to `src/types/` | P1 | S | Domain types out of UI component | `components/wizard/ReviewAnalysisStep.tsx`, importers |
| 5 | Extract `generatePDF.ts` into section-based helpers | P1 | M | Maintainability, testability | `lib/generatePDF.ts` |
| 6 | Extend ESLint architecture guard to `src/components/` | P1 | S | Prevents data layer leaks | `eslint.config.js` |
| 7 | Split `generate-dsd/index.ts` edge function | P2 | L | Maintainability | `supabase/functions/generate-dsd/` |
| 8 | Add debouncing to wizard auto-save | P2 | S | Prevents excessive writes | `useWizardFlow.ts` |
| 9 | Move `treatmentStyles` config out of `useResult.ts` | P2 | S | Cleaner hook, reusable config | `hooks/domain/useResult.ts` |
| 10 | Fix `AddTeethModal.tsx` TreatmentType divergence | P2 | S | Type consistency | `components/AddTeethModal.tsx` |
| 11 | Add rate limiting to `create-checkout-session` | P2 | S | Security | `supabase/functions/create-checkout-session/` |
| 12 | Add tests for `useWizardFlow` (critical path) | P1 | L | Regression prevention | New test file |
| 13 | Client-side image resize before upload | P2 | M | Performance, storage cost | `useWizardFlow.ts` upload logic |
| 14 | Fix Stripe webhook `any` types | P3 | M | Type safety | `supabase/functions/stripe-webhook/` |
| 15 | Extract `PillToggle` to shared component | P3 | S | Reusability | `components/wizard/ReviewAnalysisStep.tsx` |
| 16 | Verify `useVirtualList` usage (potential dead code) | P3 | S | Cleanup | `hooks/useVirtualList.ts` |
| 17 | Add source maps for production error tracking | P3 | S | Debugging | `vite.config.ts` |
| 18 | Re-enable `@typescript-eslint/no-unused-vars` | P3 | S | Code hygiene | `eslint.config.js` |

---

## 8. Quick Wins (< 1 hour each)

### QW-1: Consolidate TreatmentType (30 min)
Create `src/types/treatment.ts`:
```ts
export type TreatmentType = 'resina' | 'porcelana' | 'coroa' | 'implante' | 'endodontia' | 'encaminhamento' | 'gengivoplastia' | 'recobrimento_radicular';
```
Update all 5 files to import from this single source.

### QW-2: Fix AddTeethModal Type Drift (10 min)
`AddTeethModal.tsx:26` is missing `recobrimento_radicular` in its TreatmentType. After QW-1, this is automatically fixed by importing from the shared type.

### QW-3: Extract `PillToggle` Component (20 min)
Move `PillToggle` from `ReviewAnalysisStep.tsx:160-193` to `components/ui/pill-toggle.tsx`. It is a reusable form component.

### QW-4: Move `analysisSteps` Outside Component (5 min)
`DSDStep.tsx:61-66`: The `analysisSteps` constant is defined inside the component but never changes. Move it to module scope to prevent recreation on every render.

### QW-5: Move `treatmentStyles` Config (15 min)
Move the `treatmentStyles` record from `useResult.ts:108-205` (100 lines) to `lib/treatment-styles.ts`.

### QW-6: Add Debounce to Auto-Save (20 min)
`useWizardFlow.ts:1210-1237`: Wrap `saveDraft()` call in a debounced callback (e.g., 2-second delay). Prevents excessive writes during rapid form edits.

### QW-7: Extract Inline Helpers from EvaluationDetails (30 min)
Move `getTreatmentBadge`, `getStatusBadge`, and `groupByTreatment` from `EvaluationDetails.tsx:64-121` to a dedicated `lib/evaluation-helpers.tsx` or into the domain hook.

### QW-8: Re-enable `no-unused-vars` ESLint Rule (10 min)
Change `eslint.config.js:23` from `"off"` to `["warn", { argsIgnorePattern: "^_" }]`. This catches unused variables while allowing intentional `_` prefixed params.

### QW-9: Add Rate Limiting to Checkout Session (15 min)
Import `checkRateLimit` in `create-checkout-session/index.ts` and add a rate limit check (e.g., 10 requests/minute per user).

### QW-10: Remove Console.warn from generatePDF (5 min)
`generatePDF.ts:124`: Uses `console.warn` directly instead of the centralized `logger`. Replace with `logger.warn`.

---

## Appendix A: File-by-File Notes

### Pages

| File | Lines | Notes |
|------|-------|-------|
| `Dashboard.tsx` | 210 | Clean adapter. Lazy-loads sub-tabs. Good. |
| `NewCase.tsx` | 327 | Thin adapter to `useWizardFlow`. Good architecture. |
| `Result.tsx` | 495 | Good separation via `useResult` hook. |
| `EvaluationDetails.tsx` | 542 | Inline helpers should be extracted. |
| `Landing.tsx` | 521 | Marketing page. Direct supabase import (for plans query). |
| `Inventory.tsx` | 392 | Uses memo for cards. Good. |
| `Profile.tsx` | 378 | Complex form. Direct supabase import (excluded from ESLint rule). |
| `PatientProfile.tsx` | 318 | Moderate complexity. |
| `Evaluations.tsx` | 199 | Uses memo for session cards. Clean. |

### Domain Hooks

| File | Lines | Notes |
|------|-------|-------|
| `useWizardFlow.ts` | 1,355 | God Hook. Must be decomposed. |
| `useResult.ts` | 544 | Contains treatmentStyles config (extract). Otherwise good. |
| `useDashboard.ts` | 459 | Complex aggregation. Well-structured. |
| `useEvaluationDetail.ts` | 455 | Good query key factory. Well-typed interfaces. |
| `useInventoryManagement.ts` | 371 | CRUD operations. Clean. |
| `useProfile.ts` | 272 | Profile management. Clean. |
| `usePatientProfile.ts` | 272 | Patient detail. Clean. |
| `usePatientList.ts` | ~200 | List with search. Clean. |
| `useOnboardingProgress.ts` | ~150 | Small, focused. Good. |

### Data Layer

| File | Lines | Notes |
|------|-------|-------|
| `evaluations.ts` | 322 | Well-organized. Query functions + dashboard helpers. Clean. |
| `index.ts` | 21 | Barrel export with namespace imports. Good pattern. |
| `client.ts` | ~10 | Re-exports supabase client. |
| Others | <100 each | Clean, focused data access modules. |

---

## Appendix B: Type Safety Deep Dive

### Frontend Type Safety: A-

- **Zero `any`**: Grep confirmed 0 instances of `: any` or `as any` across all frontend source files
- **2 `as never`**: Both in Supabase `.insert()` calls -- a known workaround for Supabase's generated types
- **`strict: true`**: Full strict mode in tsconfig.app.json
- **Missing**: Some error catches use `error as { message?: string }` pattern (e.g., `useWizardFlow.ts:331-332`) instead of proper error type narrowing. This is functional but not ideal.

### Backend Type Safety: B-

- **7 `eslint-disable @typescript-eslint/no-explicit-any`**: All in `stripe-webhook/index.ts`
- **1 `eslint-disable`**: In `generate-dsd/index.ts:253`
- **Deno typing quirks**: `_shared/credits.ts` has a known `credits_per_month` cast issue (pre-existing)
- **Type duplications**: `DetectedTooth`, `TreatmentIndication` defined separately in edge functions vs frontend

---

## Appendix C: Architecture Compliance

### 3-Layer Pattern Adherence

```
Layer 1: Data Client (src/data/)
  - evaluations.ts, patients.ts, profiles.ts, inventory.ts, etc.
  - Pure query functions, no business logic
  - Single Supabase import point

Layer 2: Domain Hooks (src/hooks/domain/)
  - useWizardFlow.ts, useResult.ts, useDashboard.ts, etc.
  - Business logic, state management, derived data
  - Import from Layer 1

Layer 3: Page Adapters (src/pages/)
  - Dashboard.tsx, Result.tsx, NewCase.tsx, etc.
  - Wire domain hook to PageShell composites
  - Minimal logic
```

**Compliance**: ~85%

**Violations**:
- 5 components import supabase directly (bypassing data layer)
- `useWizardFlow.ts` imports supabase directly (acknowledged exception in ESLint config)
- `Landing.tsx` imports supabase directly (out-of-scope page)

---

*Generated by Senior Developer Agent on 2026-02-10*
