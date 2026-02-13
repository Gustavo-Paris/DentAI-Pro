export type PromptMode = 'text' | 'vision' | 'vision-tools' | 'text-tools' | 'image-edit'

export type PromptProvider = 'gemini' | 'claude'

export interface PromptMetadata {
  id: string
  name: string
  description: string
  model: string
  temperature: number
  maxTokens: number
  tags?: string[]
  mode: PromptMode
  provider: PromptProvider
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
