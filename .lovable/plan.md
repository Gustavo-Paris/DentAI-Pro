
# Plano: Simplificar DSD + Processamento em Background

## Resumo Executivo

Este plano combina duas estratégias para resolver o problema de timeout/loop:

1. **Simplificar a Edge Function**: Remover verificação automática de qualidade, múltiplas variações e blend programático
2. **Processamento em Background**: Entregar análise clínica imediatamente (~25s) enquanto simulação visual gera em segundo plano

**Resultado esperado**: Usuário vê análise útil em ~25 segundos + simulação aparece automaticamente quando pronta (sem travar UI)

---

## Diagnóstico do Problema Atual

### Fluxo Atual (Causa Timeouts)

```text
1. analyzeProportions()         ~20-25s
2. getTeethMask()               ~10-15s  
3. generateSingleVariation() x3 ~45-60s cada (em paralelo = ~60s)
4. blendWithOriginal()          ~30-45s
5. verifySimulationQuality()    ~20-25s
6. Se falhar → repetir passos 4-5 para próxima variação

TEMPO TOTAL: 2-4 minutos (excede limite de 90s do navegador)
```

### Evidência nos Logs

```text
"Variation 0 failed quality check: [
  'Gums in the simulation appear to be at a slightly different level...',
  'The central upper incisors in the simulation appear slightly wider...'
]"
```

A verificação de qualidade está **rejeitando resultados aceitáveis**, forçando retentativas até timeout.

---

## Solução Proposta

### Novo Fluxo (Rápido + Resiliente)

```text
FASE 1 - IMEDIATA (~25s):
├─ analyzeProportions() → Retorna análise clínica
├─ Frontend mostra: Proporções + Sugestões + "Gerando simulação..."
└─ Usuário já pode revisar dados úteis

FASE 2 - BACKGROUND (~40-50s):
├─ generateSimulation() SIMPLIFICADO (1 tentativa, sem blend/verificação)
├─ Upload para Storage
├─ Atualiza UI automaticamente quando pronto
└─ Se falhar: botão "Tentar Gerar Simulação" (já existe)
```

---

## Mudanças Detalhadas

### 1. Edge Function: Novo Parâmetro `analysisOnly`

**Arquivo**: `supabase/functions/generate-dsd/index.ts`

Adicionar suporte para retornar apenas análise, sem esperar simulação:

```typescript
interface RequestData {
  // ... campos existentes
  analysisOnly?: boolean;  // NOVO: retorna só análise
}
```

**Na função validateRequest():**
```typescript
return {
  success: true,
  data: {
    // ... campos existentes
    analysisOnly: req.analysisOnly === true,
  },
};
```

