import type { PromptDefinition } from './types.ts'
import { recommendCementation } from './definitions/recommend-cementation.ts'
import { analyzeDentalPhoto } from './definitions/analyze-dental-photo.ts'
import { recommendResin } from './definitions/recommend-resin.ts'
import { dsdAnalysis } from './definitions/dsd-analysis.ts'
import { dsdSimulation } from './definitions/dsd-simulation.ts'
import { smileLineClassifier } from './definitions/smile-line-classifier.ts'

// deno-lint-ignore no-explicit-any
const registry: Record<string, PromptDefinition<any>> = {
  [recommendCementation.id]: recommendCementation,
  [analyzeDentalPhoto.id]: analyzeDentalPhoto,
  [recommendResin.id]: recommendResin,
  [dsdAnalysis.id]: dsdAnalysis,
  [dsdSimulation.id]: dsdSimulation,
  [smileLineClassifier.id]: smileLineClassifier,
}

export type PromptId = keyof typeof registry

// deno-lint-ignore no-explicit-any
export function getPrompt(id: string): PromptDefinition<any> {
  const prompt = registry[id]
  if (!prompt) throw new Error(`Prompt not found: ${id}`)
  return prompt
}

// deno-lint-ignore no-explicit-any
export function listPrompts(): PromptDefinition<any>[] {
  return Object.values(registry)
}

// deno-lint-ignore no-explicit-any
export function listByMode(mode: PromptDefinition<any>['mode']): PromptDefinition<any>[] {
  return Object.values(registry).filter(p => p.mode === mode)
}

// deno-lint-ignore no-explicit-any
export function listByTag(tag: string): PromptDefinition<any>[] {
  return Object.values(registry).filter(p => p.tags?.includes(tag))
}
