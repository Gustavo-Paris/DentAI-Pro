import type { PromptDefinition } from '../types.ts'

interface ResinData {
  id: string
  name: string
  manufacturer: string
  type: string
  indications: string[]
  opacity: string
  resistance: string
  polishing: string
  aesthetics: string
  price_range: string
  description?: string
}

interface ResinGroups {
  economico: ResinData[]
  intermediario: ResinData[]
  medioAlto: ResinData[]
  premium: ResinData[]
}

export interface Params {
  patientAge: string
  tooth: string
  region: string
  cavityClass: string
  restorationSize: string
  depth?: string
  substrate: string
  substrateCondition?: string
  enamelCondition?: string
  aestheticLevel: string
  toothColor: string
  stratificationNeeded: boolean
  bruxism: boolean
  longevityExpectation: string
  budget: string
  clinicalNotes?: string
  aestheticGoals?: string
  allGroups: ResinGroups
  hasInventory: boolean
  budgetAppropriateInventory: ResinData[]
  inventoryResins: ResinData[]
  contralateralProtocol?: unknown
  contralateralTooth?: string | null
  dsdContext?: {
    currentIssue: string
    proposedChange: string
    observations: string[]
    smileLine?: string
    faceShape?: string
    symmetryScore?: number
    smileArc?: string
  }
}

// ---------- helpers ----------

function formatResinList(resinList: ResinData[]): string {
  return resinList
    .map(
      (r) => `- ${r.name} (${r.manufacturer}) | ${r.type} | Ind: ${r.indications.join(', ')} | Opac: ${r.opacity} | Resist: ${r.resistance} | Pol: ${r.polishing} | Estét: ${r.aesthetics} | Preço: ${r.price_range}${r.description ? ` | ${r.description}` : ''}`
    )
    .join('\n')
}

function buildBudgetRulesSection(budget: string): string {
  return `=== REGRAS DE ORCAMENTO ===
Orçamento do paciente: "${budget}"
- "padrão": Resinas Econômico/Intermediário/Médio-alto. EVITAR Premium.
  PREFERIR resinas de AMPLA DISPONIBILIDADE (Z350, Harmonize, FORMA, Opallis) por padrão.
  Resinas premium (Estelite Omega, Vittra APS, GC Essentia, Palfique LX5) SOMENTE quando:
    * Necessidade clínica justificada (ex: polimento superior em camada de esmalte final anterior)
    * Inventário do dentista já possui a resina premium
  Se usar premium em orçamento "padrão", JUSTIFICAR na "justification" do JSON.
- "premium": QUALQUER faixa, priorizando as melhores.
REGRA CRITICA: Recomendação principal DEVE respeitar o orçamento!`
}

function buildResinsByPriceSection(allGroups: ResinGroups): string {
  const sections = [
    { label: 'ECONOMICAS (padrão)', data: allGroups.economico },
    { label: 'INTERMEDIARIAS (padrão)', data: allGroups.intermediario },
    { label: 'MEDIO-ALTO (padrão/premium)', data: allGroups.medioAlto },
    { label: 'PREMIUM (APENAS premium)', data: allGroups.premium },
  ]
  return `=== RESINAS POR FAIXA DE PRECO ===\n` +
    sections.map(s => `**${s.label}:**\n${s.data.length > 0 ? formatResinList(s.data) : 'Nenhuma'}`).join('\n\n')
}

function buildInventorySection(
  hasInventory: boolean,
  budget: string,
  budgetAppropriateInventory: ResinData[],
  inventoryResins: ResinData[]
): string {
  if (hasInventory) {
    const otherResins = inventoryResins.filter((r) => !budgetAppropriateInventory.includes(r))
    return `=== INVENTARIO DO DENTISTA ===
${budgetAppropriateInventory.length > 0
    ? `Compatíveis com orçamento "${budget}":\n${formatResinList(budgetAppropriateInventory)}`
    : `Nenhuma compatível com "${budget}". Use CATALOGO GERAL para gerar protocolo.`}
${otherResins.length > 0 ? `\nOutras (fora do orçamento):\n${formatResinList(otherResins)}` : ''}`
  }
  return `NOTA: Sem inventário cadastrado. Recomende melhor opção para orçamento "${budget}".`
}

function buildInventoryInstructions(hasInventory: boolean, budget: string): string {
  if (hasInventory) {
    return `=== REGRA DE INVENTARIO ===
O dentista POSSUI inventário. REGRAS:
1. recommended_resin_name DEVE ser do inventário
2. TODAS as camadas DEVEM usar resinas do inventário
3. Se ideal NAO está no inventário, use a mais próxima DISPONIVEL
4. Resinas externas so em ideal_resin_name como sugestão futura

PRIORIDADE: Orçamento "${budget}" -> Inventário -> Técnica como desempate.
Se nenhuma do inventário adequada ao orçamento -> melhor do inventário (budget_compliance=false).
is_from_inventory DEVE ser true quando dentista tem inventário.`
  }
  return `PRIORIDADE: Orçamento "${budget}" -> Melhor tecnicamente -> Aspectos clínicos.
Nao recomende Premium se orçamento nao for premium!`
}

