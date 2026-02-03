import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreFlight, ERROR_MESSAGES, createErrorResponse } from "../_shared/cors.ts";
import { validateEvaluationData, type EvaluationData } from "../_shared/validation.ts";
import { logger } from "../_shared/logger.ts";
import { callGemini, GeminiError, type OpenAIMessage } from "../_shared/gemini.ts";

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
${data.aestheticGoals ? `
═══════════════════════════════════════════════════════════════════════════════
  PREFERÊNCIAS ESTÉTICAS DO PACIENTE
═══════════════════════════════════════════════════════════════════════════════

O paciente expressou os seguintes desejos:
"${data.aestheticGoals}"

INSTRUÇÕES PARA ANÁLISE DAS PREFERÊNCIAS:
- Analise o texto acima e extraia as preferências estéticas do paciente
- Se mencionar clareamento/branco/mais claro: ajuste cores 1-2 tons mais claros
  (ex: se detectou A3, use A2 ou A1; se detectou A1, use BL4 ou BL3)
- Se mencionar natural/discreto: priorize translucidez e mimetismo natural
- Se mencionar sensibilidade: considere sistemas self-etch e protetores pulpares
- Se mencionar durabilidade/longevidade: priorize resinas de alta resistência
- Se mencionar conservador/minimamente invasivo: técnicas conservadoras

Aplique TODAS as preferências identificadas no protocolo de estratificação.
Quando aplicar clareamento, use cores mais claras em TODAS as camadas:
- Camada Opaco/Dentina: versão opaca do tom clareado
- Camada Body: tom clareado
- Camada Esmalte: versão esmalte do tom clareado ou um tom ainda mais claro
═══════════════════════════════════════════════════════════════════════════════
` : ''}

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
` : ''}

=== REGRAS DE COR POR TIPO DE CAMADA (OBRIGATÓRIO!) ===
⚠️ CRÍTICO: A cor escolhida DEVE corresponder ao tipo da camada E existir na linha de produto!

CAMADA OPACO/MASCARAMENTO:
- USAR: Cores com prefixo O (OA1, OA2, OA3, OB1, OB2, WO) ou White Opaquer
- OBJETIVO: Bloquear substrato escuro, criar barreira óptica
- NUNCA use cores opacas para camadas de dentina ou body!

CAMADA DENTINA/BODY:
- USAR: Cores universais/body (A1, A2, A3, B1, B2, C1, D2) ou Dentina específica (DA1, DA2, DA3)
- NÃO USAR: Cores com prefixo O (OA1, OA2) - resultam em aparência artificial "morta"
- OBJETIVO: Reproduzir corpo do dente com profundidade e naturalidade

CAMADA ESMALTE (REGRA CRÍTICA!):
- PRIORIDADE 1: Cores ESPECÍFICAS de esmalte (WE, CE, JE, EA1, EA2, Trans) se disponíveis na linha
- PRIORIDADE 2: Cores translúcidas (CT, IT, T-Neutral) como segunda opção
- PRIORIDADE 3: APENAS se a linha NÃO tiver esmalte específico, usar cor Universal mais clara (B1, A1)
- OBJETIVO: Máxima translucidez incisal e mimetismo natural para estética anterior
- ⚠️ Para dentes anteriores (Classe III, IV), cores específicas de esmalte são ESSENCIAIS!

TABELA DE CORES DE ESMALTE POR LINHA:
┌─────────────────────┬─────────────────────────────────────┐
│ Linha de Produto    │ Cores de Esmalte Disponíveis        │
├─────────────────────┼─────────────────────────────────────┤
│ Estelite Sigma Quick│ WE (White Enamel), CE (Clear Enamel)│
│ Estelite Omega      │ WE, JE (Jet Enamel), CT, MW         │
│ Filtek Z350 XT      │ CT, GT, WE, WT                      │
│ Harmonize           │ Incisal, TN (Trans Neutral)         │
│ IPS Empress Direct  │ Trans 20, Trans 30, Opal            │
│ Vittra APS          │ Trans, INC                          │
│ Palfique LX5        │ Enamel shades, CE                   │
└─────────────────────┴─────────────────────────────────────┘

EXEMPLO CORRETO para cor A2 em Classe IV com Estelite Sigma Quick:
❌ ERRADO: Opaco=OA1, Dentina=OA1, Esmalte=B1 (OA1 na dentina! B1 não é esmalte!)
✅ CERTO: Opaco=OA2, Dentina=A2, Esmalte=WE ou CE (cores específicas de esmalte!)

=== REGRAS PARA CLAREAMENTO (BLEACH SHADES) ===
Se o paciente pede clareamento (BL1, BL2, BL3, Hollywood):

1. VERIFICAR se a linha recomendada possui cores BL no catálogo
2. Se NÃO possui cores BL:
   - ADICIONAR ALERTA: "A linha [nome] não possui cores BL. Para atingir nível Hollywood, considere [linha alternativa com BL]."
   - Usar a cor mais clara disponível (ex: B1, A1) como aproximação
3. Se POSSUI cores BL:
   - Usar BL4, BL3, BL2, BL1 conforme nível de clareamento desejado

LINHAS COM CORES BL DISPONÍVEIS:
- Palfique LX5: BL1, BL2, BL3
- Forma (Ultradent): BL
- Filtek Z350 XT: WB, WE (aproximação)
- Estelite Bianco: específica para clareados

LINHAS SEM CORES BL:
- Estelite Sigma Quick (usar B1/A1 como aproximação)
- Vittra APS (usar A1 como aproximação)

INSTRUÇÕES PARA PROTOCOLO DE ESTRATIFICAÇÃO:
1. Se o substrato estiver escurecido/manchado, SEMPRE inclua camada de opaco
2. Para casos estéticos (anteriores), use 3 camadas: Opaco (se necessário), Dentina, Esmalte
3. Para dentes anteriores, SEMPRE use cor específica de esmalte na camada final!
4. Para posteriores com alta demanda estética, considere estratificação
5. Para posteriores simples, pode recomendar técnica bulk ou incrementos simples
6. Adapte as cores das camadas baseado na cor VITA informada SEGUINDO AS REGRAS ACIMA

=== NATURALIDADE DO RESULTADO (CRÍTICO PARA ESTÉTICA ANTERIOR) ===

Para restaurações que pareçam NATURAIS e não "dentes de porcelana artificial":

1. **GRADIENTE DE COR**:
   - Terço cervical: Mais saturado e opaco (tons mais escuros)
   - Terço médio: Cor principal (VITA selecionada)
   - Terço incisal: Menos saturado, mais translúcido

2. **TRANSLUCIDEZ INCISAL**:
   - NUNCA deixar borda incisal 100% opaca em dentes anteriores
   - Usar esmalte translúcido (CT, CE, WE, Trans) para efeito natural
   - Efeito "halo" na borda incisal = naturalidade

3. **CARACTERIZAÇÃO OPCIONAL** (nível estético muito alto):
   - Manchas brancas sutis (White spots artificiais)
   - Linhas de trinca de esmalte (craze lines)
   - Mamelons (projeções incisais em pacientes jovens)
   - ATENÇÃO: Caracterização exagerada = resultado artificial

4. **OPALESCÊNCIA E FLUORESCÊNCIA**:
   - Resinas com opalescência simulam efeito natural da luz no esmalte
   - Fluorescência adequada evita aspecto "morto" sob luz UV

5. **INTEGRAÇÃO COM DENTES ADJACENTES**:
   - A restauração deve "sumir" entre os dentes vizinhos
   - Cor e translucidez devem harmonizar com os adjacentes
   - Evitar contraste de brilho (restauração muito polida vs dentes naturais opacos)

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

    // Call Gemini API
    const messages: OpenAIMessage[] = [
      { role: "user", content: prompt },
    ];

    let content: string;
    try {
      const result = await callGemini(
        "gemini-3-flash-preview",
        messages,
        {
          temperature: 0.3,
          maxTokens: 4096,
        }
      );

      if (!result.text) {
        logger.error("Empty response from Gemini");
        return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
      }

      content = result.text;
    } catch (error) {
      if (error instanceof GeminiError) {
        if (error.statusCode === 429) {
          return createErrorResponse(ERROR_MESSAGES.RATE_LIMITED, 429, corsHeaders, "RATE_LIMITED");
        }
        logger.error("Gemini API error:", error.message);
      } else {
        logger.error("AI error:", error);
      }
      return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
    }

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
      logger.error("Failed to parse AI response");
      return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
    }

    // Validate and fix protocol layers against resin_catalog
    if (recommendation.protocol?.layers && Array.isArray(recommendation.protocol.layers)) {
      const validatedLayers = [];
      const validationAlerts: string[] = [];
      
      // Check if patient requested whitening (BL shades)
      const wantsWhitening = data.aestheticGoals?.toLowerCase().includes('clareamento') ||
                             data.aestheticGoals?.toLowerCase().includes('bl1') ||
                             data.aestheticGoals?.toLowerCase().includes('bl2') ||
                             data.aestheticGoals?.toLowerCase().includes('hollywood') ||
                             data.aestheticGoals?.toLowerCase().includes('branco');
      
      // Track if any layer uses a product line without BL shades
      let productLineWithoutBL: string | null = null;
      
      for (const layer of recommendation.protocol.layers) {
        // Extract product line from resin_brand (format: "Fabricante - Linha")
        const brandMatch = layer.resin_brand?.match(/^(.+?)\s*-\s*(.+)$/);
        const productLine = brandMatch ? brandMatch[2].trim() : layer.resin_brand;
        const layerType = layer.name?.toLowerCase() || '';
        
        if (productLine && layer.shade) {
          // Check if shade exists in the product line
          const { data: catalogMatch } = await supabase
            .from('resin_catalog')
            .select('shade, type, product_line')
            .ilike('product_line', `%${productLine}%`)
            .eq('shade', layer.shade)
            .limit(1);
          
          // For enamel layer, ensure we use specific enamel shades when available
          const isEnamelLayer = layerType.includes('esmalte') || layerType.includes('enamel');
          
          if (isEnamelLayer) {
            // Check if the product line has specific enamel shades
            const { data: enamelShades } = await supabase
              .from('resin_catalog')
              .select('shade, type')
              .ilike('product_line', `%${productLine}%`)
              .ilike('type', '%Esmalte%')
              .limit(10);
            
            // If enamel shades exist but current shade is Universal, suggest enamel shade
            if (enamelShades && enamelShades.length > 0) {
              const currentIsUniversal = !['WE', 'CE', 'JE', 'CT', 'Trans', 'IT', 'TN', 'Opal', 'INC'].some(
                prefix => layer.shade.toUpperCase().includes(prefix)
              );
              
              if (currentIsUniversal) {
                // Find preferred enamel shade (WE > CE > others)
                const preferredOrder = ['WE', 'CE', 'JE', 'CT', 'Trans'];
                let bestEnamel = enamelShades[0];
                
                for (const pref of preferredOrder) {
                  const found = enamelShades.find(e => e.shade.toUpperCase().includes(pref));
                  if (found) {
                    bestEnamel = found;
                    break;
                  }
                }
                
                const originalShade = layer.shade;
                layer.shade = bestEnamel.shade;
                validationAlerts.push(
                  `Camada de esmalte otimizada: ${originalShade} → ${bestEnamel.shade} para máxima translucidez incisal.`
                );
                logger.warn(`Enamel optimization: ${originalShade} → ${bestEnamel.shade} for ${productLine}`);
              }
            }
          }
          
          // Check if patient wants BL but product line doesn't have it
          if (wantsWhitening && !productLineWithoutBL) {
            const { data: blShades } = await supabase
              .from('resin_catalog')
              .select('shade')
              .ilike('product_line', `%${productLine}%`)
              .or('shade.ilike.%BL%,shade.ilike.%Bianco%')
              .limit(1);
            
            if (!blShades || blShades.length === 0) {
              productLineWithoutBL = productLine;
            }
          }
          
          if (!catalogMatch || catalogMatch.length === 0) {
            // Shade doesn't exist - find appropriate alternative
            let typeFilter = '';
            
            // Determine appropriate type based on layer name
            if (layerType.includes('opaco') || layerType.includes('mascaramento')) {
              typeFilter = 'Opaco';
            } else if (layerType.includes('dentina') || layerType.includes('body')) {
              typeFilter = 'Universal'; // Universal/Body shades for dentin
            } else if (isEnamelLayer) {
              typeFilter = 'Esmalte';
            }
            
            // Find alternative shades in the same product line
            let alternativeQuery = supabase
              .from('resin_catalog')
              .select('shade, type, product_line')
              .ilike('product_line', `%${productLine}%`);
            
            if (typeFilter) {
              alternativeQuery = alternativeQuery.ilike('type', `%${typeFilter}%`);
            }
            
            const { data: alternatives } = await alternativeQuery.limit(5);
            
            if (alternatives && alternatives.length > 0) {
              const originalShade = layer.shade;
              
              // Try to find the closest shade based on the original
              const baseShade = originalShade.replace(/^O/, '').replace(/[DE]$/, '');
              const closestAlt = alternatives.find(a => a.shade.includes(baseShade)) || alternatives[0];
              
              layer.shade = closestAlt.shade;
              validationAlerts.push(
                `Cor ${originalShade} substituída por ${closestAlt.shade}: a cor original não está disponível na linha ${productLine}.`
              );
              logger.warn(`Shade validation: ${originalShade} → ${closestAlt.shade} for ${productLine}`);
            } else {
              // No alternatives found in this product line - log warning
              logger.warn(`No valid shades found for ${productLine}, keeping original: ${layer.shade}`);
            }
          }
        }
        
        validatedLayers.push(layer);
      }
      
      // Add BL availability alert if needed
      if (wantsWhitening && productLineWithoutBL) {
        validationAlerts.push(
          `A linha ${productLineWithoutBL} não possui cores BL (Bleach). Para atingir nível de clareamento Hollywood, considere linhas como Palfique LX5, Forma (Ultradent) ou Estelite Bianco que oferecem cores BL.`
        );
        logger.warn(`BL shades not available in ${productLineWithoutBL}, patient wants whitening`);
      }
      
      // Update layers with validated versions
      recommendation.protocol.layers = validatedLayers;
      
      // Add validation alerts to protocol alerts
      if (validationAlerts.length > 0) {
        recommendation.protocol.alerts = [
          ...(recommendation.protocol.alerts || []),
          ...validationAlerts
        ];
      }
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
