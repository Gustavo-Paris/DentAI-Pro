# Claude Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate 4 AI edge functions from Google Gemini to Claude Sonnet 4.5 to eliminate gengivoplasty detection intermittency and improve clinical reasoning consistency.

**Architecture:** Create a new `claude.ts` API client mirroring `gemini.ts` interface, update prompt definitions, then swap callers in each edge function. The `dsd-simulation` (image editing) stays on Gemini.

**Tech Stack:** Anthropic Messages API (raw fetch), Deno, Supabase Edge Functions, existing OpenAI-compatible tool format

**Design doc:** `docs/plans/2026-02-13-claude-migration-design.md`

---

### Task 1: Create Claude API Client

**Files:**
- Create: `supabase/functions/_shared/claude.ts`

**Context:** This mirrors `supabase/functions/_shared/gemini.ts` (883 lines) but for Claude's Messages API. Uses raw `fetch` (no SDK dependency) for consistency with the Gemini client. Accepts the same OpenAI-compatible `OpenAIMessage[]` and `OpenAITool[]` types from `gemini.ts` and converts internally.

**Step 1: Create `claude.ts` with types, error class, circuit breaker, and helpers**

```typescript
// supabase/functions/_shared/claude.ts
// Claude (Anthropic) API client for AURIA Supabase Edge Functions

import { logger } from "./logger.ts";
import type { OpenAIMessage, OpenAITool, TokenUsage } from "./gemini.ts";

const CLAUDE_API_BASE = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
const ANTHROPIC_VERSION = "2023-06-01";

// Re-export types so edge functions can import from either client
export type { OpenAIMessage, OpenAITool, TokenUsage };

// --- Error class ---

export class ClaudeError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = "ClaudeError";
  }
}

// --- Circuit breaker (same pattern as gemini.ts) ---

const circuitBreaker = {
  consecutiveFailures: 0,
  state: "closed" as "closed" | "open" | "half-open",
  openedAt: 0,
  failureThreshold: 3,
  resetTimeoutMs: 30_000,
  failureWindowMs: 60_000,
  firstFailureAt: 0,
};

function circuitBreakerCheck(): void { /* same logic as gemini.ts */ }
function circuitBreakerOnSuccess(): void { /* same logic as gemini.ts */ }
function circuitBreakerOnFailure(): void { /* same logic as gemini.ts */ }

// --- Helpers ---

const DEFAULT_TIMEOUT_MS = 55_000;

function getApiKey(): string {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new ClaudeError("ANTHROPIC_API_KEY not configured", 500, false);
  return apiKey;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

**Step 2: Add format conversion functions**

Convert OpenAI-compatible messages/tools to Claude format:

```typescript
// --- Convert OpenAI messages to Claude format ---

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string | ClaudeContentBlock[];
}

interface ClaudeContentBlock {
  type: "text" | "image" | "tool_use" | "tool_result";
  text?: string;
  source?: { type: "base64"; media_type: string; data: string };
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

interface ClaudeTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

function convertMessages(messages: OpenAIMessage[]): {
  system: string | undefined;
  claudeMessages: ClaudeMessage[];
} {
  let system: string | undefined;
  const claudeMessages: ClaudeMessage[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      system = typeof msg.content === "string"
        ? msg.content
        : msg.content.filter(p => p.type === "text").map(p => p.text).join("\n");
      continue;
    }
    claudeMessages.push({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: typeof msg.content === "string" ? msg.content : msg.content.map(part => {
        if (part.type === "text") return { type: "text" as const, text: part.text };
        // Image conversion handled separately in vision functions
        return { type: "text" as const, text: "" };
      }).filter(b => b.text),
    });
  }

  return { system, claudeMessages };
}

function convertTools(tools: OpenAITool[]): ClaudeTool[] {
  return tools
    .filter(t => t.type === "function")
    .map(t => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters,
    }));
}
```

**Step 3: Add core API request function with retry**

```typescript
interface ClaudeRequest {
  model: string;
  max_tokens: number;
  system?: string;
  messages: ClaudeMessage[];
  temperature?: number;
  tools?: ClaudeTool[];
  tool_choice?: { type: "auto" | "any" | "tool"; name?: string };
}

