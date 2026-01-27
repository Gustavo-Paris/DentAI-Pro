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

interface AdditionalPhotos {
  smile45?: string;  // 45° smile photo for buccal corridor analysis
  face?: string;     // Full face photo for facial proportions
}

interface PatientPreferences {
  aestheticGoals?: string;
  desiredChanges?: string[];
}

interface RequestData {
  imageBase64: string;
  evaluationId?: string;
  regenerateSimulationOnly?: boolean;
  existingAnalysis?: DSDAnalysis;
  toothShape?: 'natural' | 'quadrado' | 'triangular' | 'oval' | 'retangular';
  additionalPhotos?: AdditionalPhotos;
  patientPreferences?: PatientPreferences;
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

  // Parse additional photos if provided
  let additionalPhotos: AdditionalPhotos | undefined;
  if (req.additionalPhotos && typeof req.additionalPhotos === 'object') {
    const photos = req.additionalPhotos as Record<string, unknown>;
    additionalPhotos = {
      smile45: typeof photos.smile45 === 'string' && photos.smile45 ? photos.smile45 : undefined,
      face: typeof photos.face === 'string' && photos.face ? photos.face : undefined,
    };
    if (!additionalPhotos.smile45 && !additionalPhotos.face) {
      additionalPhotos = undefined;
    }
  }

  // Parse patient preferences if provided
  let patientPreferences: PatientPreferences | undefined;
  if (req.patientPreferences && typeof req.patientPreferences === 'object') {
    const prefs = req.patientPreferences as Record<string, unknown>;
    patientPreferences = {
      aestheticGoals: typeof prefs.aestheticGoals === 'string' ? prefs.aestheticGoals : undefined,
      desiredChanges: Array.isArray(prefs.desiredChanges) ? prefs.desiredChanges : undefined,
    };
    if (!patientPreferences.aestheticGoals && !patientPreferences.desiredChanges?.length) {
      patientPreferences = undefined;
    }
  }

