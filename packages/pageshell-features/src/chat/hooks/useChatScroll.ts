'use client';

/**
 * useChatScroll Hook
 *
 * Handles auto-scroll behavior for the messages container.
 * Pauses when user scrolls up, resumes when near bottom.
 *
 * @module chat/hooks/useChatScroll
 */

import { useState, useCallback, type RefObject, type UIEvent } from 'react';
import { LAYOUT } from '../constants';

// =============================================================================
// Hook
// =============================================================================

export function useChatScroll(containerRef: RefObject<HTMLDivElement | null>) {
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const handleScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isNearBottom = distanceFromBottom < LAYOUT.scrollThreshold;

    setShouldAutoScroll(isNearBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }, [containerRef]);

  return {
    shouldAutoScroll,
    handleScroll,
    scrollToBottom,
  };
}
