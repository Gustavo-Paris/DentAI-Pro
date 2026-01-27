

# Plano: Garantir Preservacao Absoluta no DSD (Labios, Pele, Enquadramento)

## Problema Identificado

Ao comparar "Antes" e "Simulacao DSD" nos screenshots fornecidos:
- **Labios**: Formato diferente, textura mudou
- **Pele**: Iluminacao e textura diferentes
- **Enquadramento**: Angulo levemente diferente
- **Dentes**: Ficaram mais brancos, mas parecem de outra pessoa

Isso torna a simulacao clinicamente inutil, pois o paciente nao se reconhece.

## Causa Raiz

Mesmo com prompts de preservacao, os modelos generativos (Gemini Flash/Pro Image) tendem a "re-imaginar" a foto inteira quando instruidos a fazer muitas coisas. O modelo nao consegue separar "editar apenas dentes" de "gerar uma foto nova com dentes diferentes".

## Solucao Proposta: Abordagem Hibrida com Mascara de Dentes

A unica forma de garantir preservacao **absoluta** e:
1. Detectar a regiao dos dentes na imagem original
2. Gerar a simulacao com foco apenas na area dental
3. **Copiar os pixels originais** para tudo FORA da regiao dos dentes
4. Fundir a simulacao apenas na area dos dentes

### Fluxo Tecnico

```text
IMAGEM ORIGINAL
      |
      v
[1. DETECTAR MASCARA DOS DENTES]
   - Usar modelo de visao para obter coordenadas/poligono dos dentes
      |
      v
[2. GERAR SIMULACAO NORMAL]
   - Usar Gemini Image como hoje
   - Prompt focado em mudancas dentais
      |
      v
[3. FUSAO COM MASCARA]
   - Manter pixels originais FORA da mascara de dentes
   - Aplicar simulacao APENAS dentro da mascara
   - Blend suave nas bordas para transicao natural
      |
      v
IMAGEM FINAL
(Labios/pele identicos + dentes clareados)
```

## Implementacao Tecnica

### Arquivo: supabase/functions/generate-dsd/index.ts

#### Fase 1: Obter Mascara de Dentes

Adicionar funcao para detectar a regiao exata dos dentes antes da simulacao.

```typescript
async function getTeethMask(
  imageBase64: string,
  apiKey: string
): Promise<{ mask: number[][]; bounds: { x: number; y: number; width: number; height: number } }> {
  // Usar modelo de visao para detectar coordenadas dos dentes
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{
        role: "user",
        content: [
          { 
            type: "text", 
            text: `Analyze this smile photo and return the EXACT bounding box coordinates of all visible teeth as a single region.
            
Return JSON with:
{
  "bounds": {
    "x": <left edge as % of image width, 0-100>,
    "y": <top edge as % of image height, 0-100>,
    "width": <width as % of image width>,
    "height": <height as % of image height>
  }
}

Focus ONLY on the teeth area - do not include lips or gums in the bounding box.
The bounding box should tightly encompass ALL visible teeth.`
          },
          { type: "image_url", image_url: { url: imageBase64 } },
        ],
      }],
    }),
  });
  
  // Parse response and extract bounds
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error("Could not detect teeth region");
}
```

#### Fase 2: Gerar Simulacao com Foco na Area Dental

Modificar o prompt para ser AINDA mais especifico sobre a area dos dentes:

```typescript
simulationPrompt = `EDIT THIS IMAGE: Change ONLY the teeth.

TEETH CHANGES ALLOWED:
- Whiten to shade A1/A2
- Remove stains and discoloration
- Blend restoration interface lines
- Subtle shape harmonization of asymmetric laterals
- Close small gaps (up to 2mm)
${patientDesires}

ABSOLUTE PRESERVATION (NON-NEGOTIABLE):
- Every pixel OUTSIDE the teeth must be IDENTICAL to the input
- Lips: exact same shape, color, texture, wrinkles
- Skin: exact same tone, pores, lighting
- Gums: no changes
- Photo framing: exact same dimensions and crop

The ONLY pixels that should change are within the teeth area.
Output image must have IDENTICAL dimensions to input.`;
```

#### Fase 3: Fusao com Mascara (Pos-Processamento)

Adicionar funcao de fusao que aplica a simulacao apenas na regiao dos dentes:

```typescript
async function blendWithOriginal(
  originalBase64: string,
  simulationBase64: string,
  teethBounds: { x: number; y: number; width: number; height: number },
  apiKey: string
): Promise<string> {
  // Usar o modelo de imagem para fazer a fusao precisa
  const blendPrompt = `You have two images:
1. ORIGINAL: The patient's unedited smile photo
2. SIMULATION: A version with whitened/improved teeth

Your task: Create a BLEND where:
- OUTSIDE the teeth region (${teethBounds.x}% to ${teethBounds.x + teethBounds.width}% horizontally, 
  ${teethBounds.y}% to ${teethBounds.y + teethBounds.height}% vertically):
  Use ONLY pixels from ORIGINAL - lips, skin, gums must be pixel-perfect from original
  
- INSIDE the teeth region:
  Use the improved teeth from SIMULATION
  
