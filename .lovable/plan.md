
# Analise de Consistencia do Wizard - Ponta a Ponta

## Resumo Executivo

Analisei o fluxo completo do wizard (6 etapas) e identifiquei **inconsistencias criticas** na passagem de dados entre camadas, especialmente relacionadas as preferencias do paciente (nivel de clareamento).

---

## Fluxo Atual do Wizard

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ ETAPA 1: Foto                                                                │
│ PhotoUploadStep.tsx                                                          │
│ - Captura: imageBase64, additionalPhotos (smile45, face)                     │
│ - Saida: Imagem comprimida em base64                                         │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│ ETAPA 2: Preferencias do Paciente                                            │
│ PatientPreferencesStep.tsx                                                   │
│ - Captura: whiteningLevel (natural | white | hollywood)                      │
│ - Saida: PatientPreferences { whiteningLevel: 'natural'|'white'|'hollywood'} │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│ ETAPA 3: Analise IA                                                          │
│ AnalyzingStep.tsx + analyze-dental-photo Edge Function                       │
│ - Entrada: imageBase64                                                       │
│ - Saida: PhotoAnalysisResult (detected_teeth, vita_shade, observations...)   │
│ ⚠️ NAO RECEBE patientPreferences - analise desconhece nivel de clareamento   │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│ ETAPA 4: DSD (Simulacao)                                                     │
│ DSDStep.tsx + generate-dsd Edge Function                                     │
│ - Entrada: imageBase64, patientPreferences.whiteningLevel, analysisResult    │
│ - Processamento: Mapeia whiteningLevel para instrucoes de cor                │
│ - Saida: DSDResult { analysis, simulation_url }                              │
│ ✅ RECEBE whiteningLevel corretamente                                        │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│ ETAPA 5: Revisao                                                             │
│ ReviewAnalysisStep.tsx                                                       │
│ - Entrada: analysisResult, formData, selectedTeeth, toothTreatments          │
│ - Usuario ajusta: patientName, patientAge, bruxism, aestheticLevel, etc.     │
│ ⚠️ NAO EXIBE whiteningLevel selecionado na Etapa 2                           │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│ ETAPA 6: Resultado                                                           │
│ NewCase.tsx handleSubmit → recommend-resin Edge Function → Result.tsx        │
│ - Salva no banco: patient_aesthetic_goals = whiteningLevel (string simples)  │
│ - Envia para recommend-resin: aestheticGoals = whiteningLevel                │
│ ⚠️ INCONSISTENCIA: recommend-resin espera texto livre, recebe enum           │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Inconsistencias Encontradas

### 1. **Campo patient_aesthetic_goals Recebe Valor Errado**

**Localizacao:** `NewCase.tsx` linha 545

**Problema:**
```typescript
// O que esta sendo salvo:
patient_aesthetic_goals: patientPreferences.whiteningLevel || null,
// Resultado: "natural", "white" ou "hollywood" (enum)

// O que o Result.tsx espera mostrar:
<p className="text-sm text-muted-foreground italic">
  "{evaluation.patient_aesthetic_goals}"  // Mostra "hollywood" como texto
</p>
```

**Impacto:** A tela de resultado mostra literalmente "hollywood" ou "natural" ao inves de um texto descritivo como "Clareamento intenso - nivel Hollywood".

---

### 2. **WhiteningPreferenceAlert Busca Keywords Erradas**

**Localizacao:** `WhiteningPreferenceAlert.tsx` linhas 12-18 e 21-24

**Problema:**
```typescript
// O componente espera texto livre com keywords:
const WHITENING_KEYWORDS = [
  'branco', 'brancos', 'claro', 'claros', 'clarear', 'clareamento'...
];

function hasWhiteningKeywords(text: string): boolean {
  const normalized = text.toLowerCase();
  return WHITENING_KEYWORDS.some(keyword => normalized.includes(keyword));
}
```

**Mas recebe:** "hollywood", "white" ou "natural" (que nao contem essas keywords)

**Impacto:** O alerta de clareamento **NUNCA aparece** porque "hollywood".includes("branco") = false

---

### 3. **recommend-resin Recebe Enum em Vez de Texto**

**Localizacao:** `NewCase.tsx` linha 597

