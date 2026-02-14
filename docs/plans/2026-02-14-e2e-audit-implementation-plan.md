# E2E Audit — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all P0 and P1 issues identified in the 2026-02-14 comprehensive E2E audit across security, AI pipeline, performance, UX, and architecture.

**Architecture:** 4 sprints of focused fixes. Sprint 1 targets security P0s (credit timing, auth validation). Sprint 2 targets performance and UX quick wins. Sprint 3 targets test coverage gaps. Sprint 4 targets code quality and polish. Each task is atomic, testable, and committable.

**Tech Stack:** Supabase Edge Functions (Deno/TypeScript), React 18 + Vite + TypeScript, Vitest, React Query, i18next, PageShell design system.

**Source audit:** `docs/plans/2026-02-14-comprehensive-e2e-audit.md`

---

## Sprint 1: Security & Credits (P0)

### Task 1: Add auth state validation to middleware

**Files:**
- Modify: `supabase/functions/_shared/middleware.ts:16-31`

**Step 1: Add deleted/banned/unconfirmed checks after getUser()**

In `authenticateRequest()`, after the existing `if (error || !user)` check at line 27, add validation for auth state:

```typescript
export async function authenticateRequest(
  req: Request,
  supabase: SupabaseClient,
  corsHeaders: Record<string, string>
): Promise<{ user: User } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401, corsHeaders);
  }
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return createErrorResponse(ERROR_MESSAGES.INVALID_TOKEN, 401, corsHeaders);
  }

  // Validate auth state: deleted, banned, or unconfirmed users must not proceed
  const meta = user as Record<string, unknown>;
  if (meta.deleted_at) {
    logger.warn(`Blocked deleted user ${user.id}`);
    return createErrorResponse("Conta excluída", 401, corsHeaders);
  }
  if (meta.banned_until) {
    logger.warn(`Blocked banned user ${user.id}`);
    return createErrorResponse("Conta suspensa", 403, corsHeaders);
  }

  return { user };
}
```

**Step 2: Verify it compiles**

Run: `cd supabase && npx supabase functions serve health-check --no-verify-jwt 2>&1 | head -20`
Expected: Function starts without TypeScript errors.

**Step 3: Commit**

```bash
git add supabase/functions/_shared/middleware.ts
git commit -m "fix(security): validate deleted/banned auth state in middleware"
```

---

### Task 2: Move credit deduction after AI success — recommend-resin

**Files:**
- Modify: `supabase/functions/recommend-resin/index.ts`

**Context:** Currently credits are consumed at line 151 (BEFORE AI call). If AI fails, refund happens in multiple catch blocks. This is fragile — move credit consumption to AFTER successful AI response + Zod validation.

**Step 1: Restructure credit flow**

1. Remove the credit check block at lines 150-156 (the `checkAndUseCredits` + `creditsConsumed = true`).
2. Keep the `creditsConsumed` variable declaration but don't set it early.
3. After the Zod validation succeeds (after current line 432), add the credit consumption:

```typescript
    // Zod validation passed — NOW consume credits (user only pays for valid results)
    const creditResult = await checkAndUseCredits(supabaseForRefund!, userIdForRefund!, "resin_recommendation", reqId);
    if (!creditResult.allowed) {
      logger.warn(`Insufficient credits for user ${userIdForRefund} on resin_recommendation`);
      return createInsufficientCreditsResponse(creditResult, corsHeaders);
    }
    creditsConsumed = true;
```

4. Remove ALL `refundCredits` calls in the AI error catches (lines 369, 380, 390, 417, 428) since credits aren't consumed yet when those errors happen.

5. Keep the outer catch block's refund as safety net (for errors after credit consumption, e.g. DB save failure).

**Step 2: Test manually**

Deploy locally and call with valid request — verify credits consumed only after successful response.

**Step 3: Commit**

```bash
git add supabase/functions/recommend-resin/index.ts
git commit -m "fix(credits): move credit deduction after AI success in recommend-resin"
```

---

### Task 3: Move credit deduction after AI success — analyze-dental-photo

**Files:**
- Modify: `supabase/functions/analyze-dental-photo/index.ts`

