
# Plano: Correções Baseadas no Feedback da Dentista (Caso Leticia)

## Resumo dos Problemas Identificados

A especialista identificou **4 categorias de problemas críticos**:

1. **Simulação DSD alterou gengiva e largura dos dentes** sem necessidade clínica
2. **DSD apenas clareou os dentes** sem executar as correções necessárias (alinhamento incisal, formato dos laterais)
3. **Sugeriu tratamento para apenas 4 dentes** quando deveria incluir caninos e pré-molares
4. **Sugestões falsas**: gengivoplastia desnecessária e substituição de restaurações inexistentes

---

## Análise Técnica das Causas

### Problema 1: Alteração de Gengiva/Largura dos Dentes

**Causa Raiz**: Os prompts de simulação não têm instruções suficientemente rígidas sobre preservação de gengiva e largura dental. A instrução "Keep the lips, skin, facial features" não menciona explicitamente GENGIVA e PROPORÇÃO dos dentes.

**Evidência no código** (`generate-dsd/index.ts`, linha 589-603):
```typescript
simulationPrompt = `Using this smile photo, change ONLY the teeth color.
CRITICAL PRESERVATION RULE:
Keep the lips, skin, facial features, and image framing EXACTLY THE SAME...
```
A gengiva não é mencionada, e não há regra sobre manter a LARGURA/PROPORÇÃO dos dentes.

---

### Problema 2: DSD só Clareou sem Fazer Correções Necessárias

**Causa Raiz**: O prompt padrão foca excessivamente em clareamento. Não há instrução para MANTER proporções quando o paciente não pede mudanças estruturais.

**Código Atual** (`generate-dsd/index.ts`, linha 596-599):
```typescript
TEETH EDIT:
- Whiten all visible teeth to shade A1/A2 (natural bright white)
- Remove any stains, yellowing, or discoloration
- Make the color uniform across all teeth
- Harmonize asymmetric lateral incisors (12 vs 22) if shapes differ
```

O problema: A IA está sendo instruída a "harmonizar" formas mesmo quando isso não é apropriado, e não recebe instrução para focar nas correções ESPECÍFICAS identificadas na análise.

---

### Problema 3: Sugestões Incompletas (4 dentes em vez de 6+)

**Causa Raiz**: O prompt de análise (`generate-dsd/index.ts`, linha 918) já tem instrução de listar todos os dentes, mas falta enforcement mais forte e exemplos específicos de quando incluir caninos/pré-molares para harmonização.

**Código Atual**:
```typescript
✅ OBRIGATÓRIO: Listar TODOS os dentes que precisam de intervenção (mesmo 6-8 dentes)
```

A instrução existe, mas precisa de contexto mais claro sobre quando incluir dentes adjacentes para harmonização do arco.

---

### Problema 4: Sugestões Falsas (Restaurações/Gengivoplastia)

**Causa Raiz CRÍTICA**: A IA está "alucinando" problemas que não existem. O prompt enfatiza tanto a detecção de restaurações antigas que a IA está vendo restaurações onde não existem.

**Código Atual** (`generate-dsd/index.ts`, linha 826-858):
```typescript
=== DETECÇÃO CRÍTICA DE RESTAURAÇÕES EXISTENTES ===
ANTES de fazer qualquer elogio estético, você DEVE examinar CADA dente visível para sinais de restaurações prévias.
...
PRIORIZE sugestão de "Substituição de restauração" sobre mudanças cosméticas sutis
```

Este prompt é agressivo demais na detecção de restaurações, causando falsos positivos.

---

## Correções Propostas

### 1. Atualizar Prompts de Simulação - Preservação de Gengiva e Proporções

**Arquivo**: `supabase/functions/generate-dsd/index.ts`

Modificar TODOS os prompts de simulação (reconstruction, restoration-replacement, intraoral, standard) para incluir:

```typescript
ABSOLUTE PRESERVATION RULES:
1. LIPS: Keep lips PIXEL-PERFECT identical to original
2. GUMS: Do NOT modify gum level, shape, or contour in ANY way
3. TOOTH WIDTH: Do NOT change the width or proportions of any tooth
4. TOOTH LENGTH: Only modify if specifically requested in analysis
5. SKIN/FACE: Keep all non-dental areas identical

