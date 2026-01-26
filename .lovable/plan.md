
# Plano: Corrigir Geração de Simulação DSD - Preservar Enquadramento

## Problema Identificado

A simulação DSD está gerando imagens com **enquadramento completamente diferente** da foto original:
- Foto original: Sorriso completo com todos os dentes visíveis
- Simulação: Apenas 2 dentes centrais em zoom extremo

### Causa Raiz

O modelo de geração de imagem `google/gemini-3-pro-image-preview` não está respeitando a instrução de "MOLDURA CONGELADA". O prompt atual menciona "pixel por pixel" mas:
1. Nao especifica dimensoes obrigatorias
2. Nao instrui explicitamente sobre preservacao de aspect ratio
3. Nao inclui regra sobre enquadramento identico

---

## Solucao Proposta

Reformular os prompts de simulacao na edge function `generate-dsd/index.ts` para incluir instrucoes EXPLICITAS sobre:

1. **Dimensoes obrigatorias**: A imagem de saida DEVE ter exatamente as mesmas dimensoes da entrada
2. **Enquadramento identico**: Nao fazer zoom, crop ou pan
3. **Regra de validacao visual**: Listar elementos que DEVEM aparecer identicos (labios nas extremidades, gengiva visivel, todos os dentes originais)

---

## Alteracoes Tecnicas

### Arquivo: `supabase/functions/generate-dsd/index.ts`

**Secao 1: Reconstruction Prompt (linhas 258-285)**

Adicionar antes das regras absolutas:
```text
DIMENSOES OBRIGATORIAS:
A imagem de saida DEVE ter EXATAMENTE as mesmas dimensoes da imagem de entrada.
NAO faca zoom, crop, pan ou qualquer alteracao de enquadramento.
Se a foto original mostra labios nos cantos, a simulacao DEVE mostrar labios nos mesmos cantos.

VERIFICACAO DE ENQUADRAMENTO:
- Labio superior visivel nas extremidades? MANTER identico
- Labio inferior visivel? MANTER identico
- Quantos dentes visiveis na original? MANTER a mesma quantidade
- Proporcao da foto (4:3, 16:9, etc)? MANTER identica
```

**Secao 2: Standard Prompt (linhas 304-326)**

Mesmo padrao de instrucoes sobre dimensoes e enquadramento.

**Secao 3: Intraoral Prompt (linhas 287-300)**

Adicionar instrucoes simplificadas de preservacao de dimensao.

---

## Prompt Atualizado - Reconstruction

```text
TAREFA: Editar APENAS os dentes nesta foto de sorriso.

=== DIMENSOES E ENQUADRAMENTO (CRITICO) ===
- A imagem de SAIDA deve ter EXATAMENTE as mesmas dimensoes da ENTRADA
- NAO fazer zoom, crop, pan ou qualquer alteracao de enquadramento
- Todos os elementos da borda (labios, pele) devem estar nas MESMAS posicoes
- Se a foto original mostra 8 dentes, a simulacao DEVE mostrar os mesmos 8 dentes

REGRA ABSOLUTA #1 - ENQUADRAMENTO IDENTICO:
Copie a foto original PIXEL POR PIXEL para areas nao-dentais.
Labios, gengiva, pele e fundo = IDENTICOS a original.
Se um pixel mostra labio na original, deve mostrar labio no resultado.
NAO mova, amplie ou altere o contorno da imagem.

REGRA ABSOLUTA #2 - GENGIVA PROIBIDA:
NAO crie gengiva onde nao existe na foto original.
Se a gengiva esta coberta pelo labio, ela deve CONTINUAR coberta.
Modifique apenas a gengiva que JA E VISIVEL.

REGRA ABSOLUTA #3 - RECONSTRUCAO + CLAREAMENTO:
RECONSTRUA: ${specificInstructions}
Proporcao: largura = 75-80% da altura, simetria bilateral.

COR OBRIGATORIA (TODOS os dentes):
- Tom uniforme A1/A2 (branco natural, levemente claro)
- REMOVA todas as manchas e descoloracoes
- Todos os dentes devem ter a MESMA cor

${patientDesires}
FORMATO: ${toothShape.toUpperCase()} - ${shapeInstruction}

LISTA DE VERIFICACAO FINAL:
[ ] Dimensoes da imagem identicas? 
[ ] Labios na mesma posicao e tamanho?
[ ] Nenhuma gengiva nova criada?
[ ] Todos os dentes originais visiveis?
[ ] So os dentes foram alterados?
```

---

## Prompt Atualizado - Standard

```text
TAREFA: Editar APENAS os dentes visiveis nesta foto de sorriso.

=== DIMENSOES E ENQUADRAMENTO (CRITICO) ===
- SAIDA = mesmas dimensoes que ENTRADA
- NAO fazer zoom, crop, pan
- Bordas da imagem (labios, pele) = IDENTICAS

REGRA ABSOLUTA #1 - ENQUADRAMENTO IDENTICO:
Copie a foto original PIXEL POR PIXEL.
Labios, gengiva, pele e fundo = IDENTICOS a original.
NAO altere posicao ou formato dos labios.
NAO amplie ou reduza a area dos dentes.

REGRA ABSOLUTA #2 - GENGIVA/LABIO INTOCAVEIS:
NAO crie gengiva onde nao existe.
Se o labio cobre a gengiva, ela deve continuar coberta.

EDICOES PERMITIDAS nos dentes VISIVEIS:
${analysis.suggestions.slice(0, 4).map((s) => `- ${s.tooth}: ${s.proposed_change}`).join("\n")}

COR OBRIGATORIA:
- Tom uniforme A1/A2 natural
- REMOVA manchas e descoloracoes
- Todos os dentes com MESMA cor

${patientDesires}
FORMATO: ${toothShape.toUpperCase()} - ${shapeInstruction}

RESULTADO: Sorriso harmonioso, labios e gengiva INALTERADOS, MESMAS dimensoes.
```

---

## Adicionar Fallback de Modelo

Trocar a ordem dos modelos para priorizar `gemini-2.5-flash-image-preview` que pode ter melhor preservacao de enquadramento:

```typescript
const modelsToTry = [
  "google/gemini-2.5-flash-image-preview",  // Tende a preservar melhor enquadramento
  "google/gemini-3-pro-image-preview"       // Fallback
];
```

---

## Adicionar Log de Debug

Registrar informacoes sobre a geracao para facilitar debugging:

```typescript
console.log("DSD Simulation Request:", {
  promptType: needsReconstruction ? 'reconstruction' : (isIntraoralPhoto ? 'intraoral' : 'standard'),
  imageDataLength: imageBase64.length,
  analysisConfidence: analysis.confidence,
  suggestionsCount: analysis.suggestions.length,
  patientDesires: patientPreferences?.desiredChanges
});
```

---

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/generate-dsd/index.ts` | Reformular prompts com instrucoes explicitas de dimensao e enquadramento |
| `supabase/functions/generate-dsd/index.ts` | Inverter ordem dos modelos (flash primeiro) |
| `supabase/functions/generate-dsd/index.ts` | Adicionar logs de debug |

---

## Resultado Esperado

Apos as alteracoes:
- Simulacao mantem EXATAMENTE o mesmo enquadramento da foto original
- Todos os dentes originais continuam visiveis
- Apenas a aparencia dos dentes e modificada (cor, forma sutil)
- Labios e gengiva permanecem identicos
