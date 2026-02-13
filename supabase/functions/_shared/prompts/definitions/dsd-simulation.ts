import type { PromptDefinition } from '../types.ts'

export interface Params {
  /** Whitening level selected by user */
  whiteningLevel: 'natural' | 'white' | 'hollywood'
  /** Whitening instruction text (from WHITENING_INSTRUCTIONS mapping), prefixed with "- " */
  colorInstruction: string
  /** Whitening intensity label (NATURAL, NOTICEABLE, MAXIMUM) */
  whiteningIntensity: string
  /** Case type determines which variant prompt to use */
  caseType: 'reconstruction' | 'restoration-replacement' | 'intraoral' | 'standard'
  /** Patient face shape from analysis */
  faceShape: string
  /** Recommended tooth shape from analysis or user selection */
  toothShapeRecommendation: string
  /** Smile arc classification */
  smileArc: string
  /** Specific reconstruction instructions (e.g., "Dente 11: COPIE do 21, Dente 12: COPIE do 22") */
  specificInstructions?: string
  /** Comma-separated list of teeth needing restoration replacement */
  restorationTeeth?: string
  /** Allowed changes from filtered analysis suggestions */
  allowedChangesFromAnalysis?: string
  /** Layer type for multi-layer simulation (overrides caseType routing when set) */
  layerType?: 'restorations-only' | 'whitening-restorations' | 'complete-treatment' | 'root-coverage'
  /** Gengivoplasty suggestions text, injected for complete-treatment layer */
  gingivoSuggestions?: string
  /** Root coverage suggestions text, injected for root-coverage layer */
  rootCoverageSuggestions?: string
  /** When true, the input image already has corrected/whitened teeth (Layer 2 output).
   *  The prompt should ONLY apply gingival recontouring — no whitening, no base corrections. */
  inputAlreadyProcessed?: boolean
}

// --- Shared prompt blocks ---

function buildTextureInstruction(): string {
  return `TEXTURA NATURAL DO ESMALTE (CRÍTICO para realismo):
- Manter/criar PERIQUIMÁCIES (linhas horizontais sutis no esmalte)
- Preservar REFLEXOS DE LUZ naturais nos pontos de brilho
- Criar GRADIENTE DE TRANSLUCIDEZ: opaco cervical → translúcido incisal
- Manter variações sutis de cor entre dentes adjacentes (100% idênticos = artificial)
- Preservar CARACTERIZAÇÕES naturais visíveis (manchas brancas sutis, craze lines)
- NÃO criar aparência de "porcelana perfeita" ou "dentes de comercial de TV"`
}

function buildAbsolutePreservation(): string {
  return `🔒 INPAINTING MODE - DENTAL SMILE ENHANCEMENT 🔒

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
  • GENGIVA: Cor rosa, contorno, papilas interdentais, zênites gengivais - PRESERVAR EXATAMENTE
    ⚠️ PROIBIÇÃO TOTAL DE GENGIVOPLASTIA: A LINHA GENGIVAL (margem onde gengiva encontra dente) DEVE ser IDÊNTICA à entrada.
    Se o paciente tem sorriso gengival, MANTENHA COMO ESTÁ. NÃO tente "melhorar" removendo gengiva.
    Gengivoplastia será simulada em camada separada — NÃO aplique nesta camada.
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
Dimensões de saída DEVEM ser iguais às dimensões de entrada.

=== PERSONALIZAÇÃO POR PACIENTE (CRÍTICO) ===
⚠️ CADA PACIENTE É ÚNICO - NÃO APLIQUE UM TEMPLATE GENÉRICO!
- Os dentes deste paciente têm contornos, proporções e características ÚNICAS
- NÃO aplique um "sorriso ideal genérico" ou "template de sorriso perfeito"
- A simulação DEVE respeitar a anatomia INDIVIDUAL deste paciente:
  • Contorno gengival ORIGINAL (zênites, papilas, altura) — PRESERVAR EXATAMENTE
  • Proporção largura/altura dos dentes ORIGINAIS — manter relação
  • Características faciais únicas (formato labial, corredor bucal)
- O resultado deve parecer uma MELHORIA NATURAL deste paciente específico
- NÃO deve parecer que os dentes foram "copiados" de outra pessoa

REFERÊNCIA ANATÔMICA FIXA:
Os lábios (superior E inferior) definem a MOLDURA DO SORRISO.
- O lábio superior define a LINHA DO SORRISO — referência para diagnóstico de sorriso gengival
- O lábio inferior define a CURVA DO SORRISO — referência para arco do sorriso
- A ABERTURA LABIAL (distância entre lábios) define a EXPOSIÇÃO DENTAL
Alterar QUALQUER lábio = destruir o diagnóstico e a comparação antes/depois.
O contorno, posição, formato e abertura dos lábios são IMUTÁVEIS em TODAS as camadas.
⚠️ LÁBIOS SÃO A REFERÊNCIA DIAGNÓSTICA — MOVER LÁBIOS = DESTRUIR O CASO
⚠️ ERRO FREQUENTE DO MODELO: Levantar o lábio superior e abaixar o inferior para "mostrar mais resultado" — PROIBIDO`
}

