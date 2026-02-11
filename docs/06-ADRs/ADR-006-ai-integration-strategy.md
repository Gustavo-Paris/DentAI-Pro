---
title: "ADR-006: AI Integration Strategy"
adr_id: ADR-006
created: 2026-02-10
updated: 2026-02-10
status: accepted
deciders: Team AURIA
tags:
  - type/adr
  - status/accepted
  - domain/ai
  - domain/backend
related:
  - "[[ADR-003-centralized-prompt-management]]"
  - "[[ADR-004-credit-model-and-monetization]]"
  - "[[ADR-005-authentication-and-authorization]]"
  - "[[ADR-008-wizard-architecture-post-refactor]]"
  - "[[docs/00-Index/Home]]"
---

# ADR-006: AI Integration Strategy

## Status

**Accepted** (2026-02-10)

## Context

AURIA's core value is AI-powered clinical decision support for dentists. The system needs to:

1. **Analyze dental photos** -- Detect teeth with problems, classify cavities, estimate substrates, assign treatment priorities.
2. **Generate resin stratification protocols** -- Recommend resin products, shade selection, layering techniques per tooth.
3. **Generate cementation protocols** -- Produce step-by-step porcelain veneer cementation guides.
4. **Perform Digital Smile Design (DSD)** -- Analyze facial/dental proportions and generate visual simulations of treatment outcomes.
5. **Validate AI responses** -- Ensure AI output conforms to expected schemas before storing or displaying to the user.
6. **Handle failures gracefully** -- AI calls can fail due to rate limits, safety filters, or malformed responses.

## Decision

### Google Gemini as AI Provider

All AI operations use Google Gemini via the `supabase/functions/_shared/gemini.ts` client. The system uses multiple Gemini models based on operation requirements:

| Edge Function | Model | Mode | Purpose |
|---------------|-------|------|---------|
| `analyze-dental-photo` | `gemini-3-flash-preview` | Vision + Tools | Multi-tooth photo analysis |
| `recommend-resin` | `gemini-2.0-flash` | Text | Resin stratification protocol |
| `recommend-cementation` | `gemini-2.5-pro` | Text + Tools | Cementation protocol |
| `generate-dsd` (analysis) | `gemini-2.5-pro` | Vision + Tools | Facial proportion analysis |
| `generate-dsd` (simulation) | Gemini Image Edit | Image generation | DSD visual simulation |

### Structured Output via Function Calling

All AI responses use Gemini's function calling (tool use) to enforce structured output. Each edge function defines OpenAI-compatible tool schemas that describe the expected response shape:

```typescript
const tools: OpenAITool[] = [{
  type: "function",
  function: {
    name: "analyze_dental_photo",
    description: "Retorna a analise estruturada...",
    parameters: {
      type: "object",
      properties: { /* schema */ },
      required: ["detected", "confidence", "detected_teeth"],
    },
  },
}];
```

The `forceFunctionName` option ensures Gemini always returns a function call rather than freeform text.

### AI Response Validation with Zod Schemas

All AI responses are validated at runtime using Zod schemas defined in `supabase/functions/_shared/aiSchemas.ts`:

```typescript
import { parseAIResponse, PhotoAnalysisResultSchema } from "../_shared/aiSchemas.ts";

const result = parseAIResponse(
  PhotoAnalysisResultSchema,
  functionCall.args,
  'analyze-dental-photo'
);
```

> [!info] Schema Design Principles
> - `.passthrough()` on every object -- extra fields from Gemini do not cause validation failures.
> - `.optional()` on fields the AI might omit -- graceful degradation.
> - Enum values validated loosely -- Gemini sometimes returns English instead of Portuguese.

Three Zod schemas are defined:

| Schema | Edge Function | Validates |
|--------|--------------|-----------|
| `PhotoAnalysisResultSchema` | `analyze-dental-photo` | Detected teeth, VITA shade, treatment indications |
| `DSDAnalysisSchema` | `generate-dsd` | Facial proportions, smile analysis, suggestions |
| `CementationProtocolSchema` | `recommend-cementation` | Steps, materials, checklist, alerts |

### Prompt Management (ADR-003 Reference)

All prompts are managed via the centralized prompt registry (`supabase/functions/_shared/prompts/`). See [[ADR-003-centralized-prompt-management]] for details. Five prompts are registered:

- `analyze-dental-photo` -- Photo analysis
- `recommend-resin` -- Resin stratification
- `recommend-cementation` -- Cementation protocol
- `dsd-analysis` -- DSD facial analysis
- `dsd-simulation` -- DSD image generation

### Enum Normalization

Gemini sometimes returns English enum values instead of the expected Portuguese values. Each edge function normalizes at the response boundary:

```typescript
const TREATMENT_INDICATION_MAP: Record<string, TreatmentIndication> = {
  resin: "resina",
  porcelain: "porcelana",
  crown: "coroa",
  // ...
  resina: "resina",  // pass-through Portuguese values
};
```

> [!warning] Normalization on Both Sides
> Enum normalization is applied in both the backend (edge functions) and frontend (wizard submit). This defense-in-depth prevents mismatched values from propagating to the database or UI.

### Retry Strategy

AI calls are retried at two levels:

1. **Edge function level** -- The `gemini.ts` client handles transient HTTP errors.
2. **Frontend level** -- The wizard submit uses `withRetry()` for per-tooth protocol generation:

```typescript
await withRetry(
  async () => { /* invoke edge function */ },
  { maxRetries: 2, baseDelay: 2000 },
);
```

### Per-Tooth Parallel Processing

When the wizard submits a case with multiple teeth, protocol generation runs in parallel using `Promise.allSettled()`:

```typescript
const results = await Promise.allSettled(
  teethToProcess.map(async (tooth) => {
    // Create evaluation, then invoke AI edge function
  })
);
```

This allows partial success -- if 3 of 5 teeth complete successfully, those 3 evaluations are saved and the user is notified about the 2 failures.

### Error Handling and Credit Refund

AI errors trigger automatic credit refunds (see [[ADR-004-credit-model-and-monetization]]):

```typescript
try {
  // Call Gemini
} catch (error) {
  if (creditsConsumed) {
    await refundCredits(supabase, userId, "case_analysis", reqId);
  }
  return createErrorResponse(ERROR_MESSAGES.AI_ERROR, 500, corsHeaders);
}
```

Rate limit errors (HTTP 429) return a specific error code so the frontend can display appropriate messaging.

### Post-Processing Safety Nets

AI responses undergo server-side post-processing to correct common AI errors:

- **Duplicate teeth deduplication** -- Gemini may return the same tooth number multiple times.
- **Arch filtering** -- If a photo shows the upper arch, lower teeth detections are removed.
- **Black classification cleanup** -- Aesthetic procedures (veneers, laminates) should not have cavity class labels.
- **Gengivoplasty filtering** -- Removed for low smile line or suspected overbite cases.
- **Shade validation** -- Protocol layer shades are cross-referenced against the `resin_catalog` table and replaced with valid alternatives if needed.
- **Visagism reset** -- Face shape analysis is neutralized when no full-face photo was provided.

### Metrics and Observability

Each AI call is wrapped with `withMetrics()` from the prompt management module, which records:
- Prompt ID and version
- Model used
- Latency
- Token counts (when available)
- Success/failure status

## Alternatives Considered

### 1. OpenAI GPT-4 Vision

- **Pros:** More mature API, better documentation, JSON mode
- **Cons:** Higher cost per call, no native image generation, slower for vision tasks
- **Rejected because:** Gemini offers competitive vision quality at lower cost, and the image edit API enables DSD simulation without a separate image generation service.

### 2. Local/Self-Hosted Models

- **Pros:** No API costs, full data privacy
- **Cons:** Requires GPU infrastructure, models not competitive with Gemini for dental analysis, high operational burden
- **Rejected because:** The quality of dental photo analysis requires frontier models. Self-hosting is not viable for a solo-dev SaaS.

### 3. Unstructured Text Responses + Regex Parsing

- **Pros:** No function calling setup, simpler prompts
- **Cons:** Fragile parsing, inconsistent output format, difficult to validate
- **Rejected because:** Function calling provides reliable structured output. The Zod validation layer catches edge cases that regex would miss.

## Consequences

### Positive

- **Structured output** -- Function calling + Zod validation ensures AI responses conform to expected schemas.
- **Multi-model strategy** -- Different models for different tasks optimizes cost vs. quality.
- **Parallel processing** -- Multiple teeth are processed concurrently, reducing total wait time.
- **Graceful degradation** -- Partial failures do not block the entire submission.
- **Safety nets** -- Post-processing corrects common AI errors before they reach the user.

### Negative

- **Vendor lock-in** -- Tight coupling to Gemini's API format (function calling, image edit).
- **Complex post-processing** -- The growing list of safety nets adds maintenance burden.
- **Token costs** -- Vision calls with high-resolution dental photos consume significant tokens.

### Risks

- **Gemini API changes** -- Mitigated by the abstraction layer in `gemini.ts`.
- **AI hallucinations** -- Mitigated by Zod validation, post-processing safety nets, and enum normalization.
- **Rate limiting** -- Mitigated by per-user rate limits and graceful error handling.

## Implementation

Key files:

- `supabase/functions/_shared/gemini.ts` -- Gemini API client (text, vision, tools, image edit)
- `supabase/functions/_shared/aiSchemas.ts` -- Zod schemas for AI response validation
- `supabase/functions/_shared/prompts/` -- Centralized prompt registry (see [[ADR-003-centralized-prompt-management]])
- `supabase/functions/analyze-dental-photo/index.ts` -- Photo analysis (vision + tools)
- `supabase/functions/recommend-resin/index.ts` -- Resin stratification (text)
- `supabase/functions/recommend-cementation/index.ts` -- Cementation protocol (tools)
- `supabase/functions/generate-dsd/index.ts` -- DSD analysis + simulation (vision + image edit)

## Links

- [[ADR-003-centralized-prompt-management]] -- Prompt management strategy
- [[ADR-004-credit-model-and-monetization]] -- Credit consumption for AI operations
- [[ADR-008-wizard-architecture-post-refactor]] -- Frontend orchestration of AI calls
- [[ADR-Index]] -- ADR Index

---
*Created: 2026-02-10 | Last updated: 2026-02-10*
