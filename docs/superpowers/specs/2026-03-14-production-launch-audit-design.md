# Production Launch Audit & Hardening — "Parallel Assault"

> Full commercial launch readiness evaluation + hardening for ToSmile.ai

**Created**: 2026-03-14
**Status**: approved
**Baseline Score**: 7.1/10 (2026-03-12 audit)
**Target Score**: 8.5+/10

---

## Context

ToSmile.ai is a dental clinical decision support system (photo analysis, protocol generation, DSD simulation, PDF export) built with React 18 + Vite + Supabase + Gemini AI. The app has been through multiple audit cycles (Feb 10, Feb 18, Feb 26, Mar 12) and scored 7.1/10 on the latest.

### Blocker Status (verified 2026-03-14)

All 8 BLOCKS_LAUNCH issues from the Mar 12 audit have been resolved in subsequent commits:

| ID | Issue | Status | Evidence |
|----|-------|--------|----------|
| BL-1 | `dentai.pro` in OAuth redirect URLs | RESOLVED | String not found in any source file |
| BL-2 | CRON_SECRET/weekly-digest auth mismatch | RESOLVED | Uses `SUPABASE_SERVICE_ROLE_KEY` via Vault |
| BL-3 | Cristas Proximais injection for ALL anterior | RESOLVED | Guard: `isDiastema && !isSmallDiastema`, 26/26 tests pass |
| BL-4 | `budget` fallback `'moderado'` | RESOLVED | Code reads `formData.budget \|\| 'padrão'` |
| BL-5 | Sitemap/robots.txt domain mismatch | RESOLVED | Both use `tosmile-ai.vercel.app` |
| BL-6 | PNG maskable icon missing | RESOLVED | `icon-maskable-512.png` exists (72KB) |
| BL-7 | Zero E2E checkout tests | RESOLVED | `checkout.spec.ts` — 277 lines, 9 test cases |
| BL-8 | Zero cementation shade tests | RESOLVED | `cementation.test.ts` — 50 tests covering helpers + validation |

**Implication**: Phase 2 will fix NEW findings from Phase 1 diagnostic, not stale blockers.

### Remaining SHOULD_FIX (28 items from Mar 12 audit)

Categories: Security (4), Architecture (11), Code Quality (8), Accessibility (14), Testing (9), i18n (6), Performance (7). These need re-verification during Phase 1 — some may also be resolved.

---

## Architecture

### Three-Phase Pipeline

```
Phase 1: DIAGNÓSTICO (parallel, ~30-60 min)
├── 1A. QA Pipeline (Playwright + agent teams) → functional bugs
├── 1B. Design Critic (screenshots + auto-fix) → visual gaps
├── 1C. Code Review (agent team) → security, quality, clinical
└── 1D. Consolidation (waits for 1A-1C) → prioritized fix-list

Phase 2: FIX (parallel worktrees, scope TBD by Phase 1)
├── Worktree A: Security + Backend findings
├── Worktree B: Frontend + A11y + i18n findings
└── Worktree C: Test coverage gaps

Phase 3: VALIDATION + REPORT
├── 3A. QA smoke re-run
├── 3B. Design critic re-run (score comparison)
├── 3C. Executive report with updated score
└── 3D. Deploy checklist
```

---

## Phase 1: Diagnóstico

### 1A. QA Pipeline

**Tool**: `qa-pipeline-orchestrator` skill with Playwright agent teams

**Flows to test**:
1. Landing page — navigation, CTA clicks, responsive layout
2. Auth flow — signup, login, password reset
3. Wizard flow — photo upload, analysis wait, tooth selection, protocol generation, DSD step
4. Dashboard — stats display, recent cases list, navigation
5. Evaluation list — filters, search, pagination, card/table toggle
6. Evaluation detail — protocol view, regenerate, PDF export, share link
7. DSD viewer — layer toggle, zoom, comparison slider
8. Profile — edit profile, subscription view, credit balance
9. Pricing — plan comparison, checkout initiation (Stripe test mode)

**Success criteria**: All critical paths pass, no P0/P1 bugs.

### 1B. Design Critic

**Tool**: `design-critic` skill

**Scope**: All user-facing pages (landing, auth, dashboard, wizard steps, evaluation detail, DSD viewer, profile, pricing)

**Evaluation pillars**:
1. Visual Consistency (tokens, spacing, color harmony)
2. Information Hierarchy (typography scale, content flow)
3. Interaction Quality (hover states, transitions, feedback)
4. Spatial Design (padding, margins, alignment)
5. Polish & Craft (shadows, borders, micro-interactions)

**Output**: Score per pillar, aggregated score, auto-fix for all findings.

### 1C. Code Review

**Tool**: `superpowers:code-reviewer` agent team

