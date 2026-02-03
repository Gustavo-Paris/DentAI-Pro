import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";
import { getCorsHeaders, handleCorsPreFlight, createErrorResponse, ERROR_MESSAGES } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

interface RequestBody {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = handleCorsPreFlight(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    // Validate environment
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !STRIPE_SECRET_KEY) {
      console.error("Missing required environment variables");
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

    // Parse request
    const body: RequestBody = await req.json();
    const { priceId, successUrl, cancelUrl } = body;

    if (!priceId) {
      return createErrorResponse("ID do plano não fornecido", 400, corsHeaders);
    }

    // Resolve Stripe Price ID from our internal plan ID
    const { data: planData } = await supabase
      .from("subscription_plans")
      .select("stripe_price_id")
      .eq("id", priceId)
      .maybeSingle();

    const stripePriceId = planData?.stripe_price_id || priceId;

    // Get or create Stripe customer
    let customerId: string;

    // Check if user already has a subscription record with Stripe customer
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id;
    } else {
      // Get user profile for name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name || undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      customerId = customer.id;

      // Save customer ID
      await supabase
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
          status: "inactive",
        }, {
          onConflict: "user_id",
        });
    }

    // Determine URLs
    const origin = req.headers.get("origin") || "https://dentai.pro";
    const checkoutSuccessUrl = successUrl || `${origin}/profile?subscription=success`;
    const checkoutCancelUrl = cancelUrl || `${origin}/profile?subscription=canceled`;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: checkoutSuccessUrl,
      cancel_url: checkoutCancelUrl,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: "required",
      customer_update: {
        address: "auto",
        name: "auto",
      },
      locale: "pt-BR",
    });

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Checkout session error:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return createErrorResponse(
        error.message || "Erro ao processar pagamento",
        error.statusCode || 500,
        corsHeaders
      );
    }

    return createErrorResponse("Erro ao criar sessão de checkout", 500, corsHeaders);
  }
});
