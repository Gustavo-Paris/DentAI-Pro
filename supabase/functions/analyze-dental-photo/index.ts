import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreFlight, ERROR_MESSAGES, createErrorResponse } from "../_shared/cors.ts";
import { logger } from "../_shared/logger.ts";
import { callGeminiVisionWithTools, GeminiError, type OpenAITool } from "../_shared/gemini.ts";

interface AnalyzePhotoRequest {
  imageBase64: string;
  imageType?: string; // "intraoral" | "frontal_smile" | "45_smile" | "face"
}

// Expanded treatment types
type TreatmentIndication = "resina" | "porcelana" | "coroa" | "implante" | "endodontia" | "encaminhamento";

interface ToothBounds {
  x: number;       // Center X position (0-100%)
  y: number;       // Center Y position (0-100%)
  width: number;   // Width as percentage (0-100%)
  height: number;  // Height as percentage (0-100%)
}

interface DetectedTooth {
  tooth: string;
  tooth_region: string | null;
  cavity_class: string | null;
  restoration_size: string | null;
  substrate: string | null;
  substrate_condition: string | null;
  enamel_condition: string | null;
  depth: string | null;
  priority: "alta" | "média" | "baixa";
  notes: string | null;
  treatment_indication?: TreatmentIndication;
  indication_reason?: string;
  tooth_bounds?: ToothBounds;
}

interface PhotoAnalysisResult {
  detected: boolean;
  confidence: number;
  detected_teeth: DetectedTooth[];
  primary_tooth: string | null;
  vita_shade: string | null;
  observations: string[];
  warnings: string[];
  treatment_indication?: TreatmentIndication;
  indication_reason?: string;
}

