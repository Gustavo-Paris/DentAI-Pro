// Shared credit checking and consumption for edge functions
// Server-side enforcement - this is the source of truth

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logger } from "./logger.ts";

export interface CreditCheckResult {
  allowed: boolean;
  creditsAvailable: number;
  creditsCost: number;
  isFreeUser: boolean;
}

/**
 * Check if user has enough credits for an operation and consume them.
 * Returns { allowed: true } if credits were consumed successfully.
 * For free users without subscription, falls back to count-based limits.
 */
export async function checkAndUseCredits(
  supabase: SupabaseClient,
  userId: string,
  operation: string,
): Promise<CreditCheckResult> {
  // Try to use the database function (handles everything server-side)
  const { data: canUse, error: checkError } = await supabase
    .rpc("can_use_credits", {
      p_user_id: userId,
      p_operation: operation,
    });

  if (checkError) {
    logger.error(`Error checking credits for ${userId}: ${checkError.message}`);
    // On error, allow the request (fail open) but log it
    // This prevents credit system bugs from blocking all users
    return { allowed: true, creditsAvailable: -1, creditsCost: 0, isFreeUser: false };
  }

  if (!canUse) {
    // Get credit info for the error response
    const creditInfo = await getCreditInfo(supabase, userId, operation);
    return {
      allowed: false,
      creditsAvailable: creditInfo.available,
      creditsCost: creditInfo.cost,
      isFreeUser: creditInfo.isFreeUser,
    };
  }

  // Consume the credits
  const { data: consumed, error: useError } = await supabase
    .rpc("use_credits", {
      p_user_id: userId,
      p_operation: operation,
    });

  if (useError || !consumed) {
    logger.error(`Error consuming credits for ${userId}: ${useError?.message || "use_credits returned false"}`);
    // Credits were available but consumption failed
    return { allowed: false, creditsAvailable: 0, creditsCost: 0, isFreeUser: false };
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
    .select("credits_used_this_month, credits_rollover, plan_id, status, plan:subscription_plans(credits_per_month)")
    .eq("user_id", userId)
    .maybeSingle();

  if (!sub || !["active", "trialing"].includes(sub.status)) {
    return { available: 0, cost, isFreeUser: true };
  }

  const plan = sub.plan as { credits_per_month: number } | null;
  const totalCredits = (plan?.credits_per_month || 0) + (sub.credits_rollover || 0);
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
