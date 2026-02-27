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
        .select("id, user_id, full_name, cro, clinic_name, phone, created_at, updated_at")
        .eq("user_id", userId)
        .maybeSingle(),
      // Evaluations (explicit columns — excludes internal cache fields)
      supabaseService
        .from("evaluations")
        .select("id, user_id, session_id, patient_id, patient_name, patient_age, tooth, region, cavity_class, restoration_size, substrate, substrate_condition, enamel_condition, depth, aesthetic_level, tooth_color, stratification_needed, bruxism, longevity_expectation, budget, priority, status, treatment_type, desired_tooth_shape, recommended_resin_id, recommendation_text, alternatives, ideal_resin_id, ideal_reason, is_from_inventory, has_inventory_at_creation, ai_treatment_indication, ai_indication_reason, stratification_protocol, protocol_layers, cementation_protocol, generic_protocol, checklist_progress, alerts, warnings, photo_frontal, photo_45, photo_face, additional_photos, dsd_simulation_url, dsd_simulation_layers, patient_aesthetic_goals, patient_desired_changes, created_at, updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      // Patients
      supabaseService
        .from("patients")
        .select("id, user_id, name, phone, email, notes, birth_date, created_at, updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      // Drafts
      supabaseService
        .from("evaluation_drafts")
        .select("id, user_id, draft_data, created_at, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false }),
      // Credit usage
      supabaseService
        .from("credit_usage")
        .select("id, user_id, credits_used, operation, reference_id, created_at")
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
        .select("id, user_id, resin_id, created_at, resin:resin_catalog(id, brand, product_line, shade, opacity, type)")
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

    // Generate signed URLs for photos and DSD simulations (24h expiry)
    const SIGNED_URL_EXPIRY = 86400;
    const evaluations = evaluationsResult.data || [];

    // Collect all storage paths for batch signing
    const photoPaths: string[] = [];
    const dsdPaths: string[] = [];

    for (const ev of evaluations) {
      if (ev.photo_frontal) photoPaths.push(ev.photo_frontal);
      if (ev.photo_45) photoPaths.push(ev.photo_45);
      if (ev.photo_face) photoPaths.push(ev.photo_face);
      if (Array.isArray(ev.additional_photos)) {
        for (const p of ev.additional_photos) {
          if (typeof p === "string" && p) photoPaths.push(p);
        }
      }
      if (ev.dsd_simulation_url) dsdPaths.push(ev.dsd_simulation_url);
      if (Array.isArray(ev.dsd_simulation_layers)) {
        for (const layer of ev.dsd_simulation_layers) {
          if (layer?.simulation_url) dsdPaths.push(layer.simulation_url);
        }
      }
    }

    // Batch-sign all paths (returns Map<path, signedUrl>)
    const signedMap = new Map<string, string>();

    if (photoPaths.length > 0) {
      const { data: photoSigned } = await supabaseService.storage
        .from("clinical-photos")
        .createSignedUrls(photoPaths, SIGNED_URL_EXPIRY);
      if (photoSigned) {
        for (const item of photoSigned) {
          if (item.signedUrl && item.path) signedMap.set(item.path, item.signedUrl);
        }
      }
    }

    if (dsdPaths.length > 0) {
      const { data: dsdSigned } = await supabaseService.storage
        .from("dsd-simulations")
        .createSignedUrls(dsdPaths, SIGNED_URL_EXPIRY);
      if (dsdSigned) {
        for (const item of dsdSigned) {
          if (item.signedUrl && item.path) signedMap.set(item.path, item.signedUrl);
        }
      }
    }

    // Enrich evaluations with signed URLs
    const enrichedEvaluations = evaluations.map((ev) => ({
      ...ev,
      photo_frontal_url: signedMap.get(ev.photo_frontal) || null,
      photo_45_url: signedMap.get(ev.photo_45) || null,
      photo_face_url: signedMap.get(ev.photo_face) || null,
      additional_photos_urls: Array.isArray(ev.additional_photos)
        ? ev.additional_photos.map((p: string) => signedMap.get(p) || null)
        : [],
      dsd_simulation_signed_url: signedMap.get(ev.dsd_simulation_url) || null,
      dsd_simulation_layers_urls: Array.isArray(ev.dsd_simulation_layers)
        ? ev.dsd_simulation_layers.map((layer: { simulation_url?: string }) => ({
            ...layer,
            signed_url: layer?.simulation_url ? signedMap.get(layer.simulation_url) || null : null,
          }))
        : [],
    }));

    const exportData = {
      export_metadata: {
        exported_at: new Date().toISOString(),
        user_id: userId,
        user_email: user.email,
        format_version: "1.1",
        lgpd_reference: "Lei 13.709/2018 - Art. 18, V (Portabilidade dos dados)",
        signed_urls_expire_at: new Date(Date.now() + SIGNED_URL_EXPIRY * 1000).toISOString(),
      },
      profile: profileResult.data || null,
      evaluations: enrichedEvaluations,
      patients: patientsResult.data || [],
      drafts: draftsResult.data || [],
      credit_usage: creditUsageResult.data || [],
      subscription: subscriptionResult.data || null,
      inventory: inventoryResult.data || [],
      payment_history: paymentHistoryResult.data || [],
      partial_errors: errors.length > 0 ? errors : undefined,
    };

    logger.log(
      `[${reqId}] Export complete: ${evaluations.length} evaluations, ` +
        `${patientsResult.data?.length ?? 0} patients, ` +
        `${draftsResult.data?.length ?? 0} drafts, ` +
        `${signedMap.size} signed URLs`,
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
