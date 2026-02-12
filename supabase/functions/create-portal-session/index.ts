import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe@14.14.0";
import { getCorsHeaders, createErrorResponse } from "../_shared/cors.ts";
import { getSupabaseClient, authenticateRequest, isAuthError, withErrorBoundary } from "../_shared/middleware.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

interface RequestBody {
  returnUrl?: string;
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

  // Get user's subscription with Stripe customer ID
  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subError || !subscription?.stripe_customer_id) {
    return createErrorResponse("Nenhuma assinatura encontrada", 404, corsHeaders);
  }

  // Parse request
  let returnUrl: string;
  try {
    const body: RequestBody = await req.json();
    const origin = req.headers.get("origin") || "https://dentai.pro";
    returnUrl = body.returnUrl || `${origin}/profile`;
  } catch {
    const origin = req.headers.get("origin") || "https://dentai.pro";
    returnUrl = `${origin}/profile`;
  }

  // Create portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: returnUrl,
  });

  return new Response(
    JSON.stringify({
      url: session.url,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}));
