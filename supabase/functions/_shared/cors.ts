// Shared CORS configuration and utilities for all edge functions
// Restricts API access to known origins for defense-in-depth

/** Generate a short request ID for tracing (8-char hex) */
export function generateRequestId(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const PRODUCTION_ORIGINS = [
  // Current production
  "https://tosmile-ai.vercel.app",
  "https://tosmile.ai",
  "https://www.tosmile.ai",
  // Legacy domains — keep until DNS migration confirmed and traffic verified at zero
  // TODO(2026-Q2): verify traffic on legacy domains and remove unused ones
  "https://auria-ai.vercel.app",
  "https://dentai.pro",
  "https://www.dentai.pro",
  "https://dentai-pro.vercel.app",
];

// Check environment - only allow localhost origins in development
const isDevelopment = Deno.env.get("ENVIRONMENT") !== "production";

function isLocalhostOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  
  // Check if origin is in allowed list
  const isAllowed =
    !!origin &&
    (PRODUCTION_ORIGINS.includes(origin) ||
      // Localhost in development (any port)
      (isDevelopment && isLocalhostOrigin(origin)));

  // For disallowed origins, set first production origin — browser will block the
  // mismatch. We don't omit the header entirely because some Supabase infra
  // requires it present; using a non-matching value is the standard pattern.
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : PRODUCTION_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
}

export function handleCorsPreFlight(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  return null;
}

// User-friendly error messages that don't expose internal details
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Não autorizado",
  INVALID_TOKEN: "Token inválido",
  ACCESS_DENIED: "Acesso negado",
  INVALID_REQUEST: "Dados inválidos",
  PROCESSING_ERROR: "Erro ao processar solicitação",
  AI_ERROR: "Erro na análise. Tente novamente",
  RATE_LIMITED: "Limite de requisições excedido. Aguarde alguns minutos",
  PAYMENT_REQUIRED: "Créditos insuficientes. Adicione créditos à sua conta",
  IMAGE_INVALID: "Formato de imagem inválido",
  IMAGE_TOO_LARGE: "Imagem muito grande. Máximo: 10MB",
  IMAGE_FORMAT_UNSUPPORTED: "Formato de imagem não suportado. Use JPG, PNG ou WEBP",
  NO_PHOTO: "Nenhuma foto válida encontrada",
  ANALYSIS_FAILED: "Não foi possível analisar a foto. Tente novamente",
} as const;

export function createErrorResponse(
  message: string,
  status: number,
  corsHeaders: Record<string, string>,
  code?: string,
  requestId?: string,
): Response {
  return new Response(
    JSON.stringify({ error: message, ...(code && { code }), ...(requestId && { requestId }) }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
