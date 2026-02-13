import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreFlight, ERROR_MESSAGES, createErrorResponse, generateRequestId } from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import { callClaudeVisionWithTools, ClaudeError, type OpenAITool } from "../_shared/claude.ts";
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { checkAndUseCredits, createInsufficientCreditsResponse, refundCredits } from "../_shared/credits.ts";
import { getPrompt } from "../_shared/prompts/registry.ts";
import { withMetrics } from "../_shared/prompts/index.ts";
import type { PromptDefinition } from "../_shared/prompts/types.ts";
import type { Params as AnalyzePhotoParams } from "../_shared/prompts/definitions/analyze-dental-photo.ts";
import { createSupabaseMetrics, PROMPT_VERSION } from "../_shared/metrics-adapter.ts";
import { parseAIResponse, PhotoAnalysisResultSchema } from "../_shared/aiSchemas.ts";

interface AnalyzePhotoRequest {
  imageBase64: string;
  imageType?: string; // "intraoral" | "frontal_smile" | "45_smile" | "face"
}

// Expanded treatment types (includes gingival procedures)
type TreatmentIndication = "resina" | "porcelana" | "coroa" | "implante" | "endodontia" | "encaminhamento" | "gengivoplastia" | "recobrimento_radicular";

// The AI model sometimes returns English values instead of Portuguese enum values.
// This map normalizes them back to the expected Portuguese strings.
const TREATMENT_INDICATION_MAP: Record<string, TreatmentIndication> = {
  resin: "resina",
  porcelain: "porcelana",
  crown: "coroa",
  implant: "implante",
  endodontics: "endodontia",
  referral: "encaminhamento",
  gingivoplasty: "gengivoplastia",
  gingivectomy: "gengivoplastia",
  gum_recontouring: "gengivoplastia",
  root_coverage: "recobrimento_radicular",
  gingival_graft: "recobrimento_radicular",
  // Also handle Portuguese values (pass-through)
  resina: "resina",
  porcelana: "porcelana",
  coroa: "coroa",
  implante: "implante",
  endodontia: "endodontia",
  encaminhamento: "encaminhamento",
  gengivoplastia: "gengivoplastia",
  recobrimento_radicular: "recobrimento_radicular",
};

function normalizeTreatmentIndication(value: string | undefined | null): TreatmentIndication {
  if (!value) return "resina";
  const normalized = TREATMENT_INDICATION_MAP[value.toLowerCase().trim()];
  if (normalized) return normalized;
  logger.warn(`Unknown treatment_indication: "${value}", defaulting to "resina"`);
  return "resina";
}

interface ToothBounds {
  x: number;       // Center X position (0-100%)
  y: number;       // Center Y position (0-100%)
  width: number;   // Width as percentage (0-100%)
  height: number;  // Height as percentage (0-100%)
}

interface DetectedTooth {
  tooth: string;
  tooth_region: string | null;
  cavity_class: string | null;
  restoration_size: string | null;
  substrate: string | null;
  substrate_condition: string | null;
  enamel_condition: string | null;
  depth: string | null;
  priority: "alta" | "média" | "baixa";
  notes: string | null;
  treatment_indication?: TreatmentIndication;
  indication_reason?: string;
  tooth_bounds?: ToothBounds;
}

interface PhotoAnalysisResult {
  detected: boolean;
  confidence: number;
  detected_teeth: DetectedTooth[];
  primary_tooth: string | null;
  vita_shade: string | null;
  observations: string[];
  warnings: string[];
  treatment_indication?: TreatmentIndication;
  indication_reason?: string;
}

// Validate image request data
function validateImageRequest(data: unknown): { success: boolean; error?: string; data?: AnalyzePhotoRequest } {
  if (!data || typeof data !== "object") {
    return { success: false, error: ERROR_MESSAGES.INVALID_REQUEST };
  }

  const obj = data as Record<string, unknown>;

  if (!obj.imageBase64 || typeof obj.imageBase64 !== "string") {
    return { success: false, error: ERROR_MESSAGES.IMAGE_INVALID };
  }

  // Validate imageType if provided
  if (obj.imageType !== undefined) {
    const validTypes = ["intraoral", "frontal_smile", "45_smile", "face"];
    if (typeof obj.imageType !== "string" || !validTypes.includes(obj.imageType)) {
      obj.imageType = "intraoral"; // Default to intraoral
    }
  }

  return {
    success: true,
    data: {
      imageBase64: obj.imageBase64 as string,
      imageType: (obj.imageType as string) || "intraoral",
    },
  };
}

