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
- WHITENING UNIFORMIDADE: Todos os dentes visíveis devem atingir o MESMO nível de claridade/brilho após clareamento. Dentes mais escuros/manchados devem receber MAIS clareamento para igualar aos adjacentes. O resultado final deve ter brilho UNIFORME.
- Permitir variações SUTIS de textura entre dentes (craze lines, periquimácies) mas a COR/BRILHO deve ser uniforme
- NÃO criar aparência de "porcelana perfeita" ou "dentes de comercial de TV"
- Preservar micro-textura individual mas equalizar a luminosidade geral`
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

=== OUTPUT DE ROSTO COMPLETO ===
Se a imagem de entrada mostra o ROSTO COMPLETO do paciente (olhos, testa, queixo):
- O output DEVE mostrar o rosto completo com a simulação aplicada no sorriso
- NÃO cropar a imagem para mostrar apenas a boca
- Manter TODAS as características faciais idênticas (olhos, nariz, cabelo, pele)
- A simulação se limita APENAS à área dos dentes — todo o resto do rosto é cópia exata

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
=== POSIÇÃO E ALINHAMENTO DOS DENTES ===
NÃO mover ou rotacionar os dentes lateralmente. Manter a posição horizontal e o alinhamento geral.
EXCEÇÃO PERMITIDA: Alongar ou encurtar BORDAS INCISAIS (até 1-2mm visual) para:
- Harmonizar o arco do sorriso (curva incisal acompanhando o lábio inferior)
- Corrigir assimetria de comprimento entre dentes homólogos (ex: 12 vs 22)
- Equalizar a linha incisal dos anteriores
Estas mudanças de borda incisal são PARTE da simulação de restauração e devem ser VISÍVEIS na comparação.
A simulação deve parecer uma melhoria natural, NÃO uma sobreposição de dentes genéricos.

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
${params.smileArc === 'plano' ? '- ARCO DO SORRISO PLANO DETECTADO: OBRIGATÓRIO suavizar a curva incisal. Alongar bordas incisais dos laterais (12/22) em ~1mm e centralizar para criar arco convexo suave acompanhando o lábio inferior. A correção deve ser VISÍVEL na comparação.' : ''}
${params.smileArc === 'reverso' ? '- ARCO REVERSO DETECTADO: Simular correção do arco invertido. Alongar bordas incisais dos centrais (11/21) e/ou encurtar caninos para inverter a curvatura. A mudança deve ser PERCEPTÍVEL na comparação.' : ''}
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
- Os dentes devem ser VISIVELMENTE MAIS BRANCOS que a entrada, mas ainda naturais`
}

