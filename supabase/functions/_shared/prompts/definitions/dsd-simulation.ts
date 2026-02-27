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
  layerType?: 'restorations-only' | 'whitening-restorations' | 'complete-treatment' | 'root-coverage' | 'face-mockup'
  /** Gengivoplasty suggestions text, injected for complete-treatment layer */
  gingivoSuggestions?: string
  /** Root coverage suggestions text, injected for root-coverage layer */
  rootCoverageSuggestions?: string
  /** When true, the input image already has corrected/whitened teeth (Layer 2 output).
   *  The prompt should ONLY apply gingival recontouring — no whitening, no base corrections. */
  inputAlreadyProcessed?: boolean
}

// --- Shared prompt blocks ---

function buildTextureInstruction(whiteningLevel?: string): string {
  // Anti-artificial guardrails adapted per whitening level:
  // - natural: full warnings (conservative)
  // - white: allow visible whitening but warn against porcelain/uniform appearance
  // - hollywood: allow dramatic whitening but still require texture and variation
  let antiArtificialLines: string;
  if (whiteningLevel === 'hollywood') {
    antiArtificialLines = `
- Dentes podem ser DRAMATICAMENTE brancos, mas DEVEM manter TEXTURA REAL de esmalte (não superfícies lisas/plásticas)
- Mesmo em hollywood: cada dente deve ter MICRO-VARIAÇÕES individuais — NÃO uniformizar todos com a mesma cor/textura flat`;
  } else if (whiteningLevel === 'white') {
    antiArtificialLines = `
- O clareamento deve ser VISÍVEL e ÓBVIO, mas o esmalte deve parecer REAL — não porcelana lisa
- NÃO criar aparência de "facetas de porcelana" ou dentes de plástico — o resultado é CLAREAMENTO, não laminados
- Cada dente deve manter suas MICRO-VARIAÇÕES individuais de textura e translucidez`;
  } else {
    antiArtificialLines = `
- NÃO criar aparência de "porcelana perfeita", "dentes de comercial de TV", ou cor UNIFORMEMENTE branca
- O resultado deve parecer CLAREAMENTO DENTAL REAL, não facetas de porcelana`;
  }

  return `TEXTURA NATURAL DO ESMALTE (CRÍTICO para realismo):
- Manter/criar PERIQUIMÁCIES (linhas horizontais sutis no esmalte)
- Preservar REFLEXOS DE LUZ naturais nos pontos de brilho
- Criar GRADIENTE DE TRANSLUCIDEZ: opaco cervical → translúcido incisal
- WHITENING COERÊNCIA: Todos os dentes visíveis devem atingir nível SIMILAR de claridade. Dentes mais escuros/manchados recebem mais clareamento para harmonizar com adjacentes.
- PRESERVAR variação NATURAL entre dentes: pequenas diferenças de tom entre centrais, laterais e caninos são NORMAIS e desejáveis
- Caninos (13/23) são naturalmente 1-2 tons mais saturados/amarelados que incisivos — MANTER essa diferença relativa${antiArtificialLines}
- Preservar micro-textura individual (craze lines, periquimácies, variações de translucidez)`
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

⚠️ PROIBIÇÃO DE REDESENHO TOTAL:
Isto é EDIÇÃO DENTAL (inpainting de dentes existentes), NÃO criação de sorriso novo.
- PROIBIDO substituir os dentes do paciente por "dentes ideais genéricos"
- PROIBIDO criar dentes uniformes/idênticos — cada dente tem anatomia INDIVIDUAL
- O paciente que olhar o resultado DEVE reconhecer seus próprios dentes, apenas melhorados
- Se o resultado parece "laminados de porcelana colados por cima" → a simulação FALHOU
- PRIORIDADE: Parecer REAL e ALCANÇÁVEL com restaurações diretas em resina composta

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

⚠️ ERRO FREQUENTE DO MODELO: Levantar o lábio superior e abaixar o inferior para "mostrar mais resultado" — PROIBIDO

=== LIP DISTANCE RULE (ALL LAYERS) ===
A DISTÂNCIA entre o lábio superior e o lábio inferior é FIXA e IMUTÁVEL.
Meça a distância vertical entre os lábios na entrada — a saída DEVE ter a MESMA distância exata.
- NÃO levantar o lábio superior (nem 1 pixel)
- NÃO abaixar o lábio inferior (nem 1 pixel)
- A abertura labial na saída = CÓPIA EXATA da abertura labial na entrada
Se você precisa mostrar mais resultado dental, faça isso DENTRO do espaço existente entre os lábios — NUNCA expanda a abertura.`
}

function buildWhiteningPrioritySection(params: Params): string {
  let naturalityNote: string;
  if (params.whiteningLevel === 'hollywood') {
    naturalityNote = '⚠️ HOLLYWOOD = MAXIMUM BRIGHTNESS. Teeth must be DRAMATICALLY WHITE like porcelain veneers.';
  } else if (params.whiteningLevel === 'white') {
    naturalityNote = `⚠️ MUDANÇA VISÍVEL OBRIGATÓRIA: O clareamento DEVE ser ÓBVIO na comparação antes/depois. Se antes/depois parecerem similares, a simulação FALHOU.
- Caninos (13/23) podem ser 1-2 tons mais saturados que incisivos — diferença RELATIVA aceitável
- Bordas incisais devem ter alguma translucidez — NÃO completamente opacas`;
  } else {
    naturalityNote = `⚠️ REALISMO OBRIGATÓRIO: O resultado deve parecer CLAREAMENTO DENTAL PROFISSIONAL — NÃO facetas de porcelana.
- Dentes devem ficar VISIVELMENTE MAIS CLAROS que o original — a diferença deve ser ÓBVIA no antes/depois
- Evitar extremos: NÃO azul-branco/cinza-branco, mas também NÃO amarelado/marfim — o alvo é branco NEUTRO limpo
- Caninos (13/23) ficam naturalmente 1-2 tons mais saturados que incisivos — PRESERVAR essa diferença relativa
- Bordas incisais devem ter TRANSLUCIDEZ (levemente acinzentadas/translúcidas) — NÃO opacas`;
  }
  return `
#1 TASK - WHITENING (${params.whiteningIntensity}):
${params.colorInstruction}
${naturalityNote}

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
- Os dentes devem ser VISIVELMENTE mais claros que a entrada — a mudança de cor deve ser ÓBVIA na comparação antes/depois`
}

function buildBaseCorrections(): string {
  return `CORREÇÕES DENTÁRIAS:

⚠️ REGRA PRINCIPAL — PRESERVAÇÃO DA ESTRUTURA DENTAL:
A FORMA, TAMANHO e POSIÇÃO de cada dente devem ser RECONHECÍVEIS da foto original.
- Dentes que NÃO estão listados em "SPECIFIC CORRECTIONS FROM ANALYSIS" mantêm forma ORIGINAL EXATA
- NÃO redesenhar, uniformizar ou "melhorar" dentes sem diagnóstico específico
- A estrutura dental do paciente é parte da IDENTIDADE — preservar irregularidades naturais
- Se um dente é levemente girado, maior ou menor que o contralateral: isso é NORMAL, MANTER
- O antes/depois deve mostrar os MESMOS DENTES com melhorias pontuais, NÃO dentes novos

⚠️ LIMITE DE MAGNITUDE (MESMO para dentes em "SPECIFIC CORRECTIONS"):
Isto é INPAINTING (edição sutil), NÃO geração de dentes novos. Mesmo para dentes listados:
- A SILHUETA ORIGINAL do dente deve ser RECONHECÍVEL no resultado — NÃO substituir por dente genérico
- LARGURA de cada dente: variação máxima de ~10% em relação ao original
- ALTURA de cada dente: variação máxima de ~10-15% (exceto se borda incisal fraturada)
- CONTORNO: ajustes sutis são permitidos, redesenho total é PROIBIDO
- COR pode mudar dramaticamente (whitening), mas FORMA deve permanecer SUTIL
- Se a análise lista 6+ dentes para correção: REDUZIR a magnitude de cada correção individual
  → Muitas mudanças pequenas parecem naturais. Poucas mudanças grandes parecem artificiais.
- TESTE MENTAL: Se alguém cobrir a metade da foto, consegue identificar que é o MESMO paciente? Se não → exagerou.

CORREÇÕES PERMITIDAS (aplicar SOMENTE quando necessário):
1. Preencher lascas ou defeitos ÓBVIOS nas bordas dos dentes
2. Remover manchas escuras pontuais (manter variação natural de cor)
3. Fechar espaços SOMENTE se indicado em "SPECIFIC CORRECTIONS FROM ANALYSIS"
4. PRESERVAR mamelons se visíveis (projeções naturais da borda incisal)
5. MANTER micro-textura natural do esmalte — NÃO deixar dentes "lisos demais"
6. PRESERVAR translucidez incisal natural — NÃO tornar dentes opacos
7. Caninos (13/23) — corrigir SOMENTE SE diagnosticados com problema na análise:
   a) Se fraturados ou lascados → restaurar ponta. Se ÍNTEGROS → NÃO ALTERAR FORMA
   b) Cor: harmonizar apenas se VISIVELMENTE destoantes dos adjacentes
