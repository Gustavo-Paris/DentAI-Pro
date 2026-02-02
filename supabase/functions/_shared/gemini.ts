// Google Gemini API client for Supabase Edge Functions
// Replaces Lovable AI Gateway with direct Gemini API calls

import { logger } from "./logger.ts";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.0-flash-exp";

// Types for OpenAI-style messages (input format)
export interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string | OpenAIContentPart[];
}

export interface OpenAIContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string; // Can be "data:mime;base64,..." or regular URL
  };
}

export interface OpenAITool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

// Types for Gemini API (native format)
interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string; // base64
  };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

interface GeminiTool {
  functionDeclarations: GeminiFunctionDeclaration[];
}

interface GeminiRequest {
  contents: GeminiContent[];
  systemInstruction?: {
    parts: GeminiPart[];
  };
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
  tools?: GeminiTool[];
  toolConfig?: {
    functionCallingConfig: {
      mode: "AUTO" | "ANY" | "NONE";
      allowedFunctionNames?: string[];
    };
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text?: string;
        functionCall?: {
          name: string;
          args: Record<string, unknown>;
        };
      }>;
      role: string;
    };
    finishReason: string;
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

// Error types for better handling
export class GeminiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

// Get API key from environment
function getApiKey(): string {
  const apiKey = Deno.env.get("GOOGLE_AI_API_KEY");
  if (!apiKey) {
    throw new GeminiError("GOOGLE_AI_API_KEY not configured", 500, false);
  }
  return apiKey;
}

// Sleep helper for retry backoff
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Convert OpenAI-style messages to Gemini format
function convertToGeminiFormat(messages: OpenAIMessage[]): {
  contents: GeminiContent[];
  systemInstruction?: { parts: GeminiPart[] };
} {
  const contents: GeminiContent[] = [];
  let systemInstruction: { parts: GeminiPart[] } | undefined;

  for (const msg of messages) {
    // Handle system messages separately
    if (msg.role === "system") {
      const text = typeof msg.content === "string"
        ? msg.content
        : msg.content.filter(p => p.type === "text").map(p => p.text).join("\n");
      systemInstruction = {
        parts: [{ text }],
      };
      continue;
    }

    // Convert role: assistant -> model
    const role: "user" | "model" = msg.role === "assistant" ? "model" : "user";
    const parts: GeminiPart[] = [];

    if (typeof msg.content === "string") {
      parts.push({ text: msg.content });
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === "text" && part.text) {
          parts.push({ text: part.text });
        } else if (part.type === "image_url" && part.image_url?.url) {
          const imageData = parseDataUrl(part.image_url.url);
          if (imageData) {
            parts.push({
              inlineData: {
                mimeType: imageData.mimeType,
                data: imageData.data,
              },
            });
          }
        }
      }
    }

    if (parts.length > 0) {
      contents.push({ role, parts });
    }
  }

  return { contents, systemInstruction };
}

// Parse data URL to extract mime type and base64 data
function parseDataUrl(url: string): { mimeType: string; data: string } | null {
  // Handle data URLs: data:image/jpeg;base64,/9j/4AAQ...
  const dataUrlMatch = url.match(/^data:([^;]+);base64,(.+)$/);
  if (dataUrlMatch) {
    return {
      mimeType: dataUrlMatch[1],
      data: dataUrlMatch[2],
    };
  }
  return null;
}

// Convert OpenAI tools to Gemini format
function convertToGeminiTools(tools: OpenAITool[]): GeminiTool[] {
  const functionDeclarations: GeminiFunctionDeclaration[] = tools
    .filter((t) => t.type === "function")
    .map((t) => ({
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters,
    }));

  return [{ functionDeclarations }];
}

