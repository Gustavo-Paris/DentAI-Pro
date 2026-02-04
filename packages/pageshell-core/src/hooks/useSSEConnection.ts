'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// =============================================================================
// Types
// =============================================================================

export type SSEConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface SSELogger {
  debug: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, error?: unknown) => void;
}

export interface UseSSEConnectionOptions {
  /** Whether the connection is enabled (default: true) */
  enabled?: boolean;
  /** Whether to automatically reconnect on disconnect (default: true) */
  autoReconnect?: boolean;
  /** Maximum number of reconnection attempts (default: 5) */
  maxReconnectAttempts?: number;
  /** Initial delay for reconnection backoff in ms (default: 1000) */
  initialReconnectDelay?: number;
  /** Maximum delay for reconnection backoff in ms (default: 30000) */
  maxReconnectDelay?: number;
  /** Heartbeat timeout in ms - disconnect if no event received (default: 60000) */
  heartbeatTimeout?: number;
  /** Include credentials in request (default: true) */
  withCredentials?: boolean;
  /** Named events to listen for (in addition to generic 'message') */
  namedEvents?: string[];
  /** Called when connection opens */
  onOpen?: () => void;
  /** Called on connection error */
  onError?: () => void;
  /** Called when max reconnect attempts reached */
  onMaxReconnectReached?: () => void;
  /** Optional logger for debugging (defaults to no-op in production) */
  logger?: SSELogger;
}

export interface UseSSEConnectionReturn {
  /** Current connection status */
  connectionStatus: SSEConnectionStatus;
  /** Manually trigger connection */
  connect: () => void;
  /** Manually disconnect */
  disconnect: () => void;
  /** Whether currently connected */
  isConnected: boolean;
  /** Current reconnection attempt count */
  reconnectAttempts: number;
  /** Reset heartbeat timeout - call when processing events */
  resetHeartbeat: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_OPTIONS: Required<
  Omit<UseSSEConnectionOptions, 'namedEvents' | 'onOpen' | 'onError' | 'onMaxReconnectReached' | 'logger'>
> = {
  enabled: true,
  autoReconnect: true,
  maxReconnectAttempts: 5,
  initialReconnectDelay: 1000,
  maxReconnectDelay: 30000,
  heartbeatTimeout: 60000,
  withCredentials: true,
};

/** No-op logger for production (silent) */
const NOOP_LOGGER: SSELogger = {
  debug: () => {},
  warn: () => {},
  error: () => {},
};

/** Console logger for development */
export const SSE_CONSOLE_LOGGER: SSELogger = {
  debug: (message, data) => console.debug(`[SSE] ${message}`, data ?? ''),
  warn: (message, data) => console.warn(`[SSE] ${message}`, data ?? ''),
  error: (message, error) => console.error(`[SSE] ${message}`, error ?? ''),
};

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * useSSEConnection - Base hook for Server-Sent Events connections
 *
 * Provides shared SSE connection management:
 * - Connection state tracking
 * - Automatic reconnection with exponential backoff
 * - Heartbeat detection for connection health
 * - Clean disconnect handling
 *
 * @param url - The SSE endpoint URL (null to disable connection)
 * @param onMessage - Callback when a message event is received
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const handleMessage = useCallback((event: MessageEvent) => {
 *   const data = JSON.parse(event.data);
 *   // Handle event...
 * }, []);
 *
 * const { connectionStatus, isConnected } = useSSEConnection(
 *   enabled ? '/api/my-endpoint/events' : null,
 *   handleMessage,
 *   { heartbeatTimeout: 30000 }
 * );
 * ```
 */
export function useSSEConnection(
  url: string | null,
  onMessage: (event: MessageEvent) => void,
  options: UseSSEConnectionOptions = {}
): UseSSEConnectionReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const log = options.logger ?? NOOP_LOGGER;

  // State
  const [connectionStatus, setConnectionStatus] = useState<SSEConnectionStatus>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Refs
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isManualDisconnectRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  // Store callback in ref to avoid stale closures
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  /**
   * Reset heartbeat timeout
   * Should be called when any event is received to indicate connection is alive
   */
  const resetHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }

    heartbeatTimeoutRef.current = setTimeout(() => {
      log.warn('Heartbeat timeout - no event received');
      setConnectionStatus('error');

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }, opts.heartbeatTimeout);
  }, [opts.heartbeatTimeout, log]);

  /**
   * Calculate reconnection delay with exponential backoff
   */
  const getReconnectDelay = useCallback(
    (attempt: number): number => {
      const delay = opts.initialReconnectDelay * Math.pow(2, attempt);
      return Math.min(delay, opts.maxReconnectDelay);
    },
    [opts.initialReconnectDelay, opts.maxReconnectDelay]
  );

  /**
   * Connect to SSE stream
   */
  const connect = useCallback(() => {
    if (!opts.enabled || !url) {
      log.debug('SSE connection skipped (disabled or no URL)');
      return;
    }

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    isManualDisconnectRef.current = false;
    setConnectionStatus('connecting');

    try {
      const eventSource = new EventSource(url, {
        withCredentials: opts.withCredentials,
      });

      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        log.debug('SSE connection opened', { url });
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        setReconnectAttempts(0);
        resetHeartbeat();
        opts.onOpen?.();
      };

      // Generic message handler
      eventSource.onmessage = (e) => {
        resetHeartbeat();
        onMessageRef.current(e);
      };

      // Add named event listeners if specified
      if (options.namedEvents) {
        for (const eventName of options.namedEvents) {
          eventSource.addEventListener(eventName, (e) => {
            resetHeartbeat();
            onMessageRef.current(e as MessageEvent);
          });
        }
      }

      eventSource.onerror = () => {
        eventSource.close();
        eventSourceRef.current = null;

        if (isManualDisconnectRef.current) {
          setConnectionStatus('disconnected');
          return;
        }

        setConnectionStatus('error');
        opts.onError?.();

        // Attempt reconnection with backoff
        const currentAttempts = reconnectAttemptsRef.current;
        if (opts.autoReconnect && currentAttempts < opts.maxReconnectAttempts) {
          const delay = getReconnectDelay(currentAttempts);
          log.debug(
            `SSE reconnecting in ${delay}ms (attempt ${currentAttempts + 1}/${opts.maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            setReconnectAttempts(reconnectAttemptsRef.current);
            connect();
          }, delay);
        } else if (currentAttempts >= opts.maxReconnectAttempts) {
          log.error('SSE max reconnection attempts reached');
          opts.onMaxReconnectReached?.();
        }
      };
    } catch (error) {
      log.error('Failed to create EventSource:', error);
      setConnectionStatus('error');
    }
  }, [url, opts, resetHeartbeat, getReconnectDelay, options.namedEvents, log]);

  /**
   * Disconnect from SSE stream
   */
  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setConnectionStatus('disconnected');
    reconnectAttemptsRef.current = 0;
    setReconnectAttempts(0);
  }, []);

  // Auto-connect when enabled and URL is available
  useEffect(() => {
    if (opts.enabled && url) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [opts.enabled, url]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    connectionStatus,
    connect,
    disconnect,
    isConnected: connectionStatus === 'connected',
    reconnectAttempts,
    resetHeartbeat,
  };
}