8. Bordos incisais — corrigir SOMENTE SE com lascas, fraturas ou irregularidades ÓBVIAS
   NÃO uniformizar todos os bordos para criar "linha incisal perfeita"
9. Laterais conoides — SOMENTE se diagnosticado como conoide na análise
10. Visagismo — aplicar SOMENTE para dentes com prescrição específica na análise

ILUMINAÇÃO E BLENDING (CRÍTICO para naturalidade):
- Correções devem ter EXATAMENTE a mesma iluminação, sombras e temperatura de cor da foto original
- Interfaces entre áreas modificadas e não-modificadas devem ser INVISÍVEIS
- Se um dente tem formato natural levemente irregular, PRESERVAR essa irregularidade

SHAPE CORRECTIONS (SOMENTE para dentes listados em "SPECIFIC CORRECTIONS FROM ANALYSIS"):
- Aplicar mudanças de contorno APENAS nos dentes especificamente indicados
- Para laterais conoides diagnosticados: adicionar volume (lateral = ~62% da largura do central)
- Dentes NÃO listados na análise: MANTER forma e contorno ORIGINAIS EXATOS

SIMETRIA CONTRALATERAL (aplicar com MODERAÇÃO):
- Corrigir SOMENTE assimetrias SIGNIFICATIVAS (diferença >15% em comprimento ou largura)
- Pequenas diferenças naturais entre 11↔21, 12↔22, 13↔23 são NORMAIS — MANTER
- NÃO forçar simetria perfeita — simetria natural NUNCA é exata
- Aplicar apenas para dentes que TÊM diagnóstico de assimetria na análise

