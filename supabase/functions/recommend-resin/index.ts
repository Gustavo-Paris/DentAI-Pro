import { getCorsHeaders, handleCorsPreFlight, ERROR_MESSAGES, createErrorResponse, generateRequestId } from "../_shared/cors.ts";
import { getSupabaseClient, authenticateRequest, isAuthError } from "../_shared/middleware.ts";
import { validateEvaluationData, sanitizeFieldsForPrompt, type EvaluationData } from "../_shared/validation.ts";
import { logger } from "../_shared/logger.ts";
import { callClaudeWithTools, ClaudeError, type OpenAIMessage, type OpenAITool } from "../_shared/claude.ts";
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
        .select('session_id, patient_id')
        .eq('id', data.evaluationId)
        .single();

      if (currentEval?.session_id) {
        // Build query with patient_id filter to prevent cross-patient protocol contamination.
        // If two patients share a session, without this filter the wrong patient's
        // contralateral protocol could be returned.
        let contraQuery = supabase
          .from('evaluations')
          .select('stratification_protocol, tooth')
          .eq('session_id', currentEval.session_id)
          .eq('tooth', contralateralTooth)
          .eq('user_id', data.userId)
          .not('stratification_protocol', 'is', null)
          .eq('treatment_type', 'resina')
          .eq('cavity_class', data.cavityClass);

        if (currentEval.patient_id) {
          contraQuery = contraQuery.eq('patient_id', currentEval.patient_id);
        }

        const { data: contraEval } = await contraQuery.maybeSingle();

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

    // Tool definition for structured output (matches RecommendResinResponseSchema)
    const tools: OpenAITool[] = [
      {
        type: "function",
        function: {
          name: "generate_resin_protocol",
          description: "Gera um protocolo completo de resina composta com estratificação, incluindo camadas, alternativas, acabamento e checklist",
          parameters: {
            type: "object",
            properties: {
              protocol: {
                type: "object",
                description: "Protocolo de estratificação completo",
                properties: {
                  layers: {
                    type: "array",
                    description: "Camadas de estratificação da resina",
                    items: {
                      type: "object",
                      properties: {
                        order: { type: "number" },
                        name: { type: "string" },
                        resin_brand: { type: "string" },
                        shade: { type: "string" },
                        thickness: { type: "string" },
                        purpose: { type: "string" },
                        technique: { type: "string" },
                      },
                      required: ["order", "name", "resin_brand", "shade", "thickness", "purpose", "technique"],
                    },
                  },
                  alternative: {
                    type: "object",
                    description: "Alternativa simplificada de protocolo",
                    properties: {
                      resin: { type: "string" },
                      shade: { type: "string" },
                      technique: { type: "string" },
                      tradeoff: { type: "string" },
                    },
                    required: ["resin", "shade", "technique", "tradeoff"],
                  },
                  finishing: {
                    type: "object",
                    description: "Protocolo de acabamento e polimento",
                    properties: {
                      contouring: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            order: { type: "number" },
                            tool: { type: "string" },
                            grit: { type: "string" },
                            speed: { type: "string" },
                            time: { type: "string" },
                            tip: { type: "string" },
                          },
                          required: ["order", "tool", "speed", "time", "tip"],
                        },
                      },
                      polishing: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            order: { type: "number" },
                            tool: { type: "string" },
                            grit: { type: "string" },
                            speed: { type: "string" },
                            time: { type: "string" },
                            tip: { type: "string" },
                          },
                          required: ["order", "tool", "speed", "time", "tip"],
                        },
                      },
                      final_glaze: { type: "string", description: "NÃO USAR — campo depreciado. Brilho obtido com polimento, não glaze." },
                      maintenance_advice: { type: "string" },
                    },
                    required: ["contouring", "polishing", "maintenance_advice"],
                  },
                  checklist: {
                    type: "array",
                    items: { type: "string" },
                    description: "Checklist passo a passo para o dentista",
                  },
                  alerts: {
                    type: "array",
                    items: { type: "string" },
                    description: "Alertas técnicos e pontos de atenção durante o procedimento",
                  },
                  warnings: {
                    type: "array",
                    items: { type: "string" },
                    description: "PROIBIÇÕES — o que o dentista NÃO DEVE fazer. SOMENTE itens negativos no formato 'NÃO [ação]: [razão]'. NUNCA incluir dicas, recomendações ou coisas que DEVE fazer.",
                  },
                  justification: { type: "string", description: "Justificativa para a escolha do protocolo" },
                  confidence: {
                    type: "string",
                    enum: ["alta", "média", "baixa"],
                    description: "Nível de confiança do protocolo",
                  },
                },
                required: ["layers", "alternative", "checklist", "confidence"],
              },
              recommended_resin_name: { type: "string", description: "Nome da resina recomendada" },
              justification: { type: "string", description: "Justificativa geral da recomendação" },
              is_from_inventory: { type: "boolean", description: "Se a resina é do inventário do usuário" },
              ideal_resin_name: { type: "string", description: "Nome da resina ideal (se diferente da recomendada)" },
              ideal_reason: { type: "string", description: "Razão pela qual a resina ideal é diferente" },
              price_range: { type: "string", description: "Faixa de preço da resina recomendada" },
              budget_compliance: { type: "boolean", description: "Se a resina atende ao orçamento" },
              inventory_alternatives: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    reason: { type: "string" },
                  },
                },
                description: "Alternativas do inventário do usuário",
              },
              external_alternatives: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    reason: { type: "string" },
                  },
                },
                description: "Alternativas externas ao inventário",
              },
            },
            required: ["protocol", "recommended_resin_name", "justification", "is_from_inventory"],
          },
        },
      },
    ];

    // Call Claude API with tool calling
    const systemPrompt = promptDef.system({} as RecommendResinParams);
    const messages: OpenAIMessage[] = [
      ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
      { role: "user" as const, content: prompt },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let recommendation: any;
    try {
      const claudeResult = await withMetrics<{ text: string | null; functionCall: { name: string; args: Record<string, unknown> } | null; finishReason: string }>(metrics, promptDef.id, PROMPT_VERSION, promptDef.model)(async () => {
        const response = await callClaudeWithTools(
          promptDef.model,
          messages,
          tools,
          {
            temperature: 0.0,
            maxTokens: promptDef.maxTokens,
            forceFunctionName: "generate_resin_protocol",
            timeoutMs: 45_000,
          }
        );
        if (response.tokens) {
          logger.info('claude_tokens', { operation: 'recommend-resin', ...response.tokens });
        }
        return {
          result: { text: response.text, functionCall: response.functionCall, finishReason: response.finishReason },
          tokensIn: response.tokens?.promptTokenCount ?? 0,
          tokensOut: response.tokens?.candidatesTokenCount ?? 0,
        };
      });

      if (!claudeResult.functionCall) {
        logger.error("No function call in Claude response");
        return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
      }

      recommendation = parseAIResponse(RecommendResinResponseSchema, claudeResult.functionCall.args, 'recommend-resin');

      if (!recommendation.protocol) {
        logger.warn(`[${reqId}] Claude omitted protocol object — response will lack stratification details`);
      }
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
      tooth: data.tooth,
      cavityClass: data.cavityClass,
    });

    // Post-AI inventory validation: ensure recommended resin is from inventory
    // Pass region so fallback picks a clinically appropriate resin for the tooth
    validateInventoryRecommendation(recommendation, hasInventory, inventoryResins, budgetAppropriateInventory, data.region);

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
      .eq("id", data.evaluationId)
      .eq("user_id", userId);

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
          protocol_incomplete: !recommendation.protocol,
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
