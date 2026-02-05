# Prompt Management System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extrair todos os prompts hardcoded das edge functions para um modulo centralizado com tipos, catalogo e metricas.

**Architecture:** Modulo TypeScript puro em `supabase/functions/_shared/prompts/` (zero deps de infraestrutura). Edge functions importam via path relativo. Metricas via adapter pattern com `MetricsPort`.

**Tech Stack:** TypeScript, Deno (edge functions), Vitest (testes)

**Constraint:** Edge functions rodam em Deno e importam shared code via caminhos relativos de `_shared/`. O modulo de prompts vive dentro de `_shared/prompts/` para manter compatibilidade sem build pipeline extra.

---

### Task 1: Criar estrutura do modulo e tipos

**Files:**
- Create: `supabase/functions/_shared/prompts/types.ts`
- Create: `supabase/functions/_shared/prompts/registry.ts`
- Create: `supabase/functions/_shared/prompts/metrics.ts`
- Create: `supabase/functions/_shared/prompts/index.ts`

**Step 1: Criar `types.ts`**

```ts
// supabase/functions/_shared/prompts/types.ts

export type PromptMode = 'text' | 'vision' | 'vision-tools' | 'text-tools' | 'image-edit'

export interface PromptMetadata {
  id: string
  name: string
  description: string
  model: string
  temperature: number
  maxTokens: number
  tags?: string[]
  mode: PromptMode
}

export interface PromptDefinition<TParams = unknown> extends PromptMetadata {
  system: (params: TParams) => string
  user: (params: TParams) => string
}

export interface PromptExecution {
  promptId: string
  promptVersion: string
  model: string
  tokensIn: number
  tokensOut: number
  estimatedCost: number
  latencyMs: number
  success: boolean
  error?: string
  timestamp: Date
}

export interface MetricsPort {
  log(execution: PromptExecution): Promise<void>
}
```

**Step 2: Criar `metrics.ts`**

```ts
// supabase/functions/_shared/prompts/metrics.ts

import type { MetricsPort } from './types.ts'

const COST_PER_1K: Record<string, { input: number; output: number }> = {
  'gemini-3-flash-preview': { input: 0.00015, output: 0.0006 },
  'gemini-2.5-pro': { input: 0.00125, output: 0.005 },
  'gemini-3-pro-image-preview': { input: 0.00125, output: 0.005 },
}

export function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  const rate = COST_PER_1K[model] ?? { input: 0.001, output: 0.004 }
  return (tokensIn / 1000) * rate.input + (tokensOut / 1000) * rate.output
}

export function withMetrics<TResult>(
  metrics: MetricsPort,
  promptId: string,
  promptVersion: string,
  model: string,
) {
  return async (
    execute: () => Promise<{ result: TResult; tokensIn: number; tokensOut: number }>
  ): Promise<TResult> => {
    const start = Date.now()
    try {
      const { result, tokensIn, tokensOut } = await execute()
      await metrics.log({
        promptId,
        promptVersion,
        model,
        tokensIn,
        tokensOut,
        estimatedCost: estimateCost(model, tokensIn, tokensOut),
        latencyMs: Date.now() - start,
        success: true,
        timestamp: new Date(),
      })
      return result
    } catch (error) {
      await metrics.log({
        promptId,
        promptVersion,
        model,
        tokensIn: 0,
        tokensOut: 0,
        estimatedCost: 0,
        latencyMs: Date.now() - start,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      })
      throw error
    }
  }
}
```

**Step 3: Criar `registry.ts` (vazio por enquanto, populado nas tasks seguintes)**

```ts
// supabase/functions/_shared/prompts/registry.ts

import type { PromptDefinition } from './types.ts'

// Definitions importadas conforme sao extraidas
const registry = {} as Record<string, PromptDefinition>

export type PromptId = keyof typeof registry

export function getPrompt<T extends PromptId>(id: T): (typeof registry)[T] {
  const prompt = registry[id]
  if (!prompt) throw new Error(`Prompt not found: ${String(id)}`)
  return prompt
}

export function listPrompts(): PromptDefinition[] {
  return Object.values(registry)
}

export function listByMode(mode: PromptDefinition['mode']): PromptDefinition[] {
  return Object.values(registry).filter(p => p.mode === mode)
}

export function listByTag(tag: string): PromptDefinition[] {
  return Object.values(registry).filter(p => p.tags?.includes(tag))
}
```

**Step 4: Criar `index.ts`**

