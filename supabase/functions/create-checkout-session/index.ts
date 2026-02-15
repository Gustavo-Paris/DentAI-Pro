import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe@14.14.0";
import { getCorsHeaders, createErrorResponse } from "../_shared/cors.ts";
import { getSupabaseClient, authenticateRequest, isAuthError, withErrorBoundary } from "../_shared/middleware.ts";
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { logger } from "../_shared/logger.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

interface RequestBody {
  priceId?: string;   // for subscription
  packId?: string;    // for credit pack (one-time)
  payment_method?: 'card' | 'pix'; // for credit packs only (default: card)
  successUrl?: string;
  cancelUrl?: string;
}

serve(withErrorBoundary(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // Validate Stripe env
  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  if (!STRIPE_SECRET_KEY) {
    console.error("Missing required environment variables");
    return createErrorResponse("Configuração incompleta", 500, corsHeaders);
  }

  const supabase = getSupabaseClient();
  const authResult = await authenticateRequest(req, supabase, corsHeaders);
  if (isAuthError(authResult)) return authResult;
  const { user } = authResult;

  // Rate limit: standard API limits
  const rateLimitResult = await checkRateLimit(supabase, user.id, "create-checkout-session", RATE_LIMITS.STANDARD);
  if (!rateLimitResult.allowed) {
    logger.warn(`Rate limit exceeded for user ${user.id} on create-checkout-session`);
    return createRateLimitResponse(rateLimitResult, corsHeaders);
  }

  // Parse request
  const body: RequestBody = await req.json();
  const { priceId, packId, payment_method, successUrl, cancelUrl } = body;

  // Validate redirect URLs against allowed origins to prevent open redirect
  const ALLOWED_ORIGINS = [
    "https://dentai.pro",
    "https://www.dentai.pro",
    "https://auria-ai.vercel.app",
    "https://dentai-pro.vercel.app",
  ];

  function isAllowedRedirectUrl(url: string | undefined): boolean {
    if (!url) return true; // fallback to origin-based URL
    try {
      const parsed = new URL(url);
      return ALLOWED_ORIGINS.some(o => parsed.origin === new URL(o).origin);
    } catch {
      return false;
    }
  }

  if (!isAllowedRedirectUrl(successUrl) || !isAllowedRedirectUrl(cancelUrl)) {
    return createErrorResponse("URL de redirecionamento não permitida", 400, corsHeaders);
  }

  if (!priceId && !packId) {
    return createErrorResponse("ID do plano ou pacote não fornecido", 400, corsHeaders);
  }

  // Get or create Stripe customer
  let customerId: string;

  // Check if user already has a subscription record with Stripe customer
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id, stripe_subscription_id, status")
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

  const origin = req.headers.get("origin") || "https://dentai.pro";

  // =========================================================================
  // PATH 1: Credit pack purchase (one-time payment)
  // =========================================================================
  if (packId) {
    // Credit packs require an active subscription
    if (!existingSub?.status || !["active", "trialing"].includes(existingSub.status)) {
      return createErrorResponse("Você precisa de uma assinatura ativa para comprar créditos extras", 400, corsHeaders);
    }

    const { data: pack } = await supabase
      .from("credit_packs")
      .select("*")
      .eq("id", packId)
      .eq("is_active", true)
      .single();

    if (!pack || !pack.stripe_price_id) {
      return createErrorResponse("Pacote não encontrado ou sem preço configurado", 404, corsHeaders);
    }

    // PIX payment method for credit packs (one-time only).
    // NOTE: PIX must be enabled in your Stripe Dashboard under
    // Settings > Payment methods before it will work.
    const isPix = payment_method === "pix";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [{ price: pack.stripe_price_id, quantity: 1 }],
      ...(isPix
        ? {
            payment_method_types: ["pix"],
            payment_method_options: {
              pix: { expires_after_seconds: 86400 },
            },
          }
        : {
            payment_method_types: ["card"],
          }),
      success_url: `${origin}/profile?tab=assinatura&credits=success`,
      cancel_url: `${origin}/profile?tab=assinatura`,
      metadata: {
        supabase_user_id: user.id,
        pack_id: packId,
        credits: String(pack.credits),
        type: "credit_pack",
        payment_method: isPix ? "pix" : "card",
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // =========================================================================
  // PATH 2: Subscription (upgrade/downgrade or new)
  // =========================================================================

  // Resolve Stripe Price ID from our internal plan ID
  const { data: planData } = await supabase
    .from("subscription_plans")
    .select("stripe_price_id")
    .eq("id", priceId)
    .maybeSingle();

  const stripePriceId = planData?.stripe_price_id || priceId;

  // Check if user already has an ACTIVE Stripe subscription → inline upgrade/downgrade
  if (
    existingSub?.stripe_subscription_id &&
    existingSub.status &&
    ["active", "trialing"].includes(existingSub.status)
  ) {
    const stripeSubId = existingSub.stripe_subscription_id;
    const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
    const currentItemId = stripeSub.items.data[0].id;

    await stripe.subscriptions.update(stripeSubId, {
      items: [{ id: currentItemId, price: stripePriceId }],
      proration_behavior: "always_invoice",
    });

    return new Response(
      JSON.stringify({ updated: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // New subscription — create checkout session
  const checkoutSuccessUrl = successUrl || `${origin}/profile?subscription=success`;
  const checkoutCancelUrl = cancelUrl || `${origin}/profile?subscription=canceled`;

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
}));
