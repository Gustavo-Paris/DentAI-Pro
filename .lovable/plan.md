

# Plano Completo: Análise Inteligente + Consistência de Qualidade DSD

## Problemas Identificados

### Problema 1: Clareamento Não Aplicado
**Causa:** Linha 201 ainda usa o formato antigo:
```typescript
const wantsWhiter = patientPreferences?.desiredChanges?.includes('whiter');
```
Resultado: preferências do texto livre são ignoradas, clareamento nunca aplicado.

### Problema 2: Qualidade Inconsistente (precisa gerar 3x)
**Causas identificadas:**
1. **Prompts muito genéricos** - Modelo de imagem recebe instruções vagas
2. **Sem contexto específico** - Preferências do paciente não enriquecem o prompt
3. **Fallback entre modelos** - Se Gemini Pro falha, Flash gera resultado inferior
4. **Sem validação de qualidade** - Aceita qualquer resultado sem verificar

---

## Solução: Dupla Camada de Inteligência

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  TEXTO LIVRE DO PACIENTE                                                 │
│  "Gostaria de dentes mais brancos e naturais, tenho sensibilidade."      │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  CAMADA 1: GEMINI FLASH (análise de preferências ~2s)                    │
│                                                                          │
│  Input: texto livre                                                      │
│  Output: instruções estruturadas para o prompt de simulação              │
│                                                                          │
│  {                                                                       │
│    whiteningLevel: "natural",        // none | natural | intense         │
│    colorInstruction: "ALL teeth → A1/A2 shade (1-2 tons mais claro)",    │
│    textureInstruction: "Manter translucidez natural do esmalte",         │
│    styleNotes: "Resultado discreto, evitar aparência artificial",        │
│    sensitivityNote: "Paciente reporta sensibilidade"                     │
│  }                                                                       │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  CAMADA 2: GEMINI PRO IMAGE (geração de simulação ~40s)                  │
│                                                                          │
│  Prompt ENRIQUECIDO com instruções específicas:                          │
│                                                                          │
│  DENTAL PHOTO EDIT - WHITENING NATURAL                                   │
│                                                                          │
│  COLOR INSTRUCTION (from AI analysis):                                   │
│  "Change ALL visible teeth to natural white A1/A2 shade..."              │
│                                                                          │
│  TEXTURE INSTRUCTION (from AI analysis):                                 │
│  "Maintain natural enamel translucency and texture..."                   │
│                                                                          │
│  STYLE NOTES (from AI analysis):                                         │
│  "Avoid artificial appearance, patient wants natural look..."            │
│                                                                          │
│  [+ instruções existentes de proporção, preservação, etc.]               │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Arquivo a Modificar

**Arquivo:** `supabase/functions/generate-dsd/index.ts`

### 1. Nova Interface de Preferências Analisadas (após linha 58)

```typescript
interface AnalyzedPreferences {
  whiteningLevel: 'none' | 'natural' | 'intense';
  colorInstruction: string;
  textureInstruction: string;
  styleNotes: string;
  sensitivityNote: string | null;
}
```

### 2. Nova Função: `analyzePatientPreferences` (após linha 185)

Funcionalidade:
- Recebe o texto livre do paciente
- Chama **Gemini 3 Flash** (rápido, ~2s, barato)
- Usa tool calling para garantir resposta estruturada
- Retorna instruções prontas para o prompt de simulação
- Timeout de 8 segundos
- Fallback para valores padrão se falhar

**Prompt para Gemini Flash:**
```text
Você é um especialista em odontologia estética.
Analise o texto do paciente e extraia preferências para uma simulação de sorriso.

TEXTO DO PACIENTE:
"{{aestheticGoals}}"

Determine:

1. whiteningLevel (nível de clareamento desejado):
   - "intense" se menciona: hollywood, bem branco, muito branco, bleach, BL, super branco
   - "natural" se menciona: branco, claro, clarear, mais claro (sem intensificador)
   - "none" se não menciona clareamento ou cor

2. colorInstruction (instrução ESPECÍFICA para o prompt de imagem):
   - Para intense: "Change ALL visible teeth (including adjacent) to bright white/bleach BL2/BL3 shade. Uniform bright appearance."
   - Para natural: "Change ALL visible teeth to natural white A1/A2 shade (1-2 shades lighter than original). Maintain subtle color variations."
   - Para none: "Keep original tooth color. Only remove surface stains if visible."

3. textureInstruction (instrução de textura baseada no estilo):
   - Se menciona "natural", "discreto", "não artificial": "Preserve natural enamel texture, translucency, and micro-surface details. Avoid over-smoothing."
   - Se menciona "perfeito", "uniforme": "Slight smoothing allowed, maintain realistic enamel appearance."
   - Padrão: "Maintain natural tooth texture and surface characteristics."

4. styleNotes (notas adicionais para o prompt):
   - Extraia quaisquer preferências específicas mencionadas
   - Ex: "Patient wants younger appearance" ou "Avoid artificial Hollywood look"

5. sensitivityNote:
   - Se menciona sensibilidade: "Patient reports tooth sensitivity - note for clinical planning"
   - Senão: null
```

**Tool Definition:**
```typescript
{
  type: "function",
  function: {
    name: "extract_preferences",
    parameters: {
      type: "object",
      properties: {
        whiteningLevel: { 
          type: "string", 
          enum: ["none", "natural", "intense"] 
        },
        colorInstruction: { type: "string" },
        textureInstruction: { type: "string" },
        styleNotes: { type: "string" },
        sensitivityNote: { type: "string", nullable: true }
      },
      required: ["whiteningLevel", "colorInstruction", "textureInstruction", "styleNotes"]
    }
  }
}
```

