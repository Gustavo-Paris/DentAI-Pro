'use client';

/**
 * ChatMessages Component
 *
 * Virtualized message list with auto-scroll support.
 *
 * @module chat/components/ChatMessages
 */

import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@pageshell/core';
import { useChatContext } from '../context';
import { ChatMessage } from './ChatMessage';
import { ChatTypingIndicator } from './ChatTypingIndicator';
import { CSS, LAYOUT } from '../constants';
import { useChatScroll } from '../hooks/useChatScroll';

// =============================================================================
// Component
// =============================================================================

export function ChatMessages() {
  const {
    messages,
    assistant,
    user,
    isTyping,
    isStreaming,
    streamingMessageId,
    features,
    onRetry,
    onEdit,
    onDelete,
    onReaction,
    onCopy,
  } = useChatContext();

  const containerRef = useRef<HTMLDivElement>(null);
  const { shouldAutoScroll, handleScroll, scrollToBottom } = useChatScroll(containerRef);

  // Auto-scroll when messages change or streaming updates
  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages.length, streamingMessageId, shouldAutoScroll, scrollToBottom]);

  // Get avatar for a message role
  const getAvatar = useCallback(
    (role: 'assistant' | 'user' | 'system') => {
      if (role === 'assistant') return assistant?.avatar;
      if (role === 'user') return user?.avatar;
      return null;
    },
    [assistant?.avatar, user?.avatar]
  );

  // Get author name for a message role
  const getAuthorName = useCallback(
    (role: 'assistant' | 'user' | 'system') => {
      if (role === 'assistant') return assistant?.name;
      if (role === 'user') return user?.name;
      return 'System';
    },
    [assistant?.name, user?.name]
  );

  // Empty state
  if (messages.length === 0 && !isTyping) {
    return (
      <div className={cn(CSS.messages, 'chat-messages--empty')}>
        <div className="chat-empty-state">
          <div className="chat-empty-icon">
            {assistant?.avatar ?? (
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            )}
          </div>
          <h2 className="chat-empty-title">Start a conversation</h2>
          <p className="chat-empty-description">
            Send a message to begin chatting with {assistant?.name ?? 'the assistant'}.
          </p>
        </div>
      </div>
    );
  }

  // Determine if we should use virtualization
  const useVirtualization = messages.length > LAYOUT.virtualizationThreshold;

  // For now, render without virtualization (add @tanstack/react-virtual later)
  // This keeps the initial implementation simpler

  return (
    <div
      ref={containerRef}
      className={CSS.messages}
      onScroll={handleScroll}
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
    >
      <div className="chat-messages-inner">
        {messages.map((message) => {
          const isMessageStreaming = isStreaming && message.id === streamingMessageId;

          return (
            <ChatMessage
              key={message.id}
              message={message}
              avatar={getAvatar(message.role)}
              authorName={getAuthorName(message.role)}
              isStreaming={isMessageStreaming}
              features={features}
              onRetry={onRetry ? () => onRetry(message.id) : undefined}
              onEdit={onEdit ? (content) => onEdit(message.id, content) : undefined}
              onDelete={onDelete ? () => onDelete(message.id) : undefined}
              onReaction={onReaction ? (reaction) => onReaction(message.id, reaction) : undefined}
              onCopy={onCopy ? () => onCopy(message.id, message.content) : undefined}
            />
          );
        })}

        {/* Typing indicator */}
        {isTyping && <ChatTypingIndicator assistantName={assistant?.name} />}
      </div>
    </div>
  );
}
