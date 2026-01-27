

# Plano: Integrar Preferências do Paciente no Protocolo de Estratificação

## Resumo

Atualmente, as preferências do paciente (como "dentes mais brancos") são coletadas no wizard e salvas no banco de dados, mas **não são enviadas** para a Edge Function `recommend-resin`. Isso resulta em um desalinhamento entre a simulação DSD (que já considera o clareamento) e o protocolo técnico de estratificação.

Este plano corrige essa lacuna, fazendo com que a IA sugira cores 1-2 tons mais claras quando o paciente deseja dentes mais brancos.

---

## Arquitetura Atual vs. Proposta

```text
FLUXO ATUAL:
+------------------+    +-------------------+    +------------------+
| PatientPrefs     | -> | evaluations table | -> | recommend-resin  |
| (desiredChanges) |    | patient_desired_  |    | (ignora prefs)   |
|                  |    | changes: saved    |    |                  |
+------------------+    +-------------------+    +------------------+
                                                          |
                                                          v
                                                 Cores baseadas apenas
                                                 na cor VITA detectada

FLUXO PROPOSTO:
+------------------+    +-------------------+    +------------------+
| PatientPrefs     | -> | evaluations table | -> | recommend-resin  |
| (desiredChanges) |    | patient_desired_  |    | (recebe prefs)   |
|                  |    | changes: saved    |    |                  |
+------------------+    +-------------------+    +------------------+
                                                          |
                                                          v
                                                 Cores ajustadas 1-2
                                                 tons mais claras se
                                                 "whiter" selecionado
```

---

## Mudanças Necessárias

### 1. Atualizar Schema de Validação (Edge Function)

**Arquivo:** `supabase/functions/_shared/validation.ts`

Adicionar campo opcional `desiredChanges` na interface `EvaluationData`:

```typescript
export interface EvaluationData {
  // ... campos existentes
  desiredChanges?: string[]; // ['whiter', 'spacing', 'asymmetry', etc.]
}
```

Atualizar função `validateEvaluationData` para aceitar o novo campo:

```typescript
// Optional array of strings
if (obj.desiredChanges !== undefined) {
  if (!Array.isArray(obj.desiredChanges)) {
    return { success: false, error: "Preferências do paciente inválidas" };
  }
  // Validate each item is a string
  for (const change of obj.desiredChanges) {
    if (typeof change !== "string") {
      return { success: false, error: "Preferência inválida" };
    }
  }
}
```

---

### 2. Enviar Preferências para a Edge Function

**Arquivo:** `src/pages/NewCase.tsx`

Modificar a chamada da função `recommend-resin` (linhas 562-579) para incluir as preferências do paciente:

```typescript
case 'resina':
  const { error: aiError } = await supabase.functions.invoke('recommend-resin', {
    body: {
      evaluationId: evaluation.id,
      userId: user.id,
      patientAge: formData.patientAge,
      tooth: tooth,
      region: getFullRegion(tooth),
      cavityClass: toothData?.cavity_class || formData.cavityClass,
      restorationSize: toothData?.restoration_size || formData.restorationSize,
      substrate: toothData?.substrate || formData.substrate,
      bruxism: formData.bruxism,
      aestheticLevel: formData.aestheticLevel,
      toothColor: formData.vitaShade,
      stratificationNeeded: true,
      budget: formData.budget,
      longevityExpectation: formData.longevityExpectation,
      // NOVO: Adicionar preferências do paciente
      desiredChanges: patientPreferences.desiredChanges,
    },
  });
```

---

### 3. Modificar o Prompt da AI na Edge Function

**Arquivo:** `supabase/functions/recommend-resin/index.ts`

#### 3.1 Adicionar seção de preferências do paciente no prompt

Criar uma nova seção condicional no prompt após os dados clínicos:

```typescript
// Build patient preferences section
const hasWhiteningPreference = data.desiredChanges?.includes('whiter');
const patientPreferencesSection = data.desiredChanges && data.desiredChanges.length > 0 
  ? `
=== PREFERÊNCIAS ESTÉTICAS DO PACIENTE ===
${data.desiredChanges.map(pref => {
  const labels: Record<string, string> = {
    'whiter': 'Deseja dentes mais brancos',
    'spacing': 'Deseja corrigir espaçamentos',
    'asymmetry': 'Deseja corrigir assimetria',
    'stains': 'Deseja remover manchas',
    'shape': 'Deseja melhorar formato dos dentes',
  };
  return `- ${labels[pref] || pref}`;
}).join('\n')}

