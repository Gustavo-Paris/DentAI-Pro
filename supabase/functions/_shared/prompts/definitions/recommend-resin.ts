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
  // Clinical case data
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

  // Resin catalog (pre-grouped by price)
  allGroups: ResinGroups

  // Inventory data
  hasInventory: boolean
  budgetAppropriateInventory: ResinData[]
  inventoryResins: ResinData[]

  // Contralateral protocol (if already processed)
  contralateralProtocol?: unknown
  contralateralTooth?: string | null

  // DSD context for this specific tooth
  dsdContext?: {
    currentIssue: string
    proposedChange: string
    observations: string[]
  }
}

// ---------- helpers ----------

function formatResinList(resinList: ResinData[]): string {
  return resinList
    .map(
      (r) => `
- ${r.name} (${r.manufacturer})
  Tipo: ${r.type}
  Indica\u00e7\u00f5es: ${r.indications.join(', ')}
  Opacidade: ${r.opacity}
  Resist\u00eancia: ${r.resistance}
  Polimento: ${r.polishing}
  Est\u00e9tica: ${r.aesthetics}
  Faixa de pre\u00e7o: ${r.price_range}
  Descri\u00e7\u00e3o: ${r.description || 'N/A'}
`
    )
    .join('\n')
}

function buildBudgetRulesSection(budget: string): string {
  return `
=== REGRAS DE ORÇAMENTO (OBRIGATÓRIO SEGUIR!) ===

O orçamento selecionado pelo paciente é: "${budget}"

MAPEAMENTO DE ORÇAMENTO PARA FAIXAS DE PREÇO:
- Orçamento "padrão": Recomendar resinas "Econômico", "Intermediário" ou "Médio-alto". EVITAR "Premium"
- Orçamento "premium": Pode recomendar QUALQUER faixa, priorizando as melhores tecnicamente

⚠️ REGRA CRÍTICA: A recomendação principal DEVE respeitar o orçamento do paciente!
- Se o orçamento é "padrão", NÃO recomende resinas Premium como Filtek Z350 XT, Estelite Omega, Venus Diamond
- Apenas para orçamento "premium" você pode recomendar resinas Premium
`
}

function buildResinsByPriceSection(allGroups: ResinGroups): string {
  return `
=== RESINAS ORGANIZADAS POR FAIXA DE PREÇO ===

**ECONÔMICAS** (para orçamento padrão):
${allGroups.economico.length > 0 ? formatResinList(allGroups.economico) : 'Nenhuma resina nesta faixa'}

**INTERMEDIÁRIAS** (para orçamento padrão):
${allGroups.intermediario.length > 0 ? formatResinList(allGroups.intermediario) : 'Nenhuma resina nesta faixa'}

**MÉDIO-ALTO** (para orçamento padrão ou premium):
${allGroups.medioAlto.length > 0 ? formatResinList(allGroups.medioAlto) : 'Nenhuma resina nesta faixa'}

**PREMIUM** (APENAS para orçamento premium):
${allGroups.premium.length > 0 ? formatResinList(allGroups.premium) : 'Nenhuma resina nesta faixa'}
`
}

function buildInventorySection(
  hasInventory: boolean,
  budget: string,
  budgetAppropriateInventory: ResinData[],
  inventoryResins: ResinData[]
): string {
  if (hasInventory) {
    return `
=== RESINAS NO INVENT\u00c1RIO DO DENTISTA ===
${budgetAppropriateInventory.length > 0
    ? `Resinas do invent\u00e1rio compat\u00edveis com or\u00e7amento "${budget}":\n${formatResinList(budgetAppropriateInventory)}`
    : `⚠️ Nenhuma resina do inventário é compatível com o orçamento "${budget}".
INSTRUÇÃO OBRIGATÓRIA: Use as resinas do CATÁLOGO GERAL (seção "RESINAS ORGANIZADAS POR FAIXA DE PREÇO" acima) para gerar o protocolo completo. O protocolo NÃO pode ficar vazio.`}

Outras resinas do invent\u00e1rio (fora do or\u00e7amento):
${inventoryResins.filter((r) => !budgetAppropriateInventory.includes(r)).length > 0
    ? formatResinList(inventoryResins.filter((r) => !budgetAppropriateInventory.includes(r)))
    : 'Nenhuma'}
`
  }

  return `
NOTA: O dentista ainda n\u00e3o cadastrou seu invent\u00e1rio. Recomende a melhor op\u00e7\u00e3o considerando o or\u00e7amento "${budget}".
`
}

function buildInventoryInstructions(hasInventory: boolean, budget: string): string {
  if (hasInventory) {
    return `
=== REGRA ABSOLUTA DE INVENTÁRIO (OBRIGATÓRIO!) ===

⚠️⚠️⚠️ O dentista POSSUI inventário cadastrado. Isto significa que ele TEM essas resinas em mãos. ⚠️⚠️⚠️

REGRA #1 (INVIOLÁVEL): A resina principal (recommended_resin_name) DEVE ser do inventário do dentista.
REGRA #2: TODAS as camadas do protocolo de estratificação (layers[].resin_brand) DEVEM usar resinas do inventário.
REGRA #3: Se a resina tecnicamente ideal NÃO está no inventário, use a mais próxima DISPONÍVEL no inventário.
REGRA #4: Resinas externas (fora do inventário) só podem aparecer em ideal_resin_name como sugestão futura.

NUNCA recomendar resinas que o dentista NÃO possui quando ele tem inventário cadastrado.
Se o inventário é limitado, adapte o protocolo para usar o que está disponível.

INSTRUÇÕES DE PRIORIDADE (seguir nesta ordem):
1. PRIMEIRO: Verificar orçamento - a resina DEVE estar na faixa de preço adequada ao orçamento "${budget}"
2. SEGUNDO: Dentro das resinas adequadas ao orçamento, USAR OBRIGATORIAMENTE as que estão no inventário do dentista
3. TERCEIRO: Se nenhuma do inventário for adequada ao orçamento, recomendar a melhor opção do inventário independente da faixa (e marcar budget_compliance=false)
4. QUARTO: Aspectos técnicos (indicação clínica, estética, resistência) como critério de desempate

IMPORTANTE:
- Se o inventário tem resinas adequadas ao orçamento, use-as como principal
- A resina ideal tecnicamente pode ser mencionada como sugestão futura se estiver fora do inventário
- O campo "is_from_inventory" DEVE ser true quando o dentista tem inventário`
  }

  return `
INSTRUÇÕES DE PRIORIDADE (seguir nesta ordem):
1. PRIMEIRO: Verificar orçamento - a resina DEVE estar na faixa de preço adequada ao orçamento "${budget}"
2. SEGUNDO: Dentro das resinas adequadas ao orçamento, escolher a melhor tecnicamente para o caso
3. TERCEIRO: Aspectos técnicos (indicação clínica, estética, resistência) como critério de seleção

IMPORTANTE: Não recomende resinas Premium se o orçamento não for premium!`
}

