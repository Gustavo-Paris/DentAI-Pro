import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreFlight, createErrorResponse, ERROR_MESSAGES } from "../_shared/cors.ts";

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
  console.log("Detecting teeth region for mask...");
  
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            text: `Analyze this smile photo and return the EXACT bounding box coordinates of all visible teeth as a single region.

Return ONLY valid JSON with this exact structure:
{
  "bounds": {
    "x": <left edge as % of image width, 0-100>,
    "y": <top edge as % of image height, 0-100>,
    "width": <width as % of image width>,
    "height": <height as % of image height>
  }
}

Focus ONLY on the teeth area - do not include lips or gums in the bounding box.
The bounding box should tightly encompass ALL visible teeth.
Be precise - this will be used for image masking.`
          },
          { type: "image_url", image_url: { url: imageBase64 } },
        ],
      }],
    }),
  });
  
  if (!response.ok) {
    console.warn("Teeth mask detection failed:", response.status);
    throw new Error("Could not detect teeth region");
  }
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.bounds && typeof parsed.bounds.x === 'number') {
        console.log("Teeth region detected:", parsed.bounds);
        return { bounds: parsed.bounds };
      }
    } catch (e) {
      console.warn("Failed to parse teeth bounds JSON:", e);
    }
  }
  
  throw new Error("Could not parse teeth region coordinates");
}

