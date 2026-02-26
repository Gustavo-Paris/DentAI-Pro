# Production Readiness Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 5 Critical blockers and 21 High-priority findings from the production audit to bring the platform to launch quality.

**Architecture:** Two phases — Phase 1 fixes production blockers (DB constraints, type gaps, security), Phase 2 fixes launch-quality issues (error handling, clinical correctness, a11y). Tasks are organized to be parallelizable by file ownership.

**Tech Stack:** PostgreSQL migrations, TypeScript (React 18 + Deno), Tailwind CSS, i18n (react-i18next), Supabase Edge Functions

**Source Audit:** `docs/plans/2026-02-25-production-audit.md`

---

## Phase 1: Production Blockers

### Task 1: Database Migrations (C1 + H3 + H5)

Three independent migration fixes in a single new migration file.

**Files:**
- Create: `supabase/migrations/043_production_audit_fixes.sql`

**Step 1: Write the migration**

```sql
-- 043_production_audit_fixes.sql
-- Production audit fixes: CHECK constraint, PHI fail-closed, credit_pack RLS

-- ===========================================
-- 1. FIX C1: treatment_type CHECK constraint missing gengivoplastia + recobrimento_radicular
-- ===========================================
ALTER TABLE public.evaluations_raw
  DROP CONSTRAINT IF EXISTS evaluations_raw_treatment_type_check;

ALTER TABLE public.evaluations_raw
  ADD CONSTRAINT evaluations_raw_treatment_type_check
  CHECK (treatment_type IN (
    'resina', 'porcelana', 'implante', 'coroa', 'endodontia', 'encaminhamento',
    'gengivoplastia', 'recobrimento_radicular'
  ))
  NOT VALID;

-- ===========================================
-- 2. FIX H3: PHI encryption MUST fail closed (LGPD Art. 46)
-- Replaces the silent RAISE WARNING with RAISE EXCEPTION
-- ===========================================
CREATE OR REPLACE FUNCTION public.encrypt_patient_phi()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key bytea;
BEGIN
  -- Get encryption key from vault
  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'phi_encryption_key'
  LIMIT 1;

  IF v_key IS NULL THEN
    RAISE EXCEPTION 'PHI encryption key not found in vault — refusing to store unencrypted PHI (LGPD Art. 46)';
  END IF;

  -- Encrypt each PHI field if present
  IF NEW.name IS NOT NULL THEN
    NEW.name_encrypted := pgp_sym_encrypt(NEW.name, encode(v_key, 'hex'));
    NEW.name := NULL;
  END IF;

  IF NEW.phone IS NOT NULL THEN
    NEW.phone_encrypted := pgp_sym_encrypt(NEW.phone, encode(v_key, 'hex'));
    NEW.phone := NULL;
  END IF;

  IF NEW.email IS NOT NULL THEN
    NEW.email_encrypted := pgp_sym_encrypt(NEW.email, encode(v_key, 'hex'));
    NEW.email := NULL;
  END IF;

  IF NEW.birth_date IS NOT NULL THEN
    NEW.birth_date_encrypted := pgp_sym_encrypt(NEW.birth_date::text, encode(v_key, 'hex'));
    NEW.birth_date := NULL;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- FAIL CLOSED: refuse to store PHI without encryption
  RAISE EXCEPTION 'PHI encryption failed — refusing INSERT (LGPD Art. 46): %', SQLERRM;
END;
$$;

-- ===========================================
-- 3. FIX H5: credit_pack_purchases missing INSERT policy for service_role
-- ===========================================
CREATE POLICY "Service role can insert purchases"
  ON public.credit_pack_purchases
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update purchases"
  ON public.credit_pack_purchases
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

**Step 2: Apply migration locally**

Run: `npx supabase db push` (or `npx supabase migration up` for local dev)
Expected: Migration applies without error.

**Step 3: Verify constraints**

Run against local DB:
```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.evaluations_raw'::regclass AND contype = 'c';
```
Expected: `evaluations_raw_treatment_type_check` includes all 8 values.

**Step 4: Commit**

```bash
git add supabase/migrations/043_production_audit_fixes.sql
git commit -m "fix: DB audit — CHECK constraint, PHI fail-closed, credit_pack RLS"
```

---

### Task 2: `recobrimento_radicular` Type System Completeness (C2)

**Files:**
- Modify: `apps/web/src/components/AddTeethModal.tsx:25,60-68,223-230`
- Modify: `apps/web/src/hooks/domain/useEvaluationDetail.ts:107-115,493,539`

**Step 1: Update `AddTeethModal.tsx` — TreatmentType union**

At line 25, change:
```typescript
// FROM:
export type TreatmentType = 'resina' | 'porcelana' | 'coroa' | 'implante' | 'endodontia' | 'encaminhamento' | 'gengivoplastia';

