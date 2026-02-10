import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { trackTiming } from '@/lib/webVitals';
import { logger } from '@/lib/logger';

const SESSION_REFRESH_THRESHOLD_MS = 60 * 1000; // Refresh if session expires in < 60s

interface InvokeOptions {
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
}

/**
 * Hook that provides authenticated function invocation with automatic session refresh.
 * Prevents 401 errors during long-running operations by refreshing tokens proactively.
 */
export function useAuthenticatedFetch() {
  const invokeFunction = useCallback(async <T = unknown>(
    functionName: string,
    options?: InvokeOptions
  ): Promise<{ data: T | null; error: Error | null }> => {
    try {
      // Get current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        logger.error('Session error:', sessionError);
        return { data: null, error: sessionError };
      }

      if (!sessionData.session) {
        return { data: null, error: new Error('No active session') };
      }

      const session = sessionData.session;
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      // Proactively refresh if session is close to expiring
      if (timeUntilExpiry < SESSION_REFRESH_THRESHOLD_MS) {
        logger.debug('Session expiring soon, refreshing token...');
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          logger.error('Token refresh failed:', refreshError);
          // Continue anyway - the call might still work
        } else {
          logger.debug('Token refreshed successfully');
        }
      }

      // Invoke the edge function with timing
      const startTime = performance.now();
      const { data, error } = await supabase.functions.invoke<T>(functionName, {
        body: options?.body,
        headers: options?.headers,
      });
      const duration = performance.now() - startTime;

      // Track function timing for performance monitoring
      trackTiming(`edge-fn-${functionName}`, duration);

      if (error) {
        // Extract the actual error body from the Response context
        // FunctionsHttpError stores the Response object in error.context
        const context = (error as { context?: Response }).context;
        if (context && typeof context.json === 'function') {
          try {
            const body = await context.json();
            const serverMessage = body?.error || body?.message;
            if (serverMessage) {
              // Enrich error with server message and status info
              const status = context.status || 0;
              const enriched = new Error(serverMessage);
              (enriched as { code?: string }).code = body?.code;
              (enriched as { status?: number }).status = status;
              logger.error(`Edge function ${functionName} error (${status}):`, serverMessage);

              // Check if it's a 401 and try to refresh + retry once
              if (status === 401) {
                logger.debug('Got 401, attempting token refresh and retry...');
                const { error: refreshError } = await supabase.auth.refreshSession();
                if (refreshError) {
                  logger.error('Token refresh after 401 failed:', refreshError);
                  return { data: null, error: enriched };
                }
                const retryResult = await supabase.functions.invoke<T>(functionName, {
                  body: options?.body,
                  headers: options?.headers,
                });
                return { data: retryResult.data, error: retryResult.error };
              }

              return { data: null, error: enriched };
            }
          } catch {
            // Response body already consumed or not JSON — fall through
          }
        }

        // Fallback: check error message for 401
        const errorMessage = error.message || '';
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          logger.debug('Got 401, attempting token refresh and retry...');

          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            logger.error('Token refresh after 401 failed:', refreshError);
            return { data: null, error };
          }

          // Retry the request
          const retryResult = await supabase.functions.invoke<T>(functionName, {
            body: options?.body,
            headers: options?.headers,
          });

          return { data: retryResult.data, error: retryResult.error };
        }

        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      logger.error('invokeFunction error:', err);
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }, []);

  return { invokeFunction };
}
