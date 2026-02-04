'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Options for useAutoScroll hook
 */
export interface UseAutoScrollOptions {
  /** Scroll behavior: 'smooth' (animated) or 'auto' (instant) */
  behavior?: ScrollBehavior;
  /** Whether auto-scroll is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Hook to auto-scroll to the end of a container when content changes.
 *
 * Useful for chat messages, logs, or any list that grows from the bottom.
 *
 * Eliminates the repetitive pattern:
 * ```tsx
 * const messagesEndRef = useRef<HTMLDivElement>(null);
 *
 * useEffect(() => {
 *   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 * }, [messages]);
 *
 * // In JSX:
 * <div ref={messagesEndRef} />
 * ```
 *
 * @param dependency - Value that triggers scroll when changed (e.g., messages array)
 * @param options - Configuration options
 * @returns Ref to attach to an anchor element at the end of the list
 *
 * @example
 * ```tsx
 * function ChatMessages({ messages }) {
 *   const scrollRef = useAutoScroll(messages);
 *
 *   return (
 *     <div className="overflow-y-auto h-96">
 *       {messages.map((msg) => <Message key={msg.id} {...msg} />)}
 *       <div ref={scrollRef} />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example With options
 * ```tsx
 * // Instant scroll (no animation)
 * const scrollRef = useAutoScroll(messages, { behavior: 'auto' });
 *
 * // Conditionally disable
 * const scrollRef = useAutoScroll(messages, { enabled: isAtBottom });
 * ```
 */
export function useAutoScroll<T>(
  dependency: T,
  options: UseAutoScrollOptions = {}
): RefObject<HTMLDivElement | null> {
  const { behavior = 'smooth', enabled = true } = options;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (enabled) {
      ref.current?.scrollIntoView({ behavior });
    }
  }, [dependency, behavior, enabled]);

  return ref;
}
