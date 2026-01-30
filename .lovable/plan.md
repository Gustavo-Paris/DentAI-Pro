
# Plano: Campo de Texto Livre para Preferências do Paciente

## Contexto

A proposta é substituir os checkboxes limitados por um **campo de texto livre** onde o dentista pode escrever o que o paciente deseja em suas próprias palavras. O modelo Pro analisará este texto e aplicará as preferências clinicamente.

**Vantagens:**
- Flexibilidade total (não limitado a opções predefinidas)
- Aproveita a capacidade de compreensão contextual do modelo Pro
- Captura nuances que checkboxes não conseguem ("quer parecer mais jovem mas natural")
- Já existe coluna `patient_aesthetic_goals` (text) pronta no banco

---

## Arquivos a Modificar

### 1. Componente de Preferências
**Arquivo:** `src/components/wizard/PatientPreferencesStep.tsx`

Substituir os checkboxes por um textarea:
- Remover array `desiredChanges` 
- Adicionar campo `aestheticGoals` (string)
- Placeholder com exemplos para guiar o dentista
- Limite de 500 caracteres
- Botão "Continuar" habilitado quando há texto

### 2. Schema de Validação
**Arquivo:** `src/lib/schemas/evaluation.ts`

Atualizar o schema de preferências:
- Remover `desiredChanges: z.array(z.string())`
- Adicionar `aestheticGoals: z.string().max(500).optional()`

### 3. Interface do Componente
**Arquivo:** `src/components/wizard/PatientPreferencesStep.tsx`

Atualizar a interface:
```text
PatientPreferences {
  aestheticGoals: string;  // Nova estrutura
}
```

### 4. Página NewCase
**Arquivo:** `src/pages/NewCase.tsx`

- Atualizar estado inicial de `patientPreferences`
- Alterar mapeamento para `patient_aesthetic_goals` no insert
- Passar `aestheticGoals` para a Edge Function em vez de `desiredChanges`

### 5. Edge Function (Validação)
**Arquivo:** `supabase/functions/_shared/validation.ts`

- Alterar validação de `desiredChanges` (array) para `aestheticGoals` (string)
- Limite de 1000 caracteres

### 6. Edge Function (Prompt)
**Arquivo:** `supabase/functions/recommend-resin/index.ts`

Substituir a seção de preferências no prompt:
- Remover lógica de `desiredChanges.includes('whiter')`
- Inserir o texto livre diretamente no contexto da IA
- Instruir a IA a extrair e aplicar as preferências descritas

### 7. Página de Resultado
**Arquivo:** `src/pages/Result.tsx`

- Remover mapeamento de labels (`whiter` → "Dentes mais brancos")
- Exibir o texto livre diretamente como citação
- Manter o alerta de clareamento detectando palavras-chave no texto

### 8. Alerta de Clareamento
**Arquivo:** `src/components/protocol/WhiteningPreferenceAlert.tsx`

- Atualizar prop para receber texto em vez de boolean
- Detectar preferência de clareamento por palavras-chave no texto ("branco", "claro", "clarear")

### 9. Testes
**Arquivo:** `src/lib/__tests__/evaluation.test.ts`

- Atualizar testes para nova estrutura
- Testar validação de texto livre

---

## Detalhes Técnicos

### Exemplo de UI do Textarea

```text
┌─────────────────────────────────────────────────────────────┐
│  💬 O que o paciente deseja?                                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Exemplo: "Gostaria de dentes mais brancos e         │   │
│  │ naturais, sem parecer artificial. Preocupado com    │   │
│  │ sensibilidade."                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  0/500 caracteres                                           │
└─────────────────────────────────────────────────────────────┘
```

### Exemplo de Prompt para IA

```text
═══════════════════════════════════════════════════════════════
  PREFERÊNCIAS ESTÉTICAS DO PACIENTE
═══════════════════════════════════════════════════════════════

O paciente expressou os seguintes desejos:
"Gostaria de dentes mais brancos mas naturais, sem parecer 
artificial. Tenho sensibilidade."

INSTRUÇÕES:
- Analise o texto acima e extraia as preferências estéticas
- Se mencionar clareamento/branco: ajuste cores 1-2 tons mais claros
- Se mencionar natural: priorize translucidez e mimetismo
- Se mencionar sensibilidade: considere sistemas self-etch
- Aplique todas as preferências identificadas no protocolo
═══════════════════════════════════════════════════════════════
```

### Detecção de Clareamento para Alerta Visual

A função detectará palavras-chave para mostrar o alerta:
- "branco", "brancos", "branca"
- "claro", "claros", "clarear", "clareamento"
- "mais claro", "mais branco"

---

## Fluxo de Implementação

1. Atualizar interface e componente `PatientPreferencesStep`
2. Atualizar schema Zod
3. Atualizar `NewCase.tsx` para usar nova estrutura
4. Atualizar validação na Edge Function
5. Atualizar prompt da IA na Edge Function
6. Atualizar `WhiteningPreferenceAlert` para detectar por texto
7. Atualizar exibição em `Result.tsx`
8. Atualizar testes
9. Deploy da Edge Function
10. Testar fluxo completo

---

## Considerações

- **Retrocompatibilidade**: Casos antigos que usam `patient_desired_changes` continuam funcionando
- **Banco de dados**: Já existe a coluna `patient_aesthetic_goals` (text) - não precisa migração
- **Limite**: 500 caracteres é suficiente para descrição detalhada sem ser verboso
- **UX**: Placeholder com exemplos guia o dentista sem limitar criatividade