// Blend simulation with original image - ONLY teeth from simulation, EVERYTHING ELSE from original
async function blendWithOriginal(
  originalBase64: string,
  simulationBase64: string,
  teethBounds: TeethBounds,
  apiKey: string
): Promise<string | null> {
  console.log("Blending simulation with original (absolute preservation)...");
  console.log("Teeth bounds for blend:", teethBounds);
  
  const blendPrompt = `You have TWO images of the SAME person:

IMAGE 1 (ORIGINAL): The patient's unedited smile photo
IMAGE 2 (SIMULATION): A version with whitened/improved teeth

YOUR TASK: Create a PERFECT BLEND where:

OUTSIDE THE TEETH (coordinates roughly ${teethBounds.x}%-${teethBounds.x + teethBounds.width}% horizontal, ${teethBounds.y}%-${teethBounds.y + teethBounds.height}% vertical):
- Use ONLY pixels from the ORIGINAL image
- Lips must be PIXEL-PERFECT identical to original
- Skin texture must be IDENTICAL to original
- Gums must be IDENTICAL to original
- Photo framing/dimensions must be IDENTICAL

INSIDE THE TEETH AREA:
- Use the improved/whitened teeth from the SIMULATION image

AT THE BOUNDARY:
- Create a smooth 2-3 pixel gradient for seamless transition

CRITICAL: The result must look like the ORIGINAL photo with ONLY the teeth improved.
The lips, skin, and all non-dental areas must be INDISTINGUISHABLE from the original.

Output the blended image with EXACT same dimensions as the original.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
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
    });

    if (!response.ok) {
      console.warn("Blend API call failed:", response.status);
      return null;
    }

    const data = await response.json();
    const blendedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (blendedImage) {
      console.log("Blend successful - lips/skin preserved from original");
      return blendedImage;
    }
    
    console.warn("No blended image in response");
    return null;
  } catch (err) {
    console.error("Blend error:", err);
    return null;
  }
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
  
  console.log(`Selecting best variation from ${variationUrls.length} options...`);
  
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
      console.warn("Failed to download variation for comparison:", e);
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
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
    });

    if (response.ok) {
      const data = await response.json();
      const choice = data.choices?.[0]?.message?.content?.trim().toUpperCase();
      
      if (choice === 'A') return variationUrls[0];
      if (choice === 'B' && variationUrls.length > 1) return variationUrls[1];
      if (choice === 'C' && variationUrls.length > 2) return variationUrls[2];
    }
  } catch (e) {
    console.warn("Variation comparison failed:", e);
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
    
    simulationPrompt = `Using this smile photo, reconstruct the missing/damaged teeth and whiten all teeth.

CRITICAL PRESERVATION RULE:
Keep the lips, skin, facial features, and image framing EXACTLY THE SAME as the original photo.
The ONLY change should be the teeth.

TEETH RECONSTRUCTION:
- ${specificInstructions || 'Reconstruct damaged/missing teeth using neighboring teeth as reference'}
- Whiten all teeth to shade A1/A2 (natural bright white)
- Make all teeth uniform in color and brightness
${patientDesires ? `- Patient wants: ${patientDesires}` : ''}

MANDATORY: The lips and skin texture must remain IDENTICAL to the original photo.
Do NOT change the photo angle, zoom, or composition.
Output the edited image with the exact same dimensions.`;

  } else if (needsRestorationReplacement) {
    // RESTORATION REPLACEMENT PROMPT - Ultra-short, preservation-first
    simulationPrompt = `Using this smile photo, change ONLY the teeth color and remove restoration interface lines.

CRITICAL PRESERVATION RULE:
Keep the lips, skin, facial features, and image framing EXACTLY THE SAME as the original photo.
Do not modify anything except the teeth.

TEETH EDIT:
- Whiten all visible teeth to shade A1/A2 (natural bright white)
- On teeth ${restorationTeeth || '11, 21'}: blend/remove any visible restoration interface lines
- Make the color uniform across all teeth (no color variation)
- Harmonize asymmetric lateral incisors (12 vs 22) if needed
${patientDesires ? `- Patient wants: ${patientDesires}` : ''}

The lips and skin must be PIXEL-PERFECT identical to the input image.
Output the edited image with the exact same dimensions.`;

  } else if (isIntraoralPhoto) {
    // INTRAORAL PROMPT - Ultra-short
    simulationPrompt = `Using this intraoral dental photo, whiten the teeth.

EDIT:
- Change all visible teeth to white shade A1/A2
- Remove stains and discoloration
- Make color uniform
${patientDesires ? `- Patient wants: ${patientDesires}` : ''}

PRESERVE: Gums, background, image dimensions - keep exactly as original.`;

  } else {
    // STANDARD PROMPT - Ultra-short, preservation-first
    simulationPrompt = `Using this smile photo, change ONLY the teeth color.

CRITICAL PRESERVATION RULE:
Keep the lips, skin, facial features, and image framing EXACTLY THE SAME as the original photo.
Do not modify anything except the teeth.

TEETH EDIT:
- Whiten all visible teeth to shade A1/A2 (natural bright white)
- Remove any stains, yellowing, or discoloration
- Make the color uniform across all teeth
- Harmonize asymmetric lateral incisors (12 vs 22) if shapes differ
${patientDesires ? `- Patient wants: ${patientDesires}` : ''}

The lips, skin texture, and photo composition must be PIXEL-PERFECT identical to the input image.
Output the edited image with the exact same dimensions.`;
  }

  const promptType = needsReconstruction ? 'reconstruction' : 
                     (needsRestorationReplacement ? 'restoration-replacement' : 
                     (isIntraoralPhoto ? 'intraoral' : 'standard'));
  
  console.log("DSD Simulation Request:", {
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
    console.warn("Could not detect teeth mask, using fallback bounds:", err);
  }

  // STEP 2: Generate simulation variations
  const NUM_VARIATIONS = 3;
  const modelsToTry = ["google/gemini-2.5-flash-image-preview", "google/gemini-3-pro-image-preview"];
  
  const generateSingleVariation = async (variationIndex: number): Promise<{ fileName: string; imageBase64: string } | null> => {
    for (const model of modelsToTry) {
      try {
        console.log(`Variation ${variationIndex}: Trying ${model}`);
        
        const simulationResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        });

        if (!simulationResponse.ok) {
          console.warn(`Variation ${variationIndex} - ${model} failed:`, simulationResponse.status);
          continue;
        }

        const simData = await simulationResponse.json();
        const generatedImage = simData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!generatedImage) {
          console.warn(`Variation ${variationIndex} - No image from ${model}`);
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
          console.error(`Variation ${variationIndex} upload error:`, uploadError);
          return null;
        }

        console.log(`Variation ${variationIndex} generated successfully with ${model}`);
        return { fileName, imageBase64: generatedImage };
      } catch (err) {
        console.warn(`Variation ${variationIndex} - ${model} error:`, err);
        continue;
      }
    }
    return null;
  };

  // Generate variations in parallel
  console.log(`Generating ${NUM_VARIATIONS} DSD variations in parallel...`);
  
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
    console.warn("All DSD simulation variations failed");
    return null;
  }
  
  console.log(`${successfulVariations.length} variations generated successfully`);
  
  // STEP 3: Blend best variation with original (ABSOLUTE PRESERVATION)
  // Use first successful variation for blending
  const bestVariation = successfulVariations[0];
  
  try {
    const blendedImageBase64 = await blendWithOriginal(
      imageBase64,
      bestVariation.imageBase64,
      teethBounds,
      apiKey
    );
    
    if (blendedImageBase64) {
      // Upload blended result
      const base64Data = blendedImageBase64.replace(/^data:image\/\w+;base64,/, "");
      const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      
      const blendedFileName = `${userId}/dsd_blended_${Date.now()}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from("dsd-simulations")
        .upload(blendedFileName, binaryData, {
          contentType: "image/png",
          upsert: true,
        });
      
      if (!uploadError) {
        console.log("DSD simulation ready (blended with original for absolute preservation)");
        return blendedFileName;
      } else {
        console.warn("Blended upload failed, returning raw variation:", uploadError);
      }
    }
  } catch (blendErr) {
    console.warn("Blend step failed, returning raw variation:", blendErr);
  }
  
  // Fallback: return raw variation if blend fails
  console.log("DSD simulation ready (raw variation, blend unavailable)");
  return bestVariation.fileName;
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