- At the BOUNDARY:
  Create a smooth 2-3 pixel gradient transition so there's no visible seam

The result should look like the original photo with ONLY the teeth improved.
Lips, skin, background must be IDENTICAL to original.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image-preview",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: blendPrompt },
          { type: "image_url", image_url: { url: originalBase64 } },
          { type: "image_url", image_url: { url: simulationBase64 } },
        ],
      }],
      modalities: ["image", "text"],
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.images?.[0]?.image_url?.url || simulationBase64;
}
```

#### Fase 4: Integrar no Fluxo Principal

Modificar a funcao `generateSimulation` para usar o novo fluxo:

```typescript
async function generateSimulation(
  imageBase64: string,
  analysis: DSDAnalysis,
  userId: string,
  supabase: any,
  apiKey: string,
  toothShape: string = 'natural',
  patientPreferences?: PatientPreferences
): Promise<string | null> {
  
  // NOVO: Primeiro, detectar a regiao dos dentes
  let teethBounds = { x: 30, y: 30, width: 40, height: 25 }; // Fallback
  try {
    const maskResult = await getTeethMask(imageBase64, apiKey);
    teethBounds = maskResult.bounds;
    console.log("Teeth region detected:", teethBounds);
  } catch (err) {
    console.warn("Could not detect teeth mask, using fallback bounds:", err);
  }
  
  // ... (manter logica existente de geracao de simulacao) ...
  
  // NOVO: Apos gerar a simulacao, fazer fusao com original
  const rawSimulationUrl = await generateRawSimulation(...);
  
  if (rawSimulationUrl) {
    // Download da simulacao gerada
    const { data: simData } = await supabase.storage
      .from("dsd-simulations")
      .download(rawSimulationUrl);
    
    const simBase64 = await blobToBase64(simData);
    
    // Fusao com imagem original
    console.log("Blending simulation with original (absolute preservation)...");
    const blendedImage = await blendWithOriginal(
      imageBase64,
      simBase64,
      teethBounds,
      apiKey
    );
    
    // Upload da imagem fundida
    const finalFileName = `${userId}/dsd_blended_${Date.now()}.png`;
    // ... upload logic ...
    
    return finalFileName;
  }
  
  return null;
}
```

## Alternativa Mais Simples (Se a Fusao Falhar)

Se a abordagem de fusao nao funcionar bem, podemos usar uma estrategia de **selecao automatica**:

1. Gerar 3 variacoes (como hoje)
2. Para cada variacao, comparar pixels FORA da regiao dos dentes com a imagem original
3. Calcular um "score de preservacao" (quanto mais similar aos pixels originais, melhor)
4. Selecionar automaticamente a variacao com maior score de preservacao

```typescript
async function selectBestVariation(
  originalBase64: string,
  variations: string[],
  teethBounds: { x: number; y: number; width: number; height: number },
  apiKey: string
): Promise<string> {
  // Usar modelo de visao para comparar e selecionar a melhor variacao
  const prompt = `You have:
1. ORIGINAL smile photo
2. Three VARIATIONS (A, B, C) with whitened teeth

Select which variation has the BEST preservation of NON-DENTAL areas:
- Which one has lips MOST IDENTICAL to original?
- Which one has skin texture MOST IDENTICAL to original?
- Which one has framing MOST IDENTICAL to original?

Respond with ONLY: "A", "B", or "C"
Choose the one where ONLY the teeth look different, and everything else is unchanged.`;

  // ... API call to compare and select ...
}
```

## Resultado Esperado

### Antes (problema atual):
- Labios: formato diferente
- Pele: textura/iluminacao diferente
- Enquadramento: levemente diferente
- Parece outra pessoa

### Depois (com fusao/mascara):
- Labios: IDENTICOS (pixels copiados da original)
- Pele: IDENTICA (pixels copiados da original)
- Enquadramento: IDENTICO (mesmas dimensoes)
- Apenas dentes visivelmente mais brancos
- Paciente se reconhece imediatamente

## Resumo de Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/generate-dsd/index.ts` | Adicionar: `getTeethMask()`, `blendWithOriginal()`, `selectBestVariation()`. Modificar: `generateSimulation()` para usar fusao pos-processamento |

## Ordem de Implementacao

1. **Fase 1**: Implementar `getTeethMask()` para detectar regiao dos dentes
2. **Fase 2**: Implementar `blendWithOriginal()` para fusao com mascara
3. **Fase 3**: Integrar no fluxo principal de `generateSimulation()`
4. **Fase 4**: Adicionar fallback `selectBestVariation()` para selecao automatica

## Consideracoes Tecnicas

### Performance
- Adiciona 1-2 chamadas extras de API (deteccao de mascara + fusao)
- Tempo total pode aumentar ~5-10 segundos
- Tradeoff aceitavel para garantir qualidade clinica

### Custos
- Mais tokens usados por simulacao
- Justificavel pela melhoria dramatica na qualidade

### Fallback
- Se deteccao de mascara falhar, usar bounds padrao conservadores
- Se fusao falhar, retornar simulacao sem fusao (comportamento atual)

