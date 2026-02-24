---
title: Production Readiness Audit — Design
created: 2026-02-23
updated: 2026-02-23
status: approved
tags:
  - type/plan
  - status/approved
---

# Production Readiness Audit — Design

## Context

ToSmile.ai (AURIA) is preparing for a **soft launch** (invited beta, known dentists). The application has been manually tested on the happy path. This audit identifies gaps across 4 concern areas before production deployment.

## Concern Areas

1. **Clinical accuracy** — AI outputs reliable and clinically safe
2. **Stability & errors** — No crashes, proper timeout/fallback handling
3. **User experience flow** — Complete UX (empty/error/loading states, mobile)
4. **Security & compliance** — LGPD, PHI, auth, Stripe security

## Approach

**Hybrid:** 6 parallel code-analysis agents → synthesized P0/P1/P2 checklist → implementation plan.

## Agent Architecture

| # | Agent | Scope | Key Files |
|---|-------|-------|-----------|
| 1 | **Security & Compliance** | Auth flows, RLS, CORS, PHI encryption, LGPD, Stripe security, input validation, prompt injection | `_shared/middleware.ts`, `cors.ts`, `validation.ts`, `rateLimit.ts`, `credits.ts`; `stripe-webhook/`, `delete-account/`, `data-export/`; migrations; `AuthContext.tsx`, `ProtectedRoute.tsx` |
| 2 | **Error Handling & Stability** | Unhandled rejections, missing catches, timeouts, fallbacks, circuit breaker, error responses | All 13 edge functions; `gemini.ts`, `claude.ts`, `circuit-breaker.ts`; `ErrorBoundary.tsx`, `errorHandler.ts`, `useAuthenticatedFetch.ts` |
| 3 | **Clinical Safety** | Prompt completeness, protocol validation, tooth detection edge cases, DSD post-processing, normalization | `prompts/definitions/*`, `aiSchemas.ts`, `post-processing.ts`, `wizard.ts`, `protocolComputed.ts` |
| 4 | **UX Completeness** | Empty states, error states, loading states, form validation, mobile, onboarding, a11y | `pages/*`, `wizard/*`, `evaluation/*`, `dsd/*`, `onboarding/*` |
| 5 | **Data Integrity** | DB constraints, orphan risk, credit races, idempotency, draft cleanup, storage orphans | `migrations/*`, `data/*`, `_shared/credits.ts`, `useWizardFlow.ts` |
| 6 | **Build, Deploy & Infra** | Env vars, CSP, bundle size, PWA, Vercel config, CI gaps, test coverage | `vercel.json`, `vite.config.ts`, `index.html`, `manifest.json`, `.github/workflows/*`, test files |

## Priority Definitions

- **P0 (Blocker):** Must fix before launch. Security vulns, data loss, clinical safety, crashes on happy path.
- **P1 (Important):** Should fix before launch. Poor UX on common flows, missing error handling, incomplete features.
- **P2 (Nice-to-have):** Can launch without. Polish, edge cases, optimization.

## Deliverables

1. **Audit report:** `docs/plans/2026-02-23-production-readiness-audit.md` — P0/P1/P2 findings by category
2. **Implementation plan:** Created via `writing-plans` skill for P0+P1 fixes

## Process

1. ~~Explore project context~~ ✓
2. ~~Clarify requirements~~ ✓
3. ~~Propose approaches~~ ✓ (Hybrid selected)
4. ~~Present design~~ ✓
5. Write design doc ← current
6. Launch 6 parallel agents
7. Synthesize findings into audit report
8. Invoke `writing-plans` for implementation plan

---

*Related: [[2026-02-18-dsd-quality-audit.md]], [[2026-02-23-clinical-qa-fixes.md]]*