**Problema:**
```typescript
// O que esta sendo enviado:
aestheticGoals: patientPreferences.whiteningLevel || undefined,
// Resultado: "hollywood"

// O que o prompt em recommend-resin espera (linhas 314-336):
// "${data.aestheticGoals}" → Mostra no prompt como texto livre para IA analisar
// O prompt diz: "Analise o texto acima e extraia as preferencias esteticas"
```

**Impacto:** A IA recebe apenas "hollywood" sem contexto, em vez de "Paciente deseja dentes bem brancos, nivel Hollywood (BL3)"

---

### 4. **Nivel de Clareamento Nao Aparece na Revisao (Etapa 5)**

**Localizacao:** `ReviewAnalysisStep.tsx`

**Problema:** O componente nao recebe nem exibe `patientPreferences.whiteningLevel`. O usuario escolhe o nivel na Etapa 2, mas nao ve essa escolha durante a revisao final.

**Impacto:** Usuario pode esquecer o que selecionou e nao tem como confirmar antes de gerar o protocolo.

---

### 5. **Nao Ha Mapeamento de whiteningLevel para Cor no recommend-resin**

**Localizacao:** `recommend-resin/index.ts`

**Problema:** Apesar de ter um `whiteningColorMap` (linhas 52-79), ele **NAO e utilizado** para ajustar as cores do protocolo com base no nivel de clareamento escolhido. A logica depende da IA interpretar o texto "hollywood".

**Impacto:** O protocolo de resina pode nao refletir o nivel de clareamento escolhido, especialmente se a IA ignorar o campo.

---

## Plano de Correcoes

### Correcao 1: Mapear whiteningLevel para Texto Descritivo

**Arquivo:** `NewCase.tsx`

Criar mapeamento de enum para texto legivel:

```typescript
const WHITENING_LEVEL_DESCRIPTIONS: Record<string, string> = {
  natural: 'Clareamento natural e sutil (A1/A2)',
  white: 'Clareamento notavel - dentes mais brancos (BL1/BL2)',
  hollywood: 'Clareamento intenso - sorriso Hollywood (BL3)',
};

// Ao salvar:
patient_aesthetic_goals: WHITENING_LEVEL_DESCRIPTIONS[patientPreferences.whiteningLevel] || null,
```

---

### Correcao 2: Atualizar WhiteningPreferenceAlert

**Arquivo:** `WhiteningPreferenceAlert.tsx`

Adicionar deteccao direta do nivel:

```typescript
// Detectar pelo enum diretamente
const WHITENING_LEVEL_KEYWORDS = ['natural', 'white', 'hollywood'];

function detectsWhiteningLevel(text: string): 'natural' | 'white' | 'hollywood' | null {
  const lower = text.toLowerCase();
  if (lower.includes('hollywood') || lower.includes('bl3')) return 'hollywood';
  if (lower.includes('white') || lower.includes('notavel') || lower.includes('bl1') || lower.includes('bl2')) return 'white';
  if (lower.includes('natural') || lower.includes('sutil') || lower.includes('a1') || lower.includes('a2')) return 'natural';
  // Fallback para keywords antigas
  if (WHITENING_KEYWORDS.some(kw => lower.includes(kw))) return 'white';
  return null;
}
```

---

### Correcao 3: Enriquecer Dados para recommend-resin

**Arquivo:** `NewCase.tsx` (linha 597)

Enviar instrucao completa:

```typescript
aestheticGoals: patientPreferences.whiteningLevel === 'hollywood'
  ? 'Paciente deseja clareamento INTENSO - nivel Hollywood (BL3). Ajustar todas as camadas 2-3 tons mais claras que a cor detectada.'
  : patientPreferences.whiteningLevel === 'white'
  ? 'Paciente deseja clareamento NOTAVEL (BL1/BL2). Ajustar camadas 1-2 tons mais claras.'
  : patientPreferences.whiteningLevel === 'natural'
  ? 'Paciente prefere aparencia NATURAL com clareamento sutil (A1/A2).'
  : undefined,
```

---

### Correcao 4: Exibir Nivel de Clareamento na Revisao

**Arquivo:** `ReviewAnalysisStep.tsx`

