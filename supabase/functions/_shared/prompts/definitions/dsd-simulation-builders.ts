/**
 * DSD Simulation — Variant prompt builders (case-type + layer-specific).
 *
 * Each builder assembles a complete prompt from shared blocks for a specific scenario.
 */

import type { Params } from './dsd-simulation.ts'
import {
  buildAbsolutePreservation,
  buildWhiteningPrioritySection,
  buildBaseCorrections,
  buildTextureInstruction,
  buildQualityRequirements,
  PROPORTION_RULES,
} from './dsd-simulation-shared.ts'

// ===================================================================
// Case-type builders (reconstruction, restoration, intraoral, standard)
// ===================================================================

export function buildReconstructionPrompt(params: Params): string {
  const absolutePreservation = buildAbsolutePreservation()
  const whiteningPrioritySection = buildWhiteningPrioritySection(params)
  const baseCorrections = buildBaseCorrections()
  const textureInstruction = buildTextureInstruction(params.whiteningLevel)
  const qualityRequirements = buildQualityRequirements(params)
  const allowedChangesFromAnalysis = params.allowedChangesFromAnalysis || ''

  return `DENTAL PHOTO EDIT - RECONSTRUCTION + WHITENING

${absolutePreservation}

TASK: Edit ONLY the teeth. Everything else must be IDENTICAL to input.
${whiteningPrioritySection}DENTAL CORRECTIONS:
${baseCorrections}
${textureInstruction}

RECONSTRUCTION:
- ${params.specificInstructions || 'Fill missing teeth using adjacent teeth as reference'}
${allowedChangesFromAnalysis}

${PROPORTION_RULES}

${qualityRequirements}

Output: Same photo with ONLY teeth corrected.`
}

export function buildRestorationPrompt(params: Params): string {
  const absolutePreservation = buildAbsolutePreservation()
  const whiteningPrioritySection = buildWhiteningPrioritySection(params)
  const baseCorrections = buildBaseCorrections()
  const textureInstruction = buildTextureInstruction(params.whiteningLevel)
  const qualityRequirements = buildQualityRequirements(params)
  const allowedChangesFromAnalysis = params.allowedChangesFromAnalysis || ''

  return `DENTAL PHOTO EDIT - RESTORATION + WHITENING

${absolutePreservation}

TASK: Edit ONLY the teeth. Everything else must be IDENTICAL to input.
${whiteningPrioritySection}DENTAL CORRECTIONS:
${baseCorrections}
${textureInstruction}

RESTORATION FOCUS:
- For teeth ${params.restorationTeeth || '11, 21'}: REPLACE the restoration/crown color entirely to match surrounding teeth at target whitening level
- Blend interface lines to be invisible
- Dark or discolored crowns/restorations must become the SAME shade as adjacent natural teeth after whitening
- This is the PRIMARY visual change — the color replacement must be CLEARLY VISIBLE in the output
${allowedChangesFromAnalysis}

${PROPORTION_RULES}

${qualityRequirements}

Output: Same photo with ONLY teeth corrected.`
}

export function buildIntraoralPrompt(params: Params): string {
  const whiteningPrioritySection = buildWhiteningPrioritySection(params)
  const baseCorrections = buildBaseCorrections()
  const textureInstruction = buildTextureInstruction(params.whiteningLevel)
  const qualityRequirements = buildQualityRequirements(params)
  const allowedChangesFromAnalysis = params.allowedChangesFromAnalysis || ''

  return `DENTAL PHOTO EDIT - INTRAORAL + WHITENING

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

${PROPORTION_RULES}

${qualityRequirements}

Output: Same photo with ONLY teeth corrected.`
}

export function buildStandardPrompt(params: Params): string {
  const absolutePreservation = buildAbsolutePreservation()
  const whiteningPrioritySection = buildWhiteningPrioritySection(params)
  const baseCorrections = buildBaseCorrections()
  const textureInstruction = buildTextureInstruction(params.whiteningLevel)
  const qualityRequirements = buildQualityRequirements(params)
  const allowedChangesFromAnalysis = params.allowedChangesFromAnalysis || ''

  return `DENTAL PHOTO EDIT - WHITENING REQUESTED

${absolutePreservation}

TASK: Edit ONLY the teeth. Everything else must be IDENTICAL to input.

⚠️ LIP RULE: Do NOT move the upper or lower lip. The lip opening distance is FIXED.
${whiteningPrioritySection}DENTAL CORRECTIONS:
${baseCorrections}
${textureInstruction}
${allowedChangesFromAnalysis}

${PROPORTION_RULES}

${qualityRequirements}

Output: Same photo with ONLY teeth corrected.`
}