=== DETECÇÃO CRÍTICA DE RESTAURAÇÕES EXISTENTES ===
ANTES de fazer qualquer elogio estético, você DEVE examinar CADA dente visível para sinais de restaurações prévias.

SINAIS DE RESTAURAÇÕES DE RESINA (procure atentamente):
- Interface visível (linha onde a resina encontra o esmalte natural)
- Diferença de cor/translucidez DENTRO do mesmo dente
- Manchamento marginal (linha amarelada/acinzentada na borda da restauração)
- Textura diferente entre superfícies (áreas mais lisas ou mais opacas)
- Contorno artificial ou excessivamente uniforme
- Perda de polimento em partes do dente
- Cor mais opaca/artificial comparada a dentes adjacentes naturais

DIFERENCIAÇÃO CRÍTICA:
- Dente NATURAL saudável: gradiente de cor cervical→incisal, translucidez uniforme, micro-textura orgânica
- Dente com RESINA: cor mais uniforme/artificial, interface visível, possível manchamento marginal

REGRAS PARA RESTAURAÇÕES DETECTADAS:
1. NÃO diga "excelente resultado estético" se restaurações com defeitos estão presentes
2. NÃO elogie "translucidez natural" em dentes claramente restaurados
3. IDENTIFIQUE cada dente restaurado com problema específico
4. PRIORIZE sugestão de "Substituição de restauração" sobre mudanças cosméticas sutis

TIPOS DE PROBLEMAS EM RESTAURAÇÕES ANTIGAS:
- "Restauração com manchamento marginal"
- "Interface visível entre resina e esmalte"
- "Restauração com cor inadequada"
- "Restauração com perda de anatomia"
- "Restauração classe IV com contorno artificial"
- "Restauração com perda de polimento"

OBSERVAÇÃO OBRIGATÓRIA:
Se detectar restaurações com problemas, DEVE incluir nas observações:
"ATENÇÃO: Restauração(ões) de resina detectada(s) em [dentes]. Apresentam [problema]. Recomenda-se substituição."

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
PRIORIDADE 1: Restaurações com infiltração/manchamento (saúde bucal)
PRIORIDADE 2: Restaurações com cor/anatomia inadequada (estética funcional)
PRIORIDADE 3: Melhorias em dentes naturais (refinamento estético)

TIPOS DE SUGESTÕES PERMITIDAS:

A) SUBSTITUIÇÃO DE RESTAURAÇÃO (prioridade alta):
   - current_issue: "Restauração classe IV com manchamento marginal e interface visível"
   - proposed_change: "Substituir por nova restauração com melhor adaptação de cor e contorno"

B) TRATAMENTO CONSERVADOR (para dentes naturais sem restauração):
   - current_issue: "Bordo incisal irregular"
   - proposed_change: "Aumentar 1mm com lente de contato"

=== IDENTIFICAÇÃO PRECISA DE DENTES (OBRIGATÓRIO) ===
ANTES de listar sugestões, identifique CADA dente CORRETAMENTE:

