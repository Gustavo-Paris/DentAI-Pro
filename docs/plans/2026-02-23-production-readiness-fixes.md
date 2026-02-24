---
title: Production Readiness Fixes — Implementation Plan
created: 2026-02-23
updated: 2026-02-23
status: approved
tags:
  - type/plan
  - status/approved
---

# Production Readiness Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 27 P0 blockers and 58 P1 important findings from the production readiness audit to make ToSmile.ai launch-ready.

**Architecture:** Fixes are grouped into 15 tasks by domain (database, edge functions, frontend, infra). Each task targets a single concern area to minimize merge conflicts during parallel execution. Database migrations are consolidated into a single new migration file.

**Tech Stack:** PostgreSQL (Supabase), Deno edge functions, React 18 + TypeScript, Vite, Vercel, GitHub Actions

**Audit report:** [[2026-02-23-production-readiness-audit.md]]

---

## Phase 1: Critical Security & Data Integrity (P0)

### Task 1: Database Migration — RLS, FKs, Constraints

**Fixes:** SEC-P0-1, SEC-P0-2, DATA-P0-1–4, DATA-P0-5, DATA-P0-6, DATA-P1-1, DATA-P1-5, DATA-P1-6, DATA-P1-8, DATA-P1-9, DATA-P2-7, SEC-P1-1

**Files:**
- Create: `supabase/migrations/037_production_readiness.sql`

**Step 1: Write the migration**

```sql
-- =============================================
-- Migration 037: Production Readiness Fixes
-- Covers: RLS policy hardening, missing FKs,
-- CHECK constraints, cascade deletes, updated_at
-- =============================================

-- -----------------------------------------------
-- 1. FIX RLS: subscriptions — restrict to service_role
-- (SEC-P0-1)
-- -----------------------------------------------
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- -----------------------------------------------
-- 2. FIX RLS: rate_limits — restrict to service_role
-- (SEC-P0-2)
-- -----------------------------------------------
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;
CREATE POLICY "Service role can manage rate limits"
  ON public.rate_limits FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- -----------------------------------------------
-- 3. ADD FK: patients.user_id → auth.users (DATA-P0-1)
-- -----------------------------------------------
ALTER TABLE public.patients
  ADD CONSTRAINT patients_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- -----------------------------------------------
-- 4. ADD FK: evaluation_drafts.user_id → auth.users (DATA-P0-2)
-- -----------------------------------------------
ALTER TABLE public.evaluation_drafts
  ADD CONSTRAINT evaluation_drafts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- -----------------------------------------------
-- 5. ADD FK: session_detected_teeth.user_id → auth.users (DATA-P0-3)
-- -----------------------------------------------
ALTER TABLE public.session_detected_teeth
  ADD CONSTRAINT session_detected_teeth_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- -----------------------------------------------
-- 6. ADD FK: user_inventory.user_id → auth.users (DATA-P0-4)
-- -----------------------------------------------
ALTER TABLE public.user_inventory
  ADD CONSTRAINT user_inventory_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- -----------------------------------------------
-- 7. ADD CASCADE: evaluations_raw.patient_id (DATA-P1-1)
-- Drop the old FK and recreate with SET NULL on delete
-- -----------------------------------------------
ALTER TABLE public.evaluations_raw
  DROP CONSTRAINT IF EXISTS evaluations_patient_id_fkey;
ALTER TABLE public.evaluations_raw
  ADD CONSTRAINT evaluations_raw_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE SET NULL;

-- -----------------------------------------------
-- 8. ADD CASCADE: referral_conversions FKs (DATA-P1-8)
-- -----------------------------------------------
ALTER TABLE public.referral_conversions
  DROP CONSTRAINT IF EXISTS referral_conversions_referrer_id_fkey;
ALTER TABLE public.referral_conversions
  ADD CONSTRAINT referral_conversions_referrer_id_fkey
  FOREIGN KEY (referrer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.referral_conversions
  DROP CONSTRAINT IF EXISTS referral_conversions_referred_id_fkey;
ALTER TABLE public.referral_conversions
  ADD CONSTRAINT referral_conversions_referred_id_fkey
  FOREIGN KEY (referred_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- -----------------------------------------------
-- 9. ADD CASCADE: credit_pack_purchases.user_id (DATA-P1-9)
-- -----------------------------------------------
ALTER TABLE public.credit_pack_purchases
  DROP CONSTRAINT IF EXISTS credit_pack_purchases_user_id_fkey;
ALTER TABLE public.credit_pack_purchases
  ADD CONSTRAINT credit_pack_purchases_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- -----------------------------------------------
-- 10. ADD UNIQUE: referral_conversions.referred_id (DATA-P2-7)
-- Prevents double-referral race condition
-- -----------------------------------------------
ALTER TABLE public.referral_conversions
  ADD CONSTRAINT referral_conversions_referred_id_unique UNIQUE (referred_id);

-- -----------------------------------------------
-- 11. ADD CHECK: evaluations_raw.status (DATA-P1-6)
-- -----------------------------------------------
ALTER TABLE public.evaluations_raw
  ADD CONSTRAINT evaluations_raw_status_check
  CHECK (status IN ('draft', 'analyzing', 'completed', 'error'));

ALTER TABLE public.evaluations_raw
  ADD CONSTRAINT evaluations_raw_treatment_type_check
  CHECK (treatment_type IN ('resina', 'porcelana', 'implante', 'coroa', 'endodontia', 'encaminhamento'));

-- -----------------------------------------------
-- 12. ADD updated_at to evaluations_raw (DATA-P1-5)
-- -----------------------------------------------
ALTER TABLE public.evaluations_raw
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.set_evaluations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_evaluations_raw_updated_at
  BEFORE UPDATE ON public.evaluations_raw
  FOR EACH ROW EXECUTE FUNCTION public.set_evaluations_updated_at();

-- -----------------------------------------------
-- 13. ADD explicit RLS policy: credit_transactions (SEC-P1-1)
-- -----------------------------------------------
CREATE POLICY "Service role can manage credit transactions"
  ON public.credit_transactions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- -----------------------------------------------
-- 14. FIX credit race for free-tier: use advisory lock (DATA-P0-5)
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION public.use_credits(p_user_id UUID, p_operation TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost INTEGER;
  v_subscription subscriptions%ROWTYPE;
  v_plan subscription_plans%ROWTYPE;
  v_available INTEGER;
  v_count BIGINT;
BEGIN
  v_cost := get_credit_cost(p_operation);

  -- Lock the subscription row atomically
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- No subscription or inactive: use advisory lock for free-tier
  IF v_subscription IS NULL OR v_subscription.status NOT IN ('active', 'trialing') THEN
    -- Advisory lock keyed on user_id to prevent concurrent free-tier abuse
    PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

    IF p_operation = 'case_analysis' THEN
      SELECT COUNT(*) INTO v_count
      FROM evaluations
      WHERE user_id = p_user_id
        AND created_at > NOW() - INTERVAL '30 days';
      RETURN v_count < 3;
    ELSIF p_operation = 'dsd_simulation' THEN
      SELECT COUNT(*) INTO v_count
      FROM credit_usage
      WHERE user_id = p_user_id
        AND operation = 'dsd_simulation'
        AND created_at > NOW() - INTERVAL '30 days';
      RETURN v_count < 2;
    END IF;
    RETURN false;
  END IF;

  -- Get plan details
  SELECT * INTO v_plan
  FROM subscription_plans
  WHERE id = v_subscription.plan_id;

  -- Calculate available credits
  v_available := v_plan.credits_per_month
               + v_subscription.credits_rollover
               + v_subscription.credits_bonus
               - v_subscription.credits_used_this_month;

  IF v_available < v_cost THEN
    RETURN false;
  END IF;

  -- Consume credits
  UPDATE subscriptions
  SET
    credits_used_this_month = credits_used_this_month + v_cost,
    cases_used_this_month = CASE
      WHEN p_operation = 'case_analysis' THEN cases_used_this_month + 1
      ELSE cases_used_this_month
    END,
    dsd_used_this_month = CASE
      WHEN p_operation = 'dsd_simulation' THEN dsd_used_this_month + 1
      ELSE dsd_used_this_month
    END,
    updated_at = NOW()
  WHERE id = v_subscription.id;

  INSERT INTO credit_usage (user_id, subscription_id, operation, credits_used)
  VALUES (p_user_id, v_subscription.id, p_operation, v_cost);

  RETURN true;
END;
$$;
```

