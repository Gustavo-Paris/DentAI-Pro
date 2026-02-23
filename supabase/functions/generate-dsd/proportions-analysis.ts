import { createErrorResponse, ERROR_MESSAGES } from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import type { OpenAITool } from "../_shared/gemini.ts";
import {
  callGeminiVision,
  callGeminiVisionWithTools,
  GeminiError,
} from "../_shared/gemini.ts";
import {
  callClaudeVision,
  callClaudeVisionWithTools,
  ClaudeError,
} from "../_shared/claude.ts";
import { sanitizeForPrompt } from "../_shared/validation.ts";
import { getPrompt } from "../_shared/prompts/registry.ts";
import { withMetrics } from "../_shared/prompts/index.ts";
import type { Params as DsdAnalysisParams } from "../_shared/prompts/definitions/dsd-analysis.ts";
import { createSupabaseMetrics, PROMPT_VERSION } from "../_shared/metrics-adapter.ts";
import { parseAIResponse, DSDAnalysisSchema, normalizeAnalysisEnums } from "../_shared/aiSchemas.ts";
import type { DSDAnalysis, AdditionalPhotos, PatientPreferences, ClinicalToothFinding, SmileLineClassifierResult } from "./types.ts";
import { parseSmileLineClassifierResponse, applySmileLineOverride } from "./smile-line-classifier.ts";

