// Claude (Anthropic) API client for AURIA Supabase Edge Functions
// Mirrors the interface of gemini.ts so edge functions can swap imports.

import { logger } from "./logger.ts";

// Re-export shared types from gemini.ts so edge functions can import from either client
export type { OpenAIMessage, OpenAIContentPart, OpenAITool, TokenUsage } from "./gemini.ts";
import type { OpenAIMessage, OpenAITool, TokenUsage } from "./gemini.ts";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
const DEFAULT_TIMEOUT_MS = 50_000;

// ---------------------------------------------------------------------------
// Error class (mirrors GeminiError)
// ---------------------------------------------------------------------------

export class ClaudeError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public isRetryable: boolean = false,
  ) {
    super(message);
    this.name = "ClaudeError";
  }
}

// ---------------------------------------------------------------------------
// Circuit breaker (same logic as gemini.ts)
// ---------------------------------------------------------------------------

const circuitBreaker = {
  consecutiveFailures: 0,
  state: "closed" as "closed" | "open" | "half-open",
  openedAt: 0,
  /** Max consecutive failures before opening the circuit */
  failureThreshold: 3,
  /** How long the circuit stays open before allowing a probe (ms) */
  resetTimeoutMs: 30_000,
  /** Window in which failures must occur to trip the breaker (ms) */
  failureWindowMs: 60_000,
  /** Timestamp of the first failure in the current window */
  firstFailureAt: 0,
};

function circuitBreakerCheck(): void {
  const now = Date.now();

  if (circuitBreaker.state === "open") {
    if (now - circuitBreaker.openedAt >= circuitBreaker.resetTimeoutMs) {
      circuitBreaker.state = "half-open";
      logger.log("Circuit breaker half-open — allowing probe request");
      return;
    }
    throw new ClaudeError(
      "Serviço Claude temporariamente indisponível (circuit breaker aberto). Tente novamente em breve.",
      503,
      true,
    );
  }
  // "closed" and "half-open" allow requests through
}

function circuitBreakerOnSuccess(): void {
  if (circuitBreaker.state !== "closed") {
    logger.log("Circuit breaker closed — Claude recovered");
  }
  circuitBreaker.consecutiveFailures = 0;
  circuitBreaker.firstFailureAt = 0;
  circuitBreaker.state = "closed";
}

