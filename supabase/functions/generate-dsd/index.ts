import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreFlight, createErrorResponse, ERROR_MESSAGES } from "../_shared/cors.ts";

// DSD Analysis interface
interface DSDAnalysis {
  facial_midline: "centrada" | "desviada_esquerda" | "desviada_direita";
  dental_midline: "alinhada" | "desviada_esquerda" | "desviada_direita";
  smile_line: "alta" | "média" | "baixa";
  buccal_corridor: "adequado" | "excessivo" | "ausente";
  occlusal_plane: "nivelado" | "inclinado_esquerda" | "inclinado_direita";
  golden_ratio_compliance: number;
  symmetry_score: number;
  suggestions: {
    tooth: string;
    current_issue: string;
    proposed_change: string;
  }[];
  observations: string[];
  confidence: "alta" | "média" | "baixa";
  simulation_limitation?: string; // New: explains why simulation may be limited
}

interface DSDResult {
  analysis: DSDAnalysis;
  simulation_url: string | null;
  simulation_note?: string; // New: message when simulation is not possible
}

interface RequestData {
  imageBase64: string;
  evaluationId?: string;
  regenerateSimulationOnly?: boolean;
  existingAnalysis?: DSDAnalysis;
  toothShape?: 'natural' | 'quadrado' | 'triangular' | 'oval' | 'retangular';
}

// Validate request
function validateRequest(data: unknown): { success: boolean; error?: string; data?: RequestData } {
  if (!data || typeof data !== "object") {
    return { success: false, error: "Dados inválidos" };
  }

  const req = data as Record<string, unknown>;

  if (!req.imageBase64 || typeof req.imageBase64 !== "string") {
    return { success: false, error: "Imagem não fornecida" };
  }

  // Validate base64 format
  const base64Pattern = /^data:image\/(jpeg|jpg|png|webp);base64,/;
  if (!base64Pattern.test(req.imageBase64)) {
    return { success: false, error: ERROR_MESSAGES.IMAGE_FORMAT_UNSUPPORTED };
  }

  const validShapes = ['natural', 'quadrado', 'triangular', 'oval', 'retangular'];
  const toothShape = validShapes.includes(req.toothShape as string) ? req.toothShape as string : 'natural';

  return {
    success: true,
    data: {
      imageBase64: req.imageBase64,
      evaluationId: typeof req.evaluationId === "string" ? req.evaluationId : undefined,
      regenerateSimulationOnly: req.regenerateSimulationOnly === true,
      existingAnalysis: req.existingAnalysis as DSDAnalysis | undefined,
      toothShape: toothShape as RequestData['toothShape'],
    },
  };
}

// Tooth shape descriptions for simulation prompt
const toothShapeDescriptions: Record<string, string> = {
  natural: "Manter as características individuais naturais de cada dente do paciente",
  quadrado: "Bordas incisais retas e paralelas, ângulos bem definidos, proporção largura/altura equilibrada",
  triangular: "Convergência gradual em direção à cervical, bordas incisais mais largas que a região cervical",
  oval: "Contornos arredondados e suaves, transições sem ângulos marcados, formato elíptico",
  retangular: "Proporção altura/largura mais alongada, bordas verticais mais paralelas",
};

// Check if case has severe destruction that limits DSD
function hasSevereDestruction(analysis: DSDAnalysis): { isLimited: boolean; reason: string | null } {
  const destructionKeywords = [
    'ausente', 'destruição', 'raiz residual', 'implante', 'extração',
    'fratura extensa', 'destruído', 'coroa total', 'prótese', 'sem coroa'
  ];
  
  const hasDestructionInSuggestions = analysis.suggestions.some(s => 
    destructionKeywords.some(keyword => 
      s.current_issue.toLowerCase().includes(keyword) ||
      s.proposed_change.toLowerCase().includes(keyword)
    )
  );
  
  const hasDestructionInObservations = analysis.observations?.some(obs =>
    destructionKeywords.some(keyword => obs.toLowerCase().includes(keyword))
  );
  
  if (hasDestructionInSuggestions || hasDestructionInObservations) {
    return {
      isLimited: true,
      reason: "Caso apresenta destruição dental significativa (dente ausente, fratura extensa ou necessidade de implante/coroa). A simulação visual pode não representar o resultado final com precisão."
    };
  }
  
  // Check if confidence is low due to photo quality or case complexity
  if (analysis.confidence === 'baixa') {
    const hasComplexityNote = analysis.observations?.some(obs =>
      obs.toLowerCase().includes('intraoral') ||
      obs.toLowerCase().includes('close-up') ||
      obs.toLowerCase().includes('complexo') ||
      obs.toLowerCase().includes('limitad')
    );
    
    if (hasComplexityNote) {
      return {
        isLimited: true,
        reason: "Foto intraoral ou caso complexo detectado. Recomenda-se foto do sorriso completo para simulação mais precisa."
      };
    }
  }
  
  return { isLimited: false, reason: null };
}