// TO:
export type TreatmentType = 'resina' | 'porcelana' | 'coroa' | 'implante' | 'endodontia' | 'encaminhamento' | 'gengivoplastia' | 'recobrimento_radicular';
```

**Step 2: Update `AddTeethModal.tsx` — TREATMENT_LABEL_KEYS**

At lines 60-68, add:
```typescript
const TREATMENT_LABEL_KEYS: Record<TreatmentType, string> = {
  resina: 'components.wizard.review.treatmentResina',
  porcelana: 'components.wizard.review.treatmentPorcelana',
  coroa: 'components.wizard.review.treatmentCoroa',
  implante: 'components.wizard.review.treatmentImplante',
  endodontia: 'components.wizard.review.treatmentEndodontia',
  encaminhamento: 'components.wizard.review.treatmentEncaminhamento',
  gengivoplastia: 'components.wizard.review.treatmentGengivoplastia',
  recobrimento_radicular: 'components.wizard.review.treatmentRecobrimentoRadicular',
};
```

**Step 3: Update `AddTeethModal.tsx` — SelectItem options (restorative section)**

At lines 223-230, add two new SelectItems:
```tsx
<SelectContent>
  <SelectItem value="resina">{t('components.addTeeth.treatmentResina')}</SelectItem>
  <SelectItem value="porcelana">{t('components.addTeeth.treatmentPorcelana')}</SelectItem>
  <SelectItem value="coroa">{t('components.addTeeth.treatmentCoroa')}</SelectItem>
  <SelectItem value="implante">{t('components.addTeeth.treatmentImplante')}</SelectItem>
  <SelectItem value="endodontia">{t('components.addTeeth.treatmentEndodontia')}</SelectItem>
  <SelectItem value="encaminhamento">{t('components.addTeeth.treatmentEncaminhamento')}</SelectItem>
  <SelectItem value="gengivoplastia">{t('components.addTeeth.treatmentGengivoplastia')}</SelectItem>
  <SelectItem value="recobrimento_radicular">{t('components.addTeeth.treatmentRecobrimentoRadicular')}</SelectItem>
</SelectContent>
```

**Step 4: Update `useEvaluationDetail.ts` — TREATMENT_LABEL_KEYS**

At lines 107-115, add the missing entry:
```typescript
const TREATMENT_LABEL_KEYS: Record<TreatmentType, string> = {
  resina: 'components.wizard.review.treatmentResina',
  porcelana: 'components.wizard.review.treatmentPorcelana',
  coroa: 'components.wizard.review.treatmentCoroa',
  implante: 'components.wizard.review.treatmentImplante',
  endodontia: 'components.wizard.review.treatmentEndodontia',
  encaminhamento: 'components.wizard.review.treatmentEncaminhamento',
  gengivoplastia: 'components.wizard.review.treatmentGengivoplastia',
  recobrimento_radicular: 'components.wizard.review.treatmentRecobrimentoRadicular',
};
```

**Step 5: Update `useEvaluationDetail.ts` — stratification_needed guard**

At line 493, change:
```typescript
// FROM:
stratification_needed: treatmentType !== 'gengivoplastia',

