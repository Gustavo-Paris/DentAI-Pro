import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreFlight, ERROR_MESSAGES, createErrorResponse, generateRequestId } from "../_shared/cors.ts";
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

function getContralateral(tooth: string): string | null {
  const num = parseInt(tooth);
  if (num >= 11 && num <= 18) return String(num + 10);
  if (num >= 21 && num <= 28) return String(num - 10);
  if (num >= 31 && num <= 38) return String(num + 10);
  if (num >= 41 && num <= 48) return String(num - 10);
  return null;
}

interface ProtocolLayer {
  order: number;
  name: string;
  resin_brand: string;
  shade: string;
  thickness: string;
  purpose: string;
  technique: string;
}

interface ProtocolAlternative {
  resin: string;
  shade: string;
  technique: string;
  tradeoff: string;
}

interface PolishingStep {
  order: number;
  tool: string;
  grit?: string;
  speed: string;
  time: string;
  tip: string;
}

interface FinishingProtocol {
  contouring: PolishingStep[];
  polishing: PolishingStep[];
  final_glaze?: string;
  maintenance_advice: string;
}

interface StratificationProtocol {
  layers: ProtocolLayer[];
  alternative: ProtocolAlternative;
  finishing?: FinishingProtocol;
  checklist: string[];
  alerts: string[];
  warnings: string[];
  justification: string;
  confidence: "alta" | "média" | "baixa";
}

// Mapeamento de cores VITA para clareamento (sincronizado com frontend)
const whiteningColorMap: Record<string, string[]> = {
  'A4': ['A3', 'A2'],
  'A3.5': ['A2', 'A1'],
  'A3': ['A2', 'A1'],
  'A2': ['A1', 'BL4'],
  'A1': ['BL4', 'BL3'],
  'B4': ['B3', 'B2'],
  'B3': ['B2', 'B1'],
  'B2': ['B1', 'A1'],
  'B1': ['A1', 'BL4'],
  'C4': ['C3', 'C2'],
  'C3': ['C2', 'C1'],
  'C2': ['C1', 'B1'],
  'C1': ['B1', 'A1'],
  'D4': ['D3', 'D2'],
  'D3': ['D2', 'A3'],
  'D2': ['A2', 'A1'],
  'BL4': ['BL3', 'BL2'],
  'BL3': ['BL2', 'BL1'],
  'BL2': ['BL1'],
  'BL1': [],
};