// Generate simulation image with retry logic
async function generateSimulation(
  imageBase64: string,
  analysis: DSDAnalysis,
  userId: string,
  supabase: any,
  apiKey: string,
  toothShape: string = 'natural'
): Promise<string | null> {
  const shapeInstruction = toothShapeDescriptions[toothShape] || toothShapeDescriptions.natural;
  
  // Check if case needs reconstruction (missing/destroyed teeth)
  const needsReconstruction = analysis.suggestions.some(s => {
    const issue = s.current_issue.toLowerCase();
    const change = s.proposed_change.toLowerCase();
    return issue.includes('ausente') || 
           issue.includes('destruição') || 
           issue.includes('destruído') ||
           issue.includes('fratura') ||
           issue.includes('raiz residual') ||
           change.includes('implante') ||
           change.includes('coroa total') ||
           change.includes('extração');
  });
  
  // Check if it's an intraoral photo (simpler prompt needed)
  const isIntraoralPhoto = analysis.observations?.some(obs => 
    obs.toLowerCase().includes('intraoral') || 
    obs.toLowerCase().includes('close-up') ||
    obs.toLowerCase().includes('aproximada')
  );
  
  let simulationPrompt: string;
  
  if (needsReconstruction) {
    // RECONSTRUCTION PROMPT: For cases with missing/destroyed teeth
    // This creates a visualization of the POST-TREATMENT result
    
    // Extract teeth that need reconstruction
    const teethToReconstruct = analysis.suggestions
      .filter(s => {
        const issue = s.current_issue.toLowerCase();
        const change = s.proposed_change.toLowerCase();
        return issue.includes('ausente') || 
               issue.includes('destruição') || 
               issue.includes('destruído') ||
               issue.includes('fratura') ||
               issue.includes('raiz') ||
               change.includes('implante') ||
               change.includes('coroa');
      });
    
    // Generate specific instructions with contralateral reference
    const specificInstructions = teethToReconstruct.map(s => {
      const toothNum = parseInt(s.tooth);
      let contralateral = '';
      // Calculate contralateral tooth (11 <-> 21, 12 <-> 22, etc)
      if (toothNum >= 11 && toothNum <= 18) {
        contralateral = String(toothNum + 10);
      } else if (toothNum >= 21 && toothNum <= 28) {
        contralateral = String(toothNum - 10);
      } else if (toothNum >= 31 && toothNum <= 38) {
        contralateral = String(toothNum + 10);
      } else if (toothNum >= 41 && toothNum <= 48) {
        contralateral = String(toothNum - 10);
      }
      return `- Dente ${s.tooth}: COPIE formato, tamanho e cor do dente ${contralateral || 'vizinho'} (espelhado)`;
    }).join('\n');
    
    simulationPrompt = `VOCÊ É UM EDITOR DE FOTOS ODONTOLÓGICAS ESPECIALISTA.

TAREFA: Reconstruir digitalmente os dentes ausentes/danificados para mostrar o resultado pós-tratamento.

DENTES A RECONSTRUIR:
${specificInstructions || '- Reconstruir dentes danificados usando vizinhos como referência'}

INSTRUÇÕES TÉCNICAS DE RECONSTRUÇÃO:

1. PROPORÇÃO OBRIGATÓRIA (Lei da Proporção Dental):
   - Incisivo central: Largura = 75-80% da altura
   - Use o dente CONTRALATERAL (do lado oposto) como referência EXATA
   - Se reconstruindo o 11, COPIE as dimensões do 21 (espelhado)
   - Mantenha simetria bilateral PERFEITA

2. COR E TEXTURA OBRIGATÓRIA:
   - COPIE EXATAMENTE a cor do dente vizinho mais próximo
   - NÃO adicione manchas, estrias, marcas ou descolorações
   - Mantenha uniformidade de cor com os dentes existentes
   - Aplique LEVE translucidez apenas no terço incisal (borda)
   - Resultado deve ser LIMPO e NATURAL

3. FORMATO ${toothShape.toUpperCase()}:
   ${shapeInstruction}
   - Bordas incisais definidas e naturais
   - Ângulos correspondentes ao formato selecionado
   - Transição suave com a gengiva

4. POSICIONAMENTO PRECISO:
   - Alinhe a borda incisal EXATAMENTE com os dentes vizinhos
   - Respeite a linha do sorriso existente
   - Centralize o dente no espaço disponível
   - Mantenha o arco dental natural

REGRAS ABSOLUTAS (NUNCA VIOLE):
❌ NÃO adicione manchas, estrias ou descolorações
❌ NÃO crie texturas artificiais ou estranhas
❌ NÃO altere a posição dos lábios
❌ NÃO modifique a gengiva além do necessário
❌ NÃO deixe o dente com cor diferente dos vizinhos
✅ COPIE a cor EXATA dos dentes vizinhos
✅ USE proporções SIMÉTRICAS com dente contralateral
✅ MANTENHA aparência LIMPA, NATURAL e PROFISSIONAL
✅ CRIE um dente que pareça REAL, não artificial

RESULTADO ESPERADO:
Uma foto realista mostrando o sorriso COMPLETO e HARMONIOSO após o tratamento.
O dente reconstruído deve ser INDISTINGUÍVEL dos dentes naturais do paciente.`;
  } else if (isIntraoralPhoto) {
    // INTRAORAL PROMPT: Simplified for close-up photos
    simulationPrompt = `TAREFA: Melhore sutilmente os dentes EXISTENTES nesta foto.

EDIÇÕES PERMITIDAS nos dentes VISÍVEIS:
- Harmonizar contorno levemente
- Melhorar proporção sutil
- Suavizar bordas incisais

Formato desejado: ${toothShape.toUpperCase()} - ${shapeInstruction}

PRESERVE: gengiva, fundo, estruturas não-dentais.

Retorne a imagem editada com dentes harmonizados.`;
  } else {
    // STANDARD PROMPT: For normal smile photos with minor adjustments
    simulationPrompt = `TAREFA: Editar APENAS os dentes visíveis nesta foto de sorriso.

REGRA ABSOLUTA #1 - MOLDURA INTOCÁVEL:
Copie a foto original PIXEL POR PIXEL para lábios, pele, fundo.
A única diferença permitida são os dentes.

REGRA ABSOLUTA #2 - LÁBIOS FIXOS:
Os lábios devem estar na posição IDÊNTICA à original.
NÃO levante, mova ou altere o contorno labial.

REGRA ABSOLUTA #3 - GENGIVA ORIGINAL:
NÃO crie gengiva onde não existe na foto original.
Modifique apenas a gengiva que JÁ É VISÍVEL.

FORMATO DOS DENTES - ${toothShape.toUpperCase()}:
${shapeInstruction}
Aplique este formato de forma sutil e harmônica, mantendo naturalidade.

EDIÇÕES PERMITIDAS NOS DENTES:
${analysis.suggestions.slice(0, 4).map((s) => `- ${s.tooth}: ${s.proposed_change}`).join("\n")}

VERIFICAÇÃO FINAL:
- Lábios na mesma posição? ✓
- Nenhuma gengiva nova criada? ✓
- Só os dentes foram alterados? ✓`;
  }

  console.log("DSD Simulation - Prompt length:", simulationPrompt.length, "Reconstruction:", needsReconstruction, "Intraoral:", isIntraoralPhoto);

  // Models to try in order (prioritize best model for reconstruction)
  const modelsToTry = [
    "google/gemini-3-pro-image-preview",
    "google/gemini-2.5-flash", // Fallback
  ];

  for (const model of modelsToTry) {
    try {
      console.log(`Trying simulation model: ${model}`);
      
      const simulationResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: simulationPrompt },
                { type: "image_url", image_url: { url: imageBase64 } },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!simulationResponse.ok) {
        console.warn(`Simulation model ${model} failed:`, simulationResponse.status);
        continue; // Try next model
      }

      const simData = await simulationResponse.json();
      const generatedImage = simData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!generatedImage) {
        console.warn(`No image in response from ${model}`);
        continue; // Try next model
      }

      // Upload simulation to storage
      const base64Data = generatedImage.replace(/^data:image\/\w+;base64,/, "");
      const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      
      const fileName = `${userId}/dsd_simulation_${Date.now()}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from("dsd-simulations")
        .upload(fileName, binaryData, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return null;
      }

      console.log(`Simulation generated successfully with ${model}`);
      return fileName;
    } catch (err) {
      console.warn(`Model ${model} error:`, err);
      continue; // Try next model
    }
  }

  console.warn("All simulation models failed");
  return null;
}

// Analyze facial proportions
async function analyzeProportions(
  imageBase64: string,
  apiKey: string,
  corsHeaders: Record<string, string>
): Promise<DSDAnalysis | Response> {
  const analysisPrompt = `Você é um especialista em Digital Smile Design (DSD) e Odontologia Estética.