function buildAdvancedStratificationSection(aestheticLevel: string, cavityClass?: string): string {
  const classLower = cavityClass?.toLowerCase() || ''
  const isAnteriorAesthetic = classLower.includes('diastema') || classLower.includes('fechamento') || classLower.includes('recontorno') || classLower.includes('faceta') || classLower.includes('lente')
  // Anterior aesthetic procedures always need advanced stratification regardless of aesthetic level
  if (!isAnteriorAesthetic && !['estético', 'alto', 'muito alto'].includes(aestheticLevel)) return ''

  return `=== ESTRATIFICACAO AVANCADA (${aestheticLevel.toUpperCase()}) ===

RESINAS RECOMENDADAS POR CAMADA:
| Camada             | Resinas OBRIGATORIAS                                       |
|--------------------|------------------------------------------------------------|
| Aumento Incisal    | SOMENTE Trans(FORMA) ou CT(Z350) ou Trans20(Empress) ou Trans(Vittra) — PROIBIDO esmalte/corpo! |
| Cristas Proximais  | SOMENTE XLE(Harmonize) ou BL-L/BL-XL(Empress) ou WE(Z350 XT) — PROIBIDO: Z350 BL1, JE, CT, FORMA, Vittra, Palfique para cristas! |
| Dentina/Corpo      | SOMENTE corpo: WB(FORMA), WB(Z350), DA1/DA2(Vittra APS), D BL-L(Empress) — PROIBIDO esmalte (A1E/WE/CT)! |
| Efeitos Incisais   | EMPRESS DIRECT COLOR White/Blue (Ivoclar) — UNICA opcao! Z350/Kolor+ NAO! |
| Esmalte Final      | WE(Palfique LX5) ou WE/MW(Estelite Omega) OBRIGATORIO — Z350 SOMENTE se Palfique/Estelite indisponíveis! Clareados: W3/W4(Estelite Bianco). PROIBIDO: CT/GT/Trans/BL1! |
| Dentes Clareados   | W3/W4(Estelite Bianco), BL(Forma), BL-L(Empress)         |

GLOSSARIO DE SIGLAS — USAR EXATAMENTE NA DESCRICAO DE CADA CAMADA (OBRIGATORIO):
- WB = White Body (corpo branco/neutro) — NUNCA escrever "Warm Bleach"
- CT = Clear Translucent — NUNCA "Cool Tone"
- WE = White Enamel
- MW = Milky White (esmalte natural sem clareamento)
- JE = Jewel Enamel (SOMENTE Estelite Sigma Quick)
- BL-L = Bleach Light (SOMENTE Empress Direct)
- XLE = Extra Light Enamel (SOMENTE Harmonize)
- DA1/DA2 = Dentin A1/A2 (SOMENTE Vittra APS)

⚠️ SHADES QUE NAO EXISTEM POR LINHA (PROIBIDO GERAR):
- Filtek Z350 XT: NAO possui BL1, BL2, BL3. Possui WB (Body) e WE (White Enamel — disponível em catálogos regionais 3M).
- Estelite Omega: Possui BL1, BL2 para clareados. Alternativa: Estelite Bianco W3/W4.
- Harmonize: NAO possui WE, BL. Para clareados usar outra linha. Possui shades Enamel: A1E, A2E, A3E, B1E, B2E, C2E, XLE (Extra Light Enamel).

DIVERSIDADE DE MARCAS (CONDICIONAL AO NUMERO DE CAMADAS):
- 2-3 camadas: PERMITIDO mesma marca em todas. Priorizar CONSISTENCIA de sistema adesivo e compatibilidade.
- 4-5 camadas: PROIBIDO mesma marca em TODAS. Diversificar conforme funcao de cada camada.
- Cada camada deve usar a resina MAIS INDICADA para sua funcao
- Z350 em 1-2 camadas max quando 4-5 camadas
- EXCECAO: Inventario limitado -> aceitavel mesma marca, marcar nas observacoes

EFEITOS INCISAIS (sub-opções):
| Efeito         | Materiais                                                |
|----------------|----------------------------------------------------------|
| Halo Opaco     | Opallis Flow(FGM) ou Empress Opal — 0.1mm borda incisal |
| Corante Branco | Empress Direct Color White — micro-pontos                |
| Corante Ambar  | Empress Direct Color Honey/Amber — linhas finas          |
| Mamelos        | Dentina clara (A1/B1) em projeções verticais na incisal  |

Inclusão: "estético" -> Efeitos Incisais optional:true. "alto"/"muito alto" -> Efeitos Incisais OBRIGATORIO (halo + corantes + mamelos).

CARACTERIZACAO (OPCIONAL p/ "muito alto"): White spots, craze lines, mamelons, halo incisal, foseta proximal. MODERACAO - copie dentes adjacentes.

⚠️ REGRA: Nível "estético"/"alto"/"muito alto" DEVE gerar no MINIMO 4 camadas: Aumento Incisal + Cristas Proximais + Dentina/Corpo + Esmalte. Gerar apenas Corpo + Esmalte (2 camadas) para nível estético é ERRO — insuficiente para resultado estético.

COMBINACAO:
1. Priorize inventário do usuário
2. Resinas externas APENAS para camadas críticas
3. Alternativa simples com UMA marca`
}

