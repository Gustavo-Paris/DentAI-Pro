import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreFlight, createErrorResponse, ERROR_MESSAGES, generateRequestId } from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import {
  callGeminiVisionWithTools,
  callGeminiImageEdit,
  GeminiError,
  type OpenAITool
} from "../_shared/gemini.ts";
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { checkAndUseCredits, createInsufficientCreditsResponse, refundCredits } from "../_shared/credits.ts";
import { sanitizeForPrompt } from "../_shared/validation.ts";
import { getPrompt } from "../_shared/prompts/registry.ts";
import { withMetrics } from "../_shared/prompts/index.ts";
import type { Params as DsdAnalysisParams } from "../_shared/prompts/definitions/dsd-analysis.ts";
import type { Params as DsdSimulationParams } from "../_shared/prompts/definitions/dsd-simulation.ts";
import { createSupabaseMetrics, PROMPT_VERSION } from "../_shared/metrics-adapter.ts";

// DSD Analysis interface
interface DSDAnalysis {
  facial_midline: "centrada" | "desviada_esquerda" | "desviada_direita";
  dental_midline: "alinhada" | "desviada_esquerda" | "desviada_direita";
  smile_line: "alta" | "média" | "baixa";
  buccal_corridor: "adequado" | "excessivo" | "ausente";
  occlusal_plane: "nivelado" | "inclinado_esquerda" | "inclinado_direita";
  golden_ratio_compliance: number;
  symmetry_score: number;
  suggestions: {
    tooth: string;
    current_issue: string;
    proposed_change: string;
    treatment_indication?: "resina" | "porcelana" | "coroa" | "implante" | "endodontia" | "encaminhamento";
  }[];
  observations: string[];
  confidence: "alta" | "média" | "baixa";
  simulation_limitation?: string;
  // Lip analysis
  lip_thickness?: "fino" | "médio" | "volumoso";
  // Overbite suspicion
  overbite_suspicion?: "sim" | "não" | "indeterminado";
  // Visagism fields
  face_shape?: "oval" | "quadrado" | "triangular" | "retangular" | "redondo";
  perceived_temperament?: "colérico" | "sanguíneo" | "melancólico" | "fleumático" | "misto";
  smile_arc?: "consonante" | "plano" | "reverso";
  recommended_tooth_shape?: "quadrado" | "oval" | "triangular" | "retangular" | "natural";
  visagism_notes?: string;
}

interface DSDResult {
  analysis: DSDAnalysis;
  simulation_url: string | null;
  simulation_note?: string;
}

interface AdditionalPhotos {
  smile45?: string;
  face?: string;
}

interface PatientPreferences {
  whiteningLevel?: 'natural' | 'white' | 'hollywood';
  // Legacy fields (deprecated)
  aestheticGoals?: string;
  desiredChanges?: string[];
}

// Whitening level to instruction mapping (direct, no AI analysis needed)
const WHITENING_INSTRUCTIONS: Record<string, { instruction: string; intensity: string }> = {
  natural: {
    instruction: "Make ALL visible teeth 1-2 shades lighter (A1/A2). Subtle, natural whitening that looks realistic.",
    intensity: "NATURAL"
  },
  white: {
    instruction: "Make ALL visible teeth clearly whiter (BL1/BL2). Noticeable whitening but not extreme.",
    intensity: "NOTICEABLE"
  },
  hollywood: {
    instruction: "Make ALL visible teeth EXTREMELY WHITE (BL1). Pure bright white like porcelain veneers. The teeth should appear DRAMATICALLY lighter - almost glowing white. This is the MAXIMUM possible whitening.",
    intensity: "MAXIMUM"
  }
};

interface ClinicalToothFinding {
  tooth: string;
  indication_reason?: string;
  treatment_indication?: string;
}

