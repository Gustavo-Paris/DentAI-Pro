import type { MetricsPort } from './types.ts'

const COST_PER_1K: Record<string, { input: number; output: number }> = {
  'gemini-3-flash-preview': { input: 0.00015, output: 0.0006 },
  'gemini-2.5-pro': { input: 0.00125, output: 0.005 },
  'gemini-3-pro-image-preview': { input: 0.00125, output: 0.005 },
  'gemini-2.0-flash': { input: 0.00010, output: 0.0004 },
  'claude-sonnet-4-5-20250929': { input: 0.003, output: 0.015 },
  'claude-haiku-4-5-20251001': { input: 0.0008, output: 0.004 },
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
