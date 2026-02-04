/**
 * pageToast - Centralized Toast Notifications for PageShell
 *
 * Unified API for showing toast notifications across the app.
 * Built on top of Sonner with Portuguese defaults and tRPC error helpers.
 *
 * @module @pageshell/core/toast
 *
 * @example
 * ```tsx
 * import { pageToast } from '@pageshell/core';
 *
 * // Simple notifications
 * pageToast.success('Salvo com sucesso!');
 * pageToast.error('Falha ao salvar');
 *
 * // tRPC error handling
 * onError: (error) => pageToast.trpcError(error)
 *
 * // Async operations with loading state
 * await pageToast.promise(
 *   saveData(),
 *   { loading: 'Salvando...', success: 'Salvo!', error: 'Erro ao salvar' }
 * );
 * ```
 */

import { toast as sonnerToast, type ExternalToast } from 'sonner';

// =============================================================================
// Types
// =============================================================================

export interface PageToastPromiseMessages<T = unknown> {
  loading?: string;
  success?: string | ((data: T) => string);
  error?: string | ((error: unknown) => string);
}

export interface PageToastAction {
  label: string;
  onClick: () => void;
}

/**
 * tRPC Error structure for type-safe error handling
 */
export interface TRPCErrorShape {
  message?: string;
  data?: {
    code?: string;
    httpStatus?: number;
    path?: string;
  };
}

/**
 * Error code to user-friendly message mapping
 */
export interface ErrorCodeMessages {
  TOO_MANY_REQUESTS?: string;
  UNAUTHORIZED?: string;
  FORBIDDEN?: string;
  NOT_FOUND?: string;
  BAD_REQUEST?: string;
  CONFLICT?: string;
  INTERNAL_SERVER_ERROR?: string;
  [key: string]: string | undefined;
}

// =============================================================================
// Default Messages (English - i18n override via props)
// =============================================================================

const DEFAULT_MESSAGES = {
  loading: 'Loading...',
  success: 'Success!',
  error: 'An error occurred. Please try again.',
  copied: 'Copied!',
  saved: 'Saved successfully!',
  deleted: 'Deleted successfully!',
  updated: 'Updated successfully!',
};

/**
 * Default error code to message mapping (English - i18n override via options)
 * These are used when no custom message is provided
 */
const DEFAULT_ERROR_CODE_MESSAGES: ErrorCodeMessages = {
  TOO_MANY_REQUESTS: 'You have reached the request limit. Please try again later.',
  UNAUTHORIZED: 'You must be logged in to perform this action.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  BAD_REQUEST: 'Invalid data. Please check the fields and try again.',
  CONFLICT: 'This resource already exists or conflicts with existing data.',
  INTERNAL_SERVER_ERROR: 'Internal server error. Please try again later.',
  TIMEOUT: 'The request took too long. Please try again.',
  NETWORK_ERROR: 'Connection error. Please check your internet.',
};

// =============================================================================
// Error Handling Utilities
// =============================================================================

/**
 * Extract error code from tRPC error
 */
function extractErrorCode(error: unknown): string | undefined {
  if (!error) return undefined;

  // Check for tRPC error structure
  const trpcError = error as TRPCErrorShape;
  if (trpcError.data?.code) {
    return trpcError.data.code;
  }

  // Check for error.code property
  if ((error as { code?: string }).code) {
    return (error as { code: string }).code;
  }

  return undefined;
}

/**
 * Extract error message from various error types
 */
function extractErrorMessage(error: unknown): string {
  if (!error) return DEFAULT_MESSAGES.error;

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  const errorObj = error as { message?: string };
  return errorObj.message ?? DEFAULT_MESSAGES.error;
}

/**
 * Get user-friendly message for an error code
 */
function getMessageForCode(
  code: string | undefined,
  customMessages?: ErrorCodeMessages
): string | undefined {
  if (!code) return undefined;

  // Check custom messages first
  if (customMessages?.[code]) {
    return customMessages[code];
  }

  // Fall back to defaults
  return DEFAULT_ERROR_CODE_MESSAGES[code];
}

// =============================================================================
// Toast API
// =============================================================================

type ToastId = string | number;

