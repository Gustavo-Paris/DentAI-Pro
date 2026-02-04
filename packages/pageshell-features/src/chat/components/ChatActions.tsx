'use client';

/**
 * ChatActions Component
 *
 * Message action buttons (copy, retry, edit, delete).
 * Visible on hover (desktop) or always visible (mobile).
 *
 * @module chat/components/ChatActions
 */

import { Copy, RotateCcw, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@pageshell/core';
import { CSS } from '../constants';
import type { ChatMessageRole } from '../types';

// =============================================================================
// Component
// =============================================================================

interface ChatActionsProps {
  messageId: string;
  role: ChatMessageRole;
  content: string;
  isStreaming?: boolean;
  onRetry?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
}

export function ChatActions({
  role,
  isStreaming = false,
  onRetry,
  onEdit,
  onDelete,
  onCopy,
}: ChatActionsProps) {
  if (isStreaming) return null;

  const isAssistant = role === 'assistant';
  const isUser = role === 'user';

  return (
    <div className={cn(CSS.actions)}>
      {/* Copy - available for all */}
      <button
        type="button"
        onClick={onCopy}
        className="chat-action-btn"
        aria-label="Copy message"
        title="Copy"
      >
        <Copy size={14} />
      </button>

      {/* Retry - only for assistant messages */}
      {isAssistant && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="chat-action-btn"
          aria-label="Retry"
          title="Retry"
        >
          <RotateCcw size={14} />
        </button>
      )}

      {/* Edit - only for user messages */}
      {isUser && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="chat-action-btn"
          aria-label="Edit message"
          title="Edit"
        >
          <Pencil size={14} />
        </button>
      )}

      {/* Delete - only for user messages */}
      {isUser && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="chat-action-btn chat-action-btn--danger"
          aria-label="Delete message"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
