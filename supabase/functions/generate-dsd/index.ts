import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreFlight, createErrorResponse, ERROR_MESSAGES } from "../_shared/cors.ts";

// DSD Analysis interface
interface DSDAnalysis {
  facial_midline: "centrada" | "desviada_esquerda" | "desviada_direita";
  dental_midline: "alinhada" | "desviada_esquerda" | "desviada_direita";
  smile_line: "alta" | "média" | "baixa";
  buccal_corridor: "adequado" | "excessivo" | "ausente";
  occlusal_plane: "nivelado" | "inclinado_esquerda" | "inclinado_direita";
  golden_ratio_compliance: number;
  symmetry_score: number;
  suggestions: {
    tooth: string;
    current_issue: string;
    proposed_change: string;
  }[];
  observations: string[];
  confidence: "alta" | "média" | "baixa";
}

interface DSDResult {
  analysis: DSDAnalysis;
  simulation_url: string | null;
}

// Validate request
function validateRequest(data: unknown): { success: boolean; error?: string; data?: { imageBase64: string; evaluationId?: string } } {
  if (!data || typeof data !== "object") {
    return { success: false, error: "Dados inválidos" };
  }

  const req = data as Record<string, unknown>;

  if (!req.imageBase64 || typeof req.imageBase64 !== "string") {
    return { success: false, error: "Imagem não fornecida" };
  }

  // Validate base64 format
  const base64Pattern = /^data:image\/(jpeg|jpg|png|webp);base64,/;
  if (!base64Pattern.test(req.imageBase64)) {
    return { success: false, error: ERROR_MESSAGES.IMAGE_FORMAT_UNSUPPORTED };
  }

  return {
    success: true,
    data: {
      imageBase64: req.imageBase64,
      evaluationId: typeof req.evaluationId === "string" ? req.evaluationId : undefined,
    },
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreFlight(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    // Get API keys
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing required environment variables");
      return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
    }

    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401, corsHeaders);
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Validate user token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return createErrorResponse(ERROR_MESSAGES.INVALID_TOKEN, 401, corsHeaders);
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = validateRequest(body);

    if (!validation.success || !validation.data) {
      return createErrorResponse(validation.error || ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
    }

    const { imageBase64, evaluationId } = validation.data;

    // === STEP 1: Analyze facial proportions ===
    const analysisPrompt = `Você é um especialista em Digital Smile Design (DSD) e Odontologia Estética.
Analise esta foto de sorriso/face do paciente e forneça uma análise detalhada das proporções faciais e dentárias.

ANÁLISE OBRIGATÓRIA:
1. **Linha Média Facial**: Determine se a linha média facial está centrada ou desviada
2. **Linha Média Dental**: Avalie se os incisivos centrais superiores estão alinhados com a linha média facial
3. **Linha do Sorriso**: Classifique a exposição gengival (alta, média, baixa)
4. **Corredor Bucal**: Avalie o espaço escuro lateral ao sorrir
5. **Plano Oclusal**: Verifique se está nivelado ou inclinado
6. **Proporção Dourada**: Calcule a conformidade com a proporção áurea (0-100%)
7. **Simetria**: Avalie a simetria geral do sorriso (0-100%)

SUGESTÕES:
Para cada dente que poderia ser melhorado esteticamente, forneça:
- Número do dente (notação universal: 11-48)
- Problema atual identificado
- Mudança proposta para harmonização

OBSERVAÇÕES:
Inclua observações gerais sobre o sorriso e recomendações de tratamento.

IMPORTANTE:
- Seja objetivo e clínico
- Base suas análises em princípios de DSD estabelecidos
- Considere a proporção dourada (1:0.618)
- Avalie tanto a estética quanto a função`;

    const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: analysisPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analise esta foto e retorne a análise DSD completa usando a ferramenta analyze_dsd." },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_dsd",
              description: "Retorna a análise completa do Digital Smile Design",
              parameters: {
                type: "object",
                properties: {
                  facial_midline: {
                    type: "string",
                    enum: ["centrada", "desviada_esquerda", "desviada_direita"],
                    description: "Posição da linha média facial",
                  },
                  dental_midline: {
                    type: "string",
                    enum: ["alinhada", "desviada_esquerda", "desviada_direita"],
                    description: "Alinhamento da linha média dental com a facial",
                  },
                  smile_line: {
                    type: "string",
                    enum: ["alta", "média", "baixa"],
                    description: "Classificação da linha do sorriso",
                  },
                  buccal_corridor: {
                    type: "string",
                    enum: ["adequado", "excessivo", "ausente"],
                    description: "Avaliação do corredor bucal",
                  },
                  occlusal_plane: {
                    type: "string",
                    enum: ["nivelado", "inclinado_esquerda", "inclinado_direita"],
                    description: "Orientação do plano oclusal",
                  },
                  golden_ratio_compliance: {
                    type: "number",
                    minimum: 0,
                    maximum: 100,
                    description: "Conformidade com proporção dourada (0-100%)",
                  },
                  symmetry_score: {
                    type: "number",
                    minimum: 0,
                    maximum: 100,
                    description: "Score de simetria do sorriso (0-100%)",
                  },
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        tooth: { type: "string", description: "Número do dente (11-48)" },
                        current_issue: { type: "string", description: "Problema identificado" },
                        proposed_change: { type: "string", description: "Mudança proposta" },
                      },
                      required: ["tooth", "current_issue", "proposed_change"],
                    },
                    description: "Sugestões de tratamento por dente",
                  },
                  observations: {
                    type: "array",
                    items: { type: "string" },
                    description: "Observações gerais sobre o sorriso",
                  },
                  confidence: {
                    type: "string",
                    enum: ["alta", "média", "baixa"],
                    description: "Confiança na análise",
                  },
                },
                required: [
                  "facial_midline",
                  "dental_midline",
                  "smile_line",
                  "buccal_corridor",
                  "occlusal_plane",
                  "golden_ratio_compliance",
                  "symmetry_score",
                  "suggestions",
                  "observations",
                  "confidence",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_dsd" } },
      }),
    });

    if (!analysisResponse.ok) {
      const status = analysisResponse.status;
      if (status === 429) {
        return createErrorResponse(ERROR_MESSAGES.RATE_LIMITED, 429, corsHeaders, "RATE_LIMITED");
      }
      if (status === 402) {
        return createErrorResponse(ERROR_MESSAGES.PAYMENT_REQUIRED, 402, corsHeaders, "PAYMENT_REQUIRED");
      }
      console.error("AI analysis error:", status, await analysisResponse.text());
      return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
    }

    const analysisData = await analysisResponse.json();
    
    // Extract analysis from tool call
    let analysis: DSDAnalysis;
    const toolCall = analysisData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      try {
        analysis = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error("Failed to parse tool call arguments");
        return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
      }
    } else {
      console.error("No tool call in response");
      return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
    }

    // === STEP 2: Generate simulation image ===
    let simulationUrl: string | null = null;

    try {
      const simulationPrompt = `Baseado na análise DSD, edite esta foto do sorriso para mostrar uma SIMULAÇÃO do resultado ideal:

MODIFICAÇÕES A APLICAR:
${analysis.suggestions.map((s) => `- Dente ${s.tooth}: ${s.proposed_change}`).join("\n")}

DIRETRIZES:
- Mantenha a naturalidade do sorriso
- Melhore a simetria dental
- Aplique proporção dourada aos incisivos
- Mantenha características pessoais do paciente
- Resultado deve parecer natural, não artificial
- NÃO mude a cor da pele ou características faciais
- Foque APENAS nos dentes e sorriso

Crie uma visualização realista do resultado do tratamento estético dental.`;

      const simulationResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: simulationPrompt },
                { type: "image_url", image_url: { url: imageBase64 } },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (simulationResponse.ok) {
        const simData = await simulationResponse.json();
        const generatedImage = simData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (generatedImage) {
          // Upload simulation to storage
          const base64Data = generatedImage.replace(/^data:image\/\w+;base64,/, "");
          const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
          
          const fileName = `${user.id}/dsd_simulation_${Date.now()}.png`;
          
          const { error: uploadError } = await supabase.storage
            .from("dsd-simulations")
            .upload(fileName, binaryData, {
              contentType: "image/png",
              upsert: true,
            });

          if (!uploadError) {
            simulationUrl = fileName;
          } else {
            console.error("Upload error:", uploadError);
          }
        }
      } else {
        console.warn("Simulation generation failed, continuing without simulation");
      }
    } catch (simError) {
      console.error("Simulation error:", simError);
      // Continue without simulation - analysis is still valid
    }

    // === STEP 3: Update evaluation if provided ===
    if (evaluationId) {
      // Verify ownership
      const { data: evalData, error: evalError } = await supabase
        .from("evaluations")
        .select("user_id")
        .eq("id", evaluationId)
        .single();

      if (evalError || !evalData) {
        console.error("Evaluation not found:", evaluationId);
      } else if (evalData.user_id !== user.id) {
        console.error("User does not own evaluation");
      } else {
        // Update evaluation with DSD data
        await supabase
          .from("evaluations")
          .update({
            dsd_analysis: analysis,
            dsd_simulation_url: simulationUrl,
          })
          .eq("id", evaluationId);
      }
    }

    // Return result
    const result: DSDResult = {
      analysis,
      simulation_url: simulationUrl,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("DSD generation error:", error);
    return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
  }
});