export const pageToast = {
  /**
   * Show a success notification
   *
   * @example
   * pageToast.success('Perfil atualizado!');
   * pageToast.success('Curso publicado!', { duration: 5000 });
   */
  success: (message: string, options?: ExternalToast): ToastId => {
    return sonnerToast.success(message, options);
  },

  /**
   * Show an error notification
   *
   * @example
   * pageToast.error('Erro ao salvar');
   * pageToast.error(error.message || 'Erro desconhecido');
   */
  error: (message: string, options?: ExternalToast): ToastId => {
    return sonnerToast.error(message, options);
  },

  /**
   * Show an info notification
   *
   * @example
   * pageToast.info('Nova versão disponível');
   */
  info: (message: string, options?: ExternalToast): ToastId => {
    return sonnerToast.info(message, options);
  },

  /**
   * Show a warning notification
   *
   * @example
   * pageToast.warning('Sua sessão expira em 5 minutos');
   */
  warning: (message: string, options?: ExternalToast): ToastId => {
    return sonnerToast.warning(message, options);
  },

  /**
   * Show a loading notification
   * Returns toast ID for dismissal
   *
   * @example
   * const id = pageToast.loading('Processando...');
   * // later...
   * pageToast.dismiss(id);
   */
  loading: (message: string = DEFAULT_MESSAGES.loading, options?: ExternalToast): ToastId => {
    return sonnerToast.loading(message, options);
  },

  /**
   * Dismiss a toast by ID or dismiss all toasts
   *
   * @example
   * pageToast.dismiss(); // dismiss all
   * pageToast.dismiss(toastId); // dismiss specific
   */
  dismiss: (toastId?: string | number): ToastId => {
    return sonnerToast.dismiss(toastId);
  },

  /**
   * Handle tRPC/API errors with appropriate toast notification
   *
   * Automatically maps error codes to user-friendly messages.
   * You can provide custom messages for specific error codes.
   *
   * @example
   * // Basic usage
   * const mutation = api.user.update.useMutation({
   *   onError: (error) => pageToast.trpcError(error),
   * });
   *
   * @example
   * // With custom messages for specific codes
   * const mutation = api.report.create.useMutation({
   *   onError: (error) => pageToast.trpcError(error, {
   *     TOO_MANY_REQUESTS: 'Você atingiu o limite de 5 reports por dia.',
   *   }),
   * });
   */
  trpcError: (
    error: unknown,
    customMessagesOrFallback?: ErrorCodeMessages | string
  ): ToastId => {
    // Handle legacy string fallback
    const customMessages =
      typeof customMessagesOrFallback === 'string'
        ? undefined
        : customMessagesOrFallback;
    const fallbackMessage =
      typeof customMessagesOrFallback === 'string'
        ? customMessagesOrFallback
        : undefined;

    // Extract error code and check for custom message
    const errorCode = extractErrorCode(error);
    const codeMessage = getMessageForCode(errorCode, customMessages);

    // Use code message if available, otherwise extract from error
    const message = codeMessage ?? extractErrorMessage(error) ?? fallbackMessage ?? DEFAULT_MESSAGES.error;

    return sonnerToast.error(message);
  },

  /**
   * Create an error handler function for mutations
   *
   * Returns a handler that can be passed directly to useMutation's onError.
   * Useful for creating reusable error handlers with custom messages.
   *
   * @example
   * const errorHandler = pageToast.createErrorHandler({
   *   TOO_MANY_REQUESTS: 'Limite diário atingido.',
   *   FORBIDDEN: 'Você não pode editar este item.',
   * });
   *
   * const mutation = api.item.update.useMutation({
   *   onError: errorHandler,
   * });
   */
  createErrorHandler: (customMessages?: ErrorCodeMessages): ((error: unknown) => void) => {
    return (error: unknown) => {
      pageToast.trpcError(error, customMessages);
    };
  },

  /**
   * Show a toast for an async operation with loading/success/error states
   *
   * @example
   * const result = await pageToast.promise(
   *   api.course.publish.mutateAsync(courseId),
   *   {
   *     loading: 'Publicando curso...',
   *     success: 'Curso publicado!',
   *     error: 'Erro ao publicar curso',
   *   }
   * );
   */
  promise: <T>(
    promise: Promise<T>,
    messages: PageToastPromiseMessages<T> = {}
  ): Promise<T> => {
    const {
      loading = DEFAULT_MESSAGES.loading,
      success = DEFAULT_MESSAGES.success,
      error = DEFAULT_MESSAGES.error,
    } = messages;

    sonnerToast.promise(promise, {
      loading,
      success,
      error,
    });

    return promise;
  },

  /**
   * Show a custom toast with JSX content
   *
   * @example
   * pageToast.custom((t) => (
   *   <div>
   *     Custom content
   *     <button onClick={() => pageToast.dismiss(t)}>Close</button>
   *   </div>
   * ));
   */
  custom: sonnerToast.custom as (...args: Parameters<typeof sonnerToast.custom>) => ToastId,

  /**
   * Show a message toast (neutral, no icon)
   *
   * @example
   * pageToast.message('Bem-vindo de volta!');
   */
  message: sonnerToast.message as (...args: Parameters<typeof sonnerToast.message>) => ToastId,

  // =========================================================================
  // Convenience Methods (Common Actions)
  // =========================================================================

  /**
   * Show "copied to clipboard" toast
   *
   * @example
   * await navigator.clipboard.writeText(text);
   * pageToast.copied();
   * pageToast.copied('Link copiado!');
   */
  copied: (message: string = DEFAULT_MESSAGES.copied): ToastId => {
    return sonnerToast.success(message);
  },

  /**
   * Show "saved" toast
   *
   * @example
   * pageToast.saved();
   * pageToast.saved('Rascunho salvo!');
   */
  saved: (message: string = DEFAULT_MESSAGES.saved): ToastId => {
    return sonnerToast.success(message);
  },

  /**
   * Show "deleted" toast
   *
   * @example
   * pageToast.deleted();
   * pageToast.deleted('Curso excluído!');
   */
  deleted: (message: string = DEFAULT_MESSAGES.deleted): ToastId => {
    return sonnerToast.success(message);
  },

  /**
   * Show "updated" toast
   *
   * @example
   * pageToast.updated();
   * pageToast.updated('Perfil atualizado!');
   */
  updated: (message: string = DEFAULT_MESSAGES.updated): ToastId => {
    return sonnerToast.success(message);
  },
};

// =============================================================================
// Type Export
// =============================================================================

export type PageToast = typeof pageToast;
