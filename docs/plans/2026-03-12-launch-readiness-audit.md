---
title: "Launch Readiness Audit — AURIA / ToSmile.ai"
created: 2026-03-12
updated: 2026-03-12
status: published
tags:
  - type/audit
  - status/published
  - scope/full-app
related:
  - "[[2026-02-26-full-application-audit]]"
  - "[[../06-ADRs/ADR-Index]]"
  - "[[../00-Index/Home]]"
---

# Launch Readiness Audit — AURIA / ToSmile.ai

> 7 parallel agents audited the entire application across all dimensions on 2026-03-12.
> Target: **Commercial launch in Brazil, next week.**

## Overall Score: 7.1 / 10 (previous: 7.2)

| # | Dimension | Score | Prev | Δ | Verdict |
|---|-----------|-------|------|---|---------|
| 1 | **Security** | **8.4** | 8.1 | +0.3 | Strongest area. PHI encryption solid, Stripe robust |
| 2 | **Code Quality** | **7.8** | 7.1 | +0.7 | Major improvement — empty catches eliminated, decomposition done |
| 3 | **i18n** | **7.5** | 6.5 | +1.0 | Biggest jump — locale parity perfect, 19 keys still missing |
| 4 | **Frontend/UX** | **7.2** | 7.6 | -0.4 | PageShell adoption thorough, new a11y + dark mode issues found |
| 5 | **Architecture** | **7.1** | 7.6 | -0.5 | Decomposition improved, but query key scatter + new violations |
| 6 | **Performance/PWA** | **6.5** | 7.5 | -1.0 | SEO/PWA blockers found (unowned domain, SVG maskable icon) |
| 7 | **Testing** | **5.5** | 5.7 | -0.2 | Still weakest — 3 failing tests, no payment E2E |

---

## BLOCKS_LAUNCH — Must Fix Before Next Week

8 issues that **must be resolved** before commercial launch:

| # | Issue | Dimension | Severity | Effort |
|---|-------|-----------|----------|--------|
| BL-1 | **`dentai.pro` in OAuth redirect URLs** — unowned domain, attacker could purchase and receive OAuth tokens | Security | CRITICAL | 5 min |
| BL-2 | **CRON_SECRET/weekly-digest logic mismatch** — either digest never sends (401) or is publicly callable (no auth) | Security | HIGH | 15 min |
| BL-3 | **3 failing Deno tests** in `shade-validation.ts` — Cristas Proximais injection fires for ALL anterior cases, not just diastema. Real clinical bug | Testing + Clinical | CRITICAL | 30 min |
| BL-4 | **`budget` fallback to `'moderado'`** (deleted enum value) in `useWizardSubmit.ts:277` — violates Zod schema, tolerated by backend compat layer that could be removed | Code Quality | HIGH | 5 min |
| BL-5 | **`sitemap.xml` + `robots.txt` reference `tosmile.ai`** (unowned domain) — Google Search Console rejection, SEO broken | Performance/SEO | HIGH | 5 min |
| BL-6 | **SVG maskable icon** — Android PWA adaptive icon won't render; needs PNG 512×512 in safe zone | PWA | MEDIUM | 15 min |
| BL-7 | **Zero E2E for checkout/payment flow** — commercial launch with untested payment funnel | Testing | HIGH | 2-4 hrs |
| BL-8 | **Zero tests for `recommend-cementation`** — clinical protocol function with no safety net | Testing | HIGH | 1-2 hrs |

**Estimated total effort for BLOCKS_LAUNCH: ~5-8 hours**

---

## SHOULD_FIX — First Week Post-Launch

### Security (4 items)
| ID | Finding | Location |
|----|---------|----------|
| SF-S1 | Rate limit RLS policy uses `USING(true)` instead of `auth.role() = 'service_role'` | `003_rate_limits.sql:49` |
| SF-S2 | 4 SECURITY DEFINER functions in migration 046 lack `SET search_path = public` | `046_phi_encrypt_drafts.sql` |
| SF-S3 | Sentry Session Replay captures PHI without `beforeSend` filter (LGPD Art. 33 risk) | `main.tsx:22-24` |
| SF-S4 | DOMPurify 3.3.1 XSS vuln via jsPDF and posthog-js dependency chain | `package.json` |

