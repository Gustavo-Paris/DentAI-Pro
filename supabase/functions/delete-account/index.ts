import {
  getCorsHeaders,
  handleCorsPreFlight,
  ERROR_MESSAGES,
  createErrorResponse,
  generateRequestId,
} from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import { getSupabaseClient, authenticateRequest, isAuthError } from "../_shared/middleware.ts";
import { sendEmail, accountDeletedEmail } from "../_shared/email.ts";
import { checkRateLimit, createRateLimitResponse } from "../_shared/rateLimit.ts";

/**
 * LGPD Account Deletion Edge Function
 *
 * Permanently deletes ALL user data and the auth account, fulfilling
 * the user's right to erasure (Art. 18, VI — LGPD).
 *
 * Safety: requires body.confirmation === "EXCLUIR MINHA CONTA"
 */

const CONFIRMATION_PHRASE = "EXCLUIR MINHA CONTA";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const reqId = generateRequestId();

  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(req);
  if (preflightResponse) return preflightResponse;

  // Only accept POST
  if (req.method !== "POST") {
    return createErrorResponse("Método não permitido", 405, corsHeaders);
  }

  logger.important(`[${reqId}] delete-account: start`);

  try {
    const supabaseService = getSupabaseClient();
    const authResult = await authenticateRequest(req, supabaseService, corsHeaders);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    const userId = user.id;

    // Rate limit: account deletion — very strict to prevent abuse
    const rateLimitResult = await checkRateLimit(
      supabaseService,
      userId,
      "delete-account",
      { perMinute: 1, perHour: 3, perDay: 5 },
    );

    if (!rateLimitResult.allowed) {
      logger.warn(`[${reqId}] Rate limit exceeded for user ${userId} on delete-account`);
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    // Parse and validate confirmation
    let body: { confirmation?: string };
    try {
      body = await req.json();
    } catch {
      return createErrorResponse(ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
    }

    if (body.confirmation !== CONFIRMATION_PHRASE) {
      return createErrorResponse(
        `Confirmação inválida. Digite exatamente: "${CONFIRMATION_PHRASE}"`,
        400,
        corsHeaders,
        "INVALID_CONFIRMATION",
      );
    }

    logger.important(
      `[${reqId}] Account deletion confirmed for user ${userId}`,
    );

    // Send deletion confirmation email BEFORE removing the account
    if (user.email) {
      const userName =
        (user.user_metadata?.full_name as string) ?? user.email.split("@")[0];
      const { subject, html } = accountDeletedEmail(userName);
      try {
        await sendEmail({ to: user.email, subject, html });
        logger.log(`[${reqId}] Account-deleted email sent to user ${userId}`);
      } catch (emailErr) {
        // Non-blocking: log but don't abort deletion
        logger.error(`[${reqId}] Failed to send deletion email:`, emailErr);
      }
    }

    // -----------------------------------------------------------------------
    // Delete user data in dependency order (children first)
    // -----------------------------------------------------------------------

    const deletionLog: string[] = [];
    const deletionErrors: string[] = [];

    // 1. Delete evaluation drafts
    const { error: draftsErr, count: draftsCount } = await supabaseService
      .from("evaluation_drafts")
      .delete({ count: "exact" })
      .eq("user_id", userId);
    if (draftsErr) deletionErrors.push(`drafts: ${draftsErr.message}`);
    else deletionLog.push(`drafts: ${draftsCount ?? 0}`);

    // 2. Delete session detected teeth (linked to evaluations via session)
    // These reference evaluations so delete first
    const { data: userSessions } = await supabaseService
      .from("evaluations")
      .select("session_id")
      .eq("user_id", userId)
      .not("session_id", "is", null);

    if (userSessions && userSessions.length > 0) {
      const sessionIds = [...new Set(userSessions.map((s) => s.session_id).filter(Boolean))];
      if (sessionIds.length > 0) {
        const { error: teethErr } = await supabaseService
          .from("session_detected_teeth")
          .delete()
          .in("session_id", sessionIds);
        if (teethErr) deletionErrors.push(`session_teeth: ${teethErr.message}`);
        else deletionLog.push(`session_teeth: cleared`);
      }
    }

    // 3. Delete shared links (linked to evaluations)
    const { error: linksErr } = await supabaseService
      .from("shared_links")
      .delete()
      .eq("user_id", userId);
    if (linksErr) deletionErrors.push(`shared_links: ${linksErr.message}`);
    else deletionLog.push(`shared_links: cleared`);

    // 4. Delete evaluations
    const { error: evalsErr, count: evalsCount } = await supabaseService
      .from("evaluations")
      .delete({ count: "exact" })
      .eq("user_id", userId);
    if (evalsErr) deletionErrors.push(`evaluations: ${evalsErr.message}`);
    else deletionLog.push(`evaluations: ${evalsCount ?? 0}`);

    // 5. Delete patients
    const { error: patientsErr, count: patientsCount } = await supabaseService
      .from("patients")
      .delete({ count: "exact" })
      .eq("user_id", userId);
    if (patientsErr) deletionErrors.push(`patients: ${patientsErr.message}`);
    else deletionLog.push(`patients: ${patientsCount ?? 0}`);

    // 6. Delete credit usage
    const { error: creditsErr } = await supabaseService
      .from("credit_usage")
      .delete()
      .eq("user_id", userId);
    if (creditsErr) deletionErrors.push(`credit_usage: ${creditsErr.message}`);
    else deletionLog.push(`credit_usage: cleared`);

    // 7. Delete user inventory
    const { error: inventoryErr } = await supabaseService
      .from("user_inventory")
      .delete()
      .eq("user_id", userId);
    if (inventoryErr) deletionErrors.push(`inventory: ${inventoryErr.message}`);
    else deletionLog.push(`inventory: cleared`);

    // 8. Delete payment history
    const { error: paymentsErr } = await supabaseService
      .from("payment_history")
      .delete()
      .eq("user_id", userId);
    if (paymentsErr) deletionErrors.push(`payments: ${paymentsErr.message}`);
    else deletionLog.push(`payment_history: cleared`);

    // 9. Delete subscription
    const { error: subErr } = await supabaseService
      .from("subscriptions")
      .delete()
      .eq("user_id", userId);
    if (subErr) deletionErrors.push(`subscription: ${subErr.message}`);
    else deletionLog.push(`subscription: cleared`);

    // 10. Delete photos from storage (clinical-photos bucket)
    try {
      const { data: photoFiles } = await supabaseService.storage
        .from("clinical-photos")
        .list(userId);

      if (photoFiles && photoFiles.length > 0) {
        const paths = photoFiles.map((f) => `${userId}/${f.name}`);
        const { error: storageErr } = await supabaseService.storage
          .from("clinical-photos")
          .remove(paths);
        if (storageErr) deletionErrors.push(`storage/photos: ${storageErr.message}`);
        else deletionLog.push(`storage/photos: ${paths.length} files`);
      }
    } catch (storageError) {
      deletionErrors.push(`storage/photos: ${String(storageError)}`);
    }

    // 11. Delete avatar from storage
    try {
      const { data: avatarFiles } = await supabaseService.storage
        .from("avatars")
        .list(userId);

      if (avatarFiles && avatarFiles.length > 0) {
        const paths = avatarFiles.map((f) => `${userId}/${f.name}`);
        const { error: avatarErr } = await supabaseService.storage
          .from("avatars")
          .remove(paths);
        if (avatarErr) deletionErrors.push(`storage/avatars: ${avatarErr.message}`);
        else deletionLog.push(`storage/avatars: ${paths.length} files`);
      }
    } catch (storageError) {
      deletionErrors.push(`storage/avatars: ${String(storageError)}`);
    }

    // 12. Delete credit_transactions
    const { error: creditTxErr } = await supabaseService
      .from("credit_transactions")
      .delete()
      .eq("user_id", userId);
    if (creditTxErr) deletionErrors.push(`credit_transactions: ${creditTxErr.message}`);
    else deletionLog.push("credit_transactions: cleared");

    // 13. Delete credit_pack_purchases
    const { error: packPurchErr } = await supabaseService
      .from("credit_pack_purchases")
      .delete()
      .eq("user_id", userId);
    if (packPurchErr) deletionErrors.push(`credit_pack_purchases: ${packPurchErr.message}`);
    else deletionLog.push("credit_pack_purchases: cleared");

    // 14. Delete referral_conversions (as referrer or referred)
    const { error: refConvErr } = await supabaseService
      .from("referral_conversions")
      .delete()
      .or(`referrer_id.eq.${userId},referred_id.eq.${userId}`);
    if (refConvErr) deletionErrors.push(`referral_conversions: ${refConvErr.message}`);
    else deletionLog.push("referral_conversions: cleared");

    // 15. Delete referral_codes
    const { error: refCodeErr } = await supabaseService
      .from("referral_codes")
      .delete()
      .eq("user_id", userId);
    if (refCodeErr) deletionErrors.push(`referral_codes: ${refCodeErr.message}`);
    else deletionLog.push("referral_codes: cleared");

    // 16. Delete rate_limits
    const { error: rateLimitErr } = await supabaseService
      .from("rate_limits")
      .delete()
      .eq("user_id", userId);
    if (rateLimitErr) deletionErrors.push(`rate_limits: ${rateLimitErr.message}`);
    else deletionLog.push("rate_limits: cleared");

    // 17. Delete dsd-simulations storage
    try {
      const { data: dsdFiles } = await supabaseService.storage
        .from("dsd-simulations")
        .list(userId);
      if (dsdFiles?.length) {
        const dsdPaths = dsdFiles.map((f) => `${userId}/${f.name}`);
        await supabaseService.storage.from("dsd-simulations").remove(dsdPaths);
        deletionLog.push(`dsd-simulations: ${dsdPaths.length} files removed`);
      }
    } catch (e) {
      deletionErrors.push(`dsd-simulations: ${(e as Error).message}`);
    }

    // 18. Delete profile
    const { error: profileErr } = await supabaseService
      .from("profiles")
      .delete()
      .eq("user_id", userId);
    if (profileErr) deletionErrors.push(`profile: ${profileErr.message}`);
    else deletionLog.push(`profile: cleared`);

    // 19. Delete auth user (must be last)
    const { error: authDeleteErr } = await supabaseService.auth.admin.deleteUser(userId);
    if (authDeleteErr) {
      deletionErrors.push(`auth_user: ${authDeleteErr.message}`);
      logger.error(`[${reqId}] Failed to delete auth user: ${authDeleteErr.message}`);
    } else {
      deletionLog.push(`auth_user: deleted`);
    }

    // -----------------------------------------------------------------------
    // Result
    // -----------------------------------------------------------------------

    if (deletionErrors.length > 0) {
      logger.error(
        `[${reqId}] Partial deletion errors: ${deletionErrors.join(", ")}`,
      );
    }

    logger.important(
      `[${reqId}] Account deletion complete for ${userId}. ` +
        `Deleted: [${deletionLog.join(", ")}]. ` +
        `Errors: [${deletionErrors.join(", ") || "none"}]`,
    );

    // Log detailed deletion errors server-side only — never expose DB error strings to client
    if (deletionErrors.length > 0) {
      logger.error(`[${reqId}] Detailed deletion errors: ${deletionErrors.join(", ")}`);
    }

    // Log full deletion details server-side (never expose table names to client)
    logger.important(`[${reqId}] Deletion complete: ${deletionLog.join(', ')}`);

    return new Response(
      JSON.stringify({
        success: deletionErrors.length === 0,
        message:
          deletionErrors.length === 0
            ? "Conta e todos os dados foram excluídos permanentemente."
            : "Conta parcialmente excluída. Entre em contato com o suporte.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    logger.error(`[${reqId}] delete-account error:`, error);
    return createErrorResponse(
      ERROR_MESSAGES.PROCESSING_ERROR,
      500,
      corsHeaders,
      undefined,
      reqId,
    );
  }
});