**No handler principal (serve):**
```typescript
// Se analysisOnly, retorna imediatamente após análise
if (validation.data.analysisOnly) {
  const result: DSDResult = {
    analysis,
    simulation_url: null,
    simulation_note: "Simulação será gerada em segundo plano",
  };
  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

### 2. Simplificar generateSimulation()

**Remover funções complexas** (linhas 78-399):
- `getTeethMask()` - Detecção de máscara
- `verifySimulationQuality()` - Verificação automática de qualidade
- `blendWithOriginal()` - Composição programática
- `selectBestVariation()` - Seleção entre variações

**Nova versão simplificada:**

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
  const SIMULATION_TIMEOUT = 50_000; // 50s máximo
  
  // Build prompt (mesma lógica de prompts condicionais existente)
  const simulationPrompt = buildSimulationPrompt(analysis, toothShape, patientPreferences);
  
  // Single attempt with optimized model
  const model = "google/gemini-2.5-flash-image-preview";
  
  try {
    const response = await fetchWithTimeout(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{
            role: "user",
            content: [
              { type: "text", text: simulationPrompt },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          }],
          modalities: ["image", "text"],
        }),
      },
      SIMULATION_TIMEOUT,
      "generateSimulation"
    );

    if (!response.ok) {
      logger.warn("Simulation request failed:", response.status);
      return null;
    }

    const data = await response.json();
    const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImage) {
      logger.warn("No image in simulation response");
      return null;
    }

    // Upload directly (no blend, no verification)
    const base64Data = generatedImage.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    
    const fileName = `${userId}/dsd_${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from("dsd-simulations")
      .upload(fileName, binaryData, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      logger.error("Upload error:", uploadError);
      return null;
    }

    logger.log("Simulation generated and uploaded:", fileName);
    return fileName;
  } catch (err) {
    logger.warn("Simulation error:", err);
    return null;
  }
}
```

### 3. Frontend: Fluxo de Duas Chamadas

**Arquivo**: `src/components/wizard/DSDStep.tsx`

**Novos estados:**
```typescript
const [isSimulationGenerating, setIsSimulationGenerating] = useState(false);
const [simulationError, setSimulationError] = useState(false);
```

**Nova função analyzeDSD() com duas fases:**
```typescript
const analyzeDSD = async (retryCount = 0) => {
  if (!imageBase64) {
    setError('Nenhuma imagem disponível');
    return;
  }

  setIsAnalyzing(true);
  setError(null);
  setCurrentStep(0);

  const stepInterval = setInterval(() => {
    setCurrentStep((prev) => Math.min(prev + 1, 3)); // Só até passo 4 (análise)
  }, 2500);

  try {
    // FASE 1: Apenas análise (rápida)
    const { data, error: fnError } = await invokeFunction<DSDResult>('generate-dsd', {
      body: {
        imageBase64,
        toothShape: TOOTH_SHAPE,
        analysisOnly: true, // NOVO
        additionalPhotos,
        patientPreferences,
      },
    });

    clearInterval(stepInterval);

    if (fnError) throw fnError;

    if (data?.analysis) {
      // Mostrar análise imediatamente
      setResult(data);
      setIsAnalyzing(false);
      toast.success('Análise de proporções concluída!');
      
      // FASE 2: Gerar simulação em background
      generateSimulationBackground();
    } else {
      throw new Error('Análise não retornada');
    }
  } catch (error) {
    clearInterval(stepInterval);
    // ... tratamento de erro existente
  }
};
```

**Nova função para simulação em background:**
```typescript
const generateSimulationBackground = async () => {
  if (!imageBase64 || !result?.analysis) return;

  setIsSimulationGenerating(true);
  setSimulationError(false);

  try {
    const { data, error: fnError } = await invokeFunction<DSDResult>('generate-dsd', {
      body: {
        imageBase64,
        toothShape: TOOTH_SHAPE,
        regenerateSimulationOnly: true,
        existingAnalysis: result.analysis,
      },
    });

    if (fnError || !data?.simulation_url) {
      setSimulationError(true);
      return;
    }

    // Atualizar result com URL da simulação
    setResult((prev) => prev ? { 
      ...prev, 
      simulation_url: data.simulation_url 
    } : prev);

    // Carregar signed URL
    const { data: signedData } = await supabase.storage
      .from('dsd-simulations')
      .createSignedUrl(data.simulation_url, 3600);

    if (signedData?.signedUrl) {
      setSimulationImageUrl(signedData.signedUrl);
      toast.success('Simulação visual pronta!');
    }
  } catch (err) {
    console.error('Background simulation error:', err);
    setSimulationError(true);
  } finally {
    setIsSimulationGenerating(false);
  }
};
```

### 4. Nova UI Durante Geração em Background

**Quando análise chegou mas simulação está gerando:**

```tsx
{/* Card de simulação em progresso */}
{isSimulationGenerating && !simulationImageUrl && (
  <Card className="border-primary/30 bg-primary/5">
    <CardContent className="py-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium">Gerando simulação visual...</h4>
          <p className="text-sm text-muted-foreground">
            Você pode continuar revisando a análise enquanto processamos
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
)}