**Step 2: Test migration locally**

Run: `npx supabase db reset` (if local DB available) or review SQL for syntax errors.

**Step 3: Commit**

```bash
git add supabase/migrations/037_production_readiness.sql
git commit -m "fix: database security and integrity (P0 blockers)

- Harden RLS: subscriptions + rate_limits restrict to service_role
- Add FK cascades: patients, drafts, detected_teeth, inventory → auth.users
- Add FK cascade: evaluations_raw.patient_id ON DELETE SET NULL
- Add FK cascades: referral_conversions, credit_pack_purchases
- Add UNIQUE on referral_conversions.referred_id
- Add CHECK constraints on evaluations_raw.status and treatment_type
- Add updated_at column + trigger on evaluations_raw
- Add explicit RLS policy on credit_transactions
- Fix free-tier credit race with pg_advisory_xact_lock"
```

---

### Task 2: Stripe Webhook Hardening

**Fixes:** ERR-P0-3, ERR-P0-5, DATA-P0-6, DATA-P1-10

**Files:**
- Modify: `supabase/functions/stripe-webhook/index.ts`

**Step 1: Fix `handleCreditPackPurchase` — guard metadata (ERR-P0-3)**

In `handleCreditPackPurchase` (around line 322), replace the non-null assertions:

```typescript
// BEFORE:
const userId = session.metadata!.supabase_user_id;
const packId = session.metadata!.pack_id;
const credits = parseInt(session.metadata!.credits, 10);

// AFTER:
const userId = session.metadata?.supabase_user_id;
const packId = session.metadata?.pack_id;
const creditsStr = session.metadata?.credits;

if (!userId || !packId || !creditsStr) {
  logger.error(`Missing metadata on credit pack checkout session ${session.id}. metadata=${JSON.stringify(session.metadata)}`);
  return;
}

const credits = parseInt(creditsStr, 10);
if (isNaN(credits) || credits <= 0) {
  logger.error(`Invalid credits value in metadata: ${creditsStr}`);
  return;
}
```

**Step 2: Fix `handleInvoiceFailed` — use upsert + ensure status update (ERR-P0-5, DATA-P0-6)**

Replace the `handleInvoiceFailed` function (around line 284):

```typescript
async function handleInvoiceFailed(supabase: SupabaseClient, invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id, id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!sub) {
    logger.error("Could not find subscription for failed invoice");
    return;
  }

  // Record failed payment (upsert for idempotency on webhook retry)
  const { error: historyError } = await supabase
    .from("payment_history")
    .upsert({
      user_id: sub.user_id,
      subscription_id: sub.id,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: "failed",
      description: `Pagamento falhou - ${invoice.lines.data[0]?.description || 'Assinatura'}`,
    }, {
      onConflict: "stripe_invoice_id",
    });

  if (historyError) {
    logger.error(`Failed to record payment failure: ${historyError.message}`);
    // Continue to update subscription status even if history insert fails
  }

  // Always update subscription status
  const { error: statusError } = await supabase
    .from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_customer_id", customerId);

  if (statusError) {
    logger.error(`Failed to update subscription status to past_due: ${statusError.message}`);
  }

  logger.warn(`Payment failed for invoice ${invoice.id}`);
}
```