// Analyze facial proportions
export async function analyzeProportions(
  imageBase64: string,
  corsHeaders: Record<string, string>,
  additionalPhotos?: AdditionalPhotos,
  patientPreferences?: PatientPreferences,
  clinicalObservations?: string[],
  clinicalTeethFindings?: ClinicalToothFinding[],
): Promise<DSDAnalysis | Response> {
  // Build additional context based on available photos
  let additionalContext = '';
  if (additionalPhotos?.smile45) {
    additionalContext += `
FOTO ADICIONAL - SORRISO 45°:
Uma foto do sorriso em ângulo de 45 graus foi fornecida. Use-a para:
- Avaliar melhor o corredor bucal (espaço escuro lateral)
- Analisar a projeção labial e dental em perfil
- Verificar a curvatura do arco do sorriso
`;
  }
  if (additionalPhotos?.face) {
    additionalContext += `
FOTO ADICIONAL - FACE COMPLETA:
Uma foto da face completa foi fornecida. Use-a para:
- Aplicar a regra dos terços faciais com mais precisão
- Avaliar a linha média facial em relação a landmarks como nariz e queixo
- Considerar proporções faciais globais no planejamento
`;
  }

  // Build patient preferences context (sanitize user-provided text before prompt interpolation)
  let preferencesContext = '';
  if (patientPreferences?.aestheticGoals || patientPreferences?.desiredChanges?.length) {
    preferencesContext = `

PREFERÊNCIAS DO PACIENTE:
O paciente expressou os seguintes desejos estéticos. PRIORIZE sugestões que atendam a estes objetivos quando clinicamente viável:
`;
    if (patientPreferences.aestheticGoals) {
      const safeGoals = sanitizeForPrompt(patientPreferences.aestheticGoals);
      preferencesContext += `Objetivos descritos pelo paciente: "${safeGoals}"
`;
    }
    if (patientPreferences.desiredChanges?.length) {
      const safeChanges = patientPreferences.desiredChanges.map(c => sanitizeForPrompt(c));
      preferencesContext += `Mudanças desejadas: ${safeChanges.join(', ')}
`;
    }
    preferencesContext += `
IMPORTANTE: Use as preferências do paciente para PRIORIZAR sugestões, mas NÃO sugira tratamentos clinicamente inadequados apenas para atender desejos. Sempre mantenha o foco em resultados conservadores e naturais.`;
  }

  // Build clinical context from prior analysis to prevent contradictions
  // (sanitize even though these come from AI output — they pass through the client)
  let clinicalContext = '';
  if (clinicalObservations?.length || clinicalTeethFindings?.length) {
    clinicalContext = `

=== ANÁLISE CLÍNICA PRÉVIA (RESPEITAR OBRIGATORIAMENTE) ===
A análise clínica inicial já foi realizada sobre esta mesma foto por outro modelo de IA.
Você DEVE manter CONSISTÊNCIA com os achados clínicos abaixo.
`;
    if (clinicalObservations?.length) {
      const safeObservations = clinicalObservations.map(o => sanitizeForPrompt(o));
      clinicalContext += `
Observações clínicas prévias:
${safeObservations.map(o => `- ${o}`).join('\n')}

REGRA: Sua classificação de arco do sorriso, corredor bucal e desgaste incisal DEVE ser
CONSISTENTE com as observações acima. Se houver discordância, justifique nas observations.
`;
    }
    if (clinicalTeethFindings?.length) {
      const safeFindings = clinicalTeethFindings.map(f => ({
        tooth: sanitizeForPrompt(f.tooth),
        indication_reason: f.indication_reason ? sanitizeForPrompt(f.indication_reason) : undefined,
        treatment_indication: f.treatment_indication ? sanitizeForPrompt(f.treatment_indication) : undefined,
      }));
      clinicalContext += `
Achados clínicos POR DENTE (diagnóstico já realizado):
${safeFindings.map(f => `- Dente ${f.tooth}: ${f.indication_reason || 'sem observação específica'} (indicação: ${f.treatment_indication || 'não definida'})`).join('\n')}

⚠️ REGRA CRÍTICA - NÃO INVENTAR RESTAURAÇÕES:
Se a análise clínica acima identificou o problema de um dente como "diastema", "fechamento de diastema",
"desgaste", "microdontia" ou "conoide", você NÃO PODE dizer "Substituir restauração" para esse dente.
Apenas diga "Substituir restauração" se a análise clínica EXPLICITAMENTE mencionar "restauração existente",
"restauração antiga", "interface de restauração" ou "manchamento de restauração" para aquele dente específico.
Se o problema clínico é diastema → sua sugestão deve ser "Fechar diastema com..." ou "Adicionar faceta para..."
Se o problema clínico é microdontia/conoide → sua sugestão deve ser "Aumentar volume com..." ou "Reabilitar morfologia com..."
`;
    }
  }

  const dsdPrompt = getPrompt('dsd-analysis');
  const analysisPrompt = dsdPrompt.system({ additionalContext, preferencesContext, clinicalContext, additionalPhotos } as DsdAnalysisParams);

  // Tool definition for DSD analysis
  const tools: OpenAITool[] = [
    {
      type: "function",
      function: {
        name: "analyze_dsd",
        description: "Retorna a análise completa do Digital Smile Design",
        parameters: {
          type: "object",
          properties: {
            facial_midline: {
              type: "string",
              enum: ["centrada", "desviada_esquerda", "desviada_direita"],
            },
            dental_midline: {
              type: "string",
              enum: ["alinhada", "desviada_esquerda", "desviada_direita"],
            },
            smile_line: {
              type: "string",
              enum: ["alta", "média", "baixa"],
            },
            buccal_corridor: {
              type: "string",
              enum: ["adequado", "excessivo", "ausente"],
            },
            occlusal_plane: {
              type: "string",
              enum: ["nivelado", "inclinado_esquerda", "inclinado_direita"],
            },
            golden_ratio_compliance: {
              type: "number",
              minimum: 0,
              maximum: 100,
            },
            symmetry_score: {
              type: "number",
              minimum: 0,
              maximum: 100,
            },
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tooth: { type: "string", description: "Número do dente em notação FDI (apenas UM número por sugestão: 11, 12, 13, etc). Para múltiplos dentes, criar sugestões SEPARADAS para cada dente." },
                  current_issue: { type: "string", description: "Problema identificado no dente" },
                  proposed_change: { type: "string", description: "Mudança proposta para melhorar" },
                  treatment_indication: {
                    type: "string",
                    enum: ["resina", "porcelana", "coroa", "implante", "endodontia", "encaminhamento", "gengivoplastia", "recobrimento_radicular"],
                    description: "Tipo de tratamento indicado: resina (restauração direta, acréscimo incisal, fechamento de diastema), porcelana (faceta/laminado para múltiplos dentes), coroa (destruição extensa), implante (dente ausente), endodontia (canal), encaminhamento (ortodontia/especialista), gengivoplastia (remoção de excesso gengival), recobrimento_radicular (cobertura de raiz exposta)",
                  },
                },
                required: ["tooth", "current_issue", "proposed_change", "treatment_indication"],
              },
            },
            observations: {
              type: "array",
              items: { type: "string" },
            },
            confidence: {
              type: "string",
              enum: ["alta", "média", "baixa"],
            },
            // Lip analysis
            lip_thickness: {
              type: "string",
              enum: ["fino", "médio", "volumoso"],
              description: "Espessura labial do paciente: fino, médio ou volumoso",
            },
            // Overbite suspicion
            overbite_suspicion: {
              type: "string",
              enum: ["sim", "não", "indeterminado"],
              description: "Suspeita de sobremordida profunda baseada na foto: sim, não ou indeterminado",
            },
            // Visagism fields
            face_shape: {
              type: "string",
              enum: ["oval", "quadrado", "triangular", "retangular", "redondo"],
              description: "Formato facial predominante do paciente",
            },
            perceived_temperament: {
              type: "string",
              enum: ["colérico", "sanguíneo", "melancólico", "fleumático", "misto"],
              description: "Temperamento percebido baseado nas características faciais",
            },
            smile_arc: {
              type: "string",
              enum: ["consonante", "plano", "reverso"],
              description: "Relação entre bordos incisais e contorno do lábio inferior",
            },
            recommended_tooth_shape: {
              type: "string",
              enum: ["quadrado", "oval", "triangular", "retangular", "natural"],
              description: "Formato de dente recomendado baseado no visagismo",
            },
            visagism_notes: {
              type: "string",
              description: "Justificativa da análise de visagismo e correlação face-dente",
            },
          },
          required: [
            "facial_midline",
            "dental_midline",
            "smile_line",
            "buccal_corridor",
            "occlusal_plane",
            "golden_ratio_compliance",
            "symmetry_score",
            "suggestions",
            "observations",
            "confidence",
            "lip_thickness",
            "overbite_suspicion",
            "face_shape",
            "perceived_temperament",
            "smile_arc",
            "recommended_tooth_shape",
          ],
          additionalProperties: false,
        },
      },
    },
  ];

  // Extract base64 and mime type from data URL
  const dataUrlMatch = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
  if (!dataUrlMatch) {
    logger.error("Invalid image data URL for analysis");
    return createErrorResponse(ERROR_MESSAGES.IMAGE_INVALID, 400, corsHeaders);
  }
  const [, mimeType, base64Data] = dataUrlMatch;

  // Metrics for DSD analysis
  const metrics = createSupabaseMetrics(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const dsdAnalysisPromptDef = getPrompt('dsd-analysis');

  // Dual-pass: start smile line classifier in PARALLEL (Haiku 4.5, ~2-3s)
  // Non-blocking: if it fails, main analysis is unaffected
  const classifierPromptDef = getPrompt('smile-line-classifier');
  const classifierPromise: Promise<SmileLineClassifierResult | null> = (async () => {
    try {
      const classifierResponse = await withMetrics<{ text: string | null }>(
        metrics, classifierPromptDef.id, PROMPT_VERSION, classifierPromptDef.model
      )(async () => {
        const resp = await callClaudeVision(
          classifierPromptDef.model,
          classifierPromptDef.user({}),
          base64Data,
          mimeType,
          {
            systemPrompt: classifierPromptDef.system({}),
            temperature: classifierPromptDef.temperature,
            maxTokens: classifierPromptDef.maxTokens,
          }
        );
        if (resp.tokens) {
          logger.info('claude_tokens', { operation: 'generate-dsd:smile-line-classifier', ...resp.tokens });
        }
        return {
          result: { text: resp.text },
          tokensIn: resp.tokens?.promptTokenCount ?? 0,
          tokensOut: resp.tokens?.candidatesTokenCount ?? 0,
        };
      });
      return parseSmileLineClassifierResponse(classifierResponse.text || '');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn("Smile line classifier failed (non-blocking):", msg);
      return null;
    }
  })();

  // Helper to parse DSD result from function call or text fallback
  const parseDsdResult = (result: { text: string | null; functionCall: { name: string; args: Record<string, unknown> } | null }): DSDAnalysis | null => {
    if (result.functionCall) {
      return parseAIResponse(DSDAnalysisSchema, result.functionCall.args, 'generate-dsd') as DSDAnalysis;
    }
    if (result.text) {
      let jsonText = result.text.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      }
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return parseAIResponse(DSDAnalysisSchema, JSON.parse(jsonMatch[0]), 'generate-dsd') as DSDAnalysis;
        } catch { /* fall through */ }
      }
    }
    return null;
  };

  const finalizeResult = async (parsed: DSDAnalysis): Promise<DSDAnalysis> => {
    const normalized = normalizeAnalysisEnums(parsed);
    const classifierResult = await classifierPromise;
    applySmileLineOverride(normalized, classifierResult);
    return normalized;
  };

  try {
    // Primary: Gemini 3.1 Pro Vision with tools
    const result = await withMetrics<{ text: string | null; functionCall: { name: string; args: Record<string, unknown> } | null; finishReason: string }>(metrics, dsdAnalysisPromptDef.id, PROMPT_VERSION, dsdAnalysisPromptDef.model)(async () => {
      const response = await callGeminiVisionWithTools(
        dsdAnalysisPromptDef.model,
        "Analise esta foto e retorne a análise DSD completa usando a ferramenta analyze_dsd.",
        base64Data,
        mimeType,
        tools,
        {
          systemPrompt: analysisPrompt,
          temperature: 0.0,
          maxTokens: 4000,
          forceFunctionName: "analyze_dsd",
          timeoutMs: 50_000,
          thinkingLevel: "low",
        }
      );
      if (response.tokens) {
        logger.info('gemini_tokens', { operation: 'generate-dsd:analysis', ...response.tokens });
      }
      return {
        result: { text: response.text, functionCall: response.functionCall, finishReason: response.finishReason },
        tokensIn: response.tokens?.promptTokenCount ?? 0,
        tokensOut: response.tokens?.candidatesTokenCount ?? 0,
      };
    });

    const parsed = parseDsdResult(result);
    if (parsed) return await finalizeResult(parsed);

    // MALFORMED_FUNCTION_CALL or no function call: fallback to plain vision (no tools)
    logger.warn(`Gemini function calling failed (finishReason=${result.finishReason}) — falling back to plain JSON vision call`);

    const plainResponse = await callGeminiVision(
      dsdAnalysisPromptDef.model,
      `Analise esta foto odontológica e retorne a análise DSD completa.
Responda APENAS com um objeto JSON válido (sem markdown, sem backticks) com os seguintes campos:
facial_midline, dental_midline, smile_line, buccal_corridor, occlusal_plane,
golden_ratio_compliance, symmetry_score, suggestions (array), observations (array),
confidence, lip_thickness, overbite_suspicion, face_shape, perceived_temperament,
smile_arc, recommended_tooth_shape, visagism_notes.
Use SOMENTE valores em português conforme os enums do schema.`,
      base64Data,
      mimeType,
      {
        systemPrompt: analysisPrompt,
        temperature: 0.0,
        maxTokens: 4000,
      }
    );
    if (plainResponse.tokens) {
      logger.info('gemini_tokens', { operation: 'generate-dsd:analysis-plain-fallback', ...plainResponse.tokens });
    }

    const plainParsed = parseDsdResult({ text: plainResponse.text, functionCall: null });
    if (plainParsed) {
      logger.info("Recovered DSD analysis from Gemini plain vision fallback");
      return await finalizeResult(plainParsed);
    }

    logger.error("Gemini: no parseable response. finishReason:", result.finishReason, "Text:", result.text?.substring(0, 300));
    return createErrorResponse(`${ERROR_MESSAGES.AI_ERROR} [no_function_call, finish=${result.finishReason}]`, 500, corsHeaders);
  } catch (primaryError) {
    // Gemini failed — try Claude Sonnet 4.6 as cross-provider fallback
    const errMsg = primaryError instanceof Error ? primaryError.message : String(primaryError);
    const statusCode = primaryError instanceof GeminiError ? primaryError.statusCode : 0;
    logger.warn(`Gemini DSD analysis failed (${statusCode}): ${errMsg}. Trying Claude fallback...`);

    if (statusCode === 429) {
      return createErrorResponse(ERROR_MESSAGES.RATE_LIMITED, 429, corsHeaders, "RATE_LIMITED");
    }

    try {
      const fallbackModel = "claude-sonnet-4-6";
      const fallbackResult = await withMetrics<{ text: string | null; functionCall: { name: string; args: Record<string, unknown> } | null; finishReason: string }>(metrics, dsdAnalysisPromptDef.id, PROMPT_VERSION, fallbackModel)(async () => {
        const response = await callClaudeVisionWithTools(
          fallbackModel,
          "Analise esta foto e retorne a análise DSD completa usando a ferramenta analyze_dsd.",
          base64Data,
          mimeType,
          tools,
          {
            systemPrompt: analysisPrompt,
            temperature: 0.0,
            maxTokens: 4000,
            forceFunctionName: "analyze_dsd",
            timeoutMs: 45_000,
          }
        );
        if (response.tokens) {
          logger.info('claude_tokens', { operation: 'generate-dsd:analysis-fallback', ...response.tokens });
        }
        return {
          result: { text: response.text, functionCall: response.functionCall, finishReason: response.finishReason },
          tokensIn: response.tokens?.promptTokenCount ?? 0,
          tokensOut: response.tokens?.candidatesTokenCount ?? 0,
        };
      });

      const fallbackParsed = parseDsdResult(fallbackResult);
      if (fallbackParsed) {
        logger.info("Claude fallback DSD analysis succeeded");
        return await finalizeResult(fallbackParsed);
      }

      logger.error("Claude fallback: no parseable response. finishReason:", fallbackResult.finishReason);
      return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
    } catch (fallbackError) {
      if (fallbackError instanceof ClaudeError && fallbackError.statusCode === 429) {
        return createErrorResponse(ERROR_MESSAGES.RATE_LIMITED, 429, corsHeaders, "RATE_LIMITED");
      }
      const fbMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      logger.error(`Both Gemini and Claude failed for DSD. Gemini: ${errMsg}. Claude: ${fbMsg}`);
      return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
    }
  }
}
