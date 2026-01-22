import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
}

interface PhotoAnalysisResult {
  detected: boolean;
  confidence: number;
  detected_teeth: DetectedTooth[];
  primary_tooth: string | null;
  vita_shade: string | null;
  observations: string[];
  warnings: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const data: AnalyzePhotoRequest = await req.json();

    if (!data.imageBase64) {
      return new Response(
        JSON.stringify({ error: "Imagem não fornecida" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Clean base64 if it has data URI prefix
    let base64Image = data.imageBase64;
    if (base64Image.includes(",")) {
      base64Image = base64Image.split(",")[1];
    }

    // System prompt for dental photo analysis - MULTI-TOOTH DETECTION (ENHANCED FOR CONSISTENCY)
    const systemPrompt = `Você é um especialista em odontologia restauradora com 20 anos de experiência em análise de casos clínicos.

REGRA CRÍTICA E OBRIGATÓRIA: Você DEVE identificar ABSOLUTAMENTE TODOS os dentes com problemas visíveis na foto.
- Analise SISTEMATICAMENTE cada quadrante: superior-direito (Q1: 11-18), superior-esquerdo (Q2: 21-28), inferior-esquerdo (Q3: 31-38), inferior-direito (Q4: 41-48)
- Se houver 4 dentes com problema, liste TODOS OS 4 no array detected_teeth
- NUNCA retorne apenas 1 dente se houver mais dentes com problemas visíveis
- Em caso de DÚVIDA sobre um dente, INCLUA ele na lista (é melhor listar a mais do que a menos - o dentista revisará)
- Cada dente com cárie, fratura, restauração defeituosa ou lesão DEVE ser listado separadamente

Para CADA dente com problema identificado, determine:
1. Número do dente (notação FDI: 11-18, 21-28, 31-38, 41-48)
2. A região do dente (anterior/posterior, superior/inferior)
3. A classificação da cavidade (Classe I, II, III, IV, V ou VI)
4. O tamanho estimado da restauração necessária (Pequena, Média, Grande, Extensa)
5. O tipo de substrato visível (Esmalte, Dentina, Esmalte e Dentina, Dentina profunda)
6. A condição do substrato (Saudável, Esclerótico, Manchado, Cariado, Desidratado)
7. A condição do esmalte (Íntegro, Fraturado, Hipoplásico, Fluorose, Erosão)
8. A profundidade estimada da cavidade (Superficial, Média, Profunda)
9. Prioridade de tratamento (alta, média, baixa) baseada na urgência clínica

Adicionalmente, identifique:
- A cor VITA geral da arcada (A1, A2, A3, A3.5, B1, B2, etc.)
- O dente que deve ser tratado primeiro (primary_tooth) baseado na prioridade clínica

IMPORTANTE: Seja preciso e conservador nas estimativas. Se não conseguir identificar algo com certeza, indique isso claramente mas INCLUA o dente na lista.`;

    const userPrompt = `Analise esta foto intraoral e identifique TODOS os dentes que necessitam de restauração.

Tipo de foto: ${data.imageType || "intraoral"}

INSTRUÇÕES OBRIGATÓRIAS:
1. Examine CADA quadrante da arcada visível na foto (Q1, Q2, Q3, Q4)
2. Liste CADA dente com problema como um objeto SEPARADO no array detected_teeth
3. Se detectar problemas em 2, 3, 4 ou mais dentes, TODOS devem aparecer na resposta
4. NÃO omita nenhum dente com problema visível
5. Ordene os dentes por prioridade de tratamento (alta primeiro)

Use a função analyze_dental_photo para retornar a análise estruturada.`;

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
        const errorText = await response.text();
        console.error(`AI API error (${model}):`, response.status, errorText);

        if (response.status === 429) {
          throw { status: 429, message: "Rate limited" };
        }
        if (response.status === 402) {
          throw { status: 402, message: "Payment required" };
        }
        return null;
      }

      const result = await response.json();
      console.log(`AI Response (${model}):`, JSON.stringify(result).slice(0, 500));

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
          console.error("Failed to parse tool call arguments:", toolCall.function.arguments);
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
      } catch (error: any) {
        if (error?.status === 429) {
          return new Response(
            JSON.stringify({ 
              error: "Limite de requisições excedido. Aguarde alguns minutos.",
              code: "RATE_LIMITED"
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (error?.status === 402) {
          return new Response(
            JSON.stringify({ 
              error: "Créditos insuficientes. Adicione créditos à sua conta.",
              code: "PAYMENT_REQUIRED"
            }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        console.error(`Error with model ${model}:`, error);
      }
    }

    if (!analysisResult) {
      throw new Error("Não foi possível analisar a foto. Tente novamente.");
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
    };

    // Log detection results for debugging
    console.log(`Multi-tooth detection complete: ${detectedTeeth.length} teeth found`);
    console.log(`Primary tooth: ${result.primary_tooth}, Confidence: ${result.confidence}%`);
    if (detectedTeeth.length > 0) {
      console.log(`Teeth detected: ${detectedTeeth.map(t => `${t.tooth}(${t.priority})`).join(', ')}`);
    }

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
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