function buildWhiteningPrioritySection(params: Params): string {
  return `
#1 TASK - WHITENING (${params.whiteningIntensity}):
${params.colorInstruction}
${params.whiteningLevel === 'hollywood' ? '⚠️ HOLLYWOOD = MAXIMUM BRIGHTNESS. Teeth must be DRAMATICALLY WHITE like porcelain veneers.' : ''}

`
}

function buildVisagismContext(params: Params): string {
  return `
=== CONTEXTO DE VISAGISMO (GUIA ESTÉTICO) ===
Formato facial do paciente: ${params.faceShape.toUpperCase()}
Formato de dente recomendado: ${params.toothShapeRecommendation.toUpperCase()}
Arco do sorriso: ${params.smileArc.toUpperCase()}

REGRAS DE VISAGISMO PARA SIMULAÇÃO:
${params.toothShapeRecommendation === 'quadrado' ? '- Manter/criar ângulos mais definidos nos incisivos, bordos mais retos' : ''}
${params.toothShapeRecommendation === 'oval' ? '- Manter/criar contornos arredondados e suaves nos incisivos' : ''}
${params.toothShapeRecommendation === 'triangular' ? '- Manter proporção mais larga incisal, convergindo para cervical' : ''}
${params.toothShapeRecommendation === 'retangular' ? '- Manter proporção mais alongada, bordos paralelos' : ''}
${params.toothShapeRecommendation === 'natural' ? '- PRESERVAR o formato atual dos dentes do paciente' : ''}
${params.smileArc === 'plano' ? '- Considerar suavizar a curva incisal para acompanhar lábio inferior' : ''}
${params.smileArc === 'reverso' ? '- ATENÇÃO: Arco reverso precisa de tratamento clínico real' : ''}
`
}

function buildQualityRequirements(params: Params): string {
  const visagismContext = buildVisagismContext(params)
  return `
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
- Os dentes devem ser VISIVELMENTE MAIS BRANCOS que a entrada, mas ainda naturais

⚠️ VALIDAÇÃO GENGIVAL (CRÍTICO):
- A LINHA GENGIVAL na saída DEVE ser IDÊNTICA à entrada — compare pixel a pixel
- Se o paciente mostra gengiva ao sorrir (sorriso gengival), MANTENHA ASSIM
- NÃO remova gengiva, NÃO recontorne a margem gengival, NÃO faça gengivoplastia
- Qualquer alteração na margem gengival = REJEIÇÃO AUTOMÁTICA`
}

function buildBaseCorrections(): string {
  return `CORREÇÕES DENTÁRIAS (manter aparência NATURAL):
1. Preencher buracos, lascas ou defeitos visíveis nas bordas dos dentes
2. Remover manchas escuras pontuais (mas manter variação natural de cor)
3. Fechar pequenos espaços adicionando material nos pontos de contato (exceção: conoides e shape corrections devem ser aplicados com volume visível)
4. PRESERVAR mamelons se visíveis (projeções naturais da borda incisal)
5. MANTER micro-textura natural do esmalte - NÃO deixar dentes "lisos demais"
6. PRESERVAR translucidez incisal natural - NÃO tornar dentes opacos uniformemente
7. Corrigir formato de incisivos laterais conoides (12/22) - aumentar largura e comprimento para proporção adequada
8. Aplicar contorno recomendado pelo visagismo quando o formato atual for inadequado

SHAPE CORRECTIONS (quando análise sugere):
- Modificar contornos dos dentes para harmonizar com recommended_tooth_shape
- Para laterais conoides: adicionar volume para proporção adequada (lateral = ~62% da largura do central)
- Para dentes com formato inadequado ao visagismo: ajustar contornos suavemente`
}