**Step 1: Same pattern as Task 2**

1. Remove `checkAndUseCredits` at line 228 and `creditsConsumed = true` at line 233.
2. After the `if (!analysisResult)` check passes (after line 520), add credit consumption:

```typescript
    // Analysis succeeded — NOW consume credits
    const creditResult = await checkAndUseCredits(supabaseService, userId, "case_analysis", reqId);
    if (!creditResult.allowed) {
      return createInsufficientCreditsResponse(creditResult, corsHeaders);
    }
    creditsConsumed = true;
```

3. Remove refund calls in the AI catch blocks (lines 491, 501, 516) since credits won't be consumed yet.
4. Keep outer catch refund as safety net.

**Step 2: Commit**

```bash
git add supabase/functions/analyze-dental-photo/index.ts
git commit -m "fix(credits): move credit deduction after AI success in analyze-dental-photo"
```

---

### Task 4: Move credit deduction after AI success — recommend-cementation

**Files:**
- Modify: `supabase/functions/recommend-cementation/index.ts`

**Step 1: Same pattern as Tasks 2-3**

1. Remove `checkAndUseCredits` at line 155 and `creditsConsumed = true` at line 160.
2. After successful AI response parsing and Zod validation, add credit consumption.
3. Remove early refund calls.
4. Keep outer catch refund as safety net.

**Step 2: Commit**

```bash
git add supabase/functions/recommend-cementation/index.ts
git commit -m "fix(credits): move credit deduction after AI success in recommend-cementation"
```

---

### Task 5: Move credit deduction after AI success — generate-dsd

**Files:**
- Modify: `supabase/functions/generate-dsd/index.ts`

**Step 1: Same pattern but respect isFollowUpCall logic**

1. The credit check at line 1081-1088 already has `isFollowUpCall` guard. Move the same block to after analysis succeeds.
2. After `let analysis: DSDAnalysis` is populated and validated, add credit consumption for non-follow-up calls.
3. Remove early refund calls.

**Step 2: Commit**

```bash
git add supabase/functions/generate-dsd/index.ts
git commit -m "fix(credits): move credit deduction after AI success in generate-dsd"
```

---

### Task 6: Reduce analyze-dental-photo timeout to 50s

**Files:**
- Modify: `supabase/functions/_shared/claude.ts:17`

**Step 1: Change DEFAULT_TIMEOUT_MS**

```typescript
// Before:
const DEFAULT_TIMEOUT_MS = 55_000;

// After:
const DEFAULT_TIMEOUT_MS = 50_000;
```

This gives 10s buffer before the 60s edge function limit instead of 5s.

**Step 2: Commit**

```bash
git add supabase/functions/_shared/claude.ts
git commit -m "fix(perf): reduce Claude default timeout to 50s for safer edge function margin"
```

---

### Task 7: Add Zod validation to generate-dsd text fallback path

**Files:**
- Modify: `supabase/functions/generate-dsd/index.ts:894-906`

**Context:** Lines 896-903 already use `parseAIResponse` — the Feb-14 audit noted this was missing but it was actually added. Verify this is correct.

**Step 1: Verify the fallback path at lines 896-903**

Read the code — confirm `parseAIResponse(DSDAnalysisSchema, rawArgs, 'generate-dsd')` exists at line 900. If it does, this task is already done.

**Step 2: If already correct, skip. If missing, add:**

```typescript
const rawArgs = JSON.parse(jsonMatch[0]);
const parsed = parseAIResponse(DSDAnalysisSchema, rawArgs, 'generate-dsd') as DSDAnalysis;
```

**Step 3: Commit if changed**

```bash
git add supabase/functions/generate-dsd/index.ts
git commit -m "fix(validation): ensure Zod validation on DSD text fallback path"
```

---

## Sprint 2: Performance & UX Quick Wins (P1)

### Task 8: Implement virtual scrolling for Evaluations list

**Files:**
- Modify: `apps/web/src/hooks/domain/useEvaluationSessions.ts:86`
- Modify: `apps/web/src/pages/Evaluations.tsx`

**Step 1: Reduce initial pageSize and add pagination**

