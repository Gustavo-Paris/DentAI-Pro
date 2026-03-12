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
  buildGingivalTextureRules,
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
- Apply whitening HARMONIOUSLY across ALL visible teeth — darker/stained teeth receive MORE whitening to match lighter ones
- The final result must show COHERENT brightness across the smile, but ALLOW minimal natural variation:
  • Canines (13/23) must be whitened AGGRESSIVELY — reduce their natural yellow saturation to at most 0.5 shade darker than incisors (NOT 1-2 shades as natural)
  • Incisal edges are more translucent than cervical third — PRESERVE this gradient
  • Small differences between individual teeth are NORMAL and make the result look REAL
- PREMOLARS (14/15/24/25): If visible, they MUST receive the SAME whitening treatment as anterior teeth — do NOT leave them at their original darker shade
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
  const gingivalTextureRules = buildGingivalTextureRules()
  return `EDIT THIS DENTAL PHOTO: Make the pink gum band above the teeth SMALLER.

The teeth have already been corrected and whitened. Your ONLY job is to REDUCE the visible pink gum tissue.
⚠️ If the output gum looks the same as the input, you have FAILED.

=== STEP-BY-STEP INSTRUCTIONS ===
1. Look at the PINK BAND between the top of each tooth and the upper lip
2. PAINT OVER the bottom portion of that pink band with TOOTH-COLORED ENAMEL
   → Use the same ivory/white color as the existing tooth surface just below
3. Each tooth should now look TALLER — you are revealing more tooth by shrinking the gum
4. The gum that remains should still look like healthy pink tissue
5. Make it SYMMETRICAL — left side mirrors right side

VISUAL REFERENCE — before vs after:
- BEFORE: [lip] — [2cm pink gum] — [tooth crown] — [lower lip]
- AFTER:  [lip] — [1cm pink gum] — [TALLER tooth crown] — [lower lip]
The pink band gets roughly 30-40% shorter. The tooth gets 30-40% taller at the top.

${params.gingivoSuggestions ? `SPECIFIC TEETH TO RESHAPE:\n${params.gingivoSuggestions}\n` : `Apply to all visible upper front teeth (canine to canine — teeth 13, 12, 11, 21, 22, 23).\n`}

=== HOW TO FILL THE EXPOSED AREA ===
- The newly visible area (where gum was removed) should look like CERVICAL ENAMEL
- Copy the EXACT color, texture and shine from the tooth surface directly below
- Blend seamlessly — no visible line between old and new tooth surface
- Maintain natural translucency gradient (more opaque near gum, more translucent at tip)

${gingivalTextureRules}

=== GUM LINE SHAPE ===
- Each tooth's gum edge should form a gentle ARCH (parabolic curve), not a straight line
- The highest point of the gum on each tooth should be slightly toward the back of the tooth
- Gum height should be SYMMETRICAL between matching teeth (11↔21, 12↔22, 13↔23)
- Lateral incisors (12/22) naturally show slightly MORE gum than centrals — keep this pattern
- Keep the POINTED papillae (triangular gum tips between teeth) intact

=== MAGNITUDE (THIS IS CRITICAL — BE BOLD) ===
- Each tooth must show CLEARLY MORE crown than the input — the change must be OBVIOUS
- Target: reduce the pink gum band by approximately 30-40%
${params.gingivoSuggestions?.includes('gingival_reduction_pct') ? '- Follow the specific reduction percentages from the analysis above' : '- If gum band is 4mm visible, reduce to ~2.5mm. If 3mm, reduce to ~2mm.'}
- Maximum 2mm of gum reduction per tooth (biological safety limit)
- The reduction should be GRADUAL between adjacent teeth — no abrupt steps
- ⚠️ MOST COMMON FAILURE: Change is too subtle. A dentist must INSTANTLY see the difference.

=== QUALITY ===
- Gum-tooth borders: SMOOTH, crisp, no jagged edges or pixelation
- No dark spots or shadows at the new gum-tooth boundary
- Remaining gum: uniform healthy pink with natural stippling texture
- Result must look like a REAL clinical photograph

=== DO NOT CHANGE ===
- Teeth: keep ALL existing tooth surfaces identical (shape, color, width, proportions)
- Lips: keep BOTH lips in EXACTLY the same position — do NOT lift upper lip or lower the lower lip
- Tooth width: do NOT make any tooth wider or narrower
- Face, skin, background, framing: keep identical to input
- Output dimensions MUST equal input dimensions

Output: Same photo with SMALLER pink gum band, TALLER teeth, lips UNMOVED.`
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
  const gingivalTextureRules = buildGingivalTextureRules()
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

