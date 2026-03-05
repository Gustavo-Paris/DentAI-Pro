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
    "11": "incisivo central superior direito", "12": "incisivo lateral superior direito",
    "13": "canino superior direito", "14": "primeiro pre-molar superior direito",
    "15": "segundo pre-molar superior direito", "16": "primeiro molar superior direito",
    "17": "segundo molar superior direito", "18": "terceiro molar superior direito",
    "21": "incisivo central superior esquerdo", "22": "incisivo lateral superior esquerdo",
    "23": "canino superior esquerdo", "24": "primeiro pre-molar superior esquerdo",
    "25": "segundo pre-molar superior esquerdo", "26": "primeiro molar superior esquerdo",
    "27": "segundo molar superior esquerdo", "28": "terceiro molar superior esquerdo",
    "31": "incisivo central inferior esquerdo", "32": "incisivo lateral inferior esquerdo",
    "33": "canino inferior esquerdo", "34": "primeiro pre-molar inferior esquerdo",
    "35": "segundo pre-molar inferior esquerdo", "36": "primeiro molar inferior esquerdo",
    "37": "segundo molar inferior esquerdo", "38": "terceiro molar inferior esquerdo",
    "41": "incisivo central inferior direito", "42": "incisivo lateral inferior direito",
    "43": "canino inferior direito", "44": "primeiro pre-molar inferior direito",
    "45": "segundo pre-molar inferior direito", "46": "primeiro molar inferior direito",
    "47": "segundo molar inferior direito", "48": "terceiro molar inferior direito",
  };
  return map[tooth] || `dente ${tooth}`;
}

