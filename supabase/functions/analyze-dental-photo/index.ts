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

interface PhotoAnalysisResult {
  detected: boolean;
  confidence: number;
  tooth: string | null;
  tooth_region: string | null;
  cavity_class: string | null;
  restoration_size: string | null;
  vita_shade: string | null;
  substrate: string | null;
  substrate_condition: string | null;
  enamel_condition: string | null;
  depth: string | null;
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

    // System prompt for dental photo analysis
    const systemPrompt = `Você é um especialista em odontologia restauradora com 20 anos de experiência em análise de casos clínicos.

Sua tarefa é analisar fotos intraorais de cavidades dentárias e identificar com precisão:
1. Qual dente está sendo mostrado (notação universal ou FDI)
2. A região do dente (anterior/posterior, superior/inferior)
3. A classificação da cavidade (Classe I, II, III, IV, V ou VI)
4. O tamanho estimado da restauração necessária (pequena, média, grande, extensa)
5. A cor VITA mais próxima do dente adjacente (A1, A2, A3, A3.5, B1, B2, etc.)
6. O tipo de substrato visível (esmalte, dentina, dentina esclerótica, dentina afetada)
7. A condição do substrato (saudável, esclerótico, manchado, cariado)
8. A condição do esmalte (íntegro, fraturado, hipoplásico, fluorose)
9. A profundidade estimada da cavidade (superficial, média, profunda)

Seja preciso e conservador nas estimativas. Se não conseguir identificar algo com certeza, indique isso claramente.`;

    const userPrompt = `Analise esta foto intraoral e identifique os parâmetros clínicos para uma restauração em resina composta.

Tipo de foto: ${data.imageType || "intraoral"}

Forneça sua análise detalhada usando a função analyze_dental_photo.`;

    // Tool definition for structured output
    const tools = [
      {
        type: "function",
        function: {
          name: "analyze_dental_photo",
          description: "Retorna a análise estruturada de uma foto dental intraoral",
          parameters: {
            type: "object",
            properties: {
              detected: {
                type: "boolean",
                description: "Se foi possível detectar uma cavidade ou área de restauração na foto"
              },
              confidence: {
                type: "number",
                description: "Nível de confiança da análise de 0 a 100"
              },
              tooth: {
                type: "string",
                description: "Número do dente identificado (ex: '11', '21', '36', '46'). Null se não identificável.",
                nullable: true
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
              vita_shade: {
                type: "string",
                description: "Cor VITA mais próxima (ex: A1, A2, A3, A3.5, B1, B2, C1, D2)",
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
              observations: {
                type: "array",
                items: { type: "string" },
                description: "Observações clínicas relevantes"
              },
              warnings: {
                type: "array",
                items: { type: "string" },
                description: "Alertas ou pontos de atenção para o operador"
              }
            },
            required: ["detected", "confidence", "observations", "warnings"],
            additionalProperties: false
          }
        }
      }
    ];

    // Call Lovable AI Gateway with Gemini 2.5 Pro (best for vision + complex reasoning)
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
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
          max_tokens: 1500,
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
    
    // Extract tool call result
    let analysisResult: PhotoAnalysisResult;
    
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall && toolCall.function?.arguments) {
      try {
        analysisResult = JSON.parse(toolCall.function.arguments);
      } catch (parseError) {
        console.error("Failed to parse tool call arguments:", toolCall.function.arguments);
        throw new Error("Falha ao processar resposta da IA");
      }
    } else {
      // Fallback: try to extract from content
      const content = aiResult.choices?.[0]?.message?.content;
      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Resposta da IA não contém dados estruturados");
        }
      } else {
        throw new Error("Resposta da IA está vazia");
      }
    }

    // Ensure required fields have defaults
    const result: PhotoAnalysisResult = {
      detected: analysisResult.detected ?? false,
      confidence: analysisResult.confidence ?? 0,
      tooth: analysisResult.tooth ?? null,
      tooth_region: analysisResult.tooth_region ?? null,
      cavity_class: analysisResult.cavity_class ?? null,
      restoration_size: analysisResult.restoration_size ?? null,
      vita_shade: analysisResult.vita_shade ?? null,
      substrate: analysisResult.substrate ?? null,
      substrate_condition: analysisResult.substrate_condition ?? null,
      enamel_condition: analysisResult.enamel_condition ?? null,
      depth: analysisResult.depth ?? null,
      observations: analysisResult.observations ?? [],
      warnings: analysisResult.warnings ?? [],
    };

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
