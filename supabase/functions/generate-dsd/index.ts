import { getCorsHeaders, handleCorsPreFlight, createErrorResponse, ERROR_MESSAGES, generateRequestId } from "../_shared/cors.ts";
import { getSupabaseClient, authenticateRequest, isAuthError } from "../_shared/middleware.ts";
import { logger } from "../_shared/logger.ts";
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { checkAndUseCredits, createInsufficientCreditsResponse, refundCredits } from "../_shared/credits.ts";
import type { DSDAnalysis, DSDResult } from "./types.ts";
import { validateRequest } from "./validation.ts";
import { hasSevereDestruction } from "./analysis-helpers.ts";
import { generateSimulation } from "./simulation.ts";
import { analyzeProportions } from "./proportions-analysis.ts";
import { applyPostProcessingSafetyNets } from "./post-processing.ts";
import { PROMPT_VERSION } from "../_shared/metrics-adapter.ts";

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreFlight(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);
  // Always generate reqId server-side for billing idempotency — never trust client value
  const reqId = generateRequestId();
  // Accept client-provided tracking ID for response correlation only
  let clientReqId: string | undefined;
  try {
    const clonedBody = await req.clone().json();
    if (typeof clonedBody.reqId === 'string' && clonedBody.reqId.length > 0 && clonedBody.reqId.length <= 64) {
      clientReqId = clonedBody.reqId;
    }
  } catch {
    // ignore parse errors
  }
  logger.log(`[${reqId}] generate-dsd: start${clientReqId ? ` (clientReqId=${clientReqId})` : ''}`);

  // Track credit state for refund on error (must be outside try for catch access)
  let creditsConsumed = false;
  let supabaseForRefund: ReturnType<typeof getSupabaseClient> | null = null;
  let userIdForRefund: string | null = null;

  try {
    // Create service role client
    const supabase = getSupabaseClient();
    supabaseForRefund = supabase;

    // Validate authentication (includes deleted/banned checks)
    const authResult = await authenticateRequest(req, supabase, corsHeaders);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;
    userIdForRefund = user.id;

    // Check rate limit (AI_HEAVY: 10/min, 50/hour, 200/day)
    const rateLimitResult = await checkRateLimit(
      supabase,
      user.id,
      "generate-dsd",
      RATE_LIMITS.AI_HEAVY
    );

    if (!rateLimitResult.allowed) {
      logger.warn(`Rate limit exceeded for user ${user.id} on generate-dsd`);
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    // Parse and validate request body (need to parse before credit check)
    const body = await req.json();
    const validation = validateRequest(body);

    if (!validation.success || !validation.data) {
      return createErrorResponse(validation.error || ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
    }

    const {
      imageBase64,
      evaluationId,
      regenerateSimulationOnly,
      existingAnalysis,
      toothShape,
      additionalPhotos,
      patientPreferences,
      analysisOnly,
      clinicalObservations,
      clinicalTeethFindings,
      layerType,
      inputAlreadyProcessed,
    } = validation.data;

    // Validate ownership and check existing DSD state BEFORE credit check
    // This allows server-side verification that initial call was already charged
    let evaluationHasDsdAnalysis = false;
    let existingDbAnalysis: DSDAnalysis | null = null;
    if (evaluationId) {
      const { data: ownerCheck, error: ownerError } = await supabase
        .from("evaluations")
        .select("user_id, dsd_analysis")
        .eq("id", evaluationId)
        .single();

      if (ownerError || !ownerCheck) {
        return createErrorResponse("Avaliação não encontrada", 404, corsHeaders);
      }
      if (ownerCheck.user_id !== user.id) {
        return createErrorResponse(ERROR_MESSAGES.ACCESS_DENIED, 403, corsHeaders);
      }
      evaluationHasDsdAnalysis = ownerCheck.dsd_analysis != null;
      if (ownerCheck.dsd_analysis) {
        existingDbAnalysis = ownerCheck.dsd_analysis as DSDAnalysis;
      }
    }

    // Determine if this is a follow-up call (credits already charged on initial call)
    const isFollowUpCall = regenerateSimulationOnly && (
      (evaluationId && evaluationHasDsdAnalysis) || existingAnalysis
    );

    // Log if additional photos or preferences were provided
    if (additionalPhotos) {
      logger.log(`DSD analysis with additional photos: smile45=${!!additionalPhotos.smile45}, face=${!!additionalPhotos.face}`);
    }
    if (patientPreferences) {
      logger.log(`DSD analysis with patient preferences: goals=${!!patientPreferences.aestheticGoals}, changes=${patientPreferences.desiredChanges?.length || 0}`);
    }

    let analysis: DSDAnalysis;

    // Compute image hash for cross-evaluation cache
    const imageDataMatch = imageBase64.match(/^data:[^;]+;base64,(.+)$/);
    const rawBase64ForHash = imageDataMatch ? imageDataMatch[1] : imageBase64;
    const hashEncoder = new TextEncoder();
    const hashSource = `${PROMPT_VERSION}:${rawBase64ForHash.substring(0, 50000)}`;
    const imageHashBuffer = await crypto.subtle.digest('SHA-256', hashEncoder.encode(hashSource));
    const imageHashArr = Array.from(new Uint8Array(imageHashBuffer));
    const dsdImageHash = imageHashArr.map(b => b.toString(16).padStart(2, '0')).join('');

    // If regenerating simulation only, use existing analysis
    if (regenerateSimulationOnly && existingAnalysis) {
      analysis = existingAnalysis;
    } else if (existingDbAnalysis && evaluationHasDsdAnalysis) {
      // Reuse analysis already stored in this evaluation (e.g., layer calls)
      logger.log("Reusing existing DSD analysis from evaluation (intra-evaluation cache)");
      analysis = existingDbAnalysis;
    } else {
      // Check cross-evaluation cache: same image may have been analyzed before
      let cachedAnalysis: DSDAnalysis | null = null;
      try {
        const { data: cached } = await supabase
          .from("evaluations")
          .select("dsd_analysis")
          .eq("dsd_image_hash", dsdImageHash)
          .eq("user_id", user.id)
          .not("dsd_analysis", "is", null)
          .limit(1)
          .single();
        if (cached?.dsd_analysis) {
          cachedAnalysis = cached.dsd_analysis as DSDAnalysis;
          logger.log("Found cached DSD analysis via image hash (cross-evaluation cache)");
        }
      } catch {
        // No cache hit — proceed normally
      }

      if (cachedAnalysis) {
        analysis = cachedAnalysis;
      } else {
        // Run full analysis - pass additional photos, preferences, clinical observations, and per-tooth findings
        const analysisResult = await analyzeProportions(imageBase64, corsHeaders, additionalPhotos, patientPreferences, clinicalObservations, clinicalTeethFindings);

        // Check if it's an error response — return immediately (no credits consumed yet)
        if (analysisResult instanceof Response) {
          return analysisResult;
        }

        analysis = analysisResult;
      }
    }

    // Credits: only charge after analysis succeeds (skip for follow-up calls)
    if (!isFollowUpCall) {
      const creditResult = await checkAndUseCredits(supabase, user.id, "dsd_simulation", reqId);
      if (!creditResult.allowed) {
        logger.warn(`Insufficient credits for user ${user.id} on dsd_simulation`);
        return createInsufficientCreditsResponse(creditResult, corsHeaders);
      }
      creditsConsumed = true;
    }

    // === POST-PROCESSING SAFETY NETS ===
    applyPostProcessingSafetyNets(analysis, additionalPhotos);

    // NEW: If analysisOnly, return immediately without generating simulation
    if (analysisOnly) {
      const destructionCheck = hasSevereDestruction(analysis);
      const result: DSDResult = {
        analysis,
        simulation_url: null,
        simulation_note: destructionCheck.isLimited
          ? destructionCheck.reason || undefined
          : "Simulação será gerada em segundo plano",
      };

      logger.log("Returning analysis only (simulation will be generated in background)");

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for severe destruction that limits simulation value
    const destructionCheck = hasSevereDestruction(analysis);
    let simulationNote: string | undefined;

    if (destructionCheck.isLimited) {
      logger.log("Severe destruction detected:", destructionCheck.reason);
      simulationNote = destructionCheck.reason || undefined;
    }

    // Generate simulation image
    let simulationUrl: string | null = null;
    let simulationDebug: string | undefined;
    let lipsMoved = false;
    try {
      const simResult = await generateSimulation(imageBase64, analysis, user.id, supabase, toothShape || 'natural', patientPreferences, layerType, inputAlreadyProcessed);
      simulationUrl = simResult.url;
      lipsMoved = simResult.lips_moved || false;
    } catch (simError) {
      const simMsg = simError instanceof Error ? simError.message : String(simError);
      logger.error("Simulation error:", simMsg);
      simulationDebug = simMsg;
      // Continue without simulation - analysis is still valid
    }

    // Update evaluation if provided (ownership already verified above)
    if (evaluationId) {
      const { data: evalData, error: evalError } = await supabase
        .from("evaluations")
        .select("dsd_simulation_layers")
        .eq("id", evaluationId)
        .single();

      if (!evalError && evalData) {
        const updateData: Record<string, unknown> = {
          dsd_analysis: analysis,
          dsd_simulation_url: simulationUrl,
          dsd_image_hash: dsdImageHash,
        };

        // When layerType is present, update the layers array
        if (layerType && simulationUrl) {
          const existingLayers = (evalData.dsd_simulation_layers as Array<Record<string, unknown>>) || [];
          const newLayer = {
            type: layerType,
            label: layerType === 'restorations-only' ? 'Apenas Restaurações'
              : layerType === 'complete-treatment' ? 'Tratamento Completo'
              : layerType === 'root-coverage' ? 'Recobrimento Radicular'
              : 'Restaurações + Clareamento',
            simulation_url: simulationUrl,
            whitening_level: patientPreferences?.whiteningLevel || 'natural',
            includes_gengivoplasty: (layerType === 'complete-treatment' || layerType === 'root-coverage') &&
              analysis.suggestions.some(s => {
                const t = (s.treatment_indication || '').toLowerCase();
                return t === 'gengivoplastia' || t === 'recobrimento_radicular';
              }),
          };
          // Replace existing layer of same type or append
          const idx = existingLayers.findIndex((l) => l.type === layerType);
          if (idx >= 0) {
            existingLayers[idx] = newLayer;
          } else {
            existingLayers.push(newLayer);
          }
          updateData.dsd_simulation_layers = existingLayers;
        }

        await supabase
          .from("evaluations")
          .update(updateData)
          .eq("id", evaluationId);
      }
    }

    // Log simulation debug info server-side
    if (simulationDebug && !simulationUrl) {
      logger.warn(`[${reqId}] Simulation failed (debug): ${simulationDebug}`);
    }

    // Return result with note if applicable
    const result: DSDResult & { layer_type?: string; lips_moved?: boolean; simulation_debug?: string } = {
      analysis,
      simulation_url: simulationUrl,
      simulation_note: simulationNote,
    };
    // Include debug info for layer generation calls (helps client-side error logging)
    if (simulationDebug && !simulationUrl && regenerateSimulationOnly) {
      result.simulation_debug = simulationDebug.substring(0, 300);
    }
    if (layerType) {
      result.layer_type = layerType;
    }
    if (lipsMoved) {
      result.lips_moved = true;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`[${reqId}] DSD generation error:`, msg);
    // Refund credits on unexpected errors — user paid but got nothing
    if (creditsConsumed && supabaseForRefund && userIdForRefund) {
      await refundCredits(supabaseForRefund, userIdForRefund, "dsd_simulation", reqId);
      logger.log(`[${reqId}] Refunded DSD credits for user ${userIdForRefund} due to error`);
    }
    return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders, undefined, reqId);
  }
});
