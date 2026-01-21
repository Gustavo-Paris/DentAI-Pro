import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EvaluationData {
  evaluationId: string;
  patientAge: string;
  tooth: string;
  region: string;
  cavityClass: string;
  restorationSize: string;
  substrate: string;
  aestheticLevel: string;
  toothColor: string;
  stratificationNeeded: boolean;
  bruxism: boolean;
  longevityExpectation: string;
  budget: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: EvaluationData = await req.json();

    // Fetch all resins from database
    const { data: resins, error: resinsError } = await supabase
      .from("resins")
      .select("*");

    if (resinsError) throw resinsError;

    // Build prompt for AI
    const prompt = `Você é um especialista em materiais dentários. Analise o caso clínico abaixo e recomende a melhor resina composta.

CASO CLÍNICO:
- Idade do paciente: ${data.patientAge} anos
- Dente: ${data.tooth}
- Região: ${data.region}
- Classe da cavidade: ${data.cavityClass}
- Tamanho da restauração: ${data.restorationSize}
- Substrato: ${data.substrate}
- Nível estético: ${data.aestheticLevel}
- Cor do dente: ${data.toothColor}
- Necessita estratificação: ${data.stratificationNeeded ? "Sim" : "Não"}
- Bruxismo: ${data.bruxism ? "Sim" : "Não"}
- Expectativa de longevidade: ${data.longevityExpectation}
- Orçamento: ${data.budget}

RESINAS DISPONÍVEIS:
${resins
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
  .join("\n")}

Com base nas características do caso e nas resinas disponíveis, responda em formato JSON:
{
  "recommended_resin_name": "nome exato da resina recomendada",
  "justification": "explicação detalhada de 2-3 frases do porquê esta resina é ideal para o caso",
  "alternatives": [
    {"name": "nome da alternativa 1", "manufacturer": "fabricante", "reason": "razão breve"},
    {"name": "nome da alternativa 2", "manufacturer": "fabricante", "reason": "razão breve"}
  ]
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
          max_tokens: 1000,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices[0].message.content;

    // Parse JSON from AI response
    let recommendation;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI recommendation");
    }

    // Find the recommended resin in database
    const recommendedResin = resins.find(
      (r) =>
        r.name.toLowerCase() === recommendation.recommended_resin_name.toLowerCase()
    );

    // Update evaluation with recommendation
    const { error: updateError } = await supabase
      .from("evaluations")
      .update({
        recommended_resin_id: recommendedResin?.id || null,
        recommendation_text: recommendation.justification,
        alternatives: recommendation.alternatives,
      })
      .eq("id", data.evaluationId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        recommendation: {
          resin: recommendedResin,
          justification: recommendation.justification,
          alternatives: recommendation.alternatives,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