```ts
// supabase/functions/_shared/prompts/index.ts

export { getPrompt, listPrompts, listByMode, listByTag } from './registry.ts'
export { withMetrics, estimateCost } from './metrics.ts'
export type { PromptDefinition, PromptExecution, MetricsPort, PromptMode, PromptMetadata } from './types.ts'
```

**Step 5: Commit**

```bash
git add supabase/functions/_shared/prompts/
git commit -m "feat(prompts): add prompt management module skeleton with types, registry and metrics"
```

---

### Task 2: Extrair Prompt #5 — recommend-cementation (o menor, para validar o padrao)

**Files:**
- Create: `supabase/functions/_shared/prompts/definitions/recommend-cementation.ts`
- Modify: `supabase/functions/_shared/prompts/registry.ts`
- Modify: `supabase/functions/recommend-cementation/index.ts:151-192` (remover prompts inline)

**Step 1: Ler o prompt atual**

Ler `supabase/functions/recommend-cementation/index.ts` linhas 151-192 para copiar os prompts system e user exatos.

**Step 2: Criar definicao**

Criar `supabase/functions/_shared/prompts/definitions/recommend-cementation.ts`:
- Extrair interfaces de params do contexto da edge function (teeth, shade, ceramic type, substrate, substrate condition)
- Copiar system prompt (linhas 151-181) para funcao `system()`
- Copiar user prompt (linhas 183-192) para funcao `user()`
- Preencher metadata: id, name, description, model (`gemini-2.5-pro`), temperature (0.3), maxTokens (4000), mode (`text-tools`)

**Step 3: Registrar no registry**

Adicionar import e entrada no `registry` de `registry.ts`.

**Step 4: Atualizar edge function**

Em `recommend-cementation/index.ts`:
- Adicionar: `import { getPrompt } from '../_shared/prompts/index.ts'`
- Substituir: `const systemPrompt = \`...\`` por `const prompt = getPrompt('recommend-cementation')` + `const systemPrompt = prompt.system({ teeth, shade, ceramicType, substrate, substrateCondition })`
- Substituir: `const userPrompt = \`...\`` por `const userPrompt = prompt.user({ ... })`
- Manter tool schema e chamada ao Gemini inalterados

**Step 5: Testar manualmente**

Verificar que a edge function ainda compila e funciona (os prompts gerados devem ser identicos aos originais).

**Step 6: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/recommend-cementation.ts
git add supabase/functions/_shared/prompts/registry.ts
git add supabase/functions/recommend-cementation/index.ts
git commit -m "refactor(prompts): extract recommend-cementation prompt to management module"
```

---

### Task 3: Extrair Prompt #1 — analyze-dental-photo

**Files:**
- Create: `supabase/functions/_shared/prompts/definitions/analyze-dental-photo.ts`
- Modify: `supabase/functions/_shared/prompts/registry.ts`
- Modify: `supabase/functions/analyze-dental-photo/index.ts:177-389`

**Step 1: Ler o prompt atual**

Ler `supabase/functions/analyze-dental-photo/index.ts` linhas 177-389. Identificar todas as variaveis dinamicas interpoladas no template string.

**Step 2: Criar definicao**

Criar `supabase/functions/_shared/prompts/definitions/analyze-dental-photo.ts`:
- Interface `Params` com os campos dinamicos (ex: `imageBase64`, `mimeType`)
- `system()` retorna o system prompt (linhas 177-370)
- `user()` retorna o user prompt (linhas 372-389)
- Metadata: model `gemini-3-flash-preview`, temperature 0.1, maxTokens 3000, mode `vision-tools`

**Step 3: Registrar no registry**

**Step 4: Atualizar edge function**

Substituir os prompts inline por chamadas ao registry, mantendo toda a logica de orquestracao (tool schema, chamada ao Gemini, parsing de resposta).

**Step 5: Testar manualmente**

**Step 6: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/analyze-dental-photo.ts
git add supabase/functions/_shared/prompts/registry.ts
git add supabase/functions/analyze-dental-photo/index.ts
git commit -m "refactor(prompts): extract analyze-dental-photo prompt to management module"
```

---

### Task 4: Extrair Prompt #4 — recommend-resin (o maior)