interface RequestData {
  imageBase64: string;
  evaluationId?: string;
  regenerateSimulationOnly?: boolean;
  existingAnalysis?: DSDAnalysis;
  toothShape?: 'natural' | 'quadrado' | 'triangular' | 'oval' | 'retangular';
  additionalPhotos?: AdditionalPhotos;
  patientPreferences?: PatientPreferences;
  analysisOnly?: boolean; // Return only analysis, skip simulation
  clinicalObservations?: string[]; // Observations from analyze-dental-photo to prevent contradictions
  clinicalTeethFindings?: ClinicalToothFinding[]; // Per-tooth findings to prevent false restoration claims
  layerType?: 'restorations-only' | 'whitening-restorations' | 'complete-treatment'; // Multi-layer simulation
}

// Validate request
function validateRequest(data: unknown): { success: boolean; error?: string; data?: RequestData } {
  if (!data || typeof data !== "object") {
    return { success: false, error: "Dados inválidos" };
  }

  const req = data as Record<string, unknown>;

  if (!req.imageBase64 || typeof req.imageBase64 !== "string") {
    return { success: false, error: "Imagem não fornecida" };
  }

  // Validate base64 format
  const base64Pattern = /^data:image\/(jpeg|jpg|png|webp);base64,/;
  if (!base64Pattern.test(req.imageBase64)) {
    return { success: false, error: ERROR_MESSAGES.IMAGE_FORMAT_UNSUPPORTED };
  }

  const validShapes = ['natural', 'quadrado', 'triangular', 'oval', 'retangular'];
  const toothShape = validShapes.includes(req.toothShape as string) ? req.toothShape as string : 'natural';

  // Parse additional photos if provided
  let additionalPhotos: AdditionalPhotos | undefined;
  if (req.additionalPhotos && typeof req.additionalPhotos === 'object') {
    const photos = req.additionalPhotos as Record<string, unknown>;
    additionalPhotos = {
      smile45: typeof photos.smile45 === 'string' && photos.smile45 ? photos.smile45 : undefined,
      face: typeof photos.face === 'string' && photos.face ? photos.face : undefined,
    };
    if (!additionalPhotos.smile45 && !additionalPhotos.face) {
      additionalPhotos = undefined;
    }
  }

  // Parse patient preferences if provided
  let patientPreferences: PatientPreferences | undefined;
  if (req.patientPreferences && typeof req.patientPreferences === 'object') {
    const prefs = req.patientPreferences as Record<string, unknown>;
    const whiteningLevelRaw = typeof prefs.whiteningLevel === 'string' ? prefs.whiteningLevel : undefined;
    const whiteningLevel = (whiteningLevelRaw === 'natural' || whiteningLevelRaw === 'white' || whiteningLevelRaw === 'hollywood')
      ? (whiteningLevelRaw as PatientPreferences['whiteningLevel'])
      : undefined;
    patientPreferences = {
      whiteningLevel,
      aestheticGoals: typeof prefs.aestheticGoals === 'string' ? prefs.aestheticGoals : undefined,
      desiredChanges: Array.isArray(prefs.desiredChanges) ? prefs.desiredChanges : undefined,
    };
    if (!patientPreferences.whiteningLevel && !patientPreferences.aestheticGoals && !patientPreferences.desiredChanges?.length) {
      patientPreferences = undefined;
    }
  }

  // Parse clinical observations if provided (from analyze-dental-photo)
  const clinicalObservations = Array.isArray(req.clinicalObservations)
    ? (req.clinicalObservations as string[]).filter(o => typeof o === 'string')
    : undefined;

  // Parse per-tooth clinical findings if provided
  const clinicalTeethFindings = Array.isArray(req.clinicalTeethFindings)
    ? (req.clinicalTeethFindings as ClinicalToothFinding[]).filter(
        (f): f is ClinicalToothFinding => typeof f === 'object' && f !== null && typeof f.tooth === 'string'
      )
    : undefined;

  // Validate layerType if provided
  const validLayerTypes = ['restorations-only', 'whitening-restorations', 'complete-treatment'];
  const layerType = validLayerTypes.includes(req.layerType as string)
    ? req.layerType as RequestData['layerType']
    : undefined;

  return {
    success: true,
    data: {
      imageBase64: req.imageBase64,
      evaluationId: typeof req.evaluationId === "string" ? req.evaluationId : undefined,
      regenerateSimulationOnly: req.regenerateSimulationOnly === true,
      existingAnalysis: req.existingAnalysis as DSDAnalysis | undefined,
      toothShape: toothShape as RequestData['toothShape'],
      additionalPhotos,
      patientPreferences,
      analysisOnly: req.analysisOnly === true,
      clinicalObservations,
      clinicalTeethFindings,
      layerType,
    },
  };
}

