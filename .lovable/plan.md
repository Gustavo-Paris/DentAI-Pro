
# Plano Final: Prompt DSD Dinâmico + Simplificação do Formulário

## Resumo Executivo

Este plano alinha o formulário de preferências do paciente com a lógica de simulação DSD, removendo opções que causam alucinações e implementando um prompt dinâmico que respeita as escolhas do paciente.

---

## Parte 1: Simplificação do Formulário

### Componente PatientPreferencesStep.tsx

**Antes (6 opções + textarea):**
- Dentes mais brancos
- Sorriso mais harmonioso
- Corrigir espaçamentos/diastemas
- Dentes mais alinhados
- Formato mais natural
- Corrigir assimetrias
- Campo de texto livre

**Depois (2 opções, sem textarea):**
- Dentes mais brancos
- Corrigir espaçamentos/diastemas

### Mudanças Específicas

| Arquivo | Modificação |
|---------|-------------|
| `src/components/wizard/PatientPreferencesStep.tsx` | Remover textarea, reduzir para 2 opções, atualizar interface |
| `src/components/wizard/DSDStep.tsx` | Atualizar interface local `PatientPreferences` |
| `src/lib/schemas/evaluation.ts` | Remover `aestheticGoals` do schema |
| `src/lib/__tests__/evaluation.test.ts` | Atualizar testes para remover referências a `aestheticGoals` |
| `src/pages/NewCase.tsx` | Atualizar estado inicial e handlers |

### Nova Interface PatientPreferences

```typescript
export interface PatientPreferences {
  desiredChanges: string[];
}
```

### Novo Formulário (Visual)

```text
┌─────────────────────────────────────────────────┐
│  ❤️ Preferências do Paciente                    │
│  ✨ Opcional — personaliza a simulação visual   │
├─────────────────────────────────────────────────┤
│                                                 │
│  O que o paciente deseja?                       │
│                                                 │
│  ☐ Dentes mais brancos                          │
│  ☐ Corrigir espaçamentos/diastemas              │
│                                                 │
│  [Pular esta etapa]     [Continuar]             │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Parte 2: Prompt DSD Dinâmico

### Arquivo: supabase/functions/generate-dsd/index.ts

**Mudança 1**: Criar variáveis de instrução baseadas nas preferências (após linha ~220)

```typescript
// Determinar instrução de COR baseada nas preferências
const wantsWhiter = patientPreferences?.desiredChanges?.includes('whiter');
const colorInstruction = wantsWhiter 
  ? '- Tooth color → shade A1/A2 (natural white)'
  : '- Keep natural tooth color (remove stains only)';

// Determinar instrução de ESPAÇAMENTO
const wantsSpacing = patientPreferences?.desiredChanges?.includes('spacing');
const spacingInstruction = wantsSpacing 
  ? '- Close small gaps between teeth (max 2mm)'
  : '';
```

**Mudança 2**: Remover código não utilizado

Remover as linhas 201-220 que constroem a variável `patientDesires` que nunca é usada:
```typescript
// REMOVER ESTE BLOCO (não é mais necessário)
let patientDesires = '';
if (patientPreferences?.desiredChanges?.length) {
  const desireLabels: Record<string, string> = { ... };
  // ...
}
if (patientPreferences?.aestheticGoals) {
  patientDesires += ...
}
```

**Mudança 3**: Atualizar os 4 branches de prompt

| Branch | Linha Aprox. | Mudança |
|--------|--------------|---------|
| Reconstruction (~331) | `Whiten all teeth to A1/A2` | `${colorInstruction}` |
| Restoration (~350) | `Whiten teeth to A1/A2` | `${colorInstruction}` |
| Intraoral (~369) | `Tooth color → shade A1/A2` | `${colorInstruction}` |
| Standard (~389) | `Tooth enamel color → shade A1/A2` | `${colorInstruction}` + `${spacingInstruction}` |

### Exemplo do Prompt Standard Atualizado

```typescript
simulationPrompt = `TEETH COLOR EDIT ONLY

Task: Improve the teeth in this photo. Do NOT change anything else.

COPY EXACTLY (unchanged):
- Lips (same color, shape, texture)
- Gums (same level, color)
- Skin (unchanged)
- Tooth size (same width, length)
- Image dimensions

CHANGE ONLY:
${colorInstruction}
- Remove visible dark lines at restoration edges
- Fill small chips or defects on tooth edges
${spacingInstruction}
${allowedChangesFromAnalysis}

Output: Same photo with improved teeth only.`;
```

---

## Parte 3: Lógica de Comportamento

### Cenários de Uso

| Preferências Selecionadas | Instrução de Cor | Instrução de Espaçamento |
|---------------------------|------------------|--------------------------|
| Nenhuma | Manter cor natural (remove manchas) | (vazio) |
| Só "whiter" | Clarear para A1/A2 | (vazio) |
| Só "spacing" | Manter cor natural | Fechar espaços (max 2mm) |
| Ambos | Clarear para A1/A2 | Fechar espaços (max 2mm) |

### Fluxo de Dados

```text
PatientPreferencesStep
        │
        ▼
  desiredChanges: ['whiter', 'spacing']
        │
        ▼
   NewCase.tsx (estado)
        │
        ▼
    DSDStep.tsx
        │
        ▼
  generate-dsd Edge Function
        │
        ▼
  ┌─────────────────────────────────┐
  │ wantsWhiter = true              │
  │ colorInstruction = "A1/A2"      │
  │                                 │
  │ wantsSpacing = true             │
  │ spacingInstruction = "Close..." │
  └─────────────────────────────────┘
        │
        ▼
   Prompt Dinâmico → IA
```

---

## Parte 4: Atualizações de Testes

### evaluation.test.ts

Atualizar os testes do `patientPreferencesSchema` para refletir a remoção do campo `aestheticGoals`:

```typescript
describe('patientPreferencesSchema', () => {
  it('should accept valid preferences', () => {
    const result = patientPreferencesSchema.safeParse({
      desiredChanges: ['whiter', 'spacing'],
    });
    expect(result.success).toBe(true);
  });

  it('should accept empty preferences', () => {
    const result = patientPreferencesSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should default desiredChanges to empty array', () => {
    const result = patientPreferencesSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.desiredChanges).toEqual([]);
    }
  });
});
```

---

## Parte 5: Resumo de Arquivos a Modificar

| Arquivo | Tipo | Modificação |
|---------|------|-------------|
| `src/components/wizard/PatientPreferencesStep.tsx` | Frontend | Remover textarea, reduzir para 2 opções |
| `src/components/wizard/DSDStep.tsx` | Frontend | Atualizar interface `PatientPreferences` |
| `src/lib/schemas/evaluation.ts` | Schema | Remover campo `aestheticGoals` |
| `src/lib/__tests__/evaluation.test.ts` | Testes | Atualizar testes do schema |
| `src/pages/NewCase.tsx` | Frontend | Atualizar estado inicial e handlers |
| `supabase/functions/generate-dsd/index.ts` | Backend | Criar variáveis dinâmicas e atualizar prompts |

---

## Benefícios

1. **Formulário simplificado** - Apenas opções que funcionam
2. **Prompt permanece curto** - Apenas 1-2 linhas adicionais por preferência
3. **Respeita a escolha do paciente** - Se não marcou clareamento, mantém cor natural
4. **Sem risco de alucinação** - Removidas opções ambíguas e texto livre
5. **Retrocompatível** - Comportamento padrão mantido quando não há preferências
