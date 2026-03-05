import { getCorsHeaders, handleCorsPreFlight, ERROR_MESSAGES, createErrorResponse, generateRequestId } from "../_shared/cors.ts";
import { getSupabaseClient, authenticateRequest, isAuthError } from "../_shared/middleware.ts";
import { logger } from "../_shared/logger.ts";
import { callClaudeWithTools, ClaudeError, type OpenAIMessage, type OpenAITool } from "../_shared/claude.ts";
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { getPrompt } from "../_shared/prompts/registry.ts";
import { withMetrics } from "../_shared/prompts/index.ts";
import type { PatientDocumentParams } from "../_shared/prompts/definitions/patient-document.ts";
import { createSupabaseMetrics, PROMPT_VERSION } from "../_shared/metrics-adapter.ts";
import { generateTCLE, type TCLEParams } from "../_shared/templates/tcle.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map FDI tooth number to Portuguese name */
function toothToName(tooth: string): string {
  const map: Record<string, string> = {
    // Upper right
    "11": "incisivo central superior direito",
    "12": "incisivo lateral superior direito",
    "13": "canino superior direito",
    "14": "primeiro pre-molar superior direito",
    "15": "segundo pre-molar superior direito",
    "16": "primeiro molar superior direito",
    "17": "segundo molar superior direito",
    "18": "terceiro molar superior direito",
    // Upper left
    "21": "incisivo central superior esquerdo",
    "22": "incisivo lateral superior esquerdo",
    "23": "canino superior esquerdo",
    "24": "primeiro pre-molar superior esquerdo",
    "25": "segundo pre-molar superior esquerdo",
    "26": "primeiro molar superior esquerdo",
    "27": "segundo molar superior esquerdo",
    "28": "terceiro molar superior esquerdo",
    // Lower left
    "31": "incisivo central inferior esquerdo",
    "32": "incisivo lateral inferior esquerdo",
    "33": "canino inferior esquerdo",
    "34": "primeiro pre-molar inferior esquerdo",
    "35": "segundo pre-molar inferior esquerdo",
    "36": "primeiro molar inferior esquerdo",
    "37": "segundo molar inferior esquerdo",
    "38": "terceiro molar inferior esquerdo",
    // Lower right
    "41": "incisivo central inferior direito",
    "42": "incisivo lateral inferior direito",
    "43": "canino inferior direito",
    "44": "primeiro pre-molar inferior direito",
    "45": "segundo pre-molar inferior direito",
    "46": "primeiro molar inferior direito",
    "47": "segundo molar inferior direito",
    "48": "terceiro molar inferior direito",
  };
  return map[tooth] || `dente ${tooth}`;
}

/** Map treatment type to patient-friendly Portuguese description */
function treatmentToDescription(type: string): string {
  const map: Record<string, string> = {
    resina: "restauracao em resina composta (obturacao estetica)",
    gengivoplastia: "gengivoplastia (remodelacao da gengiva)",
    cimentacao: "cimentacao de peca protetica (coroa, faceta ou onlay)",
    clareamento: "clareamento dental",
    recobrimento_radicular: "recobrimento radicular (cobertura de raiz exposta)",
    faceta: "faceta em resina ou porcelana",
  };
  return map[type] || type;
}

// ---------------------------------------------------------------------------
// Tool schema
// ---------------------------------------------------------------------------

