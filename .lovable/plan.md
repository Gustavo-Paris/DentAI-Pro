

# Plano: Reforcar Preservacao de Labios + Intensificar Clareamento

## Problema Confirmado

A imagem mostra claramente:
1. **Labio inferior DIFERENTE** - textura/forma alterada (mais suave/liso)
2. **Clareamento insuficiente** para nivel "Hollywood" (deveria ser BL3, branco intenso)

### Causa Raiz Tecnica

O modelo Gemini gera uma **imagem NOVA** ao inves de editar pontualmente. Mesmo com instrucoes de preservacao, ele "recria" a imagem inteira, causando variacoes em labios/pele/gengiva.

---

## Solucao: Tecnica de "Inpainting" via Prompt

### Estrategia: Forcar o modelo a pensar em "mascara"

Em vez de dizer "preserve os labios", instruir o modelo a:
1. **Copiar pixels** dos labios da imagem original
2. **Apenas modificar a area dos dentes**
3. Usar linguagem de "inpainting/mask" que modelos de imagem entendem melhor

---

## Mudancas Tecnicas

### Arquivo: `supabase/functions/generate-dsd/index.ts`

### Mudanca 1: Reformular Instrucao de Preservacao

**De** (instrucao abstrata):
```typescript
const absolutePreservation = `⚠️ ABSOLUTE PRESERVATION - ZERO TOLERANCE
CRITICAL: The ENTIRE MOUTH STRUCTURE must remain PIXEL-PERFECT IDENTICAL...
🚫 NEVER CHANGE: LIPS...`;
```

**Para** (instrucao tecnica de inpainting):
```typescript
const absolutePreservation = `🔒 INPAINTING MODE - STRICT MASK 🔒

WORKFLOW:
1. COPY the ENTIRE input image exactly as-is
2. IDENTIFY teeth area only (white/ivory colored enamel surfaces)
3. MODIFY ONLY pixels within the teeth boundary
4. ALL pixels OUTSIDE teeth boundary = EXACT COPY from input

⚠️ MASK DEFINITION:
- INSIDE MASK (can modify): Teeth enamel surfaces only
- OUTSIDE MASK (copy exactly): Lips, gums, tongue, skin, background, shadows, highlights

PIXEL-LEVEL REQUIREMENT:
- Every lip pixel in output = exact same RGB value as input
- Every gum pixel in output = exact same RGB value as input
- Every skin pixel in output = exact same RGB value as input

This is image EDITING (inpainting), NOT image GENERATION.
Output dimensions MUST equal input dimensions exactly.`;
```

### Mudanca 2: Intensificar Hollywood Whitening

**De**:
```typescript
hollywood: {
  instruction: "Make ALL visible teeth bright white (BL3). Hollywood smile effect, uniform bright appearance.",
  intensity: "INTENSE"
}
```

**Para**:
```typescript
hollywood: {
  instruction: "Make ALL visible teeth EXTREMELY WHITE (BL3/0M1). Pure bright white like porcelain veneers. The teeth should appear DRAMATICALLY lighter - almost glowing white. This is the maximum possible whitening.",
  intensity: "MAXIMUM"
}
```

### Mudanca 3: Adicionar Instrucao Explicita de Compositing

Adicionar antes do prompt final:
```typescript
const compositingInstruction = `
COMPOSITING REQUIREMENT:
Think of this as a Photoshop layer operation:
1. Bottom layer: Original input image (locked, unchanged)
2. Top layer: Your modifications to teeth ONLY
3. Final: Composite where only teeth differ

The final image must pass this test:
- Take input image
- Take output image  
- Difference map should show changes ONLY on teeth
- Any difference on lips/gums/skin = FAILURE`;
```

### Mudanca 4: Simplificar Prompt (Menos Regras, Mais Direto)

Prompts muito longos confundem o modelo. Reduzir para o essencial:

```typescript
simulationPrompt = `DENTAL INPAINTING - EDIT TEETH ONLY

${absolutePreservation}

TASK: Change ONLY the teeth color and surface.
${whiteningLevel === 'hollywood' 
  ? `WHITENING: Make teeth EXTREMELY WHITE (BL3). Maximum brightness. Porcelain-like.` 
  : whiteningPrioritySection}

DO NOT TOUCH: Lips, gums, tongue, skin, background.
COPY EXACTLY from input: All non-tooth areas.

Output: Same photo with whiter teeth. Nothing else changes.`;
```

---

## Comparacao de Prompts

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Abordagem | "Preserve" (abstrato) | "Inpainting/Mask" (tecnico) |
| Linguagem | Regras longas | Workflow curto e direto |
| Hollywood | "bright white BL3" | "EXTREMELY WHITE, porcelain, maximum" |
| Tamanho | ~2000 chars | ~800 chars |
| Semantica | "Nao mude" | "Copie exatamente" |

---

## Resultado Esperado

1. **Labios preservados**: Modelo entende "copiar pixels" melhor que "preservar"
2. **Hollywood mais branco**: Linguagem intensificada (EXTREMELY, MAXIMUM, porcelain)
3. **Menos confusao**: Prompt mais curto = menos regras conflitantes
4. **Melhor consistencia**: Abordagem de inpainting e mais padronizada

---

## Nota Importante

Se apos essas mudancas os labios AINDA mudarem, a limitacao e do **modelo de imagem** em si (Gemini nao tem suporte nativo a inpainting com mascara). Nesse caso, as opcoes seriam:

1. Aceitar pequenas variacoes como limitacao do sistema
2. Implementar inpainting real com API dedicada (ex: Stability AI Inpainting)
3. Fazer blend automatico no frontend (manter labios originais, so sobrepor dentes)

Mas vamos tentar o reforco de prompt primeiro.

---

## Arquivos a Modificar

1. **`supabase/functions/generate-dsd/index.ts`**
   - Linhas 62-76: Intensificar `hollywood` instruction
   - Linhas 234-253: Reformular `absolutePreservation` para inpainting
   - Linhas 460-478: Simplificar prompt principal