ONLY ALLOWED CHANGES:
- Tooth COLOR (whitening to A1/A2)
- Stain REMOVAL
- MINOR contour smoothing (NOT width changes)
```

---

### 2. Vincular Simulação às Sugestões da Análise

**Arquivo**: `supabase/functions/generate-dsd/index.ts`

Modificar a lógica de simulação para usar as sugestões da análise como guia:

```typescript
// Build specific changes from analysis suggestions
const allowedChanges = analysis.suggestions.map(s => 
  `Tooth ${s.tooth}: ${s.proposed_change}`
).join('\n');

simulationPrompt = `...
SPECIFIC CHANGES ALLOWED (from analysis):
${allowedChanges}

If a change is NOT listed above, do NOT apply it.
...`;
```

---

### 3. Reduzir Falsos Positivos de Restaurações

**Arquivo**: `supabase/functions/generate-dsd/index.ts`

Modificar o prompt de análise para ser mais conservador:

**Antes** (agressivo):
```typescript
ANTES de fazer qualquer elogio estético, você DEVE examinar CADA dente...
PRIORIZE sugestão de "Substituição de restauração" sobre mudanças cosméticas
```

**Depois** (conservador):
```typescript
DETECÇÃO DE RESTAURAÇÕES - SEJA CONSERVADOR:
- Apenas identifique restaurações se houver EVIDÊNCIA CLARA e INEQUÍVOCA
- Sinais OBRIGATÓRIOS para diagnosticar restauração:
  1. Interface CLARAMENTE visível (linha de demarcação nítida)
  2. Diferença de cor/opacidade ÓBVIA (não sutil)
  3. Pelo menos 2 dos seguintes: manchamento marginal, textura diferente, contorno artificial

SE NÃO TIVER CERTEZA, NÃO DIAGNOSTIQUE RESTAURAÇÃO.
É preferível não mencionar uma restauração existente do que inventar uma inexistente.

NUNCA DIGA: "Substituir restauração" se não houver PROVA VISUAL de restauração anterior.
```

---

### 4. Instruções para Incluir Dentes Adjacentes na Harmonização

**Arquivo**: `supabase/functions/generate-dsd/index.ts`

Adicionar ao prompt de análise:

```typescript
REGRA DE HARMONIZAÇÃO DO ARCO:
Quando identificar problemas nos incisivos centrais e laterais (11, 12, 21, 22), SEMPRE avalie:
- CANINOS (13, 23): Frequentemente precisam de volume vestibular para harmonizar corredor bucal
- PRÉ-MOLARES (14, 15, 24, 25): Avaliar se precisam de volume para preencher corredor bucal excessivo

Se 4 dentes anteriores precisam de tratamento, há alta probabilidade de que os caninos também precisem.
Inclua-os com prioridade "baixa" se a melhoria for apenas estética.
```

---

### 5. Remover Sugestão de Gengivoplastia Quando Não Indicada

**Arquivo**: `supabase/functions/generate-dsd/index.ts`

Adicionar regra explícita:

```typescript
REGRAS PARA GENGIVOPLASTIA:
❌ NUNCA sugira gengivoplastia se:
- A linha do sorriso for "média" ou "baixa" (pouca exposição gengival)
- Os zênites gengivais estiverem simétricos
- A proporção largura/altura dos dentes estiver normal (75-80%)

