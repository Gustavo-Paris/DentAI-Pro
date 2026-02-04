import { toast } from 'sonner';
import { logger } from './logger';

interface AppError {
  code?: string;
  message?: string;
  status?: number;
  details?: string;
}

// Map database/API error codes to user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  // PostgreSQL errors
  '23505': 'Este registro já existe. Verifique os dados.',
  '23503': 'Erro de referência. Dados relacionados não encontrados.',
  '23502': 'Campo obrigatório não preenchido.',
  '22P02': 'Formato de dados inválido.',
  
  // Supabase PostgREST errors
  'PGRST116': 'Nenhum registro encontrado.',
  'PGRST301': 'Erro de conexão com o banco de dados.',
  
  // Auth errors
  'invalid_credentials': 'Email ou senha incorretos.',
  'email_not_confirmed': 'Confirme seu email antes de fazer login.',
  'user_already_exists': 'Este email já está cadastrado.',
  'weak_password': 'Senha muito fraca. Use uma senha mais forte.',
  'expired_token': 'Link expirado. Solicite um novo.',
  
  // Custom app errors
  'rate_limited': 'Limite de requisições atingido. Aguarde alguns minutos.',
  'network_error': 'Erro de conexão. Verifique sua internet.',
  'auth_expired': 'Sessão expirada. Faça login novamente.',
  'payment_required': 'Créditos insuficientes.',
  'ai_error': 'Erro na análise de IA. Tente novamente.',
  'file_too_large': 'Arquivo muito grande. Máximo: 10MB.',
  'invalid_file_type': 'Tipo de arquivo não suportado.',
};

/**
 * Handle errors and show user-friendly toast messages
 */
export function handleError(
  error: AppError | Error | unknown, 
  fallbackMessage = 'Ocorreu um erro inesperado'
): string {
  const appError = error as AppError;
  
  // Log the full error for debugging
  logger.error('Error occurred:', error);
  
  // Try to find a user-friendly message
  let message = fallbackMessage;
  
  if (appError?.code && ERROR_MESSAGES[appError.code]) {
    message = ERROR_MESSAGES[appError.code];
  } else if (appError?.message) {
    // Check if message contains any known error patterns
    const lowerMessage = appError.message.toLowerCase();
    
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      message = ERROR_MESSAGES.network_error;
    } else if (lowerMessage.includes('jwt') || lowerMessage.includes('token')) {
      message = ERROR_MESSAGES.auth_expired;
    } else if (lowerMessage.includes('duplicate') || lowerMessage.includes('unique')) {
      message = ERROR_MESSAGES['23505'];
    } else if (appError.message.length < 100) {
      // Use the original message if it's short enough
      message = appError.message;
    }
  }
  
  toast.error(message, { duration: 5000 });
  return message;
}

/**
 * Handle API errors with context
 */
export function handleApiError(error: unknown, context: string): void {
  const appError = error as AppError;
  
  // Check for network errors
  const isNetworkError = 
    appError?.message?.toLowerCase().includes('fetch') ||
    appError?.message?.toLowerCase().includes('network') ||
    appError?.message?.toLowerCase().includes('failed to fetch');
  
  if (isNetworkError) {
    toast.error('Erro de conexão. Verifique sua internet.', { duration: 5000 });
    return;
  }
  
  handleError(error, `Erro ao ${context}`);
}

/**
 * Handle Supabase specific errors
 */
export function handleSupabaseError(
  error: { code?: string; message?: string; details?: string } | null,
  context: string
): boolean {
  if (!error) return false;
  
  logger.error(`Supabase error in ${context}:`, error);
  
  const message = 
    ERROR_MESSAGES[error.code || ''] ||
    error.message ||
    `Erro ao ${context}`;
  
  toast.error(message, { duration: 5000 });
  return true;
}

/**
 * Wrap async operations with error handling
 */
export async function withErrorHandler<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    handleApiError(error, context);
    return null;
  }
}