Analise esta foto de sorriso/face do paciente e forneça uma análise detalhada das proporções faciais e dentárias.

ANÁLISE OBRIGATÓRIA:
1. **Linha Média Facial**: Determine se a linha média facial está centrada ou desviada
2. **Linha Média Dental**: Avalie se os incisivos centrais superiores estão alinhados com a linha média facial
3. **Linha do Sorriso**: Classifique a exposição gengival (alta, média, baixa)
4. **Corredor Bucal**: Avalie o espaço escuro lateral ao sorrir
5. **Plano Oclusal**: Verifique se está nivelado ou inclinado
6. **Proporção Dourada**: Calcule a conformidade com a proporção áurea (0-100%)
7. **Simetria**: Avalie a simetria geral do sorriso (0-100%)

AVALIAÇÃO DE VIABILIDADE DO DSD:
Antes de sugerir tratamentos, avalie se o caso É ADEQUADO para simulação visual:

CASOS INADEQUADOS PARA DSD (marque confidence = "baixa" e adicione observação):
- Dentes ausentes que requerem implante → Adicione: "ATENÇÃO: Dente(s) ausente(s) detectado(s). Caso requer tratamento cirúrgico antes do planejamento estético."
- Destruição coronária > 50% que requer coroa/extração → Adicione: "ATENÇÃO: Destruição dental severa. Recomenda-se tratamento protético prévio."
- Raízes residuais → Adicione: "ATENÇÃO: Raiz residual identificada. Extração necessária antes do planejamento."
- Foto intraoral/close-up sem contexto facial → Adicione: "ATENÇÃO: Foto intraoral detectada. Simulação limitada sem proporções faciais."