function buildBaseCorrections(): string {
  return `CORREÇÕES DENTÁRIAS (manter aparência NATURAL):
1. Preencher buracos, lascas ou defeitos visíveis nas bordas dos dentes
2. Remover manchas escuras pontuais (mas manter variação natural de cor)
3. Fechar pequenos espaços adicionando material nos pontos de contato (exceção: conoides e shape corrections devem ser aplicados com volume visível)
4. PRESERVAR mamelons se visíveis (projeções naturais da borda incisal)
5. MANTER micro-textura natural do esmalte - NÃO deixar dentes "lisos demais"
6. PRESERVAR translucidez incisal natural - NÃO tornar dentes opacos uniformemente
7. CORRIGIR CANINOS (13/23) — avaliação COMPLETA:
   a) Bordos incisais: Se fraturados, lascados ou irregulares, RESTAURAR o contorno pontudo natural
   b) Cor: Se visivelmente mais amarelos/escuros que os incisivos, HARMONIZAR a cor com os adjacentes
   c) Forma: Se achatados ou sem a proeminência natural, RESTAURAR o contorno convexo vestibular
   d) Simetria: Caninos 13 e 23 devem ser SIMÉTRICOS em forma, comprimento e posição da ponta
   e) Caninos são essenciais para o corredor bucal — NÃO ignorá-los na simulação
8. CORRIGIR BORDOS INCISAIS de TODOS os dentes anteriores (13-23): lascas, irregularidades, assimetrias de comprimento entre homólogos devem ser corrigidas para harmonia do arco
9. Corrigir formato de incisivos laterais conoides (12/22) - aumentar largura e comprimento para proporção adequada
10. Aplicar contorno recomendado pelo visagismo quando o formato atual for inadequado

ILUMINAÇÃO E BLENDING (CRÍTICO para naturalidade):
- As correções devem ter EXATAMENTE a mesma iluminação, sombras e temperatura de cor da foto original
- Interfaces entre áreas modificadas e não-modificadas devem ser INVISÍVEIS — sem bordas nítidas, transição gradual
- Se um dente tem formato natural levemente irregular, PRESERVAR essa irregularidade. Não uniformizar todos os dentes

SHAPE CORRECTIONS (quando análise sugere):
- Modificar contornos dos dentes para harmonizar com recommended_tooth_shape
- Para laterais conoides: adicionar volume para proporção adequada (lateral = ~62% da largura do central)
- Para dentes com formato inadequado ao visagismo: ajustar contornos suavemente

SIMETRIA CONTRALATERAL (OBRIGATÓRIO):
- Dentes homólogos (11↔21, 12↔22, 13↔23) devem ter MESMO comprimento, largura e forma
- Se um lateral (12) é mais curto/estreito que o contralateral (22): IGUALAR ao maior
- Se um canino (13) tem ponta mais gasta que o (23): IGUALAR ao mais íntegro
- A referência é sempre o dente em MELHOR condição — espelhar para o homólogo

=== EXTENSAO ATE PRE-MOLARES ===
Se pré-molares (14/15/24/25) são VISIVEIS na foto:
- INCLUIR na simulação: aplicar whitening, harmonização de cor, correção de restaurações
- Manter proporções naturais: pré-molares são naturalmente menores que caninos
- Se pré-molares têm restaurações antigas, escurecimento ou desarmonia visível → corrigir
- ZONA DE SIMULACAO: Toda a arcada visível no sorriso (NÃO limitar a canino-a-canino)
- Pré-molares devem receber o MESMO nível de whitening dos anteriores`
}

const PROPORTION_RULES = `PROPORTION RULES:
- Keep original tooth width proportions for teeth that DON'T need correction
- For teeth identified in allowedChangesFromAnalysis or with conoid/microdontia diagnosis: APPLY VISIBLE volume increase (at least 15-20% width change for conoid laterals)
- For dark/old crowns or restorations: REPLACE the color completely to match target whitening level
- Only add material to fill defects on HEALTHY teeth - reshape contours when clinically indicated by analysis
- Maintain natural width-to-height ratio EXCEPT when shape correction is prescribed
- NEVER make teeth appear thinner or narrower than original
- NUNCA alterar proporção largura/altura de dentes que NÃO estão sendo tratados
- Mudanças de formato prescritas pela análise devem ser VISÍVEIS (15-20% de volume) para que o paciente perceba a diferença na comparação antes/depois
- Para laterais conoides ou com microdontia: aumento de 20-25% de largura/comprimento
- COMPARAR antes/depois: dentes não tratados devem ter EXATAMENTE o mesmo formato`

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

function buildRestorationsOnlyPrompt(params: Params): string {
  const absolutePreservation = buildAbsolutePreservation()
  const baseCorrections = buildBaseCorrections()
  const textureInstruction = buildTextureInstruction()
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

DENTAL CORRECTIONS:
${baseCorrections}
${textureInstruction}
${allowedChangesFromAnalysis}

${PROPORTION_RULES}

${qualityRequirements}

Output: Same photo with teeth structurally corrected but at their ORIGINAL natural color.`
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
- Apply whitening UNIFORMLY across ALL visible teeth — every tooth must reach the SAME brightness level
- Teeth that are currently darker or more stained must receive MORE whitening to match the lighter teeth
- The final result must show EVEN, UNIFORM brightness across the entire visible smile
- Maintain natural translucency gradients (more translucent at incisal edges)

WHAT TO PRESERVE (DO NOT CHANGE — PIXEL-IDENTICAL):
- ALL structural corrections: tooth shape, contour, alignment, closed gaps, filled chips
- Tooth proportions and positions — EXACTLY as input
- Surface texture patterns (periquimacies, micro-texture)
- Lips, gums, skin, background — EVERYTHING outside teeth
- Image framing, crop, dimensions — IDENTICAL to input

Output: Same photo with teeth whitened to ${params.whiteningIntensity} level. All corrections preserved. Only color changed.`
}