{/* Card de erro na simulação (com botão retry) */}
{simulationError && !simulationImageUrl && !isSimulationGenerating && (
  <Card className="border-amber-400 bg-amber-50/50">
    <CardContent className="py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <span className="text-sm text-amber-700">
            Simulação não pôde ser gerada
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={generateSimulationBackground}
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Tentar novamente
        </Button>
      </div>
    </CardContent>
  </Card>
)}
```

---

## Diagrama do Novo Fluxo

```text
┌─────────────────────────────────────────────────────────────────┐
│                      USUÁRIO ENVIA FOTO                         │
└──────────────────────────┬──────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────────┐
│  FASE 1 - CHAMADA RÁPIDA (~25s)                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  POST /generate-dsd { analysisOnly: true }               │    │
│  │  → analyzeProportions() ~20-25s                          │    │
│  │  → Return { analysis, simulation_url: null }             │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────┬───────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND MOSTRA IMEDIATAMENTE                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ✓ Badge "Confiança alta/média"                             │ │
│  │  ✓ ProportionsCard (proporção dourada, simetria, etc.)      │ │
│  │  ✓ Sugestões de Tratamento (lista de dentes)                │ │
│  │  ⏳ Card: "Gerando simulação visual..." [spinner]           │ │
│  │  [Continuar para Revisão →]                                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────┘
                           ↓ (em paralelo)
┌──────────────────────────────────────────────────────────────────┐
│  FASE 2 - BACKGROUND (~40-50s)                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  POST /generate-dsd { regenerateSimulationOnly: true }   │    │
│  │  → generateSimulation() SIMPLIFICADO                     │    │
│  │  → 1 tentativa, sem blend, sem verificação               │    │
│  │  → Upload direto para Storage                            │    │
│  │  → Return { simulation_url }                             │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────┬───────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────────┐
│  UI ATUALIZA AUTOMATICAMENTE                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ✓ ComparisonSlider aparece (Antes/Depois)                  │ │
│  │  ✓ Toast: "Simulação visual pronta!"                        │ │
│  │  ✓ Botão "Nova Simulação" disponível                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/generate-dsd/index.ts` | Adicionar `analysisOnly`, simplificar `generateSimulation()`, remover funções de blend/verificação |
| `src/components/wizard/DSDStep.tsx` | Fluxo de duas chamadas + UI de background |

---

## Código Removido (Simplificação)

### Funções a REMOVER da Edge Function

| Função | Linhas | Motivo |
|--------|--------|--------|
| `getTeethMask()` | 78-145 | Não necessário sem blend |
| `verifySimulationQuality()` | 147-231 | Causava rejeição de resultados aceitáveis |
| `blendWithOriginal()` | 234-311 | Adicionava complexidade sem garantia de melhora |
| `selectBestVariation()` | 313-399 | Não necessário com 1 tentativa |

### Lógica a SIMPLIFICAR

| Código Atual | Novo |
|--------------|------|
| `NUM_VARIATIONS = 3` + paralelo | `1 tentativa direta` |
| Loop com blend + verificação (linhas 862-918) | Upload direto |
| Fallback para "raw variation" | Fallback para `null` (botão retry na UI) |

---

## Comparação de Tempo

| Etapa | Antes | Depois |
|-------|-------|--------|
| Análise de proporções | 20-25s | 20-25s |
| Detecção de máscara | 10-15s | **REMOVIDO** |
| Geração (3 variações) | ~60s | ~40s (1 variação) |
| Blend | 30-45s | **REMOVIDO** |
| Verificação qualidade | 20-25s x N | **REMOVIDO** |
| **TEMPO ATÉ ANÁLISE** | 2-4 min | **~25s** |
| **TEMPO ATÉ SIMULAÇÃO** | 2-4 min | **~65s (background)** |

---

## Benefícios

1. **UX Drasticamente Melhor**: Usuário vê resultado útil em 25s vs 2-4 min
2. **Sem Timeout/Loop**: Conexão principal dura só 25s
3. **Não Bloqueia Fluxo**: Pode continuar para revisão enquanto simulação gera
4. **Fallback Elegante**: Se simulação falhar, análise está disponível + botão retry
5. **Menos Chamadas de IA**: 2-3 chamadas vs 8-12 chamadas
6. **Código Mais Simples**: ~400 linhas removidas da Edge Function

---

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Simulação sem blend pode ter qualidade inferior | Prompt otimizado compensa; usuário pode regenerar |
| Usuário navega antes de simulação terminar | Simulação fica no Storage; pode regenerar depois |
| Duas chamadas = duplicação de código | Reutilização via `regenerateSimulationOnly` existente |

---

## Ordem de Implementação

1. **Edge Function**: Adicionar `analysisOnly` + simplificar `generateSimulation()`
2. **Deploy** da Edge Function
3. **Frontend**: Refatorar `analyzeDSD()` para duas fases
4. **Frontend**: Adicionar UI de "simulação em progresso"
5. **Teste** end-to-end com caso real

---

## Seção Técnica: Mudanças Específicas

### Edge Function - Remoção de Funções

```typescript
// REMOVER COMPLETAMENTE (linhas 78-399):
// - getTeethMask()
// - verifySimulationQuality()
// - blendWithOriginal()
// - selectBestVariation()
// - blobToBase64()
```

### Edge Function - Nova generateSimulation()

A nova versão terá ~80 linhas vs ~400 linhas atuais:

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
  const TIMEOUT = 50_000;
  
  // Manter lógica de prompts condicionais (reconstruction, restoration, intraoral, standard)
  const simulationPrompt = buildPrompt(analysis, toothShape, patientPreferences);
  
  try {
    const response = await fetchWithTimeout(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
              { type: "text", text: simulationPrompt },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          }],
          modalities: ["image", "text"],
        }),
      },
      TIMEOUT,
      "generateSimulation"
    );

    if (!response.ok) return null;

    const data = await response.json();
    const image = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!image) return null;

    // Upload direto
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const binary = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const fileName = `${userId}/dsd_${Date.now()}.png`;

    const { error } = await supabase.storage
      .from("dsd-simulations")
      .upload(fileName, binary, { contentType: "image/png", upsert: true });

    return error ? null : fileName;
  } catch {
    return null;
  }
}
```