function circuitBreakerOnFailure(): void {
  const now = Date.now();

  // Reset window if the first failure is outside the window
  if (
    circuitBreaker.firstFailureAt === 0 ||
    now - circuitBreaker.firstFailureAt > circuitBreaker.failureWindowMs
  ) {
    circuitBreaker.firstFailureAt = now;
    circuitBreaker.consecutiveFailures = 1;
  } else {
    circuitBreaker.consecutiveFailures++;
  }

  if (circuitBreaker.consecutiveFailures >= circuitBreaker.failureThreshold) {
    circuitBreaker.state = "open";
    circuitBreaker.openedAt = now;
    logger.warn(
      `Circuit breaker opened after ${circuitBreaker.consecutiveFailures} consecutive failures`,
    );
  } else if (circuitBreaker.state === "half-open") {
    // Probe failed — re-open
    circuitBreaker.state = "open";
    circuitBreaker.openedAt = now;
    logger.warn("Circuit breaker re-opened — probe request failed");
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getApiKey(): string {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new ClaudeError("ANTHROPIC_API_KEY not configured", 500, false);
  }
  return apiKey;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Claude API types (native format)
// ---------------------------------------------------------------------------

interface ClaudeContentBlockText {
  type: "text";
  text: string;
}

interface ClaudeContentBlockImage {
  type: "image";
  source: {
    type: "base64";
    media_type: string;
    data: string;
  };
}

interface ClaudeContentBlockToolUse {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

type ClaudeContentBlock =
  | ClaudeContentBlockText
  | ClaudeContentBlockImage
  | ClaudeContentBlockToolUse;

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string | ClaudeContentBlock[];
}

interface ClaudeToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

interface ClaudeRequest {
  model: string;
  messages: ClaudeMessage[];
  system?: string;
  max_tokens: number;
  temperature?: number;
  tools?: ClaudeToolDefinition[];
  tool_choice?:
    | { type: "auto" }
    | { type: "any" }
    | { type: "tool"; name: string };
}

interface ClaudeResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: Array<{
    type: "text" | "tool_use";
    text?: string;
    id?: string;
    name?: string;
    input?: Record<string, unknown>;
  }>;
  model: string;
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface ClaudeErrorResponse {
  type: "error";
  error: {
    type: string;
    message: string;
  };
}

// ---------------------------------------------------------------------------
// Format conversion: OpenAI messages → Claude messages
// ---------------------------------------------------------------------------

function convertToClaudeFormat(messages: OpenAIMessage[]): {
  claudeMessages: ClaudeMessage[];
  system?: string;
} {
  let system: string | undefined;
  const claudeMessages: ClaudeMessage[] = [];

  for (const msg of messages) {
    // System messages → extracted to top-level `system` parameter
    if (msg.role === "system") {
      const text =
        typeof msg.content === "string"
          ? msg.content
          : msg.content
              .filter((p) => p.type === "text")
              .map((p) => p.text)
              .join("\n");
      // If multiple system messages, concatenate
      system = system ? `${system}\n\n${text}` : text;
      continue;
    }

    // user / assistant → keep role as-is
    const role = msg.role as "user" | "assistant";

    if (typeof msg.content === "string") {
      claudeMessages.push({ role, content: msg.content });
    } else if (Array.isArray(msg.content)) {
      const blocks: ClaudeContentBlock[] = [];
      for (const part of msg.content) {
        if (part.type === "text" && part.text) {
          blocks.push({ type: "text", text: part.text });
        } else if (part.type === "image_url" && part.image_url?.url) {
          const parsed = parseDataUrl(part.image_url.url);
          if (parsed) {
            blocks.push({
              type: "image",
              source: {
                type: "base64",
                media_type: parsed.mimeType,
                data: parsed.data,
              },
            });
          }
        }
      }
      if (blocks.length > 0) {
        claudeMessages.push({ role, content: blocks });
      }
    }
  }

  return { claudeMessages, system };
}

// Parse data URL to extract mime type and base64 data
function parseDataUrl(url: string): { mimeType: string; data: string } | null {
  const match = url.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Format conversion: OpenAI tools → Claude tools
// ---------------------------------------------------------------------------

function convertToClaudeTools(tools: OpenAITool[]): ClaudeToolDefinition[] {
  return tools
    .filter((t) => t.type === "function")
    .map((t) => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters as Record<string, unknown>,
    }));
}

// ---------------------------------------------------------------------------
// Response extraction
// ---------------------------------------------------------------------------

function extractTextResponse(response: ClaudeResponse): string | null {
  const textBlocks = response.content.filter((b) => b.type === "text" && b.text);
  if (textBlocks.length === 0) return null;
  return textBlocks.map((b) => b.text!).join("");
}

function extractFunctionCall(
  response: ClaudeResponse,
): { name: string; args: Record<string, unknown> } | null {
  const toolBlock = response.content.find((b) => b.type === "tool_use");
  if (toolBlock && toolBlock.name && toolBlock.input) {
    return {
      name: toolBlock.name,
      args: toolBlock.input,
    };
  }
  return null;
}

function extractTokenUsage(response: ClaudeResponse): TokenUsage | undefined {
  const usage = response.usage;
  if (!usage) return undefined;
  return {
    promptTokenCount: usage.input_tokens ?? 0,
    candidatesTokenCount: usage.output_tokens ?? 0,
    totalTokenCount: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Core request with retry, circuit breaker, and timeout
// ---------------------------------------------------------------------------

async function makeClaudeRequest(
  request: ClaudeRequest,
  maxRetries: number = 3,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<ClaudeResponse> {
  const apiKey = getApiKey();

  let lastError: Error | null = null;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    // Check circuit breaker before each attempt
    circuitBreakerCheck();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      logger.log(
        `Calling Claude API (${request.model}), attempt ${retryCount + 1}...`,
      );

      const response = await fetch(CLAUDE_API_URL, {
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

      // Handle rate limiting (429)
      if (response.status === 429) {
        circuitBreakerOnFailure();

        const retryAfter = response.headers.get("Retry-After");
        const waitTime = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : Math.min(1000 * Math.pow(2, retryCount), 32000);

        logger.warn(
          `Rate limited (429). Waiting ${waitTime}ms before retry...`,
        );

        if (retryCount < maxRetries) {
          await sleep(waitTime);
          retryCount++;
          continue;
        }
        throw new ClaudeError(
          "Taxa de requisições excedida. Tente novamente em alguns segundos.",
          429,
          true,
        );
      }

      // Handle server errors (500, 503, 529) — retry
      if (
        response.status === 500 ||
        response.status === 503 ||
        response.status === 529
      ) {
        circuitBreakerOnFailure();

        logger.warn(`Server error (${response.status}). Retrying...`);

        if (retryCount < maxRetries) {
          const backoffMs = Math.min(2000 * Math.pow(2, retryCount), 16000);
          logger.warn(`Retrying in ${backoffMs}ms (attempt ${retryCount + 1}/${maxRetries})...`);
          await sleep(backoffMs);
          retryCount++;
          continue;
        }
        throw new ClaudeError(
          "Erro no servidor do Claude. Tente novamente.",
          response.status,
          true,
        );
      }

      // Handle other errors
      if (!response.ok) {
        const errorBody = await response.text();
        logger.error(`Claude API error: ${response.status}`, errorBody);

        let errorMessage = "Erro na chamada do Claude API";
        try {
          const errorJson: ClaudeErrorResponse = JSON.parse(errorBody);
          errorMessage = errorJson.error?.message || errorMessage;
        } catch {
          // Keep default message
        }

        throw new ClaudeError(errorMessage, response.status, false);
      }

      const data: ClaudeResponse = await response.json();

      // Success — reset circuit breaker
      circuitBreakerOnSuccess();

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ClaudeError) {
        throw error;
      }

      // Handle AbortController timeout
      if ((error as Error).name === "AbortError") {
        circuitBreakerOnFailure();
        lastError = new ClaudeError(
          "Timeout na chamada do Claude API",
          408,
          true,
        );
        logger.warn(`Claude request timed out after ${timeoutMs}ms`);

        if (retryCount < maxRetries) {
          retryCount++;
          continue;
        }
        throw lastError;
      }

      lastError = error as Error;
      circuitBreakerOnFailure();
      logger.error(`Claude request failed:`, error);

      if (retryCount < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, retryCount), 16000);
        await sleep(waitTime);
        retryCount++;
        continue;
      }
    }
  }

  throw new ClaudeError(
    lastError?.message || "Falha na comunicação com Claude API",
    500,
    true,
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Basic chat completion with Claude
 * @param model - Claude model name (default: claude-sonnet-4-5-20250929)
 * @param messages - OpenAI-style messages array
 * @param options - Additional options (temperature, maxTokens)
 */
export async function callClaude(
  model: string = DEFAULT_MODEL,
  messages: OpenAIMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {},
): Promise<{ text: string | null; finishReason: string; tokens?: TokenUsage }> {
  const { claudeMessages, system } = convertToClaudeFormat(messages);

  const request: ClaudeRequest = {
    model,
    messages: claudeMessages,
    max_tokens: options.maxTokens ?? 2048,
    temperature: options.temperature ?? 0.0,
  };

  if (system) {
    request.system = system;
  }

  const response = await makeClaudeRequest(request);
  const text = extractTextResponse(response);
  const finishReason = response.stop_reason || "UNKNOWN";
  const tokens = extractTokenUsage(response);

  return { text, finishReason, tokens };
}

/**
 * Vision completion with Claude (image analysis)
 * @param model - Claude model name (default: claude-sonnet-4-5-20250929)
 * @param prompt - Text prompt for image analysis
 * @param imageBase64 - Base64-encoded image data (without data URL prefix)
 * @param mimeType - Image MIME type (e.g., "image/jpeg", "image/png")
 * @param options - Additional options
 */
export async function callClaudeVision(
  model: string = DEFAULT_MODEL,
  prompt: string,
  imageBase64: string,
  mimeType: string,
  options: {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    /** Additional images to include after the first image */
    additionalImages?: Array<{ data: string; mimeType: string }>;
  } = {},
): Promise<{ text: string | null; finishReason: string; tokens?: TokenUsage }> {
  const contentBlocks: ClaudeContentBlock[] = [
    {
      type: "image",
      source: {
        type: "base64",
        media_type: mimeType,
        data: imageBase64,
      },
    },
  ];

  // Append additional images if provided
  if (options.additionalImages) {
    for (const img of options.additionalImages) {
      contentBlocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: img.mimeType,
          data: img.data,
        },
      });
    }
  }

  // Text prompt comes after images
  contentBlocks.push({ type: "text", text: prompt });

  const request: ClaudeRequest = {
    model,
    messages: [{ role: "user", content: contentBlocks }],
    max_tokens: options.maxTokens ?? 2048,
    temperature: options.temperature ?? 0.0,
  };

  if (options.systemPrompt) {
    request.system = options.systemPrompt;
  }

  const response = await makeClaudeRequest(request);
  const text = extractTextResponse(response);
  const finishReason = response.stop_reason || "UNKNOWN";
  const tokens = extractTokenUsage(response);

  return { text, finishReason, tokens };
}

