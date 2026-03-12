import { getCorsHeaders, handleCorsPreFlight, createErrorResponse, ERROR_MESSAGES, generateRequestId } from "../_shared/cors.ts";
import { getSupabaseClient, authenticateRequest, isAuthError } from "../_shared/middleware.ts";
import { sanitizeForPrompt } from "../_shared/validation.ts";
import { logger } from "../_shared/logger.ts";
import { callClaudeWithTools, ClaudeError, type OpenAIMessage, type OpenAITool } from "../_shared/claude.ts";
import { callGeminiWithTools, GeminiError } from "../_shared/gemini.ts";
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { getPrompt, withMetrics } from "../_shared/prompts/index.ts";
import { createSupabaseMetrics, PROMPT_VERSION } from "../_shared/metrics-adapter.ts";
import { parseAIResponse, CementationProtocolSchema } from "../_shared/aiSchemas.ts";
import {
  validateRequest,
  validateHFConcentration,
  deriveTreatmentType,
  type RequestData,
} from "./cementation-helpers.ts";

// Cementation protocol interfaces
interface CementationStep {
  order: number;
  step: string;
  material: string;
  technique?: string;
  time?: string;
}

interface CementationProtocol {
  preparation_steps: CementationStep[];
  ceramic_treatment: CementationStep[];
  tooth_treatment: CementationStep[];
  cementation: {
    cement_type: string;
    cement_brand: string;
    shade: string;
    light_curing_time: string;
    technique: string;
  };
  finishing: CementationStep[];
  post_operative: string[];
  checklist: string[];
  alerts: string[];
  warnings: string[];
  confidence: "alta" | "média" | "baixa";
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreFlight(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);
  const reqId = generateRequestId();
  logger.log(`[${reqId}] recommend-cementation: start`);