// Tooth shape descriptions for simulation prompt
const toothShapeDescriptions: Record<string, string> = {
  natural: "Manter as características individuais naturais de cada dente do paciente",
  quadrado: "Bordas incisais retas e paralelas, ângulos bem definidos, proporção largura/altura equilibrada",
  triangular: "Convergência gradual em direção à cervical, bordas incisais mais largas que a região cervical",
  oval: "Contornos arredondados e suaves, transições sem ângulos marcados, formato elíptico",
  retangular: "Proporção altura/largura mais alongada, bordas verticais mais paralelas",
};

// Check if case has severe destruction that limits DSD
function hasSevereDestruction(analysis: DSDAnalysis): { isLimited: boolean; reason: string | null } {
  const destructionKeywords = [
    'ausente', 'destruição', 'raiz residual', 'implante', 'extração',
    'fratura extensa', 'destruído', 'coroa total', 'prótese', 'sem coroa'
  ];
  
  const hasDestructionInSuggestions = analysis.suggestions.some(s => 
    destructionKeywords.some(keyword => 
      s.current_issue.toLowerCase().includes(keyword) ||
      s.proposed_change.toLowerCase().includes(keyword)
    )
  );
  
  const hasDestructionInObservations = analysis.observations?.some(obs =>
    destructionKeywords.some(keyword => obs.toLowerCase().includes(keyword))
  );
  
  if (hasDestructionInSuggestions || hasDestructionInObservations) {
    return {
      isLimited: true,
      reason: "Caso apresenta destruição dental significativa (dente ausente, fratura extensa ou necessidade de implante/coroa). A simulação visual pode não representar o resultado final com precisão."
    };
  }
  
  // Check if confidence is low due to photo quality or case complexity
  if (analysis.confidence === 'baixa') {
    const hasTrueIntraoralIssue = analysis.observations?.some(obs => {
      const lower = obs.toLowerCase();
      return (lower.includes('afastador') || 
              (lower.includes('intraoral') && (lower.includes('interna') || lower.includes('sem lábio') || lower.includes('retrator'))) ||
              lower.includes('close-up extremo'));
    });
    
    if (hasTrueIntraoralIssue) {
      return {
        isLimited: true,
        reason: "Foto intraoral com afastador detectada. Recomenda-se foto do sorriso completo para simulação mais precisa."
      };
    }
  }
  
  return { isLimited: false, reason: null };
}

// REMOVED: analyzePatientPreferences function - now using direct mapping from UI selection