// ===================================================================
// Layer-specific builders
// ===================================================================

export function buildRestorationsOnlyPrompt(params: Params): string {
  const absolutePreservation = buildAbsolutePreservation()
  const baseCorrections = buildBaseCorrections()
  const textureInstruction = buildTextureInstruction(params.whiteningLevel)
  const qualityRequirements = buildQualityRequirements(params)
  const allowedChangesFromAnalysis = params.allowedChangesFromAnalysis || ''

  return `DENTAL PHOTO EDIT - RESTORATIONS ONLY (NO WHITENING)

${absolutePreservation}

TASK: Apply ONLY structural corrections to the teeth. Keep the NATURAL tooth color — NO whitening.

⚠️ CRITICAL RULE: This layer shows ONLY restorative corrections. You must:
- Fix chips, cracks, defects, and marginal staining on restorations
- Correct tooth shapes and contours as indicated by analysis
- Close gaps and harmonize proportions where indicated
- Replace old/stained restorations with material matching the CURRENT natural tooth color
- Apply all structural improvements from the analysis

⚠️ You must NOT:
- Whiten or brighten the teeth — keep the ORIGINAL natural color
- Make teeth lighter than they currently are
- The tooth color in the output must be IDENTICAL to the input color

⚠️ LIP RULE: Do NOT move the upper or lower lip. The lip opening distance is FIXED. Restoration corrections happen WITHIN the existing smile frame.

DENTAL CORRECTIONS:
${baseCorrections}
${textureInstruction}
${allowedChangesFromAnalysis}

${PROPORTION_RULES}

${qualityRequirements}

Output: Same photo with teeth structurally corrected but at their ORIGINAL natural color.`
}

export function buildWhiteningOnlyPrompt(params: Params): string {
  const absolutePreservation = buildAbsolutePreservation()

  return `DENTAL PHOTO EDIT - WHITENING ONLY (KEEP ALL CORRECTIONS)

${absolutePreservation}

TASK: The teeth in this image have ALREADY been structurally corrected (shape, gaps, contours fixed).
Now apply ONLY whitening — make the teeth brighter/whiter while keeping everything else IDENTICAL.
Keep ALL structural corrections EXACTLY as they are. Keep EVERYTHING else pixel-identical.

#1 TASK - WHITENING (${params.whiteningIntensity}):
${params.colorInstruction}
${params.whiteningLevel === 'hollywood' ? '⚠️ HOLLYWOOD = MAXIMUM BRIGHTNESS. Teeth must be DRAMATICALLY WHITE like porcelain veneers.' : params.whiteningLevel === 'white' ? '⚠️ MUDANÇA VISÍVEL OBRIGATÓRIA: O clareamento DEVE ser ÓBVIO na comparação. Se parecerem similares, FALHOU.' : ''}

WHAT TO CHANGE (ONLY):
- Tooth COLOR: make teeth whiter/brighter according to the whitening level above
- The whitening MUST be CLEARLY VISIBLE in a before/after comparison — this is the PRIMARY transformation
- Apply whitening HARMONIOUSLY across ALL visible teeth — darker/stained teeth receive more whitening to match lighter ones
- The final result must show COHERENT brightness across the smile, but ALLOW natural variation:
  • Canines (13/23) are NATURALLY 1-2 shades more saturated/yellowish than incisors — KEEP this relative difference
  • Incisal edges are more translucent than cervical third — PRESERVE this gradient
  • Small differences between individual teeth are NORMAL and make the result look REAL
- Maintain natural translucency gradients (more translucent at incisal edges, more opaque at cervical)

WHAT TO PRESERVE (DO NOT CHANGE — PIXEL-IDENTICAL):
- ALL structural corrections: tooth shape, contour, alignment, closed gaps, filled chips
- Tooth proportions and positions — EXACTLY as input
- Surface texture patterns (periquimacies, micro-texture)
- Lips, gums, skin, background — EVERYTHING outside teeth
- Lip opening distance — the vertical gap between lips is FIXED (do NOT lift upper lip or lower the lower lip)
- Image framing, crop, dimensions — IDENTICAL to input

Output: Same photo with teeth whitened to ${params.whiteningIntensity} level. All corrections preserved. Only color changed.`
}

