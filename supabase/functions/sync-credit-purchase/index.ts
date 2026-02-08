import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14.14.0";
import { getCorsHeaders, handleCorsPreFlight, createErrorResponse, ERROR_MESSAGES } from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

/**
 * Sync credit pack purchase from Stripe.
 * Called by the frontend after checkout completes to ensure credits are applied.
 * Fallback for webhook delivery issues — idempotent via stripe_session_id UNIQUE.
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

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return createErrorResponse(ERROR_MESSAGES.INVALID_TOKEN, 401, corsHeaders);
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
  } catch (error) {
    logger.error("Sync credit purchase error:", error);
    return createErrorResponse("Erro ao sincronizar créditos", 500, corsHeaders);
  }
});