CRITÉRIOS DE IDENTIFICAÇÃO FDI - MEMORIZE:
- CENTRAIS (11, 21): MAIORES, mais LARGOS, bordos mais RETOS
- LATERAIS (12, 22): MENORES (~20-30% mais estreitos), contorno mais ARREDONDADO/OVAL
- CANINOS (13, 23): PONTIAGUDOS, proeminência vestibular

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
   - Se o paciente tem múltiplos dentes com restaurações antigas, liste TODOS
   - Ordene por prioridade: problemas de saúde > estética funcional > refinamento
   - O dentista precisa ver o escopo COMPLETO para planejar orçamento

REGRAS ESTRITAS:
✅ PERMITIDO: identificar e sugerir substituição de restaurações antigas
✅ PERMITIDO: aumentar levemente comprimento, fechar pequenos espaços, harmonizar contorno
❌ PROIBIDO: elogiar restaurações que claramente têm problemas
❌ PROIBIDO: ignorar diferenças de cor/textura entre áreas do dente
❌ PROIBIDO: dizer "excelente resultado" se restaurações antigas com defeitos estão presentes
❌ PROIBIDO: focar em melhorias sutis quando restaurações precisam ser substituídas
❌ PROIBIDO: diminuir, encurtar, mudanças dramáticas de forma
❌ PROIBIDO: sugerir "dentes brancos", "clareamento Hollywood" ou cor artificial
❌ PROIBIDO: sugerir tratamentos para dentes AUSENTES ou com destruição severa

Exemplo BOM (substituição): "Restauração classe IV do 11 com interface visível" → "Substituir por nova restauração com melhor adaptação"
Exemplo BOM (conservador): "Aumentar bordo incisal do 21 em 1mm para harmonizar altura com 11"
Exemplo RUIM: "Excelente translucidez natural" em dente com restauração visível - NÃO USAR

FILOSOFIA: Primeiro identifique problemas em restaurações existentes, depois considere melhorias em dentes naturais.

OBSERVAÇÕES:
Inclua 2-3 observações clínicas objetivas sobre o sorriso.
Se detectar restaurações com problemas, PRIORIZE alertar sobre elas.
Se identificar limitações para simulação, inclua uma observação com "ATENÇÃO:" explicando.

IMPORTANTE:
- Seja CRÍTICO ao avaliar restaurações existentes
- Priorize identificar problemas em trabalhos anteriores
- TODAS as sugestões devem ser clinicamente realizáveis
- Se o caso NÃO for adequado para DSD, AINDA forneça a análise de proporções mas marque confidence="baixa"`;

  const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
  });

  if (!analysisResponse.ok) {
    const status = analysisResponse.status;
    if (status === 429) {
      return createErrorResponse(ERROR_MESSAGES.RATE_LIMITED, 429, corsHeaders, "RATE_LIMITED");
    }
    if (status === 402) {
      return createErrorResponse(ERROR_MESSAGES.PAYMENT_REQUIRED, 402, corsHeaders, "PAYMENT_REQUIRED");
    }
    console.error("AI analysis error:", status, await analysisResponse.text());
    return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
  }

  const analysisData = await analysisResponse.json();
  const toolCall = analysisData.choices?.[0]?.message?.tool_calls?.[0];

  if (toolCall?.function?.arguments) {
    try {
      return JSON.parse(toolCall.function.arguments) as DSDAnalysis;
    } catch {
      console.error("Failed to parse tool call arguments");
      return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
    }
  }

  console.error("No tool call in response");
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
      console.error("Missing required environment variables");
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
      console.log(`DSD analysis with additional photos: smile45=${!!additionalPhotos.smile45}, face=${!!additionalPhotos.face}`);
    }
    if (patientPreferences) {
      console.log(`DSD analysis with patient preferences: goals=${!!patientPreferences.aestheticGoals}, changes=${patientPreferences.desiredChanges?.length || 0}`);
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
      console.log("Severe destruction detected:", destructionCheck.reason);
      simulationNote = destructionCheck.reason || undefined;
    }

    // Generate simulation image
    let simulationUrl: string | null = null;
    try {
      simulationUrl = await generateSimulation(imageBase64, analysis, user.id, supabase, LOVABLE_API_KEY, toothShape || 'natural', patientPreferences);
    } catch (simError) {
      console.error("Simulation error:", simError);
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
    console.error("DSD generation error:", error);
    return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
  }
});
