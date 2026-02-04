/**
 * Chat Component Types
 *
 * Fully declarative chat component following ChatGPT-style layout.
 *
 * @module chat/types
 */

import type { ReactNode } from 'react';

// =============================================================================
// Message Types
// =============================================================================

export type ChatMessageRole = 'assistant' | 'user' | 'system';
export type ChatMessageStatus = 'sending' | 'sent' | 'error';
export type ChatReaction = 'up' | 'down';

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  preview?: string; // Base64 for images
}

export interface ChatMessageReactions {
  up?: number;
  down?: number;
  userReaction?: ChatReaction;
}

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp?: Date | string;
  status?: ChatMessageStatus;
  attachments?: ChatAttachment[];
  reactions?: ChatMessageReactions;
}

// =============================================================================
// Participant Types
// =============================================================================

export interface ChatAssistant {
  name: string;
  avatar?: ReactNode;
  online?: boolean;
}

export interface ChatUser {
  name?: string;
  avatar?: ReactNode;
}

// =============================================================================
// Feature Flags
// =============================================================================

export interface ChatFeatures {
  /** Built-in markdown rendering. Default: true */
  markdown?: boolean;
  /** Syntax highlighting + copy for code blocks. Default: true */
  codeBlocks?: boolean;
  /** Copy, retry, edit, delete actions. Default: true */
  actions?: boolean;
  /** Thumbs up/down reactions. Default: true */
  reactions?: boolean;
  /** File upload support. Default: true */
  attachments?: boolean;
  /** Cmd+F search in chat. Default: true */
  search?: boolean;
  /** Keyboard shortcuts (Enter send, etc). Default: true */
  keyboard?: boolean;
}

// =============================================================================
// Component Props
// =============================================================================

export type ChatVariant = 'fullscreen' | 'panel' | 'embedded';

export interface ChatProps {
  // Required
  /** Array of chat messages to display */
  messages: ChatMessage[];
  /** Callback when user sends a message */
  onSend: (content: string, attachments?: File[]) => void;

  // Participants
  /** Assistant configuration (name, avatar, online status) */
  assistant?: ChatAssistant;
  /** User configuration (name, avatar) */
  user?: ChatUser;

  // State
  /** Show typing indicator before response */
  isTyping?: boolean;
  /** Indicates streaming is active */
  isStreaming?: boolean;
  /** ID of the message currently streaming */
  streamingMessageId?: string;
  /** Disable input and actions */
  disabled?: boolean;

  // Features (all enabled by default)
  /** Feature flags to enable/disable specific features */
  features?: ChatFeatures;

  // Callbacks
  /** Callback when user requests message retry */
  onRetry?: (messageId: string) => void;
  /** Callback when user edits a message */
  onEdit?: (messageId: string, content: string) => void;
  /** Callback when user deletes a message */
  onDelete?: (messageId: string) => void;
  /** Callback when user reacts to a message */
  onReaction?: (messageId: string, reaction: ChatReaction) => void;
  /** Callback when user copies a message */
  onCopy?: (messageId: string, content: string) => void;

  // Layout
  /** Layout variant. Default: 'panel' */
  variant?: ChatVariant;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Internal Component Props
// =============================================================================

export interface ChatHeaderProps {
  assistant?: ChatAssistant;
  onMenuClick?: () => void;
  className?: string;
}

export interface ChatMessagesProps {
  messages: ChatMessage[];
  assistant?: ChatAssistant;
  user?: ChatUser;
  isTyping?: boolean;
  isStreaming?: boolean;
  streamingMessageId?: string;
  features?: ChatFeatures;
  onRetry?: (messageId: string) => void;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, reaction: ChatReaction) => void;
  onCopy?: (messageId: string, content: string) => void;
  className?: string;
}

export interface ChatMessageProps {
  message: ChatMessage;
  avatar?: ReactNode;
  authorName?: string;
  isStreaming?: boolean;
  features?: ChatFeatures;
  onRetry?: () => void;
  onEdit?: (content: string) => void;
  onDelete?: () => void;
  onReaction?: (reaction: ChatReaction) => void;
  onCopy?: () => void;
  className?: string;
}

export interface ChatComposerProps {
  onSend: (content: string, attachments?: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
  attachmentsEnabled?: boolean;
  className?: string;
}

export interface ChatActionsProps {
  messageId: string;
  role: ChatMessageRole;
  content: string;
  isStreaming?: boolean;
  onRetry?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  className?: string;
}

export interface ChatReactionsProps {
  reactions?: ChatMessageReactions;
  onReaction?: (reaction: ChatReaction) => void;
  className?: string;
}

export interface ChatMarkdownProps {
  content: string;
  className?: string;
}

export interface ChatTypingIndicatorProps {
  assistantName?: string;
  className?: string;
}

export interface ChatSearchProps {
  messages: ChatMessage[];
  onClose: () => void;
  onResultClick: (messageId: string) => void;
  className?: string;
}

// =============================================================================
// Context Types
// =============================================================================

export interface ChatContextValue {
  // State
  messages: ChatMessage[];
  isTyping: boolean;
  isStreaming: boolean;
  streamingMessageId?: string;
  disabled: boolean;
  features: Required<ChatFeatures>;

  // Participants
  assistant?: ChatAssistant;
  user?: ChatUser;

  // UI State
  editingMessageId: string | null;
  searchOpen: boolean;

  // Actions
  setEditingMessageId: (id: string | null) => void;
  setSearchOpen: (open: boolean) => void;

  // Callbacks
  onSend: (content: string, attachments?: File[]) => void;
  onRetry?: (messageId: string) => void;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, reaction: ChatReaction) => void;
  onCopy?: (messageId: string, content: string) => void;
}
