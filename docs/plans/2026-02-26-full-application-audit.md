---
title: "Full Application Audit — AURIA / ToSmile.ai"
created: 2026-02-26
updated: 2026-02-26
status: published
tags:
  - type/audit
  - status/published
  - scope/full-app
related:
  - "[[2026-02-26-audit-action-plan]]"
  - "[[../06-ADRs/ADR-Index]]"
  - "[[../00-Index/Home]]"
---

# Full Application Audit — AURIA / ToSmile.ai

> 7 parallel agents audited the entire application across all dimensions on 2026-02-26.

## Overall Score: 7.2 / 10

| # | Dimension | Score | Verdict |
|---|-----------|-------|---------|
| 1 | **Security** | **8.1** | Strongest area. Solid RLS, atomic credits, LGPD encryption |
| 2 | **Architecture** | **7.6** | Clean 3-layer pattern, strong backend |
| 3 | **Frontend Design/UX** | **7.6** | Good PageShell adoption, animations, loading states |
| 4 | **Performance/PWA** | **7.5** | Lazy loading, compression pipeline, SW |
| 5 | **Code Quality** | **7.1** | Solid patterns overall |
| 6 | **i18n** | **6.5** | High coverage but significant debt |
| 7 | **Testing** | **5.7** | Weakest area — pages and backend near-zero |

---

## Top 10 Issues Blocking 10/10

| Priority | Issue | Dimension | Impact |
|----------|-------|-----------|--------|
| **P0** | Treatment-type dispatch switch duplicated in 4 places | Code Quality + Architecture | Every new treatment requires 4-file update; `recobrimento_radicular` bug already happened |
| **P0** | `useWizardFlow.ts` has zero tests — `canUseCredits` bug shipped to production | Testing | Single highest-risk untested file |
| **P0** | Zero Deno tests for edge functions — `shade-validation`, `post-processing` patched 6+ times | Testing | Most fragile code has no safety net |
| **P0** | `.env` with real Supabase anon key on disk | Security | Verify never committed; rotate if it was |
| **P1** | `useEvaluationDetail.ts` is 871 lines with ~5 responsibilities | Architecture + Quality | Unmaintainable god hook |
| **P1** | 44 i18n keys used via `defaultValue` never added to JSON | i18n | Silent debt from recent features |
| **P1** | `pdfSections.ts` entirely outside i18n — 20+ hardcoded Portuguese strings | i18n | Patient-facing PDFs untranslatable |
| **P1** | `text-muted-foreground/60` + `text-[10px]` fails WCAG contrast | Design/UX | Accessibility violation |
| **P1** | 9+ silent empty `catch {}` blocks across frontend | Code Quality | Bugs go invisible in production |
| **P1** | Blob URL leak in `useDSDStep.ts` — 4 leaks per DSD run | Performance | Memory grows with each simulation |

---

## 1. Code Quality — 7.1/10

| Category | Score | Key Issues |
|----------|-------|------------|
| Dead Code | 7.5 | Deprecated `normalizeTreatment` still called (P1), dual date-utils modules (P1) |
| Duplication | 6.5 | 4x treatment-type switch dispatch (P0), duplicate `isAnterior`/`getContralateral` (P1) |
| Complexity | 6.0 | `handleSubmitTeeth` 209 lines (P0), `handleSubmit` 375 lines (P0), `generateSimulation` 430+ lines (P1) |
| Code Smells | 7.0 | `'Dissilicato de lítio'` magic string 4x (P1), `supabase: any` in shade-validation (P2) |
| Type Safety | 7.5 | Dual `TreatmentType` unions must stay in sync (P1), `as unknown as` double casts (P1) |
| Error Handling | 7.0 | 9+ silent empty `catch {}` (P1), ad-hoc retry ignoring `withRetry` (P1) |
| Consistency | 8.0 | `dateUtils.ts` vs `date-utils.ts` naming (P1), two invoke patterns (P1) |

---

## 2. Architecture — 7.6/10

| Category | Score | Key Issues |
|----------|-------|------------|
| Layer Separation | 7.5 | 3 pages import `@/data` directly; hook types from component files |
| Dependency Direction | 8.0 | `helpers.ts` calls `i18n.t()` directly |
| Single Responsibility | 6.5 | `useEvaluationDetail` 871 lines / ~5 responsibilities |
| State Management | 8.0 | Inline queries in orchestrator; missing return object memoization |
| API Contract | 7.0 | No shared types frontend/backend; `Record<string, unknown>` erases safety |
| Module Organization | 8.0 | Query key factory not shared; `wizard.ts` mixed-concern |
| Reusability | 7.5 | Treatment dispatch duplicated; `analyzePhoto`/`handleReanalyze` 90% duplicate |
| Backend Architecture | 8.5 | Credit refund pattern copy-pasted; no `withCreditProtection` HOF |

---

## 3. Security — 8.1/10

| Category | Score | Key Issues |
|----------|-------|------------|
| Authentication | 8.0 | JWT in localStorage; no CAPTCHA on login |
| Authorization | 8.5 | Solid RLS; body userId vs token userId in recommend-resin |
| Input Validation | 8.0 | Prompt injection sanitiser not enforced on all paths |
| XSS Prevention | 8.5 | `'unsafe-inline'` in style-src CSP |
| API Security | 8.5 | Good rate limiting; stale rate_limit rows |
| Data Protection (LGPD) | 8.0 | PHI encrypted; draft JSONB not encrypted; DSD images missing from export |
| Secrets Management | 7.0 | Real `.env` on disk; no Deno dependency audit |
| Payment Security | 9.0 | Webhook sig verified; credits from metadata not re-validated against DB |
| Dependency Security | 7.0 | Stripe SDK 3 major versions behind |