✅ Sugira gengivoplastia APENAS se:
- Sorriso gengival EVIDENTE (>3mm de exposição gengival)
- Zênites claramente assimétricos que afetam estética
- Dentes parecem "curtos" devido a excesso de gengiva
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/generate-dsd/index.ts` | Atualizar 4 prompts de simulação + prompt de análise |

---

## Seção Técnica: Mudanças Específicas

### Prompt de Simulação Padrão (Novo)

```typescript
simulationPrompt = `Using this smile photo, improve ONLY the teeth appearance.

=== ABSOLUTE PRESERVATION RULES ===
1. LIPS: Keep lips PIXEL-PERFECT identical to original
2. GUMS: Do NOT modify gum level, shape, contour, or color
3. TOOTH WIDTH: Maintain the exact width and proportions of each tooth
4. TOOTH SHAPE: Only apply changes from the ALLOWED list below
5. FRAMING: Keep exact same dimensions, angle, and zoom

=== CHANGES ALLOWED ===
- Whiten teeth to shade A1/A2 (natural bright white)
- Remove stains, yellowing, or discoloration
- Make color uniform across all teeth
${analysis.suggestions?.length > 0 ? 
  `\nSPECIFIC CORRECTIONS FROM ANALYSIS:\n${analysis.suggestions.map(s => 
    `- Tooth ${s.tooth}: ${s.proposed_change}`
  ).join('\n')}` : ''}
${patientDesires || ''}

=== STRICTLY FORBIDDEN ===
- Changing gum levels or contours
- Modifying tooth width or proportions
- Any changes to lips, skin, or face
- Extreme whitening (Hollywood white)

Output the edited image with EXACT same dimensions as input.`;
```

### Prompt de Análise - Seção de Restaurações (Novo)

```typescript
=== DETECÇÃO DE RESTAURAÇÕES - CRITÉRIOS RIGOROSOS ===
IMPORTANTE: Seja CONSERVADOR. Falsos positivos são piores que falsos negativos.

DIAGNOSTIQUE RESTAURAÇÃO APENAS SE:
☑️ Interface de demarcação CLARAMENTE visível (linha nítida entre materiais)
☑️ Diferença de cor/opacidade ÓBVIA e INEQUÍVOCA
☑️ PELO MENOS 2 sinais adicionais:
   - Manchamento marginal evidente
   - Textura superficial visivelmente diferente
   - Contorno artificial ou excessivamente uniforme
   - Perda de polimento localizada

SE NÃO TIVER ABSOLUTA CERTEZA → NÃO MENCIONE RESTAURAÇÃO

❌ NÃO confunda variação natural de cor com restauração
❌ NÃO confunda hipoplasia/fluorose com restauração
❌ NÃO invente restaurações - isso prejudica o planejamento clínico
```

### Prompt de Análise - Seção de Harmonização (Novo)

```typescript
=== AVALIAÇÃO COMPLETA DO ARCO DO SORRISO ===
Quando identificar necessidade de tratamento em incisivos (11, 12, 21, 22):

AVALIAÇÃO OBRIGATÓRIA DE DENTES ADJACENTES:
1. CANINOS (13, 23):
   - Corredor bucal excessivo? → Considerar volume vestibular
   - Proeminência adequada? → Avaliar harmonização
   
2. PRÉ-MOLARES (14, 15, 24, 25):
   - Visíveis ao sorrir? → Avaliar integração no arco
   - Corredor escuro lateral? → Considerar volume

REGRA: Se ≥4 dentes anteriores precisam de intervenção, SEMPRE avalie os 6-8 dentes visíveis.
```

---

## Validação Esperada

Após as correções:

1. **Simulação DSD**: Deve manter gengiva e largura dos dentes idênticas à foto original
2. **Sugestões**: Deve incluir caninos/pré-molares quando relevante para harmonização
3. **Restaurações**: Não deve diagnosticar restaurações sem evidência clara
4. **Gengivoplastia**: Não deve sugerir para casos com exposição gengival normal

---

## Testes Recomendados

1. Testar com foto do "Caso Leticia" e verificar:
   - [ ] Simulação não altera gengiva
   - [ ] Simulação não altera largura dos dentes
   - [ ] Sugestões incluem 6+ dentes se necessário
   - [ ] Não menciona restaurações inexistentes
   - [ ] Não sugere gengivoplastia sem indicação
