import {
  getCorsHeaders,
  ERROR_MESSAGES,
  createErrorResponse,
  generateRequestId,
} from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import { getSupabaseClient, authenticateRequest, isAuthError, withErrorBoundary } from "../_shared/middleware.ts";
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";
import {
  sendEmail,
  welcomeEmail,
  creditWarningEmail,
  weeklyDigestEmail,
} from "../_shared/email.ts";

/**
 * Generic email-sending edge function (user-facing).
 *
 * Body: { template: string; data?: Record<string, unknown> }
 *
 * Templates:
 *   - welcome
 *   - credit-warning   (data: { remaining, total })
 *   - weekly-digest    (data: { casesThisWeek, totalCases, pendingTeeth })
 *
 * Internal-only templates (payment-received, payment-failed, account-deleted)
 * are sent directly by stripe-webhook and delete-account edge functions.
 *
 * Auth: Bearer token validated via supabase.auth.getUser().
 */

type TemplateName = "welcome" | "credit-warning" | "weekly-digest";

/** Templates callable by authenticated users via this endpoint. */
const VALID_TEMPLATES: TemplateName[] = [
  "welcome",
  "credit-warning",
  "weekly-digest",
];

// payment-received, payment-failed, and account-deleted are sent directly
// by stripe-webhook and delete-account edge functions — not exposed here.

Deno.serve(withErrorBoundary(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const reqId = generateRequestId();

  // Only accept POST
  if (req.method !== "POST") {
    return createErrorResponse("Método não permitido", 405, corsHeaders);
  }

  logger.log(`[${reqId}] send-email: start`);

  const supabase = getSupabaseClient();
  const authResult = await authenticateRequest(req, supabase, corsHeaders);
  if (isAuthError(authResult)) return authResult;
  const { user } = authResult;

  // Rate limit: standard API limits
  const rateLimitResult = await checkRateLimit(supabase, user.id, "send-email", RATE_LIMITS.STANDARD);
  if (!rateLimitResult.allowed) {
    logger.warn(`[${reqId}] Rate limit exceeded for user ${user.id} on send-email`);
    return createRateLimitResponse(rateLimitResult, corsHeaders);
  }

  // Parse body
  let body: { template?: string; data?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return createErrorResponse(ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
  }

  const template = body.template as TemplateName | undefined;

  if (!template || !VALID_TEMPLATES.includes(template)) {
    return createErrorResponse(
      `Template invalido. Use: ${VALID_TEMPLATES.join(", ")}`,
      400,
      corsHeaders,
    );
  }

  // Resolve user name + email
  const userEmail = user.email;
  if (!userEmail) {
    return createErrorResponse("Usuario sem e-mail", 400, corsHeaders);
  }

  // Try to get display name from user metadata, then fallback to profiles table
  let userName = user.user_metadata?.full_name as string | undefined;
  if (!userName) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();
    userName = profile?.full_name ?? userEmail.split("@")[0];
  }

  // Build email from template
  let emailContent: { subject: string; html: string };

  switch (template) {
    case "welcome":
      emailContent = welcomeEmail(userName);
      break;

    case "credit-warning": {
      // Fetch actual credit data server-side instead of trusting client values
      let remaining = Number(body.data?.remaining ?? 0);
      let total = Number(body.data?.total ?? 0);

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("credits_used_this_month, credits_rollover, credits_bonus, plan:subscription_plans(credits_per_month)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (sub) {
        const plan = sub.plan as { credits_per_month: number } | null;
        const serverTotal = (plan?.credits_per_month || 0) + (sub.credits_rollover || 0) + (sub.credits_bonus || 0);
        const serverRemaining = Math.max(0, serverTotal - (sub.credits_used_this_month || 0));
        remaining = serverRemaining;
        total = serverTotal;
      }

      emailContent = creditWarningEmail(userName, remaining, total);
      break;
    }

    case "weekly-digest": {
      const stats = {
        casesThisWeek: Number(body.data?.casesThisWeek ?? 0),
        totalCases: Number(body.data?.totalCases ?? 0),
        pendingTeeth: Number(body.data?.pendingTeeth ?? 0),
      };
      emailContent = weeklyDigestEmail(userName, stats);
      break;
    }

    default:
      return createErrorResponse("Template desconhecido", 400, corsHeaders);
  }

  // Send
  try {
    await sendEmail({
      to: userEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });
  } catch (err) {
    logger.error(`[${reqId}] sendEmail failed: template="${template}" error="${(err as Error).message}"`);
    return createErrorResponse('Falha ao enviar email. Tente novamente mais tarde.', 502, corsHeaders, undefined, reqId);
  }

  logger.important(
    `[${reqId}] Email sent: template="${template}" to=user ${user.id}`,
  );

  return new Response(
    JSON.stringify({ success: true, template }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}));