interface ClaudeResponse {
  content: Array<{
    type: "text" | "tool_use";
    text?: string;
    id?: string;
    name?: string;
    input?: Record<string, unknown>;
  }>;
  stop_reason: string;
  usage: { input_tokens: number; output_tokens: number };
}

async function makeClaudeRequest(
  request: ClaudeRequest,
  maxRetries: number = 3,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ClaudeResponse> {
  const apiKey = getApiKey();
  let lastError: Error | null = null;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    circuitBreakerCheck();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      logger.log(`Calling Claude API (${request.model}), attempt ${retryCount + 1}...`);

      const response = await fetch(CLAUDE_API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Rate limiting
      if (response.status === 429) {
        circuitBreakerOnFailure();
        const retryAfter = response.headers.get("Retry-After");
        const waitTime = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : Math.min(1000 * Math.pow(2, retryCount), 32000);
        logger.warn(`Rate limited (429). Waiting ${waitTime}ms...`);
        if (retryCount < maxRetries) { await sleep(waitTime); retryCount++; continue; }
        throw new ClaudeError("Taxa de requisições excedida.", 429, true);
      }

      // Server errors
      if (response.status === 500 || response.status === 503 || response.status === 529) {
        circuitBreakerOnFailure();
        if (retryCount < 1) { await sleep(2000); retryCount++; continue; }
        throw new ClaudeError("Erro no servidor Claude.", response.status, true);
      }

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error(`Claude API error: ${response.status}`, errorBody);
        let errorMessage = "Erro na chamada Claude API";
        try { errorMessage = JSON.parse(errorBody).error?.message || errorMessage; } catch { /**/ }
        throw new ClaudeError(errorMessage, response.status, false);
      }

      const data: ClaudeResponse = await response.json();
      circuitBreakerOnSuccess();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ClaudeError) throw error;
      if ((error as Error).name === "AbortError") {
        circuitBreakerOnFailure();
        lastError = new ClaudeError("Timeout na chamada Claude API", 408, true);
        if (retryCount < maxRetries) { retryCount++; continue; }
        throw lastError;
      }
      lastError = error as Error;
      circuitBreakerOnFailure();
      if (retryCount < maxRetries) {
        await sleep(Math.min(1000 * Math.pow(2, retryCount), 16000));
        retryCount++;
        continue;
      }
    }
  }
  throw new ClaudeError(lastError?.message || "Falha na comunicação com Claude API", 500, true);
}
```

**Step 4: Add the 4 public functions**

```typescript
// --- Extract helpers ---

function extractText(response: ClaudeResponse): string | null {
  const textBlocks = response.content.filter(b => b.type === "text");
  return textBlocks.length > 0 ? textBlocks.map(b => b.text).join("") : null;
}

function extractToolUse(response: ClaudeResponse): { name: string; args: Record<string, unknown> } | null {
  const toolBlock = response.content.find(b => b.type === "tool_use");
  if (toolBlock?.name && toolBlock?.input) {
    return { name: toolBlock.name, args: toolBlock.input };
  }
  return null;
}

function extractTokens(response: ClaudeResponse): TokenUsage {
  return {
    promptTokenCount: response.usage.input_tokens,
    candidatesTokenCount: response.usage.output_tokens,
    totalTokenCount: response.usage.input_tokens + response.usage.output_tokens,
  };
}

// --- Public API (mirrors gemini.ts interface) ---

/** Text-only completion */
export async function callClaude(
  model: string = DEFAULT_MODEL,
  messages: OpenAIMessage[],
  options: { temperature?: number; maxTokens?: number; } = {}
): Promise<{ text: string | null; finishReason: string; tokens?: TokenUsage }> {
  const { system, claudeMessages } = convertMessages(messages);
  const response = await makeClaudeRequest({
    model,
    max_tokens: options.maxTokens ?? 2048,
    system,
    messages: claudeMessages,
    temperature: options.temperature ?? 0.0,
  });
  return {
    text: extractText(response),
    finishReason: response.stop_reason,
    tokens: extractTokens(response),
  };
}

