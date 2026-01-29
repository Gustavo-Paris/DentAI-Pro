
# Plano: Melhorar Qualidade da Simulação DSD

## Problemas Identificados na Imagem

Analisando a simulação gerada:

| Aspecto | Antes (Original) | Depois (Simulação) | Problema |
|---------|------------------|-------------------|----------|
| Textura | Natural, com variações | Plastificada, uniforme | ❌ Perdeu realismo |
| Cor | Tons naturais variados | Muito uniforme/artificial | ❌ Parece "fake" |
| Defeitos | Buraquinho no lateral | NÃO foi corrigido | ❌ Feijão com arroz não feito |
| Proporções | Boca original | Manteve bem | ✅ OK |

## Causas Raiz

### 1. Modelo de Baixa Qualidade
```typescript
// ATUAL - modelo "flash" (mais rápido, menor qualidade)
const model = "google/gemini-2.5-flash-image-preview";

// DEVERIA - modelo "pro" (mais lento, maior qualidade)
const model = "google/gemini-3-pro-image-preview";
```

O modelo `gemini-2.5-flash` é otimizado para velocidade, não para qualidade de edição de imagem. O `gemini-3-pro-image-preview` produz resultados muito mais realistas.

### 2. Prompt Muito Genérico
O prompt atual lista muitas instruções genéricas que confundem a IA:
```text
MANDATORY CORRECTIONS (always apply):
- Remove stains and discolorations
- Fill small holes, chips or defects on tooth edges
- Close small gaps between teeth (up to 2mm)
- Remove visible dark lines at restoration margins
- Smooth irregular enamel surfaces
```

Isso faz a IA tentar "suavizar" tudo, perdendo a textura natural.

### 3. Falta de Instrução de Preservação de Textura
O prompt não enfatiza que a **textura natural do esmalte** deve ser preservada.

## Solução Proposta

### Mudança 1: Usar Modelo Pro
```typescript
// Usar modelo de maior qualidade para simulação
const model = "google/gemini-3-pro-image-preview";
```

### Mudança 2: Simplificar e Focar o Prompt
Voltar para um prompt mais direto e específico:

```text
DENTAL PHOTO EDIT

Edit ONLY the teeth in this photo. Keep everything else IDENTICAL.

PRESERVE (do not change):
- Lips (exact color, shape, texture, position)
- Gums (exact level, color, shape)
- Skin (unchanged)
- Tooth natural texture and surface details
- Image dimensions and framing

CORRECTIONS TO APPLY:
1. Fill visible holes, chips or defects on tooth edges
2. Remove dark stain spots
3. ${colorInstruction}
${specificCorrectionsFromAnalysis}

CRITICAL: Maintain natural enamel texture. Do NOT make teeth look plastic or artificial.

Output: Same photo with corrected teeth only.
```

### Mudança 3: Adicionar Instrução Explícita Anti-Plastificação
```text
CRITICAL: Maintain natural enamel texture. Do NOT make teeth look plastic or artificial.
```

## Comparação de Prompts

| Aspecto | Prompt Atual | Prompt Proposto |
|---------|--------------|-----------------|
| Linhas | ~25 | ~15 |
| Correções listadas | 5 genéricas | 2-3 específicas |
| Preservação textura | Não menciona | Explícito |
| Anti-artificial | Não tem | Tem instrução clara |
| Modelo | Flash (rápido) | Pro (qualidade) |

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `supabase/functions/generate-dsd/index.ts` | Trocar modelo + simplificar prompts |

## Detalhes Técnicos

### Linha ~412 - Trocar Modelo
```typescript
// ANTES
const model = "google/gemini-2.5-flash-image-preview";

// DEPOIS
const model = "google/gemini-3-pro-image-preview";
```

### Linhas ~206-211 - Simplificar Correções
```typescript
// ANTES - muito genérico
const mandatoryCorrections = `- Remove stains and discolorations
- Fill small holes, chips or defects on tooth edges
- Close small gaps between teeth (up to 2mm)
- Remove visible dark lines at restoration margins
- Smooth irregular enamel surfaces`;

// DEPOIS - mais específico e focado
const baseCorrections = `1. Fill visible holes, chips or defects on tooth edges
2. Remove dark stain spots`;
```

### Prompts Atualizados (todos os 4 branches)

**Standard Prompt:**
```typescript
simulationPrompt = `DENTAL PHOTO EDIT

Edit ONLY the teeth in this photo. Keep everything else IDENTICAL.

PRESERVE (do not change):
- Lips (exact color, shape, texture, position)
- Gums (exact level, color, shape)
- Skin (unchanged)
- Tooth natural texture and surface details
- Image dimensions and framing

CORRECTIONS TO APPLY:
${baseCorrections}
${colorInstruction}
${allowedChangesFromAnalysis}

CRITICAL: Maintain natural enamel texture. Do NOT make teeth look plastic or artificial.

Output: Same photo with corrected teeth only.`;
```

**Reconstruction/Restoration/Intraoral:** 
Mesma estrutura simplificada, adicionando instruções específicas para cada caso.

## Fluxo de Qualidade

```text
Foto Original
     │
     ▼
┌─────────────────────────────────────┐
│  Modelo: gemini-3-pro-image-preview │
│  (Alta qualidade, mais lento)       │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  Prompt Simplificado               │
│  • 2-3 correções específicas       │
│  • Instrução anti-plastificação    │
│  • Preservar textura natural       │
└─────────────────────────────────────┘
     │
     ▼
Simulação Realista
```

## Resultados Esperados

| Antes (Atual) | Depois (Proposto) |
|---------------|-------------------|
| Dentes plastificados | Textura natural preservada |
| Buraquinho não corrigido | Defeitos corrigidos |
| Cor muito uniforme | Variação natural de cor |
| Tempo: ~15s | Tempo: ~25-30s (mais lento, mas melhor) |

## Trade-offs

| Aspecto | Flash | Pro |
|---------|-------|-----|
| Velocidade | ✅ Rápido (~15s) | ❌ Mais lento (~30s) |
| Qualidade | ❌ Artificial | ✅ Realista |
| Custo | ✅ Menor | ❌ Maior |
| **Recomendação** | Para testes | **Para produção** |

## Benefícios Finais

1. **Resultado realista** - textura natural preservada
2. **Correções efetivas** - defeitos realmente corrigidos
3. **Prompt mais limpo** - menos confusão para a IA
4. **Qualidade profissional** - adequado para sistema de saúde
