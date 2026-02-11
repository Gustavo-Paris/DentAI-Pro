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
import { sendEmail, accountDeletedEmail } from "../_shared/email.ts";

/**
 * LGPD Account Deletion Edge Function
 *
 * Permanently deletes ALL user data and the auth account, fulfilling
 * the user's right to erasure (Art. 18, VI — LGPD).
 *
 * Safety: requires body.confirmation === "EXCLUIR MINHA CONTA"
 */

const CONFIRMATION_PHRASE = "EXCLUIR MINHA CONTA";

serve(async (req) => {
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
      `[${reqId}] Account deletion confirmed for user ${userId} (${user.email})`,
    );

    // Send deletion confirmation email BEFORE removing the account
    if (user.email) {
      const userName =
        (user.user_metadata?.full_name as string) ?? user.email.split("@")[0];
      const { subject, html } = accountDeletedEmail(userName);
      try {
        await sendEmail({ to: user.email, subject, html });
        logger.log(`[${reqId}] Account-deleted email sent to ${user.email}`);
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

    // 12. Delete profile
    const { error: profileErr } = await supabaseService
      .from("profiles")
      .delete()
      .eq("id", userId);
    if (profileErr) deletionErrors.push(`profile: ${profileErr.message}`);
    else deletionLog.push(`profile: cleared`);

    // 13. Delete auth user (must be last)
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

    return new Response(
      JSON.stringify({
        success: deletionErrors.length === 0,
        message:
          deletionErrors.length === 0
            ? "Conta e todos os dados foram excluídos permanentemente."
            : "Conta excluída com alguns erros parciais. Entre em contato com o suporte se necessário.",
        deleted: deletionLog,
        errors: deletionErrors.length > 0 ? deletionErrors : undefined,
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