// SIMPLIFIED: Generate simulation image - single attempt, no blend, no verification
async function generateSimulation(
  imageBase64: string,
  analysis: DSDAnalysis,
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  toothShape: string = 'natural',
  patientPreferences?: PatientPreferences,
  layerType?: 'restorations-only' | 'whitening-restorations' | 'complete-treatment',
): Promise<string | null> {
  const SIMULATION_TIMEOUT = 55_000; // 55s max
  
  // Get whitening level from direct UI selection (no AI analysis needed!)
  const whiteningLevel = patientPreferences?.whiteningLevel || 'natural';
  const whiteningConfig = WHITENING_INSTRUCTIONS[whiteningLevel] || WHITENING_INSTRUCTIONS.natural;
  
  logger.log("Whitening config from UI selection:", {
    selectedLevel: whiteningLevel,
    intensity: whiteningConfig.intensity
  });

  // Build simple, direct instructions
  const colorInstruction = `- ${whiteningConfig.instruction}`;
  const whiteningIntensity = whiteningConfig.intensity;

  // Get visagism data for context-aware simulation
  const faceShape = analysis.face_shape || 'oval';
  const toothShapeRecommendation = analysis.recommended_tooth_shape || toothShape || 'natural';
  const smileArc = analysis.smile_arc || 'consonante';

  // Check if case needs reconstruction (missing/destroyed teeth)
  const needsReconstruction = analysis.suggestions.some(s => {
    const issue = s.current_issue.toLowerCase();
    const change = s.proposed_change.toLowerCase();
    return issue.includes('ausente') ||
           issue.includes('destruição') ||
           issue.includes('destruído') ||
           issue.includes('fratura') ||
           issue.includes('raiz residual') ||
           change.includes('implante') ||
           change.includes('coroa total') ||
           change.includes('extração');
  });

  // Check if case has old restorations that need replacement
  const needsRestorationReplacement = analysis.suggestions.some(s => {
    const issue = s.current_issue.toLowerCase();
    const change = s.proposed_change.toLowerCase();
    return issue.includes('restauração') ||
           issue.includes('restauracao') ||
           issue.includes('resina') ||
           issue.includes('manchamento') ||
           issue.includes('interface') ||
           issue.includes('infiltração') ||
           issue.includes('infiltracao') ||
           change.includes('substituir') ||
           change.includes('substituição') ||
           change.includes('substituicao') ||
           change.includes('nova restauração') ||
           change.includes('nova restauracao');
  });

  // Get list of teeth needing restoration replacement for the prompt
  let restorationTeeth = '';
  if (needsRestorationReplacement) {
    restorationTeeth = analysis.suggestions
      .filter(s => {
        const issue = s.current_issue.toLowerCase();
        return issue.includes('restauração') ||
               issue.includes('restauracao') ||
               issue.includes('resina') ||
               issue.includes('manchamento') ||
               issue.includes('interface');
      })
      .map(s => s.tooth)
      .join(', ');
  }

  // Check if it's a TRUE intraoral photo
  const isIntraoralPhoto = analysis.observations?.some(obs => {
    const lower = obs.toLowerCase();
    return lower.includes('afastador') ||
           lower.includes('retrator') ||
           (lower.includes('intraoral') && (lower.includes('interna') || lower.includes('sem lábio'))) ||
           lower.includes('close-up extremo');
  });

  // Allow shape changes from DSD analysis (conoid laterals, visagism corrections)
  // Only filter out truly destructive structural changes
  const destructiveKeywords = [
    'reconstruir', 'reconstruct', 'rebuild',
  ];

  const filteredSuggestions = analysis.suggestions?.filter(s => {
    const change = s.proposed_change.toLowerCase();
    const issue = s.current_issue.toLowerCase();
    const isDestructive = destructiveKeywords.some(kw =>
      change.includes(kw) || issue.includes(kw)
    );
    return !isDestructive;
  }) || [];

  const allowedChangesFromAnalysis = filteredSuggestions.length > 0
    ? `\nSPECIFIC CORRECTIONS FROM ANALYSIS (apply these changes):\n${filteredSuggestions.map(s =>
        `- Tooth ${s.tooth}: ${s.proposed_change}`
      ).join('\n')}`
    : '';

  // Determine case type for prompt variant selection
  const promptType = needsReconstruction ? 'reconstruction' :
                     (needsRestorationReplacement ? 'restoration-replacement' :
                     (isIntraoralPhoto ? 'intraoral' : 'standard')) as DsdSimulationParams['caseType'];

  // Build specific instructions for reconstruction cases
  let specificInstructions: string | undefined;
  if (needsReconstruction) {
    const teethToReconstruct = analysis.suggestions
      .filter(s => {
        const issue = s.current_issue.toLowerCase();
        const change = s.proposed_change.toLowerCase();
        return issue.includes('ausente') ||
               issue.includes('destruição') ||
               issue.includes('destruído') ||
               issue.includes('fratura') ||
               issue.includes('raiz') ||
               change.includes('implante') ||
               change.includes('coroa');
      });

    specificInstructions = teethToReconstruct.map(s => {
      const toothNum = parseInt(s.tooth);
      let contralateral = '';
      if (toothNum >= 11 && toothNum <= 18) {
        contralateral = String(toothNum + 10);
      } else if (toothNum >= 21 && toothNum <= 28) {
        contralateral = String(toothNum - 10);
      } else if (toothNum >= 31 && toothNum <= 38) {
        contralateral = String(toothNum + 10);
      } else if (toothNum >= 41 && toothNum <= 48) {
        contralateral = String(toothNum - 10);
      }
      return `Dente ${s.tooth}: COPIE do ${contralateral || 'vizinho'}`;
    }).join(', ');
  }

  // Build gengivoplasty suggestions for complete-treatment layer
  let gingivoSuggestions: string | undefined;
  if (layerType === 'complete-treatment') {
    const gingivoItems = analysis.suggestions?.filter(s => {
      const text = `${s.current_issue} ${s.proposed_change}`.toLowerCase();
      return text.includes('gengiv') || text.includes('zênite') || text.includes('zenite') || text.includes('gengivoplastia');
    }) || [];
    if (gingivoItems.length > 0) {
      gingivoSuggestions = gingivoItems.map(s =>
        `- Dente ${s.tooth}: ${s.proposed_change}`
      ).join('\n');
    }
  }

  // Build prompt via prompt management module
  const dsdSimulationPrompt = getPrompt('dsd-simulation');
  const simulationPrompt = dsdSimulationPrompt.system({
    whiteningLevel,
    colorInstruction,
    whiteningIntensity,
    caseType: promptType,
    faceShape,
    toothShapeRecommendation,
    smileArc,
    specificInstructions,
    restorationTeeth,
    allowedChangesFromAnalysis,
    layerType,
    gingivoSuggestions,
  } as DsdSimulationParams);
  
  logger.log("DSD Simulation Request:", {
    promptType,
    approach: "absolutePreservation + whiteningPriority",
    wantsWhitening: true,
    whiteningIntensity,
    whiteningLevel: whiteningLevel,
    colorInstruction: colorInstruction.substring(0, 80) + '...',
    promptLength: simulationPrompt.length,
    promptPreview: simulationPrompt.substring(0, 400) + '...',
  });

  // Extract base64 data and mime type from data URL
  const dataUrlMatch = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
  if (!dataUrlMatch) {
    logger.error("Invalid image data URL format");
    return null;
  }
  const [, inputMimeType, inputBase64Data] = dataUrlMatch;

  // Metrics for DSD simulation
  const metrics = createSupabaseMetrics(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const dsdSimulationPromptDef = getPrompt('dsd-simulation');

  try {
    logger.log("Calling Gemini Image Edit for simulation...");

    const result = await withMetrics<{ imageUrl: string | null; text: string | null }>(metrics, dsdSimulationPromptDef.id, PROMPT_VERSION, dsdSimulationPromptDef.model)(async () => {
      const response = await callGeminiImageEdit(
        simulationPrompt,
        inputBase64Data,
        inputMimeType,
        {
          temperature: 0.55,
          timeoutMs: SIMULATION_TIMEOUT,
        }
      );
      return {
        result: response,
        tokensIn: 0,
        tokensOut: 0,
      };
    });

    if (!result.imageUrl) {
      logger.warn("No image in Gemini response");
      return null;
    }

    // Upload generated image
    const base64Data = result.imageUrl.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const fileName = `${userId}/dsd_${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("dsd-simulations")
      .upload(fileName, binaryData, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      logger.error("Upload error:", uploadError);
      return null;
    }

    logger.log("Simulation generated and uploaded:", fileName);
    return fileName;
  } catch (err) {
    if (err instanceof GeminiError) {
      logger.warn(`Gemini simulation error (${err.statusCode}):`, err.message);
    } else {
      logger.warn("Simulation error:", err);
    }
    return null;
  }
}

// Analyze facial proportions
async function analyzeProportions(
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
  const analysisPrompt = dsdPrompt.system({ additionalContext, preferencesContext, clinicalContext } as DsdAnalysisParams);

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
                    enum: ["resina", "porcelana", "coroa", "implante", "endodontia", "encaminhamento"],
                    description: "Tipo de tratamento indicado: resina (restauração direta, fechamento de diastema pequeno), porcelana (faceta/laminado para múltiplos dentes ou casos estéticos), coroa (destruição extensa), implante (dente ausente/extração), endodontia (canal), encaminhamento (especialista)",
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

  try {
    const result = await withMetrics<{ text: string | null; functionCall: { name: string; args: Record<string, unknown> } | null; finishReason: string }>(metrics, dsdAnalysisPromptDef.id, PROMPT_VERSION, dsdAnalysisPromptDef.model)(async () => {
      const response = await callGeminiVisionWithTools(
        "gemini-2.5-pro",
        "Analise esta foto e retorne a análise DSD completa usando a ferramenta analyze_dsd.",
        base64Data,
        mimeType,
        tools,
        {
          systemPrompt: analysisPrompt,
          temperature: 0.1,
          maxTokens: 4000,
          forceFunctionName: "analyze_dsd",
        }
      );
      return {
        result: response,
        tokensIn: 0,
        tokensOut: 0,
      };
    });

    if (result.functionCall) {
      return result.functionCall.args as unknown as DSDAnalysis;
    }

    logger.error("No function call in Gemini response");
    return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
  } catch (error) {
    if (error instanceof GeminiError) {
      if (error.statusCode === 429) {
        return createErrorResponse(ERROR_MESSAGES.RATE_LIMITED, 429, corsHeaders, "RATE_LIMITED");
      }
      logger.error("Gemini analysis error:", error.message);
    } else {
      logger.error("AI analysis error:", error);
    }
    return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreFlight(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);
  const reqId = generateRequestId();
  logger.log(`[${reqId}] generate-dsd: start`);

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

    // Validate user token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return createErrorResponse(ERROR_MESSAGES.INVALID_TOKEN, 401, corsHeaders);
    }

    supabaseForRefund = supabase;
    userIdForRefund = user.id;

    // Check rate limit (AI_HEAVY: 10/min, 50/hour, 200/day)
    const rateLimitResult = await checkRateLimit(
      supabase,
      user.id,
      "generate-dsd",
      RATE_LIMITS.AI_HEAVY
    );

    if (!rateLimitResult.allowed) {
      logger.warn(`Rate limit exceeded for user ${user.id} on generate-dsd`);
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    // Parse and validate request body (need to parse before credit check)
    const body = await req.json();
    const validation = validateRequest(body);

    if (!validation.success || !validation.data) {
      return createErrorResponse(validation.error || ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
    }

    const {
      imageBase64,
      evaluationId,
      regenerateSimulationOnly,
      existingAnalysis,
      toothShape,
      additionalPhotos,
      patientPreferences,
      analysisOnly,
      clinicalObservations,
      clinicalTeethFindings,
      layerType,
    } = validation.data;

    // Validate ownership and check existing DSD state BEFORE credit check
    // This allows server-side verification that initial call was already charged
    let evaluationHasDsdAnalysis = false;
    if (evaluationId) {
      const { data: ownerCheck, error: ownerError } = await supabase
        .from("evaluations")
        .select("user_id, dsd_analysis")
        .eq("id", evaluationId)
        .single();

      if (ownerError || !ownerCheck) {
        return createErrorResponse("Avaliação não encontrada", 404, corsHeaders);
      }
      if (ownerCheck.user_id !== user.id) {
        return createErrorResponse(ERROR_MESSAGES.ACCESS_DENIED, 403, corsHeaders);
      }
      evaluationHasDsdAnalysis = ownerCheck.dsd_analysis != null;
    }

    // Check and consume credits only for the initial DSD call.
    // Skip credit check ONLY when ALL of these are true (server-validated):
    //   1. regenerateSimulationOnly = reusing existing analysis (not a fresh call)
    //   2. evaluationId was provided (we can verify server-side state)
    //   3. The evaluation already has dsd_analysis stored (proves initial call was charged)
    const isFollowUpCall = regenerateSimulationOnly && evaluationId && evaluationHasDsdAnalysis;
    if (!isFollowUpCall) {
      const creditResult = await checkAndUseCredits(supabase, user.id, "dsd_simulation");
      if (!creditResult.allowed) {
        logger.warn(`Insufficient credits for user ${user.id} on dsd_simulation`);
        return createInsufficientCreditsResponse(creditResult, corsHeaders);
      }
      creditsConsumed = true;
    }

    // Log if additional photos or preferences were provided
    if (additionalPhotos) {
      logger.log(`DSD analysis with additional photos: smile45=${!!additionalPhotos.smile45}, face=${!!additionalPhotos.face}`);
    }
    if (patientPreferences) {
      logger.log(`DSD analysis with patient preferences: goals=${!!patientPreferences.aestheticGoals}, changes=${patientPreferences.desiredChanges?.length || 0}`);
    }

    let analysis: DSDAnalysis;

    // If regenerating simulation only, use existing analysis
    if (regenerateSimulationOnly && existingAnalysis) {
      analysis = existingAnalysis;
    } else {
      // Run full analysis - pass additional photos, preferences, clinical observations, and per-tooth findings
      const analysisResult = await analyzeProportions(imageBase64, corsHeaders, additionalPhotos, patientPreferences, clinicalObservations, clinicalTeethFindings);

      // Check if it's an error response — refund credits if analysis failed
      if (analysisResult instanceof Response) {
        if (creditsConsumed) {
          await refundCredits(supabase, user.id, "dsd_simulation");
          logger.log(`Refunded DSD credits for user ${user.id} due to analysis failure`);
        }
        return analysisResult;
      }
      
      analysis = analysisResult;
    }

    // === POST-PROCESSING SAFETY NETS ===

    // Safety net #1: Strip visagismo if no face photo was provided
    // The AI prompt already instructs to skip visagismo without full face,
    // but this ensures it deterministically even if the model ignores the instruction.
    if (!additionalPhotos?.face) {
      // Check if the AI returned any visagismo data (field exists and is set)
      const hadVisagism = analysis.face_shape !== undefined && analysis.face_shape !== null;
      if (hadVisagism) {
        logger.log("Post-processing: resetting visagismo to neutral defaults (no face photo provided)");
        analysis.face_shape = 'oval'; // neutral default
        analysis.perceived_temperament = 'fleumático'; // neutral default
        analysis.recommended_tooth_shape = 'natural';
        analysis.visagism_notes = "Análise de visagismo requer foto da face completa para determinação precisa de formato facial e temperamento.";
        // Replace visagism-specific observations (pattern: "Formato facial: X" or "Temperamento: X")
        analysis.observations = (analysis.observations || []).map(obs => {
          const lower = obs.toLowerCase();
          // Only replace observations that ARE visagismo analysis results
          if (lower.startsWith('formato facial') || lower.startsWith('temperamento percebido') ||
              lower.startsWith('análise de visagismo') || lower.startsWith('visagismo:')) {
            return null; // mark for removal
          }
          return obs;
        }).filter((obs): obs is string => obs !== null);
        analysis.observations.push("Análise de visagismo não realizada — foto da face completa não fornecida.");
      }
    }

    // Safety net #2: Strip gengivoplastia suggestions if smile line is not "alta"
    // Gengivoplastia only makes sense when gingiva is clearly visible (high smile line).
    // For "média" smile line, the AI prompt already instructs conservatism —
    // the post-processing only kicks in as a hard filter for non-alta lines.
    if (analysis.smile_line !== 'alta') {
      const before = analysis.suggestions.length;
      analysis.suggestions = analysis.suggestions.filter(s => {
        // Only filter suggestions that are specifically about gengivoplastia treatment
        const proposed = s.proposed_change.toLowerCase();
        return !proposed.includes('gengivoplastia');
      });
      const removed = before - analysis.suggestions.length;
      if (removed > 0) {
        logger.log(`Post-processing: removed ${removed} gengivoplastia suggestion(s) (smile_line=${analysis.smile_line})`);
      }
    }

    // Safety net #3: Filter gengivoplastia if overbite suspected
    // Deep bite can cause compensatory eruption that mimics gummy smile — gengivoplastia contraindicated
    if (analysis.overbite_suspicion === 'sim') {
      const before = analysis.suggestions.length;
      analysis.suggestions = analysis.suggestions.filter(s => {
        const proposed = s.proposed_change.toLowerCase();
        return !proposed.includes('gengivoplastia');
      });
      const removed = before - analysis.suggestions.length;
      if (removed > 0) {
        logger.log(`Post-processing: removed ${removed} gengivoplastia suggestion(s) (overbite_suspicion=sim)`);
        // Add warning observation if not already present
        const hasWarning = analysis.observations?.some(o => o.toLowerCase().includes('sobremordida'));
        if (!hasWarning) {
          analysis.observations = analysis.observations || [];
          analysis.observations.push('ATENÇÃO: Suspeita de sobremordida profunda — gengivoplastia contraindicada até avaliação ortodôntica.');
        }
      }
    }

    // NEW: If analysisOnly, return immediately without generating simulation
    if (analysisOnly) {
      const destructionCheck = hasSevereDestruction(analysis);
      const result: DSDResult = {
        analysis,
        simulation_url: null,
        simulation_note: destructionCheck.isLimited 
          ? destructionCheck.reason || undefined
          : "Simulação será gerada em segundo plano",
      };
      
      logger.log("Returning analysis only (simulation will be generated in background)");
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for severe destruction that limits simulation value
    const destructionCheck = hasSevereDestruction(analysis);
    let simulationNote: string | undefined;
    
    if (destructionCheck.isLimited) {
      logger.log("Severe destruction detected:", destructionCheck.reason);
      simulationNote = destructionCheck.reason || undefined;
    }

    // Generate simulation image
    let simulationUrl: string | null = null;
    try {
      simulationUrl = await generateSimulation(imageBase64, analysis, user.id, supabase, toothShape || 'natural', patientPreferences, layerType);
    } catch (simError) {
      logger.error("Simulation error:", simError);
      // Continue without simulation - analysis is still valid
    }

    // Update evaluation if provided (ownership already verified above)
    if (evaluationId) {
      const { data: evalData, error: evalError } = await supabase
        .from("evaluations")
        .select("dsd_simulation_layers")
        .eq("id", evaluationId)
        .single();

      if (!evalError && evalData) {
        const updateData: Record<string, unknown> = {
          dsd_analysis: analysis,
          dsd_simulation_url: simulationUrl,
        };

        // When layerType is present, update the layers array
        if (layerType && simulationUrl) {
          const existingLayers = (evalData.dsd_simulation_layers as Array<Record<string, unknown>>) || [];
          const newLayer = {
            type: layerType,
            label: layerType === 'restorations-only' ? 'Apenas Restaurações'
              : layerType === 'complete-treatment' ? 'Tratamento Completo'
              : 'Restaurações + Clareamento',
            simulation_url: simulationUrl,
            whitening_level: patientPreferences?.whiteningLevel || 'natural',
            includes_gengivoplasty: layerType === 'complete-treatment',
          };
          // Replace existing layer of same type or append
          const idx = existingLayers.findIndex((l) => l.type === layerType);
          if (idx >= 0) {
            existingLayers[idx] = newLayer;
          } else {
            existingLayers.push(newLayer);
          }
          updateData.dsd_simulation_layers = existingLayers;
        }

        await supabase
          .from("evaluations")
          .update(updateData)
          .eq("id", evaluationId);
      }
    }

    // Return result with note if applicable
    const result: DSDResult & { layer_type?: string } = {
      analysis,
      simulation_url: simulationUrl,
      simulation_note: simulationNote,
    };
    if (layerType) {
      result.layer_type = layerType;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error(`[${reqId}] DSD generation error:`, error);
    // Refund credits on unexpected errors — user paid but got nothing
    if (creditsConsumed && supabaseForRefund && userIdForRefund) {
      await refundCredits(supabaseForRefund, userIdForRefund, "dsd_simulation");
      logger.log(`[${reqId}] Refunded DSD credits for user ${userIdForRefund} due to error`);
    }
    return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders, undefined, reqId);
  }
});
