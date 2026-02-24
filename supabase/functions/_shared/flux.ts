// FLUX Kontext Pro (BFL) API client for DSD simulation fallback
// Async polling pattern: POST → poll → download image → return base64

import { logger } from "./logger.ts";
import { sleep } from "./http-utils.ts";
import { createCircuitBreaker } from "./circuit-breaker.ts";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FLUX_API_URL = "https://api.bfl.ai/v1/flux-kontext-pro";
const DEFAULT_POLL_INTERVAL_MS = 2_000;
const DEFAULT_MAX_POLL_ATTEMPTS = 25; // 25 × 2s = 50s max
const DEFAULT_TIMEOUT_MS = 55_000;

// ---------------------------------------------------------------------------
// Error class (mirrors GeminiError / ClaudeError pattern)
// ---------------------------------------------------------------------------

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

// Circuit breaker (shared implementation)
const { check: circuitBreakerCheck, onSuccess: circuitBreakerOnSuccess, onFailure: circuitBreakerOnFailure } =
  createCircuitBreaker(FluxError, "FLUX");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getApiKey(): string {
  const apiKey = Deno.env.get("BFL_API_KEY");
  if (!apiKey) {
    throw new FluxError("BFL_API_KEY not configured", 500, false);
  }
  return apiKey;
}

/**
 * Convert raw base64 + mimeType into a data URL string.
 * FLUX expects `input_image` as a full data URL.
 */
function toDataUrl(base64: string, mimeType: string): string {
  // If already a data URL, return as-is
  if (base64.startsWith("data:")) return base64;
  return `data:${mimeType};base64,${base64}`;
}

// ---------------------------------------------------------------------------
// API types
// ---------------------------------------------------------------------------

interface FluxSubmitResponse {
  id: string;
  polling_url: string;
}

interface FluxPollResponse {
  status: "Pending" | "Ready" | "Error" | "Request Moderated" | "Content Moderated" | "Task not found";
  result?: {
    sample: string; // URL to download the generated image
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Image editing with FLUX Kontext Pro (BFL API).
 * Used as a fallback when Gemini 3 Pro Image is unavailable.
 *
 * @param prompt - Text prompt describing the edit
 * @param imageBase64 - Base64-encoded input image (without data URL prefix)
 * @param mimeType - Input image MIME type (e.g., "image/jpeg", "image/png")
 * @param options - Additional options
 * @returns Generated image as base64 data URL or null
 */
export async function callFluxImageEdit(
  prompt: string,
  imageBase64: string,
  mimeType: string,
  options: {
    timeoutMs?: number;
    seed?: number;
    /** Safety tolerance 0-6 (default 2). Higher = more permissive. */
    safetyTolerance?: number;
  } = {},
): Promise<{ imageUrl: string | null; text: string | null }> {
  const apiKey = getApiKey();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const startTime = Date.now();

  // Check circuit breaker before making any requests
  circuitBreakerCheck();

  // -------------------------------------------------------------------------
  // Step 1: Submit the task
  // -------------------------------------------------------------------------

  logger.log("Submitting FLUX Kontext Pro task...");

  const submitBody = {
    prompt,
    input_image: toDataUrl(imageBase64, mimeType),
    output_format: "png",
    ...(options.seed !== undefined && { seed: options.seed }),
    safety_tolerance: options.safetyTolerance ?? 2,
  };

  const submitResponse = await fetch(FLUX_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-key": apiKey,
    },
    body: JSON.stringify(submitBody),
  });

  if (!submitResponse.ok) {
    const errorBody = await submitResponse.text();
    logger.error(`FLUX submit error: ${submitResponse.status}`, errorBody);

    if (submitResponse.status === 429) {
      circuitBreakerOnFailure();
      throw new FluxError(
        "Taxa de requisições FLUX excedida. Tente novamente.",
        429,
        true,
      );
    }
    if (submitResponse.status === 422) {
      // Validation errors are client-side — don't trip the circuit breaker
      throw new FluxError(
        `FLUX validation error: ${errorBody.substring(0, 300)}`,
        422,
        false,
      );
    }

    circuitBreakerOnFailure();
    throw new FluxError(
      `Erro ao submeter tarefa FLUX: ${submitResponse.status}`,
      submitResponse.status,
      submitResponse.status >= 500,
    );
  }

  const submitData: FluxSubmitResponse = await submitResponse.json();
  const { polling_url } = submitData;

  logger.log(`FLUX task submitted: ${submitData.id}, polling...`);

  // -------------------------------------------------------------------------
  // Step 2: Poll until ready
  // -------------------------------------------------------------------------

  for (let attempt = 0; attempt < DEFAULT_MAX_POLL_ATTEMPTS; attempt++) {
    // Check overall timeout
    const elapsed = Date.now() - startTime;
    if (elapsed >= timeoutMs) {
      logger.warn(`FLUX polling timed out after ${elapsed}ms`);
      circuitBreakerOnFailure();
      throw new FluxError("Timeout na geração de imagem FLUX", 408, true);
    }

    await sleep(DEFAULT_POLL_INTERVAL_MS);

    const pollResponse = await fetch(polling_url, {
      headers: { "x-key": apiKey },
    });

    if (!pollResponse.ok) {
      logger.warn(`FLUX poll error: ${pollResponse.status}`);
      // Keep polling on transient errors
      continue;
    }

    const pollData: FluxPollResponse = await pollResponse.json();
    logger.log(`FLUX poll attempt ${attempt + 1}: status=${pollData.status}`);

    if (pollData.status === "Pending") {
      continue;
    }

    if (pollData.status === "Ready" && pollData.result?.sample) {
      // -----------------------------------------------------------------------
      // Step 3: Download the generated image and convert to base64
      // -----------------------------------------------------------------------
      logger.log("FLUX task ready, downloading image...");

      const imageResponse = await fetch(pollData.result.sample);
      if (!imageResponse.ok) {
        logger.error(`FLUX image download failed: ${imageResponse.status}`);
        circuitBreakerOnFailure();
        throw new FluxError(
          "Erro ao baixar imagem gerada pelo FLUX",
          imageResponse.status,
          true,
        );
      }

      const imageBuffer = new Uint8Array(await imageResponse.arrayBuffer());

      // Convert Uint8Array to base64
      let binary = "";
      for (let i = 0; i < imageBuffer.length; i++) {
        binary += String.fromCharCode(imageBuffer[i]);
      }
      const imageBase64Result = btoa(binary);

      const dataUrl = `data:image/png;base64,${imageBase64Result}`;
      const totalMs = Date.now() - startTime;
      logger.log(`FLUX image edit completed in ${totalMs}ms`);

      circuitBreakerOnSuccess();
      return { imageUrl: dataUrl, text: null };
    }

    // Terminal error statuses
    if (pollData.status === "Error") {
      circuitBreakerOnFailure();
      throw new FluxError("Erro na geração de imagem FLUX", 500, true);
    }

    if (pollData.status === "Request Moderated" || pollData.status === "Content Moderated") {
      // Moderation is content-specific — don't trip the circuit breaker
      throw new FluxError(
        "Imagem rejeitada pela moderação de conteúdo FLUX",
        400,
        false,
      );
    }

    if (pollData.status === "Task not found") {
      circuitBreakerOnFailure();
      throw new FluxError("Tarefa FLUX não encontrada", 404, false);
    }

    // Unknown status — log and keep polling
    logger.warn(`FLUX unknown status: ${pollData.status}`);
  }

  // Exhausted all poll attempts
  circuitBreakerOnFailure();
  throw new FluxError(
    "FLUX polling exauriu tentativas sem resposta",
    408,
    true,
  );
}