Adicionar props e exibicao:

```typescript
interface ReviewAnalysisStepProps {
  // ... props existentes
  whiteningLevel?: 'natural' | 'white' | 'hollywood';
}

// No componente, adicionar badge visual:
{whiteningLevel && (
  <Card className="border-primary/20 bg-primary/5 mb-4">
    <CardContent className="py-3 flex items-center gap-2">
      <Sparkles className="w-4 h-4 text-primary" />
      <span className="text-sm">Nivel de clareamento:</span>
      <Badge variant="secondary">
        {whiteningLevel === 'hollywood' ? 'Hollywood (BL3)' :
         whiteningLevel === 'white' ? 'Branco (BL1/BL2)' : 'Natural (A1/A2)'}
      </Badge>
    </CardContent>
  </Card>
)}
```

---

### Correcao 5: Usar Mapeamento de Cores no recommend-resin

**Arquivo:** `recommend-resin/index.ts`

Aplicar `whiteningColorMap` baseado no nivel:

```typescript
// No inicio do processamento:
let targetColor = data.toothColor;

if (data.aestheticGoals) {
  const goals = data.aestheticGoals.toLowerCase();
  if (goals.includes('hollywood') || goals.includes('bl3')) {
    // Hollywood: ir para BL3 ou o mais claro possivel
    const colors = getWhiteningColors(data.toothColor);
    targetColor = colors.length >= 2 ? colors[1] : colors[0] || 'BL3';
  } else if (goals.includes('white') || goals.includes('notavel')) {
    // Branco: ir 1-2 tons mais claro
    const colors = getWhiteningColors(data.toothColor);
    targetColor = colors[0] || data.toothColor;
  }
  // Natural: manter cor original
}

// Usar targetColor no prompt em vez de data.toothColor
```

---

## Outras Observacoes de Consistencia

### Fluxo de Dados OK

1. **Foto → Analise:** imageBase64 passa corretamente
2. **DSD recebe whiteningLevel:** generate-dsd usa WHITENING_INSTRUCTIONS corretamente
3. **Compositing determinisitco:** Funciona para preservar labios
4. **Tratamentos por dente:** toothTreatments mapeado corretamente para cada dente
5. **Session ID:** Agrupamento de avaliacoes funciona corretamente

### Campos Salvos Corretamente no Banco

| Campo | Fonte | Status |
|-------|-------|--------|
| tooth | analysisResult ou formData | ✅ OK |
| region | getFullRegion() | ✅ OK |
| cavity_class | toothData ou formData | ✅ OK |
| tooth_color | formData.vitaShade | ✅ OK |
| bruxism | formData | ✅ OK |
| treatment_type | toothTreatments[tooth] | ✅ OK |
| dsd_analysis | dsdResult.analysis | ✅ OK |
| dsd_simulation_url | dsdResult.simulation_url | ✅ OK |
| patient_aesthetic_goals | whiteningLevel (enum) | ⚠️ Precisa enriquecimento |

---

## Arquivos a Modificar

1. **`src/pages/NewCase.tsx`** (linhas 545, 597)
   - Mapear whiteningLevel para texto descritivo
   - Enriquecer aestheticGoals para recommend-resin

2. **`src/components/wizard/ReviewAnalysisStep.tsx`**
   - Adicionar prop whiteningLevel
   - Exibir badge com nivel selecionado

3. **`src/components/protocol/WhiteningPreferenceAlert.tsx`**
   - Atualizar logica de deteccao para incluir enum

4. **`supabase/functions/recommend-resin/index.ts`** (opcional)
   - Usar whiteningColorMap para ajustar targetColor no prompt

---

## Impacto das Correcoes

| Problema | Antes | Depois |
|----------|-------|--------|
| Exibicao de preferencia | "hollywood" | "Clareamento intenso - Hollywood (BL3)" |
| Alerta de clareamento | Nunca aparece | Aparece quando whiteningLevel != natural |
| IA entende preferencia | Depende de interpretar "hollywood" | Instrucao clara com cores especificas |
| Usuario confirma escolha | Nao ve na revisao | Badge visivel na Etapa 5 |
| Protocolo ajusta cores | Inconsistente | Determinístico baseado no nivel |