/** Map treatment type to patient-friendly Portuguese description */
function treatmentToDescription(type: string): string {
  const map: Record<string, string> = {
    resina: "restauracao em resina composta",
    porcelana: "restauracao em porcelana",
    gengivoplastia: "gengivoplastia (remodelacao da gengiva)",
    clareamento: "clareamento dental",
    recobrimento_radicular: "recobrimento radicular",
    endodontia: "tratamento de canal",
    coroa: "coroa protetica",
    implante: "implante dentario",
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
      description: "Generate a single consolidated patient-facing document covering all treated teeth",
      parameters: {
        type: "object",
        required: ["treatment_explanation", "post_operative", "dietary_guide"],
        properties: {
          treatment_explanation: {
            type: "string",
            description: "2-3 paragraphs explaining ALL treatments in accessible language, mentioning which teeth are being treated",
          },
          post_operative: {
            type: "array",
            items: { type: "string" },
            description: "8-12 unified post-operative care instructions covering all procedures",
          },
          dietary_guide: {
            type: "object",
            required: ["avoid", "prefer", "duration_hours"],
            properties: {
              avoid: { type: "array", items: { type: "string" }, description: "Foods/drinks to avoid" },
              prefer: { type: "array", items: { type: "string" }, description: "Recommended foods" },
              duration_hours: { type: "number", description: "Duration in hours for restrictions (24, 48, or 72)" },
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

interface AIDocumentResult {
  treatment_explanation: string;
  post_operative: string[];
  dietary_guide: { avoid: string[]; prefer: string[]; duration_hours: number };
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

  const preflightResponse = handleCorsPreFlight(req);
  if (preflightResponse) return preflightResponse;

  logger.log(`[${reqId}] generate-patient-document: start`);

  try {
    const supabaseService = getSupabaseClient();

    const authResult = await authenticateRequest(req, supabaseService, corsHeaders);
    if (isAuthError(authResult)) return authResult;
    const { user } = authResult;
    const userId = user.id;

    const rateLimitResult = await checkRateLimit(
      supabaseService, userId, "generate-patient-document", RATE_LIMITS.AI_LIGHT,
    );
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

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

    // Fetch all evaluations for the session
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

    const evals = evaluations as EvaluationRow[];
    const patientName = evals[0]?.patient_name || "Paciente";

    // Fetch profile for TCLE
    let profile: { full_name: string | null; cro: string | null; clinic_name: string | null } | null = null;
    if (includeTCLE) {
      const { data: profileData } = await supabaseService
        .from("profiles")
        .select("full_name, cro, clinic_name")
        .eq("id", userId)
        .single();
      profile = profileData;
    }

    // Build consolidated teeth summary for prompt
    const teethSummary = evals.map(e => ({
      tooth: e.tooth,
      toothName: toothToName(e.tooth),
      treatmentType: treatmentToDescription(e.treatment_type),
      material: e.stratification_protocol?.layers?.[0]?.resin_brand || "material restaurador",
      region: e.region || "nao especificada",
    }));

    // Aggregate alerts from all evaluations
    const allAlerts = evals.flatMap(e => [...(e.alerts || []), ...(e.warnings || [])]);
    const uniqueAlerts = [...new Set(allAlerts)];

    // Build prompt params (consolidated)
    const promptDef = getPrompt<PatientDocumentParams>("patient-document");
    const promptParams: PatientDocumentParams = {
      teeth: teethSummary,
      aestheticLevel: evals[0].aesthetic_level || "padrao",
      patientAge: evals[0].patient_age || 30,
      bruxism: evals.some(e => e.bruxism),
      alerts: uniqueAlerts,
    };

    const systemPrompt = promptDef.system(promptParams);
    const userPrompt = promptDef.user(promptParams);
    const messages: OpenAIMessage[] = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userPrompt },
    ];

    logger.log(`[${reqId}] Generating consolidated document for ${evals.length} teeth`);

    // Single AI call for entire session
    const metrics = createSupabaseMetrics(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const aiResult = await withMetrics<{
      text: string | null;
      functionCall: { name: string; args: Record<string, unknown> } | null;
      finishReason: string;
    }>(metrics, promptDef.id, PROMPT_VERSION, promptDef.model)(async () => {
      const response = await callClaudeWithTools(
        promptDef.model, messages, tools,
        {
          temperature: promptDef.temperature,
          maxTokens: promptDef.maxTokens,
          forceFunctionName: "generate_patient_document",
          timeoutMs: 30_000,
          maxRetries: 1,
        },
      );
      return {
        result: { text: response.text, functionCall: response.functionCall, finishReason: response.finishReason },
        tokensIn: response.tokens?.inputTokens ?? 0,
        tokensOut: response.tokens?.outputTokens ?? 0,
      };
    });

    if (!aiResult.functionCall) {
      logger.error(`[${reqId}] No function call in AI response`);
      return createErrorResponse("AI failed to generate document", 500, corsHeaders);
    }

    const doc = aiResult.functionCall.args as unknown as AIDocumentResult;

    // Generate consolidated TCLE if requested
    let tcle: string | undefined;
    if (includeTCLE && profile) {
      const teethDesc = teethSummary.map(t => `${t.tooth} - ${t.toothName}`).join(", ");
      const proceduresDesc = [...new Set(teethSummary.map(t => t.treatmentType))].join(", ");
      const materialsDesc = [...new Set(teethSummary.map(t => t.material))].join(", ");

      tcle = generateTCLE({
        procedimento: proceduresDesc,
        dente: teethDesc,
        material: materialsDesc,
        riscos: uniqueAlerts,
        alternativas: evals[0].ai_indication_reason || "Alternativas ao tratamento serao discutidas em consulta.",
        clinica: profile.clinic_name || "Clinica",
        dentista: profile.full_name || "Dentista",
        cro: profile.cro || "",
        data: new Date().toLocaleDateString("pt-BR"),
        paciente: patientName,
      });
    }

    // Build single consolidated document
    const teeth = teethSummary.map(t => t.tooth);
    const fullDoc = {
      teeth,
      treatment_type: [...new Set(evals.map(e => e.treatment_type))].join(", "),
      ...doc,
      generated_at: new Date().toISOString(),
      ...(tcle ? { tcle } : {}),
    };

    // Save same document to ALL evaluations in the session
    for (const evaluation of evals) {
      const { error: updateError } = await supabaseService
        .from("evaluations")
        .update({ patient_document: fullDoc })
        .eq("id", evaluation.id)
        .eq("user_id", userId);

      if (updateError) {
        logger.error(`[${reqId}] Error saving document for evaluation ${evaluation.id}:`, updateError);
      }
    }

    logger.log(`[${reqId}] generate-patient-document: done (${evals.length} teeth consolidated)`);

    // Return array with single document (frontend expects array)
    return new Response(
      JSON.stringify({ success: true, documents: [fullDoc] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    if (error instanceof ClaudeError) {
      logger.error(`[${reqId}] Claude API error (${error.statusCode}):`, error.message);
    } else {
      logger.error(`[${reqId}] generate-patient-document error:`, error);
    }
    return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders, undefined, reqId);
  }
});
