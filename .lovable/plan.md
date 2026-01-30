
# Plano: Corrigir Simulação DSD - Preservar Lábios + Aplicar Clareamento

## Problemas Diagnosticados

### Problema 1: Boca/Lábios Mudando
**Causa:** A instrução "PRESERVE: Lips" está no meio do prompt, não como prioridade absoluta.
**Resultado:** O modelo Gemini modifica lábios, textura de pele, e formato da boca.

### Problema 2: Clareamento Nunca Aplicado
**Causa:** O `colorInstruction` está "enterrado" após `baseCorrections` no prompt.
**Estrutura atual:**
```
CORRECTIONS TO APPLY:
1. Fill visible holes...    ← Modelo foca aqui
2. Remove dark stains...    ← E aqui
3. Close small gaps...      ← E aqui
- Change ALL teeth to A1/A2  ← Clareamento ignorado
```

**Resultado:** Mesmo gerando 2-3x, o clareamento nunca é aplicado porque está em posição secundária.

---

## Solução: Reestruturação Completa do Prompt

### Arquivo a Modificar
`supabase/functions/generate-dsd/index.ts`

---

### Mudança 1: Criar Bloco de Preservação Absoluta

**Localização:** Antes de todos os prompts (linha ~445)

Criar uma constante de preservação que será colocada NO TOPO de todos os prompts:

```typescript
const absolutePreservation = `⚠️ ABSOLUTE RULES - VIOLATION = FAILURE ⚠️

DO NOT CHANGE (pixel-perfect preservation required):
- LIPS: Shape, color, texture, position, contour EXACTLY as input
- GUMS: Level, color, shape EXACTLY as input
- SKIN: All facial skin EXACTLY as input
- BACKGROUND: All non-dental areas EXACTLY as input
- IMAGE SIZE: Exact same dimensions and framing

If any of these elements differ from input, the output is REJECTED.
Only TEETH may be modified.`;
```

---

### Mudança 2: Reestruturar Ordem das Instruções

**Problema atual:** Clareamento está DEPOIS das correções base.
**Solução:** Colocar clareamento ANTES, como prioridade #1.

**Antes (linha 578-582):**
```typescript
CORRECTIONS TO APPLY:
${baseCorrections}
${colorInstruction}
```

**Depois:**
```typescript
${colorInstruction ? `#1 PRIORITY - COLOR CHANGE (${analyzedPrefs?.whiteningLevel || 'natural'} whitening):
${colorInstruction}

The teeth MUST be visibly lighter than input. This is the PRIMARY goal.
` : ''}
ADDITIONAL CORRECTIONS:
${baseCorrections}
```

---

### Mudança 3: Reformatar Prompt Padrão (Standard)

**Antes (linhas 567-592):**
```typescript
simulationPrompt = `DENTAL PHOTO EDIT

Edit ONLY the teeth in this photo. Keep everything else IDENTICAL.

PRESERVE (do not change):
- Lips (exact color, shape, texture, position)
...
```

**Depois:**
```typescript
const wantsWhitening = analyzedPrefs?.whiteningLevel !== 'none';

simulationPrompt = `DENTAL PHOTO EDIT${wantsWhitening ? ' - WHITENING REQUESTED' : ''}

${absolutePreservation}

TASK: Edit ONLY the teeth. Everything else must be IDENTICAL to input.

${wantsWhitening ? `#1 PRIORITY - WHITENING (${analyzedPrefs?.whiteningLevel === 'intense' ? 'INTENSE' : 'NATURAL'}):
${colorInstruction}

⚠️ VERIFICATION: In the output, teeth MUST be CLEARLY LIGHTER than input.
If teeth look the same color, you have FAILED the primary task.

` : ''}DENTAL CORRECTIONS:
${baseCorrections}
${textureInstruction}
${allowedChangesFromAnalysis}${styleContext}

PROPORTION RULES:
- Keep original tooth width proportions exactly
- NEVER make teeth appear thinner or narrower
- Only add material to fill defects

FINAL CHECK:
[✓] Lips IDENTICAL to input? Required
[✓] Gums IDENTICAL to input? Required
[✓] Skin IDENTICAL to input? Required
${wantsWhitening ? '[✓] Teeth VISIBLY WHITER than input? Required' : ''}

Output: Same photo with ONLY teeth corrected.`;
```

---

### Mudança 4: Aplicar Mesma Estrutura nos Outros Prompts

Aplicar a mesma estrutura reformatada nos 3 outros tipos de prompt:
- **Reconstruction** (linhas 484-510)
- **Restoration** (linhas 512-539)
- **Intraoral** (linhas 541-564)

Cada um deve ter:
1. `absolutePreservation` no topo
2. Clareamento como "#1 PRIORITY" (se solicitado)
3. Outras correções como secundárias
4. Checklist de verificação no final

---

### Mudança 5: Adicionar Log de Debug do Prompt Final

Para debug futuro, logar os primeiros 500 caracteres do prompt:

```typescript
logger.log("DSD Simulation Request:", {
  promptType,
  wantsWhitening: analyzedPrefs?.whiteningLevel !== 'none',
  whiteningLevel: analyzedPrefs?.whiteningLevel || 'none',
  promptPreview: simulationPrompt.substring(0, 500) + '...',
});
```

---

## Fluxo Atualizado

```text
TEXTO: "Gostaria de dentes mais brancos e harmoniosos"
                         │
                         ▼
GEMINI FLASH ANALYSIS:
  whiteningLevel: "natural"
  colorInstruction: "Change ALL teeth to A1/A2 shade..."
                         │
                         ▼
PROMPT REFORMATADO:
  ⚠️ ABSOLUTE RULES - VIOLATION = FAILURE ⚠️
  DO NOT CHANGE: Lips, Gums, Skin, Background, Image Size
  
  #1 PRIORITY - WHITENING (NATURAL):
  Change ALL visible teeth to natural white A1/A2 shade...
  ⚠️ VERIFICATION: Teeth MUST be CLEARLY LIGHTER than input.
  
  DENTAL CORRECTIONS:
  1. Fill visible holes...
  2. Remove dark stains...
  
  FINAL CHECK:
  [✓] Lips IDENTICAL to input? Required
  [✓] Teeth VISIBLY WHITER than input? Required
                         │
                         ▼
GEMINI PRO IMAGE:
  → Lábios preservados (regra absoluta no topo)
  → Dentes visivelmente mais brancos (prioridade #1)
```

---

## Comparação Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Preservação de lábios | Lista simples no meio do prompt | "ABSOLUTE RULES - VIOLATION = FAILURE" no topo |
| Posição do clareamento | Enterrado após `baseCorrections` | "#1 PRIORITY" antes de tudo |
| Verificação | Não tinha | Checklist explícito no final |
| Ênfase | Instruções genéricas | Instruções com emojis ⚠️ e "FAILURE" para enforcement |

---

## Resultado Esperado

1. **Lábios preservados**: A regra absoluta no topo impede modificações
2. **Clareamento aplicado na primeira tentativa**: Prioridade #1 força o modelo a aplicar
3. **Qualidade consistente**: Checklist de verificação reforça expectativas

---

## Implementação Técnica

Arquivos a modificar: `supabase/functions/generate-dsd/index.ts`

Seções a alterar:
- Linha ~375: Adicionar constante `absolutePreservation`
- Linhas 484-510: Reformatar prompt de Reconstruction
- Linhas 512-539: Reformatar prompt de Restoration
- Linhas 541-564: Reformatar prompt de Intraoral
- Linhas 567-592: Reformatar prompt Standard
- Linha 598-606: Melhorar logging