export function buildGengivoplastyOnlyPrompt(params: Params): string {
  return `DENTAL PHOTO EDIT — PRIMARY TASK: GINGIVAL RECONTOURING

Input: ALREADY PROCESSED dental photo (teeth corrected + whitened).
Output dimensions MUST equal input dimensions.

YOUR SINGLE TASK: Reduce the visible pink gum tissue above the teeth to simulate gengivoplasty.
⚠️ If the output looks identical to the input, you have FAILED the task.

=== LIP DISTANCE RULE (SACRED — APPLIES TO THIS LAYER) ===
A DISTÂNCIA entre o lábio superior e o lábio inferior é FIXA e IMUTÁVEL.
Meça a distância vertical entre os lábios na entrada — a saída DEVE ter a MESMA distância exata.
- NÃO levantar o lábio superior (nem 1 pixel)
- NÃO abaixar o lábio inferior (nem 1 pixel)
- A abertura labial na saída = CÓPIA EXATA da abertura labial na entrada
Se você precisa mostrar mais resultado dental, faça isso DENTRO do espaço existente entre os lábios — NUNCA expanda a abertura.
⚠️ ERRO FREQUENTE DO MODELO: Levantar o lábio superior e abaixar o inferior para "mostrar mais resultado" — PROIBIDO

=== WHAT TO CHANGE (THIS IS THE WHOLE POINT) ===
${params.gingivoSuggestions ? `SPECIFIC TEETH TO RESHAPE:\n${params.gingivoSuggestions}\n` : `Reshape the gum line on all visible upper anterior teeth (canine to canine).\nTarget: 2-3mm apical movement of gingival margin per tooth.\n`}

HOW TO EXECUTE:
1. Identify the PINK GUM BAND between each tooth crown and the upper lip
2. For each affected tooth, move the gingival margin APICALLY (toward the root) by 2-3mm
3. REPLACE the removed pink gum pixels with TOOTH-COLORED pixels — the newly exposed area represents CERVICAL ENAMEL (clinical crown increase)
4. The tooth should appear LONGER (more clinical crown exposed) — this is the clinical goal of gengivoplasty
5. Copy the EXACT color, texture, and curvature from the adjacent visible tooth area for seamless blending
6. Create SYMMETRICAL gum line — left side mirrors right side
7. Create smooth, harmonious gingival arch across all visible teeth
8. Remaining gum tissue: healthy pink, smooth, realistic

=== ZENITH SYMMETRY & CLINICAL QUALITY (CRITICAL) ===
GINGIVAL ZENITH = highest point of the gum margin on each tooth (most apical point).
- Zenith of CONTRALATERAL teeth MUST be SYMMETRICAL: 11↔21, 12↔22, 13↔23
- Zenith of centrals (11/21): slightly DISTAL to the tooth's long axis
- Zenith of laterals (12/22): at or near the CENTER of the tooth — naturally ~1mm more coronal than centrals
- Zenith of canines (13/23): at or near the CENTER — same height as centrals or ~0.5mm more coronal
- INTERPROXIMAL PAPILLAE must remain intact and POINTED — do NOT flatten or remove papillae
- The resulting gingival contour should follow a SMOOTH SCALLOPED curve across the arch
- Each tooth's gum margin should have a gentle PARABOLIC curve (not a straight horizontal line)

MAGNITUDE REQUIREMENT (NON-NEGOTIABLE):
- The pink gum band MUST be visibly reduced by 30-40% — this is the WHOLE POINT of the simulation
- The difference between input and output MUST be obvious in a side-by-side comparison
- The upper portion of the pink gum band becomes tooth-colored enamel that matches what is already visible
- Newly exposed cervical area = seamless continuation of existing enamel (same color, texture, curvature)
- The clinical crown (visible tooth) should be LONGER than in the input — the patient sees MORE TOOTH, LESS GUM

=== QUALITY STANDARDS ===
- Gum-tooth margins: SMOOTH, crisp lines — no jagged edges, no pixelation
- No dark spots, shadows, or bruise-like patches at gum-tooth interface
- Remaining gum tissue: uniform healthy pink
- Result must look like a REAL clinical photo

=== WHAT NOT TO CHANGE ===
Keep identical to input: ALL existing tooth surfaces (shape, color, width, proportions), BOTH lips (position, shape, opening), face, skin, background, framing.
- Do NOT lift upper lip or lower the lower lip — LIP POSITION IS SACRED
- Do NOT widen, narrow, or reshape any tooth crown — tooth width is FIXED
- Dental midline (between 11/21) stays in the EXACT same position
- Width ratio between lateral and central incisors: PRESERVED
- ⚠️ COMMON ERROR: Model widens one central incisor to "fill space" after gum reduction — PROHIBITED
- ⚠️ COMMON ERROR: Model lifts upper lip to show more result — PROHIBITED (lip is a FIXED reference)

Output: Same photo with gum line clearly reshaped — teeth anatomically identical but LONGER (more clinical crown), pink gum band visibly reduced, lips UNMOVED.`
}

