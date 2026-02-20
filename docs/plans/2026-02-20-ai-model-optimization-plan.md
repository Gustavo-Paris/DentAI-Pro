# AI Model Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Standardize AI model fallbacks across all 6 edge functions and integrate FLUX Kontext Pro as DSD simulation fallback.

**Architecture:** Extend the existing `FALLBACK_MODELS` map in `claude.ts` to cover Haiku→Sonnet escalation and broaden the fallback trigger from 529-only to all 5xx errors. Create a new `_shared/flux.ts` API client for FLUX Kontext Pro (async polling pattern). Wire FLUX as fallback in `simulation.ts` when Gemini fails.

**Tech Stack:** Deno (Supabase Edge Functions), Anthropic Claude API, Google Gemini API, Black Forest Labs FLUX API

---

### Task 1: Extend Claude fallback to cover Haiku→Sonnet and all 5xx errors

**Files:**
- Modify: `supabase/functions/_shared/claude.ts:22-25` (FALLBACK_MODELS map)
- Modify: `supabase/functions/_shared/claude.ts:313-343` (makeClaudeRequest 5xx handling)

**Step 1: Add Haiku→Sonnet fallback entry**

In `claude.ts:22-24`, add the Haiku fallback:

```typescript
const FALLBACK_MODELS: Record<string, string> = {
  "claude-sonnet-4-6": "claude-sonnet-4-5-20250929",
  "claude-haiku-4-5-20251001": "claude-sonnet-4-6",
};
```

**Step 2: Broaden model fallback trigger from 529 to all 5xx**

In `makeClaudeRequest`, the current code at line 325 only triggers fallback on `response.status === 529`. Change to trigger on any 5xx after FALLBACK_AFTER_ATTEMPT failed attempts:

```typescript
// After FALLBACK_AFTER_ATTEMPT failed attempts with server errors, switch to fallback model
if (retryCount + 1 >= FALLBACK_AFTER_ATTEMPT) {
  const fallback = FALLBACK_MODELS[request.model];
  if (fallback && request.model !== fallback) {
    logger.warn(`Model ${request.model} failing (${response.status}) — falling back to ${fallback}`);
    request = { ...request, model: fallback };
  }
}
```

This replaces the condition that was `response.status === 529 && retryCount + 1 >= FALLBACK_AFTER_ATTEMPT`.

**Step 3: Verify no regressions**

Run: `cd supabase && deno check functions/_shared/claude.ts`
Expected: No type errors.

**Step 4: Commit**

```bash
git add supabase/functions/_shared/claude.ts
git commit -m "feat: extend Claude fallback to Haiku→Sonnet and all 5xx errors"
```

---

### Task 2: Create FLUX Kontext Pro API client

**Files:**
- Create: `supabase/functions/_shared/flux.ts`

**Step 1: Create the FLUX client**

Create `supabase/functions/_shared/flux.ts` with:

```typescript
// FLUX Kontext Pro (Black Forest Labs) API client for DSD simulation fallback.
// Uses async polling pattern: POST request → poll for result.

import { logger } from "./logger.ts";
import { sleep } from "./http-utils.ts";

const FLUX_API_URL = "https://api.bfl.ai/v1/flux-kontext-pro";
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 25; // 25 × 2s = 50s max polling

export class FluxError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public isRetryable: boolean = false,
  ) {
    super(message);
    this.name = "FluxError";
  }
}

function getApiKey(): string {
  const apiKey = Deno.env.get("BFL_API_KEY");
  if (!apiKey) {
    throw new FluxError("BFL_API_KEY not configured", 500, false);
  }
  return apiKey;
}

interface FluxAsyncResponse {
  id: string;
  polling_url: string;
  cost?: number;
}

interface FluxPollResponse {
  status: "pending" | "processing" | "completed" | "failed";
  result?: {
    sample?: string; // URL to the generated image
  };
  error?: string;
}

/**
 * Edit an image using FLUX Kontext Pro.
 * Sends a prompt + input image, polls for result, returns image as base64 data URL.
 *
 * @param prompt - Text describing the desired edit
 * @param imageBase64 - Base64-encoded input image (without data URL prefix)
 * @param mimeType - Input image MIME type
 * @param options - seed, timeoutMs
 * @returns Generated image as base64 data URL or null
 */
export async function callFluxImageEdit(
  prompt: string,
  imageBase64: string,
  _mimeType: string,
  options: {
    seed?: number;
    timeoutMs?: number;
  } = {},
): Promise<{ imageUrl: string | null; text: string | null }> {
  const apiKey = getApiKey();
  const timeoutMs = options.timeoutMs ?? 55_000;
  const deadline = Date.now() + timeoutMs;

  // Step 1: Submit the edit request
  const requestBody: Record<string, unknown> = {
    prompt,
    input_image: `data:image/jpeg;base64,${imageBase64}`,
    output_format: "png",
    safety_tolerance: 2,
  };
  if (options.seed !== undefined) {
    requestBody.seed = options.seed;
  }

  logger.log("Calling FLUX Kontext Pro API...");

  const submitResponse = await fetch(FLUX_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-key": apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!submitResponse.ok) {
    const errorBody = await submitResponse.text();
    logger.error(`FLUX API submit error: ${submitResponse.status}`, errorBody);
    throw new FluxError(
      `FLUX API error: ${submitResponse.status}`,
      submitResponse.status,
      submitResponse.status >= 500,
    );
  }

  const asyncResult: FluxAsyncResponse = await submitResponse.json();
  const pollingUrl = asyncResult.polling_url;

  if (!pollingUrl) {
    throw new FluxError("No polling_url in FLUX response", 500, false);
  }

  logger.log(`FLUX task submitted (id: ${asyncResult.id}), polling...`);

  // Step 2: Poll for result
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    if (Date.now() >= deadline) {
      throw new FluxError("FLUX polling timeout", 408, true);
    }

    await sleep(POLL_INTERVAL_MS);

    const pollResponse = await fetch(pollingUrl, {
      headers: { "x-key": apiKey },
    });

    if (!pollResponse.ok) {
      logger.warn(`FLUX poll error: ${pollResponse.status}`);
      continue; // Retry polling
    }

    const pollResult: FluxPollResponse = await pollResponse.json();

    if (pollResult.status === "completed" && pollResult.result?.sample) {
      // Download the image and convert to base64 data URL
      logger.log("FLUX image ready, downloading...");
      const imgResponse = await fetch(pollResult.result.sample);
      if (!imgResponse.ok) {
        throw new FluxError("Failed to download FLUX image", 500, true);
      }

      const imgBuffer = await imgResponse.arrayBuffer();
      const imgBase64 = btoa(
        String.fromCharCode(...new Uint8Array(imgBuffer)),
      );
      return {
        imageUrl: `data:image/png;base64,${imgBase64}`,
        text: null,
      };
    }

    if (pollResult.status === "failed") {
      throw new FluxError(
        `FLUX generation failed: ${pollResult.error || "unknown"}`,
        500,
        false,
      );
    }

    // Still pending/processing — continue polling
    logger.log(`FLUX status: ${pollResult.status} (poll ${i + 1}/${MAX_POLL_ATTEMPTS})`);
  }

  throw new FluxError("FLUX max poll attempts exceeded", 408, true);
}
```

**Step 2: Verify types**

Run: `cd supabase && deno check functions/_shared/flux.ts`
Expected: No type errors.

**Step 3: Commit**

```bash
git add supabase/functions/_shared/flux.ts
git commit -m "feat: add FLUX Kontext Pro API client for DSD simulation fallback"
```

---

### Task 3: Integrate FLUX fallback into DSD simulation

**Files:**
- Modify: `supabase/functions/generate-dsd/simulation.ts:1-10` (imports)
- Modify: `supabase/functions/generate-dsd/simulation.ts:358-433` (try/catch block)

**Step 1: Add FLUX import**

Add at the top of `simulation.ts`, after the existing imports:

```typescript
import { callFluxImageEdit, FluxError } from "../_shared/flux.ts";
```

**Step 2: Add FLUX fallback in the catch block**

Replace the current catch block (lines 424-433) to attempt FLUX before throwing:

```typescript
  } catch (err) {
    // Primary (Gemini) failed — try FLUX Kontext Pro as fallback
    const geminiMsg = err instanceof Error ? err.message : String(err);
    logger.warn(`Gemini simulation failed: ${geminiMsg}. Trying FLUX fallback...`);

    try {
      const fluxResult = await callFluxImageEdit(
        simulationPrompt,
        inputBase64Data,
        inputMimeType,
        {
          seed: imageSeed,
          timeoutMs: Math.max(SIMULATION_TIMEOUT - (Date.now() - Date.now()), 20_000),
        },
      );

      if (!fluxResult.imageUrl) {
        throw new Error("FLUX returned no image");
      }

      logger.log("FLUX fallback simulation succeeded");

      // Lip validation for gingival layers (same as primary path)
      let lipsMoved = false;
      if (isGingivalLayer) {
        const lipsValid = await validateLips(fluxResult.imageUrl);
        lipsMoved = !lipsValid;
      }

      // Upload FLUX image
      const base64Data = fluxResult.imageUrl.replace(/^data:image\/\w+;base64,/, "");
      const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const fileName = `${userId}/dsd_${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("dsd-simulations")
        .upload(fileName, binaryData, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        logger.error("FLUX upload error:", uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      logger.log("FLUX simulation uploaded:", fileName, lipsMoved ? "(lips_moved)" : "");
      return { url: fileName, lips_moved: lipsMoved || undefined };
    } catch (fluxErr) {
      // Both Gemini and FLUX failed — propagate original error
      const fluxMsg = fluxErr instanceof Error ? fluxErr.message : String(fluxErr);
      logger.warn(`FLUX fallback also failed: ${fluxMsg}`);

      if (err instanceof GeminiError) {
        throw new Error(`GeminiError ${err.statusCode}: ${err.message} (FLUX fallback: ${fluxMsg})`);
      }
      throw new Error(`Simulation failed: ${geminiMsg} (FLUX fallback: ${fluxMsg})`);
    }
  }
```

**Step 3: Compute remaining time for FLUX timeout**

The FLUX fallback needs to know how much time is left. Add a `startTime` variable at the start of the try block (before the Gemini call):

At line ~358, before the `try {`:
```typescript
  const simulationStartTime = Date.now();
```

And in the FLUX fallback, use:
```typescript
timeoutMs: Math.max(SIMULATION_TIMEOUT - (Date.now() - simulationStartTime), 15_000),
```

**Step 4: Verify types**

Run: `cd supabase && deno check functions/generate-dsd/simulation.ts`
Expected: No type errors.

**Step 5: Commit**

```bash
git add supabase/functions/generate-dsd/simulation.ts
git commit -m "feat: add FLUX Kontext Pro as DSD simulation fallback"
```

---

### Task 4: Add BFL_API_KEY as Supabase secret

**Step 1: Set the secret**

The user must provide their BFL API key from https://bfl.ai. Set it as a Supabase secret:

```bash
echo "BFL_API_KEY_VALUE" | npx supabase secrets set BFL_API_KEY
```

**Step 2: Verify secret is set**

```bash
npx supabase secrets list
```

Expected: `BFL_API_KEY` appears in the list.

**Step 3: No code commit needed** — secrets are not in the codebase.

---

### Task 5: Deploy updated edge functions

Deploy the 4 modified edge functions sequentially (parallel deploys cause ENOTEMPTY race conditions):

**Step 1: Ensure Docker is running**

```bash
open -a Docker
```

**Step 2: Deploy sequentially**

```bash
npx supabase functions deploy generate-dsd --no-verify-jwt --use-docker && \
npx supabase functions deploy analyze-dental-photo --no-verify-jwt --use-docker && \
npx supabase functions deploy recommend-resin --no-verify-jwt --use-docker && \
npx supabase functions deploy recommend-cementation --no-verify-jwt --use-docker
```

**Step 3: Verify deployments**

```bash
npx supabase functions list
```

Expected: All 4 functions show recent deployment timestamp.

---

### Task 6: Smoke test fallback behavior

**Step 1: Test Claude fallback (Haiku→Sonnet escalation)**

Verify the `FALLBACK_MODELS` map is wired correctly by reviewing `claude.ts`. No automated test needed — the fallback only triggers on actual 5xx from Anthropic API.

**Step 2: Test FLUX integration manually**

Use the app to generate a DSD simulation. If Gemini succeeds (normal case), FLUX won't be called. To force the FLUX path, temporarily set an invalid `GOOGLE_AI_API_KEY` or add a test flag.

**Step 3: Verify FLUX client handles missing API key gracefully**

If `BFL_API_KEY` is not set, `callFluxImageEdit` throws `FluxError("BFL_API_KEY not configured", 500, false)` which is caught by the fallback catch block, and the original Gemini error propagates.

---

## Summary of Changes

| File | Change | Purpose |
|---|---|---|
| `_shared/claude.ts` | Add Haiku→Sonnet to FALLBACK_MODELS, broaden 5xx trigger | Fallback for resin/cementation/photo |
| `_shared/flux.ts` | **New file** — FLUX Kontext Pro API client | DSD simulation fallback |
| `generate-dsd/simulation.ts` | Add FLUX fallback in catch block | DSD simulation resilience |

## What is NOT changed

- No model upgrades (Sonnet stays 4.6, Haiku stays 4.5)
- No changes to prompts or tool schemas
- No changes to DSD analysis or smile-line-classifier
- No frontend changes
- No changes to credits or rate limiting
