import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreFlight, createErrorResponse, ERROR_MESSAGES } from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import {
  callGeminiVisionWithTools,
  callGeminiImageEdit,
  GeminiError,
  type OpenAITool
} from "../_shared/gemini.ts";
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { checkAndUseCredits, createInsufficientCreditsResponse } from "../_shared/credits.ts";
import { getPrompt } from "../_shared/prompts/registry.ts";
import type { Params as DsdAnalysisParams } from "../_shared/prompts/definitions/dsd-analysis.ts";

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
    instruction: "Make ALL visible teeth EXTREMELY WHITE (BL3/0M1). Pure bright white like porcelain veneers. The teeth should appear DRAMATICALLY lighter - almost glowing white. This is the MAXIMUM possible whitening.",
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
  analysisOnly?: boolean; // NEW: Return only analysis, skip simulation
  clinicalObservations?: string[]; // Observations from analyze-dental-photo to prevent contradictions
  clinicalTeethFindings?: ClinicalToothFinding[]; // Per-tooth findings to prevent false restoration claims
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
      analysisOnly: req.analysisOnly === true, // NEW
      clinicalObservations,
      clinicalTeethFindings,
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
  patientPreferences?: PatientPreferences
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
  const textureInstruction = `TEXTURA NATURAL DO ESMALTE (CRÍTICO para realismo):
- Manter/criar PERIQUIMÁCIES (linhas horizontais sutis no esmalte)
- Preservar REFLEXOS DE LUZ naturais nos pontos de brilho
- Criar GRADIENTE DE TRANSLUCIDEZ: opaco cervical → translúcido incisal
- Manter variações sutis de cor entre dentes adjacentes (100% idênticos = artificial)
- Preservar CARACTERIZAÇÕES naturais visíveis (manchas brancas sutis, craze lines)
- NÃO criar aparência de "porcelana perfeita" ou "dentes de comercial de TV"`;
  const wantsWhitening = true; // Always apply whitening (user always selects a level)
  const whiteningIntensity = whiteningConfig.intensity;
  
  // Get visagism data for context-aware simulation
  const faceShape = analysis.face_shape || 'oval';
  const toothShapeRecommendation = analysis.recommended_tooth_shape || toothShape || 'natural';
  const smileArc = analysis.smile_arc || 'consonante';

  // INPAINTING MODE - Technical approach for pixel-perfect preservation
  const absolutePreservation = `🔒 INPAINTING MODE - DENTAL SMILE ENHANCEMENT 🔒

=== IDENTIDADE DO PACIENTE - PRESERVAÇÃO ABSOLUTA ===
Esta é uma foto REAL de um paciente REAL. A identidade facial deve ser 100% preservada.

WORKFLOW OBRIGATÓRIO (seguir exatamente):
1. COPIAR a imagem de entrada INTEIRA como está
2. IDENTIFICAR APENAS a área dos dentes (superfícies de esmalte branco/marfim)
3. MODIFICAR APENAS pixels dentro do limite dos dentes
4. TODOS os pixels FORA do limite dos dentes = CÓPIA EXATA da entrada

⚠️ DEFINIÇÃO DA MÁSCARA (CRÍTICO):
- DENTRO DA MÁSCARA (pode modificar): Superfícies de esmalte dos dentes APENAS
- FORA DA MÁSCARA (copiar exatamente):
  • LÁBIOS: Formato, cor, textura, brilho, rugas, vermillion - INTOCÁVEIS
  • GENGIVA: Cor rosa, contorno, papilas interdentais, zênites gengivais - PRESERVAR
  • PELE: Textura, tom, pelos faciais, barba - IDÊNTICOS
  • FUNDO: Qualquer elemento de fundo - INALTERADO
  • SOMBRAS: Todas as sombras naturais da foto - MANTER

REQUISITO A NÍVEL DE PIXEL:
- Cada pixel dos lábios na saída = EXATAMENTE MESMO valor RGB da entrada
- Cada pixel de gengiva na saída = EXATAMENTE MESMO valor RGB da entrada
- Cada pixel de pele na saída = EXATAMENTE MESMO valor RGB da entrada
- Textura labial, contorno, destaques = IDÊNTICOS à entrada
- NUNCA alterar o formato do rosto ou expressão facial

=== CARACTERÍSTICAS NATURAIS DOS DENTES A PRESERVAR/CRIAR ===
Para resultado REALISTA (não artificial):
1. TEXTURA DE SUPERFÍCIE: Manter/criar micro-textura natural do esmalte (periquimácies)
2. TRANSLUCIDEZ: Terço incisal mais translúcido, terço cervical mais opaco
3. GRADIENTE DE COR: Mais saturado no cervical → menos saturado no incisal
4. MAMELONS: Se visíveis na foto original, PRESERVAR as projeções incisais
5. REFLEXOS DE LUZ: Manter os pontos de brilho naturais nos dentes

Isto é EDIÇÃO de imagem (inpainting), NÃO GERAÇÃO de imagem.
Dimensões de saída DEVEM ser iguais às dimensões de entrada.`;

  // Whitening priority section - FIRST task, direct and emphatic
  const whiteningPrioritySection = wantsWhitening ? `
#1 TASK - WHITENING (${whiteningIntensity}):
${colorInstruction}
${whiteningLevel === 'hollywood' ? '⚠️ HOLLYWOOD = MAXIMUM BRIGHTNESS. Teeth must be DRAMATICALLY WHITE like porcelain veneers.' : ''}

` : '';

  // Visagism context for simulation
  const visagismContext = `
=== CONTEXTO DE VISAGISMO (GUIA ESTÉTICO) ===
Formato facial do paciente: ${faceShape.toUpperCase()}
Formato de dente recomendado: ${toothShapeRecommendation.toUpperCase()}
Arco do sorriso: ${smileArc.toUpperCase()}

REGRAS DE VISAGISMO PARA SIMULAÇÃO:
${toothShapeRecommendation === 'quadrado' ? '- Manter/criar ângulos mais definidos nos incisivos, bordos mais retos' : ''}
${toothShapeRecommendation === 'oval' ? '- Manter/criar contornos arredondados e suaves nos incisivos' : ''}
${toothShapeRecommendation === 'triangular' ? '- Manter proporção mais larga incisal, convergindo para cervical' : ''}
${toothShapeRecommendation === 'retangular' ? '- Manter proporção mais alongada, bordos paralelos' : ''}
${toothShapeRecommendation === 'natural' ? '- PRESERVAR o formato atual dos dentes do paciente' : ''}
${smileArc === 'plano' ? '- Considerar suavizar a curva incisal para acompanhar lábio inferior' : ''}
${smileArc === 'reverso' ? '- ATENÇÃO: Arco reverso precisa de tratamento clínico real' : ''}
`;

  // Quality requirements - compositing + natural appearance
  const qualityRequirements = `
${visagismContext}
VERIFICAÇÃO DE COMPOSIÇÃO:
Pense nisso como camadas do Photoshop:
- Camada inferior: Entrada original (BLOQUEADA, inalterada)
- Camada superior: Suas modificações dos dentes APENAS
- Resultado: Composição onde APENAS os dentes diferem

VALIDAÇÃO DE QUALIDADE:
- Sobrepor saída na entrada → diferença deve aparecer APENAS nos dentes
- Qualquer mudança em lábios, gengiva, pele = FALHA
- Os dentes devem parecer NATURAIS, não artificiais ou "de plástico"
- A textura do esmalte deve ter micro-variações naturais
- O gradiente de cor cervical→incisal deve ser suave e realista
${wantsWhitening ? '- Os dentes devem ser VISIVELMENTE MAIS BRANCOS que a entrada, mas ainda naturais' : ''}`;

  // Base corrections - focused and specific (avoid over-smoothing)
  const baseCorrections = `CORREÇÕES DENTÁRIAS (manter aparência NATURAL):
1. Preencher buracos, lascas ou defeitos visíveis nas bordas dos dentes
2. Remover manchas escuras pontuais (mas manter variação natural de cor)
3. Fechar pequenos espaços adicionando material MÍNIMO nos pontos de contato - NÃO alargando dentes
4. PRESERVAR mamelons se visíveis (projeções naturais da borda incisal)
5. MANTER micro-textura natural do esmalte - NÃO deixar dentes "lisos demais"
6. PRESERVAR translucidez incisal natural - NÃO tornar dentes opacos uniformemente`;
  
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
  
  let simulationPrompt: string;
  
  // Filter out structural changes that would alter tooth dimensions
  const structuralKeywords = [
    'alargar', 'widen', 'larger', 'maior', 'aumentar largura',
    'aumentar volume', 'add volume', 'volume', 'bulk',
    'expandir', 'expand', 'extend', 'estender',
    'reconstruir', 'reconstruct', 'rebuild',
    'mudar formato', 'change shape', 'reshape'
  ];

  const filteredSuggestions = analysis.suggestions?.filter(s => {
    const change = s.proposed_change.toLowerCase();
    const issue = s.current_issue.toLowerCase();
    const isStructural = structuralKeywords.some(kw => 
      change.includes(kw) || issue.includes(kw)
    );
    return !isStructural;
  }) || [];

  const allowedChangesFromAnalysis = filteredSuggestions.length > 0 
    ? `\nSPECIFIC CORRECTIONS FROM ANALYSIS (apply these changes):\n${filteredSuggestions.map(s => 
        `- Tooth ${s.tooth}: ${s.proposed_change}`
      ).join('\n')}`
    : '';
  
  if (needsReconstruction) {
    // RECONSTRUCTION PROMPT
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
    
    const specificInstructions = teethToReconstruct.map(s => {
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

    simulationPrompt = `DENTAL PHOTO EDIT - RECONSTRUCTION${wantsWhitening ? ' + WHITENING' : ''}

${absolutePreservation}

TASK: Edit ONLY the teeth. Everything else must be IDENTICAL to input.
${whiteningPrioritySection}DENTAL CORRECTIONS:
${baseCorrections}
${textureInstruction}

RECONSTRUCTION:
- ${specificInstructions || 'Fill missing teeth using adjacent teeth as reference'}
${allowedChangesFromAnalysis}

PROPORTION RULES:
- Keep original tooth width proportions exactly
- NEVER make teeth appear thinner or narrower than original
- NEVER make teeth appear WIDER or LARGER than original
- DO NOT change the overall tooth silhouette or outline
- Only add material to fill defects - do NOT reshape tooth contours
- Maintain the natural width-to-height ratio of each tooth

${qualityRequirements}

Output: Same photo with ONLY teeth corrected.`;

  } else if (needsRestorationReplacement) {
    simulationPrompt = `DENTAL PHOTO EDIT - RESTORATION${wantsWhitening ? ' + WHITENING' : ''}

${absolutePreservation}

TASK: Edit ONLY the teeth. Everything else must be IDENTICAL to input.
${whiteningPrioritySection}DENTAL CORRECTIONS:
${baseCorrections}
${textureInstruction}

RESTORATION FOCUS:
- Blend interface lines on teeth ${restorationTeeth || '11, 21'}
${allowedChangesFromAnalysis}

PROPORTION RULES:
- Keep original tooth width proportions exactly
- NEVER make teeth appear thinner or narrower than original
- NEVER make teeth appear WIDER or LARGER than original
- DO NOT change the overall tooth silhouette or outline
- Only add material to fill defects - do NOT reshape tooth contours
- Maintain the natural width-to-height ratio of each tooth

${qualityRequirements}

Output: Same photo with ONLY teeth corrected.`;

  } else if (isIntraoralPhoto) {
    simulationPrompt = `DENTAL PHOTO EDIT - INTRAORAL${wantsWhitening ? ' + WHITENING' : ''}

⚠️ ABSOLUTE RULES - VIOLATION = FAILURE ⚠️

DO NOT CHANGE (pixel-perfect preservation REQUIRED):
- GUMS: Level, color, shape EXACTLY as input
- ALL OTHER TISSUES: Exactly as input
- IMAGE SIZE: Exact same dimensions and framing

Only TEETH may be modified.

TASK: Edit ONLY the teeth. Everything else must be IDENTICAL to input.
${whiteningPrioritySection}DENTAL CORRECTIONS:
${baseCorrections}
${textureInstruction}
${allowedChangesFromAnalysis}

PROPORTION RULES:
- Keep original tooth width proportions exactly
- NEVER make teeth appear thinner or narrower than original
- NEVER make teeth appear WIDER or LARGER than original
- DO NOT change the overall tooth silhouette or outline
- Only add material to fill defects - do NOT reshape tooth contours
- Maintain the natural width-to-height ratio of each tooth

${qualityRequirements}

Output: Same photo with ONLY teeth corrected.`;

  } else {
    // STANDARD PROMPT - Focused corrections with texture preservation
    simulationPrompt = `DENTAL PHOTO EDIT${wantsWhitening ? ' - WHITENING REQUESTED' : ''}

${absolutePreservation}

TASK: Edit ONLY the teeth. Everything else must be IDENTICAL to input.
${whiteningPrioritySection}DENTAL CORRECTIONS:
${baseCorrections}
${textureInstruction}
${allowedChangesFromAnalysis}

PROPORTION RULES:
- Keep original tooth width proportions exactly
- NEVER make teeth appear thinner or narrower than original
- NEVER make teeth appear WIDER or LARGER than original
- DO NOT change the overall tooth silhouette or outline
- Only add material to fill defects - do NOT reshape tooth contours
- Maintain the natural width-to-height ratio of each tooth

${qualityRequirements}

Output: Same photo with ONLY teeth corrected.`;
  }

  const promptType = needsReconstruction ? 'reconstruction' : 
                     (needsRestorationReplacement ? 'restoration-replacement' : 
                     (isIntraoralPhoto ? 'intraoral' : 'standard'));
  
  logger.log("DSD Simulation Request:", {
    promptType,
    approach: "absolutePreservation + whiteningPriority",
    wantsWhitening,
    whiteningIntensity: wantsWhitening ? whiteningIntensity : 'none',
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

  try {
    logger.log("Calling Gemini Image Edit for simulation...");

    const result = await callGeminiImageEdit(
      simulationPrompt,
      inputBase64Data,
      inputMimeType,
      {
        temperature: 0.4,
        timeoutMs: SIMULATION_TIMEOUT,
      }
    );

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

  // Build patient preferences context
  let preferencesContext = '';
  if (patientPreferences?.aestheticGoals || patientPreferences?.desiredChanges?.length) {
    preferencesContext = `

PREFERÊNCIAS DO PACIENTE:
O paciente expressou os seguintes desejos estéticos. PRIORIZE sugestões que atendam a estes objetivos quando clinicamente viável:
`;
    if (patientPreferences.aestheticGoals) {
      preferencesContext += `Objetivos descritos pelo paciente: "${patientPreferences.aestheticGoals}"
`;
    }
    if (patientPreferences.desiredChanges?.length) {
      preferencesContext += `Mudanças desejadas: ${patientPreferences.desiredChanges.join(', ')}
`;
    }
    preferencesContext += `
IMPORTANTE: Use as preferências do paciente para PRIORIZAR sugestões, mas NÃO sugira tratamentos clinicamente inadequados apenas para atender desejos. Sempre mantenha o foco em resultados conservadores e naturais.`;
  }

  // Build clinical context from prior analysis to prevent contradictions
  let clinicalContext = '';
  if (clinicalObservations?.length || clinicalTeethFindings?.length) {
    clinicalContext = `

=== ANÁLISE CLÍNICA PRÉVIA (RESPEITAR OBRIGATORIAMENTE) ===
A análise clínica inicial já foi realizada sobre esta mesma foto por outro modelo de IA.
Você DEVE manter CONSISTÊNCIA com os achados clínicos abaixo.
`;
    if (clinicalObservations?.length) {
      clinicalContext += `
Observações clínicas prévias:
${clinicalObservations.map(o => `- ${o}`).join('\n')}

REGRA: Sua classificação de arco do sorriso, corredor bucal e desgaste incisal DEVE ser
CONSISTENTE com as observações acima. Se houver discordância, justifique nas observations.
`;
    }
    if (clinicalTeethFindings?.length) {
      clinicalContext += `
Achados clínicos POR DENTE (diagnóstico já realizado):
${clinicalTeethFindings.map(f => `- Dente ${f.tooth}: ${f.indication_reason || 'sem observação específica'} (indicação: ${f.treatment_indication || 'não definida'})`).join('\n')}

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

  try {
    const result = await callGeminiVisionWithTools(
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
      analysisOnly, // NEW
      clinicalObservations,
      clinicalTeethFindings,
    } = validation.data;

    // Check and consume credits only for the initial DSD call (not regeneration)
    // regenerateSimulationOnly = phase 2 of same DSD, already charged
    if (!regenerateSimulationOnly) {
      const creditResult = await checkAndUseCredits(supabase, user.id, "dsd_simulation");
      if (!creditResult.allowed) {
        logger.warn(`Insufficient credits for user ${user.id} on dsd_simulation`);
        return createInsufficientCreditsResponse(creditResult, corsHeaders);
      }
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
      
      // Check if it's an error response
      if (analysisResult instanceof Response) {
        return analysisResult;
      }
      
      analysis = analysisResult;
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
      simulationUrl = await generateSimulation(imageBase64, analysis, user.id, supabase, toothShape || 'natural', patientPreferences);
    } catch (simError) {
      logger.error("Simulation error:", simError);
      // Continue without simulation - analysis is still valid
    }

    // Update evaluation if provided
    if (evaluationId) {
      const { data: evalData, error: evalError } = await supabase
        .from("evaluations")
        .select("user_id")
        .eq("id", evaluationId)
        .single();

      if (!evalError && evalData && evalData.user_id === user.id) {
        await supabase
          .from("evaluations")
          .update({
            dsd_analysis: analysis,
            dsd_simulation_url: simulationUrl,
          })
          .eq("id", evaluationId);
      }
    }

    // Return result with note if applicable
    const result: DSDResult = {
      analysis,
      simulation_url: simulationUrl,
      simulation_note: simulationNote,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error("DSD generation error:", error);
    return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
  }
});