### Architecture (11 items)
| ID | Finding | Location |
|----|---------|----------|
| SF-A1 | No `lib/query-keys.ts` — raw string query keys scattered across 10+ files | codebase-wide |
| SF-A2 | `useDSDStep.ts` lives in `components/` not `hooks/domain/`, imports `@/data` directly | `components/wizard/dsd/useDSDStep.ts` |
| SF-A3 | Pages call data layer directly: `PatientProfile` (delete), `Evaluations` (prefetch), `Pricing` (sync), `ResetPassword` (auth) | 4 page files |
| SF-A4 | Duplicate inventory query keys with different pageSize (30 vs 100) — cache divergence | `useWizardFlow.ts:58` |
| SF-A5 | 3 domain hooks import types from `@/components/AddTeethModal` instead of `@/types/` | `useEvaluationDetail.ts`, `useAddTeethFlow.ts`, `useEvaluationActions.ts` |
| SF-A6 | `useWizardFlow.ts` has 22 `useState` calls in single orchestrator | `useWizardFlow.ts` |
| SF-A7 | Pure helpers in `useWizardSubmit.ts` should move to `wizard/helpers.ts` | `useWizardSubmit.ts:79-82` |
| SF-A8 | Inline `isAnterior` in `recommend-resin/index.ts:495` should use `shade-validation.ts` helper | `recommend-resin/index.ts` |
| SF-A9 | `getContralateral` frontend handles deciduous teeth, backend doesn't | `tooth-utils.ts` vs `wizard.ts` |
| SF-A10 | `GroupEvaluation` duplicates `SessionEvaluationRow` with minor differences | `useGroupResult.ts` |
| SF-A11 | `withCreditProtection` usage not documented — exempt functions need JSDoc | `recommend-resin`, `recommend-cementation` |

### Code Quality (8 items)
| ID | Finding | Location |
|----|---------|----------|
| SF-Q1 | `handleSubmit` callback is 567 lines with 5 nested inner functions | `useWizardSubmit.ts:179-744` |
| SF-Q2 | `validateAndFixProtocolLayers` is 571 lines — largest single function | `shade-validation.ts:90-660` |
| SF-Q3 | `PhotoUploadStep.tsx` is 938 lines — HEIC logic should extract to `lib/image-utils.ts` | `PhotoUploadStep.tsx` |
| SF-Q4 | `recommend-resin/index.ts` (664 lines) and `recommend-cementation/index.ts` (614 lines) — no sub-function decomposition | edge functions |
| SF-Q5 | Silent `.catch(() => {})` on status update — leaves evaluations stuck in ANALYZING | `useEvaluationActions.ts:324,406` |
| SF-Q6 | Silent storage deletion failure — orphaned files | `evaluations.ts:478,492` |
| SF-Q7 | `as unknown as GroupEvaluation[]` double-cast hides type mismatch | `useGroupResult.ts:102,271` |
| SF-Q8 | `generic-protocol.ts:20` hardcoded treatment type list independent of `treatmentConfig` | `generic-protocol.ts` |

### Frontend/UX (14 items)
| ID | Finding | Location |
|----|---------|----------|
| SF-F1 | `text-muted-foreground/40` on `text-xs` fails WCAG AA contrast | `AnalyzingStep`, `PhotoUploadStep`, `CasosTab` |
| SF-F2 | Filter pills in CasosTab lack `aria-pressed` | `CasosTab.tsx:55-70` |
| SF-F3 | GlobalSearch missing combobox ARIA pattern | `GlobalSearch.tsx` |
| SF-F4 | CookieConsent missing `aria-modal`, no focus trap | `CookieConsent.tsx:46` |
| SF-F5 | Profile Avatar clickable but no keyboard/aria support | `Profile.tsx:154` |
| SF-F6 | 6 touch targets below 44px minimum | `PhotoUploadStep`, `EvaluationDetails`, `Inventory`, `DSDSimulationViewer` |
| SF-F7 | Activity feed colors have no dark mode variants | `PrincipalTab.tsx:249-253` |
| SF-F8 | Inline `style={{ animation }}` bypasses `prefers-reduced-motion` | `LandingHero`, `Terms`, `ResultStepWrapper`, `LegalPageLayout` |
| SF-F9 | CreditPackSection payment toggle lacks `aria-pressed` | `CreditPackSection.tsx:34-56` |
| SF-F10 | `text-[10px]` labels below minimum text size | `PatientPreferencesStep.tsx` |
| SF-F11 | DSD viewer popover items are raw buttons at ~28px | `DSDSimulationViewer.tsx:151-208` |
| SF-F12 | `border-l-amber-500` bypasses treatment color token system | `EvaluationCards.tsx:92` |
| SF-F13 | VeneerPreparationCard text colors missing dark variants | `VeneerPreparationCard.tsx` |
| SF-F14 | `Suspense fallback={null}` on lazy modals | `EvaluationDetails`, `DSDSimulationViewer` |

