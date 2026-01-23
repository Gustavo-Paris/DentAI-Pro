import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreFlight, ERROR_MESSAGES, createErrorResponse } from "../_shared/cors.ts";

interface AnalyzePhotoRequest {
  imageBase64: string;
  imageType?: string; // "intraoral" | "frontal_smile" | "45_smile" | "face"
}

interface DetectedTooth {
  tooth: string;
  tooth_region: string | null;
  cavity_class: string | null;
  restoration_size: string | null;
  substrate: string | null;
  substrate_condition: string | null;
  enamel_condition: string | null;
  depth: string | null;
  priority: "alta" | "média" | "baixa";
  notes: string | null;
  treatment_indication?: "resina" | "porcelana";
  indication_reason?: string;
}

interface PhotoAnalysisResult {
  detected: boolean;
  confidence: number;
  detected_teeth: DetectedTooth[];
  primary_tooth: string | null;
  vita_shade: string | null;
  observations: string[];
  warnings: string[];
  treatment_indication?: "resina" | "porcelana";
  indication_reason?: string;
}

// Validate image request data
function validateImageRequest(data: unknown): { success: boolean; error?: string; data?: AnalyzePhotoRequest } {
  if (!data || typeof data !== "object") {
    return { success: false, error: ERROR_MESSAGES.INVALID_REQUEST };
  }

  const obj = data as Record<string, unknown>;

  if (!obj.imageBase64 || typeof obj.imageBase64 !== "string") {
    return { success: false, error: ERROR_MESSAGES.IMAGE_INVALID };
  }

  // Validate imageType if provided
  if (obj.imageType !== undefined) {
    const validTypes = ["intraoral", "frontal_smile", "45_smile", "face"];
    if (typeof obj.imageType !== "string" || !validTypes.includes(obj.imageType)) {
      obj.imageType = "intraoral"; // Default to intraoral
    }
  }

  return {
    success: true,
    data: {
      imageBase64: obj.imageBase64 as string,
      imageType: (obj.imageType as string) || "intraoral",
    },
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(req);
  if (preflightResponse) return preflightResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
    }

    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401, corsHeaders);
    }

    // Verify JWT claims
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return createErrorResponse(ERROR_MESSAGES.INVALID_TOKEN, 401, corsHeaders);
    }

    // Parse and validate request
    let rawData: unknown;
    try {
      rawData = await req.json();
    } catch {
      return createErrorResponse(ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
    }

    const validation = validateImageRequest(rawData);
    if (!validation.success || !validation.data) {
      return createErrorResponse(validation.error || ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
    }

    const data = validation.data;

    // Server-side validation of image data
    const base64Data = data.imageBase64.includes(",") 
      ? data.imageBase64.split(",")[1] 
      : data.imageBase64;
    
    // Validate base64 format
    if (!/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
      return createErrorResponse(ERROR_MESSAGES.IMAGE_INVALID, 400, corsHeaders);
    }

    // Validate image size (max 10MB in base64 = ~13.3MB base64 string)
    if (base64Data.length > 13 * 1024 * 1024) {
      return createErrorResponse(ERROR_MESSAGES.IMAGE_TOO_LARGE, 400, corsHeaders);
    }

    // Verify magic bytes for common image formats
    const bytes = Uint8Array.from(atob(base64Data.slice(0, 16)), c => c.charCodeAt(0));
    const isJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    const isWEBP = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
    
    if (!isJPEG && !isPNG && !isWEBP) {
      return createErrorResponse(ERROR_MESSAGES.IMAGE_FORMAT_UNSUPPORTED, 400, corsHeaders);
    }

    // Use the validated base64 data
    const base64Image = base64Data;

    // System prompt for dental photo analysis - MULTI-TOOTH + WHOLE SMILE ANALYSIS
    const systemPrompt = `Você é um especialista em odontologia restauradora e estética com 20 anos de experiência em análise de casos clínicos e planejamento de sorrisos.

REGRA CRÍTICA E OBRIGATÓRIA: Você DEVE analisar o SORRISO COMO UM TODO, não apenas patologias individuais.

## ANÁLISE MULTI-DENTE (Problemas Restauradores)
- Analise SISTEMATICAMENTE cada quadrante: superior-direito (Q1: 11-18), superior-esquerdo (Q2: 21-28), inferior-esquerdo (Q3: 31-38), inferior-direito (Q4: 41-48)
- Se houver 4 dentes com problema, liste TODOS OS 4 no array detected_teeth
- NUNCA retorne apenas 1 dente se houver mais dentes com problemas visíveis
- Em caso de DÚVIDA sobre um dente, INCLUA ele na lista (o dentista revisará)
- Cada dente com cárie, fratura, restauração defeituosa ou lesão DEVE ser listado separadamente

## ANÁLISE DO SORRISO COMPLETO (Melhorias Estéticas)
IMPORTANTE: Além de patologias, identifique oportunidades de melhoria estética mesmo em dentes saudáveis:
- Dentes que poderiam receber VOLUME/CONTORNO para harmonizar o sorriso
- Incisivos laterais que poderiam ser ALINHADOS ou TER PROPORÇÕES CORRIGIDAS
- Pré-molares que poderiam receber VOLUME no terço vestibular
- Dentes com FORMATO INADEQUADO que poderiam ser reanatomizados
- Diastemas que poderiam ser fechados
- Correções de LINHA MÉDIA ou SIMETRIA do sorriso

Para estes casos estéticos, use prioridade "baixa" e indique no campo notes que é uma "Melhoria estética opcional".

## Para CADA dente identificado, determine:
1. Número do dente (notação FDI: 11-18, 21-28, 31-38, 41-48)
2. A região do dente (anterior/posterior, superior/inferior)
3. A classificação da cavidade (Classe I, II, III, IV, V ou VI) - para melhorias estéticas use Classe IV ou V conforme apropriado
4. O tamanho estimado da restauração necessária (Pequena, Média, Grande, Extensa)
5. O tipo de substrato visível (Esmalte, Dentina, Esmalte e Dentina, Dentina profunda)
6. A condição do substrato (Saudável, Esclerótico, Manchado, Cariado, Desidratado)
7. A condição do esmalte (Íntegro, Fraturado, Hipoplásico, Fluorose, Erosão)
8. A profundidade estimada da cavidade (Superficial, Média, Profunda)
9. Prioridade de tratamento:
   - "alta": cáries ativas, fraturas, dor
   - "média": restaurações defeituosas, lesões não urgentes
   - "baixa": melhorias estéticas opcionais
10. INDICAÇÃO DE TRATAMENTO para cada dente:
    - "resina": restaurações pontuais, cáries localizadas, pequenas fraturas
    - "porcelana": escurecimento severo (canal, tetraciclina), restaurações extensas >50%, múltiplos dentes anteriores, harmonização complexa

## CRITÉRIOS PARA INDICAR FACETAS DE PORCELANA:
- Escurecimento severo por tratamento de canal ou tetraciclina
- Restaurações extensas comprometendo >50% da estrutura dental
- Múltiplos dentes anteriores (3+) com necessidade de harmonização estética
- Diastemas múltiplos ou assimetrias significativas
- Fluorose severa ou hipoplasia extensa
- Casos onde a cor/forma do dente não pode ser corrigida apenas com resina

## CRITÉRIOS PARA INDICAR RESINA COMPOSTA:
- Lesões de cárie localizadas
- Restaurações pequenas a médias (<50% da estrutura)
- Fechamento de diastemas simples (até 2mm)
- Correções estéticas pontuais em 1-2 dentes
- Fraturas parciais restauráveis

Adicionalmente, identifique:
- A cor VITA geral da arcada (A1, A2, A3, A3.5, B1, B2, etc.)
- O dente que deve ser tratado primeiro (primary_tooth) baseado na prioridade clínica
- Observações sobre harmonização geral do sorriso (simetria, proporção, volume)
- INDICAÇÃO GERAL de tratamento (resina ou porcelana) baseada no caso completo

IMPORTANTE: Seja ABRANGENTE na detecção. Inclua tanto problemas restauradores quanto oportunidades estéticas para dar ao dentista uma visão completa do caso.`;

    const userPrompt = `Analise esta foto e identifique TODOS os dentes que necessitam de tratamento OU que poderiam se beneficiar de melhorias estéticas.

Tipo de foto: ${data.imageType || "intraoral"}

INSTRUÇÕES OBRIGATÓRIAS - ANÁLISE COMPLETA DO SORRISO:

1. PRIMEIRO: Examine CADA quadrante (Q1, Q2, Q3, Q4) para problemas restauradores (cáries, fraturas, restaurações defeituosas)
2. SEGUNDO: Analise o sorriso como um todo para oportunidades estéticas:
   - Incisivos laterais com formato/proporção inadequada
   - Pré-molares que poderiam receber mais volume
   - Diastemas que poderiam ser fechados
   - Assimetrias que poderiam ser corrigidas
3. Liste CADA dente em um objeto SEPARADO no array detected_teeth
4. NÃO omita nenhum dente - inclua tanto problemas quanto melhorias estéticas
5. Para melhorias estéticas opcionais, use prioridade "baixa" e indique no campo notes
6. Ordene por prioridade: alta (patologias urgentes) → média (restaurações) → baixa (estética)

Use a função analyze_dental_photo para retornar a análise estruturada completa.`;

    // Tool definition for structured output - MULTI-TOOTH SUPPORT
    const tools = [
      {
        type: "function",
        function: {
          name: "analyze_dental_photo",
          description: "Retorna a análise estruturada de uma foto dental intraoral, detectando TODOS os dentes com problemas",
          parameters: {
            type: "object",
            properties: {
              detected: {
                type: "boolean",
                description: "Se foi possível detectar pelo menos um dente com problema na foto"
              },
              confidence: {
                type: "number",
                description: "Nível de confiança geral da análise de 0 a 100"
              },
              detected_teeth: {
                type: "array",
                description: "Lista de TODOS os dentes detectados com problemas, ordenados por prioridade",
                items: {
                  type: "object",
                  properties: {
                    tooth: {
                      type: "string",
                      description: "Número do dente (notação FDI: 11-18, 21-28, 31-38, 41-48)"
                    },
                    tooth_region: {
                      type: "string",
                      enum: ["anterior-superior", "anterior-inferior", "posterior-superior", "posterior-inferior"],
                      description: "Região do dente na arcada",
                      nullable: true
                    },
                    cavity_class: {
                      type: "string",
                      enum: ["Classe I", "Classe II", "Classe III", "Classe IV", "Classe V", "Classe VI"],
                      description: "Classificação de Black da cavidade",
                      nullable: true
                    },
                    restoration_size: {
                      type: "string",
                      enum: ["Pequena", "Média", "Grande", "Extensa"],
                      description: "Tamanho estimado da restauração",
                      nullable: true
                    },
                    substrate: {
                      type: "string",
                      enum: ["Esmalte", "Dentina", "Esmalte e Dentina", "Dentina profunda"],
                      description: "Tipo de substrato principal visível",
                      nullable: true
                    },
                    substrate_condition: {
                      type: "string",
                      enum: ["Saudável", "Esclerótico", "Manchado", "Cariado", "Desidratado"],
                      description: "Condição do substrato dentário",
                      nullable: true
                    },
                    enamel_condition: {
                      type: "string",
                      enum: ["Íntegro", "Fraturado", "Hipoplásico", "Fluorose", "Erosão"],
                      description: "Condição do esmalte periférico",
                      nullable: true
                    },
                    depth: {
                      type: "string",
                      enum: ["Superficial", "Média", "Profunda"],
                      description: "Profundidade estimada da cavidade",
                      nullable: true
                    },
                    priority: {
                      type: "string",
                      enum: ["alta", "média", "baixa"],
                      description: "Prioridade de tratamento baseada na urgência clínica"
                    },
                    notes: {
                      type: "string",
                      description: "Observações específicas sobre este dente",
                      nullable: true
                    },
                    treatment_indication: {
                      type: "string",
                      enum: ["resina", "porcelana"],
                      description: "Indicação de tratamento: resina para restaurações pontuais, porcelana para casos complexos/estéticos"
                    },
                    indication_reason: {
                      type: "string",
                      description: "Razão da indicação de tratamento",
                      nullable: true
                    }
                  },
                  required: ["tooth", "priority"]
                }
              },
              primary_tooth: {
                type: "string",
                description: "Número do dente que deve ser tratado primeiro (mais urgente)",
                nullable: true
              },
              vita_shade: {
                type: "string",
                description: "Cor VITA geral da arcada (ex: A1, A2, A3, A3.5, B1, B2, C1, D2)",
                nullable: true
              },
              observations: {
                type: "array",
                items: { type: "string" },
                description: "Observações clínicas gerais sobre a arcada/foto"
              },
              warnings: {
                type: "array",
                items: { type: "string" },
                description: "Alertas ou pontos de atenção para o operador"
              },
              treatment_indication: {
                type: "string",
                enum: ["resina", "porcelana"],
                description: "Indicação GERAL de tratamento para o caso: resina para restaurações pontuais, porcelana para harmonização complexa"
              },
              indication_reason: {
                type: "string",
                description: "Razão detalhada da indicação de tratamento"
              }
            },
            required: ["detected", "confidence", "detected_teeth", "observations", "warnings"],
            additionalProperties: false
          }
        }
      }
    ];

    // Helper function to call AI with a specific model
    const callAI = async (model: string): Promise<PhotoAnalysisResult | null> => {
      console.log(`Calling AI Gateway with model: ${model}...`);
      
      const response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${lovableApiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.1,
            messages: [
              {
                role: "system",
                content: systemPrompt
              },
              {
                role: "user",
                content: [
                  { type: "text", text: userPrompt },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/jpeg;base64,${base64Image}`,
                    },
                  },
                ],
              },
            ],
            tools,
            tool_choice: { type: "function", function: { name: "analyze_dental_photo" } },
            max_tokens: 3000,
          }),
        }
      );

      if (!response.ok) {
        console.error(`AI API error (${model}):`, response.status);

        if (response.status === 429) {
          throw { status: 429, message: "Rate limited" };
        }
        if (response.status === 402) {
          throw { status: 402, message: "Payment required" };
        }
        return null;
      }

      const result = await response.json();
      console.log(`AI Response (${model}): success`);

      // Check for malformed function call
      const finishReason = result.choices?.[0]?.native_finish_reason || result.choices?.[0]?.finish_reason;
      if (finishReason === "MALFORMED_FUNCTION_CALL") {
        console.log(`Model ${model} returned MALFORMED_FUNCTION_CALL, will retry with different model`);
        return null;
      }

      // Extract tool call
      const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall && toolCall.function?.arguments) {
        console.log("Found tool call, parsing arguments...");
        try {
          return JSON.parse(toolCall.function.arguments);
        } catch (parseError) {
          console.error("Failed to parse tool call arguments");
          return null;
        }
      }

      // Fallback: try to extract from content
      const content = result.choices?.[0]?.message?.content;
      if (content) {
        console.log("Checking content for JSON...");
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const jsonStr = jsonMatch[1] || jsonMatch[0];
            return JSON.parse(jsonStr);
          } catch {
            console.log("Failed to parse JSON from content");
          }
        }
      }

      return null;
    };

    // Try models in order of reliability for tool calling
    const modelsToTry = [
      "google/gemini-3-flash-preview",  // Fast, good at tool calling
      "google/gemini-2.5-flash",         // Reliable fallback
    ];

    let analysisResult: PhotoAnalysisResult | null = null;

    for (const model of modelsToTry) {
      try {
        analysisResult = await callAI(model);
        if (analysisResult) {
          console.log(`Successfully got analysis from ${model}`);
          break;
        }
      } catch (error: unknown) {
        const err = error as { status?: number };
        if (err?.status === 429) {
          return createErrorResponse(ERROR_MESSAGES.RATE_LIMITED, 429, corsHeaders, "RATE_LIMITED");
        }
        if (err?.status === 402) {
          return createErrorResponse(ERROR_MESSAGES.PAYMENT_REQUIRED, 402, corsHeaders, "PAYMENT_REQUIRED");
        }
        console.error(`Error with model ${model}`);
      }
    }

    if (!analysisResult) {
      return createErrorResponse(ERROR_MESSAGES.ANALYSIS_FAILED, 500, corsHeaders);
    }

    // Ensure required fields have defaults and normalize detected_teeth
    const detectedTeeth: DetectedTooth[] = (analysisResult.detected_teeth || []).map((tooth: Partial<DetectedTooth>) => ({
      tooth: tooth.tooth || "desconhecido",
      tooth_region: tooth.tooth_region ?? null,
      cavity_class: tooth.cavity_class ?? null,
      restoration_size: tooth.restoration_size ?? null,
      substrate: tooth.substrate ?? null,
      substrate_condition: tooth.substrate_condition ?? null,
      enamel_condition: tooth.enamel_condition ?? null,
      depth: tooth.depth ?? null,
      priority: tooth.priority || "média",
      notes: tooth.notes ?? null,
      treatment_indication: tooth.treatment_indication ?? "resina",
      indication_reason: tooth.indication_reason ?? undefined,
    }));

    // Sort by priority: alta > média > baixa
    const priorityOrder = { alta: 0, média: 1, baixa: 2 };
    detectedTeeth.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    const result: PhotoAnalysisResult = {
      detected: analysisResult.detected ?? detectedTeeth.length > 0,
      confidence: analysisResult.confidence ?? 0,
      detected_teeth: detectedTeeth,
      primary_tooth: analysisResult.primary_tooth ?? (detectedTeeth.length > 0 ? detectedTeeth[0].tooth : null),
      vita_shade: analysisResult.vita_shade ?? null,
      observations: analysisResult.observations ?? [],
      warnings: analysisResult.warnings ?? [],
      treatment_indication: analysisResult.treatment_indication ?? "resina",
      indication_reason: analysisResult.indication_reason ?? undefined,
    };

    // Log detection results for debugging
    console.log(`Multi-tooth detection complete: ${detectedTeeth.length} teeth found`);
    console.log(`Primary tooth: ${result.primary_tooth}, Confidence: ${result.confidence}%`);

    // Add warning if multiple teeth detected
    if (detectedTeeth.length > 1) {
      result.warnings.unshift(`Detectados ${detectedTeeth.length} dentes com necessidade de tratamento. Selecione qual deseja tratar primeiro.`);
    }

    // Add warning if only 1 tooth detected with low confidence (might be missing teeth)
    if (detectedTeeth.length === 1 && result.confidence < 85) {
      result.warnings.push("Apenas 1 dente detectado. Se houver mais dentes com problema na foto, use 'Reanalisar' ou adicione manualmente.");
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: result,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error analyzing photo:", error);
    return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
  }
});
