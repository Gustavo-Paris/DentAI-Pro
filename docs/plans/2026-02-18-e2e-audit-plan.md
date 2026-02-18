# End-to-End Application Audit - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Comprehensive end-to-end audit of the AURIA/ToSmile.ai application across 6 quality dimensions, producing a prioritized action plan, implementing fixes, and re-validating improvements.

**Architecture:** 6 parallel code-explorer agents each analyze one quality dimension with exclusive file scopes. Results are consolidated into a single findings document. Fixes are implemented in priority batches (P0 first). Re-validation uses the same agent prompts to measure improvement.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Supabase Edge Functions (Deno), Claude AI, Gemini AI

---

## Phase 1: Parallel Analysis (6 Agents)

All 6 agents run in parallel. Each agent is a `code-explorer` subagent that produces a structured report. Agents are READ-ONLY (no edits).

### Task 1: Dispatch Agent 1 - Code Quality Audit

**Agent type:** `feature-dev:code-explorer`
**Run in background:** yes

**Prompt:**
```
You are a Code Quality auditor. Analyze the AURIA/ToSmile.ai codebase for code quality issues.

SCOPE (read these files/directories):
- apps/web/src/data/ (27 files - data layer)
- apps/web/src/lib/ (20 files - utilities)
- apps/web/src/types/ (type definitions)
- supabase/functions/_shared/ (24 files - shared backend modules)

CHECKLIST - For each file in scope, check:
1. Dead code: unused exports, unreachable branches, commented-out code
2. Duplicated logic: same pattern repeated across files (copy exact snippets)
3. Long functions: any function >50 lines (report name + line count)
4. Large files: any file >300 lines (report name + line count)
5. Weak typing: usage of `any`, unnecessary type assertions (`as`), missing return types
6. Inconsistent patterns: e.g., some data files use try/catch while others don't, naming mismatches
7. Unused imports

OUTPUT FORMAT (use exactly this structure):
## Code Quality Audit Report

### Summary
- Total files analyzed: N
- Total issues found: N (P0: N, P1: N, P2: N, P3: N)

### Issues

#### [P0/P1/P2/P3] Issue title
- **File:** exact/path/file.ts:LINE
- **Category:** dead-code | duplication | complexity | typing | inconsistency
- **Description:** What the issue is
- **Suggested fix:** How to fix it
- **Code snippet:** (include the problematic code)

Repeat for each issue found. Be thorough - read every file in scope.
```

### Task 2: Dispatch Agent 2 - Security Audit

**Agent type:** `feature-dev:code-explorer`
**Run in background:** yes

**Prompt:**
```
You are a Security auditor. Analyze the AURIA/ToSmile.ai codebase for security vulnerabilities.

SCOPE (read these files/directories):
- apps/web/src/contexts/AuthContext.tsx (auth state management)
- apps/web/src/data/auth.ts (auth API calls)
- apps/web/src/lib/schemas/auth.ts (auth validation)
- apps/web/src/components/ProtectedRoute.tsx (route protection)
- apps/web/src/hooks/useAuthenticatedFetch.ts (authenticated API calls)
- apps/web/src/lib/env.ts (environment variables)
- apps/web/src/lib/errorHandler.ts (error handling)
- apps/web/src/lib/sanitizeForPrompt.ts (input sanitization)
- supabase/functions/*/index.ts (all 13 edge functions)
- supabase/functions/_shared/cors.ts (CORS config)
- supabase/functions/_shared/middleware.ts (middleware)
- supabase/functions/_shared/rateLimit.ts (rate limiting)
- supabase/functions/_shared/credits.ts (credit system)
- supabase/functions/_shared/validation.ts (input validation)
- supabase/functions/_shared/claude.ts (AI API calls)
- supabase/functions/_shared/gemini.ts (AI API calls)
- apps/web/src/integrations/supabase/ (Supabase client config)
- apps/web/src/data/storage.ts (file storage)

CHECKLIST:
1. XSS: Any unsafe HTML rendering, unescaped user input in DOM, URL parameter injection
2. Injection: Supabase query construction with user input, template literal injection in AI prompts
3. Auth bypass: Missing auth checks, token validation gaps, session handling issues
4. Token security: How tokens are stored (localStorage vs httpOnly cookies), token expiration, refresh logic
5. CORS: Overly permissive origins, credentials handling
6. Rate limiting: Which endpoints have rate limits, which don't, bypass possibilities
7. Input validation: Missing validation on user inputs before DB or AI calls
8. Secrets exposure: Hardcoded API keys, secrets in client-side code, env var leaks
9. Error information leakage: Stack traces or internal details exposed to client
10. File upload security: File type validation, size limits, storage path traversal

OUTPUT FORMAT:
## Security Audit Report

### Summary
- Total files analyzed: N
- Vulnerabilities found: N (Critical: N, High: N, Medium: N, Low: N)

### Vulnerabilities

#### [CRITICAL/HIGH/MEDIUM/LOW] Vulnerability title
- **File:** exact/path/file.ts:LINE
- **OWASP Category:** A01-A10
- **Description:** What the vulnerability is and how it could be exploited
- **Impact:** What an attacker could achieve
- **Suggested fix:** Specific code change needed
- **Code snippet:** (include the vulnerable code)
```

