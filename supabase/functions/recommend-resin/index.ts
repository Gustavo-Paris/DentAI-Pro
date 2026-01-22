import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreFlight, ERROR_MESSAGES, createErrorResponse } from "../_shared/cors.ts";
import { validateEvaluationData, type EvaluationData } from "../_shared/validation.ts";

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

interface StratificationProtocol {
  layers: ProtocolLayer[];
  alternative: ProtocolAlternative;
  checklist: string[];
  alerts: string[];
  warnings: string[];
  justification: string;
  confidence: "alta" | "média" | "baixa";
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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

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

    // Parse and validate input
    let rawData: unknown;
    try {
      rawData = await req.json();
    } catch {
      return createErrorResponse(ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
    }

    const validation = validateEvaluationData(rawData);
    if (!validation.success || !validation.data) {
      console.error("Validation failed:", validation.error);
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
      console.error("Database error fetching resins:", resinsError);
      return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
    }

    // Fetch user's inventory
    const { data: userInventory, error: inventoryError } = await supabase
      .from("user_inventory")
      .select("resin_id")
      .eq("user_id", data.userId);

    if (inventoryError) {
      console.error("Error fetching inventory:", inventoryError);
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

    // Build prompt for AI with inventory awareness
    const formatResinList = (resinList: typeof resins) =>
      resinList
        .map(
          (r) => `
- ${r.name} (${r.manufacturer})
  Tipo: ${r.type}
  Indicações: ${r.indications.join(", ")}
  Opacidade: ${r.opacity}
  Resistência: ${r.resistance}
  Polimento: ${r.polishing}
  Estética: ${r.aesthetics}
  Faixa de preço: ${r.price_range}
  Descrição: ${r.description || "N/A"}
`
        )
        .join("\n");

    const inventorySection = hasInventory
      ? `
=== RESINAS NO INVENTÁRIO DO DENTISTA (PRIORIZAR) ===
${formatResinList(inventoryResins)}

=== OUTRAS RESINAS DISPONÍVEIS ===
${formatResinList(otherResins)}`
      : `
=== RESINAS DISPONÍVEIS ===
${formatResinList(resins)}

NOTA: O dentista ainda não cadastrou seu inventário. Recomende a melhor opção geral.`;

    const inventoryInstructions = hasInventory
      ? `
INSTRUÇÕES IMPORTANTES:
1. Primeiro, identifique a resina TECNICAMENTE IDEAL para este caso específico
2. Verifique se a resina ideal está no inventário do dentista
3. Se a ideal ESTIVER no inventário: recomende-a como principal
4. Se a ideal NÃO estiver no inventário: 
   - Encontre a MELHOR ALTERNATIVA do inventário que seja clinicamente adequada
   - Recomende essa alternativa como principal
   - Inclua a resina ideal nas informações para que o dentista possa considerar adquiri-la
5. Se NENHUMA resina do inventário for clinicamente adequada: recomende a ideal externa
6. Sempre priorize resinas do inventário quando forem clinicamente aceitáveis`
      : `
INSTRUÇÕES:
1. Identifique a resina tecnicamente ideal para este caso
2. Recomende-a como principal
3. Sugira alternativas relevantes`;

    const prompt = `Você é um especialista em materiais dentários e técnicas restauradoras. Analise o caso clínico abaixo e forneça uma recomendação COMPLETA com protocolo de estratificação.

CASO CLÍNICO:
- Idade do paciente: ${data.patientAge} anos
- Dente: ${data.tooth}
- Região: ${data.region}
- Classe da cavidade: ${data.cavityClass}
- Tamanho da restauração: ${data.restorationSize}
- Profundidade: ${data.depth || "Não especificada"}
- Substrato: ${data.substrate}
- Condição do substrato: ${data.substrateCondition || "Normal"}
- Nível estético: ${data.aestheticLevel}
- Cor do dente (VITA): ${data.toothColor}
- Necessita estratificação: ${data.stratificationNeeded ? "Sim" : "Não"}
- Bruxismo: ${data.bruxism ? "Sim" : "Não"}
- Expectativa de longevidade: ${data.longevityExpectation}
- Orçamento: ${data.budget}
${inventorySection}
${inventoryInstructions}

INSTRUÇÕES PARA PROTOCOLO DE ESTRATIFICAÇÃO:
1. Se o substrato estiver escurecido/manchado, SEMPRE inclua camada de opaco
2. Para casos estéticos (anteriores), use 3 camadas: Opaco (se necessário), Dentina, Esmalte
3. Para posteriores com alta demanda estética, considere estratificação
4. Para posteriores simples, pode recomendar técnica bulk ou incrementos simples
5. Adapte as cores das camadas baseado na cor VITA informada (ex: A2 → OA2 opaco, A2D dentina, A2E esmalte)

Responda em formato JSON:
{
  "recommended_resin_name": "nome exato da resina recomendada",
  "is_from_inventory": true ou false,
  "ideal_resin_name": "nome da resina ideal se diferente (null se igual)",
  "ideal_reason": "explicação se ideal for diferente (null se não aplicável)",
  "justification": "explicação detalhada de 2-3 frases",
  "inventory_alternatives": [
    {"name": "...", "manufacturer": "...", "reason": "..."}
  ],
  "external_alternatives": [
    {"name": "...", "manufacturer": "...", "reason": "..."}
  ],
  "protocol": {
    "layers": [
      {
        "order": 1,
        "name": "Nome da camada (Opaco/Dentina/Esmalte/Body/Bulk)",
        "resin_brand": "Marca da resina",
        "shade": "Cor específica (ex: OA2, A2D, A2E)",
        "thickness": "Espessura recomendada (ex: 0.3-0.5mm)",
        "purpose": "Objetivo desta camada",
        "technique": "Técnica de aplicação"
      }
    ],
    "alternative": {
      "resin": "Resina alternativa para técnica simplificada",
      "shade": "Cor única",
      "technique": "Descrição da técnica alternativa",
      "tradeoff": "O que se perde com esta alternativa"
    },
    "checklist": [
      "Passo 1: Profilaxia...",
      "Passo 2: Seleção de cor...",
      "..."
    ],
    "alerts": [
      "Alerta condicional 1",
      "Alerta condicional 2"
    ],
    "warnings": [
      "NÃO fazer X",
      "NÃO fazer Y"
    ],
    "confidence": "alta/média/baixa"
  }
}

Responda APENAS com o JSON, sem texto adicional.`;

    // Call Lovable AI Gateway
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 1500,
        }),
      }
    );

    if (!aiResponse.ok) {
      console.error("AI API error:", aiResponse.status);
      
      if (aiResponse.status === 429) {
        return createErrorResponse(ERROR_MESSAGES.RATE_LIMITED, 429, corsHeaders, "RATE_LIMITED");
      }
      if (aiResponse.status === 402) {
        return createErrorResponse(ERROR_MESSAGES.PAYMENT_REQUIRED, 402, corsHeaders, "PAYMENT_REQUIRED");
      }
      
      return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices[0].message.content;

    // Parse JSON from AI response
    let recommendation;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response");
      return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
    }

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
