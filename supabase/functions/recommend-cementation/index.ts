import { getCorsHeaders, handleCorsPreFlight, createErrorResponse, ERROR_MESSAGES, generateRequestId } from "../_shared/cors.ts";
import { getSupabaseClient, authenticateRequest, isAuthError } from "../_shared/middleware.ts";
import { sanitizeForPrompt } from "../_shared/validation.ts";
import { logger } from "../_shared/logger.ts";
import { callClaudeWithTools, ClaudeError, type OpenAIMessage, type OpenAITool } from "../_shared/claude.ts";
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { withCreditProtection, isInsufficientCreditsResponse } from "../_shared/withCreditProtection.ts";
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
  ceramicType: string;
  substrate: string;
  substrateCondition?: string;
  aestheticGoals?: string;
  dsdContext?: DSDContext;
}

// FDI tooth notation regex: 2 digits, first digit 1-4 (permanent teeth only)
const FDI_TOOTH_REGEX = /^[1-4][1-8]$/;

// Valid ceramic types — closed enum to prevent wrong HF acid protocol
const VALID_CERAMIC_TYPES = [
  'dissilicato_de_litio',      // e.max
  'leucita',                    // IPS Empress
  'feldspatica',               // Feldspathic
  'zirconia',                   // Zirconia
  'zirconia_reforcada',        // Reinforced zirconia
  'resina_cad_cam',            // CAD/CAM resin
] as const;

// Map Portuguese display names → normalized keys
const CERAMIC_TYPE_ALIASES: Record<string, typeof VALID_CERAMIC_TYPES[number]> = {
  'dissilicato de litio':       'dissilicato_de_litio',
  'dissilicato de lítio':       'dissilicato_de_litio',
  'e.max':                      'dissilicato_de_litio',
  'emax':                       'dissilicato_de_litio',
  'ips e.max':                  'dissilicato_de_litio',
  'leucita':                    'leucita',
  'ips empress':                'leucita',
  'empress':                    'leucita',
  'feldspatica':                'feldspatica',
  'feldspática':                'feldspatica',
  'ceramica feldspática':       'feldspatica',
  'ceramica feldspatica':       'feldspatica',
  'porcelana feldspática':      'feldspatica',
  'porcelana feldspatica':      'feldspatica',
  'zirconia':                   'zirconia',
  'zircônia':                   'zirconia',
  'zirconia reforcada':         'zirconia_reforcada',
  'zircônia reforçada':         'zirconia_reforcada',
  'zirconia reforçada':         'zirconia_reforcada',
  'zircônia reforcada':         'zirconia_reforcada',
  'resina cad cam':             'resina_cad_cam',
  'resina cad/cam':             'resina_cad_cam',
  'cad cam':                    'resina_cad_cam',
  'cad/cam':                    'resina_cad_cam',
};

/**
 * Normalize a ceramicType input string: lowercase, trim, strip accents for
 * matching, then look up in alias map or direct enum match.
 * Returns the normalized key or null if invalid.
 */
function normalizeCeramicType(raw: string): typeof VALID_CERAMIC_TYPES[number] | null {
  const trimmed = raw.trim().toLowerCase();
  // Strip Unicode accents for matching
  const stripped = trimmed.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Direct enum match (already a valid key)
  if ((VALID_CERAMIC_TYPES as readonly string[]).includes(trimmed)) {
    return trimmed as typeof VALID_CERAMIC_TYPES[number];
  }
  if ((VALID_CERAMIC_TYPES as readonly string[]).includes(stripped)) {
    return stripped as typeof VALID_CERAMIC_TYPES[number];
  }

  // Alias lookup (try with accents first, then without)
  if (CERAMIC_TYPE_ALIASES[trimmed]) {
    return CERAMIC_TYPE_ALIASES[trimmed];
  }
  // Try alias lookup with stripped accents on all alias keys
  for (const [alias, key] of Object.entries(CERAMIC_TYPE_ALIASES)) {
    const aliasStripped = alias.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (aliasStripped === stripped) {
      return key;
    }
  }

  return null;
}

/**
 * Derives the correct treatment_type for the evaluations table from the ceramic type.
 * Cementation protocols are used for porcelain/ceramic restorations but the specific
 * treatment_type depends on what kind of restoration is being cemented.
 *
 * Maps:
 * - Zirconia full crowns → "coroa"
 * - Everything else (veneers, onlays, overlays, etc.) → "porcelana"
 *
 * NOTE: This is a best-effort mapping from ceramicType. Future improvement could
 * accept an explicit treatment_type in the request payload.
 */
