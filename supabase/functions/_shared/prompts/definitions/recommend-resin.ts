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
=== REGRAS DE OR\u00c7AMENTO (OBRIGAT\u00d3RIO SEGUIR!) ===

O or\u00e7amento selecionado pelo paciente \u00e9: "${budget}"

MAPEAMENTO DE OR\u00c7AMENTO PARA FAIXAS DE PRE\u00c7O:
- Or\u00e7amento "econ\u00f4mico": Recomendar APENAS resinas "Econ\u00f4mico" ou "Intermedi\u00e1rio"
- Or\u00e7amento "moderado": Recomendar resinas "Intermedi\u00e1rio" ou "M\u00e9dio-alto", EVITAR "Premium"
- Or\u00e7amento "premium": Pode recomendar qualquer faixa, priorizando as melhores tecnicamente

\u26a0\ufe0f REGRA CR\u00cdTICA: A recomenda\u00e7\u00e3o principal DEVE respeitar o or\u00e7amento do paciente!
- Se o or\u00e7amento \u00e9 "econ\u00f4mico", N\u00c3O recomende resinas Premium como Filtek Z350 XT, Estelite Omega, Venus Diamond
- Se o or\u00e7amento \u00e9 "moderado", N\u00c3O recomende resinas Premium como Filtek Z350 XT, Estelite Omega, Venus Diamond
- Apenas para or\u00e7amento "premium" voc\u00ea pode recomendar resinas Premium
`
}

function buildResinsByPriceSection(allGroups: ResinGroups): string {
  return `
=== RESINAS ORGANIZADAS POR FAIXA DE PRE\u00c7O ===

**ECON\u00d4MICAS** (para or\u00e7amento econ\u00f4mico):
${allGroups.economico.length > 0 ? formatResinList(allGroups.economico) : 'Nenhuma resina nesta faixa'}

**INTERMEDI\u00c1RIAS** (para or\u00e7amento econ\u00f4mico ou moderado):
${allGroups.intermediario.length > 0 ? formatResinList(allGroups.intermediario) : 'Nenhuma resina nesta faixa'}

**M\u00c9DIO-ALTO** (para or\u00e7amento moderado ou premium):
${allGroups.medioAlto.length > 0 ? formatResinList(allGroups.medioAlto) : 'Nenhuma resina nesta faixa'}

**PREMIUM** (APENAS para or\u00e7amento premium):
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
INSTRU\u00c7\u00d5ES DE PRIORIDADE (seguir nesta ordem):
1. PRIMEIRO: Verificar or\u00e7amento - a resina DEVE estar na faixa de pre\u00e7o adequada ao or\u00e7amento "${budget}"
2. SEGUNDO: Dentro das resinas adequadas ao or\u00e7amento, PRIORIZAR as que est\u00e3o no invent\u00e1rio do dentista
3. TERCEIRO: Se nenhuma do invent\u00e1rio for adequada ao or\u00e7amento, recomendar a melhor op\u00e7\u00e3o externa dentro do or\u00e7amento
4. QUARTO: Aspectos t\u00e9cnicos (indica\u00e7\u00e3o cl\u00ednica, est\u00e9tica, resist\u00eancia) como crit\u00e9rio de desempate

IMPORTANTE:
- Se o invent\u00e1rio tem resinas adequadas ao or\u00e7amento, use-as como principal
- A resina ideal tecnicamente pode ser mencionada como sugest\u00e3o futura se estiver fora do or\u00e7amento`
  }

  return `
INSTRU\u00c7\u00d5ES DE PRIORIDADE (seguir nesta ordem):
1. PRIMEIRO: Verificar or\u00e7amento - a resina DEVE estar na faixa de pre\u00e7o adequada ao or\u00e7amento "${budget}"
2. SEGUNDO: Dentro das resinas adequadas ao or\u00e7amento, escolher a melhor tecnicamente para o caso
3. TERCEIRO: Aspectos t\u00e9cnicos (indica\u00e7\u00e3o cl\u00ednica, est\u00e9tica, resist\u00eancia) como crit\u00e9rio de sele\u00e7\u00e3o

IMPORTANTE: N\u00e3o recomende resinas Premium se o or\u00e7amento n\u00e3o for premium!`
}

function buildAdvancedStratificationSection(aestheticLevel: string): string {
  if (aestheticLevel !== 'muito alto') return ''

  return `
=== ESTRATIFICA\u00c7\u00c3O AVAN\u00c7ADA (N\u00cdVEL EST\u00c9TICO MUITO ALTO) ===

Para m\u00e1xima excel\u00eancia est\u00e9tica, voc\u00ea pode COMBINAR DIFERENTES MARCAS por camada:

TABELA DE REFER\u00caNCIA PARA COMBINA\u00c7\u00d5ES:
\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502 Camada              \u2502 Resinas Recomendadas                            \u2502
\u251c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524
\u2502 Aumento Incisal     \u2502 Trans-forma (Ultradent), CT (Z350), Trans20     \u2502
\u2502 (Efeito)            \u2502 (Empress Direct)                                \u2502
\u251c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524
\u2502 Cristas Proximais   \u2502 XLE (Harmonize), E BL-L (Empress), JE (Z350)    \u2502
\u251c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524
\u2502 Dentina/Corpo       \u2502 D BL-L (Empress), WB (Forma), OA (Z350)         \u2502
\u251c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524
\u2502 Efeitos Incisais    \u2502 CT, GT, BT, YT (Z350), Trans (Forma/Empress)        \u2502
\u251c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524
\u2502 Esmalte Final       \u2502 WE (Palfique LX5), MW (Estelite)                \u2502
\u2502 (acabamento)        \u2502 Priorizar polimento superior                    \u2502
\u251c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524
\u2502 Dentes Clareados    \u2502 WE (Estelite Bianco), BL (Forma)                \u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518

=== CAMADAS DE CARACTERIZA\u00c7\u00c3O (OPCIONAL PARA M\u00c1XIMA NATURALIDADE) ===

Para restaura\u00e7\u00f5es que pare\u00e7am INDISTINGU\u00cdVEIS de dentes naturais:

CARACTERIZA\u00c7\u00c3O COM TINTS/STAINS:
\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502 Caracteriza\u00e7\u00e3o      \u2502 Como Aplicar                                    \u2502
\u251c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524
\u2502 White spots         \u2502 Micro-pontos de tint branco no ter\u00e7o m\u00e9dio      \u2502
\u2502 Craze lines         \u2502 Linhas finas de tint \u00e2mbar/marrom               \u2502
\u2502 Mamelons            \u2502 Proje\u00e7\u00f5es de dentina na borda incisal           \u2502
\u2502 Halo incisal        \u2502 Fina linha de esmalte ultra-transl\u00facido na borda\u2502
\u2502 Foseta proximal     \u2502 Depress\u00e3o sutil nas faces proximais             \u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518

IMPORTANTE: Caracteriza\u00e7\u00e3o excessiva = resultado artificial
- Use com MODERA\u00c7\u00c3O - menos \u00e9 mais
- Copie as caracter\u00edsticas dos dentes ADJACENTES do paciente
- Evite criar "dente perfeito" ao lado de dentes naturais com caracteriza\u00e7\u00f5es

REGRAS DE COMBINA\u00c7\u00c3O:
1. PRIORIZE resinas do invent\u00e1rio do usu\u00e1rio para o maior n\u00famero de camadas poss\u00edvel
2. Sugira resinas externas APENAS para camadas cr\u00edticas onde fazem diferen\u00e7a real
3. Na alternativa, indique op\u00e7\u00e3o mais simples usando UMA marca s\u00f3
4. Inclua na justificativa o benef\u00edcio espec\u00edfico de cada marca escolhida
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

${advancedStratification}

=== PROTOCOLO DE ESTRATIFICA\u00c7\u00c3O - CAMADAS (ATUALIZADO V2) ===
\u26a0\ufe0f CR\u00cdTICO: A cor escolhida DEVE corresponder ao tipo da camada E existir na linha de produto!

ESTRUTURA OBRIGAT\u00d3RIA - 5 CAMADAS (simplificar para 3-4 se n\u00edvel est\u00e9tico baixo/m\u00e9dio):

1. AUMENTO INCISAL (primeira etapa):
   - Objetivo: Constru\u00e7\u00e3o da borda incisal
   - Resinas: Esmalte transl\u00facido \u2014 CT (Z350), Trans (FORMA), Trans20 (Empress)
   - Espessura: 0.2-0.3mm
   - T\u00e9cnica: Aplicar na regi\u00e3o da quebra incisal, criando base para os mamelons

2. CRISTAS PROXIMAIS (defini\u00e7\u00e3o anat\u00f4mica - ANTES da dentina):
   - Objetivo: Defini\u00e7\u00e3o das cristas mesial e distal
   - Resinas: Esmalte um tom mais claro que o dente
   - Para pacientes com DENTES CLAREADOS ou que desejam cor mais clara:
     \u2192 Op\u00e7\u00e3o padr\u00e3o: A1E (Z350)
     \u2192 Op\u00e7\u00e3o clareada: BL-L (IPS Empress Direct) ou Bianco (Estelite)
   - Espessura: 0.2mm
   - T\u00e9cnica: Aplicar nas bordas proximais para criar profundidade

