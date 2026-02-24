import {
  getCorsHeaders,
  handleCorsPreFlight,
  ERROR_MESSAGES,
  createErrorResponse,
  generateRequestId,
} from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import { getSupabaseClient, authenticateRequest, isAuthError } from "../_shared/middleware.ts";
import { checkRateLimit, createRateLimitResponse } from "../_shared/rateLimit.ts";

/**
 * LGPD Data Export Edge Function
 *
 * Exports ALL user data as a JSON payload so the user can exercise their
 * right to data portability (Art. 18, V — LGPD).
 */

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const reqId = generateRequestId();

  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(req);
  if (preflightResponse) return preflightResponse;

  // Only accept GET or POST
  if (req.method !== "GET" && req.method !== "POST") {
    return createErrorResponse("Método não permitido", 405, corsHeaders);
  }

  logger.log(`[${reqId}] data-export: start`);

  try {
    const supabaseService = getSupabaseClient();
    const authResult = await authenticateRequest(req, supabaseService, corsHeaders);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const userId = user.id;

    // Rate limit: LGPD data export — restrictive to prevent abuse
    const rateLimitResult = await checkRateLimit(
      supabaseService,
      userId,
      "data-export",
      { perMinute: 2, perHour: 10, perDay: 20 },
    );

    if (!rateLimitResult.allowed) {
      logger.warn(`[${reqId}] Rate limit exceeded for user ${userId} on data-export`);
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    logger.log(`[${reqId}] Exporting data for user ${userId}`);

    // Fetch all user data in parallel
    const [
      profileResult,
      evaluationsResult,
      patientsResult,
      draftsResult,
      creditUsageResult,
      subscriptionResult,
      inventoryResult,
      paymentHistoryResult,
    ] = await Promise.all([
      // Profile
      supabaseService
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      // Evaluations (with full data)
      supabaseService
        .from("evaluations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      // Patients
      supabaseService
        .from("patients")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      // Drafts
      supabaseService
        .from("evaluation_drafts")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false }),
      // Credit usage
      supabaseService
        .from("credit_usage")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      // Subscription — exclude internal Stripe IDs
      supabaseService
        .from("subscriptions")
        .select("user_id, status, plan_id, credits_used_this_month, credits_rollover, credits_bonus, current_period_start, current_period_end, created_at, updated_at, plan:subscription_plans(*)")
        .eq("user_id", userId)
        .maybeSingle(),
      // Inventory
      supabaseService
        .from("user_inventory")
        .select("*, resin:resins(*)")
        .eq("user_id", userId),
      // Payment history — exclude internal Stripe IDs
      supabaseService
        .from("payment_history")
        .select("user_id, subscription_id, amount, currency, status, description, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    // Log any individual errors but don't fail the whole export
    const errors: string[] = [];
    if (profileResult.error) errors.push("profile");
    if (evaluationsResult.error) errors.push("evaluations");
    if (patientsResult.error) errors.push("patients");
    if (draftsResult.error) errors.push("drafts");
    if (creditUsageResult.error) errors.push("credit_usage");
    if (subscriptionResult.error) errors.push("subscription");
    if (inventoryResult.error) errors.push("inventory");
    if (paymentHistoryResult.error) errors.push("payment_history");

    // Log full errors server-side only
    const detailedErrors: string[] = [];
    if (profileResult.error) detailedErrors.push(`profile: ${profileResult.error.message}`);
    if (evaluationsResult.error) detailedErrors.push(`evaluations: ${evaluationsResult.error.message}`);
    if (patientsResult.error) detailedErrors.push(`patients: ${patientsResult.error.message}`);
    if (draftsResult.error) detailedErrors.push(`drafts: ${draftsResult.error.message}`);
    if (creditUsageResult.error) detailedErrors.push(`credit_usage: ${creditUsageResult.error.message}`);
    if (subscriptionResult.error) detailedErrors.push(`subscription: ${subscriptionResult.error.message}`);
    if (inventoryResult.error) detailedErrors.push(`inventory: ${inventoryResult.error.message}`);
    if (paymentHistoryResult.error) detailedErrors.push(`payment_history: ${paymentHistoryResult.error.message}`);

    if (detailedErrors.length > 0) {
      logger.warn(`[${reqId}] Partial export errors: ${detailedErrors.join(", ")}`);
    }

    const exportData = {
      export_metadata: {
        exported_at: new Date().toISOString(),
        user_id: userId,
        user_email: user.email,
        format_version: "1.0",
        lgpd_reference: "Lei 13.709/2018 - Art. 18, V (Portabilidade dos dados)",
      },
      profile: profileResult.data || null,
      evaluations: evaluationsResult.data || [],
      patients: patientsResult.data || [],
      drafts: draftsResult.data || [],
      credit_usage: creditUsageResult.data || [],
      subscription: subscriptionResult.data || null,
      inventory: inventoryResult.data || [],
      payment_history: paymentHistoryResult.data || [],
      partial_errors: errors.length > 0 ? errors : undefined,
    };

    logger.log(
      `[${reqId}] Export complete: ${evaluationsResult.data?.length ?? 0} evaluations, ` +
        `${patientsResult.data?.length ?? 0} patients, ` +
        `${draftsResult.data?.length ?? 0} drafts`,
    );

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="tosmile-dados-${userId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error: unknown) {
    logger.error(`[${reqId}] data-export error:`, error);
    return createErrorResponse(
      ERROR_MESSAGES.PROCESSING_ERROR,
      500,
      corsHeaders,
      undefined,
      reqId,
    );
  }
});
