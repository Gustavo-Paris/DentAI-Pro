'use client';

/**
 * ChatTypingIndicator Component
 *
 * Shows "Assistant is thinking..." with animated dots.
 *
 * @module chat/components/ChatTypingIndicator
 */

import { cn } from '@pageshell/core';
import { CSS, DEFAULT_ASSISTANT_NAME } from '../constants';

// =============================================================================
// Component
// =============================================================================

interface ChatTypingIndicatorProps {
  assistantName?: string;
  className?: string;
}

export function ChatTypingIndicator({
  assistantName = DEFAULT_ASSISTANT_NAME,
  className,
}: ChatTypingIndicatorProps) {
  return (
    <div className={cn(CSS.typing, className)} role="status" aria-live="polite">
      <span className="chat-typing-dots" aria-hidden="true">
        <span className="chat-typing-dot" />
        <span className="chat-typing-dot" />
        <span className="chat-typing-dot" />
      </span>
      <span className="chat-typing-label">{assistantName} is thinking...</span>
    </div>
  );
}