// Make API request with retry logic
async function makeGeminiRequest(
  model: string,
  request: GeminiRequest,
  maxRetries: number = 3
): Promise<GeminiResponse> {
  const apiKey = getApiKey();
  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  let lastError: Error | null = null;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      logger.log(`Calling Gemini API (${model}), attempt ${retryCount + 1}...`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      // Handle rate limiting (429)
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const waitTime = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : Math.min(1000 * Math.pow(2, retryCount), 32000); // Exponential backoff, max 32s

        logger.warn(`Rate limited (429). Waiting ${waitTime}ms before retry...`);

        if (retryCount < maxRetries) {
          await sleep(waitTime);
          retryCount++;
          continue;
        }
        throw new GeminiError(
          "Taxa de requisições excedida. Tente novamente em alguns segundos.",
          429,
          true
        );
      }

      // Handle server errors (500, 503) - retry once
      if (response.status === 500 || response.status === 503) {
        logger.warn(`Server error (${response.status}). Retrying once...`);

        if (retryCount < 1) {
          await sleep(2000);
          retryCount++;
          continue;
        }
        throw new GeminiError(
          "Erro no servidor do Gemini. Tente novamente.",
          response.status,
          true
        );
      }

      // Handle other errors
      if (!response.ok) {
        const errorBody = await response.text();
        logger.error(`Gemini API error: ${response.status}`, errorBody);

        let errorMessage = "Erro na chamada do Gemini API";
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.error?.message || errorMessage;
        } catch {
          // Keep default message
        }

        throw new GeminiError(errorMessage, response.status, false);
      }

      const data: GeminiResponse = await response.json();

      // Check for API-level errors in response
      if (data.error) {
        throw new GeminiError(
          data.error.message || "Erro desconhecido do Gemini",
          data.error.code || 500,
          false
        );
      }

      return data;
    } catch (error) {
      if (error instanceof GeminiError) {
        throw error;
      }
      lastError = error as Error;
      logger.error(`Gemini request failed:`, error);

      if (retryCount < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, retryCount), 16000);
        await sleep(waitTime);
        retryCount++;
        continue;
      }
    }
  }

  throw new GeminiError(
    lastError?.message || "Falha na comunicação com Gemini API",
    500,
    true
  );
}

// Extract text response from Gemini response
function extractTextResponse(response: GeminiResponse): string | null {
  const candidate = response.candidates?.[0];
  if (!candidate) return null;

  const textParts = candidate.content.parts
    .filter((p) => p.text)
    .map((p) => p.text);

  return textParts.length > 0 ? textParts.join("") : null;
}

// Extract function call from Gemini response
function extractFunctionCall(
  response: GeminiResponse
): { name: string; args: Record<string, unknown> } | null {
  const candidate = response.candidates?.[0];
  if (!candidate) return null;

  const functionCallPart = candidate.content.parts.find((p) => p.functionCall);
  if (functionCallPart?.functionCall) {
    return {
      name: functionCallPart.functionCall.name,
      args: functionCallPart.functionCall.args,
    };
  }

  return null;
}

/**
 * Basic chat completion with Gemini
 * @param model - Gemini model name (default: gemini-2.0-flash-exp)
 * @param messages - OpenAI-style messages array
 * @param options - Additional options (temperature, maxTokens)
 */
export async function callGemini(
  model: string = DEFAULT_MODEL,
  messages: OpenAIMessage[],
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<{ text: string | null; finishReason: string }> {
  const { contents, systemInstruction } = convertToGeminiFormat(messages);

  const request: GeminiRequest = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 2048,
    },
  };

  if (systemInstruction) {
    request.systemInstruction = systemInstruction;
  }

  const response = await makeGeminiRequest(model, request);
  const text = extractTextResponse(response);
  const finishReason = response.candidates?.[0]?.finishReason || "UNKNOWN";

  return { text, finishReason };
}

/**
 * Vision completion with Gemini (image analysis)
 * @param model - Gemini model name (default: gemini-2.0-flash-exp)
 * @param prompt - Text prompt for image analysis
 * @param imageBase64 - Base64-encoded image data (without data URL prefix)
 * @param mimeType - Image MIME type (e.g., "image/jpeg", "image/png")
 * @param options - Additional options
 */
export async function callGeminiVision(
  model: string = DEFAULT_MODEL,
  prompt: string,
  imageBase64: string,
  mimeType: string,
  options: {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<{ text: string | null; finishReason: string }> {
  const parts: GeminiPart[] = [
    { text: prompt },
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
  ];

  const request: GeminiRequest = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: options.temperature ?? 0.1,
      maxOutputTokens: options.maxTokens ?? 2048,
    },
  };

  if (options.systemPrompt) {
    request.systemInstruction = {
      parts: [{ text: options.systemPrompt }],
    };
  }

  const response = await makeGeminiRequest(model, request);
  const text = extractTextResponse(response);
  const finishReason = response.candidates?.[0]?.finishReason || "UNKNOWN";

  return { text, finishReason };
}

/**
 * Function calling with Gemini (tool use)
 * @param model - Gemini model name (default: gemini-2.0-flash-exp)
 * @param messages - OpenAI-style messages array
 * @param tools - OpenAI-style tools array
 * @param options - Additional options including forceFunctionName to force a specific function
 */