const PROPORTION_RULES = `PROPORTION RULES:
- Keep original tooth width proportions for teeth that DON'T need correction
- For teeth identified in allowedChangesFromAnalysis or with conoid/microdontia diagnosis: APPLY VISIBLE volume increase (at least 15-20% width change for conoid laterals)
- For dark/old crowns or restorations: REPLACE the color completely to match target whitening level
- Only add material to fill defects on HEALTHY teeth - reshape contours when clinically indicated by analysis
- Maintain natural width-to-height ratio EXCEPT when shape correction is prescribed
- NEVER make teeth appear thinner or narrower than original`

// --- Variant builders ---

function buildReconstructionPrompt(params: Params): string {
  const absolutePreservation = buildAbsolutePreservation()
  const whiteningPrioritySection = buildWhiteningPrioritySection(params)
  const baseCorrections = buildBaseCorrections()
  const textureInstruction = buildTextureInstruction()
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

function buildRestorationPrompt(params: Params): string {
  const absolutePreservation = buildAbsolutePreservation()
  const whiteningPrioritySection = buildWhiteningPrioritySection(params)
  const baseCorrections = buildBaseCorrections()
  const textureInstruction = buildTextureInstruction()
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

function buildIntraoralPrompt(params: Params): string {
  const whiteningPrioritySection = buildWhiteningPrioritySection(params)
  const baseCorrections = buildBaseCorrections()
  const textureInstruction = buildTextureInstruction()
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

function buildStandardPrompt(params: Params): string {
  const absolutePreservation = buildAbsolutePreservation()
  const whiteningPrioritySection = buildWhiteningPrioritySection(params)
  const baseCorrections = buildBaseCorrections()
  const textureInstruction = buildTextureInstruction()
  const qualityRequirements = buildQualityRequirements(params)
  const allowedChangesFromAnalysis = params.allowedChangesFromAnalysis || ''

  return `DENTAL PHOTO EDIT - WHITENING REQUESTED

${absolutePreservation}

TASK: Edit ONLY the teeth. Everything else must be IDENTICAL to input.
${whiteningPrioritySection}DENTAL CORRECTIONS:
${baseCorrections}
${textureInstruction}
${allowedChangesFromAnalysis}

${PROPORTION_RULES}

${qualityRequirements}

Output: Same photo with ONLY teeth corrected.`
}

// --- Layer-specific builders ---

function buildDewhiteningPrompt(params: Params): string {
  const absolutePreservation = buildAbsolutePreservation()

  return `DENTAL PHOTO EDIT - REVERT WHITENING ONLY (KEEP ALL CORRECTIONS)

${absolutePreservation}

TASK: The teeth in this image have ALREADY been structurally corrected AND whitened.
Now REVERT ONLY the whitening — restore the NATURAL original tooth color while keeping every structural correction EXACTLY as-is.

⚠️ THIS IS A COLOR-ONLY OPERATION:
- Reduce the whitening effect SLIGHTLY — teeth should look like healthy natural teeth, NOT artificially yellow
- The result should look like professional dental work WITHOUT whitening (clean, healthy, natural shade)
- Keep ALL structural corrections: shape, contour, alignment, closed gaps, filled chips — EXACTLY as input
- Do NOT add new corrections, do NOT change tooth shape or position
- Do NOT change gum line, gum color, or any gingival tissue — PRESERVE EXACTLY as input
- The ONLY visible change should be tooth color: from whitened → slightly less white

COLOR GUIDANCE:
- Reduce whiteness by approximately 20-30% — NOT a dramatic change
- Target: teeth that look naturally healthy (B1-A2 shade range), NOT yellow or discolored
- ⚠️ Do NOT make teeth YELLOW, GREY, or STAINED — just slightly less white than the input
- The difference between input and output should be SUBTLE, not dramatic
- Maintain natural translucency gradients (more translucent at incisal edges)
- Keep subtle color variation between teeth (don't make them perfectly uniform)
- Preserve surface texture and light reflections exactly
- If in doubt, make LESS change rather than more — a subtle reduction is better than over-yellowing

WHAT TO PRESERVE (DO NOT CHANGE — PIXEL-IDENTICAL):
- ALL structural corrections: tooth shape, contour, alignment, closed gaps, filled chips
- Tooth proportions and positions — EXACTLY as input
- Surface texture patterns (periquimacies, micro-texture)
- Lips, gums, skin, background — EVERYTHING outside teeth
- Image framing, crop, dimensions — IDENTICAL to input

Output: Same photo with teeth at NATURAL color. All corrections preserved. Only whitening removed.`
}

function buildWhiteningOnlyPrompt(params: Params): string {
  const absolutePreservation = buildAbsolutePreservation()

  return `DENTAL PHOTO EDIT - WHITENING ONLY (KEEP ALL CORRECTIONS)

${absolutePreservation}

TASK: The teeth in this image have ALREADY been structurally corrected (shape, gaps, contours fixed).
Now apply ONLY whitening — make the teeth brighter/whiter while keeping everything else IDENTICAL.
Keep ALL structural corrections EXACTLY as they are. Keep EVERYTHING else pixel-identical.

#1 TASK - WHITENING (${params.whiteningIntensity}):
${params.colorInstruction}
${params.whiteningLevel === 'hollywood' ? '⚠️ HOLLYWOOD = MAXIMUM BRIGHTNESS. Teeth must be DRAMATICALLY WHITE like porcelain veneers.' : ''}

WHAT TO CHANGE (ONLY):
- Tooth COLOR: make teeth whiter/brighter according to the whitening level above
- Apply whitening UNIFORMLY across all visible teeth
- Maintain natural translucency gradients (more translucent at incisal edges)
- Keep subtle color variation between teeth (don't make them perfectly uniform)

WHAT TO PRESERVE (DO NOT CHANGE — PIXEL-IDENTICAL):
- ALL structural corrections: tooth shape, contour, alignment, closed gaps, filled chips
- Tooth proportions and positions — EXACTLY as input
- Surface texture patterns (periquimacies, micro-texture)
- Lips, gums, skin, background — EVERYTHING outside teeth
- Image framing, crop, dimensions — IDENTICAL to input

Output: Same photo with teeth whitened to ${params.whiteningIntensity} level. All corrections preserved. Only color changed.`
}

function buildRestorationsOnlyPrompt(params: Params): string {
  const absolutePreservation = buildAbsolutePreservation()
  const baseCorrections = buildBaseCorrections()
  const textureInstruction = buildTextureInstruction()
  const qualityRequirements = buildQualityRequirements(params)
  const allowedChangesFromAnalysis = params.allowedChangesFromAnalysis || ''

  return `DENTAL PHOTO EDIT - RESTORATIONS ONLY (NO WHITENING)

${absolutePreservation}

TASK: Edit ONLY the teeth. Everything else must be IDENTICAL to input.

#1 TASK - COLOR PRESERVATION (NO WHITENING):
- Keep the ORIGINAL natural tooth color — NO whitening, NO brightening
- The tooth color in the output must be IDENTICAL to the input color
- Do NOT make teeth lighter than they currently are
- Replace old/stained restorations with material matching the CURRENT natural tooth color

DENTAL CORRECTIONS:
${baseCorrections}
${textureInstruction}
${allowedChangesFromAnalysis}

${PROPORTION_RULES}

${qualityRequirements}

Output: Same photo with ONLY teeth structurally corrected at their ORIGINAL natural color.`
}

function buildGengivoplastyOnlyPrompt(params: Params): string {
  const absolutePreservation = buildAbsolutePreservation()

  return `DENTAL PHOTO EDIT - GUM LINE RESHAPING ONLY

${absolutePreservation}

⚠️ OVERRIDE FOR THIS LAYER: The "GENGIVA" rule in the preservation block above is PARTIALLY LIFTED.
You ARE allowed to modify the GINGIVAL MARGIN (the edge where gum meets tooth).
You are NOT allowed to modify anything else — especially NOT the lips.

This is an INPAINTING task on an ALREADY PROCESSED image.
The teeth have ALREADY been corrected and whitened — do NOT change them.
Output dimensions MUST equal input dimensions.

⚠️⚠️⚠️ REGRA #0 — MAIS IMPORTANTE QUE TUDO ⚠️⚠️⚠️
AMBOS OS LÁBIOS (superior E inferior) são SAGRADOS e INTOCÁVEIS.
A gengivoplastia altera apenas a margem gengival ENTRE os dentes e o lábio,
NUNCA a posição, formato, abertura ou contorno dos lábios.
O enquadramento da foto (crop, zoom, ângulo) DEVE ser IDÊNTICO à entrada.
⚠️ ERRO FREQUENTE: Levantar o lábio superior para "mostrar mais resultado" — PROIBIDO
⚠️ A ABERTURA LABIAL (distância entre lábios) é FIXA — não pode aumentar nem diminuir

=== WHAT TO EDIT ===
Reshape ONLY the gum line (pink gingival tissue) to show more of each tooth:
- Move the gum edge UPWARD (away from the tooth tip) to reveal more tooth surface
- Each affected tooth should show 1-2mm MORE visible enamel than in the input
- Make the gum line SYMMETRICAL — left side should mirror right side
- The gum arch should follow a smooth, harmonious curve across all visible teeth
- Where gum is removed, paint the newly exposed area to match the existing tooth enamel color and texture
- Keep the remaining gum tissue looking natural — healthy pink color, smooth texture

${params.gingivoSuggestions ? `SPECIFIC TEETH TO RESHAPE:\n${params.gingivoSuggestions}\n` : `Reshape the gum line on the upper anterior teeth (canine to canine) to create a balanced, aesthetic smile.\n`}

EXPECTED RESULT:
- Teeth appear VISIBLY TALLER than in the input photo
- The gum line is more even and symmetrical
- The change should be CLEARLY NOTICEABLE in side-by-side comparison
- The LIPS remain in the EXACT same position — pixel-perfect match with input

=== DO NOT CHANGE (ABSOLUTE) ===
- TEETH: Already edited — keep color, shape, contour, texture exactly as input
- LÁBIO SUPERIOR: Mesma posição, formato, contorno — pixel a pixel idêntico à entrada
- LÁBIO INFERIOR: Mesma posição, formato, contorno — pixel a pixel idêntico à entrada
- ABERTURA LABIAL: Distância entre lábios IDÊNTICA à entrada
- FACE/SKIN: No changes to any facial features
- BACKGROUND: Keep identical

The ONLY pixels you may change are the PINK GUM TISSUE between the teeth and the upper lip.
When the gum line moves up, the teeth get taller — but the lips stay EXACTLY where they are.
The space between the gum line and the upper lip INCREASES (more tooth visible), but the lip itself does NOT move.

Output: Same photo with reshaped gum line showing more tooth surface. Lips and everything else identical to input.`
}

function buildWithGengivoplastyPrompt(params: Params): string {
  // When input is already processed (Layer 2 output), use simplified gengivoplasty-only prompt
  if (params.inputAlreadyProcessed) {
    return buildGengivoplastyOnlyPrompt(params)
  }

  const absolutePreservation = buildAbsolutePreservation()
  const whiteningPrioritySection = buildWhiteningPrioritySection(params)
  const baseCorrections = buildBaseCorrections()
  const textureInstruction = buildTextureInstruction()
  const qualityRequirements = buildQualityRequirements(params)
  const allowedChangesFromAnalysis = params.allowedChangesFromAnalysis || ''

  return `DENTAL PHOTO EDIT - COMPLETE TREATMENT WITH GENGIVOPLASTY

${absolutePreservation}

TASK: Edit teeth AND gingival contour. This is the COMPLETE treatment simulation including gengivoplasty.

⚠️⚠️⚠️ REGRA #0 — MAIS IMPORTANTE QUE TUDO ⚠️⚠️⚠️
AMBOS OS LÁBIOS (superior E inferior) são SAGRADOS e INTOCÁVEIS.
A gengivoplastia altera apenas a margem gengival ENTRE os dentes,
NUNCA a posição, formato, abertura ou contorno dos lábios.

O enquadramento da foto (crop, zoom, ângulo) DEVE ser IDÊNTICO.
Os lábios são a referência anatômica fixa para o antes/depois.
Se os lábios mudarem, a comparação clínica é DESTRUÍDA.

VALIDAÇÃO:
- Lábio superior: mesma posição, formato e contorno pixel a pixel
- Lábio inferior: mesma posição, formato e contorno pixel a pixel
- Abertura labial: IDÊNTICA à foto original
- Se qualquer lábio mudou de posição → REJEITAR e refazer

⚠️ EXCEPTION TO GINGIVA PRESERVATION: In this layer, you ARE ALLOWED to modify the gingival contour.
The gum line should be recontoured to show the effect of gengivoplasty:
- Expose more clinical crown by moving the gingival margin apically (towards the root)
- Create symmetrical gingival zeniths between contralateral teeth
- Harmonize the gum line curvature across the smile
- The recontoured gums must still look NATURAL (pink, healthy tissue appearance)
- The gingival alteration MUST be VISUALLY EVIDENT in the before/after comparison — do not make subtle changes that are invisible at comparison zoom level
- Minimum 0.5mm apical movement of gingival margin for the change to be perceptible

⚠️ REGRA ABSOLUTA SOBRE LÁBIOS (MESMO COM GENGIVOPLASTIA):
A gengivoplastia altera APENAS a MARGEM GENGIVAL (interface gengiva-dente).
- AMBOS os lábios (superior E inferior) são REFERÊNCIAS FIXAS
- Mover QUALQUER lábio INVALIDA toda a análise clínica
- DEFINIÇÃO: Margem gengival = tecido rosa entre dente e lábio
- DEFINIÇÃO: Lábio = tecido vermelho/rosa com vermilion border
- O LÁBIO SUPERIOR permanece EXATAMENTE na mesma posição e formato
- O LÁBIO INFERIOR permanece EXATAMENTE na mesma posição e formato
- A ABERTURA LABIAL (distância entre lábios) é FIXA — não pode aumentar nem diminuir
- Ao mover a margem gengival apicalmente, o ESPAÇO entre lábio e dente AUMENTA
  (mostrando mais coroa clínica) — mas os LÁBIOS PERMANECEM EXATAMENTE ONDE ESTÃO
- Se não for possível simular gengivoplastia sem mover os lábios: NÃO FAÇA
- ⚠️ ERRO COMUM: Levantar o lábio superior e/ou abaixar o inferior para "mostrar mais dente" — ISSO É PROIBIDO

${params.gingivoSuggestions ? `GENGIVOPLASTY SPECIFICATIONS:\n${params.gingivoSuggestions}\n` : ''}

${whiteningPrioritySection}DENTAL CORRECTIONS:
${baseCorrections}
${textureInstruction}
${allowedChangesFromAnalysis}

${PROPORTION_RULES}

${qualityRequirements}

Output: Same photo with teeth corrected AND gingival recontouring applied.`
}

function buildRootCoveragePrompt(params: Params): string {
  const absolutePreservation = buildAbsolutePreservation()
  const whiteningPrioritySection = buildWhiteningPrioritySection(params)
  const baseCorrections = buildBaseCorrections()
  const textureInstruction = buildTextureInstruction()
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

// --- Prompt definition ---

export const dsdSimulation: PromptDefinition<Params> = {
  id: 'dsd-simulation',
  name: 'Simulação DSD',
  description: 'Prompt de edição de imagem para simulação DSD com 4 variantes (reconstruction, restoration, intraoral, standard)',
  model: 'gemini-3-pro-image-preview',
  temperature: 0.0,
  maxTokens: 4000,
  mode: 'image-edit',

  system: (params: Params): string => {
    // Layer-specific routing takes precedence when set
    if (params.layerType) {
      switch (params.layerType) {
        case 'restorations-only':
          if (params.inputAlreadyProcessed) {
            return buildDewhiteningPrompt(params)
          }
          return buildRestorationsOnlyPrompt(params)
        case 'complete-treatment':
          return buildWithGengivoplastyPrompt(params)
        case 'root-coverage':
          return buildRootCoveragePrompt(params)
        case 'whitening-restorations':
          if (params.inputAlreadyProcessed) {
            return buildWhiteningOnlyPrompt(params)
          }
          // L2 from original uses standard caseType routing (corrections + whitening)
          break
      }
    }

    switch (params.caseType) {
      case 'reconstruction':
        return buildReconstructionPrompt(params)
      case 'restoration-replacement':
        return buildRestorationPrompt(params)
      case 'intraoral':
        return buildIntraoralPrompt(params)
      case 'standard':
      default:
        return buildStandardPrompt(params)
    }
  },

  user: (): string => '',
}
