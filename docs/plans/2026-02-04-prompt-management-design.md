# Prompt Management System — Design

> Sistema de gestao centralizada de prompts para o AURIA.

## Contexto

O AURIA usa 5 prompts de IA (Google Gemini) no fluxo de avaliacoes, todos hardcoded inline nas Supabase Edge Functions. Isso dificulta visibilidade, manutencao e rastreamento de metricas.

## Decisoes

| Aspecto | Decisao |
|---------|---------|
| Localizacao | `supabase/functions/_shared/prompts/` (compatibilidade Deno) |
| Formato | TypeScript puro, funcoes tipadas |
| Dependencias | Zero — nenhum import de Supabase, Gemini, ou runtime |
| Catalogo | Registry com `getPrompt()`, `listPrompts()`, `listByMode()`, `listByTag()` |
| Metricas | `MetricsPort` interface + `withMetrics()` wrapper |
| Persistencia | Adapter pattern — consumer implementa |
| Versionamento | Git — hash injetado no build |

## Estrutura

```
supabase/functions/_shared/prompts/
├── index.ts                        # Exports publicos
├── types.ts                        # PromptDefinition, PromptExecution, MetricsPort
├── registry.ts                     # Catalogo central
├── metrics.ts                      # withMetrics() + estimateCost()
├── definitions/
│   ├── analyze-dental-photo.ts     # Prompt #1 — Analise de foto
│   ├── dsd-analysis.ts            # Prompt #2 — Analise DSD
│   ├── dsd-simulation.ts          # Prompt #3 — Simulacao DSD (image edit)
│   ├── recommend-resin.ts         # Prompt #4 — Recomendacao de resina
│   └── recommend-cementation.ts   # Prompt #5 — Protocolo de cimentacao
```

> **Nota:** O modulo vive dentro de `_shared/` porque as edge functions rodam em Deno e importam
> shared code via caminhos relativos. Os arquivos de prompt tem zero dependencias de infraestrutura
> (Supabase, Gemini, Deno) — sao TypeScript puro com funcoes tipadas.

## Tipos

```ts
interface PromptMetadata {
  id: string
  name: string
  description: string
  model: string
  temperature: number
  maxTokens: number
  tags?: string[]
  mode: 'text' | 'vision' | 'vision-tools' | 'text-tools' | 'image-edit'
}

interface PromptDefinition<TParams = unknown> extends PromptMetadata {
  system: (params: TParams) => string
  user: (params: TParams) => string
}

interface PromptExecution {
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

interface MetricsPort {
  log(execution: PromptExecution): Promise<void>
}
```

## Registry

```ts
export function getPrompt<T extends PromptId>(id: T): (typeof registry)[T]
export function listPrompts(): PromptDefinition[]
export function listByMode(mode: PromptDefinition['mode']): PromptDefinition[]
export function listByTag(tag: string): PromptDefinition[]
```

## Metricas — withMetrics()

Wrapper que mede latencia, tokens, custo estimado e delega para o `MetricsPort`:

```ts
function withMetrics<TResult>(
  metrics: MetricsPort,
  promptId: string,
  promptVersion: string,
  model: string,
): (execute: () => Promise<{ result: TResult; tokensIn: number; tokensOut: number }>) => Promise<TResult>
```

Tabela de custos por modelo embutida no pacote (dado puro, sem dependencia).

## Migracao das Edge Functions

Antes (inline):
```ts
const systemPrompt = `Voce e um especialista... // 200+ linhas`
const result = await callGeminiVisionWithTools(systemPrompt, ...)
```

Depois (orquestracao):
```ts
import { getPrompt, withMetrics } from '../_shared/prompts/index.ts'
import { createSupabaseMetrics, PROMPT_VERSION } from '../_shared/metrics-adapter.ts'

const prompt = getPrompt('analyze-dental-photo')
const systemMsg = prompt.system({ imageType })
const metrics = createSupabaseMetrics(supabaseUrl, serviceKey)
const result = await withMetrics(metrics, prompt.id, PROMPT_VERSION, prompt.model)(async () => {
  const response = await callGeminiVisionWithTools(systemMsg, ...)
  return { result: response, tokensIn: 0, tokensOut: 0 }
})
```

## Adapter de Metricas (vive no consumer, nao no pacote)

```ts
// supabase/functions/_shared/metrics-adapter.ts
export const supabaseMetrics: MetricsPort = {
  async log(execution) {
    await supabase.from('prompt_executions').insert(execution)
  },
}
```

## Inventario de Prompts

| ID | Nome | Modelo | Mode | Definicao |
|----|------|--------|------|-----------|
| analyze-dental-photo | Analise de Foto Dental | gemini-3-flash-preview | vision-tools | _shared/prompts/definitions/analyze-dental-photo.ts |
| dsd-analysis | Analise DSD | gemini-2.5-pro | vision-tools | _shared/prompts/definitions/dsd-analysis.ts |
| dsd-simulation | Simulacao DSD | gemini-3-pro-image-preview | image-edit | _shared/prompts/definitions/dsd-simulation.ts |
| recommend-resin | Recomendacao de Resina | gemini-3-flash-preview | text | _shared/prompts/definitions/recommend-resin.ts |
| recommend-cementation | Protocolo de Cimentacao | gemini-2.5-pro | text-tools | _shared/prompts/definitions/recommend-cementation.ts |

## Metricas de Execucao

Tabela `prompt_executions` no Supabase registra cada chamada ao modelo:
- prompt_id, prompt_version, model
- tokens_in, tokens_out (0 por agora — gemini.ts nao expoe usage data)
- estimated_cost, latency_ms
- success, error

Adapter em `_shared/metrics-adapter.ts`. Non-breaking — falha de metricas nao afeta a request.
