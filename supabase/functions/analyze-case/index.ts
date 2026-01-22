import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreFlight, ERROR_MESSAGES, createErrorResponse } from "../_shared/cors.ts";
import { validateCaseData, type CaseData } from "../_shared/validation.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(req);
  if (preflightResponse) return preflightResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate input
    let rawData: unknown;
    try {
      rawData = await req.json();
    } catch {
      return createErrorResponse(ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
    }

    const validation = validateCaseData(rawData);
    if (!validation.success || !validation.data) {
      console.error("Validation failed:", validation.error);
      return createErrorResponse(validation.error || ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
    }

    const caseData: CaseData = validation.data;

    // Fetch all resins from catalog
    const { data: resins, error: resinsError } = await supabase
      .from("resin_catalog")
      .select("*");

    if (resinsError) {
      console.error("Database error fetching resins:", resinsError);
      return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
    }

    // Build the prompt for AI
    const prompt = `Você é um especialista em odontologia restauradora. Analise o caso clínico a seguir e recomende a melhor resina composta do catálogo disponível.

CASO CLÍNICO:
- Idade do paciente: ${caseData.patientAge} anos
- Dente: ${caseData.toothNumber} (${caseData.toothRegion})
- Classe de cavidade: Classe ${caseData.cavityClass}
- Tamanho da restauração: ${caseData.restorationSize}
- Substrato predominante: ${caseData.substrate}
- Bruxismo: ${caseData.hasBruxism ? "Sim" : "Não"}
- Nível de exigência estética: ${caseData.aestheticLevel}
- Cor do dente: ${caseData.toothShade}
- Necessita estratificação: ${caseData.needsStratification ? "Sim" : "Não"}
${caseData.clinicalNotes ? `- Observações: ${caseData.clinicalNotes}` : ""}

CATÁLOGO DE RESINAS DISPONÍVEIS:
${resins?.map((r) => `
- ${r.name} (${r.manufacturer})
  Tipo: ${r.type}
  Estética: ${r.aesthetics}
  Resistência: ${r.resistance}
  Polimento: ${r.polishing}
  Opacidade: ${r.opacity}
  Faixa de preço: ${r.price_range}
  Indicações: ${r.indications?.join(", ")}
`).join("\n")}

Responda APENAS em formato JSON válido com a seguinte estrutura:
{
  "recommended_resin": "Nome exato da resina recomendada",
  "justification": "Justificativa técnica detalhada para a escolha (2-3 parágrafos)",
  "alternatives": [
    {
      "resin_name": "Nome da alternativa 1",
      "manufacturer": "Fabricante",
      "reason": "Razão para ser uma boa alternativa"
    },
    {
      "resin_name": "Nome da alternativa 2",
      "manufacturer": "Fabricante",
      "reason": "Razão para ser uma boa alternativa"
    }
  ],
  "protocol": {
    "preparation": ["Passo 1 do preparo cavitário", "Passo 2..."],
    "conditioning": ["Passo 1 do condicionamento", "Passo 2..."],
    "adhesive": ["Passo 1 do sistema adesivo", "Passo 2..."],
    "application": ["Passo 1 da aplicação da resina", "Passo 2..."],
    "finishing": ["Passo 1 do acabamento e polimento", "Passo 2..."]
  },
  "confidence_level": 85
}`;

    // Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai-gateway.lovable.dev/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em odontologia restauradora com amplo conhecimento em resinas compostas. Responda sempre em JSON válido.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

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
    const content = aiResult.choices[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response");
      return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
    }

    // Parse the AI response
    let recommendation;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing AI response");
      return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
    }

    // Find the recommended resin in the catalog
    const recommendedResin = resins?.find(
      (r) => r.name.toLowerCase() === recommendation.recommended_resin.toLowerCase()
    );

    if (!recommendedResin) {
      console.error("Recommended resin not found:", recommendation.recommended_resin);
      // Use the first resin as fallback
      if (resins && resins.length > 0) {
        recommendation.recommended_resin = resins[0].name;
      }
    }

    const finalResin = recommendedResin || resins?.[0];

    // Save the result to database
    const { error: resultError } = await supabase
      .from("case_results")
      .insert({
        case_id: caseData.caseId,
        recommended_resin_id: finalResin?.id,
        recommendation_text: recommendation.justification,
        alternatives: recommendation.alternatives,
        protocol: recommendation.protocol,
        confidence_level: recommendation.confidence_level || 80,
      });

    if (resultError) {
      console.error("Error saving result:", resultError);
      return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
    }

    // Update case status
    await supabase
      .from("cases")
      .update({ status: "completed" })
      .eq("id", caseData.caseId);

    return new Response(
      JSON.stringify({
        success: true,
        recommendation: {
          resin: finalResin,
          justification: recommendation.justification,
          alternatives: recommendation.alternatives,
          protocol: recommendation.protocol,
          confidence_level: recommendation.confidence_level,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in analyze-case function:", error);

    // Try to update case status to error
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const caseData = await req.clone().json();
      if (caseData.caseId) {
        await supabase
          .from("cases")
          .update({ status: "error" })
          .eq("id", caseData.caseId);
      }
    } catch (e) {
      console.error("Error updating case status:", e);
    }

    return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
  }
});
