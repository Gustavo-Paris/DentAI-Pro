import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreFlight, ERROR_MESSAGES, createErrorResponse } from "../_shared/cors.ts";
import { validateEvaluationData, type EvaluationData } from "../_shared/validation.ts";
import { logger } from "../_shared/logger.ts";

interface ProtocolLayer {
  order: number;
  name: string;
  resin_brand: string;
  shade: string;
  thickness: string;
  purpose: string;
  technique: string;
}

interface ProtocolAlternative {
  resin: string;
  shade: string;
  technique: string;
  tradeoff: string;
}

interface PolishingStep {
  order: number;
  tool: string;
  grit?: string;
  speed: string;
  time: string;
  tip: string;
}

interface FinishingProtocol {
  contouring: PolishingStep[];
  polishing: PolishingStep[];
  final_glaze?: string;
  maintenance_advice: string;
}

interface StratificationProtocol {
  layers: ProtocolLayer[];
  alternative: ProtocolAlternative;
  finishing?: FinishingProtocol;
  checklist: string[];
  alerts: string[];
  warnings: string[];
  justification: string;
  confidence: "alta" | "média" | "baixa";
}

// Mapeamento de cores VITA para clareamento (sincronizado com frontend)
const whiteningColorMap: Record<string, string[]> = {
  'A4': ['A3', 'A2'],
  'A3.5': ['A2', 'A1'],
  'A3': ['A2', 'A1'],
  'A2': ['A1', 'BL4'],
  'A1': ['BL4', 'BL3'],
  'B4': ['B3', 'B2'],
  'B3': ['B2', 'B1'],
  'B2': ['B1', 'A1'],
  'B1': ['A1', 'BL4'],
  'C4': ['C3', 'C2'],
  'C3': ['C2', 'C1'],
  'C2': ['C1', 'B1'],
  'C1': ['B1', 'A1'],
  'D4': ['D3', 'D2'],
  'D3': ['D2', 'A3'],
  'D2': ['A2', 'A1'],
  'BL4': ['BL3', 'BL2'],
  'BL3': ['BL2', 'BL1'],
  'BL2': ['BL1'],
  'BL1': [],
};