### Testing (9 items)
| ID | Finding | Location |
|----|---------|----------|
| SF-T1 | `useWizardCredits.ts` — zero tests (credit confirmation dialog) | `hooks/domain/wizard/` |
| SF-T2 | `useWizardDraftRestore.ts` — zero tests (draft detection/restore) | `hooks/domain/wizard/` |
| SF-T3 | `useWizardAutoSave.ts` — zero tests (auto-save on step change) | `hooks/domain/wizard/` |
| SF-T4 | `useAnalysisResultSync.ts` — zero tests (analysis → form state sync) | `hooks/domain/wizard/` |
| SF-T5 | `sync-credit-purchase/` and `sync-subscription/` — zero tests (billing sync) | `supabase/functions/` |
| SF-T6 | `create-checkout-session/` and `create-portal-session/` — zero tests | `supabase/functions/` |
| SF-T7 | `_shared/rateLimit.ts`, `circuit-breaker.ts`, `credits.ts` — zero tests | `supabase/functions/_shared/` |
| SF-T8 | `ProtectedRoute.test.tsx` — 3 tests permanently skipped (i18n mock issue) | `components/__tests__/` |
| SF-T9 | `useWizardFlow.test.ts` mocks all sub-hooks — can't detect integration bugs | `hooks/__tests__/` |

### i18n (6 items)
| ID | Finding | Location |
|----|---------|----------|
| SF-I1 | 19 missing JSON keys with visible PT fallbacks (PDF anamnesis/radiograph, DSD viewer, DraftRestoreModal, etc.) | multiple files |
| SF-I2 | `creditConfirm.description` uses `(s)` pluralization anti-pattern | `pt-BR.json` + `en-US.json` |
| SF-I3 | Hardcoded `"Erro: "` prefix in `useWizardSubmit.ts:714` | `useWizardSubmit.ts` |
| SF-I4 | Edge function `ERROR_MESSAGES` — 4 constants hardcoded PT, 51 call sites | `_shared/cors.ts:64-71` |
| SF-I5 | Mixed EN/PT in rateLimit response fields | `_shared/rateLimit.ts:196-198` |
| SF-I6 | `shadeTarget_natural/hollywood` keys missing, hardcoded PT fallback | `PatientPreferencesStep.tsx` |

### Performance (7 items)
| ID | Finding | Location |
|----|---------|----------|
| SF-P1 | No `navigateFallback` in Workbox — offline SPA routing broken | `vite.config.ts` |
| SF-P2 | DSD generation has no AbortController — setState on unmounted component | `useDSDLayerGeneration.ts` |
| SF-P3 | `EvaluationToothCard` not memoized (N cards per session) | `EvaluationToothCard.tsx` |
| SF-P4 | `pageSize: 1000` for evaluation sessions — won't scale past 500 evals | `useEvaluationSessions.ts:93` |
| SF-P5 | Apple splash screens use 180×180 icon — blurry on all devices | `index.html:33-41` |
| SF-P6 | Google Fonts missing explicit `&display=swap` | `index.html:25` |
| SF-P7 | Multiple `<img>` in wizard lack `width`/`height` — CLS risk | `AnalyzingStep`, `PhotoUploadStep`, `ReviewFormAccordion` |

---

## Score Comparison: 2026-02-26 → 2026-03-12