SUGESTÕES - APENAS TRATAMENTOS CONSERVADORES COM LENTES DE CONTATO:
Para cada dente que poderia ser melhorado, forneça APENAS mudanças MÍNIMAS possíveis com lentes de contato dental:
- Número do dente (notação universal: 11-48)
- Problema atual identificado (seja específico e objetivo)
- Mudança proposta (CONSERVADORA e ADITIVA apenas)

LIMITES PARA SUGESTÕES:
- MÁXIMO de 1-2mm de extensão incisal por dente
- Fechamento de diastemas de até 2mm por lado
- Harmonização SUTIL de contorno (não transformações)
- NÃO sugira clareamento extremo ou cor artificial

REGRAS ESTRITAS:
✅ PERMITIDO: aumentar levemente comprimento, fechar pequenos espaços, harmonizar contorno
❌ PROIBIDO: diminuir, encurtar, mudanças dramáticas de forma
❌ PROIBIDO: sugerir "dentes brancos", "clareamento Hollywood" ou cor artificial
❌ PROIBIDO: sugerir mais de 3-4 dentes por arcada (foque nos essenciais)
❌ PROIBIDO: sugerir tratamentos para dentes AUSENTES ou com destruição severa

Exemplo BOM: "Aumentar bordo incisal do 21 em 1mm para harmonizar altura com 11"
Exemplo BOM: "Fechar diastema de 1mm entre 11 e 21 com adição em mesial de ambos"
Exemplo RUIM: "Clarear todos os dentes para tom mais branco" - NÃO USAR
Exemplo RUIM: "Reconstruir dente ausente" - NÃO USAR

FILOSOFIA: MENOS É MAIS. Sugira apenas o ESSENCIAL para harmonização natural.

OBSERVAÇÕES:
Inclua 2-3 observações clínicas objetivas sobre o sorriso.
Se identificar limitações para simulação, inclua uma observação com "ATENÇÃO:" explicando.