function buildAdvancedStratificationSection(aestheticLevel: string): string {
  if (!['estético', 'alto', 'muito alto'].includes(aestheticLevel)) return ''

  return `
=== ESTRATIFICAÇÃO AVANÇADA (NÍVEL ESTÉTICO ${aestheticLevel.toUpperCase()}) ===

Para excelência estética, você pode COMBINAR DIFERENTES MARCAS por camada:

TABELA DE RESINAS RECOMENDADAS POR CAMADA:
┌─────────────────────┬─────────────────────────────────────────────────┐
│ Camada              │ Resinas Recomendadas                            │
├─────────────────────┼─────────────────────────────────────────────────┤
│ Aumento Incisal     │ CT (Z350), Trans (Forma), Trans (Vittra APS)   │
│                     │ Trans20 (Empress Direct)                        │
├─────────────────────┼─────────────────────────────────────────────────┤
│ Cristas Proximais   │ XLE (Harmonize), BL-L (Empress), WE (Z350)     │
│                     │ Usar 1 tom mais claro que corpo                 │
├─────────────────────┼─────────────────────────────────────────────────┤
│ Dentina/Corpo       │ WB (Forma), WB/A1B/A2B (Z350), DA1/DA2 (Vittra)│
│                     │ D BL-L (Empress)                                │
├─────────────────────┼─────────────────────────────────────────────────┤
│ Efeitos Incisais    │ Ver seção EFEITOS INCISAIS EXPANDIDA abaixo     │
├─────────────────────┼─────────────────────────────────────────────────┤
│ Esmalte Vestibular  │ WE (Palfique LX5), MW (Estelite)               │
│ Final (acabamento)  │ A1E/A2E (Z350) — priorizar polimento superior  │
├─────────────────────┼─────────────────────────────────────────────────┤
│ Dentes Clareados    │ WE (Estelite Bianco), BL (Forma)               │
└─────────────────────┴─────────────────────────────────────────────────┘

⚠️ REGRA CRÍTICA — DIVERSIDADE DE MARCAS (OBRIGATÓRIO):
- É PROIBIDO usar a mesma linha de produto (ex: "3M ESPE - Filtek Z350 XT") para TODAS as 5 camadas
- CADA camada deve usar a resina MAIS INDICADA para sua função específica:
  • Aumento Incisal: Trans (FORMA) ou Trans20 (IPS Empress Direct) — translucidez superior
  • Cristas Proximais: XLE (Harmonize) ou BL-L (Empress Direct) — adaptação cromática
  • Dentina/Corpo: WB (FORMA) ou Vittra APS — opacidade e volume
  • Efeitos Incisais: Corantes IVOCLAR (IPS Color) — Z350 NÃO possui corantes próprios!
  • Esmalte Vestibular Final: Palfique LX5 (WE) ou Estelite Omega (MW) — polimento superior
- A Z350 pode ser usada em 1-2 camadas, mas NÃO em todas
- EXCEÇÃO: Se o inventário do dentista só possui Z350, então usar Z350 para todas é aceitável — mas marcar nas observações

=== EFEITOS INCISAIS EXPANDIDA ===

SUB-OPÇÕES DE EFEITOS INCISAIS (incluir como etapas dentro da camada "Efeitos Incisais"):

┌─────────────────────┬──────────────────────────────────────────────────────────┐
│ Efeito              │ Materiais e Técnica                                      │
├─────────────────────┼──────────────────────────────────────────────────────────┤
│ Halo Opaco          │ Opallis Flow (FGM) ou Empress Opal (Ivoclar)            │
│ (borda incisal)     │ Fina linha de 0.1mm na borda incisal para efeito opaco  │
├─────────────────────┼──────────────────────────────────────────────────────────┤
│ Corante Branco      │ Kolor+ Plus White (Kerr) ou IPS Color White (Ivoclar)   │
│                     │ Micro-pontos para white spots naturais                   │
├─────────────────────┼──────────────────────────────────────────────────────────┤
│ Corante Âmbar       │ Kolor+ Plus Amber (Kerr) ou IPS Color Honey (Ivoclar)   │
│                     │ Linhas finas para craze lines e characterization         │
├─────────────────────┼──────────────────────────────────────────────────────────┤
│ Mamelos             │ Dentina clara (A1, B1) aplicada em projeções verticais   │
│                     │ Na borda incisal, mimetizando dentina natural            │
└─────────────────────┴──────────────────────────────────────────────────────────┘

REGRAS DE INCLUSÃO:
- Nível "alto": Incluir pelo menos HALO OPACO como etapa opcional (optional: true)
- Nível "muito alto": Incluir halo opaco + corantes + mamelos como etapas opcionais
- SEMPRE marcar optional: true para efeitos — são melhorias, não obrigatórias

=== CAMADAS DE CARACTERIZAÇÃO (OPCIONAL PARA MÁXIMA NATURALIDADE) ===

Para restaurações que pareçam INDISTINGUÍVEIS de dentes naturais:

CARACTERIZAÇÃO COM TINTS/STAINS:
┌─────────────────────┬─────────────────────────────────────────────────┐
│ Caracterização      │ Como Aplicar                                    │
├─────────────────────┼─────────────────────────────────────────────────┤
│ White spots         │ Micro-pontos de tint branco no terço médio      │
│ Craze lines         │ Linhas finas de tint âmbar/marrom               │
│ Mamelons            │ Projeções de dentina na borda incisal           │
│ Halo incisal        │ Fina linha de esmalte ultra-translúcido na borda│
│ Foseta proximal     │ Depressão sutil nas faces proximais             │
└─────────────────────┴─────────────────────────────────────────────────┘

IMPORTANTE: Caracterização excessiva = resultado artificial
- Use com MODERAÇÃO - menos é mais
- Copie as características dos dentes ADJACENTES do paciente
- Evite criar "dente perfeito" ao lado de dentes naturais com caracterizações

REGRAS DE COMBINAÇÃO:
1. PRIORIZE resinas do inventário do usuário para o maior número de camadas possível
2. Sugira resinas externas APENAS para camadas críticas onde fazem diferença real
3. Na alternativa, indique opção mais simples usando UMA marca só
4. Inclua na justificativa o benefício específico de cada marca escolhida
`
}

function buildBruxismSection(bruxism: boolean): string {
  if (!bruxism) return ''

  return `
=== ALERTAS ENF\u00c1TICOS DE BRUXISMO ===
\u26a0\ufe0f\u26a0\ufe0f\u26a0\ufe0f PACIENTE BRUXISTA - ATEN\u00c7\u00c3O REDOBRADA! \u26a0\ufe0f\u26a0\ufe0f\u26a0\ufe0f

REGRAS OBRIGAT\u00d3RIAS PARA BRUXISTAS:
1. RESINAS: Priorize nano-h\u00edbridas ou micro-h\u00edbridas de alta resist\u00eancia (Ex: Filtek Z350, Estelite Omega, Harmonize)
2. CAMADA DE ESMALTE: Reduza espessura para 0.2-0.3mm (menos tens\u00e3o)
3. OCLUS\u00c3O: Verificar e ajustar contatos prematuros antes do procedimento
4. PROTE\u00c7\u00c3O: Placa oclusal noturna \u00e9 OBRIGAT\u00d3RIA - incluir no checklist

INCLUIR NOS ALERTAS/WARNINGS:
- "BRUXISMO: Prescreva placa de prote\u00e7\u00e3o noturna obrigatoriamente"
- "BRUXISMO: Documente orienta\u00e7\u00e3o no prontu\u00e1rio"
- "BRUXISMO: Agendar retorno em 7 dias para verificar desgaste"
`
}

