
# Plano: Simplificar DSD - Preferencias Diretas + Prompt Limpo

## Problema Diagnosticado

Voce esta certo: estamos **complicando demais** os prompts e ficando pior. O fluxo atual:

1. Paciente escreve texto livre ("dentes mais brancos e harmonicos")
2. AI analisa texto e extrai instrucoes complexas (colorInstruction, textureInstruction, styleNotes)
3. Prompt fica gigante com muitas regras conflitantes
4. Modelo de imagem se confunde e executa correcoes erradas

### Problemas Especificos:
- `allowedChangesFromAnalysis` FORCA todas as sugestoes da analise na simulacao
- Texto livre cria ambiguidade ("harmonico" vira "fechar diastema")
- Prompt muito longo com muitas instrucoes = modelo ignora as importantes

---

## Solucao: Simplificar para 3 Opcoes Claras

### Novo Fluxo:

```text
1. FOTO → Analise DSD (visagismo, sugestoes, proporcoes)
   
2. PREFERENCIAS → Usuario escolhe APENAS nivel de clareamento:
   □ Natural (A1/A2 - sutil)
   □ Branco (BL1/BL2 - notavel)  
   □ Hollywood (BL3 - intenso)
   
3. SIMULACAO → Prompt simples e direto:
   - Aplicar visagismo sugerido pela analise
   - Aplicar nivel de clareamento escolhido
   - PRESERVAR: labios, gengiva, pele
   - NAO criar dente onde nao existe
   - NAO aumentar largura alem do clinicamente possivel
```

---

## Mudancas Tecnicas

### Arquivo 1: `src/components/wizard/PatientPreferencesStep.tsx`

Trocar textarea por 3 botoes simples:

```tsx
export interface PatientPreferences {
  whiteningLevel: 'natural' | 'white' | 'hollywood';
}

// Interface com 3 cards clicaveis:
// [Natural] [Branco] [Hollywood]
// Com imagens de exemplo de cada nivel
```

### Arquivo 2: `src/pages/NewCase.tsx`

Atualizar estado para novo formato:

```tsx
const [patientPreferences, setPatientPreferences] = useState<PatientPreferences>({ 
  whiteningLevel: 'natural' 
});
```

### Arquivo 3: `supabase/functions/generate-dsd/index.ts`

**Mudanca 1**: Remover `analyzePatientPreferences()` - nao precisa mais de AI para interpretar texto

**Mudanca 2**: Simplificar prompt para ser CURTO e DIRETO:

```typescript
// Mapear nivel escolhido para instrucao SIMPLES
const whiteningInstructions = {
  natural: "Make teeth 1-2 shades lighter (A1/A2). Subtle, natural whitening.",
  white: "Make teeth clearly whiter (BL1/BL2). Noticeable but not extreme.",
  hollywood: "Make teeth bright white (BL3). Hollywood smile effect."
};

const whiteningLevel = patientPreferences?.whiteningLevel || 'natural';
const whiteningText = whiteningInstructions[whiteningLevel];

// PROMPT SIMPLIFICADO (muito mais curto)
simulationPrompt = `DENTAL SMILE SIMULATION

PRESERVE EXACTLY (do not modify):
- Lips, gums, skin, background
- Image dimensions and framing

APPLY THESE CHANGES TO TEETH ONLY:
1. WHITENING: ${whiteningText}
2. Apply the smile design improvements suggested in the analysis (close small gaps, level edges, harmonize proportions)

CONSTRAINTS:
- Do NOT create teeth where none exist
- Do NOT make teeth wider than clinically possible
- Keep natural tooth anatomy

Output: Same photo with improved teeth only.`;
```

**Mudanca 3**: Manter `allowedChangesFromAnalysis` mas FILTRAR para nao incluir mudancas impossiveis:

```typescript
// Filtrar sugestoes para remover as clinicamente impossiveis
const clinicallyPossibleChanges = analysis.suggestions.filter(s => {
  const change = s.proposed_change.toLowerCase();
  // Remover: criar dente onde nao existe, alargar alem do possivel
  return !change.includes('implante') && 
         !change.includes('protese') &&
         !change.includes('coroa total');
});
```

---

## Comparacao: Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Entrada do usuario | Texto livre (500 chars) | 3 opcoes claras |
| Processamento | AI analisa texto (8s extra) | Direto, sem AI |
| Tamanho do prompt | ~2000 caracteres | ~500 caracteres |
| Instrucoes | Multiplas regras conflitantes | Poucas regras claras |
| Clareamento | Pode ser ignorado | Sempre aplicado |
| Correcoes estruturais | Todas aplicadas | Filtradas clinicamente |

---

## UI Nova - PatientPreferencesStep

Tres cards visuais:

```text
┌─────────────────────────────────────────────────────────┐
│                 Nivel de Clareamento                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐           │
│  │           │  │           │  │           │           │
│  │  [img]    │  │  [img]    │  │  [img]    │           │
│  │           │  │           │  │           │           │
│  │  Natural  │  │  Branco   │  │ Hollywood │           │
│  │  (A1/A2)  │  │ (BL1/BL2) │  │  (BL3)    │           │
│  └───────────┘  └───────────┘  └───────────┘           │
│                                                         │
│  [ Continuar ]                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Resultado Esperado

1. **Clareamento sempre aplicado**: Opcao clara, sem interpretacao de texto
2. **Estrutura preservada**: Prompt nao manda "fechar gaps" automaticamente
3. **Visagismo aplicado**: Sugestoes da analise ainda sao usadas, mas filtradas
4. **Prompt curto**: Modelo entende melhor instrucoes simples
5. **Menos variacao**: Resultado mais consistente entre regeneracoes

---

## Implementacao Tecnica

### Arquivos a Modificar:

1. **`src/components/wizard/PatientPreferencesStep.tsx`**
   - Substituir textarea por 3 cards de selecao
   - Atualizar interface `PatientPreferences`

2. **`src/pages/NewCase.tsx`**
   - Atualizar estado inicial de `patientPreferences`
   - Ajustar tipo para novo formato

3. **`supabase/functions/generate-dsd/index.ts`**
   - Remover funcao `analyzePatientPreferences()` (linhas 196-323)
   - Simplificar prompts de simulacao (linhas 380-612)
   - Adicionar mapeamento direto de nivel → instrucao
   - Filtrar `allowedChangesFromAnalysis` para remover impossibilidades clinicas

4. **`src/components/wizard/DSDStep.tsx`**
   - Atualizar interface para novo formato de preferencias
