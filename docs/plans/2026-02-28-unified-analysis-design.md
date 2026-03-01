# Unified Analysis Pipeline Design

> Consolidar análise clínica (analyze-dental-photo) e estética (generate-dsd/analysis) em uma única chamada AI, eliminando redundância, conflitos de dados e complexidade de merge.

## Problema

O pipeline atual faz 2 análises independentes da mesma foto:

1. **analyze-dental-photo** (Gemini Pro) — clínica: dentes, classes, substrato, patologias
2. **generate-dsd/analysis** (Gemini Pro) — estética: proporções, smile line, visagismo, sugestões

Isso causa:
- **Conflito de dentes**: foto detecta 8, DSD detecta 4, merge junta tudo em 12
- **Conflito de tratamento**: foto diz "resina", DSD diz "porcelana" para o mesmo dente
- **Smile line classificada 3x**: foto, DSD, e classifier paralelo (Gemini Flash)
- **Custo desnecessário**: 3 chamadas AI (~$0.10/caso) com trabalho sobreposto
- **Incoerência clínica**: dentes com dados de fontes diferentes e qualidade diferente

## Solução

### Pipeline Proposto

```
FOTO(s) DO PACIENTE
  ↓
ANÁLISE ÚNICA (1x Gemini 3.1 Pro)
  ├─ Clínica: dentes, classes, substrato, shade, patologias
  ├─ Estética: proporções, smile line, visagismo, sugestões
  └─ Output: lista UNIFICADA de dentes com dados completos
  ↓
SIMULAÇÃO VISUAL (opcional, Nano Banana 2)
  └─ Usa dados da análise como input
  ↓
RESULTADO = Análise + Simulações
  → Dentista revisa e gera protocolos
```

### Schema Unificado por Dente

```typescript
UnifiedTooth = {
  // Identificação
  tooth: string                    // FDI notation "11"
  tooth_region: string | null      // "anterior-superior"
  tooth_bounds: ToothBounds        // posição na imagem

  // Clínico
  cavity_class: string | null      // "Classe III", "Fechamento de Diastema"
  restoration_size: string | null  // "Média"
  substrate: string | null         // "Dentina"
  substrate_condition: string | null
  enamel_condition: string | null
  depth: string | null
  priority: "alta" | "média" | "baixa"

  // Estético
  current_issue: string            // "Restauração infiltrada com gap mesial"
  proposed_change: string          // "Fechamento com resina ~1.5mm"

  // Tratamento (UMA indicação, sem conflito)
  treatment_indication: TreatmentType
  indication_reason: string
  notes: string | null
}
```

### Campos Top-Level (Análise Unificada)

```typescript
UnifiedAnalysis = {
  // Dentes
  detected: boolean
  confidence: number               // 0-100
  detected_teeth: UnifiedTooth[]
  primary_tooth: string | null
  vita_shade: string | null

  // Clínico
  observations: string[]
  warnings: string[]
  treatment_indication: TreatmentType  // predominante
  indication_reason: string
  dsd_simulation_suitability: number   // 0-100

  // Estético (antes só no DSD)
  facial_midline: "centrada" | "desviada_esquerda" | "desviada_direita"
  dental_midline: "alinhada" | "desviada_esquerda" | "desviada_direita"
  smile_line: "alta" | "média" | "baixa"
  buccal_corridor: "adequado" | "excessivo" | "ausente"
  occlusal_plane: "nivelado" | "inclinado_esquerda" | "inclinado_direita"
  golden_ratio_compliance: number   // 0-100
  symmetry_score: number            // 0-100
  lip_thickness: "fino" | "médio" | "volumoso"
  overbite_suspicion: "sim" | "não" | "indeterminado"
  smile_arc: "consonante" | "plano" | "reverso"

  // Visagismo (requer foto de rosto)
  face_shape: string | null
  perceived_temperament: string | null
  recommended_tooth_shape: string | null
  visagism_notes: string | null
}
```

## Mudanças por Componente

### Edge Functions

| Componente | Ação | Detalhes |
|-----------|------|---------|
| `analyze-dental-photo/` | **Evolui** | Prompt unificado (clínica + estética), schema expandido, aceita fotos adicionais (face, 45°) |
| `generate-dsd/proportions-analysis.ts` | **Remove** | Análise movida para `analyze-dental-photo` |
| `generate-dsd/smile-line-classifier.ts` | **Remove** | Redundante — análise unificada classifica |
| `generate-dsd/index.ts` | **Simplifica** | Só simulação — recebe análise pronta como input |
| `generate-dsd/simulation.ts` | **Mantém** | Sem mudanças na geração de imagem |
| Lip validation (em simulation.ts) | **Modelo** | Sonnet 4.6 → Haiku 4.5 (resposta binária) |