const tools: OpenAITool[] = [
  {
    type: "function",
    function: {
      name: "generate_patient_document",
      description:
        "Generate patient-facing document with treatment explanation, post-operative instructions, and dietary guide",
      parameters: {
        type: "object",
        required: ["treatment_explanation", "post_operative", "dietary_guide"],
        properties: {
          treatment_explanation: {
            type: "string",
            description: "2-3 paragraphs explaining the treatment in accessible language",
          },
          post_operative: {
            type: "array",
            items: { type: "string" },
            description: "8-12 specific post-operative care instructions",
          },
          dietary_guide: {
            type: "object",
            required: ["avoid", "prefer", "duration_hours"],
            properties: {
              avoid: {
                type: "array",
                items: { type: "string" },
                description: "Foods/drinks to avoid",
              },
              prefer: {
                type: "array",
                items: { type: "string" },
                description: "Recommended foods",
              },
              duration_hours: {
                type: "number",
                description: "Duration in hours for restrictions (24, 48, or 72)",
              },
            },
          },
        },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PatientDocument {
  treatment_explanation: string;
  post_operative: string[];
  dietary_guide: {
    avoid: string[];
    prefer: string[];
    duration_hours: number;
  };
}

interface EvaluationRow {
  id: string;
  tooth: string;
  treatment_type: string;
  aesthetic_level: string | null;
  region: string | null;
  patient_age: number | null;
  bruxism: boolean | null;
  alerts: string[] | null;
  warnings: string[] | null;
  patient_name: string | null;
  ai_indication_reason: string | null;
  session_id: string;
  stratification_protocol: { layers?: Array<{ resin_brand?: string }> } | null;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const reqId = generateRequestId();

  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(req);
  if (preflightResponse) return preflightResponse;

  logger.log(`[${reqId}] generate-patient-document: start`);

  try {
    // Create service role client
    const supabaseService = getSupabaseClient();

    // Validate authentication
    const authResult = await authenticateRequest(req, supabaseService, corsHeaders);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;
    const userId = user.id;

    // Rate limit
    const rateLimitResult = await checkRateLimit(
      supabaseService,
      userId,
      "generate-patient-document",
      RATE_LIMITS.AI_LIGHT,
    );

    if (!rateLimitResult.allowed) {
      logger.warn(`Rate limit exceeded for user ${userId} on generate-patient-document`);
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    // Parse body
    let body: { sessionId?: string; includeTCLE?: boolean };
    try {
      body = await req.json();
    } catch {
      return createErrorResponse(ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
    }

    const { sessionId, includeTCLE } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return createErrorResponse("sessionId is required", 400, corsHeaders);
    }

    // Fetch evaluations for the session
    const { data: evaluations, error: evalError } = await supabaseService
      .from("evaluations")
      .select("id, tooth, treatment_type, aesthetic_level, region, patient_age, bruxism, alerts, warnings, patient_name, ai_indication_reason, session_id, stratification_protocol")
      .eq("session_id", sessionId)
      .eq("user_id", userId);

    if (evalError) {
      logger.error(`[${reqId}] Error fetching evaluations:`, evalError);
      return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
    }

    if (!evaluations || evaluations.length === 0) {
      return createErrorResponse("No evaluations found for this session", 404, corsHeaders);
    }

    // Fetch profile for TCLE if needed
    let profile: { full_name: string | null; cro: string | null; clinic_name: string | null } | null = null;
    if (includeTCLE) {
      const { data: profileData } = await supabaseService
        .from("profiles")
        .select("full_name, cro, clinic_name")
        .eq("id", userId)
        .single();
      profile = profileData;
    }

    // Patient name from evaluation (already decrypted by the view)
    const patientName = (evaluations[0] as EvaluationRow)?.patient_name || "Paciente";

    // Prompt definition
    const promptDef = getPrompt<PatientDocumentParams>("patient-document");

    // Metrics setup
    const metrics = createSupabaseMetrics(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Process each evaluation
    const documents: Array<{
      evaluationId: string;
      tooth: string;
      toothName: string;
      treatmentType: string;
      document: PatientDocument;
      tcle?: string;
    }> = [];

    for (const evaluation of evaluations as EvaluationRow[]) {
      const toothName = toothToName(evaluation.tooth);
      const treatmentDesc = treatmentToDescription(evaluation.treatment_type);
      const firstLayerBrand = evaluation.stratification_protocol?.layers?.[0]?.resin_brand;
      const materialName = firstLayerBrand || "material restaurador";

      const promptParams: PatientDocumentParams = {
        treatmentType: treatmentDesc,
        toothName,
        material: materialName,
        region: evaluation.region || "nao especificada",
        aestheticLevel: evaluation.aesthetic_level || "padrao",
        patientAge: evaluation.patient_age || 30,
        bruxism: evaluation.bruxism ?? false,
        alerts: evaluation.alerts || [],
      };

      const systemPrompt = promptDef.system(promptParams);
      const userPrompt = promptDef.user(promptParams);

      const messages: OpenAIMessage[] = [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        { role: "user" as const, content: userPrompt },
      ];

      logger.log(`[${reqId}] Generating document for evaluation ${evaluation.id} (tooth ${evaluation.tooth})`);

      try {
        const aiResult = await withMetrics<{
          text: string | null;
          functionCall: { name: string; args: Record<string, unknown> } | null;
          finishReason: string;
        }>(metrics, promptDef.id, PROMPT_VERSION, promptDef.model)(async () => {
          const response = await callClaudeWithTools(
            promptDef.model,
            messages,
            tools,
            {
              temperature: promptDef.temperature,
              maxTokens: promptDef.maxTokens,
              forceFunctionName: "generate_patient_document",
              timeoutMs: 30_000,
              maxRetries: 1,
            },
          );
          return {
            result: {
              text: response.text,
              functionCall: response.functionCall,
              finishReason: response.finishReason,
            },
            tokensIn: response.tokens?.inputTokens ?? 0,
            tokensOut: response.tokens?.outputTokens ?? 0,
          };
        });

        if (!aiResult.functionCall) {
          logger.error(`[${reqId}] No function call for evaluation ${evaluation.id}`);
          continue;
        }

        const doc = aiResult.functionCall.args as unknown as PatientDocument;

        // Generate TCLE if requested
        let tcle: string | undefined;
        if (includeTCLE && profile) {
          const tcleParams: TCLEParams = {
            procedimento: treatmentDesc,
            dente: `${evaluation.tooth} - ${toothName}`,
            material: materialName,
            riscos: [...(evaluation.alerts || []), ...(evaluation.warnings || [])],
            alternativas: evaluation.ai_indication_reason || "Alternativas ao tratamento serao discutidas em consulta.",
            clinica: profile.clinic_name || "Clinica",
            dentista: profile.full_name || "Dentista",
            cro: profile.cro || "",
            data: new Date().toLocaleDateString("pt-BR"),
            paciente: patientName,
          };
          tcle = generateTCLE(tcleParams);
        }

        // Build full document (flat structure matching frontend PatientDocument type)
        const fullDoc = {
          tooth: evaluation.tooth,
          treatment_type: evaluation.treatment_type,
          ...doc,
          generated_at: new Date().toISOString(),
          ...(tcle ? { tcle } : {}),
        };

        // Save patient_document to evaluation row
        const { error: updateError } = await supabaseService
          .from("evaluations")
          .update({ patient_document: fullDoc })
          .eq("id", evaluation.id)
          .eq("user_id", userId);

        if (updateError) {
          logger.error(`[${reqId}] Error saving document for evaluation ${evaluation.id}:`, updateError);
          continue;
        }

        documents.push(fullDoc);

        logger.log(`[${reqId}] Document generated for evaluation ${evaluation.id}`);
      } catch (error) {
        if (error instanceof ClaudeError) {
          logger.error(`[${reqId}] Claude API error for evaluation ${evaluation.id} (${error.statusCode}):`, error.message);
        } else {
          logger.error(`[${reqId}] AI error for evaluation ${evaluation.id}:`, error instanceof Error ? error.message : String(error));
        }
        // Continue with other evaluations
        continue;
      }
    }

    if (documents.length === 0) {
      return createErrorResponse("Failed to generate any documents", 500, corsHeaders);
    }

    logger.log(`[${reqId}] generate-patient-document: done (${documents.length}/${evaluations.length} evaluations)`);

    return new Response(
      JSON.stringify({
        success: true,
        documents,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    logger.error(`[${reqId}] generate-patient-document error:`, error);
    return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders, undefined, reqId);
  }
});
