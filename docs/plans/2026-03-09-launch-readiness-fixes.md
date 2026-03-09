# Launch Readiness Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all confirmed findings from the 6-domain launch readiness audit

**Architecture:** Fixes organized by severity (blockers → high → nice-to-have), grouped by domain for parallel execution

**Tech Stack:** React 18, TypeScript, Vite, Tailwind, Supabase Edge Functions (Deno), Playwright

---

## Audit Findings Summary (Verified)

### False Positives (DEBUNKED — no action needed)
- ~~F1: Whitening keyboard a11y~~ — already has `onKeyDown` (lines 105-108)
- ~~S2: .env in git~~ — confirmed untracked via `git ls-files --others`
- ~~ReviewAnalysisStep ARIA tabs~~ — already has `role="tab"` + `aria-selected`
- ~~Google Fonts display=swap~~ — already in URL
- ~~Error leaks in recommend-resin/cementation/analyze-dental-photo~~ — already using ERROR_MESSAGES
- ~~select("*") in recommend-resin/create-checkout-session~~ — not found

---

## Phase 1: BLOCKERS (Critical)

### Task 1: Lip validator fail-CLOSED for gingival layers
**Files:** `supabase/functions/generate-dsd/simulation.ts:492`
**Change:** When lip validator crashes on gingival layers, return `{ valid: false, error: true }` instead of `{ valid: true, error: true }`.

### Task 2: Fix site_url in Supabase config
**Files:** `supabase/config.toml:4`
**Change:** `site_url = "https://tosmile.ai"` → `site_url = "https://tosmile-ai.vercel.app"`

### Task 3: Patients form a11y — aria-describedby for validation errors
**Files:** `apps/web/src/pages/Patients.tsx:357-381`
**Change:** Add `aria-describedby` to phone and email inputs linking to error messages. Add `id` to error `<p>` elements.

### Task 4: Remove Portuguese defaultValue fallbacks from t() calls
**Files:** `apps/web/src/pages/Patients.tsx:203,217-220`, `apps/web/src/pages/Evaluations.tsx:324,334-339`
**Change:** Add missing keys to `en-US.json` and remove all `defaultValue` props. Verify keys exist in `pt-BR.json` too.

---

## Phase 2: HIGH PRIORITY

### Task 5: check-photo-quality — remove debug error leak
**Files:** `supabase/functions/check-photo-quality/index.ts:230`
**Change:** Remove `debug: errMsg` from 500 response, keep only `error: "Internal error"`.

### Task 6: generate-dsd — remove simulation_debug leak
**Files:** `supabase/functions/generate-dsd/index.ts:192-195`
**Change:** Remove `simulation_debug` from response. Keep server-side log only.

### Task 7: health-check — add rate limiting to Gemini test branches
**Files:** `supabase/functions/health-check/index.ts:28-31`
**Change:** Add `checkRateLimit` call before Gemini branches execute.

### Task 8: shade-validation — raise minRequired from 3 to 4 for anterior aesthetic
**Files:** `supabase/functions/recommend-resin/shade-validation.ts:58`
**Change:** `const minRequired = 3;` → `const minRequired = 4;`

### Task 9: post-processing lower teeth filter — fix asymmetry (> to >=)
**Files:** `supabase/functions/analyze-dental-photo/post-processing.ts` (lower teeth filter)
**Change:** `upperTeeth.length > lowerTeeth.length` → `upperTeeth.length >= lowerTeeth.length`

### Task 10: i18n — WHITENING_LABELS should use t()
**Files:** `apps/web/src/components/wizard/dsd/DSDWhiteningComparison.tsx:18-21`
**Change:** Replace hardcoded labels with i18n keys. Add keys to `pt-BR.json` and `en-US.json`.

### Task 11: i18n — EXTENDED_PT_BR_MESSAGES to locale files
**Files:** `apps/web/src/App.tsx:18-39`, locale JSON files
**Change:** Move domain.odonto.* keys to locale JSONs instead of inline object.

### Task 12: deno.lock deletion in CI deploy workflow
**Files:** `.github/workflows/deploy-edge-functions.yml`
**Change:** Add `rm -f deno.lock` step before deploy loop.

### Task 13: CI audit level — critical to high
**Files:** `.github/workflows/test.yml`
**Change:** `--audit-level=critical` → `--audit-level=high`

### Task 14: noFallthroughCasesInSwitch — enable
**Files:** `apps/web/tsconfig.app.json:11`
**Change:** `"noFallthroughCasesInSwitch": false` → `"noFallthroughCasesInSwitch": true`

### Task 15: SharedEvaluation — fix `any` type
**Files:** `apps/web/src/pages/SharedEvaluation.tsx:49`
**Change:** Replace `(e: any)` with proper type.

### Task 16: auto-save debounce
**Files:** `apps/web/src/hooks/domain/wizard/useWizardAutoSave.ts:60-90`
**Change:** Add 2-second debounce to auto-save effect.

---

## Phase 3: NICE-TO-HAVE

### Task 17: lucide-react in manualChunks
**Files:** `apps/web/vite.config.ts:70`
**Change:** Add `'vendor-icons': ['lucide-react']` to manualChunks.

### Task 18: manifest.json — id and orientation
**Files:** `apps/web/public/manifest.json`
**Change:** `"id": "/"` → `"id": "https://tosmile-ai.vercel.app/"`, `"orientation": "portrait"` → `"orientation": "any"`

### Task 19: PhotoUploadStep — restrict accept attribute
**Files:** `apps/web/src/components/wizard/PhotoUploadStep.tsx`
**Change:** `accept="image/*"` → `accept=".jpg,.jpeg,.png,.webp,.heic"`

### Task 20: window.history.back → navigate(-1)
**Files:** `apps/web/src/pages/GroupResult.tsx:33`, `apps/web/src/pages/Result.tsx:60`
**Change:** Replace `window.history.back()` with `navigate(-1)` from React Router.

### Task 21: LandingTestimonials — stable keys
**Files:** `apps/web/src/components/landing/LandingTestimonials.tsx:60`
**Change:** Replace `key={i}` with stable identifier.

---

*Created: 2026-03-09*