/**
 * Strip EXIF (and other APP markers) from a JPEG image encoded as base64.
 * Removes APP1–APP15 markers (0xFFE1–0xFFEF) which contain GPS, device info, etc.
 * Returns a clean base64 string without metadata.
 */
function stripJpegExif(base64: string): string {
  const raw = atob(base64);
  const src = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) src[i] = raw.charCodeAt(i);

  // Must start with SOI (0xFFD8)
  if (src[0] !== 0xFF || src[1] !== 0xD8) return base64;

  const out: number[] = [0xFF, 0xD8];
  let pos = 2;

  while (pos < src.length - 1) {
    if (src[pos] !== 0xFF) break;

    const marker = src[pos + 1];

    // SOS (0xFFDA) — start of scan, rest is image data
    if (marker === 0xDA) {
      // Copy everything from SOS to end
      for (let i = pos; i < src.length; i++) out.push(src[i]);
      break;
    }

    // APP1–APP15 markers (0xE1–0xEF): skip (these contain EXIF, XMP, etc.)
    if (marker >= 0xE1 && marker <= 0xEF) {
      const segLen = (src[pos + 2] << 8) | src[pos + 3];
      pos += 2 + segLen;
      continue;
    }

    // Any other marker: keep it
    if (marker === 0xD8 || marker === 0xD9 || (marker >= 0xD0 && marker <= 0xD7)) {
      // Standalone markers (no length field)
      out.push(src[pos], src[pos + 1]);
      pos += 2;
    } else {
      // Marker with length
      const segLen = (src[pos + 2] << 8) | src[pos + 3];
      for (let i = 0; i < 2 + segLen; i++) out.push(src[pos + i]);
      pos += 2 + segLen;
    }
  }

  // Re-encode to base64
  const bytes = new Uint8Array(out);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

