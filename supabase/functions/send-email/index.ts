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
  accountDeletedEmail,
} from "../_shared/email.ts";

/**
 * Generic email-sending edge function.
 *
 * Body: { template: string; data?: Record<string, unknown> }
 *
 * Templates:
 *   - welcome
 *   - credit-warning   (data: { remaining, total })
 *   - weekly-digest    (data: { casesThisWeek, totalCases, pendingTeeth })
 *   - account-deleted
 *
 * Auth: Bearer token validated via supabase.auth.getUser().
 */

type TemplateName = "welcome" | "credit-warning" | "weekly-digest" | "account-deleted";

const VALID_TEMPLATES: TemplateName[] = [
  "welcome",
  "credit-warning",
  "weekly-digest",
  "account-deleted",
];

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
      .eq("id", user.id)
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
      const remaining = Number(body.data?.remaining ?? 0);
      const total = Number(body.data?.total ?? 0);
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

    case "account-deleted":
      emailContent = accountDeletedEmail(userName);
      break;

    default:
      return createErrorResponse("Template desconhecido", 400, corsHeaders);
  }

  // Send
  await sendEmail({
    to: userEmail,
    subject: emailContent.subject,
    html: emailContent.html,
  });

  logger.important(
    `[${reqId}] Email sent: template="${template}" to="${userEmail}"`,
  );

  return new Response(
    JSON.stringify({ success: true, template }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}));
