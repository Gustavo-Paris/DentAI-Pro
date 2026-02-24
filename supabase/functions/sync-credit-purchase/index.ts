import Stripe from "npm:stripe@14.14.0";
import { getCorsHeaders, createErrorResponse } from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import { getSupabaseClient, authenticateRequest, isAuthError, withErrorBoundary } from "../_shared/middleware.ts";
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

/**
 * Sync credit pack purchase from Stripe.
 * Called by the frontend after checkout completes to ensure credits are applied.
 * Fallback for webhook delivery issues — idempotent via stripe_session_id UNIQUE.
 */
Deno.serve(withErrorBoundary(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  const supabase = getSupabaseClient();
  const authResult = await authenticateRequest(req, supabase, corsHeaders);
  if (isAuthError(authResult)) return authResult;
  const { user } = authResult;

  // Rate limit: standard API limits
  const rateLimitResult = await checkRateLimit(supabase, user.id, "sync-credit-purchase", RATE_LIMITS.STANDARD);
  if (!rateLimitResult.allowed) {
    logger.warn(`Rate limit exceeded for user ${user.id} on sync-credit-purchase`);
    return createRateLimitResponse(rateLimitResult, corsHeaders);
  }

  // Get Stripe customer ID
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingSub?.stripe_customer_id) {
    return new Response(
      JSON.stringify({ synced: false, reason: "No Stripe customer found" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // List recent completed checkout sessions for this customer (one-time payments only)
  const sessions = await stripe.checkout.sessions.list({
    customer: existingSub.stripe_customer_id,
    limit: 5,
  });

  let creditsAdded = 0;
  let sessionsProcessed = 0;

  for (const session of sessions.data) {
    // Only process completed credit pack payments
    if (
      session.status !== "complete" ||
      session.mode !== "payment" ||
      session.metadata?.type !== "credit_pack"
    ) {
      continue;
    }

    const credits = parseInt(session.metadata?.credits || "0", 10);
    const packId = session.metadata?.pack_id;

    if (!credits || !packId) continue;

    // Check if already processed (idempotent via unique stripe_session_id)
    const { data: existing } = await supabase
      .from("credit_pack_purchases")
      .select("id")
      .eq("stripe_session_id", session.id)
      .maybeSingle();

    if (existing) {
      // Already processed — skip
      continue;
    }

    // Record purchase
    const { error: purchaseError } = await supabase
      .from("credit_pack_purchases")
      .upsert({
        user_id: user.id,
        pack_id: packId,
        credits: credits,
        amount: session.amount_total,
        stripe_session_id: session.id,
        status: "completed",
      }, {
        onConflict: "stripe_session_id",
      });

    if (purchaseError) {
      logger.error("Error recording credit pack purchase:", purchaseError);
      continue;
    }

    // Add bonus credits
    const { error: creditError } = await supabase.rpc("add_bonus_credits", {
      p_user_id: user.id,
      p_credits: credits,
    });

    if (creditError) {
      logger.error("Error adding bonus credits:", creditError);
      continue;
    }

    creditsAdded += credits;
    sessionsProcessed++;
    logger.important(`Synced credit pack: pack=${packId}, credits=${credits}, user=${user.id}`);
  }

  return new Response(
    JSON.stringify({
      synced: sessionsProcessed > 0,
      credits_added: creditsAdded,
      sessions_processed: sessionsProcessed,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}));