// TO:
stratification_needed: treatmentType !== 'gengivoplastia' && treatmentType !== 'recobrimento_radicular',
```

**Step 6: Update `useEvaluationDetail.ts` — handleSubmitTeeth switch**

After the `case 'gengivoplastia':` block (around line 555), add:
```typescript
  case 'recobrimento_radicular': {
    const genericProtocol = getGenericProtocol(treatmentType, toothNumber, toothData);
    await evaluations.updateEvaluation(evaluation.id, {
      generic_protocol: genericProtocol,
      recommendation_text: genericProtocol.summary,
    });
    break;
  }
```

**Step 7: Add i18n keys for AddTeethModal**

In `apps/web/src/locales/pt-BR.json`, inside `components.addTeeth`, add:
```json
"treatmentGengivoplastia": "Gengivoplastia",
"treatmentRecobrimentoRadicular": "Recobrimento Radicular"
```

In `apps/web/src/locales/en-US.json`, same location:
```json
"treatmentGengivoplastia": "Gingivoplasty",
"treatmentRecobrimentoRadicular": "Root Coverage"
```

**Step 8: Verify TypeScript compiles**

Run: `cd apps/web && ../../node_modules/.bin/tsc --noEmit`
Expected: Zero errors.

**Step 9: Commit**

```bash
git add apps/web/src/components/AddTeethModal.tsx apps/web/src/hooks/domain/useEvaluationDetail.ts apps/web/src/locales/pt-BR.json apps/web/src/locales/en-US.json
git commit -m "fix: recobrimento_radicular — type union, switch case, label keys, select items"
```

---

### Task 3: Security Cleanup — E2E Credentials (C4)

**Files:**
- Modify: `.gitignore` (root)
- Delete: `apps/web/.env.e2e` (after confirming gitignore covers it)
- Note: `apps/web/e2e/.auth/` is already gitignored by `apps/web/e2e/.gitignore`

**Step 1: Check if `.env.e2e` is tracked by git**

Run: `git ls-files apps/web/.env.e2e`
If output is non-empty → it is tracked and must be removed from tracking.

**Step 2: Remove `.env.e2e` from git tracking (if tracked)**

Run: `git rm --cached apps/web/.env.e2e`

**Step 3: Check if `e2e/.auth/user.json` is tracked by git**

Run: `git ls-files apps/web/e2e/.auth/user.json`
If tracked → `git rm --cached apps/web/e2e/.auth/user.json`

**Step 4: Add exclusions to root `.gitignore`**

Add to root `.gitignore`:
```
# E2E credentials — must be in CI secrets, not in repo
apps/web/.env.e2e
apps/web/e2e/.auth/
```

**Step 5: Commit**

```bash
git add .gitignore
git commit -m "fix: remove E2E credentials from tracking, add to gitignore"
```

**Step 6: Post-merge manual action (document, do NOT automate)**

After merging, the human must:
1. Revoke the refresh token in Supabase dashboard (Auth → Users → e2etest.auria@gmail.com → Revoke Sessions)
2. Change the E2E user password in Supabase
3. Add `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` as GitHub Actions secrets
4. Consider running `git filter-branch` or BFG to scrub `.env.e2e` from git history

---

### Task 4: Stripe Webhook Error Handling (H1)

**Files:**
- Modify: `supabase/functions/stripe-webhook/index.ts:236-240,254-258,294-298,354-356,359-366`

**Step 1: Make DB errors throw in subscription update**

At lines 236-240, change:
```typescript
// FROM:
if (error) {
  logger.error("Error updating subscription:", error);
} else {

// TO:
if (error) {
  throw new Error(`DB error updating subscription ${subscription.id}: ${error.message}`);
}
```

**Step 2: Same pattern for subscription cancellation**

At lines 254-258, change:
```typescript
if (error) {
  throw new Error(`DB error canceling subscription ${subscription.id}: ${error.message}`);
}
```

**Step 3: Same pattern for payment record**

At lines 294-298, change:
```typescript
if (error) {
  throw new Error(`DB error recording payment for invoice ${invoice.id}: ${error.message}`);
}
```

**Step 4: Same for failed payment history + status update**

At lines 354-356 and 359-366:
```typescript
if (historyError) {
  throw new Error(`DB error recording payment failure: ${historyError.message}`);
}

// ...
if (statusError) {
  throw new Error(`DB error updating subscription status to past_due: ${statusError.message}`);
}
```

The `withErrorBoundary` wrapper at the top-level will catch these throws and return 500, which triggers Stripe's retry mechanism.

**Step 5: Verify no syntax errors**

Run: `cd supabase && deno check functions/stripe-webhook/index.ts` (or just review)

**Step 6: Commit**

```bash
git add supabase/functions/stripe-webhook/index.ts
git commit -m "fix: stripe webhook — throw on DB errors to trigger Stripe retry"
```

---

## Phase 2: Launch Quality

### Task 5: Edge Function Error Handling (H2 + H7 + H8)

Three independent edge function fixes.

**Files:**
- Modify: `supabase/functions/generate-dsd/index.ts:275-280`
- Modify: `apps/web/src/data/evaluations.ts:515-518`
- Modify: `supabase/functions/recommend-resin/index.ts:103-105`

**Step 1: Fix H2 — generate-dsd DB write error check**

At lines 275-280, change:
```typescript
// FROM:
await supabase
  .from("evaluations")
  .update(updateData)
  .eq("id", evaluationId)
  .eq("user_id", user.id);

// TO:
const { error: dbError } = await supabase
  .from("evaluations")
  .update(updateData)
  .eq("id", evaluationId)
  .eq("user_id", user.id);

if (dbError) {
  logger.error("Failed to save DSD simulation to DB:", dbError);
  // Simulation was generated and uploaded — return URL anyway so user can see it
  // but flag the error so client can show a warning
}
```

**Step 2: Fix H7 — invokeEdgeFunction error body extraction**

At lines 515-518 in `evaluations.ts`, change:
```typescript
// FROM:
export async function invokeEdgeFunction(name: string, body: Record<string, unknown>) {
  const { error } = await supabase.functions.invoke(name, { body });
  if (error) throw error;
}

// TO:
export async function invokeEdgeFunction(name: string, body: Record<string, unknown>) {
  const { error } = await supabase.functions.invoke(name, { body });
  if (error) {
    // Extract structured error body from FunctionsHttpError
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === 'function') {
      try {
        const errorBody = await context.json();
        const serverMessage = errorBody?.error || errorBody?.message;
        if (serverMessage) {
          const enriched = new Error(serverMessage);
          (enriched as { code?: string }).code = errorBody?.code;
          (enriched as { status?: number }).status = context.status || 0;
          throw enriched;
        }
      } catch (parseError) {
        if (parseError instanceof Error && (parseError as { code?: string }).code) throw parseError;
        // JSON parse failed — fall through to throw original error
      }
    }
    throw error;
  }
}
```

**Step 3: Fix H8 — recommend-resin inventory error**

At lines 103-105, change:
```typescript
// FROM:
if (inventoryError) {
  logger.error("Error fetching inventory:", inventoryError);
}