### Task 3: Dispatch Agent 3 - Functional / Bug Audit

**Agent type:** `feature-dev:code-explorer`
**Run in background:** yes

**Prompt:**
```
You are a Functional/Bug auditor. Analyze the AURIA/ToSmile.ai codebase for potential bugs and functional issues.

SCOPE (read these files/directories):
- apps/web/src/pages/ (all 28 page files - the user-facing flows)
- apps/web/src/hooks/domain/ (all domain hooks - business logic)
- apps/web/src/hooks/domain/wizard/ (wizard-specific hooks)
- apps/web/src/data/wizard.ts (wizard data layer - critical file)
- apps/web/src/data/evaluations.ts (evaluations data)
- apps/web/src/data/patients.ts (patients data)
- apps/web/src/data/payments.ts (payments data)
- apps/web/src/data/subscriptions.ts (subscriptions data)
- apps/web/src/data/credit-usage.ts (credit usage)
- apps/web/src/data/drafts.ts (draft persistence)
- apps/web/src/components/wizard/ (wizard UI components)

CHECKLIST:
1. Error handling: Functions that can throw but have no try/catch, promises without .catch(), silent error swallowing (empty catch blocks)
2. Race conditions: Concurrent state updates (setState called multiple times), useEffect cleanup missing for async operations, stale closures
3. Null/undefined safety: Optional chaining missing where data could be null, array access without bounds check, object property access on potentially undefined
4. Edge cases: Empty arrays not handled, zero values treated as falsy, string "0"/"false" issues
5. State consistency: State that can become inconsistent (e.g., loading=false but data=null and error=null), wizard steps that can be skipped
6. Infinite loops: useEffect with missing or incorrect dependency arrays that could trigger re-renders
7. Data flow: Props passed but never used, data fetched but never displayed, callbacks that reference stale state
8. Business logic: Wizard flow correctness (tooth selection -> analysis -> DSD -> review -> result), credit deduction logic, subscription checks

OUTPUT FORMAT:
## Functional / Bug Audit Report

### Summary
- Total files analyzed: N
- Potential bugs found: N (P0: N, P1: N, P2: N, P3: N)

### Issues

#### [P0/P1/P2/P3] Bug title
- **File:** exact/path/file.ts:LINE
- **Category:** error-handling | race-condition | null-safety | edge-case | state-consistency | infinite-loop | data-flow | business-logic
- **Description:** What the bug is
- **Reproduction scenario:** How this bug would manifest for a user
- **Suggested fix:** Specific code change needed
- **Code snippet:** (include the buggy code)
```

### Task 4: Dispatch Agent 4 - Performance Audit

**Agent type:** `feature-dev:code-explorer`
**Run in background:** yes