  try {
    // Create service role client
    const supabase = getSupabaseClient();

    // Validate authentication (includes deleted/banned checks)
    const authResult = await authenticateRequest(req, supabase, corsHeaders);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;

    // Check rate limit (AI_LIGHT: 20/min, 100/hour, 500/day)
    const rateLimitResult = await checkRateLimit(
      supabase,
      user.id,
      "recommend-cementation",
      RATE_LIMITS.AI_LIGHT
    );

    if (!rateLimitResult.allowed) {
      logger.warn(`Rate limit exceeded for user ${user.id} on recommend-cementation`);
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse("Invalid request body", 400, corsHeaders);
    }
    const clientOperationId = (body as Record<string, unknown>).operationId as string | undefined;
    const validation = validateRequest(body);

    if (!validation.success || !validation.data) {
      return createErrorResponse(validation.error || ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
    }

    const { evaluationId, teeth } = validation.data;
    // Sanitize all free-text fields before passing to AI prompt
    const shade = sanitizeForPrompt(validation.data.shade);
    const ceramicType = sanitizeForPrompt(validation.data.ceramicType);
    const substrate = sanitizeForPrompt(validation.data.substrate);
    const substrateCondition = validation.data.substrateCondition ? sanitizeForPrompt(validation.data.substrateCondition) : validation.data.substrateCondition;
    const aestheticGoals = validation.data.aestheticGoals ? sanitizeForPrompt(validation.data.aestheticGoals) : validation.data.aestheticGoals;

    // Read optional anamnesis from request body
    const rawAnamnesis = (body as Record<string, unknown>).anamnesis;
    let anamnesisContext = '';
    if (rawAnamnesis && typeof rawAnamnesis === 'string' && rawAnamnesis.trim().length > 0) {
      anamnesisContext = `\n\nANAMNESE DO PACIENTE:\n"""${sanitizeForPrompt(rawAnamnesis.trim())}"""\nConsidere queixas do paciente. Se sensibilidade reportada → protocolo dessensibilizante antes da cimentacao. Se bruxismo → cimento de alta resistencia.`;
    }

    // Sanitize dsdContext free-text fields to prevent prompt injection
    const dsdContext = validation.data.dsdContext ? {
      ...validation.data.dsdContext,
      currentIssue: sanitizeForPrompt(String(validation.data.dsdContext.currentIssue || '')),
      proposedChange: sanitizeForPrompt(String(validation.data.dsdContext.proposedChange || '')),
      observations: Array.isArray(validation.data.dsdContext.observations)
        ? validation.data.dsdContext.observations.map((o: unknown) => sanitizeForPrompt(String(o)))
        : [],
    } : undefined;

    // Verify evaluation ownership
    const { data: evalData, error: evalError } = await supabase
      .from("evaluations")
      .select("user_id")
      .eq("id", evaluationId)
      .single();

    if (evalError || !evalData || evalData.user_id !== user.id) {
      return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 403, corsHeaders);
    }

    // AI prompt for cementation protocol (from prompt registry)
    const prompt = getPrompt('recommend-cementation');
    const systemPrompt = prompt.system({ teeth, shade, ceramicType, substrate, substrateCondition, aestheticGoals, dsdContext });
    const userPrompt = prompt.user({ teeth, shade, ceramicType, substrate, substrateCondition, aestheticGoals, dsdContext }) + anamnesisContext;

    // Tool definition for structured output
    const tools = [
      {
        type: "function",
        function: {
          name: "generate_cementation_protocol",
          description: "Gera um protocolo completo de cimentação de facetas cerâmicas",
          parameters: {
            type: "object",
            properties: {
              preparation_steps: {
                type: "array",
                description: "Etapas de preparo (se aplicável)",
                items: {
                  type: "object",
                  properties: {
                    order: { type: "number" },
                    step: { type: "string" },
                    material: { type: "string" },
                    technique: { type: "string" },
                    time: { type: "string" },
                  },
                  required: ["order", "step", "material"],
                },
              },
              ceramic_treatment: {
                type: "array",
                description: "Tratamento da superfície cerâmica",
                items: {
                  type: "object",
                  properties: {
                    order: { type: "number" },
                    step: { type: "string" },
                    material: { type: "string" },
                    time: { type: "string" },
                  },
                  required: ["order", "step", "material"],
                },
              },
              tooth_treatment: {
                type: "array",
                description: "Tratamento da superfície dental",
                items: {
                  type: "object",
                  properties: {
                    order: { type: "number" },
                    step: { type: "string" },
                    material: { type: "string" },
                    time: { type: "string" },
                  },
                  required: ["order", "step", "material"],
                },
              },
              cementation: {
                type: "object",
                description: "Detalhes do cimento e técnica de cimentação",
                properties: {
                  cement_type: { type: "string", description: "Tipo de cimento (fotopolimerizável, dual, etc)" },
                  cement_brand: { type: "string", description: "Marca sugerida do cimento" },
                  shade: { type: "string", description: "Cor do cimento" },
                  light_curing_time: { type: "string", description: "Tempo de fotopolimerização" },
                  technique: { type: "string", description: "Técnica de inserção e remoção de excessos" },
                },
                required: ["cement_type", "cement_brand", "shade", "light_curing_time", "technique"],
              },
              finishing: {
                type: "array",
                description: "Etapas de acabamento e polimento",
                items: {
                  type: "object",
                  properties: {
                    order: { type: "number" },
                    step: { type: "string" },
                    material: { type: "string" },
                  },
                  required: ["order", "step", "material"],
                },
              },
              post_operative: {
                type: "array",
                items: { type: "string" },
                description: "Recomendações pós-operatórias para o paciente",
              },
              checklist: {
                type: "array",
                items: { type: "string" },
                description: "Checklist passo a passo para o dentista",
              },
              alerts: {
                type: "array",
                items: { type: "string" },
                description: "O que NÃO fazer durante o procedimento",
              },
              warnings: {
                type: "array",
                items: { type: "string" },
                description: "Pontos de atenção importantes",
              },
              confidence: {
                type: "string",
                enum: ["alta", "média", "baixa"],
                description: "Nível de confiança do protocolo",
              },
            },
            required: [
              "preparation_steps",
              "ceramic_treatment",
              "tooth_treatment",
              "cementation",
              "finishing",
              "post_operative",
              "checklist",
              "alerts",
              "warnings",
              "confidence",
            ],
            additionalProperties: false,
          },
        },
      },
    ];

    // Metrics setup
    const metrics = createSupabaseMetrics(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Call Claude for protocol generation
    const messages: OpenAIMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    let protocol: CementationProtocol;
    let usedProvider: 'gemini' | 'claude' = 'gemini';
    const EDGE_FUNCTION_BUDGET_MS = 140_000; // 150s Deno limit minus 10s safety margin
    const aiStartTime = Date.now();
    try {
      // Gemini 3 Flash primary — 20x cheaper than Claude, frontier-class quality
      let aiResult: { functionCall: { name: string; args: Record<string, unknown> } | null; text: string | null };
      try {
        const geminiResult = await withMetrics<{ text: string | null; functionCall: { name: string; args: Record<string, unknown> } | null; finishReason: string }>(metrics, prompt.id, PROMPT_VERSION, 'gemini-3-flash-preview')(async () => {
          const response = await callGeminiWithTools(
            'gemini-3-flash-preview',
            messages,
            tools as OpenAITool[],
            {
              temperature: 0.0,
              maxTokens: 4000,
              forceFunctionName: "generate_cementation_protocol",
              timeoutMs: 45_000,
              maxRetries: 0, // no retry — fallback to Claude uses remaining budget
            }
          );
          if (response.tokens) {
            logger.info('gemini_tokens', { operation: 'recommend-cementation', ...response.tokens });
          }
          return {
            result: { text: response.text, functionCall: response.functionCall, finishReason: response.finishReason },
            tokensIn: response.tokens?.promptTokenCount ?? 0,
            tokensOut: response.tokens?.candidatesTokenCount ?? 0,
          };
        });
        aiResult = geminiResult;
      } catch (geminiErr) {
        const isRateLimit = geminiErr instanceof GeminiError && geminiErr.statusCode === 429;
        if (isRateLimit) {
          return createErrorResponse(ERROR_MESSAGES.RATE_LIMITED, 429, corsHeaders, "RATE_LIMITED");
        }
        logger.warn(`[${reqId}] Gemini failed, falling back to Claude Sonnet: ${geminiErr instanceof Error ? geminiErr.message : String(geminiErr)}`);
        aiResult = { functionCall: null, text: null }; // trigger Claude fallback below
      }

      // Gemini returned no function call (empty/text-only response) — also fall back to Claude
      if (!aiResult.functionCall && usedProvider === 'gemini') {
        // Calculate remaining time budget for Claude fallback
        const elapsedMs = Date.now() - aiStartTime;
        const remainingMs = EDGE_FUNCTION_BUDGET_MS - elapsedMs;
        if (remainingMs < 10_000) {
          logger.error(`[${reqId}] Insufficient time budget for Claude fallback: ${remainingMs}ms remaining after ${elapsedMs}ms`);
          return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders, 'TIMEOUT_BUDGET_EXHAUSTED');
        }
        logger.warn(`[${reqId}] Gemini returned no function call, falling back to Claude Sonnet (${remainingMs}ms remaining)`);
        usedProvider = 'claude';
        const claudeResult = await callClaudeWithTools(
          prompt.model,
          messages,
          tools as OpenAITool[],
          {
            temperature: 0.0,
            maxTokens: 4000,
            forceFunctionName: "generate_cementation_protocol",
            timeoutMs: remainingMs, // elapsed-time-aware: use whatever budget remains
            maxRetries: 0,
          }
        );
        if (claudeResult.tokens) {
          logger.info('claude_tokens', { operation: 'recommend-cementation-fallback', ...claudeResult.tokens });
        }
        aiResult = claudeResult;
      }

      if (!aiResult.functionCall) {
        logger.error(`No function call in ${usedProvider} response`);
        return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
      }

      protocol = parseAIResponse(CementationProtocolSchema, aiResult.functionCall.args, 'recommend-cementation') as CementationProtocol;
    } catch (error) {
      if (error instanceof ClaudeError) {
        logger.error(`[${reqId}] Claude API error (${error.statusCode}):`, error.message);
        return createErrorResponse(
          ERROR_MESSAGES.AI_ERROR,
          500, corsHeaders, `CLAUDE_${error.statusCode}`, reqId,
        );
      } else if (error instanceof GeminiError) {
        logger.error(`[${reqId}] Gemini API error (${error.statusCode}):`, error.message);
        return createErrorResponse(
          ERROR_MESSAGES.AI_ERROR,
          500, corsHeaders, `GEMINI_${error.statusCode}`, reqId,
        );
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[${reqId}] AI error:`, errMsg);
      return createErrorResponse(
        ERROR_MESSAGES.AI_ERROR,
        500, corsHeaders, undefined, reqId,
      );
    }

    // Post-processing (no credit charge — protocol generation is included in case_analysis credit)
    {
        // HF acid safety net: ensure lithium disilicate never gets 10% HF
        validateHFConcentration(protocol as unknown as Record<string, unknown>, ceramicType);

        // Derive treatment_type from the ceramic type in the request.
        // "porcelana" is the most common but not the only option — e.g., "coroa"
        // for full crowns, or other ceramic-based restorations.
        const treatmentType = deriveTreatmentType(ceramicType);

        // Update evaluation with cementation protocol
        const { error: updateError } = await supabase
          .from("evaluations")
          .update({
            cementation_protocol: protocol,
            treatment_type: treatmentType,
          })
          .eq("id", evaluationId)
          .eq("user_id", user.id);

        if (updateError) {
          logger.error("Update error:", updateError);
          return createErrorResponse("Protocolo gerado mas falhou ao salvar. Tente novamente.", 500, corsHeaders);
        }

        return new Response(
          JSON.stringify({
            success: true,
            protocol,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error(`[${reqId}] recommend-cementation error:`, errMsg);
    return createErrorResponse(
      ERROR_MESSAGES.PROCESSING_ERROR,
      500, corsHeaders, undefined, reqId,
    );
  }
});
