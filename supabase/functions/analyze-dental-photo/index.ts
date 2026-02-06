import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreFlight, ERROR_MESSAGES, createErrorResponse } from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import { callGeminiVisionWithTools, GeminiError, type OpenAITool } from "../_shared/gemini.ts";
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { checkAndUseCredits, createInsufficientCreditsResponse } from "../_shared/credits.ts";
import { getPrompt } from "../_shared/prompts/registry.ts";
import { withMetrics } from "../_shared/prompts/index.ts";
import type { PromptDefinition } from "../_shared/prompts/types.ts";
import type { Params as AnalyzePhotoParams } from "../_shared/prompts/definitions/analyze-dental-photo.ts";
import { createSupabaseMetrics, PROMPT_VERSION } from "../_shared/metrics-adapter.ts";

interface AnalyzePhotoRequest {
  imageBase64: string;
  imageType?: string; // "intraoral" | "frontal_smile" | "45_smile" | "face"
}

// Expanded treatment types
type TreatmentIndication = "resina" | "porcelana" | "coroa" | "implante" | "endodontia" | "encaminhamento";

// Gemini sometimes returns English values instead of Portuguese enum values.
// This map normalizes them back to the expected Portuguese strings.
const TREATMENT_INDICATION_MAP: Record<string, TreatmentIndication> = {
  resin: "resina",
  porcelain: "porcelana",
  crown: "coroa",
  implant: "implante",
  endodontics: "endodontia",
  referral: "encaminhamento",
  // Also handle Portuguese values (pass-through)
  resina: "resina",
  porcelana: "porcelana",
  coroa: "coroa",
  implante: "implante",
  endodontia: "endodontia",
  encaminhamento: "encaminhamento",
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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(req);
  if (preflightResponse) return preflightResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401, corsHeaders);
    }

    // Verify JWT claims
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return createErrorResponse(ERROR_MESSAGES.INVALID_TOKEN, 401, corsHeaders);
    }

    const userId = claimsData.claims.sub as string;

    // Check rate limit (AI_HEAVY: 10/min, 50/hour, 200/day)
    const supabaseService = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
    const rateLimitResult = await checkRateLimit(
      supabaseService,
      userId,
      "analyze-dental-photo",
      RATE_LIMITS.AI_HEAVY
    );

    if (!rateLimitResult.allowed) {
      logger.warn(`Rate limit exceeded for user ${userId} on analyze-dental-photo`);
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    // Check and consume credits (1 credit for case_analysis)
    const creditResult = await checkAndUseCredits(supabaseService, userId, "case_analysis");
    if (!creditResult.allowed) {
      logger.warn(`Insufficient credits for user ${userId} on case_analysis`);
      return createInsufficientCreditsResponse(creditResult, corsHeaders);
    }

    // Parse and validate request
    let rawData: unknown;
    try {
      rawData = await req.json();
    } catch {
      return createErrorResponse(ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
    }

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

    // Use the validated base64 data
    const base64Image = base64Data;

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
                      enum: ["Classe I", "Classe II", "Classe III", "Classe IV", "Classe V", "Classe VI"],
                      description: "Classificação de Black da cavidade",
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
                      enum: ["Íntegro", "Fraturado", "Hipoplásico", "Fluorose", "Erosão"],
                      description: "Condição do esmalte periférico",
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
                      enum: ["resina", "porcelana", "coroa", "implante", "endodontia", "encaminhamento"],
                      description: "Tipo de tratamento indicado: resina (restauração direta), porcelana (faceta/laminado), coroa (coroa total), implante (extração + implante), endodontia (canal), encaminhamento (especialista)"
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
                enum: ["resina", "porcelana", "coroa", "implante", "endodontia", "encaminhamento"],
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

    // Call Gemini Vision with tools
    let analysisResult: PhotoAnalysisResult | null = null;

    try {
      logger.log("Calling Gemini Vision API...");

      const result = await withMetrics<{ text: string | null; functionCall: { name: string; args: Record<string, unknown> } | null; finishReason: string }>(metrics, promptDef.id, PROMPT_VERSION, promptDef.model)(async () => {
        const response = await callGeminiVisionWithTools(
          "gemini-3-flash-preview",
          userPrompt,
          base64Image,
          mimeType,
          tools,
          {
            systemPrompt,
            temperature: 0.1,
            maxTokens: 3000,
            forceFunctionName: "analyze_dental_photo",
          }
        );
        return {
          result: response,
          tokensIn: 0,
          tokensOut: 0,
        };
      });

      if (result.functionCall) {
        logger.log("Successfully got analysis from Gemini");
        analysisResult = result.functionCall.args as unknown as PhotoAnalysisResult;
      } else if (result.text) {
        // Fallback: try to extract JSON from text response
        logger.log("No function call, checking text for JSON...");
        const jsonMatch = result.text.match(/```json\s*([\s\S]*?)\s*```/) || result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const jsonStr = jsonMatch[1] || jsonMatch[0];
            analysisResult = JSON.parse(jsonStr);
          } catch {
            logger.error("Failed to parse JSON from text response");
          }
        }
      }
    } catch (error) {
      if (error instanceof GeminiError) {
        if (error.statusCode === 429) {
          return createErrorResponse(ERROR_MESSAGES.RATE_LIMITED, 429, corsHeaders, "RATE_LIMITED");
        }
        logger.error("Gemini API error:", error.message);
      } else {
        logger.error("AI error:", error);
      }
      return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
    }

    if (!analysisResult) {
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
    }));

    // Deduplicate: Gemini can return the same tooth number multiple times
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
    if (upperTeeth.length > 0 && lowerTeeth.length > 0 && upperTeeth.length >= lowerTeeth.length) {
      const removedNumbers = lowerTeeth.map(t => t.tooth);
      logger.warn(`Removing lower teeth ${removedNumbers.join(', ')} — photo predominantly shows upper arch (${upperTeeth.length} upper vs ${lowerTeeth.length} lower)`);
      // Keep only upper teeth
      detectedTeeth.splice(0, detectedTeeth.length, ...upperTeeth);
    }

    // Sort by priority: alta > média > baixa
    const priorityOrder = { alta: 0, média: 1, baixa: 2 };
    detectedTeeth.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    const result: PhotoAnalysisResult = {
      detected: analysisResult.detected ?? detectedTeeth.length > 0,
      confidence: analysisResult.confidence ?? 0,
      detected_teeth: detectedTeeth,
      primary_tooth: analysisResult.primary_tooth ?? (detectedTeeth.length > 0 ? detectedTeeth[0].tooth : null),
      vita_shade: analysisResult.vita_shade ?? null,
      observations: analysisResult.observations ?? [],
      warnings: analysisResult.warnings ?? [],
      treatment_indication: normalizeTreatmentIndication(analysisResult.treatment_indication),
      indication_reason: analysisResult.indication_reason ?? undefined,
    };

    // Log detection results for debugging
    logger.log(`Multi-tooth detection complete: ${detectedTeeth.length} teeth found`);
    logger.log(`Primary tooth: ${result.primary_tooth}, Confidence: ${result.confidence}%`);

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
    logger.error("Error analyzing photo:", error);
    return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
  }
});
