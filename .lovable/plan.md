
# Plano: Corrigir Consistencia do DSD - Mesmo Paciente, Apenas Dentes Editados

## Problema Identificado

A simulacao DSD esta gerando **bocas completamente diferentes** - os labios mudam de forma, a textura da pele muda, o enquadramento muda. Isso e inaceitavel para uma ferramenta clinica.

### Evidencia Visual (screenshot fornecido):
- **Antes**: Labios mais finos, textura de pele especifica, angulo X
- **Depois**: Labios mais grossos, textura diferente, angulo Y
- Os dentes parecem de outra pessoa, nao do mesmo paciente

## Causa Raiz

Os prompts atuais sao **muito longos e complexos** (30-50 linhas), o que:
1. Dilui a instrucao critica de preservacao
2. Confunde o modelo com multiplas prioridades conflitantes
3. O modelo "reinterpreta" a imagem inteira ao inves de editar pontualmente

### Best Practice do Google (documentacao oficial):

> **Template para Inpainting:**
> "Using the provided image, change only the [specific element] to [new element/description]. **Keep everything else in the image exactly the same, preserving the original style, lighting, and composition.**"

O Google recomenda:
1. Prompts CURTOS e DIRETOS
2. Instrucao de preservacao como REGRA PRINCIPAL (nao secundaria)
3. Foco em UM elemento especifico

## Solucao: Prompts Ultra-Curtos com Foco em Preservacao

### Filosofia Nova

```text
ANTES (problema):
[50 linhas de instrucoes misturadas]
"Clarear dentes... preservar labios... cor A1... remover manchas... simetria..."

DEPOIS (solucao):
[5-8 linhas com hierarquia clara]
"PRESERVAR: Labios, pele, enquadramento - IDENTICOS ao original
EDITAR: Apenas a cor dos dentes para branco A1/A2"
```

## Alteracoes Tecnicas

### Arquivo: supabase/functions/generate-dsd/index.ts

#### Novo Prompt Standard (5-8 linhas)

Substituir linhas 386-413 por:

```typescript
simulationPrompt = `Using this smile photo, change ONLY the teeth color.

CRITICAL PRESERVATION RULE:
Keep the lips, skin, facial features, and image framing EXACTLY THE SAME as the original photo.
Do not modify anything except the teeth.

TEETH EDIT:
- Whiten all visible teeth to shade A1/A2 (natural bright white)
- Remove any stains, yellowing, or discoloration
- Make the color uniform across all teeth
${patientDesires ? `- Patient wants: ${patientDesires}` : ''}

The lips, skin texture, and photo composition must be PIXEL-PERFECT identical to the input image.
Output the edited image with the exact same dimensions.`;
```

#### Novo Prompt Restoration-Replacement (5-8 linhas)

Substituir linhas 340-364 por:

```typescript
simulationPrompt = `Using this smile photo, change ONLY the teeth color and remove restoration interface lines.

CRITICAL PRESERVATION RULE:
Keep the lips, skin, facial features, and image framing EXACTLY THE SAME as the original photo.
Do not modify anything except the teeth.

TEETH EDIT:
- Whiten all visible teeth to shade A1/A2 (natural bright white)
- On teeth ${restorationTeeth || '11, 21'}: blend/remove any visible restoration interface lines
- Make the color uniform across all teeth (no color variation)
${patientDesires ? `- Patient wants: ${patientDesires}` : ''}

The lips and skin must be PIXEL-PERFECT identical to the input image.`;
```

#### Novo Prompt Reconstruction (5-8 linhas)

Substituir linhas 292-338 por:

```typescript
simulationPrompt = `Using this smile photo, reconstruct the missing/damaged teeth and whiten all teeth.

CRITICAL PRESERVATION RULE:
Keep the lips, skin, facial features, and image framing EXACTLY THE SAME as the original photo.
The ONLY change should be the teeth.

TEETH RECONSTRUCTION:
- ${specificInstructions || 'Reconstruct damaged/missing teeth using neighboring teeth as reference'}
- Whiten all teeth to shade A1/A2
- Make all teeth uniform in color and brightness

MANDATORY: The lips and skin texture must remain IDENTICAL to the original photo.
Do NOT change the photo angle, zoom, or composition.`;
```

#### Novo Prompt Intraoral (5-8 linhas)

Substituir linhas 366-383 por:

```typescript
simulationPrompt = `Using this intraoral dental photo, whiten the teeth.

EDIT:
- Change all visible teeth to white shade A1/A2
- Remove stains and discoloration
- Make color uniform

PRESERVE: Gums, background, image dimensions - keep exactly as original.`;
```

## Por Que Esta Solucao Funciona

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Tamanho do prompt | 30-50 linhas | 5-10 linhas |
| Primeira instrucao | "TAREFA: Clarear..." (acao) | "CRITICAL PRESERVATION RULE" (limite) |
| Idioma | Portugues | Ingles (modelo treinado) |
| Hierarquia | Misturada | Clara (PRESERVAR primeiro, EDITAR depois) |
| Complexidade | 10+ instrucoes | 3-4 instrucoes |

## Mudanca Estrategica: Ingles

Os modelos Gemini foram **treinados predominantemente em ingles**. Usar ingles para instrucoes criticas aumenta a precisao de compreensao, especialmente para regras de preservacao.

Nota: Os labels para o usuario continuam em portugues. Apenas o prompt tecnico para a IA e em ingles.

## Resumo de Arquivos

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/generate-dsd/index.ts` | Reescrever os 4 prompts de simulacao (reconstruction, restoration, intraoral, standard) com formato ultra-curto |

## Resultado Esperado

### Antes:
- Labios mudam de forma
- Pele muda de textura
- Enquadramento diferente
- Parece outra pessoa

### Depois:
- Labios IDENTICOS
- Pele IDENTICA
- Enquadramento IDENTICO
- Apenas os dentes ficam mais brancos

## Proximos Passos Opcionais

Se apos esta mudanca ainda houver inconsistencias:

1. **Fallback com multiplas tentativas**: Gerar 3 variacoes e comparar pixels dos labios com a imagem original para selecionar a mais consistente

2. **Mascara de fusao pos-processamento**: Usar deteccao de labios para extrair a mascara e sobrepor a imagem original nos labios apos a geracao (requer biblioteca de visao computacional)

3. **Feedback de validacao**: Adicionar checagem automatica que rejeita imagens onde a diferenca de pixels fora dos dentes excede um threshold