export async function callGeminiWithTools(
  model: string = DEFAULT_MODEL,
  messages: OpenAIMessage[],
  tools: OpenAITool[],
  options: {
    temperature?: number;
    maxTokens?: number;
    forceFunctionName?: string; // Force calling a specific function
  } = {}
): Promise<{
  text: string | null;
  functionCall: { name: string; args: Record<string, unknown> } | null;
  finishReason: string;
}> {
  const { contents, systemInstruction } = convertToGeminiFormat(messages);
  const geminiTools = convertToGeminiTools(tools);

  const request: GeminiRequest = {
    contents,
    tools: geminiTools,
    generationConfig: {
      temperature: options.temperature ?? 0.1,
      maxOutputTokens: options.maxTokens ?? 3000,
    },
  };

  if (systemInstruction) {
    request.systemInstruction = systemInstruction;
  }

  // Configure tool calling mode
  if (options.forceFunctionName) {
    request.toolConfig = {
      functionCallingConfig: {
        mode: "ANY",
        allowedFunctionNames: [options.forceFunctionName],
      },
    };
  } else {
    request.toolConfig = {
      functionCallingConfig: {
        mode: "AUTO",
      },
    };
  }

  const response = await makeGeminiRequest(model, request);
  const text = extractTextResponse(response);
  const functionCall = extractFunctionCall(response);
  const finishReason = response.candidates?.[0]?.finishReason || "UNKNOWN";

  return { text, functionCall, finishReason };
}

/**
 * Vision with function calling (for structured analysis like dental photos)
 * Combines image input with tool use
 */
export async function callGeminiVisionWithTools(
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
  } = {}
): Promise<{
  text: string | null;
  functionCall: { name: string; args: Record<string, unknown> } | null;
  finishReason: string;
}> {
  const parts: GeminiPart[] = [
    { text: prompt },
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
  ];

  const geminiTools = convertToGeminiTools(tools);

  const request: GeminiRequest = {
    contents: [{ role: "user", parts }],
    tools: geminiTools,
    generationConfig: {
      temperature: options.temperature ?? 0.1,
      maxOutputTokens: options.maxTokens ?? 3000,
    },
  };

  if (options.systemPrompt) {
    request.systemInstruction = {
      parts: [{ text: options.systemPrompt }],
    };
  }

  // Configure tool calling mode
  if (options.forceFunctionName) {
    request.toolConfig = {
      functionCallingConfig: {
        mode: "ANY",
        allowedFunctionNames: [options.forceFunctionName],
      },
    };
  } else {
    request.toolConfig = {
      functionCallingConfig: {
        mode: "AUTO",
      },
    };
  }

  const response = await makeGeminiRequest(model, request);
  const text = extractTextResponse(response);
  const functionCall = extractFunctionCall(response);
  const finishReason = response.candidates?.[0]?.finishReason || "UNKNOWN";

  return { text, functionCall, finishReason };
}

/**
 * Image editing/generation with Gemini (for DSD simulation)
 * Uses Gemini 2.0 Flash with image output capability
 * @param prompt - Text prompt describing the edit
 * @param imageBase64 - Base64-encoded input image (without data URL prefix)
 * @param mimeType - Input image MIME type
 * @param options - Additional options
 * @returns Generated image as base64 data URL or null
 */
export async function callGeminiImageEdit(
  prompt: string,
  imageBase64: string,
  mimeType: string,
  options: {
    temperature?: number;
    timeoutMs?: number;
  } = {}
): Promise<{ imageUrl: string | null; text: string | null }> {
  const apiKey = getApiKey();
  const model = "gemini-2.0-flash-exp"; // Model with image generation capability
  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  const request = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: options.temperature ?? 0.4,
      responseModalities: ["TEXT", "IMAGE"],
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 60000
  );

  try {
    logger.log(`Calling Gemini Image Edit API...`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(`Gemini Image API error: ${response.status}`, errorBody);

      if (response.status === 429) {
        throw new GeminiError(
          "Taxa de requisições excedida. Tente novamente.",
          429,
          true
        );
      }

      throw new GeminiError(
        `Erro na geração de imagem: ${response.status}`,
        response.status,
        response.status >= 500
      );
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];

    if (!candidate?.content?.parts) {
      logger.warn("No parts in Gemini image response");
      return { imageUrl: null, text: null };
    }

    let imageUrl: string | null = null;
    let text: string | null = null;

    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        const imgMimeType = part.inlineData.mimeType || "image/png";
        imageUrl = `data:${imgMimeType};base64,${part.inlineData.data}`;
      }
      if (part.text) {
        text = part.text;
      }
    }

    return { imageUrl, text };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof GeminiError) {
      throw error;
    }

    if ((error as Error).name === "AbortError") {
      throw new GeminiError("Timeout na geração de imagem", 408, true);
    }

    logger.error("Gemini Image Edit error:", error);
    throw new GeminiError(
      "Erro na comunicação com Gemini API",
      500,
      true
    );
  }
}

// Export default model for convenience
export { DEFAULT_MODEL as GEMINI_DEFAULT_MODEL };
