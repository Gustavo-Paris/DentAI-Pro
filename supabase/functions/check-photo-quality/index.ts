/**
 * check-photo-quality — Lightweight photo quality check for DSD simulation suitability.
 */

import { getCorsHeaders, handleCorsPreFlight, createErrorResponse, ERROR_MESSAGES } from "../_shared/cors.ts";
import { getSupabaseClient, authenticateRequest, isAuthError } from "../_shared/middleware.ts";
import { logger } from "../_shared/logger.ts";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = "gemini-2.0-flash";

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(req);
  if (preflightResponse) return preflightResponse;

  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405, corsHeaders);
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    // Auth — require authenticated user (but no credit charge)
    const supabase = getSupabaseClient();
    const authResult = await authenticateRequest(req, supabase, corsHeaders);
    if (isAuthError(authResult)) return authResult;

    const start = Date.now();

    const body = await req.json();
    const raw: string = body.imageBase64 || "";

    if (!raw) {
      return createErrorResponse(ERROR_MESSAGES.NO_PHOTO, 400, corsHeaders);
    }

    // Strip data URL prefix
    const imageData = raw.includes(",") ? raw.split(",")[1] : raw;
    const mimeType = raw.includes("data:image/png") ? "image/png" : "image/jpeg";
    const imageSizeKB = Math.round(imageData.length / 1024);

    logger.log(`check-photo-quality: image size ${imageSizeKB}KB, mime ${mimeType}`);

    const apiKey = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!apiKey) {
      logger.error("GOOGLE_AI_API_KEY not set");
      return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
    }

    const prompt = `Avalie esta foto dental para edição de imagem por IA.

A IA precisa editar cada dente. Para isso precisa ver onde cada dente começa (na gengiva) e termina (borda incisal).

REGRA ÚNICA: Olhe para os INCISIVOS CENTRAIS e LATERAIS superiores (os 4 dentes da frente).
- Você consegue ver GENGIVA (tecido rosa) ACIMA desses dentes? A gengiva está visível entre o lábio superior e o topo dos dentes?

SE SIM (gengiva visível acima dos centrais/laterais): score 65-85
SE NÃO (lábio superior cobre a gengiva, toca o topo dos dentes): score 25-45

Ajuste ±10 por foco, iluminação e visibilidade dos caninos.

Use a função.`;

    const toolSchema = {
      type: "object",
      properties: {
        score: {
          type: "number",
          description: "Score 0-100 de adequação da foto para edição de imagem por IA",
        },
      },
      required: ["score"],
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const geminiUrl = `${GEMINI_API_BASE}/${MODEL}:generateContent`;

    logger.log(`check-photo-quality: calling Gemini ${MODEL}...`);

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: imageData } },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 50,
        },
        tools: [{
          functionDeclarations: [{
            name: "report_quality",
            description: "Report the photo quality score",
            parameters: toolSchema,
          }],
        }],
        toolConfig: {
          functionCallingConfig: {
            mode: "ANY",
            allowedFunctionNames: ["report_quality"],
          },
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Gemini error ${response.status}: ${errorText.substring(0, 500)}`);
      // Return fallback score instead of error — don't block the user
      return new Response(
        JSON.stringify({ score: 50, fallback: true, gemini_status: response.status }),
        { status: 200, headers: jsonHeaders },
      );
    }

    const result = await response.json();
    const latencyMs = Date.now() - start;

    // Extract function call result
    const candidate = result.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const functionCall = parts.find((p: { functionCall?: unknown }) => p.functionCall);

    if (!functionCall?.functionCall?.args?.score && functionCall?.functionCall?.args?.score !== 0) {
      logger.warn("Gemini did not return score via function call", { parts: JSON.stringify(parts).substring(0, 500) });
      return new Response(
        JSON.stringify({ score: 50, latency_ms: latencyMs }),
        { status: 200, headers: jsonHeaders },
      );
    }

    const score = Math.max(0, Math.min(100, Math.round(functionCall.functionCall.args.score)));

    logger.log(`Photo quality score: ${score} (${latencyMs}ms)`);

    return new Response(
      JSON.stringify({ score, latency_ms: latencyMs }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (err) {
    const errMsg = (err as Error).message || String(err);

    if (errMsg.includes("abort") || errMsg.includes("AbortError")) {
      logger.warn(`Quality check timed out`);
      return new Response(
        JSON.stringify({ score: 50, timeout: true }),
        { status: 200, headers: jsonHeaders },
      );
    }

    logger.error("check-photo-quality error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", debug: errMsg }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