**Files:**
- Create: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts`
- Modify: `supabase/functions/_shared/prompts/registry.ts`
- Modify: `supabase/functions/recommend-resin/index.ts:308-647`

**Step 1: Ler o prompt atual**

Ler `supabase/functions/recommend-resin/index.ts` linhas 240-647. Este e o maior prompt (339 linhas). Identificar TODAS as variaveis dinamicas:
- Dados clinicos: age, tooth, region, cavityClass, restorationSize, depth, substrate, substrateCondition, enamelCondition, aestheticLevel, vitaShade, bruxism, longevity, budget, clinicalNotes
- Catalogo de resinas (injetado dinamicamente)
- Inventario do dentista (injetado dinamicamente)
- Preferencias esteticas do paciente
- Flag de estratificacao avancada (aestheticLevel === 'muito alto')

**Step 2: Criar definicao**

Criar `supabase/functions/_shared/prompts/definitions/recommend-resin.ts`:
- Interface `Params` extensa com todos os campos
- Para secoes condicionais (bruxismo, estratificacao, inventario), usar ifs dentro de `system()`
- O prompt resultante DEVE ser byte-identico ao original para cada combinacao de params

**Step 3: Registrar no registry**

**Step 4: Atualizar edge function**

A edge function resin e a mais complexa — ela monta o prompt em varias etapas (budget rules, clinical data, catalog, inventory, stratification). Toda essa logica de montagem move para o `system()` da definicao. A edge function fica com: fetch dados, chama prompt, chama Gemini, valida resultado.

**Step 5: Testar manualmente**

**Step 6: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/recommend-resin.ts
git add supabase/functions/_shared/prompts/registry.ts
git add supabase/functions/recommend-resin/index.ts
git commit -m "refactor(prompts): extract recommend-resin prompt to management module"
```

---

### Task 5: Extrair Prompt #2 — dsd-analysis

**Files:**
- Create: `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts`
- Modify: `supabase/functions/_shared/prompts/registry.ts`
- Modify: `supabase/functions/generate-dsd/index.ts:732-1003` (funcao `analyzeProportions`)

**Step 1: Ler o prompt atual**