// Validate image request data
function validateImageRequest(data: unknown): { success: boolean; error?: string; data?: AnalyzePhotoRequest } {
  if (!data || typeof data !== "object") {
    return { success: false, error: ERROR_MESSAGES.INVALID_REQUEST };
  }

  const obj = data as Record<string, unknown>;

  if (!obj.imageBase64 || typeof obj.imageBase64 !== "string") {
    return { success: false, error: ERROR_MESSAGES.IMAGE_INVALID };
  }

  // Validate imageType if provided
  if (obj.imageType !== undefined) {
    const validTypes = ["intraoral", "frontal_smile", "45_smile", "face"];
    if (typeof obj.imageType !== "string" || !validTypes.includes(obj.imageType)) {
      obj.imageType = "intraoral"; // Default to intraoral
    }
  }

  return {
    success: true,
    data: {
      imageBase64: obj.imageBase64 as string,
      imageType: (obj.imageType as string) || "intraoral",
    },
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(req);
  if (preflightResponse) return preflightResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401, corsHeaders);
    }

    // Verify JWT claims
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return createErrorResponse(ERROR_MESSAGES.INVALID_TOKEN, 401, corsHeaders);
    }

    // Parse and validate request
    let rawData: unknown;
    try {
      rawData = await req.json();
    } catch {
      return createErrorResponse(ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
    }

    const validation = validateImageRequest(rawData);
    if (!validation.success || !validation.data) {
      return createErrorResponse(validation.error || ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
    }

    const data = validation.data;

    // Server-side validation of image data
    const base64Data = data.imageBase64.includes(",") 
      ? data.imageBase64.split(",")[1] 
      : data.imageBase64;
    
    // Validate base64 format
    if (!/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
      return createErrorResponse(ERROR_MESSAGES.IMAGE_INVALID, 400, corsHeaders);
    }

    // Validate image size (max 10MB in base64 = ~13.3MB base64 string)
    if (base64Data.length > 13 * 1024 * 1024) {
      return createErrorResponse(ERROR_MESSAGES.IMAGE_TOO_LARGE, 400, corsHeaders);
    }

    // Verify magic bytes for common image formats
    const bytes = Uint8Array.from(atob(base64Data.slice(0, 16)), c => c.charCodeAt(0));
    const isJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    const isWEBP = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
    
    if (!isJPEG && !isPNG && !isWEBP) {
      return createErrorResponse(ERROR_MESSAGES.IMAGE_FORMAT_UNSUPPORTED, 400, corsHeaders);
    }

    // Use the validated base64 data
    const base64Image = base64Data;

    // System prompt for dental photo analysis - MULTI-TOOTH + EXPANDED TREATMENT TYPES + VISAGISM
    const systemPrompt = `Você é um especialista em odontologia restauradora e estética com 20 anos de experiência em análise de casos clínicos, planejamento de sorrisos e VISAGISMO aplicado à odontologia.

REGRA CRÍTICA E OBRIGATÓRIA: Você DEVE analisar o SORRISO COMO UM TODO, identificando TODOS os tipos de tratamento necessários E oportunidades de HARMONIZAÇÃO ESTÉTICA baseada em princípios de visagismo.

=== PRINCÍPIOS DE VISAGISMO NA ANÁLISE ===

Ao analisar a foto, considere:

1. **PROPORÇÕES DENTÁRIAS vs CARACTERÍSTICAS FACIAIS**:
   - Dentes devem harmonizar com o formato do rosto visível
   - Incisivos centrais muito pequenos em rosto grande = desarmonia
   - Incisivos centrais muito grandes em rosto delicado = desarmonia

2. **ARCO DO SORRISO** (se lábios visíveis):
   - CONSONANTE: Bordos incisais seguem curva do lábio inferior (ideal)
   - PLANO: Bordos formam linha reta (menos estético)
   - REVERSO: Bordos côncavos (problema estético)

3. **CORREDOR BUCAL**:
   - Espaço escuro lateral ao sorrir
   - Excessivo = sorriso "vazio"
   - Ausente = sorriso "apertado"

4. **LINHA DO SORRISO**:
   - Alta (>3mm gengiva): Considerar tratamento gengival
   - Média (0-3mm): Ideal para tratamentos estéticos
   - Baixa: Dentes parcialmente cobertos

Inclua observações de visagismo nas "observations" quando relevante.

## ANÁLISE MULTI-DENTE (Problemas Restauradores)
- Analise SISTEMATICAMENTE cada quadrante: superior-direito (Q1: 11-18), superior-esquerdo (Q2: 21-28), inferior-esquerdo (Q3: 31-38), inferior-direito (Q4: 41-48)
- Se houver 4 dentes com problema, liste TODOS OS 4 no array detected_teeth
- NUNCA retorne apenas 1 dente se houver mais dentes com problemas visíveis
- Em caso de DÚVIDA sobre um dente, INCLUA ele na lista (o dentista revisará)
- Cada dente com cárie, fratura, restauração defeituosa ou lesão DEVE ser listado separadamente

## ANÁLISE DO SORRISO COMPLETO (Melhorias Estéticas)
Além de patologias, identifique oportunidades de melhoria estética mesmo em dentes saudáveis:
- Dentes que poderiam receber VOLUME/CONTORNO para harmonizar o sorriso
- Incisivos laterais que poderiam ser ALINHADOS ou TER PROPORÇÕES CORRIGIDAS
- Diastemas que poderiam ser fechados

## TIPOS DE TRATAMENTO DISPONÍVEIS:

### "resina" - Restauração direta de resina composta
- Lesões de cárie localizadas
- Restaurações pequenas a médias (<50% da estrutura)
- Fechamento de diastemas simples (até 2mm)
- Correções estéticas pontuais em 1-2 dentes
- Fraturas parciais restauráveis

### "porcelana" - Facetas/laminados cerâmicos
- Escurecimento severo por tratamento de canal ou tetraciclina
- Restaurações extensas comprometendo >50% da estrutura dental
- Múltiplos dentes anteriores (3+) com necessidade de harmonização estética
- Diastemas múltiplos ou assimetrias significativas
- Fluorose severa ou hipoplasia extensa

### "coroa" - Coroa total (metal-cerâmica ou cerâmica pura)
- Destruição coronária 60-80% com raiz saudável
- Pós tratamento de canal em dentes posteriores
- Restaurações múltiplas extensas no mesmo dente
- Dente com grande perda de estrutura mas raiz viável

### "implante" - Indica necessidade de extração e implante
- Raiz residual sem estrutura coronária viável
- Destruição >80% da coroa clínica sem possibilidade de reabilitação
- Lesão periapical extensa com prognóstico ruim
- Fratura vertical de raiz
- Reabsorção radicular avançada

### "endodontia" - Tratamento de canal necessário antes de restauração
- Escurecimento sugestivo de necrose pulpar
- Lesão periapical visível radiograficamente
- Exposição pulpar por cárie profunda
- Sintomatologia de pulpite irreversível

### "encaminhamento" - Caso fora do escopo (ortodontia, periodontia, etc.)
- Problemas periodontais significativos (mobilidade, recessão severa)
- Má-oclusão que requer ortodontia primeiro
- Lesões suspeitas (encaminhar para biópsia)
- Casos que requerem especialista

## Para CADA dente identificado, determine:
1. Número do dente (notação FDI: 11-18, 21-28, 31-38, 41-48)
2. A região do dente (anterior/posterior, superior/inferior)
3. A classificação da cavidade (Classe I, II, III, IV, V ou VI)
4. O tamanho estimado da restauração (Pequena, Média, Grande, Extensa)
5. O tipo de substrato visível (Esmalte, Dentina, Esmalte e Dentina, Dentina profunda)
6. A condição do substrato (Saudável, Esclerótico, Manchado, Cariado, Desidratado)
7. A condição do esmalte (Íntegro, Fraturado, Hipoplásico, Fluorose, Erosão)
8. A profundidade estimada (Superficial, Média, Profunda)
9. Prioridade de tratamento:
   - "alta": cáries ativas, fraturas, dor, necessidade de extração/implante
   - "média": restaurações defeituosas, lesões não urgentes, coroas
   - "baixa": melhorias estéticas opcionais
10. INDICAÇÃO DE TRATAMENTO: resina, porcelana, coroa, implante, endodontia, ou encaminhamento
11. POSIÇÃO DO DENTE NA IMAGEM (tooth_bounds): Para o dente PRINCIPAL, estime a posição na foto:
   - x: posição horizontal do CENTRO do dente (0% = esquerda, 100% = direita)
   - y: posição vertical do CENTRO do dente (0% = topo, 100% = base)
   - width: largura aproximada do dente como % da imagem
   - height: altura aproximada do dente como % da imagem

## ANÁLISE GENGIVAL E PERIODONTAL

Avalie o contorno gengival para CADA dente visível:

1. **Coroas Clínicas Curtas**
   - Identifique dentes com proporção altura/largura inadequada
   - Se incisivos laterais parecem "pequenos", considere se gengivoplastia aumentaria a coroa clínica
   - Inclua em notes: "Gengivoplastia recomendada para aumentar coroa clínica"

2. **Assimetria Gengival**
   - Compare dentes homólogos (12 vs 22, 13 vs 23)
   - Note diferenças de altura gengival > 1mm
   - Inclua em observations: "Assimetria gengival entre [dentes]"

3. **Exposição Gengival Excessiva (Sorriso Gengival)**
   - Sorriso gengival > 3mm: considerar encaminhamento para periodontia
   - Inclua em warnings se detectado

Se gengivoplastia melhoraria proporções:
- Inclua em notes do dente: "Considerar gengivoplastia prévia"
- Inclua em observations gerais: "Avaliação periodontal recomendada para otimizar proporções"

## DETECÇÃO DE RESTAURAÇÕES EXISTENTES (CRÍTICO)

OBSERVE atentamente por sinais de restaurações prévias:

1. **Sinais Visuais**
   - Linhas de interface (fronteira resina-esmalte)
   - Diferença de cor entre regiões do mesmo dente
   - Diferença de textura (mais opaco, mais liso)
   - Manchamento localizado ou escurecimento marginal

2. **Como Registrar**
   Se detectar restauração existente:
   - enamel_condition: "Restauração prévia" (adicione esta opção se necessário)
   - notes: "Restauração em resina existente - avaliar necessidade de substituição"
   - treatment_indication: "resina" (para reparo/substituição)
   - indication_reason: "Restauração antiga com [descrever problema: manchamento/infiltração/fratura marginal]"

3. **Implicações Clínicas**
   - Restaurações antigas podem mascarar o tamanho real do dente
   - Não confundir dente restaurado com "micro-dente"
   - Considerar remoção da resina antiga no planejamento

## CUIDADO COM DIAGNÓSTICOS PRECIPITADOS

⚠️ NUNCA diagnostique "micro-dente" ou "dente anômalo" se:

1. O dente apresenta FRATURA visível (incisal, proximal)
2. Há sinais de RESTAURAÇÃO antiga (linhas de interface, manchamento)
3. A proporção menor é devido a DESGASTE ou EROSÃO
4. Houve FRATURA + restauração prévia que encurtou o dente

✅ Nesses casos, indique:
- cavity_class: Classe apropriada para a restauração (IV para incisal, III para proximal)
- notes: "Fratura presente - não confundir com anomalia dental"
- notes: "Restauração antiga visível - tamanho real pode ser maior"
- treatment_indication: "resina" (reparo/reconstrução)

❌ Apenas use "micro-dente" ou "dente anômalo" se:
- O dente claramente nunca erupcionou em tamanho normal
- Não há evidência de trauma ou restauração prévia
- A forma é uniformemente pequena (não apenas encurtado)

---

Adicionalmente, identifique:
- A cor VITA geral da arcada (A1, A2, A3, A3.5, B1, B2, etc.)
- O dente que deve ser tratado primeiro (primary_tooth) baseado na prioridade clínica
- Observações sobre harmonização geral do sorriso
- INDICAÇÃO GERAL predominante do caso

=== OBSERVAÇÕES OBRIGATÓRIAS ===

Nas "observations", SEMPRE inclua:
1. **Proporção dos incisivos centrais**: Largura x Altura (ideal ~75-80%)
2. **Simetria entre homólogos**: 11 vs 21, 12 vs 22, 13 vs 23
3. **Arco do sorriso** (se lábios visíveis): consonante/plano/reverso
4. **Corredor bucal**: adequado/excessivo/ausente
5. **Desgaste incisal**: ausente/leve/moderado/severo
6. **Caracterizações naturais**: mamelons, translucidez, manchas de esmalte

Nos "warnings", inclua se houver:
- Desarmonia de proporções significativa
- Arco do sorriso reverso
- Desgaste severo sugestivo de bruxismo
- Qualquer achado que limite tratamentos conservadores

IMPORTANTE: Seja ABRANGENTE na detecção. Cada dente pode ter um tipo de tratamento diferente.
IMPORTANTE: Considere o RESULTADO ESTÉTICO FINAL, não apenas patologias isoladas.`;

    const userPrompt = `Analise esta foto e identifique TODOS os dentes que necessitam de tratamento OU que poderiam se beneficiar de melhorias estéticas.

Tipo de foto: ${data.imageType || "intraoral"}

INSTRUÇÕES OBRIGATÓRIAS - ANÁLISE COMPLETA DO SORRISO:

1. PRIMEIRO: Examine CADA quadrante (Q1, Q2, Q3, Q4) para problemas restauradores (cáries, fraturas, restaurações defeituosas)
2. SEGUNDO: Analise o sorriso como um todo para oportunidades estéticas:
   - Incisivos laterais com formato/proporção inadequada
   - Pré-molares que poderiam receber mais volume
   - Diastemas que poderiam ser fechados
   - Assimetrias que poderiam ser corrigidas
3. Liste CADA dente em um objeto SEPARADO no array detected_teeth
4. NÃO omita nenhum dente - inclua tanto problemas quanto melhorias estéticas
5. Para melhorias estéticas opcionais, use prioridade "baixa" e indique no campo notes
6. Ordene por prioridade: alta (patologias urgentes) → média (restaurações) → baixa (estética)

Use a função analyze_dental_photo para retornar a análise estruturada completa.`;

    // Tool definition for structured output - MULTI-TOOTH SUPPORT
    const tools: OpenAITool[] = [
      {
        type: "function",
        function: {
          name: "analyze_dental_photo",
          description: "Retorna a análise estruturada de uma foto dental intraoral, detectando TODOS os dentes com problemas",
          parameters: {
            type: "object",
            properties: {
              detected: {
                type: "boolean",
                description: "Se foi possível detectar pelo menos um dente com problema na foto"
              },
              confidence: {
                type: "number",
                description: "Nível de confiança geral da análise de 0 a 100"
              },
              detected_teeth: {
                type: "array",
                description: "Lista de TODOS os dentes detectados com problemas, ordenados por prioridade",
                items: {
                  type: "object",
                  properties: {
                    tooth: {
                      type: "string",
                      description: "Número do dente (notação FDI: 11-18, 21-28, 31-38, 41-48)"
                    },
                    tooth_region: {
                      type: "string",
                      enum: ["anterior-superior", "anterior-inferior", "posterior-superior", "posterior-inferior"],
                      description: "Região do dente na arcada",
                      nullable: true
                    },
                    cavity_class: {
                      type: "string",
                      enum: ["Classe I", "Classe II", "Classe III", "Classe IV", "Classe V", "Classe VI"],
                      description: "Classificação de Black da cavidade",
                      nullable: true
                    },
                    restoration_size: {
                      type: "string",
                      enum: ["Pequena", "Média", "Grande", "Extensa"],
                      description: "Tamanho estimado da restauração",
                      nullable: true
                    },
                    substrate: {
                      type: "string",
                      enum: ["Esmalte", "Dentina", "Esmalte e Dentina", "Dentina profunda"],
                      description: "Tipo de substrato principal visível",
                      nullable: true
                    },
                    substrate_condition: {
                      type: "string",
                      enum: ["Saudável", "Esclerótico", "Manchado", "Cariado", "Desidratado"],
                      description: "Condição do substrato dentário",
                      nullable: true
                    },
                    enamel_condition: {
                      type: "string",
                      enum: ["Íntegro", "Fraturado", "Hipoplásico", "Fluorose", "Erosão"],
                      description: "Condição do esmalte periférico",
                      nullable: true
                    },
                    depth: {
                      type: "string",
                      enum: ["Superficial", "Média", "Profunda"],
                      description: "Profundidade estimada da cavidade",
                      nullable: true
                    },
                    priority: {
                      type: "string",
                      enum: ["alta", "média", "baixa"],
                      description: "Prioridade de tratamento baseada na urgência clínica"
                    },
                    notes: {
                      type: "string",
                      description: "Observações específicas sobre este dente",
                      nullable: true
                    },
                    treatment_indication: {
                      type: "string",
                      enum: ["resina", "porcelana", "coroa", "implante", "endodontia", "encaminhamento"],
                      description: "Tipo de tratamento indicado: resina (restauração direta), porcelana (faceta/laminado), coroa (coroa total), implante (extração + implante), endodontia (canal), encaminhamento (especialista)"
                    },
                    indication_reason: {
                      type: "string",
                      description: "Razão detalhada da indicação de tratamento",
                      nullable: true
                    },
                    tooth_bounds: {
                      type: "object",
                      description: "Posição aproximada do dente na imagem, em porcentagem (0-100). SEMPRE forneça para o dente principal.",
                      properties: {
                        x: { type: "number", description: "Posição X do centro do dente (0-100%)" },
                        y: { type: "number", description: "Posição Y do centro do dente (0-100%)" },
                        width: { type: "number", description: "Largura aproximada do dente (0-100%)" },
                        height: { type: "number", description: "Altura aproximada do dente (0-100%)" }
                      },
                      required: ["x", "y", "width", "height"]
                    }
                  },
                  required: ["tooth", "priority", "treatment_indication"]
                }
              },
              primary_tooth: {
                type: "string",
                description: "Número do dente que deve ser tratado primeiro (mais urgente)",
                nullable: true
              },
              vita_shade: {
                type: "string",
                description: "Cor VITA geral da arcada (ex: A1, A2, A3, A3.5, B1, B2, C1, D2)",
                nullable: true
              },
              observations: {
                type: "array",
                items: { type: "string" },
                description: "Observações clínicas gerais sobre a arcada/foto"
              },
              warnings: {
                type: "array",
                items: { type: "string" },
                description: "Alertas ou pontos de atenção para o operador"
              },
              treatment_indication: {
                type: "string",
                enum: ["resina", "porcelana", "coroa", "implante", "endodontia", "encaminhamento"],
                description: "Indicação GERAL predominante do caso (o tipo de tratamento mais relevante para a maioria dos dentes)"
              },
              indication_reason: {
                type: "string",
                description: "Razão detalhada da indicação de tratamento predominante"
              }
            },
            required: ["detected", "confidence", "detected_teeth", "observations", "warnings"],
            additionalProperties: false
          }
        }
      }
    ];

    // Determine MIME type from magic bytes
    const mimeType = isJPEG ? "image/jpeg" : isPNG ? "image/png" : "image/webp";

    // Call Gemini Vision with tools
    let analysisResult: PhotoAnalysisResult | null = null;

    try {
      logger.log("Calling Gemini Vision API...");

      const result = await callGeminiVisionWithTools(
        "gemini-3-flash-preview",
        userPrompt,
        base64Image,
        mimeType,
        tools,
        {
          systemPrompt,
          temperature: 0.1,
          maxTokens: 3000,
          forceFunctionName: "analyze_dental_photo",
        }
      );

      if (result.functionCall) {
        logger.log("Successfully got analysis from Gemini");
        analysisResult = result.functionCall.args as unknown as PhotoAnalysisResult;
      } else if (result.text) {
        // Fallback: try to extract JSON from text response
        logger.log("No function call, checking text for JSON...");
        const jsonMatch = result.text.match(/```json\s*([\s\S]*?)\s*```/) || result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const jsonStr = jsonMatch[1] || jsonMatch[0];
            analysisResult = JSON.parse(jsonStr);
          } catch {
            logger.error("Failed to parse JSON from text response");
          }
        }
      }
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

    if (!analysisResult) {
      return createErrorResponse(ERROR_MESSAGES.ANALYSIS_FAILED, 500, corsHeaders);
    }

    // Ensure required fields have defaults and normalize detected_teeth
    const detectedTeeth: DetectedTooth[] = (analysisResult.detected_teeth || []).map((tooth: Partial<DetectedTooth>) => ({
      tooth: tooth.tooth || "desconhecido",
      tooth_region: tooth.tooth_region ?? null,
      cavity_class: tooth.cavity_class ?? null,
      restoration_size: tooth.restoration_size ?? null,
      substrate: tooth.substrate ?? null,
      substrate_condition: tooth.substrate_condition ?? null,
      enamel_condition: tooth.enamel_condition ?? null,
      depth: tooth.depth ?? null,
      priority: tooth.priority || "média",
      notes: tooth.notes ?? null,
      treatment_indication: tooth.treatment_indication ?? "resina",
      indication_reason: tooth.indication_reason ?? undefined,
    }));

    // Sort by priority: alta > média > baixa
    const priorityOrder = { alta: 0, média: 1, baixa: 2 };
    detectedTeeth.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    const result: PhotoAnalysisResult = {
      detected: analysisResult.detected ?? detectedTeeth.length > 0,
      confidence: analysisResult.confidence ?? 0,
      detected_teeth: detectedTeeth,
      primary_tooth: analysisResult.primary_tooth ?? (detectedTeeth.length > 0 ? detectedTeeth[0].tooth : null),
      vita_shade: analysisResult.vita_shade ?? null,
      observations: analysisResult.observations ?? [],
      warnings: analysisResult.warnings ?? [],
      treatment_indication: analysisResult.treatment_indication ?? "resina",
      indication_reason: analysisResult.indication_reason ?? undefined,
    };

    // Log detection results for debugging
    logger.log(`Multi-tooth detection complete: ${detectedTeeth.length} teeth found`);
    logger.log(`Primary tooth: ${result.primary_tooth}, Confidence: ${result.confidence}%`);

    // Add warning if multiple teeth detected
    if (detectedTeeth.length > 1) {
      result.warnings.unshift(`Detectados ${detectedTeeth.length} dentes com necessidade de tratamento. Selecione qual deseja tratar primeiro.`);
    }

    // Add warning if only 1 tooth detected with low confidence (might be missing teeth)
    if (detectedTeeth.length === 1 && result.confidence < 85) {
      result.warnings.push("Apenas 1 dente detectado. Se houver mais dentes com problema na foto, use 'Reanalisar' ou adicione manualmente.");
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: result,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    logger.error("Error analyzing photo:", error);
    return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
  }
});