**Prompt:**
```
You are a Performance auditor. Analyze the AURIA/ToSmile.ai codebase for performance issues.

SCOPE (read these files/directories):
- apps/web/src/components/ (all component files EXCEPT __tests__/)
- apps/web/src/App.tsx (routing and lazy loading)
- apps/web/src/main.tsx (entry point)
- apps/web/vite.config.ts (build config)
- apps/web/src/hooks/useVirtualList.ts (virtualization)
- apps/web/src/hooks/useScrollReveal.ts (scroll handling)
- apps/web/src/components/OptimizedImage.tsx (image optimization)
- apps/web/src/lib/imageUtils.ts (image processing)
- apps/web/src/lib/webVitals.ts (web vitals)
- apps/web/src/index.css (CSS bundle)

CHECKLIST:
1. Re-renders: Components without React.memo that receive object/array/function props, inline object/array creation in JSX props, new function creation on every render
2. Memoization: Missing useMemo for expensive computations, missing useCallback for callbacks passed to children, over-memoization (memoizing primitives)
3. Lazy loading: Pages imported eagerly instead of React.lazy, heavy components loaded upfront
4. Bundle: Large dependencies imported without tree-shaking, full library imports (import _ from 'lodash' vs import map from 'lodash/map')
5. API calls: Waterfall requests (sequential calls that could be parallel), missing data caching, duplicate fetches on re-mount
6. Images: Missing lazy loading, no srcset/sizes, large images served without compression
7. useEffect: Effects that run on every render due to unstable deps, effects that could be replaced with useMemo, cleanup functions missing
8. Lists: Large lists without virtualization, missing key props or using index as key
9. CSS: Unused CSS classes, large CSS bundle, CSS-in-JS runtime overhead

OUTPUT FORMAT:
## Performance Audit Report

### Summary
- Total files analyzed: N
- Performance issues found: N (P0: N, P1: N, P2: N, P3: N)

### Issues

#### [P0/P1/P2/P3] Issue title
- **File:** exact/path/file.ts:LINE
- **Category:** re-render | memoization | lazy-loading | bundle | api-waterfall | images | useEffect | lists | css
- **Impact:** Estimated impact (e.g., "unnecessary re-render of 50+ child components on every keystroke")
- **Description:** What the issue is
- **Suggested fix:** Specific code change needed
- **Code snippet:** (include the problematic code)
```

### Task 5: Dispatch Agent 5 - UX / Accessibility Audit

**Agent type:** `feature-dev:code-explorer`
**Run in background:** yes

**Prompt:**
```
You are a UX/Accessibility auditor. Analyze the AURIA/ToSmile.ai codebase for usability and accessibility issues.

SCOPE (read these files/directories):
- apps/web/src/pages/ (all page files - check loading/error/empty states)
- apps/web/src/components/auth/ (auth UI)
- apps/web/src/components/wizard/ (wizard UI - critical flow)
- apps/web/src/components/protocol/ (protocol display)
- apps/web/src/components/pricing/ (pricing UI)
- apps/web/src/components/onboarding/ (onboarding flow)
- apps/web/src/components/dsd/ (DSD display)
- apps/web/src/components/EmptyState.tsx
- apps/web/src/components/LoadingOverlay.tsx
- apps/web/src/components/ProcessingOverlay.tsx
- apps/web/src/components/ErrorBoundary.tsx
- apps/web/src/components/OfflineBanner.tsx
- apps/web/src/components/HelpButton.tsx
- apps/web/src/components/GlobalSearch.tsx
- apps/web/src/components/AiDisclaimerModal.tsx
- apps/web/src/index.css (global styles)
- apps/web/tailwind.config.ts (theme config)

CHECKLIST:
1. Loading states: Pages/components that fetch data but show no loading indicator, skeleton screens missing
2. Error states: Components that can error but show no error UI, generic "something went wrong" instead of actionable messages
3. Empty states: Lists/tables that show nothing when empty instead of helpful empty state
4. ARIA: Missing aria-label on icon buttons, missing aria-live for dynamic content, missing role attributes
5. Keyboard: Interactive elements not focusable, no visible focus indicators, keyboard traps in modals
6. Forms: Missing labels, missing validation messages, no autocomplete attributes, submit button disabled without explanation
7. Touch targets: Buttons/links smaller than 44x44px on mobile, elements too close together
8. Responsive: Fixed widths that break on small screens, text that overflows, horizontal scroll
9. Color: Using color alone to convey information (without icons/text), potential contrast issues with Tailwind classes
10. Feedback: Actions with no success/error feedback, long operations with no progress indication

OUTPUT FORMAT:
## UX / Accessibility Audit Report

### Summary
- Total files analyzed: N
- Issues found: N (P0: N, P1: N, P2: N, P3: N)

### Issues

#### [P0/P1/P2/P3] Issue title
- **File:** exact/path/file.tsx:LINE
- **Category:** loading-state | error-state | empty-state | aria | keyboard | forms | touch-targets | responsive | color | feedback
- **WCAG:** (if applicable, e.g., 2.1.1 Keyboard, 1.4.3 Contrast)
- **Description:** What the issue is
- **User impact:** How this affects the user experience
- **Suggested fix:** Specific code/markup change needed
- **Code snippet:** (include the problematic code)
```

### Task 6: Dispatch Agent 6 - Test Coverage Audit

**Agent type:** `feature-dev:code-explorer`
**Run in background:** yes

