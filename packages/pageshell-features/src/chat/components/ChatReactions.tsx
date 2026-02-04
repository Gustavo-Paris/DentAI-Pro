'use client';

/**
 * ChatReactions Component
 *
 * Thumbs up/down reaction buttons with counts.
 *
 * @module chat/components/ChatReactions
 */

import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@pageshell/core';
import { CSS } from '../constants';
import type { ChatMessageReactions, ChatReaction } from '../types';

// =============================================================================
// Component
// =============================================================================

interface ChatReactionsProps {
  reactions?: ChatMessageReactions;
  onReaction?: (reaction: ChatReaction) => void;
  className?: string;
}

export function ChatReactions({ reactions, onReaction, className }: ChatReactionsProps) {
  const upCount = reactions?.up ?? 0;
  const downCount = reactions?.down ?? 0;
  const userReaction = reactions?.userReaction;

  return (
    <div className={cn(CSS.reactions, className)}>
      <button
        type="button"
        onClick={() => onReaction?.('up')}
        className={cn('chat-reaction-btn', userReaction === 'up' && 'chat-reaction-btn--active')}
        aria-label={`Like${upCount > 0 ? ` (${upCount})` : ''}`}
        aria-pressed={userReaction === 'up'}
      >
        <ThumbsUp size={14} />
        {upCount > 0 && <span className="chat-reaction-count">{upCount}</span>}
      </button>

      <button
        type="button"
        onClick={() => onReaction?.('down')}
        className={cn(
          'chat-reaction-btn',
          userReaction === 'down' && 'chat-reaction-btn--active'
        )}
        aria-label={`Dislike${downCount > 0 ? ` (${downCount})` : ''}`}
        aria-pressed={userReaction === 'down'}
      >
        <ThumbsDown size={14} />
        {downCount > 0 && <span className="chat-reaction-count">{downCount}</span>}
      </button>
    </div>
  );
}
