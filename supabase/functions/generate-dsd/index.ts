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

interface RequestData {
  imageBase64: string;
  evaluationId?: string;
  regenerateSimulationOnly?: boolean;
  existingAnalysis?: DSDAnalysis;
}

// Validate request
function validateRequest(data: unknown): { success: boolean; error?: string; data?: RequestData } {
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
      regenerateSimulationOnly: req.regenerateSimulationOnly === true,
      existingAnalysis: req.existingAnalysis as DSDAnalysis | undefined,
    },
  };
}

// Generate simulation image
async function generateSimulation(
  imageBase64: string,
  analysis: DSDAnalysis,
  userId: string,
  supabase: any,
  apiKey: string
): Promise<string | null> {
  const simulationPrompt = `Você é um especialista em Digital Smile Design (DSD) e Mock-up Digital.

OBJETIVO: Criar uma simulação FOTORREALISTA de como ficaria o sorriso após tratamento com lentes de contato dental.

🚨 REGRA CRÍTICA - MÁSCARA DE ENQUADRAMENTO 🚨

A foto original tem um "enquadramento" definido pelos lábios e tecidos moles.
Este enquadramento é uma MÁSCARA INTOCÁVEL. Você só pode modificar os DENTES VISÍVEIS dentro desta máscara.

PROIBIDO ABSOLUTAMENTE:
- ❌ Mover, levantar ou alterar a posição dos lábios
- ❌ Aumentar a área de exposição do sorriso
- ❌ Mostrar mais gengiva do que está visível na foto original
- ❌ Criar/inventar gengiva onde o lábio cobria
- ❌ Alterar o formato da boca ou abertura do sorriso

REGRA DE OURO: Se um pixel é lábio/pele na original, ele DEVE ser lábio/pele na simulação.
REGRA DE OURO 2: Se um pixel não mostra gengiva na original, NÃO pode mostrar gengiva na simulação.

⚠️ PRESERVAÇÃO ABSOLUTA:

1. **LÁBIOS = MÁSCARA FIXA**: 
   - A posição EXATA de cada pixel do lábio superior e inferior deve ser idêntica
   - O lábio NÃO pode estar "levantado" ou em posição diferente
   - O contorno labial é uma FRONTEIRA que não pode ser ultrapassada

2. **GENGIVA = APENAS O QUE JÁ EXISTE**:
   - Modifique apenas a gengiva que JÁ É VISÍVEL na foto original
   - NUNCA adicione gengiva onde o lábio cobre na original
   - A linha gengival visível deve ter formato idêntico

3. **PELE E FACE**:
   - Textura, cor, pelos faciais = 100% idênticos
   - Nenhuma modificação facial permitida

⚠️ REGRAS PARA OS DENTES (única área editável):

4. **APENAS ADIÇÃO DE MATERIAL**:
   - Aumentar levemente comprimento (máx 1-2mm bordo incisal)
   - Preencher diastemas
   - Harmonizar contorno por adição
   - NUNCA diminuir, encurtar ou afinar

5. **COR NATURAL (A1-A2)**:
   - NÃO faça dentes brancos artificiais
   - Use tom natural com leve saturação cervical
   - Preserve translucidez das bordas incisais

6. **TEXTURA REAL**:
   - Mantenha micro-texturas e reflexos naturais
   - Cada dente deve ter caracterização individual
   - Evite uniformidade artificial

MODIFICAÇÕES NOS DENTES:
${analysis.suggestions.map((s) => `- Dente ${s.tooth}: ${s.proposed_change}`).join("\n")}

✅ CHECKLIST FINAL OBRIGATÓRIO:

□ Os lábios estão na EXATA mesma posição da foto original?
□ A área de exposição do sorriso é IDÊNTICA (não está maior)?
□ Existe alguma gengiva visível que NÃO existia antes? (deve ser NÃO)
□ Pele e textura facial estão inalteradas?
□ A cor dos dentes é natural (não branca artificial)?
□ O resultado parece uma foto real de um caso clínico?

SE QUALQUER ITEM FALHAR, REFAÇA PRESERVANDO MELHOR O ENQUADRAMENTO ORIGINAL.`;

  const simulationResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
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

  if (!simulationResponse.ok) {
    console.warn("Simulation generation failed:", simulationResponse.status);
    return null;
  }

  const simData = await simulationResponse.json();
  const generatedImage = simData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

  if (!generatedImage) {
    console.warn("No image in simulation response");
    return null;
  }

  // Upload simulation to storage
  const base64Data = generatedImage.replace(/^data:image\/\w+;base64,/, "");
  const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
  
  const fileName = `${userId}/dsd_simulation_${Date.now()}.png`;
  
  const { error: uploadError } = await supabase.storage
    .from("dsd-simulations")
    .upload(fileName, binaryData, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return null;
  }

  return fileName;
}