function buildAestheticGoalsSection(aestheticGoals?: string): string {
  if (!aestheticGoals) return ''

  return `
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
  PREFER\u00caNCIAS EST\u00c9TICAS DO PACIENTE
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

O paciente expressou os seguintes desejos:
"${aestheticGoals}"

INSTRU\u00c7\u00d5ES PARA AN\u00c1LISE DAS PREFER\u00caNCIAS:
- Analise o texto acima e extraia as prefer\u00eancias est\u00e9ticas do paciente
- Se mencionar clareamento/branco/mais claro: ajuste cores 1-2 tons mais claros
  (ex: se detectou A3, use A2 ou A1; se detectou A1, use BL4 ou BL3)
- Se mencionar natural/discreto: priorize translucidez e mimetismo natural
- Se mencionar sensibilidade: considere sistemas self-etch e protetores pulpares
- Se mencionar durabilidade/longevidade: priorize resinas de alta resist\u00eancia
- Se mencionar conservador/minimamente invasivo: t\u00e9cnicas conservadoras

Aplique TODAS as prefer\u00eancias identificadas no protocolo de estratifica\u00e7\u00e3o.
Quando aplicar clareamento, use cores mais claras em TODAS as camadas:
- Camada Opaco/Dentina: vers\u00e3o opaca do tom clareado
- Camada Body: tom clareado
- Camada Esmalte: vers\u00e3o esmalte do tom clareado ou um tom ainda mais claro
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
`
}

function buildDSDContextSection(dsdContext?: { currentIssue: string; proposedChange: string; observations: string[] }): string {
  if (!dsdContext) return ''

  const observationsList = dsdContext.observations?.length
    ? dsdContext.observations.map(o => `- ${o}`).join('\n')
    : ''

  return `
=== CONTEXTO DO PLANEJAMENTO DIGITAL (DSD) ===
A análise DSD identificou para este dente:
- Situação atual: ${dsdContext.currentIssue}
- Mudança proposta: ${dsdContext.proposedChange}
${observationsList ? `\nObservações estéticas gerais:\n${observationsList}` : ''}

⚠️ O protocolo de estratificação DEVE considerar estes achados do DSD.
- Se o DSD propõe aumento incisal, o protocolo deve incluir camada de aumento incisal adequada
- Se o DSD propõe correção de proporção, ajustar espessuras das camadas
- Se há observações sobre simetria, garantir consistência com dentes contralaterais
`
}

function buildContralateralSection(
  contralateralTooth: string | null | undefined,
  contralateralProtocol: unknown
): string {
  if (!contralateralTooth || !contralateralProtocol) return ''

  return `
=== REGRA DE DIFERENCIAÇÃO HOMÓLOGOS ===
- Dentes homólogos (13/23, 12/22, 11/21) com diagnósticos IDÊNTICOS:
  → PROTOCOLO deve ser idêntico (mesmas camadas, cores, técnicas)
  → MAS observações/notas devem ser RESUMIDAS: "Mesmo protocolo do dente [contralateral]"
  → NÃO repita textualmente as mesmas observações em ambos

=== CONSISTÊNCIA DE RESINAS NO MESMO PACIENTE ===
⚠️ REGRA OBRIGATÓRIA: Dentes do MESMO paciente com tratamentos SEMELHANTES devem usar:
- MESMA marca de resina (resin_brand)
- MESMAS cores por camada (shades)
- MESMA técnica de estratificação

EXCEÇÕES permitidas APENAS quando:
- Dente com substrato ESCURECIDO necessita de opaco extra
- Mudança de cor SIGNIFICATIVA em um dente específico
- Tipos de tratamento DIFERENTES (resina vs porcelana)

❌ PROIBIDO: Mesmo paciente, mesmo tipo de tratamento → resinas diferentes entre dentes

=== PROTOCOLO DO DENTE CONTRALATERAL (OBRIGATÓRIO COPIAR!) ===
⚠️ O dente contralateral ${contralateralTooth} JÁ FOI PROCESSADO e recebeu este protocolo:

${JSON.stringify(contralateralProtocol, null, 2)}

REGRA OBRIGATÓRIA: O protocolo para ESTE dente DEVE ser IDÊNTICO ao do dente ${contralateralTooth}:
- MESMO número de camadas
- MESMOS shades em cada camada
- MESMA resina (resin_brand)
- MESMA técnica
- MESMO nível de confiança
- Adapte APENAS o número do dente nas referências textuais
`
}

// ---------- prompt definition ----------