// TO:
if (inventoryError) {
  logger.error("Error fetching inventory:", inventoryError);
  return createErrorResponse("Erro ao buscar inventário do usuário", 500, corsHeaders);
}
```

**Step 4: Commit**

```bash
git add supabase/functions/generate-dsd/index.ts apps/web/src/data/evaluations.ts supabase/functions/recommend-resin/index.ts
git commit -m "fix: error handling — DSD DB write, invokeEdgeFunction body, inventory 500"
```

---

### Task 6: RouteErrorBoundary Reset (H6)

**Files:**
- Modify: `apps/web/src/App.tsx:145-164`

**Step 1: Add location-based key reset**

The cleanest fix: wrap each route's `<RouteErrorBoundary>` with a `key` derived from the current route path. Since `RouteErrorBoundary` is used inside `<Route>` elements, we need a wrapper component:

```typescript
// Add BEFORE RouteErrorBoundary class definition (line 145):
function RouteErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  const location = useLocation();
  return <RouteErrorBoundary key={location.pathname}>{children}</RouteErrorBoundary>;
}
```

Then replace all `<RouteErrorBoundary>` usages in routes with `<RouteErrorBoundaryWrapper>`.

Also add `useLocation` to the import from `react-router-dom` (line 8):
```typescript
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
```

**Step 2: Verify build**

Run: `cd apps/web && ../../node_modules/.bin/tsc --noEmit`

**Step 3: Commit**

```bash
git add apps/web/src/App.tsx
git commit -m "fix: RouteErrorBoundary resets on navigation via location key"
```

---

### Task 7: Clinical Correctness (H9 + H10 + H11 + H12)

**Files:**
- Modify: `supabase/functions/recommend-resin/shade-validation.ts:33-38,251,451-455`
- Modify: `supabase/functions/analyze-dental-photo/post-processing.ts:98-109,146`

**Step 1: Fix H9 — Expand enamelShadesList**

At line 251 of `shade-validation.ts`:
```typescript
// FROM:
const enamelShadesList = ['WE', 'A1E', 'A2E', 'A3E', 'B1E', 'B2E', 'CT', 'GT', 'BT', 'YT', 'MW', 'CE', 'JE', 'TN', 'INC', 'BL1', 'BL2', 'BL3', 'BL-L'];

