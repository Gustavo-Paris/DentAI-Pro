import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  getCorsHeaders,
  handleCorsPreFlight,
  ERROR_MESSAGES,
  createErrorResponse,
  generateRequestId,
} from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import { checkRateLimit, createRateLimitResponse } from "../_shared/rateLimit.ts";

/**
 * LGPD Data Export Edge Function
 *
 * Exports ALL user data as a JSON payload so the user can exercise their
 * right to data portability (Art. 18, V — LGPD).
 */

serve(async (req) => {
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401, corsHeaders);
    }

    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user via getUser()
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseService.auth.getUser(token);

    if (authError || !user) {
      return createErrorResponse(
        ERROR_MESSAGES.INVALID_TOKEN,
        401,
        corsHeaders,
      );
    }

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
        .eq("id", userId)
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
      // Subscription
      supabaseService
        .from("subscriptions")
        .select("*, plan:subscription_plans(*)")
        .eq("user_id", userId)
        .maybeSingle(),
      // Inventory
      supabaseService
        .from("user_inventory")
        .select("*, resin:resins(*)")
        .eq("user_id", userId),
      // Payment history
      supabaseService
        .from("payment_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    // Log any individual errors but don't fail the whole export
    const errors: string[] = [];
    if (profileResult.error) errors.push(`profile: ${profileResult.error.message}`);
    if (evaluationsResult.error) errors.push(`evaluations: ${evaluationsResult.error.message}`);
    if (patientsResult.error) errors.push(`patients: ${patientsResult.error.message}`);
    if (draftsResult.error) errors.push(`drafts: ${draftsResult.error.message}`);
    if (creditUsageResult.error) errors.push(`credit_usage: ${creditUsageResult.error.message}`);
    if (subscriptionResult.error) errors.push(`subscription: ${subscriptionResult.error.message}`);
    if (inventoryResult.error) errors.push(`inventory: ${inventoryResult.error.message}`);
    if (paymentHistoryResult.error) errors.push(`payment_history: ${paymentHistoryResult.error.message}`);

    if (errors.length > 0) {
      logger.warn(`[${reqId}] Partial export errors: ${errors.join(", ")}`);
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
        "Content-Disposition": `attachment; filename="auria-dados-${userId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json"`,
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
