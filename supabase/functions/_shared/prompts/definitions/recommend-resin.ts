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

function buildAdvancedStratificationSection(aestheticLevel: string): string {
  if (!['estético', 'alto', 'muito alto'].includes(aestheticLevel)) return ''

  return `=== ESTRATIFICACAO AVANCADA (${aestheticLevel.toUpperCase()}) ===

RESINAS RECOMENDADAS POR CAMADA:
| Camada             | Resinas                                                    |
|--------------------|------------------------------------------------------------|
| Aumento Incisal    | Trans(FORMA), Trans20(Empress), CT(Z350), Trans(Vittra)   |
| Cristas Proximais  | XLE(Harmonize), BL-L(Empress), WE(Palfique LX5) — 1 tom > claro que corpo |
| Dentina/Corpo      | WB(FORMA), DA1/DA2(Vittra APS), WB(Z350), D BL-L(Empress)|
| Efeitos Incisais   | IPS Color(Ivoclar), Kolor+(Kerr) — Z350 NAO tem corantes! |
| Esmalte Final      | WE(Palfique LX5), MW(Estelite Omega), A1E/A2E(Z350)      |
| Dentes Clareados   | W3/W4(Estelite Bianco), BL(Forma), BL-L(Empress)         |

DIVERSIDADE DE MARCAS (OBRIGATORIO):
- PROIBIDO mesma linha para TODAS as 5 camadas
- Cada camada deve usar a resina MAIS INDICADA para sua função
- Z350 em 1-2 camadas max, nao todas
- EXCECAO: Inventário só tem Z350 -> aceitável, marcar nas observações

EFEITOS INCISAIS (sub-opções):
| Efeito         | Materiais                                                |
|----------------|----------------------------------------------------------|
| Halo Opaco     | Opallis Flow(FGM) ou Empress Opal — 0.1mm borda incisal |
| Corante Branco | Kolor+ White(Kerr) ou IPS Color White — micro-pontos     |
| Corante Ambar  | Kolor+ Amber(Kerr) ou IPS Color Honey — linhas finas     |
| Mamelos        | Dentina clara (A1/B1) em projeções verticais na incisal  |

Inclusão: "alto" -> halo opaco (optional:true). "muito alto" -> halo + corantes + mamelos (optional:true).

CARACTERIZACAO (OPCIONAL): White spots, craze lines, mamelons, halo incisal, foseta proximal. MODERACAO - copie dentes adjacentes.

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

function buildDSDContextSection(dsdContext?: { currentIssue: string; proposedChange: string; observations: string[] }): string {
  if (!dsdContext) return ''
  const obs = dsdContext.observations?.length ? dsdContext.observations.map(o => `- ${o}`).join('\n') : ''
  return `=== CONTEXTO DSD ===
- Situação atual: ${dsdContext.currentIssue}
- Mudança proposta: ${dsdContext.proposedChange}
${obs ? `Observações:\n${obs}` : ''}
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
    const advancedStrat = buildAdvancedStratificationSection(p.aestheticLevel)
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
  3. Refinamento (diamantada FF 3118FF/2135FF, 0.1-0.2mm)
  4. Acabamento (Sof-Lex: Preto->Azul escuro->Azul médio->Azul claro)
  5. Polimento Final (Diamond Excel + feltro, baixa rotação 40-60s)
- Se NAO menciona diminuir -> use protocolo normal.

${advancedStrat}

=== PROTOCOLO DE ESTRATIFICACAO V2 ===
A cor DEVE corresponder ao tipo da camada E existir na linha de produto!

ESTRUTURA 2-5 CAMADAS conforme nível estético:

NIVEL FUNCIONAL ("funcional"/"baixo"/"médio") - 2-3 camadas:
1. Dentina/Corpo | 2. Esmalte Vestibular Final | 3. Aumento Incisal (SE NECESSARIO)

NIVEL ESTETICO ("estético"/"alto"/"muito alto") - 4-5 camadas:
1. Aumento Incisal (SE NECESSARIO): Esmalte translúcido (Trans/CT/Trans20), 0.2-0.3mm, incremento único
2. Cristas Proximais: XLE/BL-L/WE — 1 tom > claro, 0.2mm, tira de poliéster p/ adaptação
3. Dentina/Corpo (OPCIONAL p/ alterações mínimas): WB/DA1/DA2, 0.5-1.0mm, reproduzir mamelos. Opaco NAO e camada separada - e shade dentro da dentina!
   - Substrato ESCURECIDO: shades opacos (OA1/OA2/OA3/OB1/WO) como 1º incremento 0.5-1mm
   - Substrato NORMAL: shades regulares (DA1/DA2/A1/A2/B1) - NAO usar opacos
   - Substrato LEVEMENTE ESCURECIDO: shades com > opacidade (DA3/A3) sem prefixo O
4. Efeitos Incisais (optional:true): Corantes IVOCLAR IPS Empress Direct Color ou IPS Color — NUNCA Z350! Shade DIFERENTE do esmalte (usar CT/GT/BT/YT). Aplicar com pincel fino, 0.1mm.
   - Z350 translúcidos: CT(Clear), GT(Gray), BT(Blue), YT(Yellow). WT NAO EXISTE -> use WB
   - OMITIR para: posteriores rotineiros, Classe I/V, nível funcional
5. Esmalte Vestibular Final: 0.3mm, priorizar polimento superior
   - P1: Palfique LX5 (WE), Estelite Omega (MW/WE) — acabamento espelhado
   - P2: Filtek Z350 XT (A1E/A2E/CT/GT), FORMA (Trans/Enamel)
   - P3: Harmonize (Incisal/TN), Vittra APS (Trans/INC)

CORES DE ESMALTE POR LINHA:
| Linha               | Cores                                     |
|---------------------|-------------------------------------------|
| Estelite Sigma Quick| WE, CE                                    |
| Estelite Omega      | WE, JE, CT, MW                            |
| Filtek Z350 XT      | CT, GT, BT, YT, A1E, A2E, A3E, B1E       |
| Harmonize           | Incisal, TN                               |
| IPS Empress Direct  | Trans 20, Trans 30, Opal                  |
| Vittra APS          | Trans, INC                                |
| Palfique LX5        | WE, CE, BL1, BL2, BL3, A1-A3, B1         |

=== CLAREAMENTO (BLEACH SHADES) ===
Verificar se linha possui cores BL. Se NAO: usar cor mais clara (B1/A1).
COM BL: Palfique LX5 (BL1-3), Forma (BL), Z350 (WB/WE aprox.), Estelite Bianco (W1-W4), Empress (BL-L).
SEM BL: Estelite Sigma Quick, Vittra APS (usar B1/A1).
Dentes clareados: PRIORIDADE Estelite Bianco W1-W4, ALTERNATIVA BL(Forma)/BL-L(Empress).

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
2. Contorno: Diamantadas FF (3118FF/2135FF), movimentos leves
3. Discos Sof-Lex: Preto->Azul escuro->Azul médio->Azul claro, unidirecionais, úmidos
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
        {"order":1,"tool":"Disco Sof-Lex Preto","grit":"Grossa","speed":"Baixa rotação","time":"30s","tip":"Cervical-incisal"},
        {"order":2,"tool":"Disco Sof-Lex Azul Escuro","grit":"Média","speed":"Baixa rotação","time":"30s","tip":"Manter úmido"},
        {"order":3,"tool":"Disco Sof-Lex Azul Médio","grit":"Fina","speed":"Baixa rotação","time":"30s","tip":"Sem pressão"},
        {"order":4,"tool":"Disco Sof-Lex Azul Claro","grit":"Ultrafina","speed":"Baixa rotação","time":"30s","tip":"Polimento final"},
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