function buildBruxismSection(bruxism: boolean): string {
  if (!bruxism) return ''
  return `=== BRUXISMO ===
REGRAS: Priorize nano/micro-híbridas alta resistência (Z350, Estelite Omega, Harmonize). Esmalte: 0.2-0.3mm. Verificar oclusão pré-procedimento. Placa oclusal noturna OBRIGATORIA.
ALERTAS: "BRUXISMO: Placa de proteção noturna obrigatória", "Documentar orientação no prontuário", "Retorno 7 dias p/ verificar desgaste".`
}

function buildAestheticGoalsSection(aestheticGoals?: string): string {
  if (!aestheticGoals) return ''
  return `=== PREFERENCIAS ESTETICAS DO PACIENTE ===
"${aestheticGoals}"
Extraia preferências e aplique: clareamento -> cores 1-2 tons mais claros em TODAS camadas. Natural/discreto -> translucidez e mimetismo. Sensibilidade -> self-etch. Durabilidade -> alta resistência. Conservador -> técnicas minimamente invasivas.`
}

function buildDSDContextSection(dsdContext?: { currentIssue: string; proposedChange: string; observations: string[]; smileLine?: string; faceShape?: string; symmetryScore?: number; smileArc?: string }): string {
  if (!dsdContext) return ''
  const obs = dsdContext.observations?.length ? dsdContext.observations.map(o => `- ${o}`).join('\n') : ''
  const extra = [
    dsdContext.smileLine && `- Linha do sorriso: ${dsdContext.smileLine}`,
    dsdContext.faceShape && `- Formato facial: ${dsdContext.faceShape}`,
    dsdContext.symmetryScore != null && `- Score de simetria: ${dsdContext.symmetryScore}%`,
    dsdContext.smileArc && `- Arco do sorriso: ${dsdContext.smileArc}`,
  ].filter(Boolean).join('\n')
  return `=== CONTEXTO DSD ===
- Situação atual: ${dsdContext.currentIssue}
- Mudança proposta: ${dsdContext.proposedChange}
${obs ? `Observações:\n${obs}` : ''}${extra ? `\nContexto clínico adicional:\n${extra}` : ''}
O protocolo DEVE considerar estes achados (aumento incisal -> camada adequada, correção de proporção -> ajustar espessuras, simetria -> consistência contralateral).`
}

function buildContralateralSection(
  contralateralTooth: string | null | undefined,
  contralateralProtocol: unknown
): string {
  if (!contralateralTooth || !contralateralProtocol) return ''
  return `=== PROTOCOLO CONTRALATERAL (COPIAR!) ===
Homólogos (13/23, 12/22, 11/21) com diagnósticos IDENTICOS -> protocolo IDENTICO (mesmas camadas, cores, técnicas). Notas RESUMIDAS: "Mesmo protocolo do dente [contralateral]".

CONSISTENCIA: Mesmo paciente, mesmo tratamento -> MESMA marca, MESMAS cores, MESMA técnica.
EXCECOES: Substrato escurecido (opaco extra), mudança significativa de cor, tipos de tratamento diferentes.

Dente ${contralateralTooth} JA PROCESSADO:
${JSON.stringify(contralateralProtocol, null, 2)}

COPIAR: Mesmo nº camadas, mesmos shades, mesma resina, mesma técnica, mesma confiança. Adapte APENAS o nº do dente.`
}

