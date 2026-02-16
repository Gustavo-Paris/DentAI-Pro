import Stripe from "npm:stripe@14.14.0";
import { getCorsHeaders, createErrorResponse } from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import { getSupabaseClient, authenticateRequest, isAuthError, withErrorBoundary } from "../_shared/middleware.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

/**
 * Sync subscription status from Stripe.
 * Called by the frontend after checkout completes to ensure DB is up to date.
 * This is a fallback for webhook delivery issues.
 */
Deno.serve(withErrorBoundary(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  const supabase = getSupabaseClient();
  const authResult = await authenticateRequest(req, supabase, corsHeaders);
  if (isAuthError(authResult)) return authResult;
  const { user } = authResult;

  // Get user's subscription record to find Stripe customer ID
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existingSub?.stripe_customer_id) {
    return new Response(
      JSON.stringify({ synced: false, reason: "No Stripe customer found" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Fetch active subscriptions from Stripe for this customer
  const stripeSubscriptions = await stripe.subscriptions.list({
    customer: existingSub.stripe_customer_id,
    status: "all",
    limit: 1,
    expand: ["data.items.data.price"],
  });

  const activeSub = stripeSubscriptions.data[0];

  if (!activeSub) {
    return new Response(
      JSON.stringify({ synced: false, reason: "No Stripe subscription found" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Resolve internal plan ID from Stripe price ID
  const stripePriceId = activeSub.items.data[0]?.price.id;
  const { data: planData } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("stripe_price_id", stripePriceId)
    .maybeSingle();

  const planId = planData?.id || stripePriceId;

  // Update subscription in database
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      stripe_subscription_id: activeSub.id,
      plan_id: planId,
      status: activeSub.status,
      current_period_start: new Date(activeSub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(activeSub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: activeSub.cancel_at_period_end,
      canceled_at: activeSub.canceled_at
        ? new Date(activeSub.canceled_at * 1000).toISOString()
        : null,
      trial_start: activeSub.trial_start
        ? new Date(activeSub.trial_start * 1000).toISOString()
        : null,
      trial_end: activeSub.trial_end
        ? new Date(activeSub.trial_end * 1000).toISOString()
        : null,
    })
    .eq("user_id", user.id);

  if (updateError) {
    logger.error("Error syncing subscription:", updateError);
    return createErrorResponse("Erro ao sincronizar assinatura", 500, corsHeaders);
  }

  logger.important(`Subscription synced for user ${user.id}: plan=${planId}, status=${activeSub.status}`);

  return new Response(
    JSON.stringify({
      synced: true,
      plan_id: planId,
      status: activeSub.status,
      stripe_price_id: stripePriceId,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}));