Ler `supabase/functions/generate-dsd/index.ts` linhas 649-1158 (funcao `analyzeProportions`). Identificar variaveis dinamicas:
- `additionalContext` (fotos 45 graus)
- `preferencesContext` (objetivos esteticos do paciente)
- `clinicalContext` (observacoes + achados por dente do Prompt #1)

**Step 2: Criar definicao**

Criar `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts`:
- Interface `Params` com `additionalContext?`, `preferencesContext?`, `clinicalContext?`
- `system()` retorna o analysisPrompt (linhas 732-1003) com contextos injetados condicionalmente
- `user()` retorna instrucao de execucao
- Metadata: model `gemini-2.5-pro`, temperature 0.1, maxTokens 4000, mode `vision-tools`

**Step 3: Registrar no registry**

**Step 4: Atualizar funcao `analyzeProportions` em `generate-dsd/index.ts`**

Substituir apenas a montagem do prompt. Manter tool schema e chamada ao Gemini.

**Step 5: Testar manualmente**

**Step 6: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/dsd-analysis.ts
git add supabase/functions/_shared/prompts/registry.ts
git add supabase/functions/generate-dsd/index.ts
git commit -m "refactor(prompts): extract dsd-analysis prompt to management module"
```

---

### Task 6: Extrair Prompt #3 — dsd-simulation (image edit, 4 variantes)

**Files:**
- Create: `supabase/functions/_shared/prompts/definitions/dsd-simulation.ts`
- Modify: `supabase/functions/_shared/prompts/registry.ts`
- Modify: `supabase/functions/generate-dsd/index.ts:231-646` (funcao `generateSimulation`)

**Step 1: Ler o prompt atual**

Ler `supabase/functions/generate-dsd/index.ts` linhas 231-646. Este prompt e composto por blocos modulares:
- `absolutePreservation` (linhas 269-305)
- `whiteningPrioritySection` (linhas 308-313)
- `visagismContext` (linhas 316-330)
- `qualityRequirements` (linhas 333-347)
- `baseCorrections` (linhas 350-356)
- `textureInstruction` (linhas 253-259)
- 4 variantes de `simulationPrompt` (standard, reconstruction, restoration, intraoral)

Identificar todos os params: `whiteningLevel`, `caseType`, `visagismNotes`, `faceShape`, `toothShapeRecommendation`, `detectedTeeth`, `dsdSuggestions`.

**Step 2: Criar definicao**

Criar `supabase/functions/_shared/prompts/definitions/dsd-simulation.ts`:
- Interface `Params` com todos os campos
- `system()` monta o prompt composto usando os mesmos blocos modulares
- Logica de selecao de variante (standard/reconstruction/restoration/intraoral) dentro de `system()`
- `user()` pode retornar string vazia ja que image-edit usa prompt unico
- Metadata: model `gemini-3-pro-image-preview`, temperature 0.4, mode `image-edit`

**Step 3: Registrar no registry**

**Step 4: Atualizar funcao `generateSimulation` em `generate-dsd/index.ts`**

**Step 5: Testar manualmente**

**Step 6: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/dsd-simulation.ts
git add supabase/functions/_shared/prompts/registry.ts
git add supabase/functions/generate-dsd/index.ts
git commit -m "refactor(prompts): extract dsd-simulation prompt to management module"
```

---

### Task 7: Adicionar metricas adapter e integrar withMetrics

**Files:**
- Create: `supabase/functions/_shared/metrics-adapter.ts`
- Modify: `supabase/functions/analyze-dental-photo/index.ts` (wrap chamada Gemini com withMetrics)
- Modify: `supabase/functions/generate-dsd/index.ts` (wrap chamadas Gemini com withMetrics)
- Modify: `supabase/functions/recommend-resin/index.ts` (wrap chamada Gemini com withMetrics)
- Modify: `supabase/functions/recommend-cementation/index.ts` (wrap chamada Gemini com withMetrics)

**Step 1: Criar migration da tabela `prompt_executions`**

Criar migration SQL em `supabase/migrations/` com:

```sql
CREATE TABLE IF NOT EXISTS prompt_executions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id text NOT NULL,
  prompt_version text NOT NULL,
  model text NOT NULL,
  tokens_in integer NOT NULL DEFAULT 0,
  tokens_out integer NOT NULL DEFAULT 0,
  estimated_cost numeric(10,6) NOT NULL DEFAULT 0,
  latency_ms integer NOT NULL,
  success boolean NOT NULL,
  error text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_prompt_executions_prompt_id ON prompt_executions(prompt_id);
CREATE INDEX idx_prompt_executions_created_at ON prompt_executions(created_at);
```

**Step 2: Criar `metrics-adapter.ts`**

```ts
// supabase/functions/_shared/metrics-adapter.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { MetricsPort } from './prompts/types.ts'

export function createSupabaseMetrics(supabaseUrl: string, serviceKey: string): MetricsPort {
  const supabase = createClient(supabaseUrl, serviceKey)
  return {
    async log(execution) {
      await supabase.from('prompt_executions').insert({
        prompt_id: execution.promptId,
        prompt_version: execution.promptVersion,
        model: execution.model,
        tokens_in: execution.tokensIn,
        tokens_out: execution.tokensOut,
        estimated_cost: execution.estimatedCost,
        latency_ms: execution.latencyMs,
        success: execution.success,
        error: execution.error ?? null,
      })
    },
  }
}
```

**Step 3: Integrar `withMetrics` em cada edge function**

Em cada edge function, envolver a chamada ao Gemini com `withMetrics()`. O `promptVersion` pode ser uma constante no adapter (ex: `'1.0.0'` ou valor de env var).

**Step 4: Testar manualmente**

Verificar que execucoes aparecem na tabela `prompt_executions`.

**Step 5: Commit**

```bash
git add supabase/migrations/
git add supabase/functions/_shared/metrics-adapter.ts
git add supabase/functions/analyze-dental-photo/index.ts
git add supabase/functions/generate-dsd/index.ts
git add supabase/functions/recommend-resin/index.ts
git add supabase/functions/recommend-cementation/index.ts
git commit -m "feat(prompts): add metrics logging with Supabase adapter"
```

---

### Task 8: Atualizar design doc com localizacao final

**Files:**
- Modify: `docs/plans/2026-02-04-prompt-management-design.md`

**Step 1: Atualizar doc**

Atualizar a tabela de decisoes para refletir a localizacao real (`_shared/prompts/` em vez de `packages/prompts/`) e a razao (compatibilidade Deno).

**Step 2: Commit**

```bash
git add docs/plans/2026-02-04-prompt-management-design.md
git commit -m "docs: update prompt management design with final architecture"
```

---

## Ordem de Execucao

```
Task 1 (skeleton)
  |
Task 2 (cementation - menor, valida padrao)
  |
Task 3 (analyze-photo)
  |
Task 4 (resin - maior)
  |
Task 5 (dsd-analysis)
  |
Task 6 (dsd-simulation - 4 variantes)
  |
Task 7 (metricas)
  |
Task 8 (docs)
```

Tasks 2-6 sao independentes entre si (cada uma extrai um prompt diferente), mas recomenda-se a ordem acima: do menor para o maior, validando o padrao no menor antes de aplicar aos maiores.
