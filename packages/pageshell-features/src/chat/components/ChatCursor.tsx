'use client';

/**
 * ChatCursor Component
 *
 * Animated blinking cursor for streaming messages.
 *
 * @module chat/components/ChatCursor
 */

import { cn } from '@pageshell/core';
import { CSS } from '../constants';

// =============================================================================
// Component
// =============================================================================

interface ChatCursorProps {
  className?: string;
}

export function ChatCursor({ className }: ChatCursorProps) {
  return <span className={cn(CSS.cursor, className)} aria-hidden="true" />;
}