// Analyze facial proportions
async function analyzeProportions(
  imageBase64: string,
  apiKey: string,
  corsHeaders: Record<string, string>
): Promise<DSDAnalysis | Response> {
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

SUGESTÕES - APENAS TRATAMENTOS CONSERVADORES COM LENTES DE CONTATO:
Para cada dente que poderia ser melhorado, forneça APENAS mudanças MÍNIMAS possíveis com lentes de contato dental:
- Número do dente (notação universal: 11-48)
- Problema atual identificado (seja específico e objetivo)
- Mudança proposta (CONSERVADORA e ADITIVA apenas)

LIMITES PARA SUGESTÕES:
- MÁXIMO de 1-2mm de extensão incisal por dente
- Fechamento de diastemas de até 2mm por lado
- Harmonização SUTIL de contorno (não transformações)
- NÃO sugira clareamento extremo ou cor artificial

REGRAS ESTRITAS:
✅ PERMITIDO: aumentar levemente comprimento, fechar pequenos espaços, harmonizar contorno
❌ PROIBIDO: diminuir, encurtar, mudanças dramáticas de forma
❌ PROIBIDO: sugerir "dentes brancos", "clareamento Hollywood" ou cor artificial
❌ PROIBIDO: sugerir mais de 3-4 dentes por arcada (foque nos essenciais)

Exemplo BOM: "Aumentar bordo incisal do 21 em 1mm para harmonizar altura com 11"
Exemplo BOM: "Fechar diastema de 1mm entre 11 e 21 com adição em mesial de ambos"
Exemplo RUIM: "Clarear todos os dentes para tom mais branco" - NÃO USAR
Exemplo RUIM: "Modificar formato do 12 para proporção dourada" - NÃO USAR

FILOSOFIA: MENOS É MAIS. Sugira apenas o ESSENCIAL para harmonização natural.

OBSERVAÇÕES:
Inclua 2-3 observações clínicas objetivas sobre o sorriso.

IMPORTANTE:
- Seja CONSERVADOR nas sugestões
- Priorize naturalidade sobre perfeição
- Considere proporção dourada como GUIA, não como meta absoluta
- TODAS as sugestões devem ser clinicamente realizáveis com lentes de contato (0.3-0.5mm espessura)`;

  const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
                },
                dental_midline: {
                  type: "string",
                  enum: ["alinhada", "desviada_esquerda", "desviada_direita"],
                },
                smile_line: {
                  type: "string",
                  enum: ["alta", "média", "baixa"],
                },
                buccal_corridor: {
                  type: "string",
                  enum: ["adequado", "excessivo", "ausente"],
                },
                occlusal_plane: {
                  type: "string",
                  enum: ["nivelado", "inclinado_esquerda", "inclinado_direita"],
                },
                golden_ratio_compliance: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                },
                symmetry_score: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                },
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      tooth: { type: "string" },
                      current_issue: { type: "string" },
                      proposed_change: { type: "string" },
                    },
                    required: ["tooth", "current_issue", "proposed_change"],
                  },
                },
                observations: {
                  type: "array",
                  items: { type: "string" },
                },
                confidence: {
                  type: "string",
                  enum: ["alta", "média", "baixa"],
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
  const toolCall = analysisData.choices?.[0]?.message?.tool_calls?.[0];

  if (toolCall?.function?.arguments) {
    try {
      return JSON.parse(toolCall.function.arguments) as DSDAnalysis;
    } catch {
      console.error("Failed to parse tool call arguments");
      return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
    }
  }

  console.error("No tool call in response");
  return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
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

    const { imageBase64, evaluationId, regenerateSimulationOnly, existingAnalysis } = validation.data;

    let analysis: DSDAnalysis;

    // If regenerating simulation only, use existing analysis
    if (regenerateSimulationOnly && existingAnalysis) {
      analysis = existingAnalysis;
    } else {
      // Run full analysis
      const analysisResult = await analyzeProportions(imageBase64, LOVABLE_API_KEY, corsHeaders);
      
      // Check if it's an error response
      if (analysisResult instanceof Response) {
        return analysisResult;
      }
      
      analysis = analysisResult;
    }

    // Generate simulation image
    let simulationUrl: string | null = null;
    try {
      simulationUrl = await generateSimulation(imageBase64, analysis, user.id, supabase, LOVABLE_API_KEY);
    } catch (simError) {
      console.error("Simulation error:", simError);
      // Continue without simulation - analysis is still valid
    }

    // Update evaluation if provided
    if (evaluationId) {
      const { data: evalData, error: evalError } = await supabase
        .from("evaluations")
        .select("user_id")
        .eq("id", evaluationId)
        .single();

      if (!evalError && evalData && evalData.user_id === user.id) {
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
