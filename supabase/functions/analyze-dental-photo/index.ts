import { getCorsHeaders, handleCorsPreFlight, ERROR_MESSAGES, createErrorResponse, generateRequestId } from "../_shared/cors.ts";
import { getSupabaseClient, authenticateRequest, isAuthError } from "../_shared/middleware.ts";
import { logger } from "../_shared/logger.ts";
import { callGeminiVisionWithTools, GeminiError } from "../_shared/gemini.ts";
import { callClaudeVisionWithTools, ClaudeError } from "../_shared/claude.ts";
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { withCreditProtection, isInsufficientCreditsResponse } from "../_shared/withCreditProtection.ts";
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

  try {
    // Create service role client for all operations
    const supabaseService = getSupabaseClient();

    // Validate authentication (includes deleted/banned checks)
    step("auth: authenticateRequest start");
    const authResult = await authenticateRequest(req, supabaseService, corsHeaders);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;
    step("auth: authenticateRequest done");
    const userId = user.id;

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
    const { additionalPhotos, patientPreferences } = data;

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

    // Build context strings from additional photos and preferences
    let additionalContext = '';
    if (additionalPhotos?.face) {
      additionalContext += '\nFoto de ROSTO fornecida: análise de visagismo OBRIGATÓRIA (formato facial, temperamento, formato dental recomendado).';
    }
    if (additionalPhotos?.smile45) {
      additionalContext += '\nFoto de SORRISO 45° fornecida: avaliar corredor bucal, projeção labial e curvatura do arco com mais precisão.';
    }

    let preferencesContext = '';
    if (patientPreferences?.whiteningLevel) {
      preferencesContext += `\nNível de clareamento desejado: ${patientPreferences.whiteningLevel}`;
    }

    // Prompt from management module
    const promptDef = getPrompt('analyze-dental-photo') as PromptDefinition<AnalyzePhotoParams>;
    const promptParams: AnalyzePhotoParams = {
      imageType: data.imageType || "intraoral",
      additionalContext: additionalContext || undefined,
      preferencesContext: preferencesContext || undefined,
    };
    const systemPrompt = promptDef.system(promptParams);
    const userPrompt = promptDef.user(promptParams);

    // Determine MIME type from magic bytes
    const mimeType = isJPEG ? "image/jpeg" : isPNG ? "image/png" : "image/webp";

    // Build additional images array from face/smile45 photos
    const additionalImages: Array<{ data: string; mimeType: string }> = [];
    if (additionalPhotos?.face) {
      additionalImages.push({ data: extractBase64(additionalPhotos.face), mimeType: 'image/jpeg' });
    }
    if (additionalPhotos?.smile45) {
      additionalImages.push({ data: extractBase64(additionalPhotos.smile45), mimeType: 'image/jpeg' });
    }
    if (additionalImages.length > 0) {
      step(`additionalImages: ${additionalImages.length} extra photo(s)`);
    }

    // Metrics setup
    const metrics = createSupabaseMetrics(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Call Gemini 3.1 Pro Vision (primary) with Claude Sonnet fallback
    let analysisResult: PhotoAnalysisResult | null = null;

    const parseVisionResult = (result: { text: string | null; functionCall: { name: string; args: Record<string, unknown> } | null }) => {
      if (result.functionCall) {
        return parseAIResponse(PhotoAnalysisResultSchema, result.functionCall.args, 'analyze-dental-photo') as PhotoAnalysisResult;
      }
      if (result.text) {
        const jsonMatch = result.text.match(/```json\s*([\s\S]*?)\s*```/) || result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          return parseAIResponse(PhotoAnalysisResultSchema, JSON.parse(jsonStr), 'analyze-dental-photo') as PhotoAnalysisResult;
        }
      }
      return null;
    };

    try {
      step(`gemini: calling (image=${Math.round(base64Image.length/1024)}KB)`);

      const result = await withMetrics<{ text: string | null; functionCall: { name: string; args: Record<string, unknown> } | null; finishReason: string }>(metrics, promptDef.id, PROMPT_VERSION, promptDef.model)(async () => {
        const response = await callGeminiVisionWithTools(
          promptDef.model,
          userPrompt,
          base64Image,
          mimeType,
          ANALYZE_PHOTO_TOOL,
          {
            systemPrompt,
            temperature: 0.0,
            maxTokens: 4000,
            forceFunctionName: "analyze_dental_photo",
            timeoutMs: 55_000,
            thinkingLevel: "low",
            additionalImages: additionalImages.length > 0 ? additionalImages : undefined,
          }
        );
        if (response.tokens) {
          logger.info('gemini_tokens', { operation: 'analyze-dental-photo', ...response.tokens });
        }
        return {
          result: { text: response.text, functionCall: response.functionCall, finishReason: response.finishReason },
          tokensIn: response.tokens?.promptTokenCount ?? 0,
          tokensOut: response.tokens?.candidatesTokenCount ?? 0,
        };
      });

      step("gemini: response received");
      analysisResult = parseVisionResult(result);
      if (analysisResult) step("gemini: parsed ok");
    } catch (primaryError) {
      // Gemini failed — try Claude Sonnet 4.6 as fallback
      const errMsg = primaryError instanceof Error ? primaryError.message : String(primaryError);
      const statusCode = primaryError instanceof GeminiError ? primaryError.statusCode : 0;
      logger.warn(`Gemini failed (${statusCode}): ${errMsg}. Trying Claude fallback...`);

      if (statusCode === 429) {
        return createErrorResponse(ERROR_MESSAGES.RATE_LIMITED, 429, corsHeaders, "RATE_LIMITED");
      }

      try {
        step("claude-fallback: calling");
        const fallbackModel = "claude-sonnet-4-6";
        const fallbackResult = await withMetrics<{ text: string | null; functionCall: { name: string; args: Record<string, unknown> } | null; finishReason: string }>(metrics, promptDef.id, PROMPT_VERSION, fallbackModel)(async () => {
          const response = await callClaudeVisionWithTools(
            fallbackModel,
            userPrompt,
            base64Image,
            mimeType,
            ANALYZE_PHOTO_TOOL,
            {
              systemPrompt,
              temperature: 0.0,
              maxTokens: 4000,
              forceFunctionName: "analyze_dental_photo",
              timeoutMs: 50_000,
              additionalImages: additionalImages.length > 0 ? additionalImages : undefined,
            }
          );
          if (response.tokens) {
            logger.info('claude_tokens', { operation: 'analyze-dental-photo-fallback', ...response.tokens });
          }
          return {
            result: { text: response.text, functionCall: response.functionCall, finishReason: response.finishReason },
            tokensIn: response.tokens?.promptTokenCount ?? 0,
            tokensOut: response.tokens?.candidatesTokenCount ?? 0,
          };
        });

        step("claude-fallback: response received");
        analysisResult = parseVisionResult(fallbackResult);
        if (analysisResult) step("claude-fallback: parsed ok");
      } catch (fallbackError) {
        if (fallbackError instanceof ClaudeError && fallbackError.statusCode === 429) {
          return createErrorResponse(ERROR_MESSAGES.RATE_LIMITED, 429, corsHeaders, "RATE_LIMITED");
        }
        const fbMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        logger.error(`Both Gemini and Claude failed. Gemini: ${errMsg}. Claude: ${fbMsg}`);
        return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
      }
    }

    if (!analysisResult) {
      return createErrorResponse(ERROR_MESSAGES.ANALYSIS_FAILED, 500, corsHeaders);
    }

    // Credits + post-processing wrapped in credit protection (auto-refund on error)
    return await withCreditProtection(
      { supabase: supabaseService, userId, operation: "case_analysis", operationId: reqId, corsHeaders },
      async (credits) => {
        step("credits: check start");
        const creditResult = await credits.consume();
        if (isInsufficientCreditsResponse(creditResult)) return creditResult;
        step("credits: consumed");

        // Post-process AI result: normalize, deduplicate, filter, sort, add warnings
        const result = processAnalysisResult(analysisResult, {
          hasFacePhoto: !!additionalPhotos?.face,
        });

        // Ensure mandatory clinical safety disclaimer
        const DISCLAIMER = 'Esta análise é assistida por IA e tem caráter de apoio à decisão clínica. Todos os achados devem ser confirmados por exame clínico e radiográfico complementar.';
        if (result.observations) {
          if (!result.observations.some((o: string) => o.includes('apoio à decisão'))) {
            result.observations.unshift(DISCLAIMER);
          }
        } else {
          result.observations = [DISCLAIMER];
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
      },
    );
  } catch (error: unknown) {
    step(`CRASH: ${error instanceof Error ? error.message : String(error)}`);
    logger.error(`[${reqId}] Error analyzing photo:`, error);
    return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders, undefined, reqId);
  }
});

/**
 * Extract raw base64 data from a data URL or return as-is if already raw base64.
 * Strips the `data:image/...;base64,` prefix if present.
 */
function extractBase64(dataUrl: string): string {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex !== -1 && dataUrl.startsWith('data:')) {
    return dataUrl.substring(commaIndex + 1);
  }
  return dataUrl;
}
