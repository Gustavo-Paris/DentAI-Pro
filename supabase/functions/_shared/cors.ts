// Shared CORS configuration for all edge functions
// Restricts API access to known origins for defense-in-depth

const PRODUCTION_ORIGINS = [
  "https://resinmatch-ai.lovable.app",
  "https://id-preview--103c514c-01d4-492f-b5ae-b2ea6b76bdf3.lovable.app",
];

const DEVELOPMENT_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];

// Check environment - only allow localhost origins in development
const isDevelopment = Deno.env.get("ENVIRONMENT") !== "production";

const ALLOWED_ORIGINS = isDevelopment 
  ? [...PRODUCTION_ORIGINS, ...DEVELOPMENT_ORIGINS]
  : PRODUCTION_ORIGINS;

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  
  // Check if origin is in allowed list
  const isAllowed =
    !!origin &&
    (ALLOWED_ORIGINS.includes(origin) ||
      origin.endsWith(".lovable.app") ||
      // Preview domains (iframe) can be hosted under *.lovableproject.com
      origin.endsWith(".lovableproject.com"));
  
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
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
  code?: string
): Response {
  return new Response(
    JSON.stringify({ error: message, ...(code && { code }) }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
