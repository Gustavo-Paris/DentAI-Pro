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

    const prompt = `Look at this smile photo. This is a DENTAL photo — a close-up of someone smiling to show their teeth.

Answer TWO independent questions:

QUESTION 1 — GUM TISSUE:
Look above the upper front teeth. Is there ANY pink/red tissue (gum) visible between the teeth and the upper lip? Even a thin strip counts as visible.

QUESTION 2 — LIP POSITION:
Is the upper lip pressed DIRECTLY against the top edge of the upper front teeth? Meaning the lip physically touches the teeth with absolutely NO gap or space between them.

Fill in the function:
- gum_visible: true if ANY pink/red gum tissue is visible above the upper front teeth.
- gum_amount: "full" if gum clearly visible across multiple teeth, "some" if small strip visible, "none" if zero.
- lip_touches_teeth: true ONLY if the upper lip is physically pressed against the top of the teeth with no gap. false if there is ANY space between lip and teeth (even if filled by gum).
- teeth_with_gum: count of upper front teeth (0-6) where you can see gum tissue above them.

Call the function.`;

    const toolSchema = {
      type: "object",
      properties: {
        gum_visible: {
          type: "boolean",
          description: "Is there ANY pink/red gum tissue visible above the upper front teeth?",
        },
        gum_amount: {
          type: "string",
          enum: ["full", "some", "none"],
          description: "Amount of visible gum: full=clearly visible across multiple teeth, some=small strip, none=zero",
        },
        lip_touches_teeth: {
          type: "boolean",
          description: "Is the upper lip physically pressed against the top edge of the teeth with no gap?",
        },
        teeth_with_gum: {
          type: "integer",
          description: "Count of upper front teeth (0-6) where gum tissue is visible above them.",
        },
      },
      required: ["gum_visible", "gum_amount", "lip_touches_teeth", "teeth_with_gum"],
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
          temperature: 0.3,
          maxOutputTokens: 100,
        },
        tools: [{
          functionDeclarations: [{
            name: "report_quality",
            description: "Classificar a qualidade da foto dental",
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

    const args = functionCall?.functionCall?.args as {
      gum_visible?: boolean;
      gum_amount?: string;
      lip_touches_teeth?: boolean;
      teeth_with_gum?: number;
    } | undefined;

    if (!args) {
      logger.warn("Gemini did not return args via function call", { parts: JSON.stringify(parts).substring(0, 500) });
      return new Response(
        JSON.stringify({ score: 50, quality: "parcial", latency_ms: latencyMs }),
        { status: 200, headers: jsonHeaders },
      );
    }

    const { gum_visible, gum_amount, lip_touches_teeth, teeth_with_gum = 0 } = args;

    // OPTIMISTIC 2-tier scoring — GREEN or YELLOW only.
    // Gemini Flash has a strong negative bias for gum detection, so we never
    // return RED from this lightweight check. The full analyze-dental-photo
    // (Gemini Pro) provides a more reliable second check at the DSD step.
    const proGum = [
      gum_visible === true,
      gum_amount !== "none",
      lip_touches_teeth === false,
      teeth_with_gum > 0,
    ];
    const proGumCount = proGum.filter(Boolean).length;

    let quality: string;
    let score: number;

    if (proGumCount >= 2) {
      // Multiple signals say gum exists → GREEN
      quality = "otimo";
      score = 80;
    } else {
      // Few or no signals → YELLOW (advisory warning, never block)
      // Gemini Flash is non-deterministic and unreliable for gum detection,
      // so we never return RED from this lightweight check.
      quality = "parcial";
      score = 50;
    }

    logger.log(`Photo quality: gum_visible=${gum_visible}, gum_amount=${gum_amount}, lip_touches=${lip_touches_teeth}, teeth_count=${teeth_with_gum}, proGum=${proGumCount}/4 → ${quality} (score ${score}, ${latencyMs}ms)`);

    return new Response(
      JSON.stringify({ score, quality, gum_visible, gum_amount, lip_touches_teeth, teeth_with_gum, latency_ms: latencyMs }),
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