${hasWhiteningPreference ? `
⚠️ REGRA DE COR PARA CLAREAMENTO:
Como o paciente deseja dentes mais brancos, as cores das camadas devem ser 
1-2 tons mais claras que a cor VITA detectada (${data.toothColor}).

MAPEAMENTO DE CLAREAMENTO:
- A3 → usar cores A2 ou A1
- A2 → usar cores A1 ou BL4  
- A1 → usar cores BL4 ou BL3
- B2 → usar cores B1 ou A1
- C2 → usar cores C1 ou B1

Exemplo: Se cor detectada é A2 e paciente quer mais branco:
- Opaco: OA1 (não OA2)
- Dentina: A1D (não A2D)
- Esmalte: A1E ou BL4 (não A2E)

IMPORTANTE: 
- Incluir no checklist "Seleção de cor 1-2 tons mais clara conforme preferência do paciente"
- Incluir alerta sobre expectativa de clareamento progressivo com próximos tratamentos
` : ''}
`
  : '';
```

#### 3.2 Inserir seção no prompt principal

```typescript
const prompt = `Você é um especialista em materiais dentários...

${budgetRulesSection}

CASO CLÍNICO:
- Idade do paciente: ${data.patientAge} anos
... (dados existentes)
${data.clinicalNotes ? `- Observações clínicas: ${data.clinicalNotes}` : ''}

${patientPreferencesSection}

${resinsByPriceSection}
...
`;
```

#### 3.3 Atualizar instruções de estratificação

Modificar a seção "INSTRUÇÕES PARA PROTOCOLO DE ESTRATIFICAÇÃO":

```typescript
INSTRUÇÕES PARA PROTOCOLO DE ESTRATIFICAÇÃO:
1. Se o substrato estiver escurecido/manchado, SEMPRE inclua camada de opaco
2. Para casos estéticos (anteriores), use 3 camadas: Opaco (se necessário), Dentina, Esmalte
3. Para posteriores com alta demanda estética, considere estratificação
4. Para posteriores simples, pode recomendar técnica bulk ou incrementos simples
5. Adapte as cores das camadas baseado na cor VITA informada (ex: A2 → OA2 opaco, A2D dentina, A2E esmalte)
6. **SE O PACIENTE DESEJA DENTES MAIS BRANCOS**: Usar cores 1-2 tons mais claras que a cor VITA detectada
```

---

## Seção Técnica

### Arquivos Modificados

| Arquivo | Tipo de Mudança |
|---------|-----------------|
| `supabase/functions/_shared/validation.ts` | Adicionar campo `desiredChanges` na interface e validação |
| `src/pages/NewCase.tsx` | Passar `desiredChanges` na chamada da edge function |
| `supabase/functions/recommend-resin/index.ts` | Construir seção de preferências e ajustar prompt |

### Impacto no Banco de Dados

**Nenhuma migração necessária** - o campo `patient_desired_changes` já existe na tabela `evaluations` e já está sendo preenchido.

### Testes Recomendados

1. Criar caso com preferência "whiter" e verificar se cores são mais claras
2. Criar caso sem preferências e verificar comportamento padrão
3. Criar caso com A3 + "whiter" → esperar cores A2/A1
4. Criar caso com A1 + "whiter" → esperar cores BL4/BL3

### Edge Cases

- Se a cor detectada já é BL1 (mais clara possível), manter BL1
- Se múltiplas preferências conflitantes, priorizar clareamento
- Alertar no protocolo sobre limitações de clareamento apenas com resina

---

## Resultado Esperado

Após implementação, quando um paciente selecionar "Dentes mais brancos":

**Antes:**
```
Camada 1: Opaco OA2, Camada 2: Dentina A2D, Camada 3: Esmalte A2E
```

**Depois:**
```
Camada 1: Opaco OA1, Camada 2: Dentina A1D, Camada 3: Esmalte A1E
+ Alerta: "Cor selecionada 1 tom mais clara conforme preferência do paciente"
+ Checklist: "Confirmar expectativa de cor mais clara com paciente"
```