export function buildWithGengivoplastyPrompt(params: Params): string {
  // When input is already processed (Layer 2 output), use simplified gengivoplasty-only prompt
  if (params.inputAlreadyProcessed) {
    return buildGengivoplastyOnlyPrompt(params)
  }

  const absolutePreservation = buildAbsolutePreservation()
  const whiteningPrioritySection = buildWhiteningPrioritySection(params)
  const baseCorrections = buildBaseCorrections()
  const textureInstruction = buildTextureInstruction(params.whiteningLevel)
  const qualityRequirements = buildQualityRequirements(params)
  const allowedChangesFromAnalysis = params.allowedChangesFromAnalysis || ''

  return `DENTAL PHOTO EDIT - COMPLETE TREATMENT WITH GENGIVOPLASTY

${absolutePreservation}

COMBINED TASK (3 operations on the original photo):
1. DENTAL CORRECTIONS — correct tooth shape, alignment, contour as specified below
2. WHITENING — apply tooth whitening as specified below
3. GINGIVAL RECONTOURING — reshape gum margins to expose more clinical crown

All 3 operations apply to the SAME output image.

=== LIP PRESERVATION (SACRED RULE) ===
BOTH lips (upper AND lower) are FIXED ANATOMICAL REFERENCES — do NOT change their position, shape, opening, or contour.
Gengivoplasty modifies ONLY the gingival margin (pink tissue BETWEEN teeth and upper lip).
The lip opening distance is FIXED. Do NOT lift the upper lip or lower the lower lip.
If lips change, the clinical comparison is DESTROYED.

=== MIDLINE & TOOTH PROPORTIONS (SACRED RULE) ===
- The DENTAL MIDLINE (vertical line between 11/21) must stay in the EXACT same horizontal position
- The WIDTH of each individual tooth must be IDENTICAL to the input — gum reduction does NOT change tooth width
- Do NOT make central incisors wider/narrower to "fill space" after gum recontouring
- ⚠️ COMMON ERROR: Model widens one central incisor to "fill space" after gum reduction — PROHIBITED

=== GINGIVAL RECONTOURING (MUST BE VISIBLE) ===
Expose more clinical crown by moving the gingival margin APICALLY (toward the root):
- REDUCE the visible pink gum band by 30-40% — this is a GUM-ONLY operation and MUST be clearly visible in a side-by-side comparison
- Replace pink gum pixels with a seamless extension of the existing tooth enamel — copy color, texture, and curvature exactly
- Create symmetrical gingival zeniths between contralateral teeth
- Harmonize the gum line curvature across the smile
- Recontoured gums must look NATURAL (healthy pink tissue, smooth texture)
- Tooth shape, width, contour, and proportions are FIXED — only gum margin changes
- Gum margins must be SMOOTH, crisp lines — no jagged edges, no pixelation, no patchy artifacts
- No dark spots, shadows, or bruise-like patches at gum-tooth margins
- Newly exposed area must seamlessly continue the existing enamel surface
- Remaining gum tissue must be uniform healthy PINK

${params.gingivoSuggestions ? `GENGIVOPLASTY SPECIFICATIONS (per tooth):\n${params.gingivoSuggestions}\n` : ''}

${whiteningPrioritySection}DENTAL CORRECTIONS:
${baseCorrections}
${textureInstruction}
${allowedChangesFromAnalysis}

${PROPORTION_RULES}

${qualityRequirements}

Output: Same photo with teeth corrected, whitened, AND gingival recontouring applied.`
}