### All Vulnerabilities

| ID | Severity | Category | Location |
|----|----------|----------|----------|
| VULN-D1 | **High** | Secrets Exposure | `apps/web/.env` |
| VULN-Z1 | Medium | IDOR / Authorization | `recommend-resin` edge function |
| VULN-V1 | Medium | Prompt Injection | `_shared/validation.ts` |
| VULN-X1 | Medium | XSS / CSP | `vercel.json:20` |
| VULN-PAY1 | Medium | Payment Integrity | `stripe-webhook/index.ts:398` |
| VULN-A1 | Medium | Auth Token Storage | `client.ts:11` |
| VULN-D2 | Medium | LGPD / Data Export | `data-export/index.ts` |
| VULN-DEP1 | Medium | Dependency | `stripe@14.14.0` |
| VULN-A2 | Low | Brute Force | `AuthContext.tsx` |
| VULN-X2 | Low | XSS / CSS Injection | `chart.tsx:70` |
| VULN-D3 | Low | LGPD / PHI | `evaluation_drafts` |
| VULN-PAY2 | Low | Payment | `create-checkout-session` |
| VULN-P2 | Low | API / DoS | `rate_limits` table |

---

## 4. Frontend Design/UX — 7.6/10

| Category | Score | Key Issues |
|----------|-------|------------|
| Design System Compliance | 7.5 | Wizard uses local shadcn instead of PageShell primitives |
| Visual Consistency | 7.0 | `text-muted-foreground/60` on text labels; wrapper duplication |
| Component Quality | 7.5 | `size="sm"` buttons without `min-h-11`; monolithic 40-dep useMemo |
| Responsive Design | 7.5 | Touch targets 36px in EvaluationDetails; floating bar missing safe-area |
| Loading & Error States | 8.0 | Suspense `fallback={null}` on lazy modals |
| Animation & Transitions | 8.5 | Inline style animation bypasses prefers-reduced-motion |
| Information Architecture | 7.5 | Dual pagination on Evaluations; two h1 elements on Dashboard |
| Accessibility (a11y) | 7.0 | Duplicate focus-visible rule; WCAG contrast failures; `aria-live` on full wizard |

---

## 5. Testing — 5.7/10

| Category | Score | Key Issues |
|----------|-------|------------|
| Coverage Breadth | 6.0 | Pages ~20% covered; 0 Deno tests |
| Coverage Depth | 6.0 | `useEvaluationDetail.test.ts` tests copied stub, not real hook |
| Test Quality | 7.0 | Good patterns where tests exist |
| Critical Path Coverage | 6.0 | Wizard orchestrator has zero tests |
| Test Infrastructure | 7.0 | CI solid; thresholds too low at 40% |
| Backend Tests | 2.0 | Only `validation.ts` tested via cross-import |
| E2E Tests | 6.0 | 5 spec files; no DSD or billing E2E |

### Critical Untested Files

| File | Risk | Bug History |
|------|------|-------------|
| `useWizardFlow.ts` | Critical | `canUseCredits` bug shipped to production |
| `useEvaluationDetail.ts` (hook) | Critical | `gengivoplastia` switch bug |
| `shade-validation.ts` | Critical | BL1/BL2, WB fallback, Efeitos Incisais |
| `post-processing.ts` (analyze) | Critical | Diastema safety net, patched 6+ times |
| `post-processing.ts` (dsd) | High | `shouldStripGingivo`, lower-teeth filter |
| `protocolComputed.ts` | High | Pure computation, zero tests |

---

## 6. i18n — 6.5/10

| Category | Score | Key Issues |
|----------|-------|------------|
| Missing Keys | 5.0 | 44 keys used via `defaultValue` not in JSON |
| Unused Keys | 7.0 | Several `landing.*`, `validation.*` appear unused |
| Hardcoded Strings | 3.0 | `pdfSections.ts` entirely unhardened — 20+ Portuguese strings |
| Locale Consistency | 8.0 | pt-BR and en-US mirror-perfect |
| Namespace Organization | 7.0 | Treatment labels duplicated in 7+ namespaces |
| Pluralization | 8.0 | `_one`/`_other` correct; `(s)` anti-pattern in 2 places |
| Interpolation | 9.0 | All patterns correct |

---

## 7. Performance/PWA — 7.5/10

| Category | Score | Key Issues |
|----------|-------|------------|
| Bundle Size | 7.0 | `posthog-js` eagerly loaded; unused `@tanstack/react-virtual` |
| Rendering Performance | 7.0 | Auto-save fires on 10 deps with no debounce |
| Network Performance | 7.5 | 20 parallel signed URL requests per list page; no `gcTime` |
| Loading UX | 8.0 | All routes lazy-loaded; generic PageLoader for all routes |
| PWA Compliance | 8.0 | Complete manifest; silent `onNeedRefresh` |
| Image Handling | 8.5 | Dual-stage compression; blob URL leak in DSD |
| Memory Management | 7.0 | Blob URL leak; large wizard state not cleared after submit |
| Lighthouse Readiness | 7.5 | OG meta points to unowned domain; fonts render-blocking |

---

## Links

- [[2026-02-26-audit-action-plan]] — Prioritized action plan
- [[../06-ADRs/ADR-Index]] — Architecture Decision Records
- [[../00-Index/Home]] — Documentation Hub

---
*Atualizado: 2026-02-26*
