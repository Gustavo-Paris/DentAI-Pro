/**
 * DSD Simulation — Shared prompt blocks used across all variant builders.
 *
 * Contains: preservation rules, texture, whitening, visagism, corrections, proportions.
 */

import type { Params } from './dsd-simulation.ts'

// ---------------------------------------------------------------------------
// Texture & anti-artificial guardrails
// ---------------------------------------------------------------------------

export function buildTextureInstruction(whiteningLevel?: string): string {
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

// ---------------------------------------------------------------------------
// Absolute preservation (inpainting mode)
// ---------------------------------------------------------------------------

export function buildAbsolutePreservation(): string {
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

// ---------------------------------------------------------------------------
// Gingival texture & color (gengivoplasty layers)
// ---------------------------------------------------------------------------

export function buildGingivalTextureRules(): string {
  return `REGRAS DE TEXTURA E COR GENGIVAL (OBRIGATORIO para camada com gengivoplastia):

1. A gengiva apos reducao DEVE ter a MESMA cor e textura da gengiva adjacente nao-modificada — use como REFERENCIA
2. COPIE o padrao de stippling (pontilhado) da gengiva original na area modificada — NAO pinte area uniforme/lisa
3. Gradiente de cor natural: rosa-coral na gengiva aderida, rosa mais escuro/avermelhado na gengiva marginal
4. Vascularizacao sutil: mantenha a variacao natural de tonalidade presente na foto original
5. A transicao entre gengiva modificada e nao-modificada deve ser IMPERCEPTIVEL — sem linha de corte visivel
6. REFERENCIA DE COR: use a gengiva entre os caninos (13-23) da foto original como source of truth
7. PROIBIDO: cor uniforme rosa-chiclete, textura lisa sem stippling, linha reta de corte, rosa artificial neon

REGRA CRITICA: Se a gengiva original na foto tem tom mais escuro (melanoderma ou pigmentacao), a gengiva modificada DEVE manter o MESMO tom. NAO clarear a gengiva artificialmente.`
}

// ---------------------------------------------------------------------------
// Whitening priority section
// ---------------------------------------------------------------------------

export function buildWhiteningPrioritySection(params: Params): string {
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

// ---------------------------------------------------------------------------
// Visagism context
// ---------------------------------------------------------------------------

export function buildVisagismContext(params: Params): string {
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

// ---------------------------------------------------------------------------
// Quality requirements (includes visagism)
// ---------------------------------------------------------------------------

export function buildQualityRequirements(params: Params): string {
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

// ---------------------------------------------------------------------------
// Base dental corrections
// ---------------------------------------------------------------------------

export function buildBaseCorrections(): string {
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

// ---------------------------------------------------------------------------
// Proportion rules constant
// ---------------------------------------------------------------------------

export const PROPORTION_RULES = `PROPORTION RULES:
⚠️ REGRA #1: Dentes NÃO listados em "SPECIFIC CORRECTIONS" mantêm forma, tamanho e proporção ORIGINAIS — ZERO alteração
- For teeth identified in SPECIFIC CORRECTIONS with conoid/microdontia: apply volume increase
- For dark/old crowns or restorations listed in SPECIFIC CORRECTIONS: REPLACE color to match whitening level
- Only reshape contours when SPECIFICALLY indicated by analysis for that tooth
- NEVER make teeth appear thinner or narrower than original
- NUNCA alterar forma ou proporção de dentes que NÃO estão em "SPECIFIC CORRECTIONS"
- COMPARAR antes/depois: dentes não tratados devem ter EXATAMENTE o mesmo formato, tamanho e posição

⚠️ REGRA #2 — CONSERVADORISMO (CRÍTICO):
Esta simulação NÃO é projeto de facetas ou laminados. É uma PREVISÃO de restaurações diretas em resina.
- PRINCÍPIO FUNDAMENTAL: SEMPRE preferir ADICIONAR material ao dente MENOR do que REDUZIR o dente MAIOR
  → Se dente 12 é menor que homólogo 22: AUMENTAR 12, NUNCA reduzir 22
  → Se dente tem comprimento incisal curto: ACRESCENTAR borda incisal, NUNCA encurtar adjacentes
  → Adição de resina é REVERSÍVEL e CONSERVADORA. Redução/desgaste é IRREVERSÍVEL.
- NÃO criar "dentes novos" — modificar os EXISTENTES com ajustes pontuais
- A PROPORÇÃO RELATIVA entre dentes adjacentes deve ser PRESERVADA (se 12 é menor que 11 no original, continua menor)
- NÃO uniformizar o tamanho/formato de todos os dentes — variação natural é IDENTIDADE do paciente
- Cada dente no resultado deve ser CLARAMENTE o mesmo dente do original, apenas com melhorias sutis
- Se o resultado parece "sorriso de catálogo" com dentes idênticos/simétricos perfeitos → FALHOU`
