/**
 * Chat Module
 *
 * Fully declarative chat component following ChatGPT-style layout.
 *
 * @module chat
 *
 * @example Basic usage
 * ```tsx
 * import { Chat } from '@pageshell/features';
 *
 * <Chat
 *   messages={messages}
 *   onSend={handleSend}
 *   assistant={{ name: "Ana", avatar: <BotIcon /> }}
 * />
 * ```
 */

// Main component
export { Chat } from './Chat';

// Types
export type {
  ChatProps,
  ChatMessage,
  ChatMessageRole,
  ChatMessageStatus,
  ChatAttachment,
  ChatMessageReactions,
  ChatReaction,
  ChatAssistant,
  ChatUser,
  ChatFeatures,
  ChatVariant,
} from './types';

// Context (for advanced customization)
export { useChatContext, useChatContextOptional, ChatProvider } from './context';

// Constants (for customization)
export { DEFAULT_FEATURES, LAYOUT, KEYBOARD, ATTACHMENTS, CSS } from './constants';