function buildLayerCapSection(restorationSize: string, cavityClass: string, aestheticLevel: string, region: string): string {
  const classLower = cavityClass.toLowerCase()
  const isDiastema = classLower.includes('diastema') || classLower.includes('fechamento')
  const isAnteriorAesthetic = classLower.includes('recontorno') || classLower.includes('faceta') || classLower.includes('lente')
  const isAnteriorRegion = region.toLowerCase().includes('anterior')
  const sizeNorm = restorationSize.toLowerCase()
  const isAesthetic = ['estético', 'alto', 'muito alto'].includes(aestheticLevel)
  // Diastema closures and anterior aesthetic procedures are ALWAYS aesthetic
  const forceAesthetic = isDiastema || (isAnteriorAesthetic && isAnteriorRegion)

  let maxLayers: number | null = null
  let scenario = ''

  if (isDiastema || (isAnteriorAesthetic && isAnteriorRegion)) {
    // Anterior aesthetic procedures always require full stratification — never cap below 4
    maxLayers = 4
    if (isDiastema) {
      if (sizeNorm.includes('pequen') || sizeNorm.includes('médi') || sizeNorm.includes('medi')) {
        scenario = 'Diastema Pequeno/Médio: Mín 4 camadas (Aumento Incisal + Cristas Proximais + Corpo + Esmalte)'
      } else {
        scenario = 'Diastema Grande/Extenso: Mín 4 camadas + Efeitos Incisais recomendado (5 camadas)'
      }
    } else {
      scenario = 'Recontorno/Faceta Anterior Estético: Mín 4 camadas (Aumento Incisal + Cristas Proximais + Corpo + Esmalte)'
    }
  } else {
    if (sizeNorm.includes('pequen')) {
      maxLayers = isAesthetic ? 4 : 2
      scenario = isAesthetic
        ? 'Restauração Pequena + Nível Estético: Mín 4 camadas'
        : 'Restauração Pequena Funcional: Máx 2 camadas'
    } else if (sizeNorm.includes('médi') || sizeNorm.includes('medi')) {
      maxLayers = isAesthetic ? 4 : 3
      scenario = isAesthetic
        ? 'Restauração Média + Nível Estético: Mín 4 camadas'
        : 'Restauração Média Funcional: Máx 3 camadas'
    }
    // Grande/Extensa: no cap (follows aesthetic level)
  }

  if (maxLayers === null) return ''

  if (isAesthetic || forceAesthetic) {
    return `=== CAMADAS OBRIGATORIAS (PROCEDIMENTO ESTETICO ANTERIOR) ===
Cenário detectado: ${scenario}
MINIMO DE CAMADAS OBRIGATORIO: ${maxLayers}
${isDiastema ? 'Fechamento de diastema é procedimento estético anterior — requer estratificação completa.' : ''}
${isAnteriorAesthetic ? 'Recontorno/faceta estético anterior — requer estratificação completa para resultado natural.' : ''}
Camadas OBRIGATORIAS (gerar EXATAMENTE nesta ordem):
1. Aumento Incisal (resina translúcida)
2. Cristas Proximais (esmalte 1 tom mais claro que corpo)
3. Dentina/Corpo (resina de corpo, shade VITA)
4. Esmalte Vestibular Final (esmalte, polimento superior)
PROIBIDO gerar menos de ${maxLayers} camadas. 2-3 camadas em anterior estético = ERRO GRAVE.
`
  }

  return `=== LIMITE DE CAMADAS POR VOLUME (NIVEL FUNCIONAL) ===
Cenário detectado: ${scenario}
MAXIMO DE CAMADAS PERMITIDO: ${maxLayers}
Camadas OBRIGATORIAS: Corpo/Dentina + Esmalte. Camadas adicionais somente se maxLayers permitir.
PROIBIDO gerar ${maxLayers + 1}+ camadas para este volume de restauração.

| Cenário                        | Máx Camadas |
|--------------------------------|-------------|
| Restauração Pequena            | 2           |
| Restauração Média              | 3           |
| Grande/Extensa                 | Sem limite  |
`
}

// ---------- prompt definition ----------

