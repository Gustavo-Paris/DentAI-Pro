import {
  getCorsHeaders,
  ERROR_MESSAGES,
  createErrorResponse,
  generateRequestId,
} from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import {
  getSupabaseClient,
  authenticateRequest,
  isAuthError,
  withErrorBoundary,
} from "../_shared/middleware.ts";
import {
  checkRateLimit,
  createRateLimitResponse,
  RATE_LIMITS,
} from "../_shared/rateLimit.ts";

/**
 * Apply a referral code for a newly signed-up user.
 *
 * Body: { referralCode: string }
 *
 * Grants bonus credits to BOTH the referrer and the authenticated user
 * via the `add_bonus_credits` RPC (called with service role, not user JWT).
 *
 * Auth: Bearer token validated via supabase.auth.getUser().
 */

const BONUS_CREDITS = 5;
const REFERRAL_CODE_PATTERN = /^[A-Za-z0-9\-]{4,20}$/;

Deno.serve(
  withErrorBoundary(async (req) => {
    const corsHeaders = getCorsHeaders(req);
    const reqId = generateRequestId();

    if (req.method !== "POST") {
      return createErrorResponse(
        "Metodo nao permitido",
        405,
        corsHeaders,
      );
    }

    logger.log(`[${reqId}] apply-referral: start`);

    const supabase = getSupabaseClient();
    const authResult = await authenticateRequest(req, supabase, corsHeaders);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    // Rate limit
    const rateLimitResult = await checkRateLimit(
      supabase,
      user.id,
      "apply-referral",
      RATE_LIMITS.STANDARD,
    );
    if (!rateLimitResult.allowed) {
      logger.warn(
        `[${reqId}] Rate limit exceeded for user ${user.id} on apply-referral`,
      );
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    // Parse body
    let body: { referralCode?: string };
    try {
      body = await req.json();
    } catch {
      return createErrorResponse(
        ERROR_MESSAGES.INVALID_REQUEST,
        400,
        corsHeaders,
      );
    }

    const referralCode = body.referralCode?.trim();

    if (!referralCode || !REFERRAL_CODE_PATTERN.test(referralCode)) {
      return createErrorResponse(
        "Codigo de indicacao invalido",
        400,
        corsHeaders,
      );
    }

    // -----------------------------------------------------------------------
    // Look up the referral code
    // -----------------------------------------------------------------------

    const { data: referralCodeRow, error: lookupError } = await supabase
      .from("referral_codes")
      .select("id, user_id, code")
      .eq("code", referralCode)
      .eq("is_active", true)
      .maybeSingle();

    if (lookupError) {
      logger.error(`[${reqId}] referral_codes lookup error:`, lookupError);
      return createErrorResponse(
        "Erro ao buscar codigo de indicacao",
        500,
        corsHeaders,
      );
    }

    if (!referralCodeRow) {
      return createErrorResponse(
        "Codigo de indicacao nao encontrado ou inativo",
        404,
        corsHeaders,
      );
    }

    // Prevent self-referral
    if (referralCodeRow.user_id === user.id) {
      return createErrorResponse(
        "Voce nao pode usar seu proprio codigo de indicacao",
        400,
        corsHeaders,
      );
    }

    // -----------------------------------------------------------------------
    // Check for duplicate conversion (user already used a referral)
    // -----------------------------------------------------------------------

    const { data: existingConversion, error: convCheckError } = await supabase
      .from("referral_conversions")
      .select("id")
      .eq("referred_id", user.id)
      .maybeSingle();

    if (convCheckError) {
      logger.error(
        `[${reqId}] referral_conversions check error:`,
        convCheckError,
      );
      return createErrorResponse(
        "Erro ao verificar indicacao existente",
        500,
        corsHeaders,
      );
    }

    if (existingConversion) {
      logger.log(
        `[${reqId}] User ${user.id} already has a referral conversion — skipping`,
      );
      return new Response(
        JSON.stringify({
          success: true,
          message: "Indicacao ja aplicada anteriormente",
          alreadyApplied: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // -----------------------------------------------------------------------
    // Create conversion record
    // -----------------------------------------------------------------------

    const { error: conversionError } = await supabase
      .from("referral_conversions")
      .insert({
        referrer_id: referralCodeRow.user_id,
        referred_id: user.id,
        referral_code_id: referralCodeRow.id,
        reward_granted: true,
        reward_type: "credits",
        reward_amount: BONUS_CREDITS,
      });

    if (conversionError) {
      logger.error(
        `[${reqId}] Failed to create referral conversion:`,
        conversionError,
      );
      return createErrorResponse(
        "Erro ao registrar indicacao",
        500,
        corsHeaders,
      );
    }

    // -----------------------------------------------------------------------
    // Grant bonus credits to referrer (service role — not user JWT)
    // -----------------------------------------------------------------------

    const { error: referrerError } = await supabase.rpc("add_bonus_credits", {
      p_user_id: referralCodeRow.user_id,
      p_credits: BONUS_CREDITS,
    });

    if (referrerError) {
      logger.error(
        `[${reqId}] Failed to grant bonus credits to referrer ${referralCodeRow.user_id}:`,
        referrerError,
      );
      return createErrorResponse(
        "Erro ao conceder creditos ao indicador",
        500,
        corsHeaders,
      );
    }

    // -----------------------------------------------------------------------
    // Grant bonus credits to referred user (service role — not user JWT)
    // -----------------------------------------------------------------------

    const { error: referredError } = await supabase.rpc("add_bonus_credits", {
      p_user_id: user.id,
      p_credits: BONUS_CREDITS,
    });

    if (referredError) {
      logger.error(
        `[${reqId}] Failed to grant bonus credits to referred user ${user.id}:`,
        referredError,
      );
      return createErrorResponse(
        "Erro ao conceder creditos ao indicado",
        500,
        corsHeaders,
      );
    }

    logger.important(
      `[${reqId}] Referral applied: code="${referralCode}" referrer=${referralCodeRow.user_id} referred=${user.id} credits=${BONUS_CREDITS}`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        creditsGranted: BONUS_CREDITS,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }),
);