  return {
    success: true,
    data: {
      imageBase64: req.imageBase64,
      evaluationId: typeof req.evaluationId === "string" ? req.evaluationId : undefined,
      regenerateSimulationOnly: req.regenerateSimulationOnly === true,
      existingAnalysis: req.existingAnalysis as DSDAnalysis | undefined,
      toothShape: toothShape as RequestData['toothShape'],
      additionalPhotos,
      patientPreferences,
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
    // Only flag as limited if it's a TRUE intraoral photo (with retractor, no visible lips)
    const hasTrueIntraoralIssue = analysis.observations?.some(obs => {
      const lower = obs.toLowerCase();
      // Must have "intraoral" AND specific markers like "afastador", "sem lábio", "interna"
      return (lower.includes('afastador') || 
              (lower.includes('intraoral') && (lower.includes('interna') || lower.includes('sem lábio') || lower.includes('retrator'))) ||
              lower.includes('close-up extremo'));
    });
    
    if (hasTrueIntraoralIssue) {
      return {
        isLimited: true,
        reason: "Foto intraoral com afastador detectada. Recomenda-se foto do sorriso completo para simulação mais precisa."
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
  toothShape: string = 'natural',
  patientPreferences?: PatientPreferences
): Promise<string | null> {
  const shapeInstruction = toothShapeDescriptions[toothShape] || toothShapeDescriptions.natural;
  
  // Build patient preferences instruction for simulation
  let patientDesires = '';
  if (patientPreferences?.desiredChanges?.length) {
    const desireLabels: Record<string, string> = {
      'whiter': 'dentes mais brancos (tom A1/B1)',
      'harmonious': 'sorriso mais harmonioso e natural',
      'spacing': 'fechar espaços/diastemas',
      'alignment': 'dentes mais alinhados',
      'natural': 'formato mais natural',
      'asymmetry': 'corrigir assimetrias'
    };
    
    const desires = patientPreferences.desiredChanges
      .map(id => desireLabels[id] || id)
      .join(', ');
    
    patientDesires = `\nOBJETIVO DO PACIENTE: ${desires}.\n`;
  }
  if (patientPreferences?.aestheticGoals) {
    patientDesires += `DESCRIÇÃO DO PACIENTE: "${patientPreferences.aestheticGoals}"\n`;
  }
  
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
  
  // Check if case has old restorations that need replacement
  const needsRestorationReplacement = analysis.suggestions.some(s => {
    const issue = s.current_issue.toLowerCase();
    const change = s.proposed_change.toLowerCase();
    return issue.includes('restauração') || 
           issue.includes('restauracao') ||
           issue.includes('resina') ||
           issue.includes('manchamento') ||
           issue.includes('interface') ||
           issue.includes('infiltração') ||
           issue.includes('infiltracao') ||
           change.includes('substituir') ||
           change.includes('substituição') ||
           change.includes('substituicao') ||
           change.includes('nova restauração') ||
           change.includes('nova restauracao');
  });

  // Get list of teeth needing restoration replacement for the prompt
  let restorationTeeth = '';
  if (needsRestorationReplacement) {
    restorationTeeth = analysis.suggestions
      .filter(s => {
        const issue = s.current_issue.toLowerCase();
        return issue.includes('restauração') || 
               issue.includes('restauracao') ||
               issue.includes('resina') ||
               issue.includes('manchamento') ||
               issue.includes('interface');
      })
      .map(s => s.tooth)
      .join(', ');
  }
  
  // Check if it's a TRUE intraoral photo (simpler prompt needed)
  // Only trigger for actual intraoral photos with retractors, not smile photos with lips visible
  const isIntraoralPhoto = analysis.observations?.some(obs => {
    const lower = obs.toLowerCase();
    // Require specific intraoral markers - NOT just "intraoral detectada"
    return lower.includes('afastador') || 
           lower.includes('retrator') ||
           (lower.includes('intraoral') && (lower.includes('interna') || lower.includes('sem lábio'))) ||
           lower.includes('close-up extremo');
  });
  
  let simulationPrompt: string;
  
  if (needsReconstruction) {
    // RECONSTRUCTION PROMPT - MINIMALISTA
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
    
    const specificInstructions = teethToReconstruct.map(s => {
      const toothNum = parseInt(s.tooth);
      let contralateral = '';
      if (toothNum >= 11 && toothNum <= 18) {
        contralateral = String(toothNum + 10);
      } else if (toothNum >= 21 && toothNum <= 28) {
        contralateral = String(toothNum - 10);
      } else if (toothNum >= 31 && toothNum <= 38) {
        contralateral = String(toothNum + 10);
      } else if (toothNum >= 41 && toothNum <= 48) {
        contralateral = String(toothNum - 10);
      }
      return `Dente ${s.tooth}: COPIE do ${contralateral || 'vizinho'}`;
    }).join(', ');
    
    simulationPrompt = `TAREFA: Editar APENAS os dentes nesta foto de sorriso.

=== PRESERVAÇÃO ABSOLUTA DE LÁBIOS/PELE (CRÍTICO) ===
Os lábios e pele perioral devem ser IDÊNTICOS à foto original.
Copie EXATAMENTE: textura dos lábios, linhas de expressão, cor da pele, pelos/barba.
Qualquer diferença nos lábios = FALHA CRÍTICA.

TÉCNICA OBRIGATÓRIA:
1. Extraia a região NÃO-DENTAL como máscara fixa
2. Aplique edição APENAS na área dos dentes
3. Recomponha usando a máscara original para lábios/pele

=== DIMENSÕES E ENQUADRAMENTO (CRÍTICO) ===
- A imagem de SAÍDA deve ter EXATAMENTE as mesmas dimensões da ENTRADA
- NÃO fazer zoom, crop, pan ou qualquer alteração de enquadramento
- Todos os elementos da borda (lábios, pele) devem estar nas MESMAS posições
- Se a foto original mostra 8 dentes, a simulação DEVE mostrar os mesmos 8 dentes

REGRA ABSOLUTA #1 - ENQUADRAMENTO CONGELADO:
Trate a área NÃO-DENTAL como uma MÁSCARA fixa.
Lábios superior/inferior, gengiva, pele = COPIE da original PIXEL POR PIXEL.
Use técnica de "inpainting" APENAS na área dos DENTES.
NÃO mova, amplie ou altere o contorno da imagem.

REGRA ABSOLUTA #2 - GENGIVA PROIBIDA:
NÃO crie gengiva onde não existe na foto original.
Se a gengiva está coberta pelo lábio, ela deve CONTINUAR coberta.
Modifique apenas a gengiva que JÁ É VISÍVEL.

REGRA ABSOLUTA #3 - RECONSTRUÇÃO:
RECONSTRUA: ${specificInstructions || 'dentes danificados usando vizinhos como referência'}
IMPORTANTE: Copie o formato/tamanho EXATO do dente contralateral (espelho).
NÃO invente proporções - use os dentes vizinhos como referência direta.

COR OBRIGATÓRIA (TODOS os dentes):
- Tom uniforme A1/A2 (branco natural)
- REMOVA todas as manchas e descolorações
- Todos os dentes devem ter a MESMA cor
${patientDesires}

VERIFICAÇÃO FINAL:
[ ] Lábios IDÊNTICOS à original? (textura, linhas, cor, volume)
[ ] Pele perioral inalterada?
[ ] Dimensões da imagem idênticas?
[ ] Nenhuma gengiva nova criada?
[ ] Todos os dentes originais visíveis?
[ ] Só os dentes foram alterados?`;

  } else if (needsRestorationReplacement) {
    // RESTORATION REPLACEMENT PROMPT - CONSERVADOR (apenas cor, preservar morfologia)
    simulationPrompt = `TAREFA: Corrigir COR de restaurações antigas - NÃO alterar formato dos dentes.

=== PRESERVAÇÃO TOTAL (CRÍTICO) ===
- Lábios/pele: IDÊNTICOS (pixel por pixel)
- FORMATO dos dentes: IDÊNTICO (silhueta 100% preservada)
- TAMANHO dos dentes: IDÊNTICO (nenhuma alteração de proporção)
- POSIÇÃO dos dentes: IDÊNTICA (não mover nenhum dente)

PROIBIDO ALTERAR (TOLERÂNCIA ZERO):
- Contorno/formato de QUALQUER dente
- Bordos incisais (a silhueta da borda deve ser IDÊNTICA)
- Largura ou altura de qualquer dente
- Espaçamentos/diastemas existentes
- Pontos de contato entre dentes
- Angulação dos dentes
- "Harmonizar" ou "suavizar" a geometria

DIMENSÕES OBRIGATÓRIAS:
- SAÍDA = mesmas dimensões que ENTRADA
- NÃO fazer zoom, crop ou pan
- Bordas da imagem = IDÊNTICAS

DENTES COM RESTAURAÇÕES ANTIGAS: ${restorationTeeth || 'incisivos anteriores superiores'}

EDIÇÕES PERMITIDAS (APENAS ESTAS):
1. Remover LINHA DE INTERFACE (transição resina/esmalte) - apenas cor
2. Uniformizar COR com dentes adjacentes
3. Remover MANCHAMENTO marginal (linhas amareladas/acinzentadas)
4. Clarear para tom A1/A2 uniforme
5. Uniformizar brilho/reflexos

O que NÃO fazer (mesmo que pareça melhorar):
- NÃO altere o FORMATO da restauração ou dente
- NÃO modifique o CONTORNO do dente
- NÃO mude a PROPORÇÃO do dente
- NÃO "harmonize" bordos incisais
- NÃO feche espaços ou diastemas

TÉCNICA DE EDIÇÃO:
Aplique um "filtro de clareamento dental" que:
- Muda APENAS a cor e textura superficial dos dentes
- NÃO altera geometria ou silhueta
- Preserva micro-textura natural
- Remove apenas manchas e interfaces de cor
${patientDesires}
TESTE DE VALIDAÇÃO:
Se você sobrepor a silhueta dos dentes originais sobre a simulação,
elas devem ser IDÊNTICAS. Se não forem, a edição foi excessiva.

RESULTADO: Mesmos dentes, mesma forma, apenas cor corrigida e uniforme.`;

  } else if (isIntraoralPhoto) {
    // INTRAORAL PROMPT - CONSERVADOR (apenas cor, preservar morfologia)
    simulationPrompt = `TAREFA: RECOLORIR dentes - NÃO alterar estrutura.

=== DIMENSÕES (CRÍTICO) ===
- SAÍDA = mesmas dimensões que ENTRADA
- NÃO fazer zoom, crop ou pan

MOLDURA CONGELADA: Não altere gengiva, fundo ou estruturas não-dentais.

PROIBIDO ALTERAR (TOLERÂNCIA ZERO):
- Formato/contorno de qualquer dente
- Bordos incisais
- Tamanho ou proporção dos dentes

EDIÇÕES PERMITIDAS (APENAS):
- Uniformizar COR para A1/A2
- Remover MANCHAS de superfície
- Remover linhas de INTERFACE de restaurações antigas
- Uniformizar BRILHO/reflexos
${patientDesires}
TÉCNICA: Aplique um "filtro de clareamento" que muda apenas cor, não geometria.

Retorne a imagem com dentes mais claros, MESMA silhueta/forma.`;

  } else {
    // STANDARD PROMPT - CONSERVADOR (apenas cor, preservar morfologia dental)
    simulationPrompt = `TAREFA: RECOLORIR dentes - NÃO alterar estrutura.

=== PRESERVAÇÃO DE LÁBIOS/PELE (CRÍTICO) ===
Lábios e pele = IDÊNTICOS à foto original (pixel por pixel).
Copie EXATAMENTE: textura dos lábios, linhas de expressão, cor da pele, pelos.

=== PRESERVAÇÃO DE MORFOLOGIA DENTAL (CRÍTICO) ===
A ESTRUTURA dos dentes deve ser 100% preservada.

PROIBIDO ALTERAR (TOLERÂNCIA ZERO):
- Formato/contorno de qualquer dente
- Tamanho (largura, altura) de qualquer dente
- Bordos incisais (silhueta deve ser IDÊNTICA)
- Posição relativa dos dentes
- Pontos de contato entre dentes
- Espaçamentos/diastemas existentes
- Angulação dos dentes

ÚNICAS EDIÇÕES PERMITIDAS:
1. COR: Clarear para tom uniforme A1/A2
2. MANCHAS: Remover manchas de superfície
3. INTERFACES: Suavizar linhas de restaurações antigas (apenas cor)
4. BRILHO: Uniformizar reflexos

TÉCNICA DE EDIÇÃO:
Aplique um "filtro de clareamento dental" que:
- Muda APENAS a cor dos dentes
- NÃO altera geometria ou silhueta
- Preserva micro-textura natural
${patientDesires}
=== DIMENSÕES ===
SAÍDA = mesmas dimensões que ENTRADA
NÃO fazer zoom, crop ou pan

TESTE DE VALIDAÇÃO:
Sobreponha a silhueta original → deve ser IDÊNTICA.
Qualquer alteração de formato = resultado rejeitado.

RESULTADO: Mesmos dentes, mesma forma, apenas mais claros e uniformes.`;
  }

  const promptType = needsReconstruction ? 'reconstruction' : 
                     (needsRestorationReplacement ? 'restoration-replacement' : 
                     (isIntraoralPhoto ? 'intraoral' : 'standard'));
  
  console.log("DSD Simulation Request:", {
    promptType,
    approach: "CONSERVADOR - apenas cor, sem alteração estrutural",
    promptLength: simulationPrompt.length,
    imageDataLength: imageBase64.length,
    analysisConfidence: analysis.confidence,
    suggestionsCount: analysis.suggestions.length,
    needsRestorationReplacement,
    restorationTeeth: restorationTeeth || 'none'
  });

  // Generate 3 variations and auto-select
  const NUM_VARIATIONS = 3;
  // Prioritize flash for better framing preservation
  const modelsToTry = ["google/gemini-2.5-flash-image-preview", "google/gemini-3-pro-image-preview"];
  
  const generateSingleVariation = async (variationIndex: number): Promise<string | null> => {
    for (const model of modelsToTry) {
      try {
        console.log(`Variation ${variationIndex}: Trying ${model}`);
        
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
          console.warn(`Variation ${variationIndex} - ${model} failed:`, simulationResponse.status);
          continue;
        }

        const simData = await simulationResponse.json();
        const generatedImage = simData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!generatedImage) {
          console.warn(`Variation ${variationIndex} - No image from ${model}`);
          continue;
        }

        // Upload this variation
        const base64Data = generatedImage.replace(/^data:image\/\w+;base64,/, "");
        const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        
        const fileName = `${userId}/dsd_simulation_${Date.now()}_v${variationIndex}.png`;
        
        const { error: uploadError } = await supabase.storage
          .from("dsd-simulations")
          .upload(fileName, binaryData, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadError) {
          console.error(`Variation ${variationIndex} upload error:`, uploadError);
          return null;
        }

        console.log(`Variation ${variationIndex} generated successfully with ${model}`);
        return fileName;
      } catch (err) {
        console.warn(`Variation ${variationIndex} - ${model} error:`, err);
        continue;
      }
    }
    return null;
  };

  // Generate variations in parallel using Promise.any() to return FIRST successful
  console.log(`Generating ${NUM_VARIATIONS} DSD variations in parallel (Promise.any)...`);
  
  const variationPromises = Array(NUM_VARIATIONS).fill(null).map(async (_, i) => {
    const result = await generateSingleVariation(i);
    if (!result) throw new Error(`Variation ${i} failed`);
    return result;
  });
  
  try {
    // Return as soon as the FIRST variation succeeds (faster response)
    const firstSuccessful = await Promise.any(variationPromises);
    console.log(`DSD simulation ready (first successful variation)`);
    return firstSuccessful;
  } catch (aggregateError) {
    // All variations failed
    console.warn("All DSD simulation variations failed:", aggregateError);
    return null;
  }
}

// Analyze facial proportions
async function analyzeProportions(
  imageBase64: string,
  apiKey: string,
  corsHeaders: Record<string, string>,
  additionalPhotos?: AdditionalPhotos,
  patientPreferences?: PatientPreferences
): Promise<DSDAnalysis | Response> {
  // Build additional context based on available photos
  let additionalContext = '';
  if (additionalPhotos?.smile45) {
    additionalContext += `
FOTO ADICIONAL - SORRISO 45°:
Uma foto do sorriso em ângulo de 45 graus foi fornecida. Use-a para:
- Avaliar melhor o corredor bucal (espaço escuro lateral)
- Analisar a projeção labial e dental em perfil
- Verificar a curvatura do arco do sorriso
`;
  }
  if (additionalPhotos?.face) {
    additionalContext += `
FOTO ADICIONAL - FACE COMPLETA:
Uma foto da face completa foi fornecida. Use-a para:
- Aplicar a regra dos terços faciais com mais precisão
- Avaliar a linha média facial em relação a landmarks como nariz e queixo
- Considerar proporções faciais globais no planejamento
`;
  }

  // Build patient preferences context
  let preferencesContext = '';
  if (patientPreferences?.aestheticGoals || patientPreferences?.desiredChanges?.length) {
    preferencesContext = `

PREFERÊNCIAS DO PACIENTE:
O paciente expressou os seguintes desejos estéticos. PRIORIZE sugestões que atendam a estes objetivos quando clinicamente viável:
`;
    if (patientPreferences.aestheticGoals) {
      preferencesContext += `Objetivos descritos pelo paciente: "${patientPreferences.aestheticGoals}"
`;
    }
    if (patientPreferences.desiredChanges?.length) {
      preferencesContext += `Mudanças desejadas: ${patientPreferences.desiredChanges.join(', ')}
`;
    }
    preferencesContext += `
IMPORTANTE: Use as preferências do paciente para PRIORIZAR sugestões, mas NÃO sugira tratamentos clinicamente inadequados apenas para atender desejos. Sempre mantenha o foco em resultados conservadores e naturais.`;
  }

  const analysisPrompt = `Você é um especialista em Digital Smile Design (DSD) e Odontologia Estética.
Analise esta foto de sorriso/face do paciente e forneça uma análise detalhada das proporções faciais e dentárias.
${additionalContext}${preferencesContext}

ANÁLISE OBRIGATÓRIA:
1. **Linha Média Facial**: Determine se a linha média facial está centrada ou desviada
2. **Linha Média Dental**: Avalie se os incisivos centrais superiores estão alinhados com a linha média facial
3. **Linha do Sorriso**: Classifique a exposição gengival (alta, média, baixa)
4. **Corredor Bucal**: Avalie o espaço escuro lateral ao sorrir
5. **Plano Oclusal**: Verifique se está nivelado ou inclinado
6. **Proporção Dourada**: Calcule a conformidade com a proporção áurea (0-100%)
7. **Simetria**: Avalie a simetria geral do sorriso (0-100%)

=== DETECÇÃO CRÍTICA DE RESTAURAÇÕES EXISTENTES ===
ANTES de fazer qualquer elogio estético, você DEVE examinar CADA dente visível para sinais de restaurações prévias.

SINAIS DE RESTAURAÇÕES DE RESINA (procure atentamente):
- Interface visível (linha onde a resina encontra o esmalte natural)
- Diferença de cor/translucidez DENTRO do mesmo dente
- Manchamento marginal (linha amarelada/acinzentada na borda da restauração)
- Textura diferente entre superfícies (áreas mais lisas ou mais opacas)
- Contorno artificial ou excessivamente uniforme
- Perda de polimento em partes do dente
- Cor mais opaca/artificial comparada a dentes adjacentes naturais

DIFERENCIAÇÃO CRÍTICA:
- Dente NATURAL saudável: gradiente de cor cervical→incisal, translucidez uniforme, micro-textura orgânica
- Dente com RESINA: cor mais uniforme/artificial, interface visível, possível manchamento marginal

REGRAS PARA RESTAURAÇÕES DETECTADAS:
1. NÃO diga "excelente resultado estético" se restaurações com defeitos estão presentes
2. NÃO elogie "translucidez natural" em dentes claramente restaurados
3. IDENTIFIQUE cada dente restaurado com problema específico
4. PRIORIZE sugestão de "Substituição de restauração" sobre mudanças cosméticas sutis

TIPOS DE PROBLEMAS EM RESTAURAÇÕES ANTIGAS:
- "Restauração com manchamento marginal"
- "Interface visível entre resina e esmalte"
- "Restauração com cor inadequada"
- "Restauração com perda de anatomia"
- "Restauração classe IV com contorno artificial"
- "Restauração com perda de polimento"

OBSERVAÇÃO OBRIGATÓRIA:
Se detectar restaurações com problemas, DEVE incluir nas observações:
"ATENÇÃO: Restauração(ões) de resina detectada(s) em [dentes]. Apresentam [problema]. Recomenda-se substituição."

=== AVALIAÇÃO DE VIABILIDADE DO DSD ===
Antes de sugerir tratamentos, avalie se o caso É ADEQUADO para simulação visual:

CASOS INADEQUADOS PARA DSD (marque confidence = "baixa" e adicione observação):
- Dentes ausentes que requerem implante → Adicione: "ATENÇÃO: Dente(s) ausente(s) detectado(s). Caso requer tratamento cirúrgico antes do planejamento estético."
- Destruição coronária > 50% que requer coroa/extração → Adicione: "ATENÇÃO: Destruição dental severa. Recomenda-se tratamento protético prévio."
- Raízes residuais → Adicione: "ATENÇÃO: Raiz residual identificada. Extração necessária antes do planejamento."
- Foto INTRAORAL VERDADEIRA (com afastador de lábio, APENAS gengiva e dentes internos visíveis, SEM lábios externos) → Adicione: "ATENÇÃO: Foto intraoral com afastador detectada. Simulação limitada sem proporções faciais."

DEFINIÇÃO DE TIPOS DE FOTO - IMPORTANTE:
- FOTO INTRAORAL: Close-up INTERNO da boca (afastador de lábio presente, apenas gengiva/dentes visíveis, SEM lábios externos)
- FOTO DE SORRISO: Qualquer foto que mostre os LÁBIOS (superior e inferior), mesmo sem olhos/nariz visíveis - É ADEQUADA para DSD
- FOTO FACIAL COMPLETA: Face inteira com olhos, nariz, boca visíveis

REGRA CRÍTICA:
Se a foto mostra LÁBIOS (superior e inferior), barba/pele perioral, e dentes durante o sorriso → NÃO é intraoral!
Foto de sorriso parcial (com lábios visíveis, sem olhos) ainda é ADEQUADA para análise DSD.
Use confidence="média" ou "alta" para fotos de sorriso com lábios.
APENAS use confidence="baixa" por tipo de foto se for uma foto INTRAORAL VERDADEIRA (com afastador, sem lábios externos).

=== SUGESTÕES - PRIORIDADE DE TRATAMENTOS ===
PRIORIDADE 1: Restaurações com infiltração/manchamento (saúde bucal)
PRIORIDADE 2: Restaurações com cor/anatomia inadequada (estética funcional)
PRIORIDADE 3: Melhorias em dentes naturais (refinamento estético)

TIPOS DE SUGESTÕES PERMITIDAS:

A) SUBSTITUIÇÃO DE RESTAURAÇÃO (prioridade alta):
   - current_issue: "Restauração classe IV com manchamento marginal e interface visível"
   - proposed_change: "Substituir por nova restauração com melhor adaptação de cor e contorno"

B) TRATAMENTO CONSERVADOR (para dentes naturais sem restauração):
   - current_issue: "Bordo incisal irregular"
   - proposed_change: "Aumentar 1mm com lente de contato"

LIMITES PARA SUGESTÕES:
- MÁXIMO de 1-2mm de extensão incisal por dente
- Fechamento de diastemas de até 2mm por lado
- Harmonização SUTIL de contorno (não transformações)
- NÃO sugira clareamento extremo ou cor artificial

REGRAS ESTRITAS:
✅ PERMITIDO: identificar e sugerir substituição de restaurações antigas
✅ PERMITIDO: aumentar levemente comprimento, fechar pequenos espaços, harmonizar contorno
❌ PROIBIDO: elogiar restaurações que claramente têm problemas
❌ PROIBIDO: ignorar diferenças de cor/textura entre áreas do dente
❌ PROIBIDO: dizer "excelente resultado" se restaurações antigas com defeitos estão presentes
❌ PROIBIDO: focar em melhorias sutis quando restaurações precisam ser substituídas
❌ PROIBIDO: diminuir, encurtar, mudanças dramáticas de forma
❌ PROIBIDO: sugerir "dentes brancos", "clareamento Hollywood" ou cor artificial
❌ PROIBIDO: sugerir mais de 3-4 dentes por arcada (foque nos essenciais)
❌ PROIBIDO: sugerir tratamentos para dentes AUSENTES ou com destruição severa

Exemplo BOM (substituição): "Restauração classe IV do 11 com interface visível" → "Substituir por nova restauração com melhor adaptação"
Exemplo BOM (conservador): "Aumentar bordo incisal do 21 em 1mm para harmonizar altura com 11"
Exemplo RUIM: "Excelente translucidez natural" em dente com restauração visível - NÃO USAR

FILOSOFIA: Primeiro identifique problemas em restaurações existentes, depois considere melhorias em dentes naturais.

OBSERVAÇÕES:
Inclua 2-3 observações clínicas objetivas sobre o sorriso.
Se detectar restaurações com problemas, PRIORIZE alertar sobre elas.
Se identificar limitações para simulação, inclua uma observação com "ATENÇÃO:" explicando.

IMPORTANTE:
- Seja CRÍTICO ao avaliar restaurações existentes
- Priorize identificar problemas em trabalhos anteriores
- TODAS as sugestões devem ser clinicamente realizáveis
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

    const { imageBase64, evaluationId, regenerateSimulationOnly, existingAnalysis, toothShape, additionalPhotos, patientPreferences } = validation.data;

    // Log if additional photos or preferences were provided
    if (additionalPhotos) {
      console.log(`DSD analysis with additional photos: smile45=${!!additionalPhotos.smile45}, face=${!!additionalPhotos.face}`);
    }
    if (patientPreferences) {
      console.log(`DSD analysis with patient preferences: goals=${!!patientPreferences.aestheticGoals}, changes=${patientPreferences.desiredChanges?.length || 0}`);
    }

    let analysis: DSDAnalysis;

    // If regenerating simulation only, use existing analysis
    if (regenerateSimulationOnly && existingAnalysis) {
      analysis = existingAnalysis;
    } else {
      // Run full analysis - pass additional photos and preferences for context enrichment
      const analysisResult = await analyzeProportions(imageBase64, LOVABLE_API_KEY, corsHeaders, additionalPhotos, patientPreferences);
      
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
      simulationUrl = await generateSimulation(imageBase64, analysis, user.id, supabase, LOVABLE_API_KEY, toothShape || 'natural', patientPreferences);
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