**Step 3: Fix `handleCheckoutCompleted` — preserve credit counters on plan change (DATA-P1-10)**

In `handleCheckoutCompleted` (around line 156), change the upsert to check-then-update/insert:

```typescript
// Check if subscription row already exists
const { data: existingSub } = await supabase
  .from("subscriptions")
  .select("id")
  .eq("user_id", userId)
  .maybeSingle();

const subscriptionData = {
  stripe_customer_id: customerId,
  stripe_subscription_id: subscriptionId,
  plan_id: planId,
  status: subscription.status,
  current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
  current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  cancel_at_period_end: subscription.cancel_at_period_end,
  trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
  trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
  updated_at: new Date().toISOString(),
};

if (existingSub) {
  // Update: preserve credits_used_this_month, credits_rollover, credits_bonus
  const { error } = await supabase
    .from("subscriptions")
    .update(subscriptionData)
    .eq("user_id", userId);

  if (error) throw error;
} else {
  // Insert: new subscription
  const { error } = await supabase
    .from("subscriptions")
    .insert({ ...subscriptionData, user_id: userId });

  if (error) throw error;
}
```

**Step 4: Deploy and commit**

```bash
git add supabase/functions/stripe-webhook/index.ts
git commit -m "fix: harden stripe webhook handlers (P0)

- Guard session.metadata with null check instead of non-null assertion
- Make handleInvoiceFailed idempotent with upsert
- Ensure subscription status update runs even if payment history insert fails
- Preserve credit counters (credits_used, rollover, bonus) on plan change"
```

---

### Task 3: Edge Function req.json() Safety

**Fixes:** ERR-P0-1, ERR-P0-2

**Files:**
- Modify: `supabase/functions/recommend-cementation/index.ts`
- Modify: `supabase/functions/create-checkout-session/index.ts`

**Step 1: Add try/catch around req.json() in recommend-cementation (line ~252)**

```typescript
// BEFORE:
const body = await req.json();

// AFTER:
let body;
try {
  body = await req.json();
} catch {
  return new Response(
    JSON.stringify({ error: "Invalid request body" }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

**Step 2: Same fix in create-checkout-session (line ~44)**

```typescript
// BEFORE:
const body: RequestBody = await req.json();