serve(async (req) => {
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
  let supabaseForRefund: ReturnType<typeof createClient> | null = null;
  let userIdForRefund: string | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401, corsHeaders);
    }

    // Create service role client for all operations
    const supabaseService = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
    supabaseForRefund = supabaseService;

    // Verify user via getUser()
    const token = authHeader.replace("Bearer ", "");
    step("auth: getUser start");
    const { data: { user }, error: authError } = await supabaseService.auth.getUser(token);
    step("auth: getUser done");

    if (authError || !user) {
      return createErrorResponse(ERROR_MESSAGES.INVALID_TOKEN, 401, corsHeaders);
    }

    const userId = user.id;
    userIdForRefund = userId;

    step("rateLimit: check start");
    const rateLimitResult = await checkRateLimit(supabaseService, userId, "analyze-dental-photo", RATE_LIMITS.AI_HEAVY);
    if (!rateLimitResult.allowed) {
      logger.warn(`Rate limit exceeded for user ${userId} on analyze-dental-photo`);
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }
    step("rateLimit: ok");

    // Then consume credits (atomic with row locking)
    step("credits: check start");
    const creditResult = await checkAndUseCredits(supabaseService, userId, "case_analysis", reqId);
    if (!creditResult.allowed) {
      logger.warn(`Insufficient credits for user ${userId} on case_analysis`);
      return createInsufficientCreditsResponse(creditResult, corsHeaders);
    }
    creditsConsumed = true;
    step("credits: consumed");

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

    // Tool definition for structured output - MULTI-TOOTH SUPPORT
    const tools: OpenAITool[] = [
      {
        type: "function",
        function: {
          name: "analyze_dental_photo",
          description: "Retorna a análise estruturada de uma foto dental intraoral, detectando TODOS os dentes com problemas",
          parameters: {
            type: "object",
            properties: {
              detected: {
                type: "boolean",
                description: "Se foi possível detectar pelo menos um dente com problema na foto"
              },
              confidence: {
                type: "number",
                description: "Nível de confiança geral da análise de 0 a 100"
              },
              detected_teeth: {
                type: "array",
                description: "Lista de TODOS os dentes detectados com problemas, ordenados por prioridade",
                items: {
                  type: "object",
                  properties: {
                    tooth: {
                      type: "string",
                      description: "Número do dente (notação FDI: 11-18, 21-28, 31-38, 41-48)"
                    },
                    tooth_region: {
                      type: "string",
                      enum: ["anterior-superior", "anterior-inferior", "posterior-superior", "posterior-inferior"],
                      description: "Região do dente na arcada",
                      nullable: true
                    },
                    cavity_class: {
                      type: "string",
                      enum: ["Classe I", "Classe II", "Classe III", "Classe IV", "Classe V", "Classe VI", "Fechamento de Diastema", "Recontorno Estético", "Faceta Direta", "Lente de Contato"],
                      description: "Classificação de Black da cavidade (Classes I-VI) OU procedimento estético sem cavidade cariosa (Fechamento de Diastema, Recontorno Estético, Faceta Direta, Lente de Contato). Use null para tratamentos protéticos (coroa, implante, endodontia).",
                      nullable: true
                    },
                    restoration_size: {
                      type: "string",
                      enum: ["Pequena", "Média", "Grande", "Extensa"],
                      description: "Tamanho estimado da restauração",
                      nullable: true
                    },
                    substrate: {
                      type: "string",
                      enum: ["Esmalte", "Dentina", "Esmalte e Dentina", "Dentina profunda"],
                      description: "Tipo de substrato principal visível",
                      nullable: true
                    },
                    substrate_condition: {
                      type: "string",
                      enum: ["Saudável", "Esclerótico", "Manchado", "Cariado", "Desidratado"],
                      description: "Condição do substrato dentário",
                      nullable: true
                    },
                    enamel_condition: {
                      type: "string",
                      enum: ["Íntegro", "Fraturado", "Hipoplásico", "Fluorose", "Erosão", "Restauração prévia", "Restauração prévia (faceta em resina)", "Restauração prévia (coroa)"],
                      description: "Condição do esmalte periférico. Use 'Restauração prévia' quando há evidência de restauração existente, 'Restauração prévia (faceta em resina)' para facetas vestibulares, 'Restauração prévia (coroa)' para coroas protéticas.",
                      nullable: true
                    },
                    depth: {
                      type: "string",
                      enum: ["Superficial", "Média", "Profunda"],
                      description: "Profundidade estimada da cavidade",
                      nullable: true
                    },
                    priority: {
                      type: "string",
                      enum: ["alta", "média", "baixa"],
                      description: "Prioridade de tratamento baseada na urgência clínica"
                    },
                    notes: {
                      type: "string",
                      description: "Observações específicas sobre este dente",
                      nullable: true
                    },
                    treatment_indication: {
                      type: "string",
                      enum: ["resina", "porcelana", "coroa", "implante", "endodontia", "encaminhamento", "gengivoplastia", "recobrimento_radicular"],
                      description: "Tipo de tratamento indicado: resina (restauração direta), porcelana (faceta/laminado), coroa (coroa total), implante (extração + implante), endodontia (canal), encaminhamento (especialista), gengivoplastia (remoção de excesso gengival), recobrimento_radicular (cobertura de raiz exposta)"
                    },
                    indication_reason: {
                      type: "string",
                      description: "Razão detalhada da indicação de tratamento",
                      nullable: true
                    },
                    tooth_bounds: {
                      type: "object",
                      description: "Posição aproximada do dente na imagem, em porcentagem (0-100). SEMPRE forneça para o dente principal.",
                      properties: {
                        x: { type: "number", description: "Posição X do centro do dente (0-100%)" },
                        y: { type: "number", description: "Posição Y do centro do dente (0-100%)" },
                        width: { type: "number", description: "Largura aproximada do dente (0-100%)" },
                        height: { type: "number", description: "Altura aproximada do dente (0-100%)" }
                      },
                      required: ["x", "y", "width", "height"]
                    }
                  },
                  required: ["tooth", "priority", "treatment_indication"]
                }
              },
              primary_tooth: {
                type: "string",
                description: "Número do dente que deve ser tratado primeiro (mais urgente)",
                nullable: true
              },
              vita_shade: {
                type: "string",
                description: "Cor VITA geral da arcada (ex: A1, A2, A3, A3.5, B1, B2, C1, D2)",
                nullable: true
              },
              observations: {
                type: "array",
                items: { type: "string" },
                description: "Observações clínicas gerais sobre a arcada/foto"
              },
              warnings: {
                type: "array",
                items: { type: "string" },
                description: "Alertas ou pontos de atenção para o operador"
              },
              treatment_indication: {
                type: "string",
                enum: ["resina", "porcelana", "coroa", "implante", "endodontia", "encaminhamento", "gengivoplastia", "recobrimento_radicular"],
                description: "Indicação GERAL predominante do caso (o tipo de tratamento mais relevante para a maioria dos dentes)"
              },
              indication_reason: {
                type: "string",
                description: "Razão detalhada da indicação de tratamento predominante"
              }
            },
            required: ["detected", "confidence", "detected_teeth", "observations", "warnings"],
            additionalProperties: false
          }
        }
      }
    ];

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
          "claude-sonnet-4-5-20250929",
          userPrompt,
          base64Image,
          mimeType,
          tools,
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
          if (creditsConsumed && supabaseForRefund && userIdForRefund) {
            await refundCredits(supabaseForRefund, userIdForRefund, "case_analysis", reqId);
          }
          return createErrorResponse(ERROR_MESSAGES.RATE_LIMITED, 429, corsHeaders, "RATE_LIMITED");
        }
        logger.error(`Claude API error (${error.statusCode}):`, error.message);
      } else {
        logger.error("AI error:", error);
      }
      // Refund credits on AI errors
      if (creditsConsumed && supabaseForRefund && userIdForRefund) {
        await refundCredits(supabaseForRefund, userIdForRefund, "case_analysis", reqId);
        logger.log(`Refunded analysis credits for user ${userIdForRefund} due to AI error`);
      }
      const debugDetail = error instanceof ClaudeError
        ? `[${error.statusCode}] ${error.message}`
        : (error instanceof Error ? error.message : String(error));
      return new Response(
        JSON.stringify({ error: ERROR_MESSAGES.AI_ERROR, debug: debugDetail }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!analysisResult) {
      // Refund credits — AI returned unusable result but user already paid
      if (creditsConsumed && supabaseForRefund && userIdForRefund) {
        await refundCredits(supabaseForRefund, userIdForRefund, "case_analysis", reqId);
        logger.log(`[${reqId}] Refunded analysis credits for user ${userIdForRefund} — AI returned no usable result`);
      }
      return createErrorResponse(ERROR_MESSAGES.ANALYSIS_FAILED, 500, corsHeaders);
    }

    // Ensure required fields have defaults and normalize detected_teeth
    // Use the global treatment_indication as fallback instead of always defaulting to "resina"
    // This prevents the inconsistency where the case-level banner says "Facetas de Porcelana"
    // but every individual tooth shows "Resina Composta"
    const globalIndication = normalizeTreatmentIndication(analysisResult.treatment_indication);
    const rawTeeth: DetectedTooth[] = (analysisResult.detected_teeth || []).map((tooth: Partial<DetectedTooth>) => ({
      tooth: String(tooth.tooth || "desconhecido"),
      tooth_region: tooth.tooth_region ?? null,
      cavity_class: tooth.cavity_class ?? null,
      restoration_size: tooth.restoration_size ?? null,
      substrate: tooth.substrate ?? null,
      substrate_condition: tooth.substrate_condition ?? null,
      enamel_condition: tooth.enamel_condition ?? null,
      depth: tooth.depth ?? null,
      priority: tooth.priority || "média",
      notes: tooth.notes ?? null,
      treatment_indication: normalizeTreatmentIndication(tooth.treatment_indication) || globalIndication,
      indication_reason: tooth.indication_reason ?? undefined,
      tooth_bounds: tooth.tooth_bounds ?? undefined,
    }));

    // Deduplicate: the AI model can return the same tooth number multiple times
    // (e.g., once for mesial diastema and once for distal). Keep the first occurrence
    // which has the highest priority since the AI orders by urgency.
    const seenToothNumbers = new Set<string>();
    const detectedTeeth: DetectedTooth[] = rawTeeth.filter(t => {
      if (seenToothNumbers.has(t.tooth)) return false;
      seenToothNumbers.add(t.tooth);
      return true;
    });

    // Filter out lower teeth when photo predominantly shows upper arch
    // This is a backend guardrail because the AI sometimes ignores prompt rules
    const upperTeeth = detectedTeeth.filter(t => {
      const num = parseInt(t.tooth);
      return num >= 11 && num <= 28;
    });
    const lowerTeeth = detectedTeeth.filter(t => {
      const num = parseInt(t.tooth);
      return num >= 31 && num <= 48;
    });

    // If majority of detected teeth are upper arch, remove lower teeth
    let filteredLowerWarning: string | null = null;
    if (upperTeeth.length > 0 && lowerTeeth.length > 0 && upperTeeth.length >= lowerTeeth.length) {
      const removedNumbers = lowerTeeth.map(t => t.tooth);
      logger.warn(`Removing lower teeth ${removedNumbers.join(', ')} — photo predominantly shows upper arch (${upperTeeth.length} upper vs ${lowerTeeth.length} lower)`);
      filteredLowerWarning = `Dentes inferiores (${removedNumbers.join(', ')}) removidos da análise — foto mostra predominantemente a arcada superior.`;
      // Keep only upper teeth
      detectedTeeth.splice(0, detectedTeeth.length, ...upperTeeth);
    }

    // Post-processing: Remove Black classification for non-applicable treatments
    // Aesthetic procedures (facetas, lentes, recontornos, acréscimos) should NOT have Classe I-VI
    const blackClassPattern = /^Classe\s+(I{1,3}V?|IV|V|VI)$/i;
    const aestheticTreatments = ['porcelana', 'encaminhamento', 'gengivoplastia', 'recobrimento_radicular'];
    for (const tooth of detectedTeeth) {
      if (!tooth.cavity_class || !blackClassPattern.test(tooth.cavity_class)) continue;
      const reason = (tooth.indication_reason || '').toLowerCase();
      const treatment = (tooth.treatment_indication || '').toLowerCase();
      const notes = (tooth.notes || '').toLowerCase();
      const isAestheticCase =
        aestheticTreatments.includes(treatment) ||
        reason.includes('faceta') ||
        reason.includes('lente') ||
        reason.includes('laminado') ||
        reason.includes('recontorno') ||
        reason.includes('acréscimo') ||
        reason.includes('acrescimo') ||
        reason.includes('diastema') ||
        reason.includes('microdontia') ||
        reason.includes('conoide') ||
        reason.includes('harmoniz') ||
        reason.includes('volume') ||
        reason.includes('reanatomiz') ||
        reason.includes('gengivoplastia') ||
        reason.includes('recobrimento') ||
        reason.includes('desgaste seletivo') ||
        reason.includes('ortodont') ||
        notes.includes('gengivoplastia') ||
        notes.includes('recobrimento') ||
        notes.includes('faceta') ||
        notes.includes('lente') ||
        notes.includes('desgaste seletivo') ||
        notes.includes('ortodont');
      if (isAestheticCase) {
        logger.log(`Post-processing: removing Black classification '${tooth.cavity_class}' for aesthetic tooth ${tooth.tooth} (reason: ${reason.substring(0, 50)})`);
        tooth.cavity_class = null;
      }
    }

    // Sort by priority: alta > média > baixa
    const priorityOrder = { alta: 0, média: 1, baixa: 2 };
    detectedTeeth.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Fix primary_tooth if it was a filtered-out lower tooth
    let primaryTooth = analysisResult.primary_tooth ?? (detectedTeeth.length > 0 ? detectedTeeth[0].tooth : null);
    if (primaryTooth && !detectedTeeth.some(t => t.tooth === primaryTooth)) {
      primaryTooth = detectedTeeth.length > 0 ? detectedTeeth[0].tooth : null;
    }

    const result: PhotoAnalysisResult = {
      detected: analysisResult.detected ?? detectedTeeth.length > 0,
      confidence: analysisResult.confidence ?? 0,
      detected_teeth: detectedTeeth,
      primary_tooth: primaryTooth,
      vita_shade: analysisResult.vita_shade ?? null,
      observations: analysisResult.observations ?? [],
      warnings: analysisResult.warnings ?? [],
      treatment_indication: normalizeTreatmentIndication(analysisResult.treatment_indication),
      indication_reason: analysisResult.indication_reason ?? undefined,
    };

    // Log detection results for debugging
    logger.log(`Multi-tooth detection complete: ${detectedTeeth.length} teeth found`);
    logger.log(`Primary tooth: ${result.primary_tooth}, Confidence: ${result.confidence}%`);

    // Add warning about filtered lower teeth
    if (filteredLowerWarning) {
      result.warnings.push(filteredLowerWarning);
    }

    // Add warning if multiple teeth detected
    if (detectedTeeth.length > 1) {
      result.warnings.unshift(`Detectados ${detectedTeeth.length} dentes com necessidade de tratamento. Selecione qual deseja tratar primeiro.`);
    }

    // Add warning if only 1 tooth detected with low confidence (might be missing teeth)
    if (detectedTeeth.length === 1 && result.confidence < 85) {
      result.warnings.push("Apenas 1 dente detectado. Se houver mais dentes com problema na foto, use 'Reanalisar' ou adicione manualmente.");
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
  } catch (error: unknown) {
    step(`CRASH: ${error instanceof Error ? error.message : String(error)}`);
    logger.error(`[${reqId}] Error analyzing photo:`, error);
    // Refund credits on unexpected errors — user paid but got nothing
    if (creditsConsumed && supabaseForRefund && userIdForRefund) {
      await refundCredits(supabaseForRefund, userIdForRefund, "case_analysis", reqId);
      logger.log(`[${reqId}] Refunded analysis credits for user ${userIdForRefund} due to error`);
    }
    const crashDebug = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: ERROR_MESSAGES.PROCESSING_ERROR, debug: crashDebug, elapsed_ms: Date.now() - t0 }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
