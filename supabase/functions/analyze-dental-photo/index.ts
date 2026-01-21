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

    // System prompt for dental photo analysis - MULTI-TOOTH DETECTION
    const systemPrompt = `Você é um especialista em odontologia restauradora com 20 anos de experiência em análise de casos clínicos.

Sua tarefa é analisar fotos intraorais e identificar TODOS os dentes que apresentam problemas (cáries, restaurações defeituosas, lesões, etc.).

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

IMPORTANTE: 
- Se houver múltiplos dentes com problema, liste TODOS eles no array detected_teeth
- Ordene por prioridade (alta primeiro)
- Seja preciso e conservador nas estimativas
- Se não conseguir identificar algo com certeza, indique isso claramente`;

    const userPrompt = `Analise esta foto intraoral e identifique TODOS os dentes que necessitam de restauração em resina composta.

Tipo de foto: ${data.imageType || "intraoral"}

IMPORTANTE: Detecte e liste CADA dente com problema separadamente no array detected_teeth. Se houver 3 dentes com cárie, retorne 3 objetos no array.

Forneça sua análise completa usando a função analyze_dental_photo.`;

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

    // Call Lovable AI Gateway with Gemini 2.5 Flash (faster, good for vision)
    console.log("Calling AI Gateway for dental photo analysis...");
    
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
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
          tool_choice: "auto",
          max_tokens: 2000,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Limite de requisições excedido. Aguarde alguns minutos.",
            code: "RATE_LIMITED"
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "Créditos insuficientes. Adicione créditos à sua conta.",
            code: "PAYMENT_REQUIRED"
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    console.log("AI Response received:", JSON.stringify(aiResult).slice(0, 500));
    
    // Extract tool call result
    let analysisResult: PhotoAnalysisResult;
    
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall && toolCall.function?.arguments) {
      console.log("Found tool call, parsing arguments...");
      try {
        analysisResult = JSON.parse(toolCall.function.arguments);
      } catch (parseError) {
        console.error("Failed to parse tool call arguments:", toolCall.function.arguments);
        throw new Error("Falha ao processar resposta da IA");
      }
    } else {
      // Fallback: try to extract from content (Gemini sometimes returns JSON in content)
      const content = aiResult.choices?.[0]?.message?.content;
      console.log("No tool call found, checking content:", content?.slice(0, 200));
      
      if (content) {
        // Try to find JSON in the content
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            analysisResult = JSON.parse(jsonMatch[1]);
            console.log("Parsed JSON from code block");
          } catch {
            // Try plain JSON match
            const plainJsonMatch = content.match(/\{[\s\S]*\}/);
            if (plainJsonMatch) {
              analysisResult = JSON.parse(plainJsonMatch[0]);
              console.log("Parsed plain JSON from content");
            } else {
              throw new Error("Resposta da IA não contém dados estruturados");
            }
          }
        } else {
          // Try plain JSON match
          const plainJsonMatch = content.match(/\{[\s\S]*\}/);
          if (plainJsonMatch) {
            analysisResult = JSON.parse(plainJsonMatch[0]);
            console.log("Parsed plain JSON from content");
          } else {
            throw new Error("Resposta da IA não contém dados estruturados");
          }
        }
      } else {
        console.error("AI response structure:", JSON.stringify(aiResult));
        throw new Error("Resposta da IA está vazia");
      }
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

    // Add warning if multiple teeth detected
    if (detectedTeeth.length > 1) {
      result.warnings.unshift(`Detectados ${detectedTeeth.length} dentes com necessidade de tratamento. Recomenda-se criar um caso para cada dente.`);
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