=== EXTENSAO ATE PRE-MOLARES ===
Se pré-molares (14/15/24/25) são VISIVEIS na foto:
- INCLUIR na simulação: aplicar whitening e harmonização de cor
- Manter proporções e FORMATO naturais originais
- Se pré-molares têm restaurações antigas ou desarmonia visível → corrigir cor
- Pré-molares devem receber o MESMO nível de whitening dos anteriores`
}

const PROPORTION_RULES = `PROPORTION RULES:
⚠️ REGRA #1: Dentes NÃO listados em "SPECIFIC CORRECTIONS" mantêm forma, tamanho e proporção ORIGINAIS — ZERO alteração
- For teeth identified in SPECIFIC CORRECTIONS with conoid/microdontia: apply volume increase
- For dark/old crowns or restorations listed in SPECIFIC CORRECTIONS: REPLACE color to match whitening level
- Only reshape contours when SPECIFICALLY indicated by analysis for that tooth
- NEVER make teeth appear thinner or narrower than original
- NUNCA alterar forma ou proporção de dentes que NÃO estão em "SPECIFIC CORRECTIONS"
- COMPARAR antes/depois: dentes não tratados devem ter EXATAMENTE o mesmo formato, tamanho e posição

⚠️ REGRA #2 — ANTI-REDESIGN (CRÍTICO):
Esta simulação NÃO é projeto de facetas ou laminados. É uma PREVISÃO de restaurações diretas em resina.
- NÃO criar "dentes novos" — modificar os EXISTENTES com ajustes pontuais
- A PROPORÇÃO RELATIVA entre dentes adjacentes deve ser PRESERVADA (se 12 é menor que 11 no original, continua menor)
- NÃO uniformizar o tamanho/formato de todos os dentes — variação natural é IDENTIDADE do paciente
- Cada dente no resultado deve ser CLARAMENTE o mesmo dente do original, apenas com melhorias sutis
- Se o resultado parece "sorriso de catálogo" com dentes idênticos/simétricos perfeitos → FALHOU`

// --- Variant builders ---

function buildReconstructionPrompt(params: Params): string {
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

function buildRestorationPrompt(params: Params): string {
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

function buildIntraoralPrompt(params: Params): string {
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

function buildStandardPrompt(params: Params): string {
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

// --- Layer-specific builders ---

function buildRestorationsOnlyPrompt(params: Params): string {
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

function buildWhiteningOnlyPrompt(params: Params): string {
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

function buildGengivoplastyOnlyPrompt(params: Params): string {
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

function buildWithGengivoplastyPrompt(params: Params): string {
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

function buildRootCoveragePrompt(params: Params): string {
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

function buildFaceMockupPrompt(params: Params): string {
  const whiteningConfig = params.whiteningLevel === 'hollywood'
    ? 'EXTREMELY WHITE (BL1) — porcelain veneer brightness, maximum whitening.'
    : params.whiteningLevel === 'white'
    ? 'CLEARLY WHITER — target shade A1 or brighter. Professional in-office whitening result.'
    : 'SUBTLY WHITER — 1-2 shades lighter (A1/A2). Natural, realistic whitening.';

  const allowedChangesFromAnalysis = params.allowedChangesFromAnalysis || '';

  // Build bullet points from suggestions for clarity
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
        case 'face-mockup':
          return buildFaceMockupPrompt(params)
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
