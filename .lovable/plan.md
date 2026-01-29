

# Plano Final de Melhorias - Consolidado

Este plano consolida todas as melhorias solicitadas nas análises anteriores.

---

## Resumo Executivo

| # | Problema | Arquivo | Prioridade |
|---|----------|---------|------------|
| 1 | **Cores do protocolo não seguem preferência de clareamento** | `recommend-resin/index.ts` | Alta |
| 2 | **Lista mostra "Classe" para procedimentos estéticos** | `EvaluationDetails.tsx` | Alta |
| 3 | **IA não detecta gengivoplastia necessária** | `analyze-dental-photo/index.ts` | Alta |
| 4 | **IA não detecta resinas/restaurações existentes** | `analyze-dental-photo/index.ts` | Alta |
| 5 | **Diagnóstico errado de "micro-dentes"** | `analyze-dental-photo/index.ts` | Média |
| 6 | **Interface do Review Step confusa** | `ReviewAnalysisStep.tsx` | Baixa |

---

## Problema 1: Cores do Protocolo Inconsistentes (CRÍTICO)

**Situação Atual:**
- O card "Preferência de Clareamento" mostra: `A1 → BL4, BL3` (correto)
- O protocolo de estratificação mostra: `OA1, A1` (errado)

**Causa Raiz:**
O prompt na linha 267 do `recommend-resin/index.ts` é muito vago:
```
- Preferência do paciente: Dentes mais brancos (ajustar cor 1-2 tons mais claros)
```

A IA ignora essa instrução e usa a cor original.

**Solução:**
Adicionar o mesmo mapeamento de cores do frontend ao Edge Function e incluir instrução explícita no prompt:

```typescript
// Mapeamento de cores VITA para clareamento (linha ~140)
const whiteningColorMap: Record<string, string[]> = {
  'A4': ['A3', 'A2'],
  'A3.5': ['A2', 'A1'],
  'A3': ['A2', 'A1'],
  'A2': ['A1', 'BL4'],
  'A1': ['BL4', 'BL3'],
  'B4': ['B3', 'B2'],
  'B3': ['B2', 'B1'],
  'B2': ['B1', 'A1'],
  'B1': ['A1', 'BL4'],
  'C4': ['C3', 'C2'],
  'C3': ['C2', 'C1'],
  'C2': ['C1', 'B1'],
  'C1': ['B1', 'A1'],
  'D4': ['D3', 'D2'],
  'D3': ['D2', 'A3'],
  'D2': ['A2', 'A1'],
  'BL4': ['BL3', 'BL2'],
  'BL3': ['BL2', 'BL1'],
  'BL2': ['BL1'],
  'BL1': [],
};

// No prompt (linha ~267), substituir instrução vaga por:
${data.desiredChanges?.includes('whiter') ? `
⚠️ PREFERÊNCIA DE CLAREAMENTO - REGRA OBRIGATÓRIA ⚠️
O paciente deseja dentes mais brancos.
- Cor detectada: ${data.toothColor}
- CORES OBRIGATÓRIAS NO PROTOCOLO: ${adjustedColors.join(' ou ')}

VOCÊ DEVE:
- Camada Opaco/Dentina: Usar O${adjustedColors[0]} ou D${adjustedColors[0]}
- Camada Esmalte: Usar E${adjustedColors[0]} ou ${adjustedColors[1]}

❌ NÃO USE: ${data.toothColor}, O${data.toothColor}, D${data.toothColor}, E${data.toothColor}
✅ USE APENAS: ${adjustedColors.join(', ')} e suas variações (O, D, E)
` : ''}
```

---

## Problema 2: Lista Mostra "Classe" para Procedimentos Estéticos

**Situação Atual:**
Na tela de detalhes, a coluna "Detalhes" mostra `Classe I • Média` mesmo quando o procedimento é "Faceta Direta" ou "Recontorno Estético".

**Causa Raiz:**
O código na linha 327-332 de `EvaluationDetails.tsx` sempre exibe `cavity_class + restoration_size` para tratamento tipo "resina", sem verificar se é um procedimento estético.

**Solução:**
Modificar a função `getClinicalDetails`:

```typescript
// Adicionar lista de procedimentos estéticos (linha ~113)
const AESTHETIC_PROCEDURES = [
  'Faceta Direta', 
  'Recontorno Estético', 
  'Fechamento de Diastema', 
  'Reparo de Restauração'
];

// Modificar getClinicalDetails (linha 327)
const getClinicalDetails = (evaluation: EvaluationItem): string => {
  const treatmentType = evaluation.treatment_type || 'resina';
  const config = treatmentConfig[treatmentType];
  
  if (config?.showCavityInfo) {
    // Verificar se é procedimento estético (não classe de cavidade)
    if (AESTHETIC_PROCEDURES.includes(evaluation.cavity_class)) {
      return evaluation.cavity_class; // Mostra "Faceta Direta" diretamente
    }
    return `Classe ${evaluation.cavity_class} • ${evaluation.restoration_size}`;
  }
  
  return evaluation.ai_treatment_indication || config?.label || '-';
};
```

**Resultado:**
- Antes: `Classe I • Média` (para Faceta Direta)
- Depois: `Faceta Direta`

---

## Problema 3: IA Não Detecta Gengivoplastia

**Situação Atual:**
O sistema não sugere gengivoplastia quando laterais parecem "curtos" mas poderiam ter coroa clínica aumentada.

**Solução:**
Adicionar ao `systemPrompt` do `analyze-dental-photo/index.ts` (após linha 241):