### Frontend - Estados e Refs

```typescript
// Novos estados
const [isSimulationGenerating, setIsSimulationGenerating] = useState(false);
const [simulationError, setSimulationError] = useState(false);

// Ref existente mantido
const analysisStartedRef = useRef(false);
```

### Frontend - Fluxo analyzeDSD()

```typescript
const analyzeDSD = async (retryCount = 0) => {
  // ... validação existente ...
  
  try {
    // FASE 1: Análise apenas
    const { data, error: fnError } = await invokeFunction<DSDResult>('generate-dsd', {
      body: {
        imageBase64,
        toothShape: TOOTH_SHAPE,
        analysisOnly: true, // <-- NOVO
        additionalPhotos: { ... },
        patientPreferences: { ... },
      },
    });

    if (data?.analysis) {
      setResult(data);
      setIsAnalyzing(false);
      toast.success('Análise concluída!');
      
      // FASE 2: Background
      generateSimulationBackground();
    }
  } catch { ... }
};

const generateSimulationBackground = async () => {
  setIsSimulationGenerating(true);
  
  try {
    const { data } = await invokeFunction<DSDResult>('generate-dsd', {
      body: {
        imageBase64,
        regenerateSimulationOnly: true,
        existingAnalysis: result.analysis,
      },
    });

    if (data?.simulation_url) {
      setResult(prev => ({ ...prev, simulation_url: data.simulation_url }));
      // Load signed URL...
      toast.success('Simulação pronta!');
    }
  } finally {
    setIsSimulationGenerating(false);
  }
};
```