/** Vision completion (image analysis, no tools) */
export async function callClaudeVision(
  model: string = DEFAULT_MODEL,
  prompt: string,
  imageBase64: string,
  mimeType: string,
  options: {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    additionalImages?: Array<{ data: string; mimeType: string }>;
    timeoutMs?: number;
  } = {}
): Promise<{ text: string | null; finishReason: string; tokens?: TokenUsage }> {
  const content: ClaudeContentBlock[] = [
    { type: "image", source: { type: "base64", media_type: mimeType, data: imageBase64 } },
  ];
  if (options.additionalImages) {
    for (const img of options.additionalImages) {
      content.push({ type: "image", source: { type: "base64", media_type: img.mimeType, data: img.data } });
    }
  }
  content.push({ type: "text", text: prompt });

  const response = await makeClaudeRequest({
    model,
    max_tokens: options.maxTokens ?? 2048,
    system: options.systemPrompt,
    messages: [{ role: "user", content }],
    temperature: options.temperature ?? 0.0,
  }, 3, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  return {
    text: extractText(response),
    finishReason: response.stop_reason,
    tokens: extractTokens(response),
  };
}

/** Text with tool use */
export async function callClaudeWithTools(
  model: string = DEFAULT_MODEL,
  messages: OpenAIMessage[],
  tools: OpenAITool[],
  options: {
    temperature?: number;
    maxTokens?: number;
    forceFunctionName?: string;
    timeoutMs?: number;
  } = {}
): Promise<{
  text: string | null;
  functionCall: { name: string; args: Record<string, unknown> } | null;
  finishReason: string;
  tokens?: TokenUsage;
}> {
  const { system, claudeMessages } = convertMessages(messages);
  const claudeTools = convertTools(tools);

  const response = await makeClaudeRequest({
    model,
    max_tokens: options.maxTokens ?? 3000,
    system,
    messages: claudeMessages,
    temperature: options.temperature ?? 0.0,
    tools: claudeTools,
    tool_choice: options.forceFunctionName
      ? { type: "tool", name: options.forceFunctionName }
      : { type: "auto" },
  }, 3, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  return {
    text: extractText(response),
    functionCall: extractToolUse(response),
    finishReason: response.stop_reason,
    tokens: extractTokens(response),
  };
}

/** Vision + tool use (dental photo analysis, DSD analysis) */
export async function callClaudeVisionWithTools(
  model: string = DEFAULT_MODEL,
  prompt: string,
  imageBase64: string,
  mimeType: string,
  tools: OpenAITool[],
  options: {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    forceFunctionName?: string;
    timeoutMs?: number;
  } = {}
): Promise<{
  text: string | null;
  functionCall: { name: string; args: Record<string, unknown> } | null;
  finishReason: string;
  tokens?: TokenUsage;
}> {
  const claudeTools = convertTools(tools);
  const content: ClaudeContentBlock[] = [
    { type: "image", source: { type: "base64", media_type: mimeType, data: imageBase64 } },
    { type: "text", text: prompt },
  ];

  const response = await makeClaudeRequest({
    model,
    max_tokens: options.maxTokens ?? 3000,
    system: options.systemPrompt,
    messages: [{ role: "user", content }],
    temperature: options.temperature ?? 0.0,
    tools: claudeTools,
    tool_choice: options.forceFunctionName
      ? { type: "tool", name: options.forceFunctionName }
      : { type: "auto" },
  }, 3, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  return {
    text: extractText(response),
    functionCall: extractToolUse(response),
    finishReason: response.stop_reason,
    tokens: extractTokens(response),
  };
}

export { DEFAULT_MODEL as CLAUDE_DEFAULT_MODEL };
```

**Step 5: Verify the file compiles**

Run: `cd supabase/functions && deno check _shared/claude.ts`

**Step 6: Commit**

```bash
git add supabase/functions/_shared/claude.ts
git commit -m "feat(ai): add Claude API client mirroring Gemini interface"
```

---

### Task 2: Update Prompt Types and Metrics

**Files:**
- Modify: `supabase/functions/_shared/prompts/types.ts`
- Modify: `supabase/functions/_shared/prompts/metrics.ts`

**Step 1: Add `provider` field to PromptMetadata**

In `types.ts`, add `provider` to `PromptMetadata`:

```typescript
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
  provider: PromptProvider  // NEW
}
```

**Step 2: Add Claude pricing to metrics.ts**

Add to the `COST_PER_1K` dictionary:

```typescript
const COST_PER_1K: Record<string, { input: number; output: number }> = {
  'gemini-3-flash-preview': { input: 0.00015, output: 0.0006 },
  'gemini-2.5-pro': { input: 0.00125, output: 0.005 },
  'gemini-3-pro-image-preview': { input: 0.00125, output: 0.005 },
  'gemini-2.0-flash': { input: 0.00010, output: 0.0004 },
  'claude-sonnet-4-5-20250929': { input: 0.003, output: 0.015 },  // NEW
}
```

**Step 3: Commit**

```bash
git add supabase/functions/_shared/prompts/types.ts supabase/functions/_shared/prompts/metrics.ts
git commit -m "feat(ai): add Claude provider type and pricing to metrics"
```

---

### Task 3: Update Prompt Definitions

**Files:**
- Modify: `supabase/functions/_shared/prompts/definitions/analyze-dental-photo.ts`
- Modify: `supabase/functions/_shared/prompts/definitions/dsd-analysis.ts`
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-resin.ts`
- Modify: `supabase/functions/_shared/prompts/definitions/recommend-cementation.ts`
- Modify: `supabase/functions/_shared/prompts/definitions/dsd-simulation.ts` (add provider: 'gemini' only)

**Step 1: Update each prompt definition**

For `analyze-dental-photo.ts`, `dsd-analysis.ts`, `recommend-resin.ts`, `recommend-cementation.ts`:
- Change `model` → `'claude-sonnet-4-5-20250929'`
- Change `temperature` → `0.0`
- Add `provider: 'claude'`

For `dsd-simulation.ts`:
- Add `provider: 'gemini'` (stays Gemini)

Example for `analyze-dental-photo.ts`:
```typescript
export const analyzeDentalPhoto: PromptDefinition<Params> = {
  id: 'analyze-dental-photo',
  name: 'Análise de Foto Dental',
  description: '...',
  model: 'claude-sonnet-4-5-20250929',   // WAS: gemini-3-flash-preview
  temperature: 0.0,                       // WAS: 0.1
  maxTokens: 3000,
  mode: 'vision-tools',
  provider: 'claude',                     // NEW
  // system and user builders UNCHANGED
```

**Step 2: Commit**

```bash
git add supabase/functions/_shared/prompts/definitions/
git commit -m "feat(ai): update prompt definitions to Claude Sonnet 4.5"
```

---

### Task 4: Migrate analyze-dental-photo

**Files:**
- Modify: `supabase/functions/analyze-dental-photo/index.ts`

**Step 1: Change imports**

Replace:
```typescript
import { callGeminiVisionWithTools, GeminiError, type OpenAITool } from "../_shared/gemini.ts";
```
With:
```typescript
import { callClaudeVisionWithTools, ClaudeError, type OpenAITool } from "../_shared/claude.ts";
```

**Step 2: Change the API call (around line 444)**

Replace the `callGeminiVisionWithTools` call:
```typescript
const response = await callClaudeVisionWithTools(
  "claude-sonnet-4-5-20250929",
  userPrompt,
  base64Image,
  mimeType,
  tools,
  {
    systemPrompt,
    temperature: 0.0,
    maxTokens: 3000,
    forceFunctionName: "analyze_dental_photo",
    timeoutMs: 55_000,
    // thinkingLevel removed — not applicable to Claude
  }
);
```

**Step 3: Update token logging**

Change `logger.info('gemini_tokens', ...)` to `logger.info('claude_tokens', ...)` and update field names:
```typescript
if (response.tokens) {
  logger.info('claude_tokens', { operation: 'analyze-dental-photo', ...response.tokens });
}
```

**Step 4: Update error handling**

Replace all `GeminiError` references with `ClaudeError`:
- `error instanceof GeminiError` → `error instanceof ClaudeError`
- Error message strings mentioning "Gemini" → "Claude" (in logger calls only, not user-facing)

**Step 5: Verify it compiles**

Run: `cd supabase/functions && deno check analyze-dental-photo/index.ts`

**Step 6: Commit**

```bash
git add supabase/functions/analyze-dental-photo/index.ts
git commit -m "feat(ai): migrate analyze-dental-photo to Claude Sonnet 4.5"
```

---

### Task 5: Migrate recommend-cementation

**Files:**
- Modify: `supabase/functions/recommend-cementation/index.ts`

**Step 1: Change imports**

Replace:
```typescript
import { callGeminiWithTools, GeminiError, type OpenAIMessage, type OpenAITool } from "../_shared/gemini.ts";
```
With:
```typescript
import { callClaudeWithTools, ClaudeError, type OpenAIMessage, type OpenAITool } from "../_shared/claude.ts";
```

**Step 2: Change the API call (around line 326)**

Replace `callGeminiWithTools`:
```typescript
const response = await callClaudeWithTools(
  "claude-sonnet-4-5-20250929",
  messages,
  tools as OpenAITool[],
  {
    temperature: 0.0,
    maxTokens: 4000,
    forceFunctionName: "generate_cementation_protocol",
  }
);
```

**Step 3: Update error handling**

Replace `GeminiError` → `ClaudeError` in all catch blocks.

**Step 4: Verify and commit**

```bash
cd supabase/functions && deno check recommend-cementation/index.ts
git add supabase/functions/recommend-cementation/index.ts
git commit -m "feat(ai): migrate recommend-cementation to Claude Sonnet 4.5"
```

---

### Task 6: Migrate recommend-resin

**Files:**
- Modify: `supabase/functions/recommend-resin/index.ts`

**Context:** This function uses `callGemini` (text-only, no tools). It returns raw JSON text that is then parsed. Migration path: use `callClaude` (text-only).

**Step 1: Change imports**

Replace:
```typescript
import { callGemini, GeminiError, type OpenAIMessage } from "../_shared/gemini.ts";
```
With:
```typescript
import { callClaude, ClaudeError, type OpenAIMessage } from "../_shared/claude.ts";
```

**Step 2: Change the API call (around line 348)**

Replace `callGemini`:
```typescript
const response = await callClaude(
  "claude-sonnet-4-5-20250929",
  messages,
  {
    temperature: 0.0,
    maxTokens: 8192,
    // seed not supported by Claude — determinism via temperature 0.0
  }
);
```

Note: Claude does not support `seed` parameter. With `temperature: 0.0`, output is already highly deterministic.

**Step 3: Update error handling**

Replace `GeminiError` → `ClaudeError`.

**Step 4: Verify and commit**

```bash
cd supabase/functions && deno check recommend-resin/index.ts
git add supabase/functions/recommend-resin/index.ts
git commit -m "feat(ai): migrate recommend-resin to Claude Sonnet 4.5"
```

---

### Task 7: Migrate generate-dsd (hybrid: Claude analysis + Gemini image)

**Files:**
- Modify: `supabase/functions/generate-dsd/index.ts`

**Context:** This is the most complex function. It uses THREE Gemini calls:
1. `callGeminiVisionWithTools` → DSD analysis (MIGRATE to Claude)
2. `callGeminiVision` → lip check (MIGRATE to Claude)
3. `callGeminiImageEdit` → DSD simulation (STAYS Gemini)

**Step 1: Update imports to include both Claude AND Gemini**

Replace:
```typescript
import {
  callGeminiVision,
  callGeminiVisionWithTools,
  callGeminiImageEdit,
  GeminiError,
  type OpenAITool
} from "../_shared/gemini.ts";
```
With:
```typescript
import {
  callGeminiImageEdit,
  GeminiError,
  type OpenAITool
} from "../_shared/gemini.ts";
import {
  callClaudeVision,
  callClaudeVisionWithTools,
  ClaudeError,
} from "../_shared/claude.ts";
```

**Step 2: Migrate DSD analysis call (around line 858)**

Replace `callGeminiVisionWithTools`:
```typescript
const response = await callClaudeVisionWithTools(
  "claude-sonnet-4-5-20250929",
  "Analise esta foto e retorne a análise DSD completa usando a ferramenta analyze_dsd.",
  base64Data,
  mimeType,
  tools,
  {
    systemPrompt: analysisPrompt,
    temperature: 0.0,
    maxTokens: 4000,
    forceFunctionName: "analyze_dsd",
    timeoutMs: 60_000,
  }
);
```

**Step 3: Migrate fallback vision call (around line 907)**

Replace `callGeminiVision` fallback with `callClaudeVision`:
```typescript
const fallbackResponse = await callClaudeVision(
  "claude-sonnet-4-5-20250929",
  `Analise esta foto odontológica e retorne a análise DSD completa...`,
  base64Data,
  mimeType,
  {
    systemPrompt: analysisPrompt,
    temperature: 0.0,
    maxTokens: 4000,
  }
);
```

**Step 4: Migrate lip check call (around line 513)**

Replace `callGeminiVision` lip check with `callClaudeVision`:
```typescript
const lipCheck = await callClaudeVision(
  "claude-sonnet-4-5-20250929",
  `Imagem 1 é a ORIGINAL. Imagem 2 é a SIMULAÇÃO odontológica...`,
  base64Data,    // original image
  mimeType,
  {
    additionalImages: [{ data: simBase64, mimeType: simMimeType }],
    temperature: 0.0,
    maxTokens: 1000,
  }
);
```

**Step 5: Keep `callGeminiImageEdit` call UNCHANGED**

The simulation call (around line 550) stays exactly as-is — Gemini for image generation.

**Step 6: Update error handling**

- DSD analysis and lip check errors: `ClaudeError`
- Image generation errors: keep `GeminiError`
- Some catch blocks may need to handle both error types

**Step 7: Verify and commit**

```bash
cd supabase/functions && deno check generate-dsd/index.ts
git add supabase/functions/generate-dsd/index.ts
git commit -m "feat(ai): migrate generate-dsd analysis to Claude, keep image gen on Gemini"
```

---

### Task 8: Add ANTHROPIC_API_KEY to Supabase Secrets

**Step 1: Set the secret**

```bash
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

**Step 2: Verify**

```bash
npx supabase secrets list
```

Confirm `ANTHROPIC_API_KEY` appears in the list.

**Step 3: No commit needed** (secrets are not in code)

---

### Task 9: Deploy All Migrated Functions

**Context:** All edge functions need `--no-verify-jwt` and `--use-docker`. Docker Desktop must be running.

**Step 1: Ensure Docker is running**

```bash
open -a Docker
# Wait for Docker to be ready
```

**Step 2: Deploy each function**

```bash
npx supabase functions deploy analyze-dental-photo --no-verify-jwt --use-docker
npx supabase functions deploy recommend-cementation --no-verify-jwt --use-docker
npx supabase functions deploy recommend-resin --no-verify-jwt --use-docker
npx supabase functions deploy generate-dsd --no-verify-jwt --use-docker
```

**Step 3: Verify health**

```bash
npx supabase functions list
```

All 4 functions should show `Active` status.

---

### Task 10: Verification — Gengivoplasty Consistency Test

**Step 1: Run the same dental photo through the wizard 3-5 times**

Use a case with obvious gengivoplasty indication (high smile line, visible gingival asymmetry).

**Step 2: Verify all runs detect gengivoplasty**

Check the `evaluations` table:
```sql
SELECT id, tooth, treatment_type, ai_treatment_indication
FROM evaluations
WHERE session_id IN (/* last 5 session IDs */)
ORDER BY created_at DESC;
```

All runs should consistently show `treatment_type = 'gengivoplastia'` for the appropriate teeth.

**Step 3: Verify protocol quality**

Check that resin/cementation protocols are clinically coherent and in Portuguese.

**Step 4: Final commit with all changes**

If everything works, tag the deployment:
```bash
git tag v2.0.0-claude-migration
```