IMPORTANTE:
- Seja CONSERVADOR nas sugestões
- Priorize naturalidade sobre perfeição
- Considere proporção dourada como GUIA, não como meta absoluta
- TODAS as sugestões devem ser clinicamente realizáveis com lentes de contato (0.3-0.5mm espessura)
- Se o caso NÃO for adequado para DSD, AINDA forneça a análise de proporções mas marque confidence="baixa"`;

  const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: analysisPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Analise esta foto e retorne a análise DSD completa usando a ferramenta analyze_dsd." },
            { type: "image_url", image_url: { url: imageBase64 } },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "analyze_dsd",
            description: "Retorna a análise completa do Digital Smile Design",
            parameters: {
              type: "object",
              properties: {
                facial_midline: {
                  type: "string",
                  enum: ["centrada", "desviada_esquerda", "desviada_direita"],
                },
                dental_midline: {
                  type: "string",
                  enum: ["alinhada", "desviada_esquerda", "desviada_direita"],
                },
                smile_line: {
                  type: "string",
                  enum: ["alta", "média", "baixa"],
                },
                buccal_corridor: {
                  type: "string",
                  enum: ["adequado", "excessivo", "ausente"],
                },
                occlusal_plane: {
                  type: "string",
                  enum: ["nivelado", "inclinado_esquerda", "inclinado_direita"],
                },
                golden_ratio_compliance: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                },
                symmetry_score: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                },
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      tooth: { type: "string" },
                      current_issue: { type: "string" },
                      proposed_change: { type: "string" },
                    },
                    required: ["tooth", "current_issue", "proposed_change"],
                  },
                },
                observations: {
                  type: "array",
                  items: { type: "string" },
                },
                confidence: {
                  type: "string",
                  enum: ["alta", "média", "baixa"],
                },
              },
              required: [
                "facial_midline",
                "dental_midline",
                "smile_line",
                "buccal_corridor",
                "occlusal_plane",
                "golden_ratio_compliance",
                "symmetry_score",
                "suggestions",
                "observations",
                "confidence",
              ],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "analyze_dsd" } },
    }),
  });

  if (!analysisResponse.ok) {
    const status = analysisResponse.status;
    if (status === 429) {
      return createErrorResponse(ERROR_MESSAGES.RATE_LIMITED, 429, corsHeaders, "RATE_LIMITED");
    }
    if (status === 402) {
      return createErrorResponse(ERROR_MESSAGES.PAYMENT_REQUIRED, 402, corsHeaders, "PAYMENT_REQUIRED");
    }
    console.error("AI analysis error:", status, await analysisResponse.text());
    return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
  }

  const analysisData = await analysisResponse.json();
  const toolCall = analysisData.choices?.[0]?.message?.tool_calls?.[0];

  if (toolCall?.function?.arguments) {
    try {
      return JSON.parse(toolCall.function.arguments) as DSDAnalysis;
    } catch {
      console.error("Failed to parse tool call arguments");
      return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
    }
  }

  console.error("No tool call in response");
  return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
}

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreFlight(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    // Get API keys
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing required environment variables");
      return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
    }

    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401, corsHeaders);
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Validate user token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return createErrorResponse(ERROR_MESSAGES.INVALID_TOKEN, 401, corsHeaders);
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = validateRequest(body);

    if (!validation.success || !validation.data) {
      return createErrorResponse(validation.error || ERROR_MESSAGES.INVALID_REQUEST, 400, corsHeaders);
    }

    const { imageBase64, evaluationId, regenerateSimulationOnly, existingAnalysis, toothShape } = validation.data;

    let analysis: DSDAnalysis;

    // If regenerating simulation only, use existing analysis
    if (regenerateSimulationOnly && existingAnalysis) {
      analysis = existingAnalysis;
    } else {
      // Run full analysis
      const analysisResult = await analyzeProportions(imageBase64, LOVABLE_API_KEY, corsHeaders);
      
      // Check if it's an error response
      if (analysisResult instanceof Response) {
        return analysisResult;
      }
      
      analysis = analysisResult;
    }

    // Check for severe destruction that limits simulation value
    const destructionCheck = hasSevereDestruction(analysis);
    let simulationNote: string | undefined;
    
    if (destructionCheck.isLimited) {
      console.log("Severe destruction detected:", destructionCheck.reason);
      simulationNote = destructionCheck.reason || undefined;
    }

    // Generate simulation image
    let simulationUrl: string | null = null;
    try {
      simulationUrl = await generateSimulation(imageBase64, analysis, user.id, supabase, LOVABLE_API_KEY, toothShape || 'natural');
    } catch (simError) {
      console.error("Simulation error:", simError);
      // Continue without simulation - analysis is still valid
    }

    // Update evaluation if provided
    if (evaluationId) {
      const { data: evalData, error: evalError } = await supabase
        .from("evaluations")
        .select("user_id")
        .eq("id", evaluationId)
        .single();

      if (!evalError && evalData && evalData.user_id === user.id) {
        await supabase
          .from("evaluations")
          .update({
            dsd_analysis: analysis,
            dsd_simulation_url: simulationUrl,
          })
          .eq("id", evaluationId);
      }
    }

    // Return result with note if applicable
    const result: DSDResult = {
      analysis,
      simulation_url: simulationUrl,
      simulation_note: simulationNote,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("DSD generation error:", error);
    return createErrorResponse(ERROR_MESSAGES.PROCESSING_ERROR, 500, corsHeaders);
  }
});
