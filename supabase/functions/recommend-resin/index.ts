import { getCorsHeaders, handleCorsPreFlight, ERROR_MESSAGES, createErrorResponse, generateRequestId } from "../_shared/cors.ts";
import { getSupabaseClient, authenticateRequest, isAuthError } from "../_shared/middleware.ts";
import { validateEvaluationData, sanitizeFieldsForPrompt, type EvaluationData } from "../_shared/validation.ts";
import { logger } from "../_shared/logger.ts";
import { callClaude, ClaudeError, type OpenAIMessage } from "../_shared/claude.ts";
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { checkAndUseCredits, createInsufficientCreditsResponse, refundCredits } from "../_shared/credits.ts";
import { getPrompt } from "../_shared/prompts/registry.ts";
import { withMetrics } from "../_shared/prompts/index.ts";
import type { Params as RecommendResinParams } from "../_shared/prompts/definitions/recommend-resin.ts";
import { createSupabaseMetrics, PROMPT_VERSION } from "../_shared/metrics-adapter.ts";
import { parseAIResponse, RecommendResinResponseSchema } from "../_shared/aiSchemas.ts";

import { getContralateral } from "./tooth-utils.ts";
import type { StratificationProtocol } from "./types.ts";
import { groupResinsByPrice, getBudgetAppropriateResins, validateInventoryRecommendation } from "./inventory.ts";
import { validateAndFixProtocolLayers } from "./shade-validation.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const reqId = generateRequestId();

  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(req);
  if (preflightResponse) return preflightResponse;

  logger.log(`[${reqId}] recommend-resin: start`);

  // Track credit state for refund on error (must be outside try for catch access)
  let creditsConsumed = false;
  let supabaseForRefund: ReturnType<typeof getSupabaseClient> | null = null;
  let userIdForRefund: string | null = null;

  try {
    // Create service role client
    const supabaseService = getSupabaseClient();
    supabaseForRefund = supabaseService;

    // Validate authentication (includes deleted/banned checks)
    const authResult = await authenticateRequest(req, supabaseService, corsHeaders);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;
    const userId = user.id;
    userIdForRefund = userId;

    const rateLimitResult = await checkRateLimit(
      supabaseService,
      userId,
      "recommend-resin",
      RATE_LIMITS.AI_LIGHT
    );

    if (!rateLimitResult.allowed) {
      logger.warn(`Rate limit exceeded for user ${userId} on recommend-resin`);
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    // Parse and validate input
    let rawData: unknown;
    try {
      rawData = await req.json();
    } catch {
      return createErrorResponse(ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
    }

    const validation = validateEvaluationData(rawData);
    if (!validation.success || !validation.data) {
      logger.error("Validation failed:", validation.error);
      return createErrorResponse(validation.error || ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
    }

    const data: EvaluationData = validation.data;

    // Backward compat: map old budget values to new ones
    if (data.budget === 'econômico' || data.budget === 'moderado') {
      data.budget = 'padrão';
    }

    // Verify user owns this evaluation
    if (data.userId !== userId) {
      return createErrorResponse(ERROR_MESSAGES.ACCESS_DENIED, 403, corsHeaders);
    }

    // Use service role client for database operations
    const supabase = supabaseService;

    // Fetch all resins from database
    const { data: resins, error: resinsError } = await supabase
      .from("resins")
      .select("*");

    if (resinsError) {
      logger.error("Database error fetching resins:", resinsError);
      return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
    }

    // Fetch user's inventory
    const { data: userInventory, error: inventoryError } = await supabase
      .from("user_inventory")
      .select("resin_id")
      .eq("user_id", data.userId);

    if (inventoryError) {
      logger.error("Error fetching inventory:", inventoryError);
    }

    const inventoryResinIds = userInventory?.map((i: { resin_id: string }) => i.resin_id) || [];
    const hasInventory = inventoryResinIds.length > 0;

    // Separate resins into inventory and non-inventory groups
    const inventoryResins = resins.filter((r: { id: string }) =>
      inventoryResinIds.includes(r.id)
    );
    const otherResins = resins.filter(
      (r: { id: string }) => !inventoryResinIds.includes(r.id)
    );

    // Filter inventory resins by budget if user has inventory
    const budgetAppropriateInventory = hasInventory
      ? getBudgetAppropriateResins(inventoryResins, data.budget)
      : [];
    const budgetAppropriateOther = hasInventory
      ? getBudgetAppropriateResins(otherResins, data.budget)
      : getBudgetAppropriateResins(resins, data.budget);

    // Group all resins by price for the prompt
    const allGroups = groupResinsByPrice(resins);

    // Fetch contralateral protocol if available
    let contralateralProtocol: unknown = null;
    const contralateralTooth = getContralateral(data.tooth);
    if (contralateralTooth) {
      const { data: currentEval } = await supabase
        .from('evaluations')
        .select('session_id')
        .eq('id', data.evaluationId)
        .single();

      if (currentEval?.session_id) {
        const { data: contraEval } = await supabase
          .from('evaluations')
          .select('stratification_protocol, tooth')
          .eq('session_id', currentEval.session_id)
          .eq('tooth', contralateralTooth)
          .eq('user_id', data.userId)
          .not('stratification_protocol', 'is', null)
          .maybeSingle();

        if (contraEval?.stratification_protocol) {
          contralateralProtocol = contraEval.stratification_protocol;
          logger.log(`Found contralateral protocol for tooth ${contralateralTooth}`);
        }
      }
    }

    // Build prompt using prompt management module
    const promptDef = getPrompt('recommend-resin');
    // Read optional DSD context from request body
    const dsdContext = (rawData as Record<string, unknown>).dsdContext as RecommendResinParams['dsdContext'] | undefined;

    // Sanitise free-text user input before prompt interpolation
    const safeData = sanitizeFieldsForPrompt(data, ['clinicalNotes', 'aestheticGoals']);

    const promptParams: RecommendResinParams = {
      patientAge: safeData.patientAge,
      tooth: safeData.tooth,
      region: safeData.region,
      cavityClass: safeData.cavityClass,
      restorationSize: safeData.restorationSize,
      depth: safeData.depth,
      substrate: safeData.substrate,
      substrateCondition: safeData.substrateCondition,
      enamelCondition: safeData.enamelCondition,
      aestheticLevel: safeData.aestheticLevel,
      toothColor: safeData.toothColor,
      stratificationNeeded: safeData.stratificationNeeded,
      bruxism: safeData.bruxism,
      longevityExpectation: safeData.longevityExpectation,
      budget: safeData.budget,
      clinicalNotes: safeData.clinicalNotes,
      aestheticGoals: safeData.aestheticGoals,
      allGroups,
      hasInventory,
      budgetAppropriateInventory,
      inventoryResins,
      contralateralProtocol,
      contralateralTooth,
      dsdContext,
    };

    const prompt = promptDef.user(promptParams);

    // Compute deterministic seed from input hash for reproducibility
    const seedSource = JSON.stringify({
      tooth: data.tooth,
      region: data.region,
      cavityClass: data.cavityClass,
      toothColor: data.toothColor,
      aestheticLevel: data.aestheticLevel,
      stratificationNeeded: data.stratificationNeeded,
      budget: data.budget,
      bruxism: data.bruxism,
    });
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(seedSource));
    const hashArray = new Uint8Array(hashBuffer);
    const inputSeed = ((hashArray[0] << 24) | (hashArray[1] << 16) | (hashArray[2] << 8) | hashArray[3]) >>> 0;
    logger.log(`[${reqId}] Recommendation seed from input hash: ${inputSeed}`);

    // Metrics setup
    const metrics = createSupabaseMetrics(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Call Claude API
    const messages: OpenAIMessage[] = [
      { role: "user", content: prompt },
    ];

    let content: string;
    try {
      const claudeResult = await withMetrics<{ text: string | null; finishReason: string }>(metrics, promptDef.id, PROMPT_VERSION, promptDef.model)(async () => {
        const response = await callClaude(
          promptDef.model,
          messages,
          {
            temperature: 0.0,
            maxTokens: 8192,
          }
        );
        if (response.tokens) {
          logger.info('claude_tokens', { operation: 'recommend-resin', ...response.tokens });
        }
        return {
          result: { text: response.text, finishReason: response.finishReason },
          tokensIn: response.tokens?.promptTokenCount ?? 0,
          tokensOut: response.tokens?.candidatesTokenCount ?? 0,
        };
      });

      if (!claudeResult.text) {
        logger.error("Empty response from Claude");
        return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
      }

      content = claudeResult.text;
    } catch (error) {
      if (error instanceof ClaudeError) {
        if (error.statusCode === 429) {
          return createErrorResponse(ERROR_MESSAGES.RATE_LIMITED, 429, corsHeaders, "RATE_LIMITED");
        }
        logger.error("Claude API error:", error.message);
      } else {
        logger.error("AI error:", error);
      }
      return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
    }

    // Parse JSON from AI response
    let recommendation;
    try {
      // Strip markdown code fences if present (```json ... ```)
      const cleaned = content.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');

      // Try direct parse first
      try {
        recommendation = JSON.parse(cleaned);
      } catch {
        // Fallback: extract first JSON object from response
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          recommendation = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      }
    } catch (parseError) {
      logger.error("Failed to parse AI response. Raw content:", content.substring(0, 500));
      return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
    }

    // Validate response structure with Zod (covers empty layers/checklist via .min(1))
    try {
      parseAIResponse(RecommendResinResponseSchema, recommendation, 'recommend-resin');
    } catch {
      return createErrorResponse("Protocolo inválido — tente novamente", 500, corsHeaders);
    }

    // Credits: only charge after AI response is validated
    const creditResult = await checkAndUseCredits(supabaseForRefund!, userIdForRefund!, "resin_recommendation", reqId);
    if (!creditResult.allowed) {
      logger.warn(`Insufficient credits for user ${userIdForRefund} on resin_recommendation`);
      return createInsufficientCreditsResponse(creditResult, corsHeaders);
    }
    creditsConsumed = true;

    // Validate and fix protocol layers against resin_catalog
    await validateAndFixProtocolLayers({
      recommendation,
      aestheticGoals: data.aestheticGoals,
      supabase,
    });

    // Post-AI inventory validation: ensure recommended resin is from inventory
    validateInventoryRecommendation(recommendation, hasInventory, inventoryResins, budgetAppropriateInventory);

    // Log budget compliance for debugging
    logger.log(`Budget: ${data.budget}, Recommended: ${recommendation.recommended_resin_name}, Price Range: ${recommendation.price_range}, Budget Compliant: ${recommendation.budget_compliance}`);

    // Find the recommended resin in database
    const recommendedResin = resins.find(
      (r: { name: string }) =>
        r.name.toLowerCase() ===
        recommendation.recommended_resin_name.toLowerCase()
    );

    // Find the ideal resin if different
    let idealResin = null;
    if (
      recommendation.ideal_resin_name &&
      recommendation.ideal_resin_name.toLowerCase() !==
        recommendation.recommended_resin_name.toLowerCase()
    ) {
      idealResin = resins.find(
        (r: { name: string }) =>
          r.name.toLowerCase() === recommendation.ideal_resin_name.toLowerCase()
      );
    }

    // Combine alternatives (inventory first, then external)
    const allAlternatives = [
      ...(recommendation.inventory_alternatives || []),
      ...(recommendation.external_alternatives || []),
    ].slice(0, 4); // Limit to 4 alternatives

    // Extract protocol from recommendation
    const protocol = recommendation.protocol as StratificationProtocol | undefined;

    // Update evaluation with recommendation and full protocol
    const { error: updateError } = await supabase
      .from("evaluations")
      .update({
        recommended_resin_id: recommendedResin?.id || null,
        recommendation_text: recommendation.justification,
        alternatives: allAlternatives,
        is_from_inventory: recommendation.is_from_inventory || false,
        ideal_resin_id: idealResin?.id || null,
        ideal_reason: recommendation.ideal_reason || null,
        has_inventory_at_creation: hasInventory,
        // New protocol fields
        stratification_protocol: protocol ? {
          layers: protocol.layers,
          alternative: protocol.alternative,
          finishing: protocol.finishing,
          checklist: protocol.checklist,
          confidence: protocol.confidence,
        } : null,
        protocol_layers: protocol?.layers || null,
        alerts: protocol?.alerts || [],
        warnings: protocol?.warnings || [],
      })
      .eq("id", data.evaluationId);

    if (updateError) {
      logger.error("Database error saving result:", updateError);
      return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
    }

    return new Response(
      JSON.stringify({
        success: true,
        recommendation: {
          resin: recommendedResin,
          justification: recommendation.justification,
          alternatives: allAlternatives,
          isFromInventory: recommendation.is_from_inventory,
          idealResin: idealResin,
          idealReason: recommendation.ideal_reason,
          protocol: protocol || null,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    logger.error(`[${reqId}] recommend-resin error:`, error);
    // Refund credits on unexpected errors
    if (creditsConsumed && supabaseForRefund && userIdForRefund) {
      await refundCredits(supabaseForRefund, userIdForRefund, "resin_recommendation", reqId);
      logger.log(`[${reqId}] Refunded resin_recommendation credits for user ${userIdForRefund} due to error`);
    }
    return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders, undefined, reqId);
  }
});