// AFTER:
let body: RequestBody;
try {
  body = await req.json();
} catch {
  return new Response(
    JSON.stringify({ error: "Invalid request body" }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

**Step 3: Commit**

```bash
git add supabase/functions/recommend-cementation/index.ts supabase/functions/create-checkout-session/index.ts
git commit -m "fix: add try/catch for req.json() in payment and cementation endpoints"
```

---

### Task 4: Fix Referral RPC

**Fixes:** DATA-P0-7

**Files:**
- Modify: `apps/web/src/data/referral.ts`

**Step 1: Replace `increment_credits_bonus` with `add_bonus_credits`**

In `referral.ts` (around lines 135-153), change both RPC calls:

```typescript
// BEFORE:
const { error: referrerError } = await supabase.rpc('increment_credits_bonus', {
  target_user_id: referralCode.user_id,
  amount: BONUS_CREDITS,
});

// AFTER:
const { error: referrerError } = await supabase.rpc('add_bonus_credits', {
  p_user_id: referralCode.user_id,
  p_credits: BONUS_CREDITS,
});
```

Apply same change to the second call (referred user):

```typescript
// BEFORE:
const { error: referredError } = await supabase.rpc('increment_credits_bonus', {
  target_user_id: newUserId,
  amount: BONUS_CREDITS,
});

// AFTER:
const { error: referredError } = await supabase.rpc('add_bonus_credits', {
  p_user_id: newUserId,
  p_credits: BONUS_CREDITS,
});
```

**Step 2: Commit**

```bash
git add apps/web/src/data/referral.ts
git commit -m "fix: referral program — use correct RPC name add_bonus_credits"
```

---

## Phase 2: Clinical Safety (P0 + P1)

### Task 5: AI Schema Validation & Post-Processing Safety Nets

**Fixes:** CLIN-P0-1, CLIN-P0-3, CLIN-P1-1, CLIN-P1-4, CLIN-P1-7, CLIN-P1-8

**Files:**
- Modify: `supabase/functions/_shared/aiSchemas.ts`
- Modify: `supabase/functions/generate-dsd/post-processing.ts`
- Modify: `supabase/functions/generate-dsd/index.ts`
- Modify: `supabase/functions/recommend-resin/index.ts`
- Modify: `supabase/functions/recommend-cementation/index.ts`

**Step 1: Add FDI tooth validation in DSD post-processing (CLIN-P0-1)**

In `generate-dsd/post-processing.ts`, add at the top of `applyPostProcessingSafetyNets` (before the lower teeth filter):

```typescript
// Safety net #1: Filter out invalid FDI tooth numbers
const FDI_TOOTH_REGEX = /^[1-4][1-8]$/;
const invalidTeeth = analysis.suggestions.filter(s => !FDI_TOOTH_REGEX.test(s.tooth));
if (invalidTeeth.length > 0) {
  logger.warn(`DSD post-processing: removing ${invalidTeeth.length} suggestions with invalid FDI numbers: ${invalidTeeth.map(s => s.tooth).join(', ')}`);
  analysis.suggestions = analysis.suggestions.filter(s => FDI_TOOTH_REGEX.test(s.tooth));
}
```

**Step 2: Handle null protocol in recommend-resin (CLIN-P0-3)**

In `recommend-resin/index.ts` (around line 404), after the warning log:

```typescript
if (!recommendation.protocol) {
  logger.warn(`[${reqId}] Claude omitted protocol object — marking as incomplete`);

  // Return response with explicit incomplete flag
  return new Response(
    JSON.stringify({
      ...recommendation,
      protocol_incomplete: true,
      protocol_incomplete_reason: "O modelo de IA não gerou o protocolo de estratificação. Tente novamente.",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

**Step 3: Add VITA shade validation in aiSchemas.ts (CLIN-P1-1)**

Add a VITA shade validation constant and use it in `normalizeAnalysisEnums`:

```typescript
// Add after existing ENUM_MAPPINGS
const VALID_VITA_SHADES = new Set([
  'A1', 'A2', 'A3', 'A3.5', 'A4',
  'B1', 'B2', 'B3', 'B4',
  'C1', 'C2', 'C3', 'C4',
  'D2', 'D3', 'D4',
  'BL1', 'BL2', 'BL3', 'BL4',
  'OM1', 'OM2', 'OM3',
]);

// In normalizeAnalysisEnums, add after the existing enum normalization loop:
if ('vita_shade' in analysis && typeof analysis.vita_shade === 'string') {
  const shade = analysis.vita_shade.toUpperCase().trim();
  if (!VALID_VITA_SHADES.has(shade)) {
    logger.warn(`Invalid VITA shade "${analysis.vita_shade}" — nulling out`);
    (analysis as Record<string, unknown>).vita_shade = null;
  } else {
    (analysis as Record<string, unknown>).vita_shade = shade;
  }
}
```

**Step 4: Constrain DSD confidence to enum (CLIN-P1-4)**

In `aiSchemas.ts`, change the `confidence` field in the DSD analysis schema:

```typescript
// BEFORE:
confidence: z.string(),

// AFTER:
confidence: z.string().transform(val => {
  const lower = val.toLowerCase();
  const mapping: Record<string, string> = {
    high: 'alta', alta: 'alta',
    medium: 'media', media: 'media', média: 'media', moderate: 'media', moderada: 'media',
    low: 'baixa', baixa: 'baixa',
  };
  return mapping[lower] || 'media'; // default to media if unrecognized
}),
```

**Step 5: Fix DSD image cache hash — use full image data (CLIN-P1-7)**

In `generate-dsd/index.ts` (around line 128):

```typescript
// BEFORE:
const hashSource = `${PROMPT_VERSION}:${rawBase64ForHash.substring(0, 50000)}`;

// AFTER:
const hashSource = `${PROMPT_VERSION}:${rawBase64ForHash}`;
```

**Step 6: Sanitize cementation dsdContext (CLIN-P1-8)**

In `recommend-cementation/index.ts` (around line 208), add sanitization:

```typescript
// BEFORE:
dsdContext: req.dsdContext as DSDContext | undefined,

// AFTER:
dsdContext: req.dsdContext ? {
  currentIssue: sanitizeForPrompt(String(req.dsdContext.currentIssue || '')),
  proposedChange: sanitizeForPrompt(String(req.dsdContext.proposedChange || '')),
  observations: Array.isArray(req.dsdContext.observations)
    ? req.dsdContext.observations.map((o: unknown) => sanitizeForPrompt(String(o)))
    : [],
} as DSDContext : undefined,
```

**Step 7: Commit**

```bash
git add supabase/functions/_shared/aiSchemas.ts supabase/functions/generate-dsd/post-processing.ts supabase/functions/generate-dsd/index.ts supabase/functions/recommend-resin/index.ts supabase/functions/recommend-cementation/index.ts
git commit -m "fix: clinical safety — FDI validation, null protocol, shade validation, cache hash

- Filter invalid FDI tooth numbers in DSD post-processing
- Mark resin recommendations without protocol as incomplete
- Validate VITA shades against known catalog
- Constrain DSD confidence to alta/media/baixa enum
- Use full image data for DSD cache hash (prevent cross-patient hits)
- Sanitize cementation dsdContext for prompt injection"
```

---

### Task 6: HF Acid Safety Net for Cementation

**Fixes:** CLIN-P0-2

**Files:**
- Modify: `supabase/functions/recommend-cementation/index.ts`

**Step 1: Add HF concentration validator after AI response parsing**

After the cementation protocol is parsed, add a post-processing step:

```typescript
function validateHFConcentration(
  protocol: CementationProtocol,
  ceramicType: string,
  logger: Logger,
): CementationProtocol {
  const isLithiumDisilicate = /e\.?max|dissilicato|lithium/i.test(ceramicType);
  if (!isLithiumDisilicate) return protocol;

  // Check ceramic_treatment steps for dangerous HF concentrations
  protocol.ceramic_treatment = protocol.ceramic_treatment.map(step => {
    if (/10\s*%.*(?:HF|fluorídr)/i.test(step.step) || /10\s*%.*(?:HF|fluorídr)/i.test(step.material)) {
      logger.warn(`HF safety net: correcting 10% HF to 5% for lithium disilicate (${ceramicType})`);
      return {
        ...step,
        step: step.step.replace(/10\s*%/g, '5%'),
        material: step.material.replace(/10\s*%/g, '5%'),
      };
    }
    return step;
  });

  // Add warning if HF was corrected
  if (!protocol.warnings.some(w => /HF/i.test(w))) {
    protocol.warnings.push('Concentração de HF validada: 5% por 20s para dissilicato de lítio. NUNCA usar 10%.');
  }

  return protocol;
}
```

Insert the call after protocol parsing, before returning the response.

**Step 2: Commit**

```bash
git add supabase/functions/recommend-cementation/index.ts
git commit -m "fix: HF acid safety net — auto-correct 10% to 5% for e.max ceramics"
```

---

### Task 7: DSD Validation & Safety Disclaimer

**Fixes:** CLIN-P1-2, CLIN-P1-3

**Files:**
- Modify: `supabase/functions/generate-dsd/validation.ts`
- Modify: `supabase/functions/analyze-dental-photo/index.ts`

**Step 1: Validate existingAnalysis with Zod schema (CLIN-P1-2)**

In `generate-dsd/validation.ts` (around line 80):

```typescript
// BEFORE:
existingAnalysis: req.existingAnalysis as DSDAnalysis | undefined,

// AFTER:
existingAnalysis: req.existingAnalysis
  ? DSDAnalysisSchema.safeParse(req.existingAnalysis).success
    ? (req.existingAnalysis as DSDAnalysis)
    : undefined  // reject invalid client-provided analysis
  : undefined,
```

Import `DSDAnalysisSchema` from `_shared/aiSchemas.ts` if not already imported.

**Step 2: Add mandatory disclaimer observation (CLIN-P1-3)**

In `analyze-dental-photo/index.ts`, before the final response (around line 242):

```typescript
// Ensure mandatory safety disclaimer is always present
const DISCLAIMER = 'Esta análise é assistida por IA e tem caráter de apoio à decisão clínica. Todos os achados devem ser confirmados por exame clínico e radiográfico complementar.';
if (!result.observations?.some((o: string) => o.includes('apoio à decisão'))) {
  result.observations = result.observations || [];
  result.observations.unshift(DISCLAIMER);
}
```

**Step 3: Commit**

```bash
git add supabase/functions/generate-dsd/validation.ts supabase/functions/analyze-dental-photo/index.ts
git commit -m "fix: validate existingAnalysis with Zod schema + mandatory AI disclaimer"
```

---

### Task 8: Protocol Sync & Contralateral Matching

**Fixes:** CLIN-P1-5, CLIN-P1-6

**Files:**
- Modify: `supabase/functions/recommend-resin/index.ts`
- Modify: `apps/web/src/data/wizard.ts`

**Step 1: Add treatment type check to contralateral matching (CLIN-P1-5)**

In `recommend-resin/index.ts` contralateral query (around line 148), add a filter:

```typescript
// Add after .not('stratification_protocol', 'is', null):
.eq('treatment_type', data.treatmentType || 'resina')
.eq('cavity_class', data.cavityClass)
```

**Step 2: Add cavity_class check to syncGroupProtocols (CLIN-P1-6)**

In `wizard.ts` `syncGroupProtocols`, when grouping evaluations (around line 282), change the grouping key:

```typescript
// BEFORE: Group by treatment_type only
const tt = ev.treatment_type as string;

// AFTER: Group by treatment_type + cavity_class for more granular sync
const tt = `${ev.treatment_type}::${(ev as Record<string, unknown>).cavity_class || 'unknown'}`;
```

You'll need to add `cavity_class` to the select query:

```typescript
.select(
  'id, treatment_type, cavity_class, stratification_protocol, cementation_protocol, ' +
  // ... rest of fields
)
```

**Step 3: Commit**

```bash
git add supabase/functions/recommend-resin/index.ts apps/web/src/data/wizard.ts
git commit -m "fix: contralateral + sync group now check treatment type and cavity class"
```

---

## Phase 3: Build, Deploy & Infra (P0 + P1)

### Task 9: CI Pipeline + CSP + SEO Fixes

**Fixes:** INFRA-P0-1, INFRA-P0-2, INFRA-P0-3, INFRA-P0-5, INFRA-P1-2, INFRA-P1-3

**Files:**
- Modify: `.github/workflows/test.yml`
- Modify: `apps/web/index.html`
- Modify: `apps/web/public/sitemap.xml`
- Modify: `apps/web/public/robots.txt`
- Modify: `apps/web/public/manifest.json`
- Create: `.nvmrc`

**Step 1: Fix CI — add GITHUB_TOKEN (INFRA-P0-1)**

In `.github/workflows/test.yml`, add to EVERY job's env section (lint, typecheck, test, build, e2e):

```yaml
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Step 2: Fix CSP — remove meta tag, consolidate into vercel.json (INFRA-P0-2)**

In `apps/web/index.html`, **delete** the entire CSP meta tag (line 6). Then update `vercel.json` CSP header to merge all required domains:

```json
{ "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://us-assets.i.posthog.com https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.supabase.co https://*.googleusercontent.com https://vercel.live; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.sentry.io https://us.i.posthog.com wss://ws-us3.pusher.com https://vercel.live; frame-src https://js.stripe.com https://vercel.live; object-src 'none'; base-uri 'self'; form-action 'self'" }
```

**Step 3: Fix sitemap domain (INFRA-P0-3)**

Replace all `https://auria.dental/` with `https://tosmile.ai/` in `sitemap.xml`.

**Step 4: Fix robots.txt (INFRA-P0-5)**

Replace `robots.txt` content:

```
User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /evaluations
Disallow: /evaluation/
Disallow: /profile
Disallow: /new-case
Disallow: /patients
Disallow: /patient/
Disallow: /inventory
Disallow: /result/
Disallow: /pricing
Disallow: /shared/
Disallow: /settings

Sitemap: https://tosmile.ai/sitemap.xml
```

**Step 5: Fix theme_color mismatch (INFRA-P1-2)**

In `apps/web/index.html`, change `theme-color` meta tag from `#06b6d4` to `#2A9D8F`.

**Step 6: Add .nvmrc (INFRA-P1-3)**

Create `.nvmrc` with content: `20`

**Step 7: Commit**

```bash
git add .github/workflows/test.yml apps/web/index.html vercel.json apps/web/public/sitemap.xml apps/web/public/robots.txt apps/web/public/manifest.json .nvmrc
git commit -m "fix: CI pipeline, CSP consolidation, SEO, theme color, node version

- Add GITHUB_TOKEN to all CI jobs for @parisgroup-ai/pageshell
- Consolidate CSP into vercel.json only (remove conflicting meta tag)
- Fix sitemap domain: auria.dental → tosmile.ai
- Add Disallow rules to robots.txt for protected routes
- Unify theme_color to brand #2A9D8F
- Pin Node version via .nvmrc"
```

---

### Task 10: Env Validation & Infra Config

**Fixes:** INFRA-P1-6, INFRA-P1-7, INFRA-P1-9

**Files:**
- Modify: `apps/web/src/lib/env.ts`
- Modify: `apps/web/.env.example`
- Modify: `vercel.json`

**Step 1: Fix env.ts — validate Stripe key, add PostHog (INFRA-P1-6, INFRA-P1-7)**

```typescript
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL deve ser uma URL válida'),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, 'VITE_SUPABASE_PUBLISHABLE_KEY é obrigatória'),
  VITE_SENTRY_DSN: z.string().default(''),
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().min(1, 'VITE_STRIPE_PUBLISHABLE_KEY é obrigatória'),
  VITE_POSTHOG_KEY: z.string().default(''),
  VITE_POSTHOG_HOST: z.string().url().default('https://us.i.posthog.com'),
});
```

Add `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST` to the `parseEnv()` extraction. Remove `VITE_SUPABASE_PROJECT_ID` from `.env.example` if unused.

**Step 2: Add caching headers for static files (INFRA-P1-9)**

In `vercel.json`, add after the existing `/assets/(.*)` header block:

```json
{
  "source": "/(manifest\\.json|favicon\\.svg|icon-.*\\.png|apple-touch-icon\\.png)",
  "headers": [
    { "key": "Cache-Control", "value": "public, max-age=86400" }
  ]
}
```

**Step 3: Commit**

```bash
git add apps/web/src/lib/env.ts apps/web/.env.example vercel.json
git commit -m "fix: validate Stripe key as required, add PostHog to env schema, static file caching"
```

---

## Phase 4: UX Fixes (P0 + P1)

### Task 11: Wizard Flow Fixes

**Fixes:** UX-P0-2, UX-P0-3, UX-P0-5, UX-P1-12

**Files:**
- Modify: `apps/web/src/pages/NewCase.tsx`
- Modify: `apps/web/src/hooks/domain/useWizardFlow.ts`

**Step 1: Fix beforeunload — only fire after meaningful input (UX-P0-5)**

In `useWizardFlow.ts` (around line 356):

```typescript
// BEFORE:
if (nav.step < 2 || nav.step > 5) return;

// AFTER:
const hasInput = nav.step >= 2 && imageBase64 !== null;
if (!hasInput) return;
```

**Step 2: Fix result step — add fallback state (UX-P0-3)**

In `NewCase.tsx` (around line 243), replace `null` with a fallback:

```typescript
// BEFORE:
) : null}

// AFTER:
) : (
  <div className="flex flex-col items-center justify-center py-16 space-y-4">
    <p className="text-muted-foreground">{t('wizard.preparingCase', { defaultValue: 'Preparando caso...' })}</p>
    <Button variant="outline" onClick={wizard.handleBack}>
      <ArrowLeft className="w-4 h-4 mr-2" />
      {t('common.back')}
    </Button>
  </div>
)}
```

**Step 3: Disable Back button during submission (UX-P1-12)**

In `NewCase.tsx` footer (around line 341):

```typescript
// BEFORE:
<Button variant="outline" onClick={wizard.handleBack} className="w-full sm:w-auto btn-press">

// AFTER:
<Button variant="outline" onClick={wizard.handleBack} disabled={wizard.isSubmitting} className="w-full sm:w-auto btn-press">
```

**Step 4: Add credits check on submit (UX-P0-2)**

In `useWizardFlow.ts` or wherever `handleSubmit` is defined, add a pre-check:

```typescript
// At the start of handleSubmit:
if (!canUseCredits) {
  toast.error(t('wizard.noCredits', { defaultValue: 'Créditos insuficientes. Acesse o plano de assinatura.' }));
  navigate('/pricing');
  return;
}
```

**Step 5: Commit**

```bash
git add apps/web/src/pages/NewCase.tsx apps/web/src/hooks/domain/useWizardFlow.ts
git commit -m "fix: wizard — credits check, result fallback, beforeunload, back button"
```

---

### Task 12: Page Empty/Error States + Delete Patient

**Fixes:** UX-P0-1, UX-P0-4, UX-P1-1, UX-P1-14, UX-P1-15, UX-P1-16

**Files:**
- Modify: `apps/web/src/pages/EvaluationDetails.tsx`
- Modify: `apps/web/src/pages/PatientProfile.tsx`
- Modify: `apps/web/src/pages/Pricing.tsx`
- Modify: `apps/web/src/pages/GroupResult.tsx`
- Modify: `apps/web/src/data/patients.ts` (or wherever patient deletion would go)

**Step 1: EvaluationDetails empty state guard (UX-P0-4)**

After `firstEval` derivation (line 46):

```typescript
if (!detail.isLoading && detail.evaluations.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <p className="text-muted-foreground">{t('evaluation.noEvaluationsFound')}</p>
      <Button variant="outline" onClick={() => navigate('/evaluations')}>
        {t('common.back')}
      </Button>
    </div>
  );
}
```

**Step 2: Add confirmation dialog for "Mark All Completed" (UX-P1-1, UX-P1-16)**

In `EvaluationDetails.tsx` and `GroupResult.tsx`, wrap the `handleMarkAllAsCompleted` action in a confirmation state:

```typescript
const [showMarkAllConfirm, setShowMarkAllConfirm] = useState(false);

// In the action:
onClick: () => setShowMarkAllConfirm(true),

// Add AlertDialog:
<AlertDialog open={showMarkAllConfirm} onOpenChange={setShowMarkAllConfirm}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{t('evaluation.markAllCompletedTitle')}</AlertDialogTitle>
      <AlertDialogDescription>{t('evaluation.markAllCompletedDescription')}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
      <AlertDialogAction onClick={() => { detail.handleMarkAllAsCompleted(); setShowMarkAllConfirm(false); }}>
        {t('evaluation.markAllCompleted')}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Step 3: Add delete patient action to PatientProfile (UX-P0-1)**

Add a "Delete" action to `headerActions` and a confirmation dialog. Wire it to a `deletePatient` function in the data layer that deletes the patient record (evaluations will SET NULL via the new FK cascade).

**Step 4: Add error state to Pricing page (UX-P1-15)**

In `Pricing.tsx`, add guard:

```typescript
if (!isLoading && plans.length === 0) {
  // Show error state
}
```

**Step 5: Commit**

```bash
git add apps/web/src/pages/EvaluationDetails.tsx apps/web/src/pages/PatientProfile.tsx apps/web/src/pages/Pricing.tsx apps/web/src/pages/GroupResult.tsx apps/web/src/data/patients.ts
git commit -m "fix: empty states, delete patient, confirmation dialogs, pricing error state"
```

---

## Phase 5: Error Handling & Frontend Resilience (P1)

### Task 13: Dashboard Metrics + DSD Parsing + Profile Sync

**Fixes:** ERR-P1-2, ERR-P1-3, ERR-P1-5

**Files:**
- Modify: `apps/web/src/data/evaluations.ts`
- Modify: `supabase/functions/generate-dsd/index.ts`
- Modify: `apps/web/src/hooks/domain/useProfile.ts`

**Step 1: Switch getDashboardMetrics to Promise.allSettled (ERR-P1-2)**

```typescript
// BEFORE:
const [allEvalsResult, weeklyEvalsResult, pendingTeethResult] = await Promise.all([...]);

// AFTER:
const [allEvalsSettled, weeklyEvalsSettled, pendingTeethSettled] = await Promise.allSettled([...]);

const allEvalsResult = allEvalsSettled.status === 'fulfilled' ? allEvalsSettled.value : { data: [] };
const weeklyEvalsResult = weeklyEvalsSettled.status === 'fulfilled' ? weeklyEvalsSettled.value : { data: [] };
const pendingTeethResult = pendingTeethSettled.status === 'fulfilled' ? pendingTeethSettled.value : { count: 0 };
```

**Step 2: Fix generate-dsd double body parsing (ERR-P1-3)**

Parse body once at the top:

```typescript
// BEFORE (line 25-31):
const clonedBody = await req.clone().json();
// ... extract reqId ...
// ... later (line 64):
const body = await req.json();

// AFTER:
const body = await req.json();
if (typeof body.reqId === 'string' && body.reqId.length > 0 && body.reqId.length <= 64) {
  clientReqId = body.reqId;
}
// ... use body directly throughout ...
```

**Step 3: Surface syncWithRetry failure (ERR-P1-5)**

In `useProfile.ts`, after the retry loop exhausts:

```typescript
// After the for loop:
logger.warn('Stripe subscription sync failed after all retries');
// Optionally show a toast or set error state
refreshSubscription(); // existing call
```

**Step 4: Commit**

```bash
git add apps/web/src/data/evaluations.ts supabase/functions/generate-dsd/index.ts apps/web/src/hooks/domain/useProfile.ts
git commit -m "fix: dashboard resilience, DSD body parsing, sync retry logging"
```

---

### Task 14: Delete Account & Data Export

**Fixes:** SEC-P1-5, SEC-P1-6, DATA-P1-2

**Files:**
- Modify: `supabase/functions/delete-account/index.ts`
- Modify: `supabase/functions/data-export/index.ts`

**Step 1: Fix delete-account — profile column + missing tables (SEC-P1-6, DATA-P1-2)**

In `delete-account/index.ts`:

1. Fix profile deletion (around line 223): `.eq("id", userId)` → `.eq("user_id", userId)`

2. Add missing table deletions BEFORE the profile deletion:

```typescript
// Delete credit_transactions
await supabaseService.from("credit_transactions").delete().eq("user_id", userId);

// Delete credit_pack_purchases
await supabaseService.from("credit_pack_purchases").delete().eq("user_id", userId);

// Delete referral_conversions (as referrer or referred)
await supabaseService.from("referral_conversions").delete().or(`referrer_id.eq.${userId},referred_id.eq.${userId}`);

// Delete referral_codes
await supabaseService.from("referral_codes").delete().eq("user_id", userId);

// Delete rate_limits
await supabaseService.from("rate_limits").delete().eq("user_id", userId);

// Delete from dsd-simulations storage bucket
const { data: dsdFiles } = await supabaseService.storage.from("dsd-simulations").list(userId);
if (dsdFiles?.length) {
  await supabaseService.storage.from("dsd-simulations").remove(dsdFiles.map(f => `${userId}/${f.name}`));
}
```

**Step 2: Fix data-export column names (SEC-P1-5)**

In `data-export/index.ts` (around line 101), fix the subscription query:

```typescript
// BEFORE:
.select("user_id, status, plan_id, credits_remaining, credits_per_month, ...")

// AFTER:
.select("user_id, status, plan_id, credits_used_this_month, credits_rollover, credits_bonus, current_period_start, current_period_end, created_at, updated_at")
```

**Step 3: Commit**

```bash
git add supabase/functions/delete-account/index.ts supabase/functions/data-export/index.ts
git commit -m "fix: LGPD — complete account deletion + fix data export column names"
```

---

## Phase 6: Remaining P1 UX + Infra

### Task 15: UX Polish Bundle

**Fixes:** UX-P1-7, UX-P1-9, UX-P1-10, UX-P1-11

**Files:**
- Modify: `apps/web/src/components/wizard/PhotoUploadStep.tsx`
- Modify: `apps/web/src/pages/EvaluationDetails.tsx`
- Modify: `apps/web/src/pages/Inventory.tsx`
- Modify: `apps/web/src/pages/SharedEvaluation.tsx`

**Step 1: Add persistent error state for photo upload (UX-P1-7)**

In `PhotoUploadStep.tsx`, add an error state that persists below the upload zone.

**Step 2: Add error toast for share failure (UX-P1-9)**

Ensure `handleShareCase` shows a toast on error.

**Step 3: Increase inventory remove button touch target (UX-P1-10)**

Change the button class from `p-1.5` to `p-2.5 min-w-[44px] min-h-[44px]`.

**Step 4: Fix SharedEvaluation expired vs not found (UX-P1-11)**

Distinguish between "expired" and "not found" in the hook response.

**Step 5: Commit**

```bash
git add apps/web/src/components/wizard/PhotoUploadStep.tsx apps/web/src/pages/EvaluationDetails.tsx apps/web/src/pages/Inventory.tsx apps/web/src/pages/SharedEvaluation.tsx
git commit -m "fix: UX polish — upload error state, share feedback, touch targets, expired vs not found"
```

---

## Deployment Sequence

After all tasks are completed:

1. **Deploy migration 037** to Supabase: `npx supabase db push`
2. **Deploy edge functions** sequentially:
   ```bash
   npx supabase functions deploy stripe-webhook --no-verify-jwt --use-docker
   npx supabase functions deploy recommend-cementation --no-verify-jwt --use-docker
   npx supabase functions deploy create-checkout-session --no-verify-jwt --use-docker
   npx supabase functions deploy recommend-resin --no-verify-jwt --use-docker
   npx supabase functions deploy generate-dsd --no-verify-jwt --use-docker
   npx supabase functions deploy analyze-dental-photo --no-verify-jwt --use-docker
   npx supabase functions deploy delete-account --no-verify-jwt --use-docker
   npx supabase functions deploy data-export --no-verify-jwt --use-docker
   ```
3. **Push to main** → Vercel auto-deploys frontend
4. **Verify CI** passes with GITHUB_TOKEN

---

## Tracking Matrix

| Task | Findings Covered | Priority | Status |
|------|-----------------|----------|--------|
| 1 | SEC-P0-1,2 + DATA-P0-1–5 + DATA-P1-1,5,6,8,9 + DATA-P2-7 + SEC-P1-1 | P0 | |
| 2 | ERR-P0-3,5 + DATA-P0-6 + DATA-P1-10 | P0 | |
| 3 | ERR-P0-1,2 | P0 | |
| 4 | DATA-P0-7 | P0 | |
| 5 | CLIN-P0-1,3 + CLIN-P1-1,4,7,8 | P0+P1 | |
| 6 | CLIN-P0-2 | P0 | |
| 7 | CLIN-P1-2,3 | P1 | |
| 8 | CLIN-P1-5,6 | P1 | |
| 9 | INFRA-P0-1,2,3,5 + INFRA-P1-2,3 | P0 | |
| 10 | INFRA-P1-6,7,9 | P1 | |
| 11 | UX-P0-2,3,5 + UX-P1-12 | P0 | |
| 12 | UX-P0-1,4 + UX-P1-1,14,15,16 | P0+P1 | |
| 13 | ERR-P1-2,3,5 | P1 | |
| 14 | SEC-P1-5,6 + DATA-P1-2 | P1 | |
| 15 | UX-P1-7,9,10,11 | P1 | |

### P1 Items Deferred to Post-Launch

These P1 items are lower priority and can be addressed after soft launch:

- ERR-P1-1: Circuit breaker per-isolate (acceptable for soft launch scale)
- ERR-P1-4: send-email error context
- ERR-P1-6: Error response format standardization (large scope)
- ERR-P1-7: beforeunload mobile reliability (mitigated by draft saves)
- ERR-P1-8: React Query retry config
- ERR-P0-4: handleSubmitTeeth partial failure recovery UI (complex, current behavior is acceptable)
- SEC-P1-2: Shared links migration ordering
- SEC-P1-4: CORS localhost default
- SEC-P1-7: Gemini API key in URL
- UX-P1-2: Patient dialog validation feedback
- UX-P1-3: Skip-to-content link
- UX-P1-4: Landing page hardcoded strings
- UX-P1-5: DraftRestoreModal explanation
- UX-P1-6: Profile loading flash
- UX-P1-8: Evaluation list filter behavior
- UX-P1-13: CookieConsent/OfflineBanner overlap
- INFRA-P1-1: Service worker / PWA install
- INFRA-P1-4: Test coverage thresholds
- INFRA-P1-5: E2E secrets configuration
- INFRA-P1-8: chunkSizeWarningLimit
- DATA-P1-3: Draft cleanup
- DATA-P1-4: Storage orphans on deletion
- DATA-P1-7: Shared links orphan cleanup

---

*Related: [[2026-02-23-production-readiness-audit.md]], [[2026-02-23-production-readiness-design.md]]*
