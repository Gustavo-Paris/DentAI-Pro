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
  returnUrl?: string;
}

const ALLOWED_ORIGINS = [
  "https://dentai.pro",
  "https://www.dentai.pro",
  "https://tosmile.ai",
  "https://www.tosmile.ai",
  "https://tosmile-ai.vercel.app",
  "https://auria-ai.vercel.app",
  "https://dentai-pro.vercel.app",
];

function isAllowedRedirectUrl(url: string | undefined): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return ALLOWED_ORIGINS.some((o) => parsed.origin === new URL(o).origin);
  } catch {
    return false;
  }
}

Deno.serve(withErrorBoundary(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // Validate Stripe env
  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  if (!STRIPE_SECRET_KEY) {
    logger.error("Missing required environment variables");
    return createErrorResponse("Configuração incompleta", 500, corsHeaders);
  }

  const supabase = getSupabaseClient();
  const authResult = await authenticateRequest(req, supabase, corsHeaders);
  if (isAuthError(authResult)) return authResult;
  const { user } = authResult;

  // Rate limit
  const rateLimitResult = await checkRateLimit(supabase, user.id, "create-portal-session", RATE_LIMITS.STANDARD);
  if (!rateLimitResult.allowed) {
    logger.warn(`Rate limit exceeded for user ${user.id} on create-portal-session`);
    return createRateLimitResponse(rateLimitResult, corsHeaders);
  }

  // Get user's subscription with Stripe customer ID
  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subError || !subscription?.stripe_customer_id) {
    return createErrorResponse("Nenhuma assinatura encontrada", 404, corsHeaders);
  }

  // Parse request with redirect URL validation
  let returnUrl: string;
  try {
    const body: RequestBody = await req.json();
    const origin = req.headers.get("origin") || "https://tosmile.ai";
    if (!isAllowedRedirectUrl(body.returnUrl)) {
      return createErrorResponse("URL de redirecionamento não permitida", 400, corsHeaders);
    }
    returnUrl = body.returnUrl || `${origin}/profile`;
  } catch {
    const origin = req.headers.get("origin") || "https://tosmile.ai";
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
