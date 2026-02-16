import { getCorsHeaders, handleCorsPreFlight, ERROR_MESSAGES, createErrorResponse, generateRequestId } from "../_shared/cors.ts";
import { getSupabaseClient, authenticateRequest, isAuthError } from "../_shared/middleware.ts";
import { logger } from "../_shared/logger.ts";
import { callClaudeVisionWithTools, ClaudeError } from "../_shared/claude.ts";
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { checkAndUseCredits, createInsufficientCreditsResponse, refundCredits } from "../_shared/credits.ts";
import { getPrompt } from "../_shared/prompts/registry.ts";
import { withMetrics } from "../_shared/prompts/index.ts";
import type { PromptDefinition } from "../_shared/prompts/types.ts";
import type { Params as AnalyzePhotoParams } from "../_shared/prompts/definitions/analyze-dental-photo.ts";
import { createSupabaseMetrics, PROMPT_VERSION } from "../_shared/metrics-adapter.ts";
import { parseAIResponse, PhotoAnalysisResultSchema } from "../_shared/aiSchemas.ts";
import { stripJpegExif } from "../_shared/image-utils.ts";

import type { PhotoAnalysisResult } from "./types.ts";
import { validateImageRequest } from "./validation.ts";
import { ANALYZE_PHOTO_TOOL } from "./tool-schema.ts";
import { processAnalysisResult } from "./post-processing.ts";

// stripJpegExif imported from _shared/image-utils.ts

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const reqId = generateRequestId();

  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(req);
  if (preflightResponse) return preflightResponse;

  const t0 = Date.now();
  const step = (label: string) => logger.log(`[${reqId}] ${label} (+${Date.now() - t0}ms)`);
  step("analyze-dental-photo: start");

  // Track credit state for refund on error (must be outside try for catch access)
  let creditsConsumed = false;
  let supabaseForRefund: ReturnType<typeof getSupabaseClient> | null = null;
  let userIdForRefund: string | null = null;

  try {
    // Create service role client for all operations
    const supabaseService = getSupabaseClient();
    supabaseForRefund = supabaseService;

    // Validate authentication (includes deleted/banned checks)
    step("auth: authenticateRequest start");
    const authResult = await authenticateRequest(req, supabaseService, corsHeaders);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;
    step("auth: authenticateRequest done");
    const userId = user.id;
    userIdForRefund = userId;

    step("rateLimit: check start");
    const rateLimitResult = await checkRateLimit(supabaseService, userId, "analyze-dental-photo", RATE_LIMITS.AI_HEAVY);
    if (!rateLimitResult.allowed) {
      logger.warn(`Rate limit exceeded for user ${userId} on analyze-dental-photo`);
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }
    step("rateLimit: ok");

    // Parse and validate request
    let rawData: unknown;
    try {
      rawData = await req.json();
    } catch {
      return createErrorResponse(ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
    }
    step("body: parsed");

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

    // Strip EXIF metadata from JPEG images (privacy: remove GPS, device info, etc.)
    const sanitizedBase64 = isJPEG ? stripJpegExif(base64Data) : base64Data;
    const base64Image = sanitizedBase64;

    // Prompt from management module
    const promptDef = getPrompt('analyze-dental-photo') as PromptDefinition<AnalyzePhotoParams>;
    const promptParams: AnalyzePhotoParams = { imageType: data.imageType || "intraoral" };
    const systemPrompt = promptDef.system(promptParams);
    const userPrompt = promptDef.user(promptParams);

    // Determine MIME type from magic bytes
    const mimeType = isJPEG ? "image/jpeg" : isPNG ? "image/png" : "image/webp";

    // Metrics setup
    const metrics = createSupabaseMetrics(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Call Claude Vision with tools
    let analysisResult: PhotoAnalysisResult | null = null;

    try {
      step(`claude: calling (image=${Math.round(base64Image.length/1024)}KB)`);

      const result = await withMetrics<{ text: string | null; functionCall: { name: string; args: Record<string, unknown> } | null; finishReason: string }>(metrics, promptDef.id, PROMPT_VERSION, promptDef.model)(async () => {
        const response = await callClaudeVisionWithTools(
          promptDef.model,
          userPrompt,
          base64Image,
          mimeType,
          ANALYZE_PHOTO_TOOL,
          {
            systemPrompt,
            temperature: 0.0,
            maxTokens: 3000,
            forceFunctionName: "analyze_dental_photo",
            timeoutMs: 55_000,
          }
        );
        if (response.tokens) {
          logger.info('claude_tokens', { operation: 'analyze-dental-photo', ...response.tokens });
        }
        return {
          result: { text: response.text, functionCall: response.functionCall, finishReason: response.finishReason },
          tokensIn: response.tokens?.promptTokenCount ?? 0,
          tokensOut: response.tokens?.candidatesTokenCount ?? 0,
        };
      });

      step("claude: response received");
      if (result.functionCall) {
        step("claude: got function call");
        analysisResult = parseAIResponse(PhotoAnalysisResultSchema, result.functionCall.args, 'analyze-dental-photo') as PhotoAnalysisResult;
      } else if (result.text) {
        // Fallback: try to extract JSON from text response
        logger.log("No function call, checking text for JSON...");
        const jsonMatch = result.text.match(/```json\s*([\s\S]*?)\s*```/) || result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const jsonStr = jsonMatch[1] || jsonMatch[0];
            const parsed = JSON.parse(jsonStr);
            analysisResult = parseAIResponse(PhotoAnalysisResultSchema, parsed, 'analyze-dental-photo') as PhotoAnalysisResult;
          } catch (parseErr) {
            logger.error("Failed to parse/validate JSON from text response:", parseErr);
          }
        }
      }
    } catch (error) {
      if (error instanceof ClaudeError) {
        if (error.statusCode === 429) {
          return createErrorResponse(ERROR_MESSAGES.RATE_LIMITED, 429, corsHeaders, "RATE_LIMITED");
        }
        logger.error(`Claude API error (${error.statusCode}):`, error.message);
      } else {
        logger.error("AI error:", error);
      }
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.AI_ERROR }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!analysisResult) {
      return createErrorResponse(ERROR_MESSAGES.ANALYSIS_FAILED, 500, corsHeaders);
    }

    // Credits: only charge after AI analysis succeeds
    step("credits: check start");
    const creditResult = await checkAndUseCredits(supabaseService, userId, "case_analysis", reqId);
    if (!creditResult.allowed) {
      logger.warn(`Insufficient credits for user ${userId} on case_analysis`);
      return createInsufficientCreditsResponse(creditResult, corsHeaders);
    }
    creditsConsumed = true;
    step("credits: consumed");

    // Post-process AI result: normalize, deduplicate, filter, sort, add warnings
    const result = processAnalysisResult(analysisResult);

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
    step(`CRASH: ${error instanceof Error ? error.message : String(error)}`);
    logger.error(`[${reqId}] Error analyzing photo:`, error);
    // Refund credits on unexpected errors — user paid but got nothing
    if (creditsConsumed && supabaseForRefund && userIdForRefund) {
      await refundCredits(supabaseForRefund, userIdForRefund, "case_analysis", reqId);
      logger.log(`[${reqId}] Refunded analysis credits for user ${userIdForRefund} due to error`);
    }
    return new Response(
      JSON.stringify({ error: ERROR_MESSAGES.PROCESSING_ERROR }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
