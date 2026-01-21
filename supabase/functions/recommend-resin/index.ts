import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EvaluationData {
  evaluationId: string;
  userId: string;
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
${inventorySection}
${inventoryInstructions}

Responda em formato JSON:
{
  "recommended_resin_name": "nome exato da resina recomendada (priorize as do inventário se adequadas)",
  "is_from_inventory": true ou false,
  "ideal_resin_name": "nome da resina tecnicamente ideal (se diferente da recomendada, caso contrário deixe null)",
  "ideal_reason": "explicação de por que a ideal seria superior (se aplicável, caso contrário deixe null)",
  "justification": "explicação detalhada de 2-3 frases do porquê esta resina é a melhor escolha considerando o inventário e o caso",
  "inventory_alternatives": [
    {"name": "...", "manufacturer": "...", "reason": "alternativa disponível no estoque"}
  ],
  "external_alternatives": [
    {"name": "...", "manufacturer": "...", "reason": "alternativa para considerar aquisição"}
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
          max_tokens: 1500,
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

    // Update evaluation with recommendation
    const { error: updateError } = await supabase
      .from("evaluations")
      .update({
        recommended_resin_id: recommendedResin?.id || null,
        recommendation_text: recommendation.justification,
        alternatives: allAlternatives,
        is_from_inventory: recommendation.is_from_inventory || false,
        ideal_resin_id: idealResin?.id || null,
        ideal_reason: recommendation.ideal_reason || null,
      })
      .eq("id", data.evaluationId);

    if (updateError) throw updateError;

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
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
