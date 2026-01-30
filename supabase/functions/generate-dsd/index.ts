import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreFlight, createErrorResponse, ERROR_MESSAGES } from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";

// Prevent indefinite hangs on external calls (AI gateway / storage downloads)
async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number,
  label: string
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (err) {
    logger.warn(`${label} request failed`, err);
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

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
  }[];
  observations: string[];
  confidence: "alta" | "média" | "baixa";
  simulation_limitation?: string;
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
  aestheticGoals?: string;
  desiredChanges?: string[];
}

// AI-analyzed patient preferences for simulation prompts
interface AnalyzedPreferences {
  whiteningLevel: 'none' | 'natural' | 'intense';
  colorInstruction: string;
  textureInstruction: string;
  styleNotes: string;
  sensitivityNote: string | null;
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
    patientPreferences = {
      aestheticGoals: typeof prefs.aestheticGoals === 'string' ? prefs.aestheticGoals : undefined,
      desiredChanges: Array.isArray(prefs.desiredChanges) ? prefs.desiredChanges : undefined,
    };
    if (!patientPreferences.aestheticGoals && !patientPreferences.desiredChanges?.length) {
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

// Analyze patient preferences with Gemini Flash for structured instructions
async function analyzePatientPreferences(
  aestheticGoals: string,
  apiKey: string
): Promise<AnalyzedPreferences> {
  const ANALYSIS_TIMEOUT = 8_000; // 8s max for fast analysis
  
  const systemPrompt = `Você é um especialista em odontologia estética.
Analise o texto do paciente e extraia preferências para uma simulação de sorriso.

REGRAS DE ANÁLISE:

1. whiteningLevel (nível de clareamento desejado):
   - "intense" se menciona: hollywood, bem branco, muito branco, bleach, BL, super branco, celebridade
   - "natural" se menciona: branco, claro, clarear, mais claro, branquinho (sem intensificador forte)
   - "none" se não menciona clareamento ou cor

2. colorInstruction (instrução ESPECÍFICA para o prompt de imagem):
   - Para intense: "Change ALL visible teeth (including adjacent) to bright white/bleach BL2/BL3 shade. Uniform bright appearance across entire visible dentition."
   - Para natural: "Change ALL visible teeth to natural white A1/A2 shade (1-2 shades lighter than original). Maintain subtle natural color variations between teeth."
   - Para none: "Keep original tooth color. Only remove surface stains if visible."

3. textureInstruction (instrução de textura baseada no estilo):
   - Se menciona "natural", "discreto", "não artificial": "Preserve natural enamel texture, translucency, and micro-surface details. Avoid over-smoothing."
   - Se menciona "perfeito", "uniforme", "liso": "Slight smoothing allowed, maintain realistic enamel appearance."
   - Padrão: "Maintain natural tooth texture and surface characteristics."

4. styleNotes (notas adicionais para o prompt):
   - Extraia quaisquer preferências específicas mencionadas
   - Exemplos: "Patient wants younger appearance", "Avoid artificial Hollywood look", "Prefer subtle changes"

5. sensitivityNote:
   - Se menciona sensibilidade, sensível, dor, desconforto: "Patient reports tooth sensitivity - note for clinical planning"
   - Senão: null`;

  try {
    const response = await fetchWithTimeout(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analise o seguinte texto do paciente e extraia as preferências estéticas:\n\n"${aestheticGoals}"` },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_preferences",
                description: "Extrai preferências estéticas estruturadas do texto do paciente",
                parameters: {
                  type: "object",
                  properties: {
                    whiteningLevel: {
                      type: "string",
                      enum: ["none", "natural", "intense"],
                      description: "Nível de clareamento desejado"
                    },
                    colorInstruction: {
                      type: "string",
                      description: "Instrução específica de cor para o prompt de simulação (em inglês)"
                    },
                    textureInstruction: {
                      type: "string",
                      description: "Instrução de textura para o prompt de simulação (em inglês)"
                    },
                    styleNotes: {
                      type: "string",
                      description: "Notas adicionais de estilo extraídas do texto do paciente (em inglês)"
                    },
                    sensitivityNote: {
                      type: "string",
                      nullable: true,
                      description: "Nota sobre sensibilidade se mencionada, ou null"
                    }
                  },
                  required: ["whiteningLevel", "colorInstruction", "textureInstruction", "styleNotes"]
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "extract_preferences" } }
        }),
      },
      ANALYSIS_TIMEOUT,
      "analyzePatientPreferences"
    );

    if (!response.ok) {
      logger.warn("Preference analysis request failed:", response.status);
      throw new Error(`Analysis request failed: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      logger.warn("No tool call in preference analysis response");
      throw new Error("No tool call response");
    }

    const args = JSON.parse(toolCall.function.arguments);
    
    return {
      whiteningLevel: args.whiteningLevel || 'none',
      colorInstruction: args.colorInstruction || 'Keep original tooth color. Only remove surface stains if visible.',
      textureInstruction: args.textureInstruction || 'Maintain natural tooth texture and surface characteristics.',
      styleNotes: args.styleNotes || '',
      sensitivityNote: args.sensitivityNote || null
    };
  } catch (err) {
    logger.warn("Failed to analyze patient preferences:", err);
    // Return sensible defaults on error
    return {
      whiteningLevel: 'none',
      colorInstruction: 'Keep original tooth color. Only remove surface stains if visible.',
      textureInstruction: 'Maintain natural tooth texture and surface characteristics.',
      styleNotes: '',
      sensitivityNote: null
    };
  }
}

// SIMPLIFIED: Generate simulation image - single attempt, no blend, no verification
async function generateSimulation(
  imageBase64: string,
  analysis: DSDAnalysis,
  userId: string,
  supabase: any,
  apiKey: string,
  toothShape: string = 'natural',
  patientPreferences?: PatientPreferences
): Promise<string | null> {
  const SIMULATION_TIMEOUT = 50_000; // 50s max
  const shapeInstruction = toothShapeDescriptions[toothShape] || toothShapeDescriptions.natural;
  
  // Analyze patient preferences with Gemini Flash (fast ~2s)
  let analyzedPrefs: AnalyzedPreferences | null = null;
  if (patientPreferences?.aestheticGoals) {
    try {
      analyzedPrefs = await analyzePatientPreferences(
        patientPreferences.aestheticGoals, 
        apiKey
      );
      logger.log("Patient preferences analyzed:", {
        whiteningLevel: analyzedPrefs.whiteningLevel,
        hasStyleNotes: !!analyzedPrefs.styleNotes,
        sensitivityNote: !!analyzedPrefs.sensitivityNote
      });
    } catch (err) {
      logger.warn("Failed to analyze preferences, using defaults:", err);
    }
  }

  // Fallback for legacy format or if analysis failed
  const legacyWantsWhiter = patientPreferences?.desiredChanges?.includes('whiter');

  // Build dynamic instructions from AI analysis or fallback
  const colorInstruction = analyzedPrefs?.colorInstruction 
    ? `- ${analyzedPrefs.colorInstruction}`
    : (legacyWantsWhiter 
        ? '- Change ALL visible teeth to natural white A1/A2 shade (1-2 shades lighter)' 
        : '- Keep original tooth color (remove stains only)');

  const textureInstruction = analyzedPrefs?.textureInstruction
    ? `- ${analyzedPrefs.textureInstruction}`
    : '- Maintain natural enamel texture and surface details';

  const styleContext = analyzedPrefs?.styleNotes
    ? `\nPATIENT STYLE PREFERENCE: ${analyzedPrefs.styleNotes}`
    : '';
  
  // Determine if whitening was requested
  const wantsWhitening = analyzedPrefs?.whiteningLevel !== 'none' || legacyWantsWhiter;
  const whiteningIntensity = analyzedPrefs?.whiteningLevel === 'intense' ? 'INTENSE' : 'NATURAL';
  
  // ABSOLUTE PRESERVATION RULES - Must be at TOP of every prompt
  const absolutePreservation = `⚠️ ABSOLUTE RULES - VIOLATION = FAILURE ⚠️

DO NOT CHANGE (pixel-perfect preservation REQUIRED):
- LIPS: Shape, color, texture, position, contour EXACTLY as input
- GUMS: Level, color, shape EXACTLY as input  
- SKIN: All facial skin EXACTLY as input
- BACKGROUND: All non-dental areas EXACTLY as input
- IMAGE SIZE: Exact same dimensions and framing

If ANY of these elements differ from input, the output is REJECTED.
Only TEETH may be modified.`;

  // Whitening priority section (if requested)
  const whiteningPrioritySection = wantsWhitening ? `
#1 PRIORITY - WHITENING (${whiteningIntensity}) - NON-NEGOTIABLE:
${colorInstruction}

⚠️ CRITICAL VERIFICATION:
- In the output, teeth MUST be CLEARLY and VISIBLY LIGHTER than input
- The before/after comparison must show OBVIOUS whitening
- If teeth look the same color as input, you have FAILED the PRIMARY task
- This is the MOST IMPORTANT change to apply

` : '';

  // Quality requirements section for consistent output
  const qualityRequirements = `
FINAL VERIFICATION CHECKLIST:
[✓] Lips IDENTICAL to input? REQUIRED
[✓] Gums IDENTICAL to input? REQUIRED
[✓] Skin IDENTICAL to input? REQUIRED
[✓] Background IDENTICAL to input? REQUIRED
${wantsWhitening ? '[✓] Teeth VISIBLY WHITER than input? REQUIRED' : '[✓] Tooth color natural and consistent? REQUIRED'}
[✓] Tooth proportions maintained (not thinner)? REQUIRED

If any check fails, regenerate.`;

  // Base corrections - focused and specific (avoid over-smoothing)
  const baseCorrections = `1. Fill visible holes, chips or defects on tooth edges
2. Remove dark stain spots  
3. Close small gaps between teeth (up to 2mm)`;
  
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
  
  // Build allowed changes from analysis suggestions
  const allowedChangesFromAnalysis = analysis.suggestions?.length > 0 
    ? `\nSPECIFIC CORRECTIONS FROM ANALYSIS (apply these changes):\n${analysis.suggestions.map(s => 
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
${allowedChangesFromAnalysis}${styleContext}

PROPORTION RULES:
- Keep original tooth width proportions exactly
- NEVER make teeth appear thinner or narrower than original
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
${allowedChangesFromAnalysis}${styleContext}

PROPORTION RULES:
- Keep original tooth width proportions exactly
- NEVER make teeth appear thinner or narrower than original
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
${allowedChangesFromAnalysis}${styleContext}

PROPORTION RULES:
- Keep original tooth width proportions exactly
- NEVER make teeth appear thinner or narrower than original
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
${allowedChangesFromAnalysis}${styleContext}

PROPORTION RULES:
- Keep original tooth width proportions exactly
- NEVER make teeth appear thinner or narrower than original
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
    whiteningLevel: analyzedPrefs?.whiteningLevel || 'none',
    colorInstruction: colorInstruction.substring(0, 80) + '...',
    promptLength: simulationPrompt.length,
    promptPreview: simulationPrompt.substring(0, 400) + '...',
  });

  // Models to try - Pro first for quality, Flash as fallback
  const models = [
    "google/gemini-3-pro-image-preview",
    "google/gemini-2.5-flash-image",
  ];
  
  for (const model of models) {
    try {
      logger.log(`Trying simulation with model: ${model}`);
      
      const response = await fetchWithTimeout(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [{
              role: "user",
              content: [
                { type: "text", text: simulationPrompt },
                { type: "image_url", image_url: { url: imageBase64 } },
              ],
            }],
            modalities: ["image", "text"],
          }),
        },
        SIMULATION_TIMEOUT,
        "generateSimulation"
      );

      if (!response.ok) {
        logger.warn(`Simulation request failed with ${model}:`, response.status);
        continue; // Try next model
      }

      const data = await response.json();
      const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!generatedImage) {
        logger.warn(`No image in response from ${model}, trying next...`);
        continue; // Try next model
      }

      // Upload directly (no blend, no verification)
      const base64Data = generatedImage.replace(/^data:image\/\w+;base64,/, "");
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

      logger.log(`Simulation generated with ${model} and uploaded:`, fileName);
      return fileName;
    } catch (err) {
      logger.warn(`Simulation error with ${model}:`, err);
      continue; // Try next model
    }
  }
  
  logger.warn("All simulation models failed");
  return null;
}

// Analyze facial proportions
async function analyzeProportions(
  imageBase64: string,
  apiKey: string,
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

  const analysisPrompt = `Você é um especialista em Digital Smile Design (DSD) e Odontologia Estética.
Analise esta foto de sorriso/face do paciente e forneça uma análise detalhada das proporções faciais e dentárias.
${additionalContext}${preferencesContext}

ANÁLISE OBRIGATÓRIA:
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

=== REGRAS PARA GENGIVOPLASTIA ===
❌ NUNCA sugira gengivoplastia se:
- A linha do sorriso for "média" ou "baixa" (pouca exposição gengival)
- Os zênites gengivais estiverem SIMÉTRICOS bilateralmente
- A proporção largura/altura dos dentes estiver NORMAL (75-80%)
- Não houver sorriso gengival evidente

✅ Sugira gengivoplastia APENAS se:
- Sorriso gengival EVIDENTE (>3mm de exposição gengival acima dos incisivos)
- Zênites CLARAMENTE assimétricos que afetam a estética visivelmente
- Dentes parecem "curtos" devido a excesso de gengiva visível

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

OBSERVAÇÕES:
Inclua 2-3 observações clínicas objetivas sobre o sorriso.
Se identificar limitações para simulação, inclua uma observação com "ATENÇÃO:" explicando.

IMPORTANTE:
- Seja CONSERVADOR ao diagnosticar restaurações existentes
- Seja COMPLETO ao avaliar o arco do sorriso (inclua todos os dentes visíveis)
- TODAS as sugestões devem ser clinicamente realizáveis
- Se o caso NÃO for adequado para DSD, AINDA forneça a análise de proporções mas marque confidence="baixa"`;

  const analysisResponse = await fetchWithTimeout(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: analysisPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analise esta foto e retorne a análise DSD completa usando a ferramenta analyze_dsd." },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
        tools: [
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
                        tooth: { type: "string" },
                        current_issue: { type: "string" },
                        proposed_change: { type: "string" },
                      },
                      required: ["tooth", "current_issue", "proposed_change"],
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
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_dsd" } },
      }),
    },
    70_000,
    "analyzeProportions"
  );

  if (!analysisResponse.ok) {
    const status = analysisResponse.status;
    if (status === 429) {
      return createErrorResponse(ERROR_MESSAGES.RATE_LIMITED, 429, corsHeaders, "RATE_LIMITED");
    }
    if (status === 402) {
      return createErrorResponse(ERROR_MESSAGES.PAYMENT_REQUIRED, 402, corsHeaders, "PAYMENT_REQUIRED");
    }
    logger.error("AI analysis error:", status, await analysisResponse.text());
    return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
  }

  const analysisData = await analysisResponse.json();
  const toolCall = analysisData.choices?.[0]?.message?.tool_calls?.[0];

  if (toolCall?.function?.arguments) {
    try {
      return JSON.parse(toolCall.function.arguments) as DSDAnalysis;
    } catch {
      logger.error("Failed to parse tool call arguments");
      return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
    }
  }

  logger.error("No tool call in response");
  return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
}

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreFlight(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    // Get API keys
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
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
      const analysisResult = await analyzeProportions(imageBase64, LOVABLE_API_KEY, corsHeaders, additionalPhotos, patientPreferences);
      
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
      simulationUrl = await generateSimulation(imageBase64, analysis, user.id, supabase, LOVABLE_API_KEY, toothShape || 'natural', patientPreferences);
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
