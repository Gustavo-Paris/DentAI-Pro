import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { logger } from "../_shared/logger.ts";
import {
  callGeminiImageEdit,
  GeminiError,
} from "../_shared/gemini.ts";
import {
  callClaudeVision,
} from "../_shared/claude.ts";
import { getPrompt } from "../_shared/prompts/registry.ts";
import { withMetrics } from "../_shared/prompts/index.ts";
import type { Params as DsdSimulationParams } from "../_shared/prompts/definitions/dsd-simulation.ts";
import { createSupabaseMetrics, PROMPT_VERSION } from "../_shared/metrics-adapter.ts";
import { callFluxImageEdit, FluxError } from "../_shared/flux.ts";
import type { DSDAnalysis, PatientPreferences } from "./types.ts";
import { WHITENING_INSTRUCTIONS } from "./types.ts";

// P2-56: Sanitize AI-generated text before interpolating into Gemini prompts.
// Prevents prompt injection from analysis text that flows into the simulation prompt.
function sanitizeAnalysisText(text: string, maxLength: number = 500): string {
  return text
    // Remove potential prompt injection prefixes
    .replace(/^(system|instructions|ignore previous|disregard|override)\s*:/gi, '')
    // Remove markdown formatting that could confuse the model
    .replace(/```[\s\S]*?```/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
    // Remove XML-like tags
    .replace(/<[^>]+>/g, '')
    // Truncate to prevent excessively long injections
    .substring(0, maxLength)
    .trim();
}

// Transform verbose clinical descriptions into SHORT visual editing instructions.
// Clinical language like "Reanatomização em resina composta para aumentar volume
// e comprimento (~1.5mm)" is too directive for image editing — Gemini treats mm
// values as literal targets. Shorter, softer descriptions = more natural results.
function simplifyForImageEdit(proposedChange: string): string {
  let text = proposedChange;

  // Strip mm measurements (meaningless in pixel space, makes Gemini over-modify)
  text = text.replace(/\(?\s*~?\d+([.,]\d+)?\s*mm\s*\)?/gi, '');

  // Strip material mentions (irrelevant for image editing)
  text = text.replace(/\bem resina\s*(composta)?\b/gi, '');
  text = text.replace(/\bresina\s*(composta)?\b/gi, '');

  // Soften aggressive clinical verbs
  text = text.replace(/\brecontorno estético\/suaviza[çc][ãa]o\b/gi, 'leve suavização');
  text = text.replace(/\breanatomiza[çc][ãa]o\b/gi, 'leve ajuste de contorno');
  text = text.replace(/\breconstru[çc][ãa]o\b/gi, 'leve correção');
  text = text.replace(/\brecontorno estético\b/gi, 'leve suavização');

  // Soften magnitude language
  text = text.replace(/\baumentar volume e comprimento\b/gi, 'leve aumento incisal');
  text = text.replace(/\baumentar volume\b/gi, 'leve aumento de volume');
  text = text.replace(/\baumentar comprimento\b/gi, 'leve extensão incisal');
  text = text.replace(/\brestabelecer comprimento e contorno\b/gi, 'leve melhoria do contorno incisal');

  // Clean up artifacts (double spaces, orphaned commas/parentheses, trailing space before comma)
  text = text.replace(/\(\s*\)/g, '');
  text = text.replace(/\s+,/g, ',');
  text = text.replace(/\s{2,}/g, ' ');
  text = text.replace(/\s*,\s*,/g, ',');
  text = text.replace(/^\s*[,]\s*/, '');
  text = text.trim();

  // Cap length — shorter descriptions = less Gemini overinterpretation
  if (text.length > 120) {
    text = text.substring(0, 117) + '...';
  }

  return text;
}

// SIMPLIFIED: Generate simulation image - single attempt, no blend, no verification
export async function generateSimulation(
  imageBase64: string,
  analysis: DSDAnalysis,
  userId: string,
  supabase: SupabaseClient,
  toothShape: string = 'natural',
  patientPreferences?: PatientPreferences,
  layerType?: 'restorations-only' | 'whitening-restorations' | 'complete-treatment' | 'root-coverage',
  inputAlreadyProcessed?: boolean,
): Promise<{ url: string | null; lips_moved?: boolean }> {
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

  // P2-46: Check if treatment includes lower teeth (FDI 3x, 4x)
  const hasLowerTeeth = analysis.suggestions?.some(s => {
    const toothNum = parseInt(s.tooth);
    return toothNum >= 31 && toothNum <= 48;
  });

  // Allow shape changes from DSD analysis (conoid laterals, visagism corrections)
  // Filter out destructive changes AND gingival changes for non-gingival layers
  // P2-60: Expanded destructive keyword filter to cover severe pathology
  const destructiveKeywords = [
    'reconstruir', 'reconstruct', 'rebuild',
    'destruição severa', 'perda total', 'avulsão', 'avulsao',
    'fratura radicular', 'mobilidade grau iii', 'mobilidade grau 3',
    'necrose pulpar', 'reabsorção radicular', 'reabsorcao radicular',
    'exodontia', 'extração indicada', 'extracao indicada',
  ];

  // Gingival suggestions must ONLY appear in complete-treatment/root-coverage layers
  const isGingivalLayerType = layerType === 'complete-treatment' || layerType === 'root-coverage';

  const filteredSuggestions = analysis.suggestions?.filter(s => {
    const change = s.proposed_change.toLowerCase();
    const issue = s.current_issue.toLowerCase();
    const treatment = (s.treatment_indication || '').toLowerCase();
    const isDestructive = destructiveKeywords.some(kw =>
      change.includes(kw) || issue.includes(kw)
    );
    if (isDestructive) return false;

    // For non-gingival layers (L1, L2), strip any gengivoplasty/root-coverage suggestions
    // so they don't leak into the prompt and cause unwanted gum changes
    if (!isGingivalLayerType) {
      const isGingivalSuggestion =
        treatment === 'gengivoplastia' ||
        treatment === 'recobrimento_radicular' ||
        change.includes('gengivoplastia') ||
        change.includes('gengivoplasty') ||
        change.includes('recobrimento radicular') ||
        change.includes('zênite') ||
        change.includes('zenite') ||
        change.includes('gengiv');
      if (isGingivalSuggestion) return false;
    }

    return true;
  }) || [];

  // P2-56: Build SPECIFIC CORRECTIONS section.
  // When 5+ teeth are listed for structural correction, Gemini tends to "redesign" the
  // entire smile instead of making subtle changes. Solution: for many teeth, condense
  // into ONE high-level instruction instead of per-tooth descriptions.
  // For fewer teeth (1-4), keep individual descriptions (simplified to remove mm/clinical jargon).
  let allowedChangesFromAnalysis = '';
  if (filteredSuggestions.length >= 5) {
    // CONDENSED MODE: one cohesive instruction instead of 6+ individual tooth descriptions.
    // Listing each tooth separately gives Gemini "permission" to redesign each one.
    const teethList = filteredSuggestions.map(s => s.tooth).join(', ');
    allowedChangesFromAnalysis = `
SPECIFIC CORRECTIONS (teeth ${teethList}):
Apply SUBTLE improvements to harmonize the smile. The patient's teeth are largely NORMAL —
corrections are MINOR refinements, NOT redesign. For each tooth:
- Incisal edges: SLIGHT harmonization only (smooth chips, equalize minor wear)
- Contours: GENTLE refinement of angles/tips — do NOT reshape the tooth
- Proportions: MINIMAL adjustment — if a lateral is smaller than central, that may be NORMAL anatomy
- Each tooth in the output MUST be clearly the SAME tooth from the input, just slightly refined
- If in doubt between changing more vs less: ALWAYS choose LESS
- The overall impression should be "same smile, slightly polished" — NOT "new teeth"`;
  } else if (filteredSuggestions.length > 0) {
    // INDIVIDUAL MODE: per-tooth descriptions with simplified clinical language.
    allowedChangesFromAnalysis = `\nSPECIFIC CORRECTIONS (subtle visual edits ONLY — each tooth must remain recognizable):\n${filteredSuggestions.map(s =>
        `- Tooth ${s.tooth}: ${simplifyForImageEdit(sanitizeAnalysisText(s.proposed_change, 400))}`
      ).join('\n')}`;
  }

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
      // Primary: treatment_indication field (aligned with frontend useDSDStep detection)
      const indication = (s.treatment_indication || '').toLowerCase();
      if (indication === 'gengivoplastia' || indication === 'gingivoplasty') return true;
      // Secondary: keywords in text
      const text = `${s.current_issue} ${s.proposed_change}`.toLowerCase();
      return text.includes('gengiv') || text.includes('zênite') || text.includes('zenite') || text.includes('gengivoplastia');
    }) || [];
    if (gingivoItems.length > 0) {
      gingivoSuggestions = gingivoItems.map(s =>
        `- Dente ${s.tooth}: ${s.proposed_change}`
      ).join('\n');
    }
  }

  // Build root coverage suggestions for root-coverage layer
  let rootCoverageSuggestions: string | undefined;
  if (layerType === 'root-coverage') {
    const rootItems = analysis.suggestions?.filter(s => {
      const text = `${s.current_issue} ${s.proposed_change}`.toLowerCase();
      return text.includes('recobrimento') || text.includes('recessão') || text.includes('raiz exposta') || text.includes('root coverage');
    }) || [];
    if (rootItems.length > 0) {
      rootCoverageSuggestions = rootItems.map(s =>
        `- Dente ${s.tooth}: ${s.proposed_change}`
      ).join('\n');
    }
  }

  // P2-46: Add lower arch perspective instruction when lower teeth are involved
  const lowerArchInstruction = hasLowerTeeth
    ? '\nSe o tratamento inclui dentes inferiores (31-38, 41-48), ajustar perspectiva da simulação para incluir arco inferior.'
    : '';

  // P2-50: White balance instruction to maintain color consistency
  const whiteBalanceInstruction = '\nManter o balanço de branco e temperatura de cor consistentes com a foto original. Não alterar a iluminação ambiente.';

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
    // Skip corrections injection when input is already processed (teeth already corrected)
    allowedChangesFromAnalysis: inputAlreadyProcessed ? '' : allowedChangesFromAnalysis,
    layerType,
    gingivoSuggestions,
    rootCoverageSuggestions,
    inputAlreadyProcessed,
  } as DsdSimulationParams) + lowerArchInstruction + whiteBalanceInstruction;

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
    const preview = imageBase64.substring(0, 80);
    logger.error(`Invalid image data URL format. Preview: ${preview}`);
    throw new Error(`Invalid image format (expected data:...;base64,...). Got: ${preview}...`);
  }
  const [, inputMimeType, inputBase64Data] = dataUrlMatch;

  // Compute semi-deterministic seed: image hash + time offset for regeneration variability
  const hashSource = inputBase64Data.substring(0, 1000);
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(hashSource));
  const hashArray = new Uint8Array(hashBuffer);
  const baseSeed = ((hashArray[0] << 24) | (hashArray[1] << 16) | (hashArray[2] << 8) | hashArray[3]) & 0x7FFFFFFF;
  // Add time-based offset so "regenerate" produces a different result (different minute = different seed)
  const timeOffset = Math.floor(Date.now() / 60000) % 1000;
  const imageSeed = (baseSeed + timeOffset) & 0x7FFFFFFF;
  logger.log("Simulation seed from image hash:", imageSeed, "(base:", baseSeed, "offset:", timeOffset, ")");

  // Metrics for DSD simulation
  const metrics = createSupabaseMetrics(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const dsdSimulationPromptDef = getPrompt('dsd-simulation');

  // Lip validation for ALL layers: checks if EITHER lip moved.
  // Previously only gingival layers were validated, but Gemini frequently
  // lifts lips in ALL modes to "show more result" (known model behavior).
  const shouldValidateLips = true; // All layers now validated
  const isGingivalLayer = layerType === 'complete-treatment' || layerType === 'root-coverage';

  // Use Haiku for lip validation — binary SIM/NÃO task doesn't need Sonnet
  const smileLinePromptDef = getPrompt('smile-line-classifier');

  async function validateLips(simImageUrl: string): Promise<boolean> {
    try {
      const simBase64 = simImageUrl.replace(/^data:image\/\w+;base64,/, "");
      const simMimeMatch = simImageUrl.match(/^data:([^;]+);base64,/);
      const simMimeType = simMimeMatch ? simMimeMatch[1] : 'image/png';

      const lipCheck = await callClaudeVision(
        smileLinePromptDef.model,
        `Imagem 1 é a ORIGINAL. Imagem 2 é a SIMULAÇÃO odontológica.
Compare AMBOS os lábios entre as duas imagens:
1. O LÁBIO SUPERIOR mudou de posição, formato ou contorno?
2. O LÁBIO INFERIOR mudou de posição, formato ou contorno?
3. A ABERTURA LABIAL (distância entre lábios) mudou?

Se QUALQUER um dos itens acima mudou, responda 'SIM'.
Se ambos os lábios estão na MESMA posição exata, responda 'NÃO'.
Responda APENAS 'SIM' ou 'NÃO'.`,
        inputBase64Data,
        inputMimeType,
        {
          temperature: 0.0,
          maxTokens: 10,
          additionalImages: [{ data: simBase64, mimeType: simMimeType }],
        }
      );

      if (lipCheck.tokens) {
        logger.info('claude_tokens', { operation: 'generate-dsd:lip-validation', ...lipCheck.tokens });
      }
      const lipAnswer = (lipCheck.text || '').trim().toUpperCase();
      const lipsMoved = lipAnswer.includes('SIM');
      logger.log(`Lip validation for ${layerType || 'standard'} layer: ${lipsMoved ? 'FAILED (lips moved)' : 'PASSED'}`);
      return !lipsMoved; // true = valid (lips didn't move)
    } catch (lipErr) {
      // P2-54: Fail-CLOSED — if the lip validator errors, REJECT the simulation
      // rather than silently accepting a potentially distorted image.
      logger.warn("Lip validation check failed — rejecting simulation (fail-closed):", lipErr);
      return false; // Reject on validation error
    }
  }

  const simulationStartTime = Date.now();

  try {
    // P2-53: callGeminiImageEdit now includes fallback model chain (P1-23).
    // If the primary model fails with a non-retryable error, it automatically
    // falls back to the secondary model before throwing.
    logger.log("Calling Gemini Image Edit for simulation...");

    const result = await withMetrics<{ imageUrl: string | null; text: string | null }>(metrics, dsdSimulationPromptDef.id, PROMPT_VERSION, dsdSimulationPromptDef.model)(async () => {
      const response = await callGeminiImageEdit(
        simulationPrompt,
        inputBase64Data,
        inputMimeType,
        {
          temperature: dsdSimulationPromptDef.temperature,
          timeoutMs: SIMULATION_TIMEOUT,
          seed: imageSeed,
          // No internal retries — client handles retries via withRetry.
          // Internal retries (55s × 3 attempts) exceed the 60s Supabase edge function limit.
          maxRetries: 0,
        }
      );
      if (response.tokens) {
        logger.info('gemini_tokens', { operation: 'generate-dsd:simulation', ...response.tokens });
      }
      return {
        result: { imageUrl: response.imageUrl, text: response.text },
        tokensIn: response.tokens?.promptTokenCount ?? 0,
        tokensOut: response.tokens?.candidatesTokenCount ?? 0,
      };
    });

    if (!result.imageUrl) {
      logger.warn("No image in Gemini response, text was:", result.text);
      throw new Error(`Gemini returned no image. Text: ${(result.text || 'none').substring(0, 200)}`);
    }

    // Validate lips for ALL layers and return flag (client handles retry).
    // Gemini lifts lips in all modes (not just gingival) to "show more result".
    let lipsMoved = false;
    if (shouldValidateLips) {
      const lipsValid = await validateLips(result.imageUrl);
      lipsMoved = !lipsValid;
      if (lipsMoved) {
        logger.warn(`Lip validation FAILED for ${layerType || 'standard'} layer — lips_moved flag set`);
      }
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
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    logger.log("Simulation generated and uploaded:", fileName, lipsMoved ? "(lips_moved)" : "");
    return { url: fileName, lips_moved: lipsMoved || undefined };
  } catch (err) {
    // Primary (Gemini) failed — try FLUX Kontext Pro as fallback
    const geminiMsg = err instanceof Error ? err.message : String(err);
    logger.warn(`Gemini simulation failed: ${geminiMsg}. Trying FLUX fallback...`);

    try {
      const remainingMs = Math.max(SIMULATION_TIMEOUT - (Date.now() - simulationStartTime), 15_000);
      const fluxResult = await callFluxImageEdit(
        simulationPrompt,
        inputBase64Data,
        inputMimeType,
        {
          seed: imageSeed,
          timeoutMs: remainingMs,
        },
      );

      if (!fluxResult.imageUrl) {
        throw new Error("FLUX returned no image");
      }

      logger.log("FLUX fallback simulation succeeded");

      // Lip validation for ALL layers (same as primary path)
      let lipsMoved = false;
      if (shouldValidateLips) {
        const lipsValid = await validateLips(fluxResult.imageUrl);
        lipsMoved = !lipsValid;
        if (lipsMoved) {
          logger.warn(`Lip validation FAILED for ${layerType || 'standard'} layer — lips_moved flag set (FLUX fallback)`);
        }
      }

      // Upload FLUX image (same pattern as primary path)
      const base64Data = fluxResult.imageUrl.replace(/^data:image\/\w+;base64,/, "");
      const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const fileName = `${userId}/dsd_${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("dsd-simulations")
        .upload(fileName, binaryData, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        logger.error("FLUX upload error:", uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      logger.log("FLUX fallback simulation uploaded:", fileName, lipsMoved ? "(lips_moved)" : "");
      return { url: fileName, lips_moved: lipsMoved || undefined };
    } catch (fluxErr) {
      // Both Gemini and FLUX failed — propagate with context from both
      const fluxMsg = fluxErr instanceof Error ? fluxErr.message : String(fluxErr);
      logger.warn(`FLUX fallback also failed: ${fluxMsg}`);

      if (err instanceof GeminiError) {
        throw new Error(`GeminiError ${(err as GeminiError).statusCode}: ${(err as GeminiError).message} (FLUX fallback: ${fluxMsg})`);
      }
      throw new Error(`Simulation failed: ${geminiMsg} (FLUX fallback: ${fluxMsg})`);
    }
  }
}
