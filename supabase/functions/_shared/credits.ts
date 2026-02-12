// Shared credit checking and consumption for edge functions
// Server-side enforcement - this is the source of truth

import { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { logger } from "./logger.ts";
import { sendEmail, creditWarningEmail } from "./email.ts";

export interface CreditCheckResult {
  allowed: boolean;
  creditsAvailable: number;
  creditsCost: number;
  isFreeUser: boolean;
}

/**
 * Atomically check and consume credits for an operation.
 * Uses use_credits() which does SELECT FOR UPDATE to prevent race conditions.
 * Returns { allowed: true } if credits were consumed successfully.
 *
 * @param operationId - Optional unique ID for this operation. Used to prevent
 * double-charge on retry and to enable idempotent refunds. Pass a session/request
 * ID so the same operation isn't charged twice.
 */
export async function checkAndUseCredits(
  supabase: SupabaseClient,
  userId: string,
  operation: string,
  operationId?: string,
): Promise<CreditCheckResult> {
  // If operationId provided, check if already consumed (idempotent)
  if (operationId) {
    const { data: existing } = await supabase
      .from("credit_transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("operation_id", operationId)
      .eq("type", "consume")
      .maybeSingle();

    if (existing) {
      logger.log(`Credits already consumed for operation ${operationId}, skipping`);
      const creditInfo = await getCreditInfo(supabase, userId, operation);
      return {
        allowed: true,
        creditsAvailable: creditInfo.available,
        creditsCost: creditInfo.cost,
        isFreeUser: creditInfo.isFreeUser,
      };
    }
  }

  // Single atomic call: check + consume with row locking
  const { data: consumed, error: useError } = await supabase
    .rpc("use_credits", {
      p_user_id: userId,
      p_operation: operation,
    });

  if (useError) {
    logger.error(`Error consuming credits for ${userId}: ${useError.message}`);
    // Fail-closed: deny the request on error to prevent free usage abuse
    return { allowed: false, creditsAvailable: 0, creditsCost: 0, isFreeUser: false };
  }

  if (!consumed) {
    // Not enough credits — get info for the error response
    const creditInfo = await getCreditInfo(supabase, userId, operation);
    return {
      allowed: false,
      creditsAvailable: creditInfo.available,
      creditsCost: creditInfo.cost,
      isFreeUser: creditInfo.isFreeUser,
    };
  }

  // Record the transaction with operationId for idempotency tracking
  if (operationId) {
    await supabase.from("credit_transactions").insert({
      user_id: userId,
      operation_id: operationId,
      operation,
      type: "consume",
    }).then(({ error }) => {
      if (error) logger.warn(`Failed to record credit transaction: ${error.message}`);
    });
  }

  // Get remaining for logging
  const creditInfo = await getCreditInfo(supabase, userId, operation);
  logger.log(`Credits consumed: user=${userId}, op=${operation}, opId=${operationId || 'none'}, remaining=${creditInfo.available}`);

  // Fire-and-forget credit warning email when below 20%
  sendCreditWarningIfNeeded(supabase, userId, creditInfo.available, creditInfo.total);

  return {
    allowed: true,
    creditsAvailable: creditInfo.available,
    creditsCost: creditInfo.cost,
    isFreeUser: creditInfo.isFreeUser,
  };
}

/**
 * Refund credits for a failed operation.
 * Call this when an AI edge function fails after credits were consumed.
 *
 * @param operationId - Optional unique ID to prevent double-refund. If provided,
 * checks that this operation hasn't already been refunded before issuing refund.
 */
export async function refundCredits(
  supabase: SupabaseClient,
  userId: string,
  operation: string,
  operationId?: string,
): Promise<boolean> {
  // If operationId provided, check if already refunded (idempotent)
  if (operationId) {
    const { data: existing } = await supabase
      .from("credit_transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("operation_id", operationId)
      .eq("type", "refund")
      .maybeSingle();

    if (existing) {
      logger.log(`Credits already refunded for operation ${operationId}, skipping`);
      return true;
    }
  }

  const { data: refunded, error: refundError } = await supabase
    .rpc("refund_credits", {
      p_user_id: userId,
      p_operation: operation,
    });

  if (refundError) {
    logger.error(`Error refunding credits for ${userId}: ${refundError.message}`);
    return false;
  }

  if (refunded) {
    // Record the refund transaction
    if (operationId) {
      await supabase.from("credit_transactions").insert({
        user_id: userId,
        operation_id: operationId,
        operation,
        type: "refund",
      }).then(({ error }) => {
        if (error) logger.warn(`Failed to record refund transaction: ${error.message}`);
      });
    }
    logger.log(`Credits refunded: user=${userId}, op=${operation}, opId=${operationId || 'none'}`);
  }

  return !!refunded;
}

/**
 * Get credit info for a user without consuming.
 * Used for error responses and UI.
 */
async function getCreditInfo(
  supabase: SupabaseClient,
  userId: string,
  operation: string,
): Promise<{ available: number; total: number; cost: number; isFreeUser: boolean }> {
  // Get credit cost
  const { data: costData } = await supabase
    .from("credit_costs")
    .select("credits")
    .eq("operation", operation)
    .maybeSingle();

  const cost = costData?.credits || 1;

  // Get subscription
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("credits_used_this_month, credits_rollover, credits_bonus, plan_id, status, plan:subscription_plans(credits_per_month)")
    .eq("user_id", userId)
    .maybeSingle();

  if (!sub || !["active", "trialing"].includes(sub.status)) {
    return { available: 0, total: 0, cost, isFreeUser: true };
  }

  const plan = sub.plan as { credits_per_month: number } | null;
  const totalCredits = (plan?.credits_per_month || 0) + (sub.credits_rollover || 0) + (sub.credits_bonus || 0);
  const available = Math.max(0, totalCredits - (sub.credits_used_this_month || 0));

  return { available, total: totalCredits, cost, isFreeUser: sub.plan_id === "starter" || !sub.plan_id };
}

/**
 * Fire-and-forget: send a credit warning email when remaining credits
 * drop below 20% of the user's total allocation.
 */
function sendCreditWarningIfNeeded(
  supabase: SupabaseClient,
  userId: string,
  remaining: number,
  total: number,
): void {
  if (total <= 0 || remaining / total >= 0.2) return;

  // Fire-and-forget — never block the credit flow
  (async () => {
    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !user?.email) {
      logger.warn(`Credit warning: could not fetch user ${userId}: ${error?.message}`);
      return;
    }
    const name = user.user_metadata?.full_name || user.email;
    const template = creditWarningEmail(name, remaining, total);
    await sendEmail({ to: user.email, ...template });
    logger.log(`Credit warning email sent to ${user.email} (${remaining}/${total})`);
  })().catch((err) => {
    logger.warn(`Credit warning email failed for user ${userId}: ${err?.message ?? err}`);
  });
}

/**
 * Create a standardized insufficient credits error response.
 */
export function createInsufficientCreditsResponse(
  result: CreditCheckResult,
  corsHeaders: Record<string, string>,
): Response {
  const body = {
    error: "Créditos insuficientes",
    code: "INSUFFICIENT_CREDITS",
    credits_available: result.creditsAvailable,
    credits_required: result.creditsCost,
    is_free_user: result.isFreeUser,
    upgrade_url: "/pricing",
  };

  return new Response(JSON.stringify(body), {
    status: 402,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