**Scope**: Full codebase review (not just diff), focus areas:
- Security vulnerabilities (OWASP Top 10)
- Clinical correctness (shade validation, protocol generation, AI prompts)
- Performance (bundle size, lazy loading, memory leaks)
- Type safety (unsafe casts, `any` types)
- Error handling (silent catches, missing fallbacks)
- Remaining SHOULD_FIX items re-verification

**Output**: Scored report with confidence-based filtering.

### 1D. Consolidation

**Depends on**: 1A, 1B, 1C completion

**Actions**:
- Merge findings from all 3 diagnostic frentes
- Cross-reference with 28 SHOULD_FIX items — mark resolved vs still open
- Deduplicate overlapping issues
- Categorize: MUST_FIX_FOR_LAUNCH vs POST_LAUNCH vs BACKLOG
- Assign to Phase 2 worktrees by file ownership (exclusive)
- Generate prioritized fix-list with effort estimates

---

## Phase 2: Fix (Parallel Worktrees)

Phase 2 scope is determined by Phase 1 findings. Worktree structure:

### Worktree A: Security + Backend

**Likely files**: `supabase/` directory, `main.tsx` (Sentry), edge function configs

**Expected fix categories**:
- Remaining SF-S* security findings (rate limit RLS, Sentry PHI filter)
- Edge function error handling gaps
- Silent failure patterns
- `validation.ts` cleanup (remove `moderado` from `VALID_BUDGETS` if still present)

### Worktree B: Frontend + A11y + i18n + Design

**Likely files**: `apps/web/src/components/`, `apps/web/src/pages/`, `index.css`, `locales/`, `vite.config.ts`

**Expected fix categories**:
- Accessibility (SF-F1..F14): contrast, ARIA, touch targets, animations, dark mode
- i18n (SF-I1..I6): missing keys, hardcoded strings, pluralization
- PWA: navigateFallback in Workbox (SF-P1)
- Design critic auto-fix results
- Performance: AbortController, CLS fixes

### Worktree C: Test Coverage

**Likely files**: `apps/web/src/hooks/domain/**/*.test.ts`, `supabase/functions/**/*.test.ts`

**Expected fix categories**:
- Zero-test wizard hooks: `useWizardCredits`, `useWizardDraftRestore`, `useWizardAutoSave`, `useAnalysisResultSync`
- Extend cementation shade validation coverage
- Payment sync edge function tests
- Fix skipped tests in `ProtectedRoute.test.tsx`

**Constraint**: Worktree file assignments are exclusive — no file appears in more than one worktree.

---

## Phase 3: Validation + Report

### 3A. QA Smoke Re-run

Re-run critical path subset:
- Auth → wizard → protocol → PDF export
- Checkout flow
- Confirm zero regressions from Phase 2 fixes

### 3B. Design Critic Re-run

Re-run on pages that received fixes. Generate before/after score comparison.

### 3C. Executive Report

**Output**: `docs/superpowers/specs/2026-03-14-launch-readiness-report.md`

Contents:
- Overall score (before: 7.1 → after: target 8.5+)
- Score per dimension (7 categories: Security, Code Quality, i18n, Frontend/UX, Architecture, Performance/PWA, Testing)
- Issues resolved (count + list)
- Remaining debt:
  - **Can launch with**: cosmetic, low-risk
  - **Must fix post-launch (week 1)**: medium-risk
  - **Backlog**: nice-to-have
- Deploy checklist

### 3D. Deploy Checklist

- [ ] QA smoke passes (zero P0/P1)
- [ ] Design critic score >= 7.0
- [ ] All MUST_FIX_FOR_LAUNCH issues resolved
- [ ] Edge functions deployed (sequential, `--no-verify-jwt`)
- [ ] Vercel production deploy successful
- [ ] Stripe webhook verified in production
- [ ] Sentry alerts confirmed

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Phase 1 finds too many issues for one session | Strict triage: only MUST_FIX_FOR_LAUNCH gets fixed. Rest goes to backlog |
| Worktree merge conflicts | Files exclusively assigned per worktree |
| Design critic auto-fix introduces regressions | Phase 3 QA re-run validates |
| E2E tests require running app | Dev server started before QA pipeline |
| Edge function deploy breaks production | Test locally first, deploy sequentially |

---

## Rollback Plan

If Phase 3 validation finds critical regressions:
1. Revert Phase 2 worktree branches (`git revert` per merge commit)
2. Re-deploy previous edge function versions
3. Vercel instant rollback to previous deployment
4. Document regression in report as post-launch priority

---

## Success Criteria

1. QA pipeline: zero P0/P1 bugs on critical paths
2. Design critic score >= 7.0/10
3. Code review: zero CRITICAL findings unaddressed
4. Overall readiness score >= 8.5/10
5. Executive report generated with deploy checklist
6. All fixes committed