In `useEvaluationSessions.ts`, change line 86:

```typescript
// Before:
pageSize: 1000,

// After:
pageSize: 50,
```

**Step 2: Add load-more or infinite scroll pattern**

If the page uses ListPage composite (it does), configure pagination through the composite's built-in pagination props. Check the ListPage API for `onLoadMore` or `pagination` config.

**Step 3: Run app locally and verify Evaluations page loads**

Run: `cd apps/web && pnpm dev`
Navigate to /evaluations — verify it loads with paginated data.

**Step 4: Commit**

```bash
git add apps/web/src/hooks/domain/useEvaluationSessions.ts apps/web/src/pages/Evaluations.tsx
git commit -m "fix(perf): paginate evaluations list to 50 items instead of 1000"
```

---

### Task 9: Implement virtual scrolling for Patients list

**Files:**
- Modify: `apps/web/src/hooks/domain/usePatientList.ts:37`
- Modify: `apps/web/src/pages/Patients.tsx`

**Step 1: Reduce pageSize**

In `usePatientList.ts`, change line 37:

```typescript
// Before:
pageSize: 1000,

// After:
pageSize: 50,
```

**Step 2: Same pagination pattern as Task 8**

**Step 3: Commit**

```bash
git add apps/web/src/hooks/domain/usePatientList.ts apps/web/src/pages/Patients.tsx
git commit -m "fix(perf): paginate patients list to 50 items instead of 1000"
```

---

### Task 10: Fix hardcoded i18n strings in ToothSelectionCard

**Files:**
- Modify: `apps/web/src/components/wizard/review/ToothSelectionCard.tsx:303-309, 351`
- Modify: `apps/web/src/locales/pt-BR.json`

**Step 1: Add translation keys to pt-BR.json**

Under `components.wizard.review`, add:

```json
"treatmentResina": "Resina Composta",
"treatmentPorcelana": "Faceta de Porcelana",
"treatmentCoroa": "Coroa Total",
"treatmentImplante": "Implante",
"treatmentEndodontia": "Tratamento de Canal",
"treatmentEncaminhamento": "Encaminhamento",
"cancel": "Cancelar"
```

**Step 2: Replace hardcoded strings in ToothSelectionCard.tsx**

```tsx
// Lines 303-308: Replace each SelectItem
<SelectItem value="resina">{t('components.wizard.review.treatmentResina')}</SelectItem>
<SelectItem value="porcelana">{t('components.wizard.review.treatmentPorcelana')}</SelectItem>
<SelectItem value="coroa">{t('components.wizard.review.treatmentCoroa')}</SelectItem>
<SelectItem value="implante">{t('components.wizard.review.treatmentImplante')}</SelectItem>
<SelectItem value="endodontia">{t('components.wizard.review.treatmentEndodontia')}</SelectItem>
<SelectItem value="encaminhamento">{t('components.wizard.review.treatmentEncaminhamento')}</SelectItem>

// Line 351: Replace "Cancelar"
<Button variant="ghost" onClick={() => setShowManualAdd(false)}>
  {t('components.wizard.review.cancel')}
</Button>
```

**Step 3: Verify the component imports `useTranslation`**

Check that `const { t } = useTranslation();` exists in the component. If not, add it.

**Step 4: Commit**

```bash
git add apps/web/src/components/wizard/review/ToothSelectionCard.tsx apps/web/src/locales/pt-BR.json
git commit -m "fix(i18n): replace hardcoded treatment types in ToothSelectionCard"
```

---

### Task 11: Fix hardcoded i18n strings in AddTeethModal

**Files:**
- Modify: `apps/web/src/components/AddTeethModal.tsx:223-228`
- Modify: `apps/web/src/locales/pt-BR.json`

**Step 1: Add translation keys**

Under `components.addTeeth`, add:

```json
"treatmentResina": "🔧 Resina Composta",
"treatmentPorcelana": "👑 Faceta de Porcelana",
"treatmentCoroa": "💎 Coroa Total",
"treatmentImplante": "🦷 Implante",
"treatmentEndodontia": "🔬 Tratamento de Canal",
"treatmentEncaminhamento": "➡️ Encaminhamento"
```