export function buildRootCoveragePrompt(params: Params): string {
  const absolutePreservation = buildAbsolutePreservation()
  const whiteningPrioritySection = buildWhiteningPrioritySection(params)
  const baseCorrections = buildBaseCorrections()
  const textureInstruction = buildTextureInstruction(params.whiteningLevel)
  const qualityRequirements = buildQualityRequirements(params)
  const allowedChangesFromAnalysis = params.allowedChangesFromAnalysis || ''

  return `DENTAL PHOTO EDIT - COMPLETE TREATMENT WITH ROOT COVERAGE

${absolutePreservation}

TASK: Edit teeth AND gingival contour. This is the COMPLETE treatment simulation including root coverage (recobrimento radicular).

⚠️ EXCEPTION TO GINGIVA PRESERVATION: In this layer, you ARE ALLOWED to modify the gingival contour.
The gum line should be recontoured to show the effect of root coverage:
- Cover exposed root surfaces by moving the gingival margin coronally (towards the crown)
- Create symmetrical gingival margins between contralateral teeth
- The covered areas must show healthy pink gingival tissue covering previously exposed root
- The recontoured gums must look NATURAL (pink, healthy tissue appearance)
- The gingival alteration MUST be VISUALLY EVIDENT in the before/after comparison
- Root surfaces that were exposed/yellowish should now be covered by healthy gum tissue

⚠️ REGRA ABSOLUTA SOBRE LÁBIOS (MESMO COM RECOBRIMENTO RADICULAR):
O recobrimento radicular altera APENAS a MARGEM GENGIVAL (interface gengiva-dente).
- AMBOS os lábios (superior E inferior) são REFERÊNCIAS FIXAS
- Mover QUALQUER lábio INVALIDA toda a análise clínica
- DEFINIÇÃO: Margem gengival = tecido rosa entre dente e lábio
- DEFINIÇÃO: Lábio = tecido vermelho/rosa com vermilion border
- O LÁBIO SUPERIOR permanece EXATAMENTE na mesma posição e formato
- O LÁBIO INFERIOR permanece EXATAMENTE na mesma posição e formato
- A ABERTURA LABIAL (distância entre lábios) é FIXA — não pode aumentar nem diminuir
- Ao mover a margem gengival coronalmente, o ESPAÇO entre lábio e dente DIMINUI
  (mostrando menos raiz exposta) — mas os LÁBIOS PERMANECEM EXATAMENTE ONDE ESTÃO
- Se não for possível simular recobrimento radicular sem mover os lábios: NÃO FAÇA
- ⚠️ ERRO COMUM: Levantar o lábio superior e/ou abaixar o inferior para "mostrar mais dente" — ISSO É PROIBIDO

${params.rootCoverageSuggestions ? `ROOT COVERAGE SPECIFICATIONS:\n${params.rootCoverageSuggestions}\n` : ''}

${whiteningPrioritySection}DENTAL CORRECTIONS:
${baseCorrections}
${textureInstruction}
${allowedChangesFromAnalysis}

${PROPORTION_RULES}

${qualityRequirements}

Output: Same photo with teeth corrected AND gingival root coverage applied.`
}