// TO:
const enamelShadesList = ['WE', 'A1E', 'A2E', 'A3E', 'B1E', 'B2E', 'CT', 'GT', 'BT', 'YT', 'MW', 'CE', 'JE', 'TN', 'INC', 'BL1', 'BL2', 'BL3', 'BL-L', 'BL-XL', 'BL-T', 'XLE', 'Trans20', 'Trans30', 'Trans', 'Opal'];
```

**Step 2: Fix H10 — Expand AESTHETIC_CLASSES and lower injection threshold**

At lines 33-38 of `shade-validation.ts`:
```typescript
// FROM:
const AESTHETIC_CLASSES = [
  'classe iii', 'classe iv', 'classe v',
  'faceta direta', 'fechamento de diastema',
  'recontorno estético', 'lente de contato',

// TO:
const AESTHETIC_CLASSES = [
  'classe i', 'classe ii', 'classe iii', 'classe iv', 'classe v',
  'faceta direta', 'fechamento de diastema',
  'recontorno estético', 'lente de contato',
```

At line 455 of `shade-validation.ts`, lower the threshold:
```typescript
// FROM:
if (anterior && isAestheticCase && recommendation.protocol.layers.length >= 4) {

// TO:
if (anterior && isAestheticCase && recommendation.protocol.layers.length >= 3) {
```

**Step 3: Fix H11 — Bilateral diastema exception**

At lines 100-104 of `post-processing.ts`, add bilateral exception before the strip:
```typescript
  } else if (analysisConfidence < 65) {
    // Rule 1: Very low confidence — strip diastema diagnoses.
    // EXCEPTION: if both central incisors (11+21) are diagnosed, preserve — bilateral diastema is reliable
    const hasBilateralCentral = diastemaTeetIdx.some(i => detectedTeeth[i]?.tooth === '11')
      && diastemaTeetIdx.some(i => detectedTeeth[i]?.tooth === '21');
    if (hasBilateralCentral) {
      logger.log(`Post-processing: bilateral central diastema (11+21) preserved despite low confidence ${analysisConfidence}%`);
    } else {
      for (const idx of diastemaTeetIdx.reverse()) {
        const tooth = detectedTeeth[idx];
        logger.warn(`Post-processing: removing diastema diagnosis for tooth ${tooth.tooth} — overall confidence ${analysisConfidence}% < 65% threshold`);
        removedDiastemaTeeth.push(tooth.tooth);
        detectedTeeth.splice(idx, 1);
      }
    }
```

**Step 4: Fix H12 — Lower-tooth filter change `>=` to `>`**

At line 146 of `post-processing.ts`:
```typescript
// FROM:
if (upperTeeth.length > 0 && lowerTeeth.length > 0 && upperTeeth.length >= lowerTeeth.length) {

// TO:
if (upperTeeth.length > 0 && lowerTeeth.length > 0 && upperTeeth.length > lowerTeeth.length) {
```

**Step 5: Commit**

```bash
git add supabase/functions/recommend-resin/shade-validation.ts supabase/functions/analyze-dental-photo/post-processing.ts
git commit -m "fix: clinical — enamel blacklist, efeitos threshold, bilateral diastema, lower-tooth filter"
```

---

### Task 8: Frontend Accessibility & i18n (H17 + H18 + H19 + H20 + H21)

**Files:**
- Modify: `apps/web/src/components/evaluation/EvaluationCards.tsx:95-99`
- Modify: `apps/web/src/components/ProcessingOverlay.tsx:115`
- Modify: `apps/web/src/components/AddTeethModal.tsx:205`
- Modify: `apps/web/src/components/wizard/review/ToothSelectionCard.tsx:131`
- Modify: `apps/web/src/pages/Evaluations.tsx:339-355`
- Modify: `apps/web/src/locales/pt-BR.json`
- Modify: `apps/web/src/locales/en-US.json`

**Step 1: Fix H17 — EvaluationCards keyboard navigation**

At line 95 of `EvaluationCards.tsx`, add keyboard attributes to the Card:
```tsx
// FROM:
<Card
  key={evaluation.id}
  className={`shadow-sm rounded-xl border-l-[3px] ${borderColor} cursor-pointer hover:shadow-md transition-shadow mb-2 ${isGrouped ? 'ml-3 border-l-2 p-3' : 'p-4'}`}
  onClick={() => navigate(`/result/${evaluation.id}`)}
>

// TO:
<Card
  key={evaluation.id}
  className={`shadow-sm rounded-xl border-l-[3px] ${borderColor} cursor-pointer hover:shadow-md transition-shadow mb-2 ${isGrouped ? 'ml-3 border-l-2 p-3' : 'p-4'}`}
  onClick={() => navigate(`/result/${evaluation.id}`)}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/result/${evaluation.id}`); } }}
  role="button"
  tabIndex={0}
>
```

**Step 2: Fix H18 — ProcessingOverlay aria-live on step label**

At line 99 of `ProcessingOverlay.tsx`, add `aria-live` to the step label:
```tsx
// FROM:
<p className="mt-4 font-semibold text-primary">{displayMessage}</p>

// TO:
<p className="mt-4 font-semibold text-primary" aria-live="polite" aria-atomic="true">{displayMessage}</p>
```

And remove the redundant `aria-live` from the "do not close" text (line 115):
```tsx
// FROM:
<p className="text-xs text-muted-foreground mt-2 animate-pulse" aria-live="polite">

// TO:
<p className="text-xs text-muted-foreground mt-2 animate-pulse">
```

**Step 3: Fix H19 — Priority label translation**

Add i18n keys to both locale files:

`pt-BR.json` — inside `common`:
```json
"priorityAlta": "Alta",
"priorityMedia": "Média",
"priorityBaixa": "Baixa"
```

`en-US.json` — inside `common`:
```json
"priorityAlta": "High",
"priorityMedia": "Medium",
"priorityBaixa": "Low"
```

Then in `AddTeethModal.tsx` at line 205:
```tsx
// FROM:
{tooth.priority || 'média'}

// TO:
{t(`common.priority${(tooth.priority || 'média').charAt(0).toUpperCase() + (tooth.priority || 'média').slice(1)}`, { defaultValue: tooth.priority || 'média' })}
```

And in `ToothSelectionCard.tsx` at line 131:
```tsx
// FROM:
{tooth.priority}

// TO:
{t(`common.priority${tooth.priority.charAt(0).toUpperCase() + tooth.priority.slice(1)}`, { defaultValue: tooth.priority })}
```

**Step 4: Fix H20 — Pagination i18n keys**

Add to both locale files inside `common`:

`pt-BR.json`:
```json
"previous": "Anterior",
"pageOf": "Página {{page}} de {{total}}"
```

`en-US.json`:
```json
"previous": "Previous",
"pageOf": "Page {{page}} of {{total}}"
```

Then in `Evaluations.tsx`, update the pagination strings:
```tsx
// FROM:
{t('common.previous', { defaultValue: 'Anterior' })}
{t('common.pageOf', { page: page + 1, total: totalPages, defaultValue: `Pagina ${page + 1} de ${totalPages}` })}
{t('common.next', { defaultValue: 'Proximo' })}

// TO:
{t('common.previous')}
{t('common.pageOf', { page: page + 1, total: totalPages })}
{t('common.next')}
```

**Step 5: Fix H21 — Date format locale awareness**

Create a utility function. In `apps/web/src/lib/date-utils.ts`:

```typescript
import { ptBR, enUS } from 'date-fns/locale';
import i18n from '@/i18n';

export function getDateLocale() {
  return i18n.language?.startsWith('en') ? enUS : ptBR;
}

export function getDateFormat(format: 'short' | 'medium' | 'long' | 'greeting') {
  const isEn = i18n.language?.startsWith('en');
  switch (format) {
    case 'short': return isEn ? 'MMM d' : "d 'de' MMM";
    case 'medium': return isEn ? 'MMM d, yyyy' : "d 'de' MMM, yyyy";
    case 'long': return isEn ? 'MMMM d, yyyy' : "d 'de' MMMM 'de' yyyy";
    case 'greeting': return isEn ? 'EEEE, MMMM d' : "EEEE, d 'de' MMMM";
  }
}
```

Then replace hardcoded `{ locale: ptBR }` calls across the 14 affected files with `{ locale: getDateLocale() }` and format strings with `getDateFormat(...)`.

**Note:** The date-utils file + all 14 file updates is a larger refactor. For the initial fix, at minimum update `Dashboard.tsx:165` (the most visible one) and document the remaining as follow-up.

**Step 6: Verify build**

Run: `cd apps/web && ../../node_modules/.bin/tsc --noEmit`

**Step 7: Commit**

```bash
git add apps/web/src/components/evaluation/EvaluationCards.tsx apps/web/src/components/ProcessingOverlay.tsx apps/web/src/components/AddTeethModal.tsx apps/web/src/components/wizard/review/ToothSelectionCard.tsx apps/web/src/pages/Evaluations.tsx apps/web/src/locales/pt-BR.json apps/web/src/locales/en-US.json apps/web/src/lib/date-utils.ts apps/web/src/pages/Dashboard.tsx
git commit -m "fix: a11y + i18n — keyboard nav, aria-live, priority labels, pagination, date locale"
```

---

## Parallel Execution Map

Tasks can be parallelized in 3 batches:

**Batch A (no file conflicts):**
- Task 1 (migrations)
- Task 3 (security cleanup)
- Task 4 (stripe webhook)
- Task 6 (RouteErrorBoundary)

**Batch B (no file conflicts):**
- Task 2 (recobrimento_radicular — touches AddTeethModal, useEvaluationDetail, locales)
- Task 5 (edge function errors — touches generate-dsd, evaluations.ts, recommend-resin)
- Task 7 (clinical — touches shade-validation, post-processing)

**Batch C (touches locales + AddTeethModal, must run after Task 2):**
- Task 8 (frontend a11y + i18n)

---

## Post-Implementation Checklist

After all tasks are complete:

1. [ ] Run `tsc --noEmit` — zero errors
2. [ ] Run `pnpm test` — all tests pass (excluding 5 pre-existing failures)
3. [ ] Run `pnpm lint` — no new warnings
4. [ ] Deploy edge functions: `stripe-webhook`, `generate-dsd`, `recommend-resin`, `analyze-dental-photo`
5. [ ] Apply migration 043 to production Supabase
6. [ ] Deploy frontend via Vercel
7. [ ] Verify in production: create a gengivoplastia case → should write to DB successfully
8. [ ] Verify in production: Stripe test webhook → should return 500 on simulated DB error
9. [ ] Revoke E2E refresh token (manual action)

---

## Deploy Order

1. **Migration 043** first — unblocks gengivoplastia/recobrimento DB writes
2. **Edge functions** second — `stripe-webhook`, `generate-dsd`, `recommend-resin`, `analyze-dental-photo` (sequential deploy)
3. **Frontend** last — Vercel auto-deploys on push, or `vercel --prod`