**Step 2: Replace hardcoded strings**

```tsx
<SelectItem value="resina">{t('components.addTeeth.treatmentResina')}</SelectItem>
<SelectItem value="porcelana">{t('components.addTeeth.treatmentPorcelana')}</SelectItem>
<SelectItem value="coroa">{t('components.addTeeth.treatmentCoroa')}</SelectItem>
<SelectItem value="implante">{t('components.addTeeth.treatmentImplante')}</SelectItem>
<SelectItem value="endodontia">{t('components.addTeeth.treatmentEndodontia')}</SelectItem>
<SelectItem value="encaminhamento">{t('components.addTeeth.treatmentEncaminhamento')}</SelectItem>
```

**Step 3: Commit**

```bash
git add apps/web/src/components/AddTeethModal.tsx apps/web/src/locales/pt-BR.json
git commit -m "fix(i18n): replace hardcoded treatment types in AddTeethModal"
```

---

### Task 12: Remove legacy CORS domains

**Files:**
- Modify: `supabase/functions/_shared/cors.ts:11-18`

**Step 1: Verify which domains are still active**

Before removing, confirm DNS/Vercel setup. The current production domain should be `auria-ai.vercel.app`. Legacy domains to review: `tosmile-ai.vercel.app`, `tosmile.ai`, `www.tosmile.ai`, `dentai.pro`, `www.dentai.pro`, `dentai-pro.vercel.app`.

**Step 2: Update PRODUCTION_ORIGINS**

If legacy domains still redirect to production, keep them but add comments with sunset dates. If they're truly unused:

```typescript
const PRODUCTION_ORIGINS = [
  "https://auria-ai.vercel.app",  // Current production
  // Keep any domains that still serve traffic or redirect
  // Remove after confirming DNS migration complete
];
```

**Step 3: Commit**

```bash
git add supabase/functions/_shared/cors.ts
git commit -m "fix(security): remove legacy CORS domains after DNS verification"
```

---

### Task 13: Fix ADR-001 layer violations — SharedEvaluation

**Files:**
- Modify: `apps/web/src/pages/SharedEvaluation.tsx`
- Modify: `apps/web/src/data/storage.ts`

**Step 1: Add getSignedUrl to data/storage.ts**

Read `data/storage.ts` first to see what already exists. Add a function:

```typescript
export async function getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error) return null;
  return data.signedUrl;
}
```

**Step 2: Replace direct Supabase import in SharedEvaluation**

Replace `import { supabase } from '@/data/client'` with `import { storage } from '@/data'` and use `storage.getSignedUrl()`.

**Step 3: Run type check**

Run: `cd apps/web && pnpm type-check`

**Step 4: Commit**

```bash
git add apps/web/src/data/storage.ts apps/web/src/pages/SharedEvaluation.tsx
git commit -m "refactor(arch): fix ADR-001 violation in SharedEvaluation — use data layer"
```

---

### Task 14: Fix ADR-001 layer violation — Pricing

**Files:**
- Modify: `apps/web/src/pages/Pricing.tsx`
- Modify: `apps/web/src/data/subscriptions.ts`

**Step 1: Add syncSubscription to data/subscriptions.ts**

```typescript
export async function syncSubscription(): Promise<void> {
  const { error } = await supabase.functions.invoke('sync-subscription');
  if (error) throw error;
}
```

**Step 2: Replace direct Supabase import in Pricing.tsx**

Replace the direct `supabase.functions.invoke('sync-subscription')` call with `subscriptions.syncSubscription()`.

**Step 3: Run type check**

**Step 4: Commit**

```bash
git add apps/web/src/data/subscriptions.ts apps/web/src/pages/Pricing.tsx
git commit -m "refactor(arch): fix ADR-001 violation in Pricing — use data layer"
```

---

### Task 15: Convert clickable divs to buttons in ToothSelectionCard

**Files:**
- Modify: `apps/web/src/components/wizard/review/ToothSelectionCard.tsx`

**Step 1: Find clickable div patterns**

Search for `<div` with `onClick` in the tooth grid area. Convert to `<button type="button"` with the same styling.