### Frontend

| Componente | Ação | Detalhes |
|-----------|------|---------|
| `useDSDIntegration.ts` | **Remove** | Sem merge — dados já unificados |
| `usePhotoAnalysis.ts` | **Evolui** | Chama análise unificada, aceita fotos adicionais |
| `useDSDStep.ts` | **Simplifica** | Só dispara simulação visual, não faz análise |
| `useWizardFlow.ts` | **Simplifica** | Remove passo DSD-análise, mantém simulação como opcional |
| `useWizardSubmit.ts` | **Adapta** | Usa schema unificado (sem buscar dados em 2 fontes) |

### Wizard UX

**Antes (5 passos):**
1. Upload foto
2. Análise clínica
3. Revisão + seleção de dentes
4. DSD (opcional) — re-analisa, merge confuso
5. Formulário + Submit

**Depois (4 passos):**
1. Upload foto(s) — intraoral + face/45° opcionais
2. Análise completa (automática) — 1 chamada, tudo junto
3. Revisão + Simulação (opcional) + Formulário
4. Submit → protocolos

## Otimização de Modelos

| Tarefa | Antes | Depois | Economia |
|--------|-------|--------|----------|
| Análise completa | 2x Gemini Pro | 1x Gemini Pro | ~$0.04/caso, ~8s |
| Smile line classifier | 1x Gemini Flash | Eliminado | ~$0.001/caso, ~3s |
| Lip validation | Claude Sonnet 4.6 | Claude Haiku 4.5 | ~$0.01/caso |
| **Total** | **3 chamadas** | **1 chamada** | **~$0.05/caso + 6-8s** |

## Riscos e Mitigações

### Prompt grande (~700 linhas)
- **Risco**: Qualidade pode degradar com prompt muito extenso
- **Mitigação**: Eliminar redundâncias (smile line, restauration detection, arc rules aparecem nos 2 prompts atuais). Prompt real ~550-600 linhas. Gemini Pro suporta bem.

### Perda de calibração
- **Risco**: Prompts atuais extensamente calibrados com casos clínicos reais
- **Mitigação**: Migrar incrementalmente. Rodar prompt unificado em shadow mode. Validar com mesmos casos. Manter prompt tests.

### Regressão clínica
- **Risco**: Software clínico — mudança no output pode impactar decisões
- **Mitigação**: Manter edge function antiga ativa. Rodar em paralelo. A/B test antes de substituir.

### Compatibilidade com dados existentes
- **Risco**: Avaliações salvas usam schema antigo
- **Mitigação**: Schema unificado é SUPERSET. Dados antigos válidos. Sem migration destrutiva.

## Estratégia de Implementação

### Fase 1: Schema & Prompt Unificado
1. Criar schema TypeScript unificado (`UnifiedAnalysis` + `UnifiedTooth`)
2. Criar prompt unificado combinando as regras clínicas + estéticas
3. Criar tool schema unificado para Gemini function calling
4. Adaptar `analyze-dental-photo` para usar novo prompt + aceitar fotos adicionais

### Fase 2: Edge Function generate-dsd
5. Simplificar `generate-dsd/index.ts` — remover chamada a `analyzeProportions()`
6. Aceitar análise completa como input (não re-analisar)
7. Remover `proportions-analysis.ts` e `smile-line-classifier.ts`
8. Trocar lip validation de Sonnet → Haiku

### Fase 3: Frontend
9. Atualizar `usePhotoAnalysis` para retornar dados unificados
10. Remover `useDSDIntegration.ts`
11. Simplificar `useDSDStep.ts` (só simulação)
12. Adaptar `useWizardFlow.ts` (fluxo de 4 passos)
13. Adaptar `useWizardSubmit.ts` (schema unificado)

### Fase 4: Validação
14. Rodar prompt unificado com casos clínicos existentes
15. Comparar outputs vs pipeline atual
16. Adaptar prompt regression tests
17. Deploy em staging com A/B test

## Não-Escopo

- Mudanças no `recommend-resin` ou `recommend-cementation` (consomem dados, não geram análise)
- Mudanças na simulação de imagem (Nano Banana 2 / Gemini 3 Pro Image)
- Mudanças no `check-photo-quality`
- Migração de dados existentes (compatível)

---
*Design aprovado: 2026-02-28*
