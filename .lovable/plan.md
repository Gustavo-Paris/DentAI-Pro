
# Plano: Melhorias no DSD - Formulário Simplificado + Correções Básicas Consistentes

## Problemas Identificados

### 1. Formulário de Preferências
O usuário identificou que:
- **"Corrigir espaçamentos/diastemas"** não faz sentido como opção — sempre deve ser corrigido automaticamente
- Apenas **"Dentes mais brancos"** é uma preferência real do paciente (natural vs branco)

### 2. Correções Básicas Não Aplicadas
A simulação está:
- ✅ Mantendo proporções da boca (lábios, gengiva)
- ❌ **NÃO** corrigindo defeitos estruturais básicos (ex: "buraquinho" no dente lateral)
- ❌ Apenas clareando os dentes sem fazer o "feijão com arroz"

### 3. "Nova Simulação" Gerando Resultados Distorcidos
Quando clica em **"Nova Simulação"**, o resultado fica distorcido porque:
- O `handleRegenerateSimulation` não está passando as `patientPreferences`
- Sem as preferências, a instrução de cor fica diferente
- A simulação perde contexto e gera resultados inconsistentes

## Solução Proposta

### Parte 1: Simplificar Formulário

Remover completamente a opção "Corrigir espaçamentos/diastemas" e deixar apenas:
- ☐ **Dentes mais brancos** — Se marcado, clareia para A1/A2; se não, mantém cor natural

O fechamento de diastemas será sempre aplicado automaticamente (não é preferência, é correção clínica).

### Parte 2: Melhorar Prompt de Correções Básicas

Atualizar o prompt `STANDARD` para ser mais explícito sobre correções estruturais:

```text
MANDATORY BASIC CORRECTIONS (always apply):
- Remove stains and discolorations
- Fill small chips, holes, or defects on tooth edges
- Close small gaps between teeth (up to 2mm)
- Remove visible dark lines at restoration margins
- Smooth irregular enamel surfaces
```

Isso garante que o "feijão com arroz" sempre seja feito, independente das preferências.

### Parte 3: Corrigir "Nova Simulação"

O problema está no `handleRegenerateSimulation` (linha 277-318) que **não passa as `patientPreferences`** para a Edge Function:

```typescript
// ATUAL - SEM preferências
const { data, error: fnError } = await invokeFunction<DSDResult>('generate-dsd', {
  body: {
    imageBase64,
    regenerateSimulationOnly: true,
    existingAnalysis: result.analysis,
    toothShape: TOOTH_SHAPE,
    // ❌ FALTA: patientPreferences
  },
});
```

Isso faz com que na regeneração, a variável `wantsWhiter` seja `false` (mesmo que o usuário tenha marcado), gerando um resultado diferente.

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/components/wizard/PatientPreferencesStep.tsx` | Remover opção "spacing", deixar apenas "whiter" |
| `src/components/wizard/DSDStep.tsx` | Passar `patientPreferences` no `handleRegenerateSimulation` |
| `supabase/functions/generate-dsd/index.ts` | Atualizar prompt para aplicar correções básicas sempre |

## Detalhes Técnicos

### PatientPreferencesStep.tsx

```typescript
// ANTES: 2 opções
const DESIRED_CHANGES_OPTIONS = [
  { id: 'whiter', label: 'Dentes mais brancos' },
  { id: 'spacing', label: 'Corrigir espaçamentos/diastemas' },
];

// DEPOIS: 1 opção apenas
const DESIRED_CHANGES_OPTIONS = [
  { id: 'whiter', label: 'Dentes mais brancos' },
];
```

### DSDStep.tsx - handleRegenerateSimulation

```typescript
// CORRIGIR - Adicionar patientPreferences
const handleRegenerateSimulation = async () => {
  if (!imageBase64 || !result?.analysis) return;

  setIsRegeneratingSimulation(true);
  setSimulationError(false);

  try {
    const { data, error: fnError } = await invokeFunction<DSDResult>('generate-dsd', {
      body: {
        imageBase64,
        regenerateSimulationOnly: true,
        existingAnalysis: result.analysis,
        toothShape: TOOTH_SHAPE,
        patientPreferences, // ✅ ADICIONAR ISSO
      },
    });
    // ...
  }
};
```

### generate-dsd/index.ts - Prompt Standard

```typescript
// ANTES: Correções dependiam de preferências
const spacingInstruction = wantsSpacing 
  ? '\n- Close small gaps between teeth (max 2mm)'
  : '';

// DEPOIS: Correções básicas SEMPRE aplicadas
const mandatoryCorrections = `
- Remove stains and discolorations
- Fill small holes, chips or defects on tooth edges
- Close small gaps between teeth (up to 2mm)
- Remove visible dark lines at restoration margins
- Smooth irregular enamel surfaces`;

// Prompt atualizado
simulationPrompt = `TEETH EDIT ONLY

Task: Improve the teeth in this photo. Do NOT change anything else.

COPY EXACTLY (unchanged):
- Lips (same color, shape, texture)
- Gums (same level, color)
- Skin (unchanged)
- Tooth size (same width, length)
- Image dimensions

MANDATORY CORRECTIONS (always apply):
${mandatoryCorrections}

COLOR ADJUSTMENT:
${colorInstruction}

SPECIFIC CORRECTIONS FROM ANALYSIS:
${allowedChangesFromAnalysis}

Output: Same photo with improved teeth only.`;
```

## Fluxo Visual Atualizado

```text
┌─────────────────────────────────────────────────┐
│  ❤️ Preferências do Paciente                    │
│  ✨ Opcional — personaliza a simulação visual   │
├─────────────────────────────────────────────────┤
│                                                 │
│  O paciente deseja dentes mais brancos?         │
│                                                 │
│  ☐ Sim, clarear para tom natural A1/A2          │
│                                                 │
│  [Pular esta etapa]     [Continuar]             │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Comportamento Final

| Preferência | Cor | Correções Básicas |
|-------------|-----|-------------------|
| Nenhuma | Manter natural | ✅ Sempre aplicadas |
| "Whiter" | Clarear A1/A2 | ✅ Sempre aplicadas |

### Correções que SEMPRE serão aplicadas:
1. Remover manchas e descolorações
2. Preencher buracos, chips ou defeitos nas bordas dos dentes
3. Fechar pequenos espaços (até 2mm)
4. Remover linhas escuras em margens de restaurações
5. Suavizar superfícies irregulares do esmalte

## Benefícios

1. **Formulário ultra-simplificado** — apenas 1 opção binária (branco ou natural)
2. **"Feijão com arroz" garantido** — correções básicas sempre aplicadas
3. **"Nova Simulação" consistente** — mesmo resultado que a primeira geração
4. **Menos confusão para o usuário** — menos opções = menos dúvidas
5. **Resultados mais realistas** — defeitos estruturais sempre corrigidos
