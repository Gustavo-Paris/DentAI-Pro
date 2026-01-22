import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreFlight, ERROR_MESSAGES, createErrorResponse } from "../_shared/cors.ts";
import { validateAnalyzePhotosData, type AnalyzePhotosData } from "../_shared/validation.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(req);
  if (preflightResponse) return preflightResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401, corsHeaders);
    }

    // Create client with user's auth token to verify claims
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return createErrorResponse(ERROR_MESSAGES.INVALID_TOKEN, 401, corsHeaders);
    }

    const userId = claimsData.claims.sub as string;

    // Parse and validate input
    let rawData: unknown;
    try {
      rawData = await req.json();
    } catch {
      return createErrorResponse(ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
    }

    const validation = validateAnalyzePhotosData(rawData);
    if (!validation.success || !validation.data) {
      console.error("Validation failed:", validation.error);
      return createErrorResponse(validation.error || ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
    }

    const data: AnalyzePhotosData = validation.data;

    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch evaluation data and verify ownership
    const { data: evaluation, error: evalError } = await supabase
      .from("evaluations")
      .select("*")
      .eq("id", data.evaluationId)
      .single();

    if (evalError) {
      console.error("Database error fetching evaluation:", evalError);
      return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
    }

    // Verify user owns this evaluation
    if (evaluation.user_id !== userId) {
      return createErrorResponse(ERROR_MESSAGES.ACCESS_DENIED, 403, corsHeaders);
    }

    // Download images and convert to base64
    const imageContents: { type: string; base64: string }[] = [];

    const downloadImage = async (path: string, type: string) => {
      if (!path) return null;
      
      const { data: fileData, error } = await supabase.storage
        .from("clinical-photos")
        .download(path);

      if (error) {
        console.error(`Error downloading ${type}`);
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
      return createErrorResponse(ERROR_MESSAGES.NO_PHOTO, 400, corsHeaders);
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
      console.error("Failed to parse AI response");
      return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
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

    if (updateError) {
      console.error("Database error saving result:", updateError);
      return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
    }

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
    return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
  }
});
