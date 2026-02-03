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

interface RequestData {
  imageBase64: string;
  evaluationId?: string;
  regenerateSimulationOnly?: boolean;
  existingAnalysis?: DSDAnalysis;
  toothShape?: 'natural' | 'quadrado' | 'triangular' | 'oval' | 'retangular';
  additionalPhotos?: AdditionalPhotos;
  patientPreferences?: PatientPreferences;
  analysisOnly?: boolean; // NEW: Return only analysis, skip simulation
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
  patientPreferences?: PatientPreferences
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

  const analysisPrompt = `Você é um especialista em Digital Smile Design (DSD), Visagismo e Odontologia Estética com mais de 20 anos de experiência em planejamento de sorrisos naturais e personalizados.

Analise esta foto de sorriso/face do paciente e forneça uma análise COMPLETA das proporções faciais e dentárias, aplicando princípios de VISAGISMO para criar um sorriso PERSONALIZADO ao paciente.
${additionalContext}${preferencesContext}

=== PRINCÍPIOS DE VISAGISMO (APLICAR OBRIGATORIAMENTE) ===

O VISAGISMO é a arte de criar uma imagem pessoal que expressa a identidade do indivíduo. Na odontologia, significa criar sorrisos que harmonizam com a personalidade e características faciais do paciente.

ANÁLISE DO FORMATO FACIAL (identifique o predominante):
- OVAL: Face equilibrada, testa ligeiramente mais larga que o queixo → Dentes ovais com contornos suaves
- QUADRADO: Mandíbula marcada, ângulos definidos → Dentes mais retangulares com ângulos
- TRIANGULAR: Testa larga, queixo fino → Dentes triangulares com bordos mais estreitos cervicalmente
- RETANGULAR/LONGO: Face alongada → Dentes mais largos para compensar verticalmente
- REDONDO: Bochechas proeminentes, contornos suaves → Dentes ovais com incisal levemente plano

ANÁLISE DE TEMPERAMENTO PERCEBIDO (baseado em características faciais):
- COLÉRICO (forte/dominante): Linhas retas, ângulos marcados → Incisivos centrais dominantes, bordos retos
- SANGUÍNEO (extrovertido/alegre): Curvas suaves, simetria → Dentes arredondados, sorriso amplo
- MELANCÓLICO (sensível/refinado): Linhas delicadas, assimetria sutil → Dentes com detalhes finos, caracterizações
- FLEUMÁTICO (calmo/sereno): Formas equilibradas → Proporções clássicas, harmonia

CORRELAÇÃO OBRIGATÓRIA:
O formato do dente deve HARMONIZAR com o formato facial e temperamento percebido:
- Paciente com rosto quadrado + expressão forte → NÃO recomendar dentes ovais delicados
- Paciente com rosto oval + expressão suave → NÃO recomendar dentes quadrados angulosos

=== ANÁLISE DO ARCO DO SORRISO (SMILE ARC) ===

A CURVA INCISAL dos dentes anteriores deve seguir o CONTORNO DO LÁBIO INFERIOR durante o sorriso natural:
- CONSONANTE (ideal): Bordos incisais acompanham a curvatura do lábio inferior
- PLANO: Bordos incisais formam linha reta (menos estético, aparência mais "velha")
- REVERSO: Bordos incisais côncavos em relação ao lábio (problema estético sério)

Avalie e DOCUMENTE o tipo de arco do sorriso atual e se ele precisa de correção.

=== ANÁLISE LABIAL (CRÍTICA PARA SIMULAÇÃO REALISTA) ===

1. **Linha do Sorriso em Relação ao Lábio Superior**:
   - Alta (>3mm de gengiva): Considerar gengivoplastia ou não alongar dentes demais
   - Média (0-3mm): Ideal para facetas
   - Baixa (dentes parcialmente cobertos): Alongamento incisal pode melhorar

2. **Espessura Labial**:
   - Lábios finos: Dentes mais proeminentes parecem excessivos
   - Lábios grossos: Suportam dentes com mais volume vestibular

3. **Vermillion (linha demarcatória do lábio)**:
   - Observar e preservar na simulação

=== CARACTERÍSTICAS DENTÁRIAS NATURAIS A PRESERVAR/CRIAR ===

Para um resultado REALISTA e NATURAL, considere:
1. **Mamelons**: Projeções incisais (mais visíveis em jovens)
2. **Translucidez Incisal**: Terço incisal mais translúcido que cervical
3. **Gradiente de Cor**: Mais saturado cervical → menos saturado incisal
4. **Textura de Superfície**: Periquimácies, linhas de desenvolvimento
5. **Caracterizações**: Manchas brancas sutis, trincas de esmalte (em dentes naturais)

=== ANÁLISE OBRIGATÓRIA (TÉCNICA) ===
1. **Linha Média Facial**: Determine se a linha média facial está centrada ou desviada
2. **Linha Média Dental**: Avalie se os incisivos centrais superiores estão alinhados com a linha média facial
3. **Linha do Sorriso**: Classifique a exposição gengival (alta, média, baixa)
4. **Corredor Bucal**: Avalie se há espaço escuro excessivo nas laterais do sorriso
5. **Plano Oclusal**: Verifique se está nivelado ou inclinado
6. **Proporção Dourada**: Calcule a conformidade com a proporção dourada (0-100%)
7. **Simetria**: Avalie a simetria do sorriso (0-100%)

=== DETECÇÃO ULTRA-CONSERVADORA DE RESTAURAÇÕES ===
CRITÉRIOS OBRIGATÓRIOS para diagnosticar restauração existente:
✅ Diferença de COR clara e inequívoca (não apenas iluminação)
✅ Interface/margem CLARAMENTE VISÍVEL entre material e dente natural
✅ Textura ou reflexo de luz DIFERENTE do esmalte adjacente
✅ Forma anatômica ALTERADA (perda de caracterização natural)

❌ NÃO diagnosticar restauração baseado apenas em:
❌ Bordos incisais translúcidos (característica NATURAL)
❌ Manchas de esmalte sem interface visível
❌ Variação sutil de cor (pode ser calcificação, fluorose ou iluminação)
❌ Desgaste incisal leve

❌ NÃO confunda sombra/iluminação com interface de restauração
❌ NUNCA diga "Substituir restauração" se não houver PROVA VISUAL INEQUÍVOCA de restauração anterior
❌ É preferível NÃO MENCIONAR uma restauração existente do que INVENTAR uma inexistente

=== AVALIAÇÃO GENGIVAL - SAÚDE vs ESTÉTICA (IMPORTANTE!) ===

⚠️ DISTINGUIR DOIS CONCEITOS DIFERENTES:

1. **SAÚDE GENGIVAL** (ausência de doença):
   - Cor rosa saudável (sem vermelhidão)
   - Sem sangramento ou inflamação
   - Papilas íntegras
   - Contorno firme
   → Se saudável, mencione: "Saúde gengival adequada"

2. **ESTÉTICA GENGIVAL** (proporções e exposição):
   - Quantidade de gengiva exposta ao sorrir
   - Simetria dos zênites gengivais
   - Proporção coroa clínica (altura visível dos dentes)
   → Avalie INDEPENDENTEMENTE da saúde

=== REGRAS PARA GENGIVOPLASTIA ===

A gengiva pode estar SAUDÁVEL mas ainda ter indicação de gengivoplastia ESTÉTICA.

✅ INDIQUE gengivoplastia se QUALQUER um destes estiver presente:
- Linha do sorriso ALTA (>3mm de exposição gengival acima dos incisivos)
- Zênites gengivais ASSIMÉTRICOS entre dentes homólogos
- Dentes parecem "curtos" - proporção largura/altura > 85%
- Sorriso gengival que prejudica a estética

❌ NÃO indique gengivoplastia apenas se:
- Linha do sorriso "média" ou "baixa" E
- Zênites simétricos E
- Proporção largura/altura normal (75-80%)

IMPORTANTE: Mesmo com "saúde gengival excelente", se houver exposição >3mm,
MENCIONE nas observações: "Considerar gengivoplastia estética para otimizar proporções"

=== AVALIAÇÃO COMPLETA DO ARCO DO SORRISO ===
Quando identificar necessidade de tratamento em incisivos (11, 12, 21, 22), AVALIAÇÃO OBRIGATÓRIA:

1. CANINOS (13, 23) - SEMPRE avaliar:
   - Corredor bucal excessivo (espaço escuro lateral)? → Considerar volume vestibular
   - Proeminência adequada para suporte do arco? → Avaliar harmonização

2. PRÉ-MOLARES (14, 15, 24, 25) - Avaliar se visíveis:
   - Visíveis ao sorrir? → Avaliar integração no arco
   - Corredor escuro lateral extenso? → Considerar adição de volume

REGRA: Se ≥4 dentes anteriores precisam de intervenção, SEMPRE avalie os 6-8 dentes visíveis no arco.
Inclua caninos/pré-molares com prioridade "baixa" se a melhoria for apenas para harmonização estética.

=== AVALIAÇÃO DE VIABILIDADE DO DSD ===
Antes de sugerir tratamentos, avalie se o caso É ADEQUADO para simulação visual:

CASOS INADEQUADOS PARA DSD (marque confidence = "baixa" e adicione observação):
- Dentes ausentes que requerem implante → Adicione: "ATENÇÃO: Dente(s) ausente(s) detectado(s). Caso requer tratamento cirúrgico antes do planejamento estético."
- Destruição coronária > 50% que requer coroa/extração → Adicione: "ATENÇÃO: Destruição dental severa. Recomenda-se tratamento protético prévio."
- Raízes residuais → Adicione: "ATENÇÃO: Raiz residual identificada. Extração necessária antes do planejamento."
- Foto INTRAORAL VERDADEIRA (com afastador de lábio, APENAS gengiva e dentes internos visíveis, SEM lábios externos) → Adicione: "ATENÇÃO: Foto intraoral com afastador detectada. Simulação limitada sem proporções faciais."

DEFINIÇÃO DE TIPOS DE FOTO - IMPORTANTE:
- FOTO INTRAORAL: Close-up INTERNO da boca (afastador de lábio presente, apenas gengiva/dentes visíveis, SEM lábios externos)
- FOTO DE SORRISO: Qualquer foto que mostre os LÁBIOS (superior e inferior), mesmo sem olhos/nariz visíveis - É ADEQUADA para DSD
- FOTO FACIAL COMPLETA: Face inteira com olhos, nariz, boca visíveis

REGRA CRÍTICA:
Se a foto mostra LÁBIOS (superior e inferior), barba/pele perioral, e dentes durante o sorriso → NÃO é intraoral!
Foto de sorriso parcial (com lábios visíveis, sem olhos) ainda é ADEQUADA para análise DSD.
Use confidence="média" ou "alta" para fotos de sorriso com lábios.
APENAS use confidence="baixa" por tipo de foto se for uma foto INTRAORAL VERDADEIRA (com afastador, sem lábios externos).

=== SUGESTÕES - PRIORIDADE DE TRATAMENTOS ===
PRIORIDADE 1: Restaurações com infiltração/manchamento EVIDENTE (saúde bucal)
PRIORIDADE 2: Restaurações com cor/anatomia inadequada ÓBVIA (estética funcional)
PRIORIDADE 3: Melhorias em dentes naturais (refinamento estético)

=== INDICAÇÃO DE TRATAMENTO POR SUGESTÃO (OBRIGATÓRIO) ===
Para CADA sugestão, você DEVE indicar o tipo de tratamento:

- "resina": Restauração direta, fechamento de diastema pequeno (até 2mm), correção pontual
- "porcelana": Faceta/laminado cerâmico para 3+ dentes anteriores, harmonização extensa, clareamento extremo
- "coroa": Destruição >60% da estrutura, pós-tratamento de canal em posteriores
- "implante": Dente ausente, raiz residual, necessidade de extração
- "endodontia": Escurecimento por necrose, lesão periapical, exposição pulpar
- "encaminhamento": Ortodontia, periodontia avançada, cirurgia

REGRA CRÍTICA:
- Se 4+ dentes anteriores precisam de harmonização estética → "porcelana" para todos
- Se 1-2 dentes precisam de correção pontual → "resina"
- Se dente está ausente ou precisa ser extraído → "implante"
- Se dente está escurecido por necrose → "endodontia" primeiro

⚠️ IMPORTANTE - DENTES QUE NÃO PRECISAM DE TRATAMENTO:
- NÃO inclua nas sugestões dentes que estão PERFEITOS ou serão usados como REFERÊNCIA
- Se um dente está com "excelente estética natural" → NÃO adicione nas sugestões
- Se um dente será usado como "guia" ou "referência" → NÃO adicione nas sugestões
- APENAS inclua dentes que REALMENTE precisam de intervenção
- A lista de sugestões deve conter APENAS dentes que receberão tratamento

TIPOS DE SUGESTÕES PERMITIDAS:

A) SUBSTITUIÇÃO DE RESTAURAÇÃO (prioridade alta) - APENAS com evidência clara:
   - current_issue: "Restauração classe IV com manchamento marginal EVIDENTE e interface CLARAMENTE visível"
   - proposed_change: "Substituir por nova restauração com melhor adaptação de cor e contorno"

B) TRATAMENTO CONSERVADOR (para dentes naturais sem restauração):
   - current_issue: "Bordo incisal irregular"
   - proposed_change: "Aumentar 1mm com lente de contato"

C) HARMONIZAÇÃO DE ARCO (incluir dentes adjacentes):
   - current_issue: "Corredor bucal excessivo - canino com volume reduzido"
   - proposed_change: "Adicionar faceta para preencher corredor bucal"

=== IDENTIFICAÇÃO PRECISA DE DENTES (OBRIGATÓRIO) ===
ANTES de listar sugestões, identifique CADA dente CORRETAMENTE:

CRITÉRIOS DE IDENTIFICAÇÃO FDI - MEMORIZE:
- CENTRAIS (11, 21): MAIORES, mais LARGOS, bordos mais RETOS
- LATERAIS (12, 22): MENORES (~20-30% mais estreitos), contorno mais ARREDONDADO/OVAL
- CANINOS (13, 23): PONTIAGUDOS, proeminência vestibular
- PRÉ-MOLARES (14, 15, 24, 25): Duas cúspides, visíveis em sorrisos amplos

ERRO COMUM A EVITAR:
Se detectar 2 dentes com restauração lado a lado, pergunte-se:
- São dois CENTRAIS (11 e 21)? → Estão um de cada lado da linha média
- São CENTRAL + LATERAL (11 e 12)? → Estão do MESMO lado, lateral é MENOR

DICA VISUAL: O lateral é visivelmente MAIS ESTREITO que o central ao lado.
Se dois dentes têm o MESMO tamanho = provavelmente são os dois centrais.
Se um é claramente MENOR = é o lateral.

LIMITES PARA SUGESTÕES:
- MÁXIMO de 1-2mm de extensão incisal por dente
- Fechamento de diastemas de até 2mm por lado
- Harmonização SUTIL de contorno (não transformações)
- NÃO sugira clareamento extremo ou cor artificial

✅ OBRIGATÓRIO: Listar TODOS os dentes que precisam de intervenção (mesmo 6-8 dentes)
   - Se o paciente tem múltiplos dentes com problemas, liste TODOS
   - Ordene por prioridade: problemas de saúde > estética funcional > refinamento
   - O dentista precisa ver o escopo COMPLETO para planejar orçamento
   - Se 4 dentes anteriores precisam de tratamento, AVALIE também caninos e pré-molares

REGRAS ESTRITAS:
✅ PERMITIDO: identificar e sugerir substituição de restaurações com EVIDÊNCIA CLARA
✅ PERMITIDO: aumentar levemente comprimento, fechar pequenos espaços, harmonizar contorno
✅ PERMITIDO: incluir caninos/pré-molares para harmonização completa do arco
❌ PROIBIDO: inventar restaurações sem prova visual inequívoca
❌ PROIBIDO: sugerir gengivoplastia sem sorriso gengival evidente
❌ PROIBIDO: dizer "excelente resultado" se problemas estéticos óbvios estão presentes
❌ PROIBIDO: focar apenas em 4 dentes quando o arco completo precisa de harmonização
❌ PROIBIDO: diminuir, encurtar, mudanças dramáticas de forma
❌ PROIBIDO: sugerir "dentes brancos Hollywood" ou cor artificial

Exemplo BOM (substituição com evidência): "Restauração classe IV do 11 com interface CLARAMENTE visível e manchamento marginal" → "Substituir por nova restauração"
Exemplo BOM (conservador): "Aumentar bordo incisal do 21 em 1mm para harmonizar altura com 11"
Exemplo BOM (arco completo): Listar 11, 12, 13, 21, 22, 23 quando todos precisam de harmonização
Exemplo RUIM: "Substituir restauração" sem evidência visual clara - NÃO USAR
Exemplo RUIM: Listar apenas 4 dentes quando caninos também precisam de volume - INCOMPLETO

FILOSOFIA: Seja conservador na detecção de restaurações, mas completo na avaliação do arco do sorriso.

=== RECOMENDAÇÃO DE FORMATO DENTÁRIO (OBRIGATÓRIO) ===

Com base na análise de visagismo (formato facial + temperamento), RECOMENDE o formato ideal para os incisivos centrais:
- "quadrado": Ângulos definidos, bordos retos
- "oval": Contornos arredondados, suaves
- "triangular": Convergência cervical, mais largo incisal
- "retangular": Mais alto que largo, paralelo
- "natural": Manter características atuais do paciente

Justifique a recomendação baseada no formato facial e temperamento identificados.

OBSERVAÇÕES:
Inclua 3-5 observações clínicas objetivas sobre o sorriso, INCLUINDO:
- Formato facial identificado
- Temperamento percebido
- Tipo de arco do sorriso (consonante/plano/reverso)
- Qualquer desarmonia visagismo

Se identificar limitações para simulação, inclua uma observação com "ATENÇÃO:" explicando.

IMPORTANTE:
- APLIQUE os princípios de visagismo na análise
- Seja CONSERVADOR ao diagnosticar restaurações existentes
- Seja COMPLETO ao avaliar o arco do sorriso (inclua todos os dentes visíveis)
- TODAS as sugestões devem ser clinicamente realizáveis
- Considere a PERSONALIDADE percebida ao sugerir mudanças
- Se o caso NÃO for adequado para DSD, AINDA forneça a análise de proporções mas marque confidence="baixa"`;

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
                  tooth: { type: "string", description: "Número do dente (notação FDI)" },
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

    // Parse and validate request body
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
      analysisOnly // NEW
    } = validation.data;

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
      // Run full analysis - pass additional photos and preferences for context enrichment
      const analysisResult = await analyzeProportions(imageBase64, corsHeaders, additionalPhotos, patientPreferences);
      
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
