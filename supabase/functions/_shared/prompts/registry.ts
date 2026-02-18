import type { PromptDefinition, PromptMode } from './types.ts'
import { recommendCementation } from './definitions/recommend-cementation.ts'
import { analyzeDentalPhoto } from './definitions/analyze-dental-photo.ts'
import { recommendResin } from './definitions/recommend-resin.ts'
import { dsdAnalysis } from './definitions/dsd-analysis.ts'
import { dsdSimulation } from './definitions/dsd-simulation.ts'
import { smileLineClassifier } from './definitions/smile-line-classifier.ts'

/** Widen a specific PromptDefinition<T> to PromptDefinition<unknown> for registry storage */
function register<T>(def: PromptDefinition<T>): PromptDefinition<unknown> {
  return def as PromptDefinition<unknown>
}

const registry: Record<string, PromptDefinition<unknown>> = {
  [recommendCementation.id]: register(recommendCementation),
  [analyzeDentalPhoto.id]: register(analyzeDentalPhoto),
  [recommendResin.id]: register(recommendResin),
  [dsdAnalysis.id]: register(dsdAnalysis),
  [dsdSimulation.id]: register(dsdSimulation),
  [smileLineClassifier.id]: register(smileLineClassifier),
}

export type PromptId = keyof typeof registry

export function getPrompt<T = unknown>(id: string): PromptDefinition<T> {
  const prompt = registry[id]
  if (!prompt) throw new Error(`Prompt not found: ${id}`)
  return prompt as PromptDefinition<T>
}

export function listPrompts(): PromptDefinition<unknown>[] {
  return Object.values(registry)
}

export function listByMode(mode: PromptMode): PromptDefinition<unknown>[] {
  return Object.values(registry).filter(p => p.mode === mode)
}

export function listByTag(tag: string): PromptDefinition<unknown>[] {
  return Object.values(registry).filter(p => p.tags?.includes(tag))
}
