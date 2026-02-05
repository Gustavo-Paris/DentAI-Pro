import type { PromptDefinition } from './types.ts'
import { recommendCementation } from './definitions/recommend-cementation.ts'
import { analyzeDentalPhoto } from './definitions/analyze-dental-photo.ts'

const registry: Record<string, PromptDefinition> = {
  [recommendCementation.id]: recommendCementation,
  [analyzeDentalPhoto.id]: analyzeDentalPhoto,
}

export type PromptId = keyof typeof registry

export function getPrompt(id: string): PromptDefinition {
  const prompt = registry[id]
  if (!prompt) throw new Error(`Prompt not found: ${id}`)
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