function deriveTreatmentType(ceramicTypeRaw: string): string {
  const normalized = normalizeCeramicType(ceramicTypeRaw);
  // Zirconia and reinforced zirconia are primarily used for full crowns
  if (normalized === "zirconia" || normalized === "zirconia_reforcada") {
    return "coroa";
  }
  // All other ceramic types (lithium disilicate, leucite, feldspathic, CAD/CAM resin)
  // are typically used for veneers/laminates — "porcelana"
  return "porcelana";
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

  if (req.teeth.length > 32) {
    return { success: false, error: "Número máximo de dentes excedido (32)" };
  }

  // Validate each tooth matches FDI notation (2 digits, first digit 1-8)
  for (const tooth of req.teeth) {
    if (typeof tooth !== "string" || !FDI_TOOTH_REGEX.test(tooth)) {
      return { success: false, error: `Dente inválido: ${String(tooth).substring(0, 10)}` };
    }
  }

  if (!req.shade || typeof req.shade !== "string") {
    return { success: false, error: "Cor não especificada" };
  }

  if (!req.substrate || typeof req.substrate !== "string") {
    return { success: false, error: "Substrato não especificado" };
  }

  if (!req.ceramicType || typeof req.ceramicType !== "string") {
    return { success: false, error: "ceramicType é obrigatório para gerar protocolo de cimentação" };
  }

  // Validate ceramicType against closed enum — wrong type → wrong HF acid protocol → irreversible damage
  const normalizedCeramicType = normalizeCeramicType(req.ceramicType as string);
  if (!normalizedCeramicType) {
    return {
      success: false,
      error: `Tipo cerâmico inválido: "${String(req.ceramicType).substring(0, 50)}". Tipos aceitos: ${VALID_CERAMIC_TYPES.join(', ')}`,
    };
  }

  return {
    success: true,
    data: {
      evaluationId: req.evaluationId as string,
      teeth: req.teeth as string[],
      shade: req.shade as string,
      ceramicType: normalizedCeramicType,
      substrate: req.substrate as string,
      substrateCondition: req.substrateCondition as string | undefined,
      aestheticGoals: req.aestheticGoals as string | undefined,
      dsdContext: req.dsdContext as DSDContext | undefined,
    },
  };
}

/**
 * Post-processing safety net: Validate HF acid concentration for lithium disilicate.
 * Lithium disilicate (e.max) MUST use 5% HF for 20s — 10% causes irreversible surface damage.
 */
function validateHFConcentration(
  protocol: Record<string, unknown>,
  ceramicType: string,
): Record<string, unknown> {
  const isLithiumDisilicate = /e\.?max|dissilicato|lithium/i.test(ceramicType);
  if (!isLithiumDisilicate) return protocol;

  const ceramicTreatment = protocol.ceramic_treatment;
  if (!Array.isArray(ceramicTreatment)) return protocol;

  let corrected = false;
  protocol.ceramic_treatment = ceramicTreatment.map((step: Record<string, string>) => {
    const stepText = `${step.step || ''} ${step.material || ''}`;
    if (/10\s*%/i.test(stepText) && /(?:HF|fluorídr|fluor)/i.test(stepText)) {
      corrected = true;
      return {
        ...step,
        step: (step.step || '').replace(/10\s*%/g, '5%'),
        material: (step.material || '').replace(/10\s*%/g, '5%'),
      };
    }
    return step;
  });

  if (corrected) {
    const warnings = Array.isArray(protocol.warnings) ? [...protocol.warnings] : [];
    warnings.push('HF validado: 5% por 20s para dissilicato de lítio (e.max). NUNCA usar 10% — causa dano superficial irreversível.');
    protocol.warnings = warnings;
  }

  return protocol;
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
    const userPrompt = prompt.user({ teeth, shade, ceramicType, substrate, substrateCondition, aestheticGoals, dsdContext });

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
          prompt.model,
          messages,
          tools as OpenAITool[],
          {
            temperature: 0.0,
            maxTokens: 4000,
            forceFunctionName: "generate_cementation_protocol",
            timeoutMs: 45_000,
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
        return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
      }

      protocol = parseAIResponse(CementationProtocolSchema, claudeResult.functionCall.args, 'recommend-cementation') as CementationProtocol;
    } catch (error) {
      if (error instanceof ClaudeError) {
        if (error.statusCode === 429) {
          return createErrorResponse(ERROR_MESSAGES.RATE_LIMITED, 429, corsHeaders, "RATE_LIMITED");
        }
        logger.error("Claude API error:", error.message);
      } else {
        logger.error("AI error:", error);
      }
      return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
    }

    // Credits + post-processing wrapped in credit protection (auto-refund on error)
    return await withCreditProtection(
      { supabase, userId: user.id, operation: "cementation_recommendation", operationId: reqId, corsHeaders },
      async (credits) => {
        const creditResult = await credits.consume();
        if (isInsufficientCreditsResponse(creditResult)) return creditResult;

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
      },
    );
  } catch (error) {
    logger.error(`[${reqId}] recommend-cementation error:`, error);
    return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders, undefined, reqId);
  }
});
