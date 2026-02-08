// Shared credit checking and consumption for edge functions
// Server-side enforcement - this is the source of truth

import { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { logger } from "./logger.ts";

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
 */
export async function checkAndUseCredits(
  supabase: SupabaseClient,
  userId: string,
  operation: string,
): Promise<CreditCheckResult> {
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

  // Get remaining for logging
  const creditInfo = await getCreditInfo(supabase, userId, operation);
  logger.log(`Credits consumed: user=${userId}, op=${operation}, remaining=${creditInfo.available}`);

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
 */
export async function refundCredits(
  supabase: SupabaseClient,
  userId: string,
  operation: string,
): Promise<boolean> {
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
    logger.log(`Credits refunded: user=${userId}, op=${operation}`);
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
): Promise<{ available: number; cost: number; isFreeUser: boolean }> {
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
    return { available: 0, cost, isFreeUser: true };
  }

  const plan = sub.plan as { credits_per_month: number } | null;
  const totalCredits = (plan?.credits_per_month || 0) + (sub.credits_rollover || 0) + (sub.credits_bonus || 0);
  const available = Math.max(0, totalCredits - (sub.credits_used_this_month || 0));

  return { available, cost, isFreeUser: sub.plan_id === "starter" || !sub.plan_id };
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