3. DENTINA/CORPO (estrutura principal - OPCIONAL para altera\u00e7\u00f5es m\u00ednimas):
   - Objetivo: Adicionar volume caso necess\u00e1rio e mascarar interface dente/resina
   - Em casos de POUCA MUDAN\u00c7A (recontorno est\u00e9tico, leve aumento incisal):
     \u2192 Esta camada \u00e9 OPCIONAL - marcar "optional": true
     \u2192 O esmalte pode ser aplicado diretamente sobre o dente
   - Em casos de mudan\u00e7a SIGNIFICATIVA (cavidade profunda, substrato comprometido):
     \u2192 Esta camada \u00e9 OBRIGAT\u00d3RIA
   - Resinas: WB (Z350/Forma) ou Dentina clara (B1)
   - Espessura: 0.5-1.0mm
   - Com mascaramento integrado se substrato exigir (N\u00c3O criar camada separada de opaco)

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
   - Objetivo: Confec\u00e7\u00e3o de halo opaco incisal
   - \u26a0\ufe0f REGRA DE CORANTES: A Z350 N\u00c3O possui corantes pr\u00f3prios!
     Para efeitos incisais com corantes, usar:
     - IVOCLAR IPS Empress Direct Color (White, Blue, Honey, Brown)
     - OU dentina clara como substituto
   - Resinas alternativas para efeitos: CT, GT, BT (Z350 transl\u00facidos)
   - Espessura: 0.1mm
   - T\u00e9cnica: Aplicar corante branco na borda incisal para criar efeito de halo opaco natural
   - INCLUIR apenas para demanda est\u00e9tica alta/muito alta
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
   - N\u00edvel est\u00e9tico "m\u00e9dio" ou "baixo"

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

SIMPLIFICA\u00c7\u00c3O POR N\u00cdVEL EST\u00c9TICO:
- N\u00edvel "baixo": 2 camadas (Dentina/Corpo + Esmalte Vestibular Final)
- N\u00edvel "m\u00e9dio": 3 camadas (Aumento Incisal + Dentina/Corpo + Esmalte Vestibular Final)
- N\u00edvel "alto": 4 camadas (Aumento Incisal + Cristas Proximais + Dentina/Corpo + Esmalte Vestibular Final)
- N\u00edvel "muito alto": 5 camadas (todas, incluindo Efeitos Incisais com optional: true)

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

N\u00cdVEL BAIXO (2 camadas):
- Camada 1: Dentina/Corpo
- Camada 2: Esmalte Vestibular Final

N\u00cdVEL M\u00c9DIO (3 camadas):
- Camada 1: Aumento Incisal
- Camada 2: Dentina/Corpo
- Camada 3: Esmalte Vestibular Final

N\u00cdVEL ALTO (4 camadas):
- Camada 1: Aumento Incisal
- Camada 2: Cristas Proximais
- Camada 3: Dentina/Corpo
- Camada 4: Esmalte Vestibular Final

N\u00cdVEL MUITO ALTO (5 camadas):
- Camada 1: Aumento Incisal
- Camada 2: Cristas Proximais
- Camada 3: Dentina/Corpo
- Camada 4: Efeitos Incisais (optional: true)
- Camada 5: Esmalte Vestibular Final

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

=== ACABAMENTO E POLIMENTO (OBRIGAT\u00d3RIO) ===
Voc\u00ea DEVE incluir a se\u00e7\u00e3o "finishing" no protocolo com passos detalhados de:
1. CONTORNO ANAT\u00d4MICO:
   - Pontas diamantadas finas (FF) para ajuste de anatomia
   - Discos de granula\u00e7\u00e3o grossa para contorno inicial
2. POLIMENTO SEQUENCIAL:
   - Discos: Grossa \u2192 M\u00e9dia \u2192 Fina \u2192 Ultrafina (ex: Sof-Lex, OptiDisc)
   - Pontas siliconadas/borrachas polidoras para faces livres
   - Pasta diamantada ou \u00f3xido de alum\u00ednio para brilho
3. BRILHO FINAL:
   - Escova de feltro + pasta de polimento de alta performance

Especificar para cada passo: ferramenta, granula\u00e7\u00e3o, velocidade (alta/baixa), tempo, e dica t\u00e9cnica.

${bruxismSection}

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
        {"order": 1, "tool": "Disco Sof-Lex Vermelho Escuro", "grit": "Grossa", "speed": "Baixa rota\u00e7\u00e3o", "time": "30s", "tip": "Sentido cervical-incisal"},
        {"order": 2, "tool": "Disco Sof-Lex Vermelho Claro", "grit": "M\u00e9dia", "speed": "Baixa rota\u00e7\u00e3o", "time": "30s", "tip": "Manter disco \u00famido"},
        {"order": 3, "tool": "Disco Sof-Lex Laranja", "grit": "Fina", "speed": "Baixa rota\u00e7\u00e3o", "time": "30s", "tip": "Evitar press\u00e3o excessiva"},
        {"order": 4, "tool": "Disco Sof-Lex Amarelo", "grit": "Ultrafina", "speed": "Baixa rota\u00e7\u00e3o", "time": "30s", "tip": "Polimento final"}
      ],
      "final_glaze": "Pasta Diamond Excel com feltro em baixa rota\u00e7\u00e3o por 40s",
      "maintenance_advice": "Polimento de retoque a cada 6 meses para manter brilho"
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