export const recommendResin: PromptDefinition<Params> = {
  id: 'recommend-resin',
  name: 'Recomenda\u00e7\u00e3o de Resina',
  description: 'Gera recomenda\u00e7\u00e3o completa de resina com protocolo de estratifica\u00e7\u00e3o',
  model: 'gemini-3-flash-preview',
  temperature: 0.3,
  maxTokens: 8192,
  mode: 'text',

  system: () => '',

  user: (p: Params) => {
    const budgetRulesSection = buildBudgetRulesSection(p.budget)
    const resinsByPriceSection = buildResinsByPriceSection(p.allGroups)
    const inventorySection = buildInventorySection(
      p.hasInventory,
      p.budget,
      p.budgetAppropriateInventory,
      p.inventoryResins
    )
    const inventoryInstructions = buildInventoryInstructions(p.hasInventory, p.budget)
    const advancedStratification = buildAdvancedStratificationSection(p.aestheticLevel)
    const bruxismSection = buildBruxismSection(p.bruxism)
    const aestheticGoalsSection = buildAestheticGoalsSection(p.aestheticGoals)
    const dsdContextSection = buildDSDContextSection(p.dsdContext)
    const contralateralSection = buildContralateralSection(p.contralateralTooth, p.contralateralProtocol)

    return `Voc\u00ea \u00e9 um especialista em materiais dent\u00e1rios e t\u00e9cnicas restauradoras. Analise o caso cl\u00ednico abaixo e forne\u00e7a uma recomenda\u00e7\u00e3o COMPLETA com protocolo de estratifica\u00e7\u00e3o.

${budgetRulesSection}

CASO CL\u00cdNICO:
- Idade do paciente: ${p.patientAge} anos
- Dente: ${p.tooth}
- Regi\u00e3o: ${p.region}
- Classe da cavidade: ${p.cavityClass}
- Tamanho da restaura\u00e7\u00e3o: ${p.restorationSize}
- Profundidade: ${p.depth || 'N\u00e3o especificada'}
- Substrato: ${p.substrate}
- Condi\u00e7\u00e3o do substrato: ${p.substrateCondition || 'Normal'}
- Condi\u00e7\u00e3o do esmalte: ${p.enamelCondition || '\u00cdntegro'}
- N\u00edvel est\u00e9tico: ${p.aestheticLevel}
- Cor do dente (VITA): ${p.toothColor}
- Necessita estratifica\u00e7\u00e3o: ${p.stratificationNeeded ? 'Sim' : 'N\u00e3o'}
- Bruxismo: ${p.bruxism ? 'Sim' : 'N\u00e3o'}
- Expectativa de longevidade: ${p.longevityExpectation}
- Or\u00e7amento: ${p.budget} \u26a0\ufe0f RESPEITAR ESTA FAIXA!
${p.clinicalNotes ? `- Observa\u00e7\u00f5es cl\u00ednicas: ${p.clinicalNotes}` : ''}
${aestheticGoalsSection}
${dsdContextSection}

${resinsByPriceSection}
${inventorySection}
${inventoryInstructions}
${contralateralSection}

=== PROTOCOLO ESPECIAL: RECONTORNO INCISAL (DESGASTE) ===
⚠️ Quando a classe da cavidade for "Recontorno Estético" E o DSD/indicação mencionar DIMINUIR o bordo incisal (desgaste, recontorno para diminuir), gere um PROTOCOLO DE RECONTORNO ao invés de estratificação:

Se o caso for de DESGASTE/DIMINUIÇÃO do bordo incisal:
- NÃO gere camadas de estratificação
- Gere um protocolo com os seguintes passos no array "layers":
  1. order: 1, name: "Planejamento e Marcação", resin_brand: "N/A", shade: "N/A", thickness: "N/A", purpose: "Marcar com caneta para resina a área a ser desgastada. Verificar guia incisal e função oclusal", technique: "Usar caneta marcadora específica para resina. Conferir com papel carbono articular"
  2. order: 2, name: "Desgaste Inicial", resin_brand: "N/A", shade: "N/A", thickness: "0.5-1.0mm", purpose: "Remover volume marcado com cuidado até atingir comprimento planejado", technique: "Ponta diamantada 2135 em alta rotação com spray. Movimentos suaves vestíbulo-palatino"
  3. order: 3, name: "Refinamento", resin_brand: "N/A", shade: "N/A", thickness: "0.1-0.2mm", purpose: "Suavizar ângulos e definir forma final do bordo incisal", technique: "Ponta diamantada FF (3118FF ou 2135FF). Alta rotação com spray, movimentos leves"
  4. order: 4, name: "Acabamento", resin_brand: "N/A", shade: "N/A", thickness: "N/A", purpose: "Alisar superfície e remover riscos do desgaste", technique: "Discos Sof-Lex sequência completa: Preto → Azul escuro → Azul médio → Azul claro. Movimentos unidirecionais"
  5. order: 5, name: "Polimento Final", resin_brand: "N/A", shade: "N/A", thickness: "N/A", purpose: "Devolver brilho ao esmalte desgastado", technique: "Pasta diamantada (Diamond Excel) + disco de feltro em baixa rotação por 40-60s"
- Inclua "finishing" normalmente com passos equivalentes
- Inclua "checklist" com: verificar guia incisal, verificar função oclusal, checar simetria com contralateral, aplicar flúor após desgaste
- Se o caso NÃO mencionar diminuir/desgastar (é um acréscimo incisal), use o protocolo normal de estratificação abaixo.

${advancedStratification}

=== PROTOCOLO DE ESTRATIFICAÇÃO - CAMADAS (ATUALIZADO V2) ===
\u26a0\ufe0f CR\u00cdTICO: A cor escolhida DEVE corresponder ao tipo da camada E existir na linha de produto!

ESTRUTURA OBRIGAT\u00d3RIA - 5 CAMADAS (simplificar para 2-3 se n\u00edvel est\u00e9tico funcional):

1. AUMENTO INCISAL (primeira etapa, SE NECESSÁRIO):
   - Objetivo: Construção da borda incisal, SE NECESSÁRIO
   - Resinas: Esmalte translúcido — Trans (FORMA), CT (Z350), Trans20 (IPS Empress Direct)
   - Espessura: 0.2-0.3mm
   - Técnica: Incrementos de até 2mm, fotopolimerizar 20s. Aplicar incremento único na borda do dente para aumentar ou alinhar a incisal, criando base para os mamelons. NÃO fracionar em múltiplos incrementos — camada fina e única

2. CRISTAS PROXIMAIS (definição anatômica - ANTES da dentina):
   - Objetivo: Definição das cristas mesial e distal
   - Resinas: XLE (Harmonize), BL-L (Empress Direct), WE (Z350) — esmalte um tom mais claro que o dente
   - Para pacientes com DENTES CLAREADOS ou que desejam cor mais clara:
     → Opção padrão: XLE (Harmonize)
     → Opção clareada: BL-L (IPS Empress Direct) ou Bianco (Estelite)
   - Espessura: 0.2mm
   - Técnica: Aplicar nas bordas proximais para criar profundidade. O incremento pode ser tracionado com tira de poliéster para melhor adaptação da resina nas bordas proximais e resultado mais uniforme

3. DENTINA/CORPO (estrutura principal - OPCIONAL para altera\u00e7\u00f5es m\u00ednimas):
   - Objetivo: Adicionar volume caso necess\u00e1rio e mascarar interface dente/resina
   - Em casos de POUCA MUDAN\u00c7A (recontorno est\u00e9tico, leve aumento incisal):
     \u2192 Esta camada \u00e9 OPCIONAL - marcar "optional": true
     \u2192 O esmalte pode ser aplicado diretamente sobre o dente
   - Em casos de mudan\u00e7a SIGNIFICATIVA (cavidade profunda, substrato comprometido):
     \u2192 Esta camada \u00e9 OBRIGAT\u00d3RIA
   - Resinas: WB (FORMA), DA1/DA2 (Vittra APS), WB (Z350) ou Dentina clara (B1)
   - Espessura: 0.5-1.0mm
   - Técnica: Nesta etapa, reproduzir os mamelos com ponta de espátula fina, se aplicável e conforme a anatomia dos dentes homólogos
   - Com mascaramento integrado se substrato exigir (NÃO criar camada separada de opaco)

   \u26a0\ufe0f IMPORTANTE: Opaco N\u00c3O \u00e9 camada separada - \u00e9 a sele\u00e7\u00e3o de SHADE dentro da dentina!

   Sele\u00e7\u00e3o de shade conforme substrato:

   a) Substrato ESCURECIDO ou endodonticamente tratado:
      - Usar shades opacos para mascaramento (OA1, OA2, OA3, OB1, WO)
      - Aplicar como PRIMEIRO incremento da camada de dentina com 0.5-1mm de espessura
      - N\u00c3O listar como camada separada - incluir na descri\u00e7\u00e3o da camada Dentina/Corpo
      - Ex: "Dentina/Corpo com mascaramento inicial (OA2 0.5mm + A2 body)"

   b) Substrato NORMAL (esmalte saud\u00e1vel, dentina clara):
      - Usar shades de dentina regulares (DA1, DA2, DA3, A1, A2, A3, B1, B2)
      - N\u00c3O usar shades opacos - criam aspecto artificial "morto"

   c) Substrato LEVEMENTE ESCURECIDO:
      - Usar shades de dentina com maior opacidade (DA3, A3) sem prefixo O
      - Evita necessidade de opaco dedicado

4. EFEITOS INCISAIS (OPCIONAL - flag optional: true):
   - Objetivo: Confecção de halo opaco incisal
   - ⚠️ REGRA CRÍTICA DE CORANTES — NUNCA indicar Z350 para esta camada!
     A Z350 NÃO possui corantes/pigmentos próprios para efeitos incisais.
     Para efeitos incisais, usar EXCLUSIVAMENTE:
     - IVOCLAR IPS Empress Direct Color (White, Blue, Honey, Brown) — PRIORIDADE MÁXIMA
     - IPS Color (Ivoclar) — corantes específicos para caracterização
     - OU dentina clara como substituto de último recurso
   - Resinas alternativas para translucidez (NÃO para corantes): CT, GT, BT (Z350 translúcidos)
   - Espessura: 0.1mm
   - Técnica: Aplicar corante com pincel fino na borda incisal para criar efeito de halo opaco natural. NÃO usar incrementos convencionais — efeitos incisais são aplicados com pincel ou instrumento de ponta fina
   - INCLUIR apenas para demanda estética "estético" (ou legados "alto"/"muito alto")
   - Shade DEVE ser diferente do shade da camada de esmalte

   \u26a0\ufe0f REGRA CR\u00cdTICA DE SHADE PARA EFEITOS:
   - O shade da camada de efeitos DEVE SER DIFERENTE do shade da camada de esmalte!
   - Efeitos deve usar shades TRANSL\u00daCIDOS/OPALESCENTES: CT, GT, BT, YT (Z350), Trans, Opal
   - Z350 XT transl\u00facidos: CT (Clear Trans), GT (Gray Trans), BT (Blue Trans), YT (Yellow Trans). WT N\u00c3O EXISTE na Z350 \u2014 use WB (White Body) se precisar de opacidade branca
   - \u274c ERRADO: Efeitos=A1E, Esmalte=A1E (shades id\u00eanticos = sem diferencia\u00e7\u00e3o \u00f3ptica)
   - \u2705 CERTO: Efeitos=CT (transl\u00facido), Esmalte=A1E (esmalte colorido)
   - Se a linha n\u00e3o possuir shade transl\u00facido diferente do esmalte, OMITA esta camada

   \u274c OMITIR para:
   - Casos rotineiros de posteriores
   - Restaura\u00e7\u00f5es pequenas (Classe I, V)
   - N\u00edvel est\u00e9tico "funcional" (ou legados "m\u00e9dio"/"baixo")

   \u26a0\ufe0f Quando incluir esta camada no JSON, DEVE ter "optional": true

5. ESMALTE VESTIBULAR FINAL (camada externa):
   - Objetivo: Camada externa com alto polimento
   - Espessura: 0.3mm
   - Priorizar resinas com melhor capacidade de polimento

   PRIORIDADE 1 (melhor polimento - RECOMENDADO):
   - Palfique LX5 (WE - White Enamel): acabamento espelhado, polimento superior
   - Estelite Omega/Sigma Quick (MW, WE): nanopart\u00edculas esf\u00e9ricas, excelente polimento

   PRIORIDADE 2 (bom polimento):
   - Filtek Z350 XT (A1E, A2E, A3E, B1E, CT, GT, BT, YT): nanocluster, bom polimento
   - FORMA Ultradent (Trans, Enamel): boa capacidade

   PRIORIDADE 3 (polimento adequado):
   - Harmonize (Incisal, TN): polimento aceit\u00e1vel
   - Vittra APS (Trans, INC): polimento b\u00e1sico

   Para shades BL (branqueamento):
   - Verificar se linha possui shades BL
   - Linhas COM shades BL: Palfique LX5, Forma, Filtek Z350 XT, Estelite Bianco
   - Se linha N\u00c3O tem BL: alertar e sugerir shade mais pr\u00f3ximo (A1, B1)

SIMPLIFICAÇÃO POR NÍVEL ESTÉTICO:
- Nível "funcional": 2-3 camadas (Dentina/Corpo + Esmalte Vestibular Final + Aumento Incisal SE NECESSÁRIO)
- Nível "estético": 4-5 camadas (Aumento Incisal + Cristas Proximais + Dentina/Corpo + Efeitos Incisais com optional: true + Esmalte Vestibular Final)
NOTA BACKWARD-COMPAT: Se o nível for "baixo" ou "médio", tratar como "funcional". Se for "alto" ou "muito alto", tratar como "estético".

TABELA DE CORES DE ESMALTE POR LINHA:
\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502 Linha de Produto    \u2502 Cores de Esmalte Dispon\u00edveis        \u2502
\u251c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524
\u2502 Estelite Sigma Quick\u2502 WE (White Enamel), CE (Clear Enamel)\u2502
\u2502 Estelite Omega      \u2502 WE, JE (Jet Enamel), CT, MW         \u2502
\u2502 Filtek Z350 XT      \u2502 CT, GT, BT, YT, A1E, A2E, A3E, B1E                      \u2502
\u2502 Harmonize           \u2502 Incisal, TN (Trans Neutral)         \u2502
\u2502 IPS Empress Direct  \u2502 Trans 20, Trans 30, Opal            \u2502
\u2502 Vittra APS          \u2502 Trans, INC                          \u2502
\u2502 Palfique LX5        \u2502 Enamel shades, CE                   \u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518

EXEMPLO CORRETO para cor A2 em Classe IV com Estelite Sigma Quick:
\u274c ERRADO: Opaco=OA1, Dentina=OA1, Esmalte=B1 (OA1 na dentina! B1 n\u00e3o \u00e9 esmalte!)
\u2705 CERTO: Opaco=OA2, Dentina=A2, Esmalte=WE ou CE (cores espec\u00edficas de esmalte!)

=== REGRAS PARA CLAREAMENTO (BLEACH SHADES) ===
Se o paciente pede clareamento (BL1, BL2, BL3, Hollywood):

1. VERIFICAR se a linha recomendada possui cores BL no cat\u00e1logo
2. Se N\u00c3O possui cores BL:
   - Usar a cor mais clara dispon\u00edvel (ex: B1, A1) como aproxima\u00e7\u00e3o
   - N\u00c3O gere alerta sobre BL — o sistema gera automaticamente
3. Se POSSUI cores BL:
   - Usar BL4, BL3, BL2, BL1 conforme n\u00edvel de clareamento desejado

LINHAS COM CORES BL DISPON\u00cdVEIS:
- Palfique LX5: BL1, BL2, BL3
- Forma (Ultradent): BL
- Filtek Z350 XT: WB, WE (aproxima\u00e7\u00e3o)
- Estelite Bianco/MW: espec\u00edfica para clareados
- IPS Empress Direct: BL-L (esmalte transl\u00facido para clareados)

LINHAS SEM CORES BL:
- Estelite Sigma Quick (usar B1/A1 como aproxima\u00e7\u00e3o)
- Vittra APS (usar A1 como aproxima\u00e7\u00e3o)

INSTRU\u00c7\u00d5ES PARA PROTOCOLO DE ESTRATIFICA\u00c7\u00c3O (V2):

ESTRUTURA DO PROTOCOLO - 2 a 5 CAMADAS conforme n\u00edvel est\u00e9tico (ver se\u00e7\u00e3o SIMPLIFICA\u00c7\u00c3O POR N\u00cdVEL EST\u00c9TICO acima):

N\u00cdVEL FUNCIONAL (2-3 camadas):
- Camada 1: Dentina/Corpo
- Camada 2: Esmalte Vestibular Final
- Camada 3 (SE NECESS\u00c1RIO): Aumento Incisal \u2014 incluir apenas se o caso exigir reconstru\u00e7\u00e3o de bordo incisal

N\u00cdVEL EST\u00c9TICO (4-5 camadas):
- Camada 1: Aumento Incisal (SE NECESS\u00c1RIO)
- Camada 2: Cristas Proximais
- Camada 3: Dentina/Corpo
- Camada 4: Efeitos Incisais (optional: true)
- Camada 5: Esmalte Vestibular Final

NOTA BACKWARD-COMPAT: Se o n\u00edvel for "baixo" ou "m\u00e9dio", tratar como "funcional". Se for "alto" ou "muito alto", tratar como "est\u00e9tico".

\u26a0\ufe0f CR\u00cdTICO: N\u00c3O criar camada separada chamada "Opaco" ou "Mascaramento"!
- Integrar mascaramento na descri\u00e7\u00e3o da camada Dentina/Corpo
- Formato: "Dentina/Corpo (shade A2, com opaco OA2 0.5mm no fundo se substrato escuro)"

REGRAS ADICIONAIS:
1. Para dentes anteriores, SEMPRE usar cor espec\u00edfica de esmalte na camada final
2. Priorizar resinas com melhor polimento para camada de esmalte
3. Para posteriores simples, pode recomendar t\u00e9cnica bulk ou incrementos simples
4. Adapte as cores baseado na cor VITA informada

\u26a0\ufe0f REGRA CRÍTICA - CHECKLIST/STEPS DEVEM USAR SHADES FINAIS:
- O checklist e passo-a-passo DEVEM referenciar os shades FINAIS (após substituição)
- Se a resina não possui shade WT mas você substituiu por A1E, o checklist deve dizer "A1E" e NÃO "WT"
- \u274c ERRADO: Step diz "Aplicar shade WT" mas tabela de camadas mostra "A1E" (shade WT não existe na linha)
- \u2705 CERTO: Step diz "Aplicar shade A1E" consistente com a tabela de camadas
- Os steps, a tabela de camadas e os shades DEVEM ser 100% sincronizados
- WORKFLOW OBRIGATÓRIO para gerar checklist:
  1. PRIMEIRO: Definir todas as camadas com seus shades
  2. SEGUNDO: Gerar checklist usando APENAS os shades das camadas definidas
  3. TERCEIRO: VERIFICAR que cada shade mencionado no checklist existe na tabela de camadas

\u26a0\ufe0f REGRA CRÍTICA - PADRONIZAÇÃO DE NOME DE MARCA:
- Use SEMPRE o nome do fabricante EXATAMENTE como aparece no catálogo de resinas fornecido acima
- NÃO altere, corrija ou atualize nomes de fabricantes — use o que está no catálogo
- O formato resin_brand DEVE ser "Fabricante - Linha" (ex: "3M ESPE - Filtek Z350 XT")
- TODOS os dentes do mesmo caso que usam a mesma resina devem ter o MESMO resin_brand
- \u274c ERRADO: Dente 13 = "3M ESPE - Filtek Z350 XT", Dente 23 = "Solventum - Filtek Z350 XT"
- \u2705 CERTO: Ambos = "3M ESPE - Filtek Z350 XT" (conforme catálogo)

\u26a0\ufe0f REGRA CR\u00cdTICA - DETERMINISMO CONTRALATERAL:
- Dentes contralaterais com MESMO diagn\u00f3stico (mesma classe, mesmo tamanho, mesmo n\u00edvel est\u00e9tico) DEVEM receber protocolos ID\u00caNTICOS
- MESMO n\u00famero de camadas, MESMOS shades, MESMA resina, MESMA t\u00e9cnica, MESMO n\u00edvel de confian\u00e7a
- Se o dente 13 recebe 3 camadas (Dentina + Efeitos + Esmalte), o dente 23 com diagn\u00f3stico equivalente DEVE receber exatamente 3 camadas com os mesmos shades
- A decis\u00e3o de incluir ou n\u00e3o a camada de Efeitos deve ser baseada APENAS nos crit\u00e9rios objetivos (n\u00edvel est\u00e9tico + regi\u00e3o) \u2014 n\u00e3o varie aleatoriamente
- \u274c ERRADO: Dente 13 = 3 camadas (confian\u00e7a alta), Dente 23 = 2 camadas (confian\u00e7a m\u00e9dia) \u2014 para mesmo diagn\u00f3stico
- \u2705 CERTO: Ambos = 3 camadas com mesmos shades e confian\u00e7a alta

=== NATURALIDADE DO RESULTADO (CR\u00cdTICO PARA EST\u00c9TICA ANTERIOR) ===

Para restaura\u00e7\u00f5es que pare\u00e7am NATURAIS e n\u00e3o "dentes de porcelana artificial":

1. **GRADIENTE DE COR**:
   - Ter\u00e7o cervical: Mais saturado e opaco (tons mais escuros)
   - Ter\u00e7o m\u00e9dio: Cor principal (VITA selecionada)
   - Ter\u00e7o incisal: Menos saturado, mais transl\u00facido

2. **TRANSLUCIDEZ INCISAL**:
   - NUNCA deixar borda incisal 100% opaca em dentes anteriores
   - Usar esmalte transl\u00facido (CT, CE, WE, Trans) para efeito natural
   - Efeito "halo" na borda incisal = naturalidade

3. **CARACTERIZA\u00c7\u00c3O OPCIONAL** (n\u00edvel est\u00e9tico muito alto):
   - Manchas brancas sutis (White spots artificiais)
   - Linhas de trinca de esmalte (craze lines)
   - Mamelons (proje\u00e7\u00f5es incisais em pacientes jovens)
   - ATEN\u00c7\u00c3O: Caracteriza\u00e7\u00e3o exagerada = resultado artificial

4. **OPALESC\u00caNCIA E FLUORESC\u00caNCIA**:
   - Resinas com opalesc\u00eancia simulam efeito natural da luz no esmalte
   - Fluoresc\u00eancia adequada evita aspecto "morto" sob luz UV

5. **INTEGRA\u00c7\u00c3O COM DENTES ADJACENTES**:
   - A restaura\u00e7\u00e3o deve "sumir" entre os dentes vizinhos
   - Cor e translucidez devem harmonizar com os adjacentes
   - Evitar contraste de brilho (restaura\u00e7\u00e3o muito polida vs dentes naturais opacos)

=== ESPESSURAS DE CAMADA POR CONDI\u00c7\u00c3O DO SUBSTRATO ===
As espessuras das camadas s\u00e3o faixas-guia que devem ser adaptadas clinicamente conforme a profundidade e mascaramento necess\u00e1rio.

REGRAS OBRIGAT\u00d3RIAS DE ESPESSURA:
\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502 Condi\u00e7\u00e3o do Substrato   \u2502 Espessuras Recomendadas                               \u2502
\u251c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524
\u2502 Normal/Saud\u00e1vel         \u2502 Opaco: 0.2-0.3mm, Dentina: 0.5-1.0mm, Esmalte: 0.3mm  \u2502
\u251c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524
\u2502 Escurecido/Manchado     \u2502 Opaco: 0.5-0.8mm (cr\u00edtico!), Dentina: 0.5mm, Esmalte: 0.3mm \u2502
\u251c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524
\u2502 Restaura\u00e7\u00e3o pr\u00e9via      \u2502 Opaco: 0.3-0.5mm, Dentina: 0.5mm, Esmalte: 0.3mm      \u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518

A condi\u00e7\u00e3o do substrato atual \u00e9: "${p.substrateCondition || 'Normal'}"
${p.substrateCondition === 'Escurecido' ? '\u26a0\ufe0f SUBSTRATO ESCURECIDO: Use camada de opaco espessa (0.5-0.8mm) para mascaramento adequado!' : ''}

=== PROTOCOLO ADESIVO DETALHADO ===
VOC\u00ca DEVE recomendar o tipo de sistema adesivo baseado no caso cl\u00ednico:

TABELA DE RECOMENDA\u00c7\u00c3O ADESIVA:
\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502 Situa\u00e7\u00e3o Cl\u00ednica        \u2502 Sistema Adesivo Recomendado                           \u2502
\u251c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524
\u2502 Esmalte abundante       \u2502 Etch-and-rinse (convencional 2/3 passos)              \u2502
\u2502 Predomin\u00e2ncia dentina   \u2502 Self-etch ou Universal (modo self-etch)               \u2502
\u2502 Substrato escurecido    \u2502 Universal com etching seletivo em esmalte             \u2502
\u2502 Dentes jovens/vitais    \u2502 Self-etch (menor sensibilidade p\u00f3s-operat\u00f3ria)        \u2502
\u2502 Dentes despolpados      \u2502 Etch-and-rinse (melhor ades\u00e3o em dentina escler\u00f3tica) \u2502
\u2502 Recobrimento de pino    \u2502 Universal com silano (se pino de fibra)               \u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518

Substrato atual: "${p.substrate}"
Condi\u00e7\u00e3o do esmalte: "${p.enamelCondition || '\u00cdntegro'}"

No checklist, especifique o tipo de sistema adesivo recomendado, n\u00e3o apenas "sistema adesivo conforme fabricante".

=== T\u00c9CNICAS OBSOLETAS - N\u00c3O INCLUIR NO CHECKLIST ===
\u274c "Bisel em esmalte" ou "Biselamento" \u2192 T\u00e9cnica ultrapassada, N\u00c3O USE
\u274c "Bisel amplo" ou "Bisel longo" \u2192 N\u00c3O USE
\u274c "\u00c1cido fosf\u00f3rico por 30 segundos em dentina" \u2192 Tempo excessivo

\u2705 T\u00c9CNICAS ATUALIZADAS PARA USAR:
- "Acabamento em chanfro suave" ou "Transi\u00e7\u00e3o suave entre resina e esmalte"
- "Sem preparo adicional em esmalte" (t\u00e9cnicas minimamente invasivas)
- "Condicionamento \u00e1cido conforme indica\u00e7\u00e3o do substrato"
- Especificar tipo de adesivo (Etch-and-rinse, Self-etch ou Universal)

REGRA CR\u00cdTICA: O checklist N\u00c3O DEVE conter as palavras "bisel" ou "biselamento".

=== ACABAMENTO E POLIMENTO (OBRIGATÓRIO — NUNCA OMITIR) ===

⚠️ A seção "finishing" é OBRIGATÓRIA em TODOS os protocolos de resina. NUNCA omita esta seção.
Se omitir, o protocolo será considerado INCOMPLETO e o dentista não terá orientação de acabamento.

Você DEVE incluir a seção "finishing" no protocolo com passos detalhados de:

1. REMOÇÃO DE EXCESSOS:
   - Lâmina de bisturi nº 12: remover excessos grosseiros nas margens
   - Sonda exploradora para verificar adaptação marginal

2. CONTORNO ANATÔMICO:
   - Pontas diamantadas finas (FF): 3118FF, 2135FF para ajuste de anatomia
   - Movimentos leves, sem pressão excessiva

3. ACABAMENTO COM DISCOS:
   - Discos Sof-Lex (sequência completa): Preto → Azul escuro → Azul médio → Azul claro
   - Movimentos unidirecionais, sentido cervical-incisal
   - Manter disco ÚMIDO para evitar aquecimento

4. POLIMENTO INTERPROXIMAL:
   - Tiras de lixa interproximal: movimentos de vai-e-vem suaves
   - Verificar ponto de contato adequado

5. PONTAS E ESPIRAIS DE BORRACHA (após os discos):
   - Marcas sugeridas: DHPro, American Burrs
   - Protocolo: 40-60 segundos cada ponta
   - Velocidade controlada (baixa rotação)
   - SEM aquecer a superfície da resina — usar movimentos intermitentes
   - Ordem: Ponta grossa → Ponta média → Ponta fina → Espiral de polimento

6. BRILHO FINAL:
   - Pasta diamantada (Diamond Excel ou equivalente) + disco de feltro
   - Baixa rotação, movimentos circulares, 40-60 segundos

7. TEXTURIZAÇÃO (OPCIONAL — incluir se o dente for anterior e o caso exigir naturalidade):
   - Ponta diamantada fina: criar periquimáceas (linhas horizontais sutis)
   - Apenas na face vestibular, terço médio e incisal
   - Objetivo: reproduzir textura natural do esmalte

Especificar para cada passo: ferramenta, granulação, velocidade (alta/baixa), tempo, e dica técnica.

${bruxismSection}

=== DICAS DE APLICAÇÃO POR MARCA (incluir no campo "technique" de cada camada) ===
Para cada camada do protocolo, inclua na "technique" uma dica específica da marca/linha recomendada:

TOKUYAMA FORMA:
- Incrementos de até 4mm (tecnologia Giomer), fotopolimerizar 20s
- Excelente escoamento, não gruda na espátula
- Ideal para camada Body em incremento único

TOKUYAMA PALFIQUE LX5:
- Nano-híbrida com partículas esféricas, polimento superior
- Incrementos de 2mm, fotopolimerizar 10s (alta reatividade)
- Polir com discos Sof-Lex ou pontas siliconadas para brilho espelhado

TOKUYAMA ESTELITE OMEGA:
- Supra-nano esférica, mimetismo óptico excepcional
- Incrementos de 2mm, fotopolimerizar 10s
- Para esmalte: aplicar em camada fina (0.3-0.5mm) para efeito translúcido natural

KERR HARMONIZE:
- Tecnologia ART (Adaptive Response Technology) — adapta-se à cor do dente
- Incrementos de 2mm, fotopolimerizar 20s
- Excelente para cor única quando camada simples é desejada

FGM VITTRA APS:
- Tecnologia de zircônia pré-sinterizada, resistência mecânica elevada
- Incrementos de 2mm, fotopolimerizar 20s
- Boa opção custo-benefício para dentina/corpo

3M FILTEK Z350 XT:
- Nanoparticulada, ampla gama de opacidades
- Incrementos de até 2mm, fotopolimerizar 20s
- Shades Body (B): opacidade média ideal para substituição de dentina
- Shades Enamel (E): translucidez natural para camada final

IVOCLAR IPS EMPRESS DIRECT:
- Nano-híbrida com opalescência natural
- Incrementos de 2mm, fotopolimerizar 20s (Bluephase)
- Cores Bleach (BL-L): específicas para dentes clareados

FGM OPALLIS / OPALLIS FLOW:
- Flow: ideal para forramento e efeitos translúcidos
- Incrementos de 1.5mm (flow), fotopolimerizar 20s
- Trans/Opal: usar em camada fina para halo incisal

REGRA: No campo "technique" de cada layer, ALÉM da técnica de inserção, adicionar a dica específica da marca recomendada.
⚠️ EXCEÇÃO OBRIGATÓRIA: Para a camada de EFEITOS INCISAIS, NÃO incluir dica genérica de incrementos da marca (ex: "Incrementos de até 2mm, fotopolimerizar 20s"). Efeitos incisais usam técnica de pincel/corante, não incrementos convencionais. Incluir APENAS a dica de técnica específica da camada de efeitos.

Responda em formato JSON:
{
  "recommended_resin_name": "nome exato da resina recomendada (DEVE respeitar o or\u00e7amento!)",
  "is_from_inventory": true ou false,
  "ideal_resin_name": "nome da resina ideal se diferente da recomendada (null se a recomendada J\u00c1 \u00c9 a ideal). \u26a0\ufe0f Se recommended_resin_name = ideal_resin_name, defina como null!",
  "ideal_reason": "explica\u00e7\u00e3o se ideal for diferente (null se n\u00e3o aplic\u00e1vel). \u26a0\ufe0f N\u00c3O diga que a ideal 'est\u00e1 fora do or\u00e7amento' se ela j\u00e1 \u00e9 a recomenda\u00e7\u00e3o principal!",
  "budget_compliance": true ou false (a resina recomendada respeita o or\u00e7amento?),
  "price_range": "faixa de pre\u00e7o da resina recomendada (Econ\u00f4mico/Intermedi\u00e1rio/M\u00e9dio-alto/Premium)",
  "justification": "explica\u00e7\u00e3o detalhada de 2-3 frases incluindo por que esta resina foi escolhida considerando o or\u00e7amento",
  "inventory_alternatives": [
    {"name": "...", "manufacturer": "...", "reason": "..."}
  ],
  "external_alternatives": [
    {"name": "...", "manufacturer": "...", "reason": "..."}
  ],
  "protocol": {
    "layers": [
      {
        "order": 1,
        "name": "Nome da camada (Aumento Incisal/Dentina-Corpo/Efeitos Incisais/Cristas Proximais/Esmalte Vestibular Final/Bulk). NÃO use 'Opaco' como nome de camada separada — integre o mascaramento na descrição da camada Dentina/Corpo.",
        "resin_brand": "Fabricante - Linha do produto (ex: Tokuyama - Estelite Omega, FGM - Vittra APS, 3M ESPE - Filtek Z350 XT). NUNCA informe apenas o fabricante! Use o nome do fabricante EXATAMENTE como aparece no catálogo fornecido.",
        "shade": "Cor espec\u00edfica (ex: OA2, A2D, A2E)",
        "thickness": "Faixa de espessura guia (ex: 0.3-0.5mm)",
        "purpose": "Objetivo desta camada",
        "technique": "T\u00e9cnica de aplica\u00e7\u00e3o",
        "optional": "true APENAS para camada Efeitos Incisais. Omitir para demais camadas."
      }
    ],
    "alternative": {
      "resin": "Resina alternativa para t\u00e9cnica simplificada. \u26a0\ufe0f DEVE ser uma op\u00e7\u00e3o REAL e DIFERENTE do protocolo principal. Se n\u00e3o existe alternativa vi\u00e1vel mais simples, use a MESMA resina com t\u00e9cnica de MENOS camadas.",
      "shade": "Cor \u00fanica para t\u00e9cnica simplificada",
      "technique": "Descri\u00e7\u00e3o da t\u00e9cnica alternativa simplificada. \u26a0\ufe0f NUNCA diga 'n\u00e3o aplic\u00e1vel' \u2014 SEMPRE forne\u00e7a uma t\u00e9cnica simplificada real (ex: incremento \u00fanico, bulk fill, 2 camadas ao inv\u00e9s de 3).",
      "tradeoff": "O que se perde com esta alternativa (perda est\u00e9tica espec\u00edfica, n\u00e3o gen\u00e9rico)"
    },
    "finishing": {
      "contouring": [
        {"order": 1, "tool": "Ponta diamantada FF 2200FF", "grit": "Fina", "speed": "Alta rota\u00e7\u00e3o com spray", "time": "20-30s", "tip": "Remover excessos cervicais e vestibulares"}
      ],
      "polishing": [
        {"order": 1, "tool": "Disco Sof-Lex Pop-On Preto", "grit": "Grossa", "speed": "Baixa rotação", "time": "30s", "tip": "Sentido cervical-incisal"},
        {"order": 2, "tool": "Disco Sof-Lex Pop-On Azul Escuro", "grit": "Média", "speed": "Baixa rotação", "time": "30s", "tip": "Manter disco úmido"},
        {"order": 3, "tool": "Disco Sof-Lex Pop-On Azul Médio", "grit": "Fina", "speed": "Baixa rotação", "time": "30s", "tip": "Evitar pressão excessiva"},
        {"order": 4, "tool": "Disco Sof-Lex Pop-On Azul Claro", "grit": "Ultrafina", "speed": "Baixa rotação", "time": "30s", "tip": "Polimento final"},
        {"order": 5, "tool": "Ponta de borracha grossa (DHPro/American Burrs)", "speed": "Baixa rotação", "time": "40-60s", "tip": "Movimentos intermitentes, SEM aquecer a resina"},
        {"order": 6, "tool": "Ponta de borracha média", "speed": "Baixa rotação", "time": "40-60s", "tip": "Manter superfície úmida"},
        {"order": 7, "tool": "Ponta de borracha fina", "speed": "Baixa rotação", "time": "40-60s", "tip": "Polimento intermediário"},
        {"order": 8, "tool": "Espiral de polimento", "speed": "Baixa rotação", "time": "40-60s", "tip": "Brilho pré-final"}
      ],
      "final_glaze": "Pasta Diamond Excel com feltro em baixa rotação por 40s",
      "maintenance_advice": "Protocolo de cuidados pós-resina: manutenção profissional a cada 6 meses (profilaxia + polimento de retoque), evitar pastas dentais abrasivas (preferir pastas de baixa abrasividade RDA <70), cuidado ao morder alimentos duros (maçã, cenoura crua, gelo — de preferência cortar em pedaços menores), evitar morder objetos (canetas, unhas). Consultar o dentista em caso de sensibilidade ou alteração de cor."
    },
    "checklist": [
      "Passo 1: Profilaxia com pasta sem fl\u00faor",
      "Passo 2: Sele\u00e7\u00e3o de cor sob luz natural",
      "Passo 3: Isolamento absoluto ou relativo",
      "Passo 4: Condicionamento \u00e1cido conforme substrato",
      "Passo 5: Sistema adesivo conforme protocolo do fabricante",
      "..."
    ],
    "alerts": [
      "O protocolo adesivo varia entre fabricantes - consulte as instru\u00e7\u00f5es do sistema utilizado",
      "Alerta condicional 2"
    ],
    "warnings": [
      "N\u00c3O fazer X",
      "N\u00c3O fazer Y"
    ],
    "confidence": "alta/m\u00e9dia/baixa"
  }
}

=== PROTOCOLO DE CUIDADOS PÓS-RESINA (OBRIGATÓRIO) ===
O campo "maintenance_advice" DEVE incluir TODOS os itens abaixo:
1. Manutenção profissional a cada 6 meses (profilaxia + polimento de retoque)
2. Evitar pastas abrasivas (preferir RDA < 70)
3. Cuidado com alimentos duros (preferência por cortar ao invés de morder)
4. Evitar hábitos parafuncionais (roer unhas, morder canetas)
5. Retorno em caso de sensibilidade ou alteração de cor

ALERTA DE GUIA DE SILICONE (quando aplic\u00e1vel):
Se o tratamento \u00e9 reanatomiza\u00e7\u00e3o em dente ANTERIOR (11-13, 21-23) com aumento de volume significativo:
- Adicionar ao array "alerts":
  "Considerar confec\u00e7\u00e3o de guia de silicone (mock-up) para controle de espessura e previsibilidade do resultado final"
- Este alerta \u00e9 OBRIGAT\u00d3RIO quando:
  \u2022 O dente \u00e9 anterior E
  \u2022 A indica\u00e7\u00e3o envolve reanatomiza\u00e7\u00e3o, aumento de volume ou corre\u00e7\u00e3o de propor\u00e7\u00e3o (conoide/microdontia) E
  \u2022 O tamanho da restaura\u00e7\u00e3o \u00e9 "Grande" ou "Extensa"

PRIMEIRA RECOMENDA\u00c7\u00c3O DO CHECKLIST (quando aplic\u00e1vel):
Se o paciente deseja cor mais clara (BL1, BL2, Hollywood) E o tratamento \u00e9 resina:
- Adicionar como PRIMEIRO item do checklist:
  "Considerar tratamento clareador previamente \u00e0s resinas para otimizar resultado est\u00e9tico e sele\u00e7\u00e3o de cor"

Responda APENAS com o JSON, sem texto adicional.`
  },
}