```text
## ANÁLISE GENGIVAL E PERIODONTAL

Avalie o contorno gengival para CADA dente visível:

1. **Coroas Clínicas Curtas**
   - Identifique dentes com proporção altura/largura inadequada
   - Se laterais parecem "pequenos", considere se gengivoplastia aumentaria a coroa clínica
   - Inclua em notes: "Gengivoplastia recomendada para aumentar coroa clínica"

2. **Assimetria Gengival**
   - Compare dentes homólogos (12 vs 22, 13 vs 23)
   - Note diferenças de altura gengival > 1mm

3. **Exposição Gengival Excessiva**
   - Sorriso gengival > 3mm: considerar encaminhamento para periodontia
   - Inclua em warnings se detectado

Se gengivoplastia melhoraria proporções:
- Inclua em notes do dente: "Considerar gengivoplastia prévia"
- Inclua em observations gerais: "Avaliação periodontal recomendada para otimizar proporções"
```

---

## Problema 4: IA Não Detecta Restaurações Existentes

**Situação Atual:**
O sistema não identifica restaurações de resina antigas que podem estar falhando.

**Solução:**
Adicionar ao `systemPrompt` (após a seção gengival):

```text
## DETECÇÃO DE RESTAURAÇÕES EXISTENTES (CRÍTICO)

OBSERVE atentamente por sinais de restaurações prévias:

1. **Sinais Visuais**
   - Linhas de interface (fronteira resina-esmalte)
   - Diferença de cor entre regiões do mesmo dente
   - Diferença de textura (mais opaco, mais liso)
   - Manchamento localizado ou escurecimento marginal

2. **Como Registrar**
   Se detectar restauração existente:
   - enamel_condition: "Restauração prévia"
   - notes: "Restauração em resina existente - avaliar necessidade de substituição"
   - treatment_indication: "resina" (para reparo/substituição)
   - indication_reason: "Restauração antiga com [descrever problema: manchamento/infiltração/fratura marginal]"

3. **Implicações Clínicas**
   - Restaurações antigas podem mascarar o tamanho real do dente
   - Não confundir dente restaurado com "micro-dente"
   - Considerar remoção da resina antiga no planejamento
```

---

## Problema 5: Diagnóstico Errado de "Micro-dentes"

**Situação Atual:**
A IA às vezes classifica dentes com fraturas ou restaurações antigas como "micro-dentes" ou "dentes anômalos".

**Solução:**
Adicionar ao `systemPrompt`:

```text
## CUIDADO COM DIAGNÓSTICOS PRECIPITADOS

⚠️ NUNCA diagnostique "micro-dente" ou "dente anômalo" se:

1. O dente apresenta FRATURA visível (incisal, proximal)
2. Há sinais de RESTAURAÇÃO antiga (linhas de interface, manchamento)
3. A proporção menor é devido a DESGASTE ou EROSÃO
4. Houve FRATURA + restauração prévia que encurtou o dente

✅ Nesses casos, indique:
- cavity_class: Classe apropriada para a restauração
- notes: "Fratura presente - não confundir com anomalia dental"
- notes: "Restauração antiga visível - tamanho real pode ser maior"
- treatment_indication: "resina" (reparo/reconstrução)

❌ Apenas use "micro-dente" ou "dente anômalo" se:
- O dente claramente nunca erupcionou em tamanho normal
- Não há evidência de trauma ou restauração prévia
- A forma é uniformemente pequena (não apenas encurtado)
```

---

## Problema 6: Interface do Review Step (Menor Prioridade)

**Situação Atual:**
Quando procedimento estético é selecionado, ainda aparecem informações de "Classe • Tamanho" que não fazem sentido.

**Solução:**
No `ReviewAnalysisStep.tsx`, na exibição de dados do dente selecionado, ocultar campos de "Classe" e "Tamanho" quando o procedimento é estético.

A lógica `isAestheticProcedure` já existe (linhas 150-155). Usar essa função para condicionar a exibição.

---

## Arquivos a Modificar

| Arquivo | Modificações | Linhas Estimadas |
|---------|--------------|------------------|
| `supabase/functions/recommend-resin/index.ts` | Adicionar mapeamento de cores e instrução explícita no prompt | +40 linhas |
| `src/pages/EvaluationDetails.tsx` | Adicionar verificação de procedimento estético em `getClinicalDetails` | +10 linhas |
| `supabase/functions/analyze-dental-photo/index.ts` | Adicionar 3 novas seções ao systemPrompt | +60 linhas |
| `src/components/wizard/ReviewAnalysisStep.tsx` | Ocultar campos irrelevantes para procedimentos estéticos | +5 linhas |

---

## Ordem de Implementação

1. **Primeiro:** Corrigir cores do protocolo de estratificação (Problema 1) - impacto clínico direto
2. **Segundo:** Corrigir lista de casos (Problema 2) - visualmente incorreto
3. **Terceiro:** Melhorar prompt de análise (Problemas 3, 4, 5) - diagnóstico mais preciso
4. **Quarto:** Ajustar interface do Review Step (Problema 6) - polimento final

---

## Validação Pós-Implementação

Após implementar, testar:

1. **Cores:** Criar caso com preferência "dentes mais brancos" e cor A1 → protocolo deve mostrar BL4/BL3
2. **Lista:** Criar caso com "Faceta Direta" → deve aparecer "Faceta Direta" na lista, não "Classe X"
3. **Análise:** Enviar foto com restauração antiga visível → IA deve detectar "Restauração prévia"
4. **Gengivoplastia:** Enviar foto com lateral curto → IA deve sugerir gengivoplastia em notes