/**
 * Function calling with Claude (tool use)
 * @param model - Claude model name (default: claude-sonnet-4-5-20250929)
 * @param messages - OpenAI-style messages array
 * @param tools - OpenAI-style tools array
 * @param options - Additional options including forceFunctionName to force a specific function
 */
export async function callClaudeWithTools(
  model: string = DEFAULT_MODEL,
  messages: OpenAIMessage[],
  tools: OpenAITool[],
  options: {
    temperature?: number;
    maxTokens?: number;
    forceFunctionName?: string;
  } = {},
): Promise<{
  text: string | null;
  functionCall: { name: string; args: Record<string, unknown> } | null;
  finishReason: string;
  tokens?: TokenUsage;
}> {
  const { claudeMessages, system } = convertToClaudeFormat(messages);
  const claudeTools = convertToClaudeTools(tools);

  const request: ClaudeRequest = {
    model,
    messages: claudeMessages,
    max_tokens: options.maxTokens ?? 3000,
    temperature: options.temperature ?? 0.0,
    tools: claudeTools,
  };

  if (system) {
    request.system = system;
  }

  // Configure tool choice
  if (options.forceFunctionName) {
    request.tool_choice = { type: "tool", name: options.forceFunctionName };
  } else {
    request.tool_choice = { type: "auto" };
  }

  const response = await makeClaudeRequest(request);
  const text = extractTextResponse(response);
  const functionCall = extractFunctionCall(response);
  const finishReason = response.stop_reason || "UNKNOWN";
  const tokens = extractTokenUsage(response);

  return { text, functionCall, finishReason, tokens };
}

