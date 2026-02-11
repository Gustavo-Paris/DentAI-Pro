---
title: "ADR-003: Centralized Prompt Management"
adr_id: ADR-003
created: 2026-02-04
updated: 2026-02-05
status: accepted
deciders: Team AURIA
tags:
  - type/adr
  - status/accepted
  - domain/ai
  - domain/backend
related:
  - "[[plans/2026-02-04-prompt-management-design]]"
  - "[[plans/2026-02-04-prompt-management-plan]]"
  - "[[docs/00-Index/Home]]"
---

# ADR-003: Centralized Prompt Management

## Status

**Accepted** (2026-02-04)

## Context

AURIA uses 5 AI prompts (Google Gemini) in the evaluation flow, all hardcoded inline in Supabase [[08-Glossary/Terms#Edge Function|Edge Functions]]:

| Prompt | Model | Mode | Current Location |
|--------|-------|------|-----------------|
| Dental Photo Analysis | gemini-3-flash-preview | vision-tools | `analyze-dental-photo/index.ts` |
| DSD Analysis | gemini-2.5-pro | vision-tools | `generate-dsd/index.ts` |
| DSD Simulation | gemini-3-pro-image-preview | image-edit | `generate-dsd/index.ts` |
| Resin Recommendation | gemini-3-flash-preview | text | `recommend-resin/index.ts` |
| Cementation Protocol | gemini-2.5-pro | text-tools | `recommend-cementation/index.ts` |

Problems with inline prompts:

1. **No visibility** — Prompts are buried in function code, hard to audit or compare.
2. **No metrics** — No tracking of token usage, latency, or cost per prompt.
3. **No versioning** — Changes are mixed with function logic in git history.
4. **Duplication risk** — Shared patterns (e.g., Portuguese dental terminology) are copy-pasted.

## Decision

Extract all 5 hardcoded prompts to a **typed TypeScript module** (`@dentai/prompts` in `packages/prompts/`):

- **Registry** with `getPrompt()`, `listPrompts()`, `listByMode()`, `listByTag()`
- **Typed definitions** — Each prompt is a `PromptDefinition<TParams>` with typed `system()` and `user()` builder functions
- **[[08-Glossary/Terms#MetricsPort|MetricsPort]]** interface + `withMetrics()` wrapper for execution tracking
- **Zero dependencies** — No imports of Supabase, Gemini, or runtime. Pure TypeScript.
- **Adapter pattern** — Consumers implement `MetricsPort` (e.g., Supabase adapter for persistence)
- **Git versioning** — Prompt version is the git hash, injected at build time

### Before/After

**Before (inline):**
```typescript
const systemPrompt = `Voce e um especialista... // 200+ lines`
const result = await callGeminiVisionWithTools(systemPrompt, ...)
```

**After (centralized):**
```typescript
import { getPrompt, withMetrics } from '@dentai/prompts'
const prompt = getPrompt('analyze-dental-photo')
const systemMsg = prompt.system({ imageBase64, mimeType })
const result = await withMetrics(metrics, prompt.id, VERSION, prompt.model)(...)
```

## Alternatives Considered

### 1. Keep Inline Prompts

- **Pros:** No migration, works today
- **Cons:** No visibility, no metrics, no versioning, duplication
- **Rejected because:** As prompt count grows, inline management becomes untenable.

### 2. Database-Driven Prompts

- **Pros:** Runtime updates without deploy, A/B testing built-in
- **Cons:** Additional infra, latency for prompt loading, harder to type-check, versioning complexity
- **Rejected because:** Over-engineering for 5 prompts. Git provides sufficient version tracking. Can evolve to DB later if needed.

### 3. External Prompt Service (LangSmith, PromptLayer)

- **Pros:** Rich analytics, collaboration features, prompt playground
- **Cons:** External dependency, cost, vendor lock-in, latency
- **Rejected because:** Adds operational dependency without proportional benefit for a solo dev with 5 prompts.

## Consequences

### Positive

- **Visibility** — All prompts in one place, auditable via registry
- **Testability** — Prompt builder functions are pure, unit-testable
- **Metrics** — Token usage, latency, and estimated cost tracked per execution
- **Version tracking** — Git hash ties each execution to exact prompt text
- **Type safety** — Each prompt has typed parameters, caught at compile time

### Negative

- **Migration effort** — 5 Edge Functions need refactoring to use the registry
- **Build step** — Git hash injection requires build-time configuration
- **Indirection** — Prompt text is no longer visible inline where it's used

### Risks

- **Premature abstraction** — Mitigated by keeping the module minimal (zero dependencies, no framework).

## Implementation

See [[plans/2026-02-04-prompt-management-plan]] for the 8-step implementation plan and [[plans/2026-02-04-prompt-management-design]] for the full design.

## Links

- [[plans/2026-02-04-prompt-management-design]] — Full design document
- [[plans/2026-02-04-prompt-management-plan]] — Implementation plan (8 steps)
- [[ADR-Index]] — ADR Index

---
*Created: 2026-02-04 | Last updated: 2026-02-05*