**Prompt:**
```
You are a Test Coverage auditor. Analyze the AURIA/ToSmile.ai test suite for gaps and quality issues.

SCOPE (read these files/directories):
- ALL test files: apps/web/src/**/__tests__/*.test.{ts,tsx} (63 files)
- Compare against source files in: apps/web/src/data/, apps/web/src/hooks/, apps/web/src/components/, apps/web/src/pages/, apps/web/src/lib/, apps/web/src/contexts/
- apps/web/src/test/ (test utilities and mocks)
- apps/web/vitest.config.ts or apps/web/vite.config.ts (test config)

CHECKLIST:
1. Missing tests: Source files with no corresponding test file. List every source file and whether it has a test.
2. Critical untested paths: Functions that handle money (payments, credits, subscriptions), auth (login, register, token refresh), data mutations (create/update/delete), AI calls (wizard submit, DSD)
3. Weak assertions: Tests that only check `toBeDefined()` or `toBeTruthy()` instead of specific values
4. Fragile mocks: Tests that mock implementation details instead of behavior, mocks that don't match actual API shapes
5. Missing edge cases: Tests that only cover happy path, no tests for error scenarios, empty inputs, boundary values
6. Integration gaps: No integration tests between data layer and hooks, no tests for the full wizard flow
7. Test quality: Tests that test implementation details instead of behavior, tests that are tightly coupled to component structure
8. Test organization: Inconsistent naming, missing describe blocks, tests in wrong directories

OUTPUT FORMAT:
## Test Coverage Audit Report

### Summary
- Total source files: N
- Source files WITH tests: N
- Source files WITHOUT tests: N
- Coverage percentage: N%
- Total test quality issues: N

### Coverage Gap Analysis

| Source File | Has Test? | Priority |
|-------------|-----------|----------|
| path/to/file.ts | YES/NO | P0-P3 |

### Test Quality Issues

#### [P0/P1/P2/P3] Issue title
- **Test file:** exact/path/test.ts:LINE
- **Source file:** exact/path/source.ts
- **Category:** missing-test | weak-assertion | fragile-mock | missing-edge-case | integration-gap | test-quality | organization
- **Description:** What the issue is
- **Suggested fix:** Specific improvement needed
- **Code snippet:** (include the problematic test code)
```

---

## Phase 2: Consolidation

### Task 7: Collect all 6 agent reports

**Step 1:** Read output from all 6 background agents
**Step 2:** Parse each report's summary section
**Step 3:** Create consolidated findings document

### Task 8: Write consolidated findings document

**File:** `docs/plans/2026-02-18-e2e-audit-findings.md`

**Structure:**
```markdown
# E2E Audit Findings - 2026-02-18

## Executive Summary
- Total issues: N
- By severity: P0: N, P1: N, P2: N, P3: N
- By dimension: Code Quality: N, Security: N, Functional: N, Performance: N, UX: N, Tests: N

## Top 20 Critical Issues (ranked)

## All Issues by Severity

### P0 - Critical
### P1 - High
### P2 - Medium
### P3 - Low

## Action Plan
- Batch 1 (P0): [list of fixes]
- Batch 2 (P1): [list of fixes]
- Batch 3 (P2): [list of fixes]
- Batch 4 (P3): [list of fixes]
```

### Task 9: Present findings to user for approval

Present the consolidated findings and action plan. User decides which batches to implement.

---

## Phase 3: Implementation (after user approval)

### Task 10: Implement P0 fixes

For each P0 issue from the findings:
- Apply the suggested fix
- Run tests: `cd apps/web && pnpm test`
- Commit with descriptive message

### Task 11: Implement P1 fixes

Same process as Task 10 for P1 issues.

### Task 12: Implement P2 fixes

Same process as Task 10 for P2 issues.

### Task 13: Implement P3 fixes

Same process as Task 10 for P3 issues.

### Task 14: Run full test suite

Run: `cd apps/web && pnpm test`
Run: `cd apps/web && pnpm build`
Verify everything passes.

---

## Phase 4: Re-validation

### Task 15: Re-run all 6 audit agents

Same prompts as Phase 1, same scopes. Compare before/after.

### Task 16: Write re-validation report

**File:** `docs/plans/2026-02-18-e2e-audit-revalidation.md`

**Structure:**
```markdown
# E2E Audit Re-validation - 2026-02-18

## Before vs After
| Dimension | Before | After | Improvement |
|-----------|--------|-------|-------------|
| Code Quality | N issues | N issues | -N% |
| Security | N issues | N issues | -N% |
| ...

## Remaining Issues
(issues that were not addressed or emerged)

## Recommendations
(next steps for continued improvement)
```