/**
 * Vision with function calling (for structured analysis like dental photos)
 * Combines image input with tool use
 * @param model - Claude model name (default: claude-sonnet-4-5-20250929)
 * @param prompt - Text prompt for image analysis
 * @param imageBase64 - Base64-encoded image data (without data URL prefix)
 * @param mimeType - Image MIME type (e.g., "image/jpeg", "image/png")
 * @param tools - OpenAI-style tools array
 * @param options - Additional options
 */
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
  } = {},
): Promise<{
  text: string | null;
  functionCall: { name: string; args: Record<string, unknown> } | null;
  finishReason: string;
  tokens?: TokenUsage;
}> {
  const contentBlocks: ClaudeContentBlock[] = [
    {
      type: "image",
      source: {
        type: "base64",
        media_type: mimeType,
        data: imageBase64,
      },
    },
    { type: "text", text: prompt },
  ];

  const claudeTools = convertToClaudeTools(tools);

  const request: ClaudeRequest = {
    model,
    messages: [{ role: "user", content: contentBlocks }],
    max_tokens: options.maxTokens ?? 3000,
    temperature: options.temperature ?? 0.0,
    tools: claudeTools,
  };

  if (options.systemPrompt) {
    request.system = options.systemPrompt;
  }

  // Configure tool choice
  if (options.forceFunctionName) {
    request.tool_choice = { type: "tool", name: options.forceFunctionName };
  } else {
    request.tool_choice = { type: "auto" };
  }

  const response = await makeClaudeRequest(
    request,
    3,
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );
  const text = extractTextResponse(response);
  const functionCall = extractFunctionCall(response);
  const finishReason = response.stop_reason || "UNKNOWN";
  const tokens = extractTokenUsage(response);

  return { text, functionCall, finishReason, tokens };
}

// Export default model for convenience
export { DEFAULT_MODEL as CLAUDE_DEFAULT_MODEL };