export function buildFaceMockupPrompt(params: Params): string {
  const whiteningConfig = params.whiteningLevel === 'hollywood'
    ? 'EXTREMELY WHITE (BL1) — porcelain veneer brightness, maximum whitening.'
    : params.whiteningLevel === 'white'
    ? 'CLEARLY WHITER — target shade A1 or brighter. Professional in-office whitening result.'
    : 'SUBTLY WHITER — 1-2 shades lighter (A1/A2). Natural, realistic whitening.';

  const allowedChangesFromAnalysis = params.allowedChangesFromAnalysis || '';

  const suggestionsBlock = allowedChangesFromAnalysis
    ? `\nDENTAL MODIFICATIONS TO APPLY:\n${allowedChangesFromAnalysis}\n`
    : '';

  return `Edit this FULL FACE PHOTO to show improved teeth in the smile.

ABSOLUTE RULES — VIOLATING ANY RULE INVALIDATES THE RESULT:
1. ONLY modify the TEETH visible in the smile opening. Nothing else.
2. The face must remain IDENTICAL: eyes, nose, skin texture, hair, ears, background, lighting, shadows.
3. The LIPS must stay in EXACTLY the same position, shape, color and size — do not move, reshape, recolor or resize them.
4. Keep the same camera angle, perspective, and photo quality.
5. The teeth should look NATURAL — not artificially perfect or CGI-like.
6. Output dimensions MUST equal input dimensions — do NOT crop or resize the image.
7. Do NOT zoom into the mouth area — the output must show the FULL FACE exactly as framed in the input.

=== FACE PRESERVATION (PIXEL-IDENTICAL) ===
Every pixel OUTSIDE the teeth area must be an EXACT COPY of the input:
- EYES: iris color, pupil, eyelids, eyelashes, eyebrows — IDENTICAL
- NOSE: shape, nostrils, bridge — IDENTICAL
- SKIN: texture, tone, pores, wrinkles, facial hair — IDENTICAL
- HAIR: color, style, position — IDENTICAL
- EARS, JAWLINE, CHIN, FOREHEAD — IDENTICAL
- LIPS: upper and lower lip shape, color, texture, vermillion border — IDENTICAL
- LIP OPENING: the vertical distance between upper and lower lip is FIXED
- GUMS: gingival contour, color, papillae — IDENTICAL (no gengivoplasty in this layer)
- BACKGROUND: every pixel — IDENTICAL
- LIGHTING: ambient light, shadows, highlights — IDENTICAL

=== TEETH EDITING ZONE ===
You may ONLY modify pixels that are TEETH (white/ivory enamel surfaces visible through the smile opening).

COLOR/WHITENING: ${whiteningConfig}
- Apply whitening COHERENTLY across ALL visible teeth
- Canines (13/23) are naturally 1-2 shades more saturated — PRESERVE this relative difference
- Incisal edges should maintain natural translucency — do NOT make them opaque
- Each tooth must retain individual micro-variations in color and texture

TOOTH SHAPE: ${params.toothShapeRecommendation?.toUpperCase() || 'NATURAL'}
${params.toothShapeRecommendation === 'natural' ? '- PRESERVE the current shape of each tooth' : `- Guide contours toward ${params.toothShapeRecommendation} form where corrections are applied`}
${suggestionsBlock}
TEXTURE & REALISM (CRITICAL):
- Maintain/create PERIQUIMACIES (subtle horizontal enamel lines)
- Preserve natural LIGHT REFLECTIONS on tooth surfaces
- Create TRANSLUCENCY GRADIENT: opaque cervical region → translucent incisal region
- Each tooth must have INDIVIDUAL characteristics — do NOT make them uniform
- The result must look like a REAL PHOTOGRAPH, not a digital render or CGI

=== WHAT NOT TO DO ===
- Do NOT lift the upper lip or lower the lower lip to "show more teeth"
- Do NOT reshape or recolor the lips
- Do NOT alter the gum line (gengivoplasty is handled in a separate layer)
- Do NOT change facial expression or head position
- Do NOT crop the image to focus on the mouth
- Do NOT add any artificial glow, halo, or smoothing to the face
- Do NOT make ALL teeth identical — natural variation between teeth is DESIRED

The final image must look like a real photograph of the SAME PERSON with naturally improved teeth.
Output: Full face photo with ONLY the teeth modified.`
}