```tsx
// Before (around lines 89-97):
<div
  className="..."
  onClick={() => handleToggleTooth(tooth.tooth, !isSelected)}
>

// After:
<button
  type="button"
  className="... text-left"
  onClick={() => handleToggleTooth(tooth.tooth, !isSelected)}
  aria-pressed={isSelected}
  aria-label={t('components.wizard.review.toggleTooth', { number: tooth.tooth })}
>
```

Remember to close with `</button>` instead of `</div>`.

**Step 2: Add i18n key**

Add to pt-BR.json under `components.wizard.review`:
```json
"toggleTooth": "Alternar dente {{number}}"
```

**Step 3: Run type check and tests**

Run: `cd apps/web && pnpm type-check && pnpm test -- --run`

**Step 4: Commit**

```bash
git add apps/web/src/components/wizard/review/ToothSelectionCard.tsx apps/web/src/locales/pt-BR.json
git commit -m "fix(a11y): convert clickable divs to buttons in ToothSelectionCard"
```

---

## Sprint 3: Test Coverage (P1)

### Task 16: Add tests for protocol display components

**Files:**
- Create: `apps/web/src/components/protocol/__tests__/ProtocolTable.test.tsx`

**Step 1: Read ProtocolTable.tsx to understand props**

Understand the component's interface before writing tests.

**Step 2: Write snapshot + behavior tests**

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProtocolTable from '../ProtocolTable';

// Create fixture data based on real AI response structure
const mockProtocol = {
  // ... based on actual StratificationProtocol type
};

describe('ProtocolTable', () => {
  it('renders stratification layers in order', () => {
    render(<ProtocolTable protocol={mockProtocol} />);
    // Verify layers are displayed
  });

  it('shows alternative section when alternative exists', () => {
    // ...
  });

  it('renders empty state when no layers', () => {
    // ...
  });
});
```

**Step 3: Run tests to verify**

Run: `cd apps/web && pnpm test -- --run src/components/protocol/__tests__/ProtocolTable.test.tsx`

**Step 4: Commit**

```bash
git add apps/web/src/components/protocol/__tests__/
git commit -m "test: add ProtocolTable component tests"
```

---

### Task 17: Add tests for critical data layer gaps

**Files:**
- Create: `apps/web/src/data/__tests__/credit-usage.test.ts`
- Create: `apps/web/src/data/__tests__/payments.test.ts`

**Step 1: Read credit-usage.ts and payments.ts to understand functions**

**Step 2: Write tests with mocked Supabase client**

Follow the existing pattern from `data/__tests__/wizard.test.ts` for mock setup.

**Step 3: Run tests**

Run: `cd apps/web && pnpm test -- --run src/data/__tests__/credit-usage.test.ts`

**Step 4: Commit**

```bash
git add apps/web/src/data/__tests__/
git commit -m "test: add credit-usage and payments data layer tests"
```

---

### Task 18: Add tests for useResult and useGroupResult hooks

**Files:**
- Create: `apps/web/src/hooks/__tests__/useResult.test.ts`
- Create: `apps/web/src/hooks/__tests__/useGroupResult.test.ts`

**Step 1: Read hooks to understand interface**

**Step 2: Write tests following existing hook test patterns**

Follow pattern from `useEvaluationDetail.test.ts` or `useDashboard.test.ts`.

**Step 3: Run tests**

**Step 4: Commit**

```bash
git add apps/web/src/hooks/__tests__/
git commit -m "test: add useResult and useGroupResult hook tests"
```

---

### Task 19: Increase coverage thresholds in vitest config

**Files:**
- Modify: `apps/web/vitest.config.ts`

**Step 1: Update thresholds**

```typescript
thresholds: {
  statements: 25,  // up from 18
  branches: 72,    // keep same
  functions: 50,   // up from 42
  lines: 25,       // up from 18
}
```

**Step 2: Run full test suite to verify thresholds pass**

Run: `cd apps/web && pnpm test -- --run --coverage`

**Step 3: Commit**

```bash
git add apps/web/vitest.config.ts
git commit -m "test: increase coverage thresholds (statements 25%, functions 50%)"
```

---

## Sprint 4: Code Quality & Polish (P2)

### Task 20: Extract AuthLayout component

**Files:**
- Create: `apps/web/src/components/auth/AuthLayout.tsx`
- Modify: `apps/web/src/pages/Login.tsx`
- Modify: `apps/web/src/pages/Register.tsx`
- Modify: `apps/web/src/pages/ForgotPassword.tsx`
- Modify: `apps/web/src/pages/ResetPassword.tsx`

**Step 1: Extract shared brand panel + layout from Login.tsx**

Read Login.tsx to identify the shared pattern. Create:

```tsx
interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  // Brand panel + form layout extracted from Login.tsx
}
```

**Step 2: Refactor all 4 auth pages to use AuthLayout**

**Step 3: Run type check and verify pages visually**

**Step 4: Commit**

```bash
git add apps/web/src/components/auth/AuthLayout.tsx apps/web/src/pages/Login.tsx apps/web/src/pages/Register.tsx apps/web/src/pages/ForgotPassword.tsx apps/web/src/pages/ResetPassword.tsx
git commit -m "refactor(ui): extract AuthLayout to DRY auth page brand panel"
```

---

### Task 21: Add bundle analyzer

**Files:**
- Modify: `apps/web/vite.config.ts`
- Modify: `apps/web/package.json` (devDependency)

**Step 1: Install rollup-plugin-visualizer**

Run: `cd apps/web && pnpm add -D rollup-plugin-visualizer`

**Step 2: Add to vite config (analyze mode only)**

```typescript
import { visualizer } from 'rollup-plugin-visualizer';

