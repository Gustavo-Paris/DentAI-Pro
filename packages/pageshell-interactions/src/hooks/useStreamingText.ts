'use client';

import { useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '@pageshell/core';

/**
 * Options for useStreamingText hook
 */
export interface StreamingTextOptions {
  /** Interval between chunk updates in milliseconds (default: 16ms ~60fps) */
  intervalMs?: number;
  /** Maximum number of animation steps (default: 120) */
  maxSteps?: number;
}

/**
 * Result from useStreamingText hook
 */
export interface StreamingTextResult {
  /** ID of the message currently being streamed */
  streamingId: string | null;
  /** Current visible content (may be partial during streaming) */
  streamingContent: string;
  /** Whether streaming animation is active */
  isStreaming: boolean;
}

/**
 * Hook to animate text appearing character-by-character.
 *
 * Useful for AI chat responses, typewriter effects, or any text that should
 * appear progressively. Respects `prefers-reduced-motion` accessibility setting.
 *
 * @param messages - Array of messages with id, role, and content
 * @param role - Role to filter messages by (e.g., 'assistant')
 * @param options - Animation options
 * @returns Streaming state including current content and animation status
 *
 * @example
 * ```tsx
 * function ChatMessages({ messages }) {
 *   const { streamingId, streamingContent, isStreaming } = useStreamingText(
 *     messages,
 *     'assistant'
 *   );
 *
 *   return (
 *     <div>
 *       {messages.map((msg) => (
 *         <Message
 *           key={msg.id}
 *           content={msg.id === streamingId ? streamingContent : msg.content}
 *           isStreaming={msg.id === streamingId && isStreaming}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example With custom timing
 * ```tsx
 * const { streamingContent } = useStreamingText(messages, 'assistant', {
 *   intervalMs: 32,  // Slower animation
 *   maxSteps: 60,    // Fewer steps
 * });
 * ```
 */
export function useStreamingText<T extends { id: string; role: string; content: string }>(
  messages: T[],
  role: T['role'],
  options: StreamingTextOptions = {}
): StreamingTextResult {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const intervalMs = options.intervalMs ?? 16;
  const maxSteps = options.maxSteps ?? 120;
  const hasInitializedRef = useRef(false);
  const lastStreamedIdRef = useRef<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    const target = [...messages]
      .reverse()
      .find((message) => message.role === role);

    const clearIntervalRef = () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (!target) {
      if (messages.length === 0 && !hasInitializedRef.current) {
        return;
      }
      hasInitializedRef.current = true;
      lastStreamedIdRef.current = null;
      setStreamingId(null);
      setStreamingContent('');
      setIsStreaming(false);
      clearIntervalRef();
      return;
    }

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      lastStreamedIdRef.current = target.id;
      setStreamingId(target.id);
      setStreamingContent(target.content);
      setIsStreaming(false);
      clearIntervalRef();
      return;
    }

    if (target.id === lastStreamedIdRef.current) {
      if (prefersReducedMotion) {
        setStreamingContent(target.content);
        setIsStreaming(false);
      }
      return;
    }

    lastStreamedIdRef.current = target.id;
    clearIntervalRef();

    if (prefersReducedMotion) {
      setStreamingId(target.id);
      setStreamingContent(target.content);
      setIsStreaming(false);
      return;
    }

    setStreamingId(target.id);
    setStreamingContent('');
    setIsStreaming(true);

    const chunkSize = Math.max(2, Math.ceil(target.content.length / maxSteps));
    let index = 0;

    intervalRef.current = window.setInterval(() => {
      index = Math.min(index + chunkSize, target.content.length);
      setStreamingContent(target.content.slice(0, index));
      if (index >= target.content.length) {
        clearIntervalRef();
        setIsStreaming(false);
      }
    }, intervalMs);

    return () => {
      clearIntervalRef();
    };
  }, [messages, role, prefersReducedMotion, intervalMs, maxSteps]);

  return { streamingId, streamingContent, isStreaming };
}
