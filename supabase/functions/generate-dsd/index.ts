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
  simulation_limitation?: string; // New: explains why simulation may be limited
}

interface DSDResult {
  analysis: DSDAnalysis;
  simulation_url: string | null;
  simulation_note?: string; // New: message when simulation is not possible
}

interface AdditionalPhotos {
  smile45?: string;  // 45° smile photo for buccal corridor analysis
  face?: string;     // Full face photo for facial proportions
}

interface PatientPreferences {
  aestheticGoals?: string;
  desiredChanges?: string[];
}

interface RequestData {
  imageBase64: string;
  evaluationId?: string;
  regenerateSimulationOnly?: boolean;
  existingAnalysis?: DSDAnalysis;
  toothShape?: 'natural' | 'quadrado' | 'triangular' | 'oval' | 'retangular';
  additionalPhotos?: AdditionalPhotos;
  patientPreferences?: PatientPreferences;
}

// Teeth bounding box for mask-based blending
interface TeethBounds {
  x: number;      // left edge as % of image width (0-100)
  y: number;      // top edge as % of image height (0-100)
  width: number;  // width as % of image width
  height: number; // height as % of image height
}

// Detect teeth region for mask-based blending
async function getTeethMask(
  imageBase64: string,
  apiKey: string
): Promise<{ bounds: TeethBounds }> {
  logger.log("Detecting teeth region for mask...");
  
  const response = await fetchWithTimeout(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this smile photo. Return the bounding box of the TEETH ONLY (not lips, not gums).

Return ONLY valid JSON:
{
  "bounds": {
    "x": <left edge as % of image width, 0-100>,
    "y": <top edge as % of image height, 0-100>,
    "width": <width as % of image width>,
    "height": <height as % of image height>
  }
}

The box should tightly contain just the visible tooth surfaces.`
            },
            { type: "image_url", image_url: { url: imageBase64 } },
          ],
        }],
      }),
    },
    20_000,
    "getTeethMask"
  );
  
  if (!response.ok) {
    logger.warn("Teeth mask detection failed:", response.status);
    throw new Error("Could not detect teeth region");
  }
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.bounds && typeof parsed.bounds.x === 'number') {
        logger.log("Teeth region detected:", parsed.bounds);
        return { bounds: parsed.bounds };
      }
    } catch (e) {
      logger.warn("Failed to parse teeth bounds JSON:", e);
    }
  }
  
  throw new Error("Could not parse teeth region coordinates");
}

// Quality check: verify simulation preserved structure
async function verifySimulationQuality(
  originalBase64: string,
  simulationBase64: string,
  apiKey: string
): Promise<{ passed: boolean; issues: string[] }> {
  logger.log("Verifying simulation quality...");
  
  const verifyPrompt = `Compare these TWO dental photos and check if the simulation (second image) correctly preserves the original structure.

CHECK EACH ELEMENT:
1. LIPS - Are they IDENTICAL in color, shape, texture, and outline? (Yes/No)
2. GUMS - Are they IDENTICAL in level, color, and contour? (Yes/No)
3. TOOTH SIZE - Are teeth the SAME width and length? (Yes/No)
4. SKIN - Is facial skin IDENTICAL? (Yes/No)
5. FRAMING - Is the image crop/zoom IDENTICAL? (Yes/No)

Return ONLY valid JSON:
{
  "lips_identical": true/false,
  "gums_identical": true/false,
  "tooth_size_identical": true/false,
  "skin_identical": true/false,
  "framing_identical": true/false,
  "issues": ["list of specific differences found, or empty array if all identical"]
}`;

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
          model: "google/gemini-2.5-flash",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: verifyPrompt },
              { type: "image_url", image_url: { url: originalBase64 } },
              { type: "image_url", image_url: { url: simulationBase64 } },
            ],
          }],
        }),
      },
      25_000,
      "verifySimulationQuality"
    );

    if (!response.ok) {
      logger.warn("Quality verification failed:", response.status);
      return { passed: false, issues: ["Could not verify quality"] };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        const passed = parsed.lips_identical && 
                       parsed.gums_identical && 
                       parsed.tooth_size_identical && 
                       parsed.skin_identical &&
                       parsed.framing_identical;
        
        logger.log("Quality check result:", { passed, issues: parsed.issues || [] });
        return { 
          passed, 
          issues: parsed.issues || [] 
        };
      } catch (e) {
        logger.warn("Failed to parse quality check JSON:", e);
      }
    }
    
    return { passed: false, issues: ["Could not parse quality response"] };
  } catch (err) {
    logger.error("Quality check error:", err);
    return { passed: false, issues: ["Quality check failed"] };
  }
}

// Blend simulation with original image - ONLY teeth color from simulation
async function blendWithOriginal(
  originalBase64: string,
  simulationBase64: string,
  teethBounds: TeethBounds,
  apiKey: string
): Promise<string | null> {
  logger.log("Blending simulation with original...");
  logger.log("Teeth bounds:", teethBounds);
  
  // Super minimal prompt - just ask to composite
  const blendPrompt = `IMAGE COMPOSITING TASK:

IMAGE 1 = Original patient photo (MASTER - use for everything except teeth color)
IMAGE 2 = Simulation with whitened teeth (use ONLY for tooth enamel color)

Create composite where:
- Take 100% of IMAGE 1 (lips, gums, skin, background, framing)
- Replace ONLY the tooth enamel color with the whiter color from IMAGE 2
- Teeth SIZE and SHAPE must stay identical to IMAGE 1
- Blend edges seamlessly at tooth-gum border

Output: Same photo as IMAGE 1 but with whiter tooth enamel from IMAGE 2.`;

  // Try multiple models for best result
  const modelsToTry = ["google/gemini-3-pro-image-preview", "google/gemini-2.5-flash-image-preview"];
  
  for (const model of modelsToTry) {
    try {
      logger.log(`Blend attempt with ${model}`);
      
      const response = await fetchWithTimeout(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            messages: [{
              role: "user",
              content: [
                { type: "text", text: blendPrompt },
                { type: "image_url", image_url: { url: originalBase64 } },
                { type: "image_url", image_url: { url: simulationBase64 } },
              ],
            }],
            modalities: ["image", "text"],
          }),
        },
        60_000,
        `blendWithOriginal:${model}`
      );

      if (!response.ok) {
        logger.warn(`Blend with ${model} failed:`, response.status);
        continue;
      }

      const data = await response.json();
      const blendedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (blendedImage) {
        logger.log(`Blend successful with ${model}`);
        return blendedImage;
      }
      
      logger.warn(`No image from ${model}`);
    } catch (err) {
      logger.warn(`Blend error with ${model}:`, err);
    }
  }
  
  logger.warn("All blend attempts failed");
  return null;
}

// Select best variation based on preservation of non-dental areas
async function selectBestVariation(
  originalBase64: string,
  variationUrls: string[],
  supabase: any,
  apiKey: string
): Promise<string> {
  if (variationUrls.length <= 1) {
    return variationUrls[0];
  }
  
  logger.log(`Selecting best variation from ${variationUrls.length} options...`);
  
  // Download variations to compare
  const variationImages: string[] = [];
  for (const url of variationUrls.slice(0, 3)) {
    try {
      const { data } = await supabase.storage
        .from("dsd-simulations")
        .download(url);
      if (data) {
        const base64 = await blobToBase64(data);
        variationImages.push(base64);
      }
    } catch (e) {
      logger.warn("Failed to download variation for comparison:", e);
    }
  }
  
  if (variationImages.length < 2) {
    return variationUrls[0];
  }
  
  const comparePrompt = `You have:
1. ORIGINAL smile photo (first image)
2. VARIATION A (second image) - teeth whitened
3. VARIATION B (third image) - teeth whitened
${variationImages.length > 2 ? '4. VARIATION C (fourth image) - teeth whitened' : ''}

Compare the variations to the ORIGINAL and select which one has the BEST preservation of NON-DENTAL areas:
- Which one has lips MOST IDENTICAL to original?
- Which one has skin texture MOST IDENTICAL to original?
- Which one has framing/angle MOST IDENTICAL to original?

Respond with ONLY the letter: "A", "B"${variationImages.length > 2 ? ', or "C"' : ''}
Choose the variation where ONLY the teeth look different, and everything else is unchanged.`;

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
          model: "google/gemini-2.5-flash",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: comparePrompt },
              { type: "image_url", image_url: { url: originalBase64 } },
              ...variationImages.map(img => ({ type: "image_url", image_url: { url: img } })),
            ],
          }],
        }),
      },
      25_000,
      "selectBestVariation"
    );

    if (response.ok) {
      const data = await response.json();
      const choice = data.choices?.[0]?.message?.content?.trim().toUpperCase();
      
      if (choice === 'A') return variationUrls[0];
      if (choice === 'B' && variationUrls.length > 1) return variationUrls[1];
      if (choice === 'C' && variationUrls.length > 2) return variationUrls[2];
    }
  } catch (e) {
    logger.warn("Variation comparison failed:", e);
  }
  
  // Default to first variation
  return variationUrls[0];
}

// Helper to convert blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  const mimeType = blob.type || 'image/png';
  return `data:${mimeType};base64,${base64}`;
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
    // Only flag as limited if it's a TRUE intraoral photo (with retractor, no visible lips)
    const hasTrueIntraoralIssue = analysis.observations?.some(obs => {
      const lower = obs.toLowerCase();
      // Must have "intraoral" AND specific markers like "afastador", "sem lábio", "interna"
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

// Generate simulation image with retry logic
async function generateSimulation(
  imageBase64: string,
  analysis: DSDAnalysis,
  userId: string,
  supabase: any,
  apiKey: string,
  toothShape: string = 'natural',
  patientPreferences?: PatientPreferences
): Promise<string | null> {
  const shapeInstruction = toothShapeDescriptions[toothShape] || toothShapeDescriptions.natural;
  
  // Build patient preferences instruction for simulation
  let patientDesires = '';
  if (patientPreferences?.desiredChanges?.length) {
    const desireLabels: Record<string, string> = {
      'whiter': 'dentes mais brancos (tom A1/B1)',
      'harmonious': 'sorriso mais harmonioso e natural',
      'spacing': 'fechar espaços/diastemas',
      'alignment': 'dentes mais alinhados',
      'natural': 'formato mais natural',
      'asymmetry': 'corrigir assimetrias'
    };
    
    const desires = patientPreferences.desiredChanges
      .map(id => desireLabels[id] || id)
      .join(', ');
    
    patientDesires = `\nOBJETIVO DO PACIENTE: ${desires}.\n`;
  }
  if (patientPreferences?.aestheticGoals) {
    patientDesires += `DESCRIÇÃO DO PACIENTE: "${patientPreferences.aestheticGoals}"\n`;
  }
  
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
  
  // Check if it's a TRUE intraoral photo (simpler prompt needed)
  // Only trigger for actual intraoral photos with retractors, not smile photos with lips visible
  const isIntraoralPhoto = analysis.observations?.some(obs => {
    const lower = obs.toLowerCase();
    // Require specific intraoral markers - NOT just "intraoral detectada"
    return lower.includes('afastador') || 
           lower.includes('retrator') ||
           (lower.includes('intraoral') && (lower.includes('interna') || lower.includes('sem lábio'))) ||
           lower.includes('close-up extremo');
  });
  
  let simulationPrompt: string;
  
  // Build allowed changes from analysis suggestions (used in all prompt types)
  const allowedChangesFromAnalysis = analysis.suggestions?.length > 0 
    ? `\nSPECIFIC CORRECTIONS FROM ANALYSIS (apply these changes):\n${analysis.suggestions.map(s => 
        `- Tooth ${s.tooth}: ${s.proposed_change}`
      ).join('\n')}`
    : '';
  
  if (needsReconstruction) {
    // RECONSTRUCTION PROMPT - MINIMALISTA
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

    simulationPrompt = `TEETH RECONSTRUCTION

Task: Reconstruct missing/damaged teeth and whiten all teeth.

COPY EXACTLY (unchanged):
- Lips (same color, shape, texture)
- Gums (same level, color)
- Skin (unchanged)
- Existing tooth size
- Image dimensions

CHANGES ALLOWED:
- Reconstruct: ${specificInstructions || 'Fill missing teeth using adjacent teeth as reference'}
- Whiten all teeth to A1/A2
- Remove stains
${allowedChangesFromAnalysis}

Output: Same photo with reconstructed + whitened teeth only.`;

  } else if (needsRestorationReplacement) {
    simulationPrompt = `RESTORATION BLEND

Task: Blend restoration margins and whiten teeth.

COPY EXACTLY (unchanged):
- Lips (same color, shape, texture)
- Gums (same level, color)
- Skin (unchanged)
- Tooth size (same width, length)
- Image dimensions

CHANGES ALLOWED:
- Whiten teeth to A1/A2
- Blend interface lines on teeth ${restorationTeeth || '11, 21'}
- Remove stains
${allowedChangesFromAnalysis}

Output: Same photo with blended restorations and whiter teeth.`;

  } else if (isIntraoralPhoto) {
    simulationPrompt = `INTRAORAL TEETH COLOR EDIT

Task: Whiten the teeth in this intraoral photo.

COPY EXACTLY (unchanged):
- Gums (same level, color)
- Tooth size (same width, length)
- All other tissues
- Image dimensions

CHANGE ONLY:
- Tooth color → shade A1/A2
- Remove stains
${allowedChangesFromAnalysis}

Output: Same photo with whiter teeth only.`;

  } else {
    // STANDARD PROMPT - Ultra-minimal for maximum compliance
    simulationPrompt = `TEETH COLOR EDIT ONLY

Task: Whiten the teeth in this photo. Do NOT change anything else.

COPY EXACTLY (unchanged):
- Lips (same color, shape, texture)
- Gums (same level, color)
- Skin (unchanged)
- Tooth size (same width, length)
- Image dimensions

CHANGE ONLY:
- Tooth enamel color → shade A1/A2 (natural white)
- Remove stains
${allowedChangesFromAnalysis}

Output: Same photo with whiter teeth only.`;
  }

  const promptType = needsReconstruction ? 'reconstruction' : 
                     (needsRestorationReplacement ? 'restoration-replacement' : 
                     (isIntraoralPhoto ? 'intraoral' : 'standard'));
  
  logger.log("DSD Simulation Request:", {
    promptType,
    approach: "HYBRID - mask detection + generation + blend",
    promptLength: simulationPrompt.length,
    imageDataLength: imageBase64.length,
    analysisConfidence: analysis.confidence,
    suggestionsCount: analysis.suggestions.length,
    needsRestorationReplacement,
    restorationTeeth: restorationTeeth || 'none'
  });

  // STEP 1: Detect teeth region for mask-based blending
  let teethBounds: TeethBounds = { x: 25, y: 35, width: 50, height: 30 }; // Fallback
  try {
    const maskResult = await getTeethMask(imageBase64, apiKey);
    teethBounds = maskResult.bounds;
  } catch (err) {
    logger.warn("Could not detect teeth mask, using fallback bounds:", err);
  }

  // STEP 2: Generate simulation variations
  const NUM_VARIATIONS = 3;
  const modelsToTry = ["google/gemini-2.5-flash-image-preview", "google/gemini-3-pro-image-preview"];
  
  const generateSingleVariation = async (variationIndex: number): Promise<{ fileName: string; imageBase64: string } | null> => {
    for (const model of modelsToTry) {
      try {
        logger.log(`Variation ${variationIndex}: Trying ${model}`);
        
        const simulationResponse = await fetchWithTimeout(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: model,
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: simulationPrompt },
                    { type: "image_url", image_url: { url: imageBase64 } },
                  ],
                },
              ],
              modalities: ["image", "text"],
            }),
          },
          75_000,
          `generateSingleVariation:${variationIndex}:${model}`
        );

        if (!simulationResponse.ok) {
          logger.warn(`Variation ${variationIndex} - ${model} failed:`, simulationResponse.status);
          continue;
        }

        const simData = await simulationResponse.json();
        const generatedImage = simData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!generatedImage) {
          logger.warn(`Variation ${variationIndex} - No image from ${model}`);
          continue;
        }

        // Upload raw variation
        const base64Data = generatedImage.replace(/^data:image\/\w+;base64,/, "");
        const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        
        const fileName = `${userId}/dsd_raw_${Date.now()}_v${variationIndex}.png`;
        
        const { error: uploadError } = await supabase.storage
          .from("dsd-simulations")
          .upload(fileName, binaryData, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadError) {
          logger.error(`Variation ${variationIndex} upload error:`, uploadError);
          return null;
        }

        logger.log(`Variation ${variationIndex} generated successfully with ${model}`);
        return { fileName, imageBase64: generatedImage };
      } catch (err) {
        logger.warn(`Variation ${variationIndex} - ${model} error:`, err);
        continue;
      }
    }
    return null;
  };

  // Generate variations in parallel
  logger.log(`Generating ${NUM_VARIATIONS} DSD variations in parallel...`);
  
  const variationPromises = Array(NUM_VARIATIONS).fill(null).map((_, i) => generateSingleVariation(i));
  const variationResults = await Promise.allSettled(variationPromises);
  
  // Collect successful variations
  const successfulVariations: { fileName: string; imageBase64: string }[] = [];
  for (const result of variationResults) {
    if (result.status === 'fulfilled' && result.value) {
      successfulVariations.push(result.value);
    }
  }
  
  if (successfulVariations.length === 0) {
    logger.warn("All DSD simulation variations failed");
    return null;
  }
  
  logger.log(`${successfulVariations.length} variations generated successfully`);
  
  // STEP 3: Try each variation with blend + quality verification
  // Keep trying until we get a result that passes quality check
  for (let i = 0; i < successfulVariations.length; i++) {
    const variation = successfulVariations[i];
    logger.log(`Attempting blend with variation ${i}...`);
    
    try {
      const blendedImageBase64 = await blendWithOriginal(
        imageBase64,
        variation.imageBase64,
        teethBounds,
        apiKey
      );
      
      if (blendedImageBase64) {
        // Verify quality before accepting
        const qualityResult = await verifySimulationQuality(
          imageBase64,
          blendedImageBase64,
          apiKey
        );
        
        if (qualityResult.passed) {
          // Quality check passed - upload and return
          const base64Data = blendedImageBase64.replace(/^data:image\/\w+;base64,/, "");
          const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
          
          const blendedFileName = `${userId}/dsd_verified_${Date.now()}.png`;
          
          const { error: uploadError } = await supabase.storage
            .from("dsd-simulations")
            .upload(blendedFileName, binaryData, {
              contentType: "image/png",
              upsert: true,
            });
          
          if (!uploadError) {
            logger.log("DSD simulation ready (verified quality)");
            return blendedFileName;
          }
        } else {
          logger.warn(`Variation ${i} failed quality check:`, qualityResult.issues);
          // Continue to next variation
        }
      }
    } catch (err) {
      logger.warn(`Blend error on variation ${i}:`, err);
    }
  }
  
  // If all blends failed quality check, try returning best raw variation
  // (with a warning logged)
  logger.warn("All blends failed quality check. Returning best raw variation as fallback.");
  
  // Upload first raw variation as fallback
  const fallbackVariation = successfulVariations[0];
  return fallbackVariation.fileName;
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
4. **Corredor Bucal**: Avalie o espaço escuro lateral ao sorrir
5. **Plano Oclusal**: Verifique se está nivelado ou inclinado
6. **Proporção Dourada**: Calcule a conformidade com a proporção áurea (0-100%)
7. **Simetria**: Avalie a simetria geral do sorriso (0-100%)

=== DETECÇÃO DE RESTAURAÇÕES - CRITÉRIOS RIGOROSOS ===
IMPORTANTE: Seja CONSERVADOR. Falsos positivos são PIORES que falsos negativos.
Inventar restaurações inexistentes prejudica o planejamento clínico e a confiança do paciente.

DIAGNOSTIQUE RESTAURAÇÃO APENAS SE HOUVER:
☑️ Interface de demarcação CLARAMENTE visível (linha nítida entre materiais)
☑️ Diferença de cor/opacidade ÓBVIA e INEQUÍVOCA (não sutil)
☑️ PELO MENOS 2 dos seguintes sinais adicionais:
   - Manchamento marginal EVIDENTE (linha escura/amarelada clara na borda)
   - Textura superficial VISIVELMENTE diferente
   - Contorno artificial ou excessivamente uniforme
   - Perda de polimento LOCALIZADA

REGRA DE OURO: SE NÃO TIVER ABSOLUTA CERTEZA → NÃO MENCIONE RESTAURAÇÃO

❌ NÃO confunda variação NATURAL de cor (cervical mais amarela, incisal translúcida) com restauração
❌ NÃO confunda hipoplasia/fluorose com restauração
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

    const { imageBase64, evaluationId, regenerateSimulationOnly, existingAnalysis, toothShape, additionalPhotos, patientPreferences } = validation.data;

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