### 3. Atualizar `generateSimulation` (linhas 188-420)

**Mudança principal - Substituir linhas 200-204:**

Antes:
```typescript
const wantsWhiter = patientPreferences?.desiredChanges?.includes('whiter');
const colorInstruction = wantsWhiter 
  ? '- Tooth color → shade A1/A2 (natural white)'
  : '- Keep natural tooth color (remove stains only)';
```

Depois:
```typescript
// Analyze patient preferences with Gemini Flash (fast ~2s)
let analyzedPrefs: AnalyzedPreferences | null = null;
if (patientPreferences?.aestheticGoals) {
  try {
    analyzedPrefs = await analyzePatientPreferences(
      patientPreferences.aestheticGoals, 
      apiKey
    );
    logger.log("Patient preferences analyzed:", {
      whiteningLevel: analyzedPrefs.whiteningLevel,
      hasStyleNotes: !!analyzedPrefs.styleNotes
    });
  } catch (err) {
    logger.warn("Failed to analyze preferences, using defaults:", err);
  }
}

// Fallback for legacy format or if analysis failed
const legacyWantsWhiter = patientPreferences?.desiredChanges?.includes('whiter');

// Build dynamic instructions
const colorInstruction = analyzedPrefs?.colorInstruction 
  || (legacyWantsWhiter 
      ? '- Change ALL visible teeth to natural white A1/A2 shade' 
      : '- Keep original tooth color (remove stains only)');

const textureInstruction = analyzedPrefs?.textureInstruction
  || '- Maintain natural enamel texture and surface details';

const styleContext = analyzedPrefs?.styleNotes
  ? `\nPATIENT STYLE PREFERENCE: ${analyzedPrefs.styleNotes}`
  : '';
```

### 4. Integrar no Prompt de Simulação

Adicionar as instruções analisadas em cada variante do prompt (standard, reconstruction, restoration, intraoral):

```typescript
CORRECTIONS TO APPLY:
${baseCorrections}
${colorInstruction}    // ← Agora vem da análise com IA
${textureInstruction}  // ← NOVO!
${allowedChangesFromAnalysis}
${styleContext}        // ← NOVO! Notas de estilo do paciente

QUALITY REQUIREMENTS:
- Output must show VISIBLE difference from input (especially if whitening requested)
- Color change must be applied to ALL visible teeth uniformly
- Changes must be natural and realistic, not artificial
```

### 5. Melhorar Consistência de Qualidade

Adicionar ao prompt de cada variante instruções mais explícitas:

```typescript
MANDATORY OUTPUT QUALITY:
1. If whitening was requested, teeth MUST be visibly lighter in the output
2. Color change must be uniform across ALL visible teeth
3. Lips, gums, skin must be PIXEL-PERFECT identical to input
4. Tooth texture must remain natural (not plastic/smooth)
5. The "before vs after" must show clear, visible improvement
```

---

## Lógica de Detecção por IA (vs Keywords)

| Texto do Paciente | Análise IA | Instrução de Cor |
|-------------------|------------|------------------|
| "Dentes mais brancos e naturais" | whiteningLevel=natural | ALL teeth → A1/A2 |
| "Hollywood smile, bem branco" | whiteningLevel=intense | ALL teeth → BL2/BL3 |
| "Quero parecer mais jovem" | whiteningLevel=natural | ALL teeth → A1/A2 + style notes |
| "Natural, sem artifício" | whiteningLevel=none | Keep original + texture note |
| (sem texto) | null | Keep original |

---

## Fallback e Robustez

Se a análise com Gemini Flash falhar:
- Timeout de 8s para não bloquear
- Fallback para comportamento padrão
- Log do erro para debug
- Mantém retrocompatibilidade com `desiredChanges` (formato antigo)
- Continua com a simulação normalmente

---

## Fluxo de Implementação

1. Adicionar interface `AnalyzedPreferences`
2. Criar função `analyzePatientPreferences` com Gemini Flash
3. Atualizar `generateSimulation` para chamar a análise
4. Integrar instruções analisadas nos 4 tipos de prompts
5. Adicionar instruções de qualidade obrigatória
6. Manter retrocompatibilidade com `desiredChanges`
7. Adicionar logs para debug
8. Deploy da Edge Function
9. Testar com diferentes textos de preferência

---

## Resultado Esperado

### Antes (problema atual)
- Preferências ignoradas (clareamento nunca aplicado)
- Qualidade inconsistente (precisa regenerar 3x)
- Prompts genéricos sem contexto do paciente

### Depois (solução)
- Preferências analisadas por IA e convertidas em instruções específicas
- Prompts enriquecidos com contexto detalhado
- Instruções de qualidade obrigatória no prompt
- Primeira geração já com qualidade adequada
- Clareamento aplicado quando solicitado (natural ou intenso)
- Textura e estilo respeitados conforme preferências

---

## Custo e Performance

| Etapa | Modelo | Tempo | Custo |
|-------|--------|-------|-------|
| Análise de preferências | Gemini 3 Flash | ~2s | Muito baixo (~500 tokens) |
| Geração de simulação | Gemini Pro Image | ~40s | Normal |
| **Total adicional** | - | **+2s** | **Insignificante** |