```
Security:      ████████░░ 8.1  →  ████████▒░ 8.4  (+0.3)
Code Quality:  ███████░░░ 7.1  →  ████████░░ 7.8  (+0.7)
i18n:          ██████▒░░░ 6.5  →  ████████░░ 7.5  (+1.0)
Frontend/UX:   ████████░░ 7.6  →  ███████░░░ 7.2  (-0.4)
Architecture:  ████████░░ 7.6  →  ███████░░░ 7.1  (-0.5)
Perf/PWA:      ████████░░ 7.5  →  ██████▒░░░ 6.5  (-1.0)
Testing:       ██████░░░░ 5.7  →  █████▒░░░░ 5.5  (-0.2)
─────────────────────────────────────────────────────
OVERALL:       ███████░░░ 7.2  →  ███████░░░ 7.1  (-0.1)
```

### What Improved
- **i18n (+1.0)**: Locale parity now perfect (0 missing keys between locales). PDF internationalized. 85 keys added.
- **Code Quality (+0.7)**: Empty catches eliminated. `dispatchTreatmentProtocol` extracted. Error boundaries solid. Dead code cleaned.
- **Security (+0.3)**: PHI fail-closed. Credit RPC restricted. Shared link exposure fixed. Stripe v17.

### What Regressed
- **Perf/PWA (-1.0)**: New findings — sitemap/robots point to unowned domain, SVG maskable icon, no navigateFallback. These existed before but weren't caught.
- **Architecture (-0.5)**: Query key scatter worsened with 10+ new inline keys. `useDSDStep` placement. New pages bypass hook layer.
- **Frontend/UX (-0.4)**: Inline animations bypass prefers-reduced-motion. Dark mode color gaps in new dashboard activity feed.

---

## Recommended Fix Order for Launch Week

### Day 1 (Monday) — BLOCKS_LAUNCH
1. Remove `dentai.pro` from `supabase/config.toml` redirect URLs (BL-1) — 5 min
2. Fix `sitemap.xml` + `robots.txt` domain to `tosmile-ai.vercel.app` (BL-5) — 5 min
3. Fix `budget` fallback: `'moderado'` → `'padrão'` (BL-4) — 5 min
4. Fix Cristas Proximais injection guard: add `&& isDiastema` (BL-3) — 30 min
5. Fix CRON_SECRET/weekly-digest auth logic (BL-2) — 15 min
6. Generate PNG maskable icon 512×512 (BL-6) — 15 min
7. Deploy edge functions + Vercel

### Day 2 (Tuesday) — High-Priority SHOULD_FIX
8. Add 19 missing i18n keys (SF-I1, SF-I6) — 1 hr
9. Fix inline animations to use CSS classes (SF-F8) — 1 hr
10. Fix dark mode activity feed colors (SF-F7) — 30 min
11. Add Sentry `beforeSend` PHI filter (SF-S3) — 30 min
12. Fix `(s)` pluralization (SF-I2) — 10 min

### Day 3-4 (Wed-Thu) — Testing
13. Add E2E smoke test for checkout flow (BL-7) — 2-4 hrs
14. Add `recommend-cementation` shade validation tests (BL-8) — 1-2 hrs
15. Fix `shade-validation.test.ts` Deno permissions (SF-T*) — 30 min

### Day 5 (Friday) — Polish
16. Fix touch targets below 44px (SF-F6) — 1 hr
17. Add ARIA attributes to GlobalSearch, CookieConsent, filter pills (SF-F2-F5) — 2 hrs
18. Update DOMPurify via jsPDF/posthog update (SF-S4) — 30 min

---

## Verdict

**The application is commercially viable for launch** with the 8 BLOCKS_LAUNCH items resolved (~5-8 hours of work). The core product (photo analysis → protocol generation → DSD simulation → PDF) is architecturally sound, well-tested in critical paths, and has strong security posture.

The main risks for a commercial launch are:
1. **Clinical correctness** — The Cristas Proximais bug (BL-3) is a real clinical issue that affects protocol output
2. **Payment flow** — Untested E2E, though unit-tested at the webhook level
3. **SEO/PWA** — Unowned domain references will cause indexing failures

Post-launch priority should be: testing infrastructure (raise from 5.5 to 7+), architecture cleanup (query key centralization), and a11y compliance.

---

*Audited: 2026-03-12 by 7 parallel Claude Sonnet 4.6 agents*
*Previous audit: [[2026-02-26-full-application-audit]] (7.2/10)*