function buildGengivoplastyOnlyPrompt(params: Params): string {
  return `DENTAL PHOTO EDIT - GINGIVAL RECONTOURING

Input is an ALREADY PROCESSED dental photo (teeth corrected + whitened). Modify ONLY gum margins.
Output dimensions MUST equal input dimensions.

=== ANATOMICAL DEFINITIONS ===
Gingival margin = PINK GUM TISSUE where gum meets tooth surface.
Lip = tissue with VERMILION BORDER (red/pink lip tissue above the gum).
The gum sits BETWEEN the tooth crown and the upper lip.

=== INPAINTING TECHNIQUE ===
1. COPY the entire input image EXACTLY as-is
2. IDENTIFY the gingival margin (pink tissue where gum meets each tooth)
3. MEASURE the visible PINK GUM BAND between the top of each tooth crown and the upper lip
4. For each affected tooth, MOVE the gingival margin APICALLY (toward the root):
   - REPLACE pink gum pixels with tooth-colored pixels matching the existing enamel
   - The tooth crown EXTENDS upward as gum is removed
   - The newly exposed area must seamlessly match the existing tooth color and texture
5. Create SYMMETRICAL gum line — left side mirrors right side
6. Create smooth, harmonious gingival arch across all visible teeth
7. Keep remaining gum tissue natural — healthy pink, smooth, realistic

${params.gingivoSuggestions ? `SPECIFIC TEETH TO RESHAPE:\n${params.gingivoSuggestions}\n` : `Reshape the gum line on the upper anterior teeth (canine to canine) to create a balanced, aesthetic smile.\nTarget: 2-3mm apical movement of gingival margin per tooth.\n`}

=== VISUAL MAGNITUDE (CRITICAL) ===
The change MUST be DRAMATIC and IMMEDIATELY OBVIOUS in a before/after comparison.
- The visible PINK GUM BAND between tooth crowns and upper lip must be reduced by AT LEAST 30-40%
- Each tooth crown must appear NOTICEABLY TALLER (at least 15-20% more crown height visible)
- If there is a wide band of pink gum visible above the teeth, AGGRESSIVELY reduce it
- A subtle/conservative change is a FAILURE — the whole point is to show what the smile looks like WITHOUT excess gum
- Think of it as: the upper 1/3 to 1/2 of the pink gum band should become tooth-colored

EXPECTED RESULT:
- Teeth appear SIGNIFICANTLY TALLER (more crown exposed) — change must be DRAMATIC
- Gum line is more even and symmetrical
- The pink gum band is visibly reduced — this is the PRIMARY visual change

=== PRESERVATION RULE ===
PRESERVE pixel-identical: teeth (shape, color, contour, texture), BOTH lips (position, shape, opening), face, skin, background, image framing.
ONLY gum margin pixels may change. Do NOT lift upper lip or lower the lower lip to "show more teeth."

Output: Same photo with ONLY the gum line reshaped.`
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

=== GINGIVAL RECONTOURING ===
Expose more clinical crown by moving the gingival margin APICALLY (toward the root):
- Replace pink gum pixels with tooth-colored pixels matching existing enamel
- Create symmetrical gingival zeniths between contralateral teeth
- Harmonize the gum line curvature across the smile
- Recontoured gums must look NATURAL (healthy pink tissue)
- The change MUST be DRAMATIC and IMMEDIATELY OBVIOUS — reduce the visible pink gum band by at least 30-40%
- Each tooth must appear noticeably TALLER (at least 15-20% more crown visible)
- A subtle/conservative change is a FAILURE — aggressively reduce the gum band

${params.gingivoSuggestions ? `GENGIVOPLASTY SPECIFICATIONS (per tooth):\n${params.gingivoSuggestions}\n` : ''}

${whiteningPrioritySection}DENTAL CORRECTIONS:
${baseCorrections}
${textureInstruction}
${allowedChangesFromAnalysis}

${PROPORTION_RULES}

${qualityRequirements}

Output: Same photo with teeth corrected, whitened, AND gingival recontouring applied.`
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
  temperature: 0.25,
  maxTokens: 4000,
  mode: 'image-edit',
  provider: 'gemini',

  system: (params: Params): string => {
    // Layer-specific routing takes precedence when set
    if (params.layerType) {
      switch (params.layerType) {
        case 'restorations-only':
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
