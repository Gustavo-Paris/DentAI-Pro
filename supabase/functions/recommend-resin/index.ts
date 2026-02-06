import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreFlight, ERROR_MESSAGES, createErrorResponse } from "../_shared/cors.ts";
import { validateEvaluationData, type EvaluationData } from "../_shared/validation.ts";
import { logger } from "../_shared/logger.ts";
import { callGemini, GeminiError, type OpenAIMessage } from "../_shared/gemini.ts";
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { getPrompt } from "../_shared/prompts/registry.ts";
import { withMetrics } from "../_shared/prompts/index.ts";
import type { Params as RecommendResinParams } from "../_shared/prompts/definitions/recommend-resin.ts";
import { createSupabaseMetrics, PROMPT_VERSION } from "../_shared/metrics-adapter.ts";

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
  
  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(req);
  if (preflightResponse) return preflightResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401, corsHeaders);
    }

    // Create client with user's auth token to verify claims
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return createErrorResponse(ERROR_MESSAGES.INVALID_TOKEN, 401, corsHeaders);
    }

    const userId = claimsData.claims.sub as string;

    // Check rate limit (AI_LIGHT: 20/min, 100/hour, 500/day)
    const supabaseService = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
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
        case "econômico":
          return [...groups.economico, ...groups.intermediario];
        case "moderado":
          return [...groups.intermediario, ...groups.medioAlto];
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
    const promptParams: RecommendResinParams = {
      patientAge: data.patientAge,
      tooth: data.tooth,
      region: data.region,
      cavityClass: data.cavityClass,
      restorationSize: data.restorationSize,
      depth: data.depth,
      substrate: data.substrate,
      substrateCondition: data.substrateCondition,
      enamelCondition: data.enamelCondition,
      aestheticLevel: data.aestheticLevel,
      toothColor: data.toothColor,
      stratificationNeeded: data.stratificationNeeded,
      bruxism: data.bruxism,
      longevityExpectation: data.longevityExpectation,
      budget: data.budget,
      clinicalNotes: data.clinicalNotes,
      aestheticGoals: data.aestheticGoals,
      allGroups,
      hasInventory,
      budgetAppropriateInventory,
      inventoryResins,
      contralateralProtocol,
      contralateralTooth,
    };

    const prompt = promptDef.user(promptParams);

    // Metrics setup
    const metrics = createSupabaseMetrics(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Call Gemini API
    const messages: OpenAIMessage[] = [
      { role: "user", content: prompt },
    ];

    let content: string;
    try {
      const geminiResult = await withMetrics<{ text: string | null; finishReason: string }>(metrics, promptDef.id, PROMPT_VERSION, promptDef.model)(async () => {
        const response = await callGemini(
          "gemini-2.0-flash",
          messages,
          {
            temperature: 0.3,
            maxTokens: 8192,
          }
        );
        return {
          result: response,
          tokensIn: 0,
          tokensOut: 0,
        };
      });

      if (!geminiResult.text) {
        logger.error("Empty response from Gemini");
        return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
      }

      content = geminiResult.text;
    } catch (error) {
      if (error instanceof GeminiError) {
        if (error.statusCode === 429) {
          return createErrorResponse(ERROR_MESSAGES.RATE_LIMITED, 429, corsHeaders, "RATE_LIMITED");
        }
        logger.error("Gemini API error:", error.message);
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

    // Validate that protocol is not empty
    if (recommendation.protocol?.layers?.length === 0 || !recommendation.protocol?.checklist?.length) {
      logger.error("AI returned empty protocol, protocol:", JSON.stringify(recommendation.protocol));
      return createErrorResponse("Protocolo vazio — tente novamente", 500, corsHeaders);
    }

    // Validate and fix protocol layers against resin_catalog
    if (recommendation.protocol?.layers && Array.isArray(recommendation.protocol.layers)) {
      const validatedLayers = [];
      const validationAlerts: string[] = [];
      const shadeReplacements: Record<string, string> = {}; // Track all shade corrections for checklist sync
      
      // Check if patient requested whitening (BL shades)
      // Exclude broad terms like 'clareamento' and 'branco' that trigger for Natural level
      const wantsWhitening = data.aestheticGoals?.toLowerCase().includes('hollywood') ||
                             data.aestheticGoals?.toLowerCase().includes('bl1') ||
                             data.aestheticGoals?.toLowerCase().includes('bl2') ||
                             data.aestheticGoals?.toLowerCase().includes('bl3') ||
                             data.aestheticGoals?.toLowerCase().includes('intenso') ||
                             data.aestheticGoals?.toLowerCase().includes('notável');
      
      // Track if any layer uses a product line without BL shades
      let productLineWithoutBL: string | null = null;
      
      for (const layer of recommendation.protocol.layers) {
        // Normalize invalid Z350 shades: WT does not exist in Z350 XT line
        if (layer.shade === 'WT' && layer.resin_brand?.includes('Z350')) {
          logger.warn(`Shade normalization: WT → CT for ${layer.resin_brand} (WT does not exist in Z350 XT)`);
          shadeReplacements['WT'] = 'CT';
          layer.shade = 'CT';
        }

        // Extract product line from resin_brand (format: "Fabricante - Linha")
        const brandMatch = layer.resin_brand?.match(/^(.+?)\s*-\s*(.+)$/);
        const productLine = brandMatch ? brandMatch[2].trim() : layer.resin_brand;
        const layerType = layer.name?.toLowerCase() || '';
        
        if (productLine && layer.shade) {
          // Check if shade exists in the product line
          const { data: catalogMatch } = await supabase
            .from('resin_catalog')
            .select('shade, type, product_line')
            .ilike('product_line', `%${productLine}%`)
            .eq('shade', layer.shade)
            .limit(1);
          
          // For enamel layer, ensure we use specific enamel shades when available
          const isEnamelLayer = layerType.includes('esmalte') || layerType.includes('enamel');
          
          if (isEnamelLayer) {
            // Check if the product line has specific enamel shades
            const { data: enamelShades } = await supabase
              .from('resin_catalog')
              .select('shade, type')
              .ilike('product_line', `%${productLine}%`)
              .ilike('type', '%Esmalte%')
              .limit(10);
            
            // If enamel shades exist but current shade is Universal, suggest enamel shade
            if (enamelShades && enamelShades.length > 0) {
              const currentIsUniversal = !['WE', 'CE', 'JE', 'CT', 'Trans', 'IT', 'TN', 'Opal', 'INC'].some(
                prefix => layer.shade.toUpperCase().includes(prefix)
              );
              
              if (currentIsUniversal) {
                // Find preferred enamel shade (WE > CE > others)
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
          
          // Check if patient wants BL but product line doesn't have it
          if (wantsWhitening && !productLineWithoutBL) {
            const { data: blShades } = await supabase
              .from('resin_catalog')
              .select('shade')
              .ilike('product_line', `%${productLine}%`)
              .or('shade.ilike.%BL%,shade.ilike.%Bianco%')
              .limit(1);
            
            if (!blShades || blShades.length === 0) {
              productLineWithoutBL = productLine;
            }
          }
          
          if (!catalogMatch || catalogMatch.length === 0) {
            // Shade doesn't exist - find appropriate alternative
            let typeFilter = '';
            
            // Determine appropriate type based on layer name
            if (layerType.includes('opaco') || layerType.includes('mascaramento')) {
              typeFilter = 'Opaco';
            } else if (layerType.includes('dentina') || layerType.includes('body')) {
              typeFilter = 'Universal'; // Universal/Body shades for dentin
            } else if (isEnamelLayer) {
              typeFilter = 'Esmalte';
            }
            
            // Find alternative shades in the same product line
            let alternativeQuery = supabase
              .from('resin_catalog')
              .select('shade, type, product_line')
              .ilike('product_line', `%${productLine}%`);
            
            if (typeFilter) {
              alternativeQuery = alternativeQuery.ilike('type', `%${typeFilter}%`);
            }
            
            const { data: alternatives } = await alternativeQuery.limit(5);
            
            if (alternatives && alternatives.length > 0) {
              const originalShade = layer.shade;

              // Try to find the closest shade based on the original
              const baseShade = originalShade.replace(/^O/, '').replace(/[DE]$/, '');
              const closestAlt = alternatives.find(a => a.shade.includes(baseShade)) || alternatives[0];

              layer.shade = closestAlt.shade;
              shadeReplacements[originalShade] = closestAlt.shade;
              validationAlerts.push(
                `Cor ${originalShade} substituída por ${closestAlt.shade}: a cor original não está disponível na linha ${productLine}.`
              );
              logger.warn(`Shade validation: ${originalShade} → ${closestAlt.shade} for ${productLine}`);
            } else {
              // No alternatives found in this product line - log warning
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
    console.error("Error:", error);
    return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
  }
});
