import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AnalyzePhotosData {
  evaluationId: string;
  photoFrontal?: string;
  photo45?: string;
  photoFace?: string;
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

    const data: AnalyzePhotosData = await req.json();

    // Fetch evaluation data
    const { data: evaluation, error: evalError } = await supabase
      .from("evaluations")
      .select("*")
      .eq("id", data.evaluationId)
      .single();

    if (evalError) throw evalError;

    // Download images and convert to base64
    const imageContents: { type: string; base64: string }[] = [];

    const downloadImage = async (path: string, type: string) => {
      if (!path) return null;
      
      const { data: fileData, error } = await supabase.storage
        .from("clinical-photos")
        .download(path);

      if (error) {
        console.error(`Error downloading ${type}:`, error);
        return null;
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );
      
      return { type, base64 };
    };

    // Download all photos in parallel
    const photoPromises = [
      data.photoFrontal ? downloadImage(data.photoFrontal, "frontal") : null,
      data.photo45 ? downloadImage(data.photo45, "45_graus") : null,
      data.photoFace ? downloadImage(data.photoFace, "rosto") : null,
    ].filter(Boolean);

    const photos = await Promise.all(photoPromises);
    const validPhotos = photos.filter((p): p is { type: string; base64: string } => p !== null);

    if (validPhotos.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhuma foto válida encontrada" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build prompt for AI
    const prompt = `Você é um especialista em odontologia restauradora e estética dental.
Analise as fotos clínicas do sorriso do paciente e gere um protocolo de estratificação personalizado para a restauração em resina composta.

DADOS DO CASO:
- Idade do paciente: ${evaluation.patient_age} anos
- Dente: ${evaluation.tooth}
- Região: ${evaluation.region}
- Classe da cavidade: ${evaluation.cavity_class}
- Tamanho da restauração: ${evaluation.restoration_size}
- Substrato: ${evaluation.substrate}
- Nível estético: ${evaluation.aesthetic_level}
- Cor base do dente: ${evaluation.tooth_color}
- Bruxismo: ${evaluation.bruxism ? "Sim" : "Não"}

FOTOS FORNECIDAS:
${validPhotos.map((p) => `- ${p.type === "frontal" ? "Sorriso Frontal" : p.type === "45_graus" ? "Sorriso 45°" : "Rosto Completo"}`).join("\n")}

Analise as fotos considerando:
1. Sorriso Frontal - cor, textura, translucidez, caracterização
2. Sorriso 45° - forma, contorno, anatomia
3. Rosto Completo - harmonia facial, tipo de pele

Retorne um JSON com o protocolo de estratificação:
{
  "color_analysis": {
    "base_shade": "cor base identificada (escala VITA)",
    "cervical": "resina para região cervical",
    "body": "resina para corpo",
    "incisal": "resina para incisal/oclusal",
    "effects": ["efeitos especiais identificados como opalescência, halos, manchas"]
  },
  "stratification_layers": [
    { "layer": 1, "material": "nome da resina/cor", "thickness": "espessura em mm", "area": "região de aplicação" }
  ],
  "texture_notes": "observações sobre textura superficial",
  "surface_characteristics": ["características de superfície identificadas"],
  "recommendations": "recomendações de acabamento e polimento"
}

Responda APENAS com o JSON, sem texto adicional.`;

    // Build message content with images
    const messageContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: prompt },
    ];

    for (const photo of validPhotos) {
      messageContent.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${photo.base64}`,
        },
      });
    }

    // Call Lovable AI Gateway with Gemini 2.5 Pro (multimodal)
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
              role: "user",
              content: messageContent,
            },
          ],
          max_tokens: 2000,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Por favor, adicione créditos à sua conta." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices[0].message.content;

    // Parse JSON from AI response
    let stratificationProtocol;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        stratificationProtocol = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI stratification protocol");
    }

    // Update evaluation with stratification protocol
    const { error: updateError } = await supabase
      .from("evaluations")
      .update({
        stratification_protocol: stratificationProtocol,
        photo_frontal: data.photoFrontal || null,
        photo_45: data.photo45 || null,
        photo_face: data.photoFace || null,
      })
      .eq("id", data.evaluationId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        stratification_protocol: stratificationProtocol,
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
