'use client';

/**
 * Chat Context
 *
 * Provides chat state and actions to all child components.
 *
 * @module chat/context
 */

import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { DEFAULT_FEATURES } from './constants';
import type {
  ChatContextValue,
  ChatMessage,
  ChatAssistant,
  ChatUser,
  ChatFeatures,
  ChatReaction,
} from './types';

// =============================================================================
// Context
// =============================================================================

const ChatContext = createContext<ChatContextValue | null>(null);

// =============================================================================
// Hook
// =============================================================================

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

export function useChatContextOptional(): ChatContextValue | null {
  return useContext(ChatContext);
}

// =============================================================================
// Provider
// =============================================================================

interface ChatProviderProps {
  children: ReactNode;
  messages: ChatMessage[];
  assistant?: ChatAssistant;
  user?: ChatUser;
  isTyping?: boolean;
  isStreaming?: boolean;
  streamingMessageId?: string;
  disabled?: boolean;
  features?: ChatFeatures;
  onSend: (content: string, attachments?: File[]) => void;
  onRetry?: (messageId: string) => void;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, reaction: ChatReaction) => void;
  onCopy?: (messageId: string, content: string) => void;
}

export function ChatProvider({
  children,
  messages,
  assistant,
  user,
  isTyping = false,
  isStreaming = false,
  streamingMessageId,
  disabled = false,
  features,
  onSend,
  onRetry,
  onEdit,
  onDelete,
  onReaction,
  onCopy,
}: ChatProviderProps) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const mergedFeatures = useMemo<Required<ChatFeatures>>(
    () => ({
      ...DEFAULT_FEATURES,
      ...features,
    }),
    [features]
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      messages,
      isTyping,
      isStreaming,
      streamingMessageId,
      disabled,
      features: mergedFeatures,
      assistant,
      user,
      editingMessageId,
      searchOpen,
      setEditingMessageId,
      setSearchOpen,
      onSend,
      onRetry,
      onEdit,
      onDelete,
      onReaction,
      onCopy,
    }),
    [
      messages,
      isTyping,
      isStreaming,
      streamingMessageId,
      disabled,
      mergedFeatures,
      assistant,
      user,
      editingMessageId,
      searchOpen,
      onSend,
      onRetry,
      onEdit,
      onDelete,
      onReaction,
      onCopy,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