// Helper to get adjusted whitening colors
const getWhiteningColors = (baseColor: string): string[] => {
  const normalized = baseColor.toUpperCase().trim();
  return whiteningColorMap[normalized] || [];
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(req);
  if (preflightResponse) return preflightResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401, corsHeaders);
    }

    // Create client with user's auth token to verify claims
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return createErrorResponse(ERROR_MESSAGES.INVALID_TOKEN, 401, corsHeaders);
    }

    const userId = claimsData.claims.sub as string;

    // Parse and validate input
    let rawData: unknown;
    try {
      rawData = await req.json();
    } catch {
      return createErrorResponse(ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
    }

    const validation = validateEvaluationData(rawData);
    if (!validation.success || !validation.data) {
      logger.error("Validation failed:", validation.error);
      return createErrorResponse(validation.error || ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
    }

    const data: EvaluationData = validation.data;

    // Verify user owns this evaluation
    if (data.userId !== userId) {
      return createErrorResponse(ERROR_MESSAGES.ACCESS_DENIED, 403, corsHeaders);
    }

    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all resins from database
    const { data: resins, error: resinsError } = await supabase
      .from("resins")
      .select("*");

    if (resinsError) {
      logger.error("Database error fetching resins:", resinsError);
      return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
    }

    // Fetch user's inventory
    const { data: userInventory, error: inventoryError } = await supabase
      .from("user_inventory")
      .select("resin_id")
      .eq("user_id", data.userId);

    if (inventoryError) {
      logger.error("Error fetching inventory:", inventoryError);
    }

    const inventoryResinIds = userInventory?.map((i) => i.resin_id) || [];
    const hasInventory = inventoryResinIds.length > 0;

    // Separate resins into inventory and non-inventory groups
    const inventoryResins = resins.filter((r) =>
      inventoryResinIds.includes(r.id)
    );
    const otherResins = resins.filter(
      (r) => !inventoryResinIds.includes(r.id)
    );

    // Build prompt for AI with budget and inventory awareness
    const formatResinList = (resinList: typeof resins) =>
      resinList
        .map(
          (r) => `
- ${r.name} (${r.manufacturer})
  Tipo: ${r.type}
  Indicações: ${r.indications.join(", ")}
  Opacidade: ${r.opacity}
  Resistência: ${r.resistance}
  Polimento: ${r.polishing}
  Estética: ${r.aesthetics}
  Faixa de preço: ${r.price_range}
  Descrição: ${r.description || "N/A"}
`
        )
        .join("\n");

    // Group resins by price range for better budget-aware recommendations
    const groupResinsByPrice = (resinList: typeof resins) => ({
      economico: resinList.filter((r) => r.price_range === "Econômico"),
      intermediario: resinList.filter((r) => r.price_range === "Intermediário"),
      medioAlto: resinList.filter((r) => r.price_range === "Médio-alto"),
      premium: resinList.filter((r) => r.price_range === "Premium"),
    });

    // Get budget-appropriate resins based on user's budget selection
    const getBudgetAppropriateResins = (
      resinList: typeof resins,
      budget: string
    ) => {
      const groups = groupResinsByPrice(resinList);
      switch (budget) {
        case "econômico":
          return [...groups.economico, ...groups.intermediario];
        case "moderado":
          return [...groups.intermediario, ...groups.medioAlto];
        case "premium":
          return resinList; // All resins available for premium budget
        default:
          return resinList;
      }
    };

    // Filter inventory resins by budget if user has inventory
    const budgetAppropriateInventory = hasInventory
      ? getBudgetAppropriateResins(inventoryResins, data.budget)
      : [];
    const budgetAppropriateOther = hasInventory
      ? getBudgetAppropriateResins(otherResins, data.budget)
      : getBudgetAppropriateResins(resins, data.budget);

    // Group all resins by price for the prompt
    const allGroups = groupResinsByPrice(resins);

    // Build budget rules section for the prompt
    const budgetRulesSection = `
=== REGRAS DE ORÇAMENTO (OBRIGATÓRIO SEGUIR!) ===

O orçamento selecionado pelo paciente é: "${data.budget}"

MAPEAMENTO DE ORÇAMENTO PARA FAIXAS DE PREÇO:
- Orçamento "econômico": Recomendar APENAS resinas "Econômico" ou "Intermediário"
- Orçamento "moderado": Recomendar resinas "Intermediário" ou "Médio-alto", EVITAR "Premium"
- Orçamento "premium": Pode recomendar qualquer faixa, priorizando as melhores tecnicamente

⚠️ REGRA CRÍTICA: A recomendação principal DEVE respeitar o orçamento do paciente!
- Se o orçamento é "econômico", NÃO recomende resinas Premium como Filtek Z350 XT, Estelite Omega, Venus Diamond
- Se o orçamento é "moderado", NÃO recomende resinas Premium como Filtek Z350 XT, Estelite Omega, Venus Diamond
- Apenas para orçamento "premium" você pode recomendar resinas Premium
`;

    // Build resins section organized by price range
    const resinsByPriceSection = `
=== RESINAS ORGANIZADAS POR FAIXA DE PREÇO ===

**ECONÔMICAS** (para orçamento econômico):
${allGroups.economico.length > 0 ? formatResinList(allGroups.economico) : "Nenhuma resina nesta faixa"}

**INTERMEDIÁRIAS** (para orçamento econômico ou moderado):
${allGroups.intermediario.length > 0 ? formatResinList(allGroups.intermediario) : "Nenhuma resina nesta faixa"}

**MÉDIO-ALTO** (para orçamento moderado ou premium):
${allGroups.medioAlto.length > 0 ? formatResinList(allGroups.medioAlto) : "Nenhuma resina nesta faixa"}

**PREMIUM** (APENAS para orçamento premium):
${allGroups.premium.length > 0 ? formatResinList(allGroups.premium) : "Nenhuma resina nesta faixa"}
`;

    const inventorySection = hasInventory
      ? `
=== RESINAS NO INVENTÁRIO DO DENTISTA ===
${budgetAppropriateInventory.length > 0 
    ? `Resinas do inventário compatíveis com orçamento "${data.budget}":\n${formatResinList(budgetAppropriateInventory)}`
    : `Nenhuma resina do inventário é compatível com o orçamento "${data.budget}".`}

Outras resinas do inventário (fora do orçamento):
${inventoryResins.filter((r) => !budgetAppropriateInventory.includes(r)).length > 0
    ? formatResinList(inventoryResins.filter((r) => !budgetAppropriateInventory.includes(r)))
    : "Nenhuma"}
`
      : `
NOTA: O dentista ainda não cadastrou seu inventário. Recomende a melhor opção considerando o orçamento "${data.budget}".
`;

    const inventoryInstructions = hasInventory
      ? `
INSTRUÇÕES DE PRIORIDADE (seguir nesta ordem):
1. PRIMEIRO: Verificar orçamento - a resina DEVE estar na faixa de preço adequada ao orçamento "${data.budget}"
2. SEGUNDO: Dentro das resinas adequadas ao orçamento, PRIORIZAR as que estão no inventário do dentista
3. TERCEIRO: Se nenhuma do inventário for adequada ao orçamento, recomendar a melhor opção externa dentro do orçamento
4. QUARTO: Aspectos técnicos (indicação clínica, estética, resistência) como critério de desempate

IMPORTANTE: 
- Se o inventário tem resinas adequadas ao orçamento, use-as como principal
- A resina ideal tecnicamente pode ser mencionada como sugestão futura se estiver fora do orçamento`
      : `
INSTRUÇÕES DE PRIORIDADE (seguir nesta ordem):
1. PRIMEIRO: Verificar orçamento - a resina DEVE estar na faixa de preço adequada ao orçamento "${data.budget}"
2. SEGUNDO: Dentro das resinas adequadas ao orçamento, escolher a melhor tecnicamente para o caso
3. TERCEIRO: Aspectos técnicos (indicação clínica, estética, resistência) como critério de seleção

IMPORTANTE: Não recomende resinas Premium se o orçamento não for premium!`;

    const prompt = `Você é um especialista em materiais dentários e técnicas restauradoras. Analise o caso clínico abaixo e forneça uma recomendação COMPLETA com protocolo de estratificação.

${budgetRulesSection}

CASO CLÍNICO:
- Idade do paciente: ${data.patientAge} anos
- Dente: ${data.tooth}
- Região: ${data.region}
- Classe da cavidade: ${data.cavityClass}
- Tamanho da restauração: ${data.restorationSize}
- Profundidade: ${data.depth || "Não especificada"}
- Substrato: ${data.substrate}
- Condição do substrato: ${data.substrateCondition || "Normal"}
- Condição do esmalte: ${data.enamelCondition || "Íntegro"}
- Nível estético: ${data.aestheticLevel}
- Cor do dente (VITA): ${data.toothColor}
- Necessita estratificação: ${data.stratificationNeeded ? "Sim" : "Não"}
- Bruxismo: ${data.bruxism ? "Sim" : "Não"}
- Expectativa de longevidade: ${data.longevityExpectation}
- Orçamento: ${data.budget} ⚠️ RESPEITAR ESTA FAIXA!
${data.clinicalNotes ? `- Observações clínicas: ${data.clinicalNotes}` : ''}
${(() => {
  const wantsWhiter = data.desiredChanges?.includes('whiter');
  if (!wantsWhiter) return '';
  const adjustedColors = getWhiteningColors(data.toothColor);
  if (adjustedColors.length === 0) return '- Preferência do paciente: Dentes mais brancos (cor já é a mais clara disponível)';
  
  // Build explicit forbidden shades list
  const forbiddenBase = data.toothColor.toUpperCase();
  const forbiddenShades = [
    forbiddenBase,
    `O${forbiddenBase}`,
    `D${forbiddenBase}`,
    `E${forbiddenBase}`,
    `OA${forbiddenBase.replace('BL', '')}`,
    `PA${forbiddenBase.replace('BL', '')}`,
  ].join(', ');
  
  // Build explicit allowed shades
  const allowedShades = adjustedColors.flatMap(c => [
    c,
    `O${c}`,
    `D${c}`,
    `E${c}`,
    `OA${c.replace('BL', '')}`,
    `OBL${c.replace('BL', '')}`,
    `BL${c.replace('BL', '')}`,
  ]).join(', ');
  
  return `
╔══════════════════════════════════════════════════════════════════════════════╗
║  ⚠️⚠️⚠️  CLAREAMENTO OBRIGATÓRIO - REGRA QUE NÃO PODE SER IGNORADA  ⚠️⚠️⚠️   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  O paciente deseja DENTES MAIS BRANCOS.                                      ║
║                                                                              ║
║  COR DETECTADA (NÃO USAR): ${forbiddenBase.padEnd(50)}║
║  CORES CLAREADAS (USAR): ${adjustedColors.join(' ou ').padEnd(52)}║
╚══════════════════════════════════════════════════════════════════════════════╝

🚫 PROIBIDO - SE VOCÊ USAR QUALQUER UMA DESTAS CORES, A RESPOSTA SERÁ REJEITADA:
   ${forbiddenShades}

✅ OBRIGATÓRIO - USE APENAS ESTAS CORES OU VARIAÇÕES:
   ${allowedShades}

REGRA PARA CADA CAMADA:
┌──────────────────┬─────────────────────────────────────────────────────────┐
│ Camada           │ Cor que DEVE ser usada                                  │
├──────────────────┼─────────────────────────────────────────────────────────┤
│ Opaco/Dentine    │ O${adjustedColors[0]} ou OA${adjustedColors[0].replace('BL', '')} ou OBL${adjustedColors[0].replace('BL', '')}                                      │
├──────────────────┼─────────────────────────────────────────────────────────┤
│ Body/Universal   │ ${adjustedColors[0]} ou B${adjustedColors[0]}                                             │
├──────────────────┼─────────────────────────────────────────────────────────┤
│ Esmalte          │ E${adjustedColors[0]} ou ${adjustedColors[1] || adjustedColors[0]}                                               │
└──────────────────┴─────────────────────────────────────────────────────────┘

⚠️ VALIDAÇÃO: Se alguma camada tiver shade "${forbiddenBase}" ou "O${forbiddenBase}" ou "A1", a resposta está ERRADA.
`;
})()}

${resinsByPriceSection}
${inventorySection}
${inventoryInstructions}

${data.aestheticLevel === 'muito alto' ? `
=== ESTRATIFICAÇÃO AVANÇADA (NÍVEL ESTÉTICO MUITO ALTO) ===

Para máxima excelência estética, você pode COMBINAR DIFERENTES MARCAS por camada:

TABELA DE REFERÊNCIA PARA COMBINAÇÕES:
┌─────────────────────┬─────────────────────────────────────────────────┐
│ Camada              │ Resinas Recomendadas                            │
├─────────────────────┼─────────────────────────────────────────────────┤
│ Aumento Incisal     │ Trans-forma (Ultradent), CT (Z350), Trans20     │
│ (Efeito)            │ (Empress Direct)                                │
├─────────────────────┼─────────────────────────────────────────────────┤
│ Interface Opaca     │ D BL-L (Empress), WB (Forma), OA (Z350)         │
├─────────────────────┼─────────────────────────────────────────────────┤
│ Proximais/Esmalte   │ XLE (Harmonize), E BL-L (Empress), JE (Z350)    │
├─────────────────────┼─────────────────────────────────────────────────┤
│ Esmalte Final       │ MW (Estelite) - excelente polimento             │
│ (acabamento)        │                                                 │
├─────────────────────┼─────────────────────────────────────────────────┤
│ Dentes Clareados    │ WE (Estelite Bianco), BL (Forma)                │
└─────────────────────┴─────────────────────────────────────────────────┘

REGRAS DE COMBINAÇÃO:
1. PRIORIZE resinas do inventário do usuário para o maior número de camadas possível
2. Sugira resinas externas APENAS para camadas críticas onde fazem diferença real
3. Na alternativa, indique opção mais simples usando UMA marca só
4. Inclua na justificativa o benefício específico de cada marca escolhida
` : ''}

INSTRUÇÕES PARA PROTOCOLO DE ESTRATIFICAÇÃO:
1. Se o substrato estiver escurecido/manchado, SEMPRE inclua camada de opaco
2. Para casos estéticos (anteriores), use 3 camadas: Opaco (se necessário), Dentina, Esmalte
3. Para posteriores com alta demanda estética, considere estratificação
4. Para posteriores simples, pode recomendar técnica bulk ou incrementos simples
5. Adapte as cores das camadas baseado na cor VITA informada (ex: A2 → OA2 opaco, A2D dentina, A2E esmalte)

=== ESPESSURAS DE CAMADA POR CONDIÇÃO DO SUBSTRATO ===
As espessuras das camadas são faixas-guia que devem ser adaptadas clinicamente conforme a profundidade e mascaramento necessário.

REGRAS OBRIGATÓRIAS DE ESPESSURA:
┌─────────────────────────┬───────────────────────────────────────────────────────┐
│ Condição do Substrato   │ Espessuras Recomendadas                               │
├─────────────────────────┼───────────────────────────────────────────────────────┤
│ Normal/Saudável         │ Opaco: 0.2-0.3mm, Dentina: 0.5-1.0mm, Esmalte: 0.3mm  │
├─────────────────────────┼───────────────────────────────────────────────────────┤
│ Escurecido/Manchado     │ Opaco: 0.5-0.8mm (crítico!), Dentina: 0.5mm, Esmalte: 0.3mm │
├─────────────────────────┼───────────────────────────────────────────────────────┤
│ Restauração prévia      │ Opaco: 0.3-0.5mm, Dentina: 0.5mm, Esmalte: 0.3mm      │
└─────────────────────────┴───────────────────────────────────────────────────────┘

A condição do substrato atual é: "${data.substrateCondition || 'Normal'}"
${data.substrateCondition === 'Escurecido' ? '⚠️ SUBSTRATO ESCURECIDO: Use camada de opaco espessa (0.5-0.8mm) para mascaramento adequado!' : ''}

=== PROTOCOLO ADESIVO DETALHADO ===
VOCÊ DEVE recomendar o tipo de sistema adesivo baseado no caso clínico:

TABELA DE RECOMENDAÇÃO ADESIVA:
┌─────────────────────────┬───────────────────────────────────────────────────────┐
│ Situação Clínica        │ Sistema Adesivo Recomendado                           │
├─────────────────────────┼───────────────────────────────────────────────────────┤
│ Esmalte abundante       │ Etch-and-rinse (convencional 2/3 passos)              │
│ Predominância dentina   │ Self-etch ou Universal (modo self-etch)               │
│ Substrato escurecido    │ Universal com etching seletivo em esmalte             │
│ Dentes jovens/vitais    │ Self-etch (menor sensibilidade pós-operatória)        │
│ Dentes despolpados      │ Etch-and-rinse (melhor adesão em dentina esclerótica) │
│ Recobrimento de pino    │ Universal com silano (se pino de fibra)               │
└─────────────────────────┴───────────────────────────────────────────────────────┘

Substrato atual: "${data.substrate}"
Condição do esmalte: "${data.enamelCondition || 'Íntegro'}"

No checklist, especifique o tipo de sistema adesivo recomendado, não apenas "sistema adesivo conforme fabricante".

=== TÉCNICAS OBSOLETAS - NÃO INCLUIR NO CHECKLIST ===
❌ "Bisel em esmalte" ou "Biselamento" → Técnica ultrapassada, NÃO USE
❌ "Bisel amplo" ou "Bisel longo" → NÃO USE
❌ "Ácido fosfórico por 30 segundos em dentina" → Tempo excessivo

✅ TÉCNICAS ATUALIZADAS PARA USAR:
- "Acabamento em chanfro suave" ou "Transição suave entre resina e esmalte"
- "Sem preparo adicional em esmalte" (técnicas minimamente invasivas)
- "Condicionamento ácido conforme indicação do substrato"
- Especificar tipo de adesivo (Etch-and-rinse, Self-etch ou Universal)

REGRA CRÍTICA: O checklist NÃO DEVE conter as palavras "bisel" ou "biselamento".

=== ACABAMENTO E POLIMENTO (OBRIGATÓRIO) ===
Você DEVE incluir a seção "finishing" no protocolo com passos detalhados de:
1. CONTORNO ANATÔMICO: 
   - Pontas diamantadas finas (FF) para ajuste de anatomia
   - Discos de granulação grossa para contorno inicial
2. POLIMENTO SEQUENCIAL:
   - Discos: Grossa → Média → Fina → Ultrafina (ex: Sof-Lex, OptiDisc)
   - Pontas siliconadas/borrachas polidoras para faces livres
   - Pasta diamantada ou óxido de alumínio para brilho
3. BRILHO FINAL:
   - Escova de feltro + pasta de polimento de alta performance

Especificar para cada passo: ferramenta, granulação, velocidade (alta/baixa), tempo, e dica técnica.

${data.bruxism ? `
=== ALERTAS ENFÁTICOS DE BRUXISMO ===
⚠️⚠️⚠️ PACIENTE BRUXISTA - ATENÇÃO REDOBRADA! ⚠️⚠️⚠️

REGRAS OBRIGATÓRIAS PARA BRUXISTAS:
1. RESINAS: Priorize nano-híbridas ou micro-híbridas de alta resistência (Ex: Filtek Z350, Estelite Omega, Harmonize)
2. CAMADA DE ESMALTE: Reduza espessura para 0.2-0.3mm (menos tensão)
3. OCLUSÃO: Verificar e ajustar contatos prematuros antes do procedimento
4. PROTEÇÃO: Placa oclusal noturna é OBRIGATÓRIA - incluir no checklist

INCLUIR NOS ALERTAS/WARNINGS:
- "BRUXISMO: Prescreva placa de proteção noturna obrigatoriamente"
- "BRUXISMO: Documente orientação no prontuário"
- "BRUXISMO: Agendar retorno em 7 dias para verificar desgaste"
` : ''}

Responda em formato JSON:
{
  "recommended_resin_name": "nome exato da resina recomendada (DEVE respeitar o orçamento!)",
  "is_from_inventory": true ou false,
  "ideal_resin_name": "nome da resina ideal se diferente (null se igual)",
  "ideal_reason": "explicação se ideal for diferente (null se não aplicável)",
  "budget_compliance": true ou false (a resina recomendada respeita o orçamento?),
  "price_range": "faixa de preço da resina recomendada (Econômico/Intermediário/Médio-alto/Premium)",
  "justification": "explicação detalhada de 2-3 frases incluindo por que esta resina foi escolhida considerando o orçamento",
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
        "name": "Nome da camada (Opaco/Dentina/Esmalte/Body/Bulk)",
        "resin_brand": "Fabricante - Linha do produto (ex: Tokuyama - Estelite Omega, FGM - Vittra APS, Solventum - Filtek Z350 XT). NUNCA informe apenas o fabricante!",
        "shade": "Cor específica (ex: OA2, A2D, A2E)",
        "thickness": "Faixa de espessura guia (ex: 0.3-0.5mm)",
        "purpose": "Objetivo desta camada",
        "technique": "Técnica de aplicação"
      }
    ],
    "alternative": {
      "resin": "Resina alternativa para técnica simplificada",
      "shade": "Cor única",
      "technique": "Descrição da técnica alternativa",
      "tradeoff": "O que se perde com esta alternativa"
    },
    "finishing": {
      "contouring": [
        {"order": 1, "tool": "Ponta diamantada FF 2135FF", "grit": "Fina", "speed": "Alta rotação com spray", "time": "20-30s", "tip": "Movimentos leves de varredura"}
      ],
      "polishing": [
        {"order": 1, "tool": "Disco Sof-Lex Laranja", "grit": "Grossa", "speed": "Baixa rotação", "time": "30s", "tip": "Sentido cervical-incisal"},
        {"order": 2, "tool": "Disco Sof-Lex Amarelo", "grit": "Média", "speed": "Baixa rotação", "time": "30s", "tip": "Manter disco úmido"},
        {"order": 3, "tool": "Disco Sof-Lex Verde", "grit": "Fina", "speed": "Baixa rotação", "time": "30s", "tip": "Evitar pressão excessiva"},
        {"order": 4, "tool": "Disco Sof-Lex Azul Claro", "grit": "Ultrafina", "speed": "Baixa rotação", "time": "30s", "tip": "Polimento final"}
      ],
      "final_glaze": "Pasta Diamond Excel com feltro em baixa rotação por 40s",
      "maintenance_advice": "Polimento de retoque a cada 6 meses para manter brilho"
    },
    "checklist": [
      "Passo 1: Profilaxia com pasta sem flúor",
      "Passo 2: Seleção de cor sob luz natural",
      "Passo 3: Isolamento absoluto ou relativo",
      "Passo 4: Condicionamento ácido conforme substrato",
      "Passo 5: Sistema adesivo conforme protocolo do fabricante",
      "..."
    ],
    "alerts": [
      "O protocolo adesivo varia entre fabricantes - consulte as instruções do sistema utilizado",
      "Alerta condicional 2"
    ],
    "warnings": [
      "NÃO fazer X",
      "NÃO fazer Y"
    ],
    "confidence": "alta/média/baixa"
  }
}

Responda APENAS com o JSON, sem texto adicional.`;

    // Call Lovable AI Gateway
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 4096,
        }),
      }
    );

    if (!aiResponse.ok) {
      console.error("AI API error:", aiResponse.status);
      
      if (aiResponse.status === 429) {
        return createErrorResponse(ERROR_MESSAGES.RATE_LIMITED, 429, corsHeaders, "RATE_LIMITED");
      }
      if (aiResponse.status === 402) {
        return createErrorResponse(ERROR_MESSAGES.PAYMENT_REQUIRED, 402, corsHeaders, "PAYMENT_REQUIRED");
      }
      
      return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices[0].message.content;

    // Parse JSON from AI response
    let recommendation;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response");
      return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
    }

    // Log budget compliance for debugging
    console.log(`Budget: ${data.budget}, Recommended: ${recommendation.recommended_resin_name}, Price Range: ${recommendation.price_range}, Budget Compliant: ${recommendation.budget_compliance}`);

    // Find the recommended resin in database
    const recommendedResin = resins.find(
      (r) =>
        r.name.toLowerCase() ===
        recommendation.recommended_resin_name.toLowerCase()
    );

    // Find the ideal resin if different
    let idealResin = null;
    if (
      recommendation.ideal_resin_name &&
      recommendation.ideal_resin_name.toLowerCase() !==
        recommendation.recommended_resin_name.toLowerCase()
    ) {
      idealResin = resins.find(
        (r) =>
          r.name.toLowerCase() === recommendation.ideal_resin_name.toLowerCase()
      );
    }

    // Combine alternatives (inventory first, then external)
    const allAlternatives = [
      ...(recommendation.inventory_alternatives || []),
      ...(recommendation.external_alternatives || []),
    ].slice(0, 4); // Limit to 4 alternatives

    // Extract protocol from recommendation
    const protocol = recommendation.protocol as StratificationProtocol | undefined;

    // Update evaluation with recommendation and full protocol
    const { error: updateError } = await supabase
      .from("evaluations")
      .update({
        recommended_resin_id: recommendedResin?.id || null,
        recommendation_text: recommendation.justification,
        alternatives: allAlternatives,
        is_from_inventory: recommendation.is_from_inventory || false,
        ideal_resin_id: idealResin?.id || null,
        ideal_reason: recommendation.ideal_reason || null,
        has_inventory_at_creation: hasInventory,
        // New protocol fields
        stratification_protocol: protocol ? {
          layers: protocol.layers,
          alternative: protocol.alternative,
          finishing: protocol.finishing,
          checklist: protocol.checklist,
          confidence: protocol.confidence,
        } : null,
        protocol_layers: protocol?.layers || null,
        alerts: protocol?.alerts || [],
        warnings: protocol?.warnings || [],
      })
      .eq("id", data.evaluationId);

    if (updateError) {
      console.error("Database error saving result:", updateError);
      return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
    }

    return new Response(
      JSON.stringify({
        success: true,
        recommendation: {
          resin: recommendedResin,
          justification: recommendation.justification,
          alternatives: allAlternatives,
          isFromInventory: recommendation.is_from_inventory,
          idealResin: idealResin,
          idealReason: recommendation.ideal_reason,
          protocol: protocol || null,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
  }
});
