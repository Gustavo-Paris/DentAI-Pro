'use client';

/**
 * Chat Component
 *
 * Fully declarative chat component following ChatGPT-style layout.
 * Centered single-column design with full-screen mobile support.
 *
 * @module chat/Chat
 *
 * @example Basic usage
 * ```tsx
 * <Chat
 *   messages={messages}
 *   onSend={handleSend}
 *   assistant={{ name: "Ana", avatar: <BotIcon /> }}
 * />
 * ```
 *
 * @example With streaming
 * ```tsx
 * <Chat
 *   messages={messages}
 *   onSend={handleSend}
 *   isStreaming={isStreaming}
 *   streamingMessageId={streamingId}
 *   onRetry={handleRetry}
 *   onReaction={handleReaction}
 * />
 * ```
 */

import { cn } from '@pageshell/core';
import { ChatProvider } from './context';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessages } from './components/ChatMessages';
import { ChatComposer } from './components/ChatComposer';
import { ChatSearch } from './components/ChatSearch';
import { useChatKeyboard } from './hooks/useChatKeyboard';
import { CSS } from './constants';
import type { ChatProps } from './types';

// =============================================================================
// Internal Wrapper (for hooks that need context)
// =============================================================================

function ChatInner({
  variant = 'panel',
  className,
}: {
  variant?: ChatProps['variant'];
  className?: string;
}) {
  // Keyboard shortcuts
  useChatKeyboard();

  const variantClass = {
    fullscreen: CSS.fullscreen,
    panel: CSS.panel,
    embedded: CSS.embedded,
  }[variant];

  return (
    <div className={cn(CSS.root, variantClass, className)}>
      <ChatHeader />
      <ChatMessages />
      <ChatComposer />
      <ChatSearch />
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function Chat({
  messages,
  onSend,
  assistant,
  user,
  isTyping = false,
  isStreaming = false,
  streamingMessageId,
  disabled = false,
  features,
  onRetry,
  onEdit,
  onDelete,
  onReaction,
  onCopy,
  variant = 'panel',
  className,
}: ChatProps) {
  return (
    <ChatProvider
      messages={messages}
      assistant={assistant}
      user={user}
      isTyping={isTyping}
      isStreaming={isStreaming}
      streamingMessageId={streamingMessageId}
      disabled={disabled}
      features={features}
      onSend={onSend}
      onRetry={onRetry}
      onEdit={onEdit}
      onDelete={onDelete}
      onReaction={onReaction}
      onCopy={onCopy}
    >
      <ChatInner variant={variant} className={className} />
    </ChatProvider>
  );
}