// Helper to get adjusted whitening colors
const getWhiteningColors = (baseColor: string): string[] => {
  const normalized = baseColor.toUpperCase().trim();
  return whiteningColorMap[normalized] || [];
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const reqId = generateRequestId();

  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(req);
  if (preflightResponse) return preflightResponse;

  logger.log(`[${reqId}] recommend-resin: start`);

  // Track credit state for refund on error (must be outside try for catch access)
  let creditsConsumed = false;
  let supabaseForRefund: ReturnType<typeof createClient> | null = null;
  let userIdForRefund: string | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401, corsHeaders);
    }

    // Create service role client for all operations
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    supabaseForRefund = supabaseService;

    // Verify user via getUser()
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseService.auth.getUser(token);

    if (authError || !user) {
      return createErrorResponse(ERROR_MESSAGES.INVALID_TOKEN, 401, corsHeaders);
    }

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

    // Check and consume credits
    const creditResult = await checkAndUseCredits(supabaseService, userId, "resin_recommendation", reqId);
    if (!creditResult.allowed) {
      logger.warn(`Insufficient credits for user ${userId} on resin_recommendation`);
      return createInsufficientCreditsResponse(creditResult, corsHeaders);
    }
    creditsConsumed = true;

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const inventoryResinIds = userInventory?.map((i) => i.resin_id) || [];
    const hasInventory = inventoryResinIds.length > 0;

    // Separate resins into inventory and non-inventory groups
    const inventoryResins = resins.filter((r) =>
      inventoryResinIds.includes(r.id)
    );
    const otherResins = resins.filter(
      (r) => !inventoryResinIds.includes(r.id)
    );

    // Group resins by price range for better budget-aware recommendations
    const groupResinsByPrice = (resinList: typeof resins) => ({
      economico: resinList.filter((r) => r.price_range === "Econômico"),
      intermediario: resinList.filter((r) => r.price_range === "Intermediário"),
      medioAlto: resinList.filter((r) => r.price_range === "Médio-alto"),
      premium: resinList.filter((r) => r.price_range === "Premium"),
    });

    // Get budget-appropriate resins based on user's budget selection
    const getBudgetAppropriateResins = (
      resinList: typeof resins,
      budget: string
    ) => {
      const groups = groupResinsByPrice(resinList);
      switch (budget) {
        case "padrão":
          return [...groups.economico, ...groups.intermediario, ...groups.medioAlto];
        case "premium":
          return resinList; // All resins available for premium budget
        default:
          return resinList;
      }
    };

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
          "claude-sonnet-4-5-20250929",
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
        if (creditsConsumed && supabaseForRefund && userIdForRefund) {
          await refundCredits(supabaseForRefund, userIdForRefund, "resin_recommendation", reqId);
          logger.log(`[${reqId}] Refunded resin_recommendation credits for user ${userIdForRefund} — empty AI response`);
        }
        return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
      }

      content = claudeResult.text;
    } catch (error) {
      if (error instanceof ClaudeError) {
        if (error.statusCode === 429) {
          if (creditsConsumed && supabaseForRefund && userIdForRefund) {
            await refundCredits(supabaseForRefund, userIdForRefund, "resin_recommendation", reqId);
          }
          return createErrorResponse(ERROR_MESSAGES.RATE_LIMITED, 429, corsHeaders, "RATE_LIMITED");
        }
        logger.error("Claude API error:", error.message);
      } else {
        logger.error("AI error:", error);
      }
      // Refund credits on AI errors
      if (creditsConsumed && supabaseForRefund && userIdForRefund) {
        await refundCredits(supabaseForRefund, userIdForRefund, "resin_recommendation", reqId);
        logger.log(`Refunded resin_recommendation credits for user ${userIdForRefund} due to AI error`);
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
      if (creditsConsumed && supabaseForRefund && userIdForRefund) {
        await refundCredits(supabaseForRefund, userIdForRefund, "resin_recommendation", reqId);
        logger.log(`[${reqId}] Refunded resin_recommendation credits for user ${userIdForRefund} — AI returned unparseable response`);
      }
      return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
    }

    // Validate response structure with Zod (covers empty layers/checklist via .min(1))
    try {
      parseAIResponse(RecommendResinResponseSchema, recommendation, 'recommend-resin');
    } catch {
      if (creditsConsumed && supabaseForRefund && userIdForRefund) {
        await refundCredits(supabaseForRefund, userIdForRefund, "resin_recommendation", reqId);
        logger.log(`[${reqId}] Refunded resin_recommendation credits for user ${userIdForRefund} — Zod validation failed`);
      }
      return createErrorResponse("Protocolo inválido — tente novamente", 500, corsHeaders);
    }

    // Validate and fix protocol layers against resin_catalog
    if (recommendation.protocol?.layers && Array.isArray(recommendation.protocol.layers)) {
      const validatedLayers = [];
      const validationAlerts: string[] = [];
      const shadeReplacements: Record<string, string> = {}; // Track all shade corrections for checklist sync

      // Check if patient requested whitening (BL shades)
      const wantsWhitening = data.aestheticGoals?.toLowerCase().includes('hollywood') ||
                             data.aestheticGoals?.toLowerCase().includes('bl1') ||
                             data.aestheticGoals?.toLowerCase().includes('bl2') ||
                             data.aestheticGoals?.toLowerCase().includes('bl3') ||
                             data.aestheticGoals?.toLowerCase().includes('intenso') ||
                             data.aestheticGoals?.toLowerCase().includes('notável');

      // Track if any layer uses a product line without BL shades
      let productLineWithoutBL: string | null = null;

      // ── Batch prefetch: single query replaces N+1 per-layer lookups ──
      const productLines = new Set<string>();
      for (const layer of recommendation.protocol.layers) {
        if (layer.shade === 'WT' && layer.resin_brand?.includes('Z350')) {
          shadeReplacements['WT'] = 'CT';
          layer.shade = 'CT';
        }
        const brandMatch = layer.resin_brand?.match(/^(.+?)\s*-\s*(.+)$/);
        const pl = brandMatch ? brandMatch[2].trim() : layer.resin_brand;
        if (pl) productLines.add(pl);
      }

      // Single DB call: fetch all catalog rows for every product line mentioned
      const catalogRows: Array<{ shade: string; type: string; product_line: string }> = [];
      if (productLines.size > 0) {
        // ilike OR chain: product_line ilike %line1% OR ilike %line2% ...
        const orFilter = Array.from(productLines)
          .map((pl) => `product_line.ilike.%${pl}%`)
          .join(",");
        const { data: rows } = await supabase
          .from("resin_catalog")
          .select("shade, type, product_line")
          .or(orFilter);
        if (rows) catalogRows.push(...rows);
      }

      // Build in-memory indexes for O(1) lookups
      // Index: (product_line_keyword, shade) → catalog row
      function matchesLine(catalogLine: string, keyword: string): boolean {
        return catalogLine.toLowerCase().includes(keyword.toLowerCase());
      }
      function getRowsForLine(keyword: string) {
        return catalogRows.filter((r) => matchesLine(r.product_line, keyword));
      }

      for (const layer of recommendation.protocol.layers) {
        const brandMatch = layer.resin_brand?.match(/^(.+?)\s*-\s*(.+)$/);
        const productLine = brandMatch ? brandMatch[2].trim() : layer.resin_brand;
        const layerType = layer.name?.toLowerCase() || '';

        if (productLine && layer.shade) {
          const lineRows = getRowsForLine(productLine);

          // Check if shade exists in the product line (was: per-layer DB query)
          const catalogMatch = lineRows.find((r) => r.shade === layer.shade);

          // For enamel layer, ensure we use specific enamel shades when available
          const isEnamelLayer = layerType.includes('esmalte') || layerType.includes('enamel');

          if (isEnamelLayer) {
            const enamelShades = lineRows.filter((r) =>
              r.type?.toLowerCase().includes('esmalte')
            );

            if (enamelShades.length > 0) {
              const currentIsUniversal = !['WE', 'CE', 'JE', 'CT', 'Trans', 'IT', 'TN', 'Opal', 'INC'].some(
                prefix => layer.shade.toUpperCase().includes(prefix)
              );

              if (currentIsUniversal) {
                const preferredOrder = ['WE', 'CE', 'JE', 'CT', 'Trans'];
                let bestEnamel = enamelShades[0];

                for (const pref of preferredOrder) {
                  const found = enamelShades.find(e => e.shade.toUpperCase().includes(pref));
                  if (found) {
                    bestEnamel = found;
                    break;
                  }
                }

                const originalShade = layer.shade;
                layer.shade = bestEnamel.shade;
                shadeReplacements[originalShade] = bestEnamel.shade;
                validationAlerts.push(
                  `Camada de esmalte otimizada: ${originalShade} → ${bestEnamel.shade} para máxima translucidez incisal.`
                );
                logger.warn(`Enamel optimization: ${originalShade} → ${bestEnamel.shade} for ${productLine}`);
              }
            }
          }

          // Check if patient wants BL but product line doesn't have it (in-memory check)
          if (wantsWhitening && !productLineWithoutBL) {
            const hasBL = lineRows.some(
              (r) => /bl|bianco/i.test(r.shade)
            );
            if (!hasBL) {
              productLineWithoutBL = productLine;
            }
          }

          if (!catalogMatch) {
            // Shade doesn't exist - find appropriate alternative from cached rows
            let typeFilter = '';
            if (layerType.includes('opaco') || layerType.includes('mascaramento')) {
              typeFilter = 'opaco';
            } else if (layerType.includes('dentina') || layerType.includes('body')) {
              typeFilter = 'universal';
            } else if (isEnamelLayer) {
              typeFilter = 'esmalte';
            }

            const alternatives = typeFilter
              ? lineRows.filter((r) => r.type?.toLowerCase().includes(typeFilter)).slice(0, 5)
              : lineRows.slice(0, 5);

            if (alternatives.length > 0) {
              const originalShade = layer.shade;
              const baseShade = originalShade.replace(/^O/, '').replace(/[DE]$/, '');
              const closestAlt = alternatives.find(a => a.shade.includes(baseShade)) || alternatives[0];

              layer.shade = closestAlt.shade;
              shadeReplacements[originalShade] = closestAlt.shade;
              validationAlerts.push(
                `Cor ${originalShade} substituída por ${closestAlt.shade}: a cor original não está disponível na linha ${productLine}.`
              );
              logger.warn(`Shade validation: ${originalShade} → ${closestAlt.shade} for ${productLine}`);
            } else {
              logger.warn(`No valid shades found for ${productLine}, keeping original: ${layer.shade}`);
            }
          }
        }

        validatedLayers.push(layer);
      }
      
      // Add BL availability alert if needed
      if (wantsWhitening && productLineWithoutBL) {
        validationAlerts.push(
          `A linha ${productLineWithoutBL} não possui cores BL (Bleach). Para atingir nível de clareamento Hollywood, considere linhas como Palfique LX5, Forma (Ultradent) ou Estelite Bianco que oferecem cores BL.`
        );
        logger.warn(`BL shades not available in ${productLineWithoutBL}, patient wants whitening`);
      }
      
      // Update layers with validated versions
      recommendation.protocol.layers = validatedLayers;

      // Apply ALL shade replacements to checklist text so steps match validated layers
      if (recommendation.protocol.checklist && Object.keys(shadeReplacements).length > 0) {
        logger.log(`Applying ${Object.keys(shadeReplacements).length} shade replacements to checklist: ${JSON.stringify(shadeReplacements)}`);
        recommendation.protocol.checklist = recommendation.protocol.checklist.map(
          (item: string) => {
            if (typeof item !== 'string') return item;
            let fixed = item;
            for (const [original, replacement] of Object.entries(shadeReplacements)) {
              // Use word-boundary regex to avoid partial matches (e.g., "A1E" inside "DA1E")
              fixed = fixed.replace(new RegExp(`\\b${original}\\b`, 'g'), replacement);
            }
            return fixed;
          }
        );
      }

      // Add validation alerts to protocol alerts (with deduplication)
      if (validationAlerts.length > 0) {
        const existingAlerts: string[] = recommendation.protocol.alerts || [];
        // Filter out validation alerts that duplicate AI-generated ones
        const newAlerts = validationAlerts.filter((va: string) => {
          const vaLower = va.toLowerCase();
          return !existingAlerts.some((ea: string) => {
            const eaLower = ea.toLowerCase();
            // Both mention BL/bleach for same concept = duplicate
            return (vaLower.includes('bl') || vaLower.includes('bleach')) &&
                   (eaLower.includes('bl') || eaLower.includes('bleach'));
          });
        });
        recommendation.protocol.alerts = [...existingAlerts, ...newAlerts];
      }
    }

    // Post-AI inventory validation: ensure recommended resin is from inventory
    if (hasInventory && recommendation.recommended_resin_name) {
      const recNameLower = recommendation.recommended_resin_name.toLowerCase();
      const isInInventory = inventoryResins.some(
        (r) => r.name.toLowerCase() === recNameLower
      );
      if (!isInInventory) {
        logger.warn(`AI ignored inventory! Recommended "${recommendation.recommended_resin_name}" is NOT in user inventory. Attempting fallback...`);
        // Find best inventory match based on budget
        const fallback = budgetAppropriateInventory[0] || inventoryResins[0];
        if (fallback) {
          recommendation.ideal_resin_name = recommendation.recommended_resin_name;
          recommendation.ideal_reason = `Resina ideal tecnicamente, mas não está no seu inventário. Usando ${fallback.name} do inventário como alternativa.`;
          recommendation.recommended_resin_name = fallback.name;
          recommendation.is_from_inventory = true;
          logger.log(`Inventory fallback: "${fallback.name}" (${fallback.manufacturer})`);
        }
      } else {
        // Ensure is_from_inventory is correctly set
        recommendation.is_from_inventory = true;
      }
    }

    // Log budget compliance for debugging
    logger.log(`Budget: ${data.budget}, Recommended: ${recommendation.recommended_resin_name}, Price Range: ${recommendation.price_range}, Budget Compliant: ${recommendation.budget_compliance}`);

    // Find the recommended resin in database
    const recommendedResin = resins.find(
      (r) =>
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
        (r) =>
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
      console.error("Database error saving result:", updateError);
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
