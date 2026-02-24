import { toast } from 'sonner';
import { logger } from './logger';
import i18n from '@/lib/i18n';

interface AppError {
  code?: string;
  message?: string;
  status?: number;
  details?: string;
}

// Map database/API error codes to i18n keys
const ERROR_CODE_KEYS: Record<string, string> = {
  // PostgreSQL errors
  '23505': 'errors.23505',
  '23503': 'errors.23503',
  '23502': 'errors.23502',
  '22P02': 'errors.22P02',

  // Supabase PostgREST errors
  'PGRST116': 'errors.PGRST116',
  'PGRST301': 'errors.PGRST301',

  // Auth errors
  'invalid_credentials': 'errors.invalidCredentials',
  'email_not_confirmed': 'errors.emailNotConfirmed',
  'user_already_exists': 'errors.userAlreadyExists',
  'weak_password': 'errors.weakPassword',
  'expired_token': 'errors.expiredToken',

  // Custom app errors
  'rate_limited': 'errors.rateLimited',
  'network_error': 'errors.networkError',
  'auth_expired': 'errors.authExpired',
  'payment_required': 'errors.paymentRequired',
  'ai_error': 'errors.aiError',
  'file_too_large': 'errors.fileTooLarge',
  'invalid_file_type': 'errors.invalidFileType',
};

/** Check if an error message contains internal/sensitive details that shouldn't be shown to users */
function containsSensitiveInfo(msg: string): boolean {
  const lower = msg.toLowerCase();
  const sensitivePatterns = [
    'sql', 'select ', 'insert ', 'update ', 'delete from',
    'relation ', 'column ', 'constraint', 'violates',
    'stack', 'trace', 'at ', '/src/', '/node_modules/',
    'econnrefused', 'enotfound', 'etimedout',
    'supabase', 'postgres', 'deno', 'edge function',
    'secret', 'key', 'password', 'credential',
  ];
  return sensitivePatterns.some(p => lower.includes(p));
}

/**
 * Handle errors and show user-friendly toast messages
 */
export function handleError(
  error: AppError | Error | unknown,
  fallbackMessage = i18n.t('errors.unexpectedError')
): string {
  const appError = error as AppError;

  // Log the full error for debugging
  logger.error('Error occurred:', error);

  // Try to find a user-friendly message
  let message = fallbackMessage;

  if (appError?.code && ERROR_CODE_KEYS[appError.code]) {
    message = i18n.t(ERROR_CODE_KEYS[appError.code]);
  } else if (appError?.message) {
    // Check if message contains any known error patterns
    const lowerMessage = appError.message.toLowerCase();

    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      message = i18n.t('errors.networkError');
    } else if (lowerMessage.includes('jwt') || lowerMessage.includes('token')) {
      message = i18n.t('errors.authExpired');
    } else if (lowerMessage.includes('duplicate') || lowerMessage.includes('unique')) {
      message = i18n.t('errors.23505');
    }
    // All other messages fall back to fallbackMessage — we only show messages
    // that match an explicit safe pattern above to avoid leaking internal details.
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
    toast.error(i18n.t('errors.networkError'), { duration: 5000 });
    return;
  }

  handleError(error, i18n.t('errors.errorContext', { context }));
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

  const key = error.code ? ERROR_CODE_KEYS[error.code] : null;
  let safeMessage: string | null = null;
  if (key) {
    safeMessage = i18n.t(key);
  } else if (error.message && !containsSensitiveInfo(error.message) && error.message.length <= 120) {
    safeMessage = error.message;
  }
  const message = safeMessage || i18n.t('errors.errorContext', { context });

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
