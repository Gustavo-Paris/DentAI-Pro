import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreFlight, createErrorResponse, ERROR_MESSAGES, generateRequestId } from "../_shared/cors.ts";
import { sanitizeForPrompt } from "../_shared/validation.ts";
import { logger } from "../_shared/logger.ts";
import { callClaudeWithTools, ClaudeError, type OpenAIMessage, type OpenAITool } from "../_shared/claude.ts";
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { checkAndUseCredits, createInsufficientCreditsResponse, refundCredits } from "../_shared/credits.ts";
import { getPrompt, withMetrics } from "../_shared/prompts/index.ts";
import { createSupabaseMetrics, PROMPT_VERSION } from "../_shared/metrics-adapter.ts";
import { parseAIResponse, CementationProtocolSchema } from "../_shared/aiSchemas.ts";

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

interface DSDContext {
  currentIssue: string;
  proposedChange: string;
  observations: string[];
}

interface RequestData {
  evaluationId: string;
  teeth: string[];
  shade: string;
  ceramicType?: string;
  substrate: string;
  substrateCondition?: string;
  aestheticGoals?: string;
  dsdContext?: DSDContext;
}

// Validate request
function validateRequest(data: unknown): { success: boolean; error?: string; data?: RequestData } {
  if (!data || typeof data !== "object") {
    return { success: false, error: "Dados inválidos" };
  }

  const req = data as Record<string, unknown>;

  if (!req.evaluationId || typeof req.evaluationId !== "string") {
    return { success: false, error: "ID da avaliação não fornecido" };
  }

  if (!req.teeth || !Array.isArray(req.teeth) || req.teeth.length === 0) {
    return { success: false, error: "Dentes não especificados" };
  }

  if (!req.shade || typeof req.shade !== "string") {
    return { success: false, error: "Cor não especificada" };
  }

  if (!req.substrate || typeof req.substrate !== "string") {
    return { success: false, error: "Substrato não especificado" };
  }

  return {
    success: true,
    data: {
      evaluationId: req.evaluationId as string,
      teeth: req.teeth as string[],
      shade: req.shade as string,
      ceramicType: (req.ceramicType as string) || "Dissilicato de lítio",
      substrate: req.substrate as string,
      substrateCondition: req.substrateCondition as string | undefined,
      aestheticGoals: req.aestheticGoals as string | undefined,
      dsdContext: req.dsdContext as DSDContext | undefined,
    },
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreFlight(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);
  const reqId = generateRequestId();
  logger.log(`[${reqId}] recommend-cementation: start`);

  // Track credit state for refund on error (must be outside try for catch access)
  let creditsConsumed = false;
  let supabaseForRefund: ReturnType<typeof createClient> | null = null;
  let userIdForRefund: string | null = null;

  try {
    // Get environment variables
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      logger.error("Missing required environment variables");
      return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
    }

    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401, corsHeaders);
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    supabaseForRefund = supabase;

    // Validate user token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return createErrorResponse(ERROR_MESSAGES.INVALID_TOKEN, 401, corsHeaders);
    }

    userIdForRefund = user.id;

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

    // Check and consume credits
    const creditResult = await checkAndUseCredits(supabase, user.id, "cementation_recommendation", reqId);
    if (!creditResult.allowed) {
      logger.warn(`Insufficient credits for user ${user.id} on cementation_recommendation`);
      return createInsufficientCreditsResponse(creditResult, corsHeaders);
    }
    creditsConsumed = true;

    // Parse and validate request body
    const body = await req.json();
    const validation = validateRequest(body);

    if (!validation.success || !validation.data) {
      return createErrorResponse(validation.error || ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
    }

    const { evaluationId, teeth, shade, ceramicType, substrate, substrateCondition, aestheticGoals: rawGoals, dsdContext } = validation.data;
    const aestheticGoals = rawGoals ? sanitizeForPrompt(rawGoals) : rawGoals;

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
    const systemPrompt = prompt.system({ teeth, shade, ceramicType: ceramicType!, substrate, substrateCondition, aestheticGoals, dsdContext });
    const userPrompt = prompt.user({ teeth, shade, ceramicType: ceramicType!, substrate, substrateCondition, aestheticGoals, dsdContext });

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
    try {
      const claudeResult = await withMetrics<{ text: string | null; functionCall: { name: string; args: Record<string, unknown> } | null; finishReason: string }>(metrics, prompt.id, PROMPT_VERSION, prompt.model)(async () => {
        const response = await callClaudeWithTools(
          "claude-sonnet-4-5-20250929",
          messages,
          tools as OpenAITool[],
          {
            temperature: 0.0,
            maxTokens: 4000,
            forceFunctionName: "generate_cementation_protocol",
          }
        );
        if (response.tokens) {
          logger.info('claude_tokens', { operation: 'recommend-cementation', ...response.tokens });
        }
        return {
          result: { text: response.text, functionCall: response.functionCall, finishReason: response.finishReason },
          tokensIn: response.tokens?.promptTokenCount ?? 0,
          tokensOut: response.tokens?.candidatesTokenCount ?? 0,
        };
      });

      if (!claudeResult.functionCall) {
        logger.error("No function call in Claude response");
        if (creditsConsumed && supabaseForRefund && userIdForRefund) {
          await refundCredits(supabaseForRefund, userIdForRefund, "cementation_recommendation", reqId);
          logger.log(`[${reqId}] Refunded cementation_recommendation credits for user ${userIdForRefund} — no function call in AI response`);
        }
        return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
      }

      protocol = parseAIResponse(CementationProtocolSchema, claudeResult.functionCall.args, 'recommend-cementation') as CementationProtocol;
    } catch (error) {
      if (error instanceof ClaudeError) {
        if (error.statusCode === 429) {
          if (creditsConsumed && supabaseForRefund && userIdForRefund) {
            await refundCredits(supabaseForRefund, userIdForRefund, "cementation_recommendation", reqId);
          }
          return createErrorResponse(ERROR_MESSAGES.RATE_LIMITED, 429, corsHeaders, "RATE_LIMITED");
        }
        logger.error("Claude API error:", error.message);
      } else {
        logger.error("AI error:", error);
      }
      // Refund credits on AI errors
      if (creditsConsumed && supabaseForRefund && userIdForRefund) {
        await refundCredits(supabaseForRefund, userIdForRefund, "cementation_recommendation", reqId);
        logger.log(`Refunded cementation_recommendation credits for user ${userIdForRefund} due to AI error`);
      }
      return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
    }

    // Update evaluation with cementation protocol
    const { error: updateError } = await supabase
      .from("evaluations")
      .update({
        cementation_protocol: protocol,
        treatment_type: "porcelana",
      })
      .eq("id", evaluationId);

    if (updateError) {
      console.error("Update error:", updateError);
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
  } catch (error) {
    logger.error(`[${reqId}] recommend-cementation error:`, error);
    // Refund credits on unexpected errors
    if (creditsConsumed && supabaseForRefund && userIdForRefund) {
      await refundCredits(supabaseForRefund, userIdForRefund, "cementation_recommendation", reqId);
      logger.log(`[${reqId}] Refunded cementation_recommendation credits for user ${userIdForRefund} due to error`);
    }
    return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders, undefined, reqId);
  }
});