=== TOOTH INDIVIDUALITY PRESERVED (CRITICAL) ===
Each tooth is a UNIQUE INDIVIDUAL with its own anatomy. Gingival recontouring exposes MORE of the existing crown — it does NOT redesign or reshape the crown.
- After gengivoplasty, each tooth crown must look EXACTLY like before — same shape, same proportions, same individual characteristics
- Do NOT make teeth look more uniform, symmetric, or "ideal" — natural variations ARE the patient's identity
- Do NOT redesign tooth anatomy because gum is being modified — the crown shape is FIXED
- ⚠️ MOST COMMON FAILURE for this layer: Gemini "improves" all teeth to look uniform while doing gingival reduction. PROHIBITED.
- If tooth 12 is longer than 11 in the input, it remains proportionally longer in the output — gum reduction does NOT equalize tooth lengths
- Individual irregularities, rotations, and size differences between teeth: PRESERVE EXACTLY as input

=== GINGIVAL RECONTOURING (MUST BE VISIBLE — #1 DIFFERENTIATOR OF THIS LAYER) ===
Expose more clinical crown by moving the gingival margin APICALLY (toward the root):
- Move each gingival margin APICALLY by 1.5-2mm — this is a GUM-ONLY operation and MUST be IMMEDIATELY obvious in a side-by-side comparison
- Each tooth MUST show 1.5-2mm MORE clinical crown than the input (maximum 2mm for biological safety)
- ⚠️ If the gum change is not instantly visible, this layer is WORTHLESS — be BOLD, not subtle
- Replace pink gum pixels with a seamless extension of the existing tooth enamel — copy color, texture, and curvature exactly
- Create symmetrical gingival zeniths between contralateral teeth
- Harmonize the gum line curvature across the smile
- Recontoured gums must look NATURAL (healthy pink tissue, smooth texture)
- Tooth shape, width, contour, and proportions are FIXED — only gum margin changes
- Gum margins must be SMOOTH, crisp lines — no jagged edges, no pixelation, no patchy artifacts
- No dark spots, shadows, or bruise-like patches at gum-tooth margins
- Newly exposed area must seamlessly continue the existing enamel surface
- Remaining gum tissue must be uniform healthy PINK

${gingivalTextureRules}

MAGNITUDE DO CORTE GENGIVAL:
- Use os valores de gingival_reduction_pct da analise quando disponiveis no contexto (ex: "dente 11: reduzir ~15%")
- Se NAO disponiveis, calcule pela proporcao ideal: largura/comprimento alvo = 75-80% (golden ratio)
- MAXIMO absoluto de reducao: 2mm (seguranca biologica — alem disso requer osteotomia)
- A reducao deve ser GRADUAL entre dentes adjacentes — NAO pode haver degrau abrupto de gengiva
- Zenith gengival: posicionar ligeiramente distal ao eixo longo do dente (anatomia natural)
- Simetria: reducao SIMETRICA entre dentes homologos (11=21, 12=22, 13=23)
- Se a analise indica proporcao coroa/raiz desfavoravel (raiz curta), REDUZIR a magnitude em 50%

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
- Canines (13/23) must be whitened aggressively — at most 0.5 shade more saturated than incisors in the final result
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