export const recommendResin: PromptDefinition<Params> = {
  id: 'recommend-resin',
  name: 'Recomendação de Resina',
  description: 'Gera recomendação completa de resina com protocolo de estratificação',
  model: 'claude-haiku-4-5-20251001',
  temperature: 0.0,
  maxTokens: 8192,
  mode: 'text',
  provider: 'claude',

  system: () => '',

  user: (p: Params) => {
    const budgetRules = buildBudgetRulesSection(p.budget)
    const resinsByPrice = buildResinsByPriceSection(p.allGroups)
    const inventory = buildInventorySection(p.hasInventory, p.budget, p.budgetAppropriateInventory, p.inventoryResins)
    const inventoryInstr = buildInventoryInstructions(p.hasInventory, p.budget)
    const advancedStrat = buildAdvancedStratificationSection(p.aestheticLevel, p.cavityClass)
    const layerCap = buildLayerCapSection(p.restorationSize, p.cavityClass, p.aestheticLevel, p.region)
    const bruxism = buildBruxismSection(p.bruxism)
    const aestheticGoals = buildAestheticGoalsSection(p.aestheticGoals)
    const dsdContext = buildDSDContextSection(p.dsdContext)
    const contralateral = buildContralateralSection(p.contralateralTooth, p.contralateralProtocol)

    return `Você é um especialista em materiais dentários e técnicas restauradoras. Analise o caso e forneça recomendação COMPLETA com protocolo de estratificação.

${budgetRules}

CASO CLINICO:
- Idade: ${p.patientAge} anos | Dente: ${p.tooth} | Região: ${p.region}
- Classe: ${p.cavityClass} | Tamanho: ${p.restorationSize} | Profundidade: ${p.depth || 'N/A'}
- Substrato: ${p.substrate} | Condição substrato: ${p.substrateCondition || 'Normal'} | Esmalte: ${p.enamelCondition || 'Íntegro'}
- Nível estético: ${p.aestheticLevel} | Cor VITA: ${p.toothColor}
- Estratificação: ${p.stratificationNeeded ? 'Sim' : 'Não'} | Bruxismo: ${p.bruxism ? 'Sim' : 'Não'}
- Longevidade: ${p.longevityExpectation} | Orçamento: ${p.budget}
${p.clinicalNotes ? `- Observações: ${p.clinicalNotes}` : ''}
${aestheticGoals}
${dsdContext}

${resinsByPrice}
${inventory}
${inventoryInstr}
${contralateral}

=== PROTOCOLO RECONTORNO INCISAL (DESGASTE) ===
Se cavityClass = "Recontorno Estético" E indicação menciona DIMINUIR bordo incisal:
- NAO gere camadas de estratificação. Gere protocolo de recontorno:
  1. Planejamento e Marcação (caneta para resina + carbono articular)
  2. Desgaste Inicial (diamantada 2135, 0.5-1.0mm, alta rotação c/ spray)
  3. Refinamento (diamantada FF 3118FF/2135FF, 0.1-0.2mm, inclui face palatina/lingual)
  4. Acabamento (Sof-Lex: Laranja Escuro->Laranja Médio->Laranja Claro->Amarelo OU sequência vermelha)
  5. Polimento Final (Diamond Excel + feltro, baixa rotação 40-60s)
- Se NAO menciona diminuir -> use protocolo normal.

REGRA RECONTORNO vs ESTRATIFICACAO (MUTUAMENTE EXCLUSIVOS):
- Recontorno (desgaste): SOMENTE para DIMINUIR — ajuste SUTIL de esmalte existente sem acréscimo de material. Aplicável quando dente precisa ficar MENOR/mais curto.
- Estratificação (buildup): SOMENTE para AUMENTAR — acréscimo de resina em camadas. Aplicável quando dente precisa ficar MAIOR/mais longo.
- Se o dente precisa de ACRESCIMO (estratificação), NUNCA gere protocolo de recontorno junto. O buildup define a nova forma.
- Se o dente precisa APENAS de ajuste fino em esmalte natural sem acréscimo → recontorno.
- PROIBIDO: Gerar recontorno + estratificação para o MESMO dente. Escolha UM.

${advancedStrat}

${layerCap}

=== PROTOCOLO DE ESTRATIFICACAO V2 ===
A cor DEVE corresponder ao tipo da camada E existir na linha de produto!

ESTRUTURA 2-5 CAMADAS conforme nível estético E volume da restauração (limite de volume PREVALECE):

⚠️ EXCECAO OBRIGATORIA — PROCEDIMENTO ESTETICO ANTERIOR:
Se cavityClass contém "Diastema", "Fechamento", "Recontorno" ou "Faceta" E região é anterior: IGNORAR nível estético informado → SEMPRE usar caminho NIVEL ESTETICO abaixo (mín 4 camadas).
Procedimentos estéticos anteriores EXIGEM estratificação completa: Aumento Incisal + Cristas Proximais + Corpo + Esmalte.

NIVEL FUNCIONAL ("funcional"/"baixo"/"médio") - 2-3 camadas (NAO APLICAVEL para anterior estético!):
1. Dentina/Corpo | 2. Esmalte Vestibular Final | 3. Aumento Incisal (SE NECESSARIO)

NIVEL ESTETICO ("estético"/"alto"/"muito alto" OU Fechamento de Diastema) - 4-5 camadas OBRIGATORIAS:
⚠️ REGRA: Para nível estético, TODAS as 5 camadas abaixo DEVEM ser geradas (exceto Efeitos Incisais que é optional:true para "estético", obrigatório para "alto"/"muito alto"). Gerar apenas 2 camadas (Corpo + Esmalte) é ERRO GRAVE.

1. Aumento Incisal: OBRIGATÓRIO resina translúcida — Trans(FORMA) ou CT(Z350) ou Trans20(Empress) ou Trans(Vittra). PROIBIDO usar shades de esmalte (BL1/BL2/WE) ou corpo! 0.2-0.3mm, incremento único em forma de cunha.
   - Objetivo: Reproduzir FORMA e comprimento da borda incisal. Criar translucidez natural da borda.
   - Técnica: Incremento único adaptado contra matriz/guia de silicone. Fotopolimerizar 20s.
   - INCLUIR SEMPRE que houver: reanatomização, fechamento de diastema, aumento de comprimento ou DSD indicando aumento incisal.
2. Cristas Proximais: OBRIGATÓRIO XLE(Harmonize) ou Esmalte BL-L/BL-XL(Empress). Cor de esmalte 1 tom mais claro que corpo. 0.2mm, tira de poliéster p/ adaptação.
   - Objetivo: Restabelecer cristas marginais e pontos de contato proximais. Definir anatomia proximal.
   - Técnica: Incremento fino contra tira de poliéster, adaptar com espátula. Manter contato proximal firme. Fotopolimerizar 20s.
   - INCLUIR SEMPRE que houver: fechamento de diastema, restauração Classe III/IV, reconstrução proximal.
   - ⚠️ PROIBIDO para Cristas Proximais: Z350 (qualquer shade exceto WE), FORMA, Vittra, Palfique. SOMENTE Harmonize XLE ou Empress BL-L/BL-XL ou Z350 WE.
3. Dentina/Corpo: OBRIGATÓRIO resina de CORPO — WB(FORMA), WB(Z350), DA1/DA2(Vittra APS), D BL-L(Empress). PROIBIDO shades de esmalte (A1E/A2E/WE/CT/BL1/BL2)! 0.5-1.0mm. Opaco NAO e camada separada - e shade dentro da dentina!
   - Objetivo: Reproduzir volume e opacidade da dentina natural. Dar CORPO e SATURAÇÃO à restauração.
   - Técnica: Incrementos oblíquos de 1-2mm. Reproduzir mamelos com projeções verticais na incisal (se aplicável). Fotopolimerizar 20s cada incremento.
   - Substrato ESCURECIDO: shades opacos (OA1/OA2/OA3/OB1/WO) como 1º incremento 0.5-1mm
   - Substrato NORMAL: shades regulares de corpo (WB/DA1/DA2/A1/A2/B1) - NAO usar opacos NEM esmalte
   - Substrato LEVEMENTE ESCURECIDO: shades com > opacidade (DA3/A3) sem prefixo O
4. Efeitos Incisais (optional:true para "estético", obrigatório para "alto"/"muito alto"): SEMPRE corantes EMPRESS DIRECT COLOR White/Blue — NUNCA Z350, NUNCA Kolor+! Aplicar com pincel fino, 0.1mm.
   - Objetivo: Reproduzir efeitos ópticos naturais (halo opaco, linhas de craze, mamelos).
   - Técnica: Empress Direct Color White para micro-pontos e halo opaco incisal. Blue para linhas de craze. Aplicar com pincel fino antes da camada de esmalte.
   - Sub-opções: Halo Opaco (Opallis Flow/Empress Opal — 0.1mm borda incisal), Corante Branco (Empress Direct Color White), Corante Ambar (Empress Direct Color Honey/Amber — linhas finas).
   - OMITIR APENAS para: posteriores rotineiros, Classe I/V, nível funcional.
5. Esmalte Vestibular Final: 0.3mm, priorizar polimento SUPERIOR. PROIBIDO resinas translúcidas (CT/GT/Trans)! SOMENTE shades de esmalte.
   - Objetivo: Camada final de esmalte mimetizando brilho natural e integração com dente adjacente. Cor 1 tom mais claro que corpo conforme preferência estética do paciente.
   - Técnica: Incremento único cobrindo face vestibular terço médio e incisal. Aplicar com espátula de inserção, pressionando levemente contra parede vestibular. Fotopolimerizar 20s. Priorizar polimento superior com Sof-Lex para brilho espelhado.
   - P1 (OBRIGATORIO quando disponível): Palfique LX5 (WE), Estelite Omega (WE/MW). MW para resultado natural. Clareados: BL1/BL2(Estelite Omega), W3/W4(Estelite Bianco). ⚠️ Z350 para Esmalte Final SOMENTE se P1 indisponível — shade A1E/A2E (NUNCA BL1, NAO EXISTE em Z350!)
   - P2: Filtek Z350 XT (A1E/A2E), FORMA (Enamel). IPS Empress Direct (esmalte cores claras)
   - P3: Harmonize (Incisal/TN), Vittra APS (Trans)
   - ⚠️ PREFERIR Estelite/Palfique sobre Z350 para camada de esmalte final (polimento superior)

CORES DE ESMALTE POR LINHA:
| Linha               | Cores                                     |
|---------------------|-------------------------------------------|
| Estelite Sigma Quick| WE, CE                                    |
| Estelite Omega      | WE, MW, CT, BL1, BL2                      |
| Filtek Z350 XT      | WE, CT, GT, BT, YT, A1E, A2E, A3E, B1E (⚠️ NAO possui BL1/BL2/BL3!) |
| Harmonize           | A1E, A2E, A3E, B1E, B2E, C2E, XLE, Incisal, TN |
| IPS Empress Direct  | Trans 20, Trans 30, Opal                  |
| Vittra APS          | Trans, Trans OPL, Trans N, EA1, EA2       |
| Palfique LX5        | WE, CE, BW, SW, A1-A3, B1                 |
ALTERNATIVA SIMPLIFICADA (2 camadas):
- Corpo: WB(FORMA), WB(Z350), DA1(Empress) ou DA1(Vittra) — cor SATURADA de dentina. PROIBIDO para corpo: WE, MW, CE, TN, Incisal, Trans, CT — são cores de ESMALTE!
- Esmalte: WE(Palfique LX5) — preferencial. MW(Estelite Omega) para natural.
- Dentes clareados: W3/W4(Estelite Bianco) ou BL(Forma)/BL-L(Empress)
- Cristas (se 3+ camadas na alternativa): XLE(Harmonize) ou BL-L(Empress). PROIBIDO JE para cristas.
- TN = Translucent Natural = cor de ESMALTE, NUNCA corpo.

=== CLAREAMENTO (BLEACH SHADES) — CONDICIONADO AO OBJETIVO ESTETICO ===

REGRA: Verificar objetivo estetico do paciente (seção PREFERENCIAS ESTETICAS acima) ANTES de escolher shades.

SE objetivo inclui "hollywood", "clareamento", "branco", "white", "BL" ou paciente deseja dentes MUITO claros:
  Shades BL/W PERMITIDOS.
  COM BL: Palfique LX5 (BW/SW), Estelite Omega (BL1/BL2), Forma (BL), Estelite Bianco (W1-W4), Empress (BL-L). ⚠️ Z350 NAO possui shades BL — usar WE/A1E como aproximação.
  SEM BL na linha: usar cor mais clara disponivel (B1/A1).
  Dentes clareados: PRIORIDADE Estelite Bianco W1-W4, ALTERNATIVA BL(Forma)/BL-L(Empress).

SE objetivo e "natural", "discreto", "mimetismo" ou NAO menciona clareamento:
  Shades BL e W PROIBIDOS. Maximo A1/B1.
  Se cor VITA atual ja e A1/B1 e objetivo natural → MANTER. NAO escalar para BL/W.
  PROIBIDO: BL1, BL2, BL3, W1, W2, W3, W4, BL-L neste cenario.
  Priorizar naturalidade e mimetismo com dentes adjacentes.

SE nenhuma preferencia informada: DEFAULT para shades naturais (A1/B1). NAO assumir clareamento.

=== PROTOCOLO ADESIVO ===
| Situação                | Sistema recomendado                        |
|-------------------------|--------------------------------------------|
| Esmalte abundante       | Etch-and-rinse (2/3 passos)               |
| Predominância dentina   | Self-etch ou Universal (modo self-etch)    |
| Substrato escurecido    | Universal com etching seletivo em esmalte  |
| Dentes jovens/vitais    | Self-etch (menor sensibilidade)            |
| Dentes despolpados      | Etch-and-rinse (dentina esclerótica)       |
| Recobrimento de pino    | Universal com silano                       |

Substrato: "${p.substrate}" | Esmalte: "${p.enamelCondition || 'Íntegro'}"

MARCAS POR TIPO:
- Etch-and-rinse 2p: Single Bond 2(3M), Ambar(FGM), XP Bond(Dentsply)
- Etch-and-rinse 3p: Scotchbond Multi-Purpose(3M), OptiBond FL(Kerr)
- Self-etch 2p: Clearfil SE Bond(Kuraray), Tetric N-Bond Self-Etch(Ivoclar)
- Self-etch 1p: Bond Force(Tokuyama), G-Premio Bond(GC), Xeno V+(Dentsply)
- Universal: Single Bond Universal(3M), Clearfil Universal Quick(Kuraray), Prime&Bond Active(Dentsply), Adhese Universal(Ivoclar)

No checklist: tipo + marca. Ex: "Sistema universal (Single Bond Universal, 3M) em modo self-etch".

TECNICAS OBSOLETAS - NAO USAR: "Bisel em esmalte", "Bisel amplo", "Ácido 30s em dentina".
USAR: "Chanfro suave", "Sem preparo adicional", "Condicionamento conforme substrato".

=== ACABAMENTO E POLIMENTO (OBRIGATORIO) ===
1. Remoção excessos: Bisturi nº12, sonda exploradora
2. Contorno: Diamantadas FF (3118FF/2135FF), alta rotação com spray, movimentos leves sem pressão
   - 3118FF: Refinamento de contorno proximal, face vestibular E remoção de excessos PALATINOS/LINGUAIS
   - 2135FF: Refinamento de bordas incisais e superfícies planas
3. Discos Sof-Lex (SEQUENCIA LARANJA — padrão):
   - Laranja Escuro (Grosso) -> Laranja Médio (Médio) -> Laranja Claro (Fino) -> Amarelo (Ultrafino)
   - Baixa rotação, manter úmido, movimentos unidirecionais, sem pressão excessiva
   ALTERNATIVA Sof-Lex (SEQUENCIA VERMELHA — para maior agressividade):
   - Vermelho Escuro (Grosso) -> Vermelho Médio -> Vermelho Claro (Fino) -> Vermelho Ultrafino
   - Mesma sequência de uso, indicada para resinas com maior rugosidade inicial
4. Interproximal: Tiras de lixa, verificar ponto de contato
5. Borrachas: DHPro/American Burrs, 40-60s cada, baixa rotação, sem aquecer
6. Brilho final: Diamond Excel + feltro, baixa rotação, 40-60s
7. Texturização (OPCIONAL anterior): Diamantada fina p/ periquimáceas, face vestibular terço médio/incisal

${bruxism}

=== DICAS POR MARCA (incluir no "technique" de cada camada) ===
| Marca              | Dica                                                          |
|--------------------|---------------------------------------------------------------|
| FORMA              | Incrementos até 4mm (Giomer), 20s, nao gruda na espátula     |
| Palfique LX5       | Nano-híbrida esférica, 2mm, 10s, polir c/ Sof-Lex p/ brilho |
| Estelite Omega     | Supra-nano, 2mm, 10s, camada fina 0.3-0.5mm p/ translucidez |
| Harmonize          | ART (adapta cor), 2mm, 20s, boa p/ cor única                 |
| Vittra APS         | Zircônia pré-sinterizada, 2mm, 20s, bom custo-benefício      |
| IPS Empress Direct | Nano-híbrida opalescente, 2mm, 20s, BL-L p/ clareados        |
| Opallis/Opallis Flow| Flow ideal p/ forramento/translucidez, 1.5mm, 20s           |
EXCECAO: Camada de EFEITOS INCISAIS usa pincel/corante, NAO incrementos convencionais.

=== ESPESSURAS POR SUBSTRATO ===
| Condição            | Opaco      | Dentina   | Esmalte |
|---------------------|------------|-----------|---------|
| Normal/Saudável     | 0.2-0.3mm  | 0.5-1.0mm | 0.3mm   |
| Escurecido/Manchado | 0.5-0.8mm  | 0.5mm     | 0.3mm   |
| Restauração prévia  | 0.3-0.5mm  | 0.5mm     | 0.3mm   |

Substrato: "${p.substrateCondition || 'Normal'}"
${p.substrateCondition === 'Escurecido' ? 'SUBSTRATO ESCURECIDO: Opaco espesso (0.5-0.8mm)!' : ''}

=== NATURALIDADE (ANTERIOR) ===
- Gradiente: cervical saturado/opaco -> médio (VITA) -> incisal translúcido
- NUNCA borda incisal 100% opaca em anteriores
- Translucidez incisal + halo = naturalidade
- Integração com adjacentes (nao contraste de brilho)
- Opalescência e fluorescência adequadas

REGRAS CRITICAS:
- Checklist/steps DEVEM referenciar shades FINAIS (após substituição)
- resin_brand: "Fabricante - Linha" EXATAMENTE como no catálogo
- Contralaterais com MESMO diagnóstico -> protocolo IDENTICO
- Na "technique": APENAS técnica de inserção (nao info genérica de fotopolimerização)

=== CUIDADOS POS-RESINA (OBRIGATORIO em maintenance_advice) ===
1. Manutenção profissional 6/6 meses (profilaxia + polimento retoque)
2. Evitar pastas abrasivas (RDA <70)
3. Cuidado alimentos duros (cortar ao invés de morder)
4. Evitar hábitos parafuncionais
5. Retorno se sensibilidade ou alteração de cor

ALERTA GUIA DE SILICONE: Se anterior (11-13/21-23) + reanatomização + Grande/Extensa -> "Considerar guia de silicone (mock-up)".
1ª RECOMENDACAO CHECKLIST: Se paciente deseja BL1/BL2/Hollywood -> "Considerar clareamento previamente às resinas".

⚠️ VERIFICACAO FINAL ANTES DE GERAR JSON:
Se cavityClass contém "Diastema", "Fechamento", "Recontorno" ou "Faceta" E região anterior → CONTAR camadas no layers[]. Se < 4 → ADICIONAR camadas faltantes (Cristas Proximais é a mais frequentemente omitida).
Ordem obrigatória: 1. Aumento Incisal, 2. Cristas Proximais, 3. Dentina/Corpo, 4. Esmalte Vestibular Final.

Responda APENAS JSON:
{
  "recommended_resin_name": "nome (DEVE respeitar orçamento!)",
  "is_from_inventory": true|false,
  "ideal_resin_name": "null se recommended JA e ideal",
  "ideal_reason": "null se nao aplicável",
  "budget_compliance": true|false,
  "price_range": "Econômico|Intermediário|Médio-alto|Premium",
  "justification": "2-3 frases incluindo orçamento",
  "inventory_alternatives": [{"name":"...","manufacturer":"...","reason":"..."}],
  "external_alternatives": [{"name":"...","manufacturer":"...","reason":"..."}],
  "protocol": {
    "layers": [{"order":1,"name":"...","resin_brand":"Fabricante - Linha","shade":"...","thickness":"...","purpose":"...","technique":"...","optional":"true apenas p/ Efeitos Incisais"}],
    "alternative": {"resin":"...","shade":"...","technique":"...","tradeoff":"..."},
    "finishing": {
      "contouring": [{"order":1,"tool":"...","grit":"...","speed":"...","time":"...","tip":"..."}],
      "polishing": [
        {"order":1,"tool":"Disco Sof-Lex Laranja Escuro","grit":"Grossa","speed":"Baixa rotação","time":"30s","tip":"Cervical-incisal"},
        {"order":2,"tool":"Disco Sof-Lex Laranja Médio","grit":"Média","speed":"Baixa rotação","time":"30s","tip":"Manter úmido"},
        {"order":3,"tool":"Disco Sof-Lex Laranja Claro","grit":"Fina","speed":"Baixa rotação","time":"30s","tip":"Sem pressão"},
        {"order":4,"tool":"Disco Sof-Lex Amarelo","grit":"Ultrafina","speed":"Baixa rotação","time":"30s","tip":"Polimento final"},
        {"order":5,"tool":"Borracha grossa (DHPro)","speed":"Baixa rotação","time":"40-60s","tip":"Intermitente, sem aquecer"},
        {"order":6,"tool":"Borracha média","speed":"Baixa rotação","time":"40-60s","tip":"Úmido"},
        {"order":7,"tool":"Borracha fina","speed":"Baixa rotação","time":"40-60s","tip":"Intermediário"},
        {"order":8,"tool":"Espiral polimento","speed":"Baixa rotação","time":"40-60s","tip":"Brilho pré-final"}
      ],
      "final_glaze": "Diamond Excel + feltro, baixa rotação, 40s",
      "maintenance_advice": "Manutenção 6/6 meses, pastas RDA<70, cuidado alimentos duros (cortar), evitar parafunção, retorno se sensibilidade/alteração cor."
    },
    "checklist": ["Passo 1: Profilaxia sem flúor","Passo 2: Seleção cor luz natural","Passo 3: Isolamento","Passo 4: Condicionamento conforme substrato","Passo 5: Sistema adesivo [tipo+marca]","..."],
    "alerts": ["Protocolo adesivo varia entre fabricantes","..."],
    "warnings": ["..."],
    "confidence": "alta|média|baixa"
  }
}

Responda APENAS com o JSON.`
  },
}