// Add to plugins array (conditional):
...(process.env.ANALYZE === 'true' ? [visualizer({ filename: 'dist/stats.html', open: true })] : []),
```

**Step 3: Test it**

Run: `cd apps/web && ANALYZE=true pnpm build`
Expected: Opens stats.html in browser.

**Step 4: Commit**

```bash
git add apps/web/vite.config.ts apps/web/package.json apps/web/pnpm-lock.yaml
git commit -m "chore: add bundle analyzer (ANALYZE=true pnpm build)"
```

---

### Task 22: Move computeInsights inside queryFn

**Files:**
- Modify: `apps/web/src/hooks/domain/useDashboard.ts`

**Step 1: Find where computeInsights is called outside queryFn**

Read the hook to find where raw data is fetched vs where insights are computed. Move the `computeInsights()` call inside the `queryFn` so React Query caches the result.

**Step 2: Run tests**

Run: `cd apps/web && pnpm test -- --run src/hooks/__tests__/useDashboard.test.ts`

**Step 3: Commit**

```bash
git add apps/web/src/hooks/domain/useDashboard.ts
git commit -m "fix(perf): move computeInsights inside queryFn to prevent re-computation"
```

---

## Summary

| Sprint | Tasks | Focus | Est. Time |
|--------|-------|-------|-----------|
| 1 | Tasks 1-7 | Security P0: auth validation, credit timing, timeout | 1 day |
| 2 | Tasks 8-15 | Performance + UX P1: pagination, i18n, CORS, ADR-001, a11y | 1.5 days |
| 3 | Tasks 16-19 | Test Coverage P1: protocol tests, data layer, hooks, thresholds | 2 days |
| 4 | Tasks 20-22 | Code Quality P2: AuthLayout, bundle analyzer, perf | 1 day |
| **Total** | **22 tasks** | | **~5.5 days** |

## Verification Checklist

After all sprints:

- [ ] `cd apps/web && pnpm type-check` passes
- [ ] `cd apps/web && pnpm test -- --run` passes (all 603+ tests)
- [ ] `cd apps/web && pnpm build` succeeds
- [ ] Credit flow: credits only consumed after successful AI response
- [ ] Deleted users cannot call edge functions
- [ ] Evaluations/Patients pages load with pagination (no 1000-item fetch)
- [ ] No hardcoded Portuguese strings in ToothSelectionCard or AddTeethModal
- [ ] Zero ADR-001 layer violations in SharedEvaluation and Pricing
- [ ] Coverage thresholds at statements:25%, functions:50%
