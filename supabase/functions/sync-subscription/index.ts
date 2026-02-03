import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { getCorsHeaders, handleCorsPreFlight, createErrorResponse, ERROR_MESSAGES } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

/**
 * Sync subscription status from Stripe.
 * Called by the frontend after checkout completes to ensure DB is up to date.
 * This is a fallback for webhook delivery issues.
 */
serve(async (req: Request) => {
  const corsResponse = handleCorsPreFlight(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return createErrorResponse("Configuração incompleta", 500, corsHeaders);
    }

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401, corsHeaders);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return createErrorResponse(ERROR_MESSAGES.INVALID_TOKEN, 401, corsHeaders);
    }

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
      console.error("Error syncing subscription:", updateError);
      return createErrorResponse("Erro ao sincronizar assinatura", 500, corsHeaders);
    }

    console.log(`Subscription synced for user ${user.id}: plan=${planId}, status=${activeSub.status}`);

    return new Response(
      JSON.stringify({
        synced: true,
        plan_id: planId,
        status: activeSub.status,
        stripe_price_id: stripePriceId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync subscription error:", error);
    return createErrorResponse("Erro ao sincronizar assinatura", 500, corsHeaders);
  }
});
