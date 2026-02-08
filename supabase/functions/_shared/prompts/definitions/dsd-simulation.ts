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
  layerType?: 'restorations-only' | 'whitening-restorations' | 'complete-treatment'
  /** Gengivoplasty suggestions text, injected for complete-treatment layer */
  gingivoSuggestions?: string
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
- NÃO deve parecer que os dentes foram "copiados" de outra pessoa`
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

function buildWithGengivoplastyPrompt(params: Params): string {
  const absolutePreservation = buildAbsolutePreservation()
  const whiteningPrioritySection = buildWhiteningPrioritySection(params)
  const baseCorrections = buildBaseCorrections()
  const textureInstruction = buildTextureInstruction()
  const qualityRequirements = buildQualityRequirements(params)
  const allowedChangesFromAnalysis = params.allowedChangesFromAnalysis || ''

  return `DENTAL PHOTO EDIT - COMPLETE TREATMENT WITH GENGIVOPLASTY

${absolutePreservation}

TASK: Edit teeth AND gingival contour. This is the COMPLETE treatment simulation including gengivoplasty.

⚠️ EXCEPTION TO GINGIVA PRESERVATION: In this layer, you ARE ALLOWED to modify the gingival contour.
The gum line should be recontoured to show the effect of gengivoplasty:
- Expose more clinical crown by moving the gingival margin apically (towards the root)
- Create symmetrical gingival zeniths between contralateral teeth
- Harmonize the gum line curvature across the smile
- The recontoured gums must still look NATURAL (pink, healthy tissue appearance)
- The gingival alteration MUST be VISUALLY EVIDENT in the before/after comparison — do not make subtle changes that are invisible at comparison zoom level
- Minimum 0.5mm apical movement of gingival margin for the change to be perceptible

${params.gingivoSuggestions ? `GENGIVOPLASTY SPECIFICATIONS:\n${params.gingivoSuggestions}\n` : ''}

${whiteningPrioritySection}DENTAL CORRECTIONS:
${baseCorrections}
${textureInstruction}
${allowedChangesFromAnalysis}

${PROPORTION_RULES}

${qualityRequirements}

Output: Same photo with teeth corrected AND gingival recontouring applied.`
}

// --- Prompt definition ---

export const dsdSimulation: PromptDefinition<Params> = {
  id: 'dsd-simulation',
  name: 'Simulação DSD',
  description: 'Prompt de edição de imagem para simulação DSD com 4 variantes (reconstruction, restoration, intraoral, standard)',
  model: 'gemini-3-pro-image-preview',
  temperature: 0.4,
  maxTokens: 4000,
  mode: 'image-edit',

  system: (params: Params): string => {
    // Layer-specific routing takes precedence when set
    if (params.layerType) {
      switch (params.layerType) {
        case 'restorations-only':
          return buildRestorationsOnlyPrompt(params)
        case 'complete-treatment':
          return buildWithGengivoplastyPrompt(params)
        case 'whitening-restorations':
          // Falls through to standard caseType routing below
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
