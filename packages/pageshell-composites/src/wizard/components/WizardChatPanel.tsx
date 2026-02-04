/**
 * WizardChatPanel Component
 *
 * AI chat panel for wizard step guidance.
 * Migrated to use the new declarative Chat API.
 *
 * @module wizard/components/WizardChatPanel
 */

'use client';

import * as React from 'react';
import { Bot } from 'lucide-react';
import { Chat, type ChatMessage } from '@pageshell/features';
import type { WizardChatMessage } from '../enhanced-types';

// =============================================================================
// Types
// =============================================================================

export interface WizardChatPanelProps {
  /** Chat messages */
  messages: WizardChatMessage[];
  /** Send message callback */
  onSend: (message: string) => Promise<void>;
  /** Whether message is being sent */
  isSending: boolean;
  /** Chat panel title */
  title?: string;
  /** Chat panel description */
  description?: string;
  /** Input placeholder */
  placeholder?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function mapToChatMessage(msg: WizardChatMessage): ChatMessage {
  return {
    id: msg.id,
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
    timestamp: msg.createdAt,
  };
}

// =============================================================================
// Avatar Component
// =============================================================================

function AssistantAvatar() {
  return (
    <div className="flex items-center justify-center w-full h-full rounded-full bg-primary/10 text-primary">
      <Bot className="h-4 w-4" />
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function WizardChatPanel({
  messages,
  onSend,
  isSending,
  title = 'Assistente IA',
  description,
  placeholder = 'Digite sua mensagem...',
}: WizardChatPanelProps) {
  // Map messages to Chat format
  const chatMessages = React.useMemo(
    () => messages.map(mapToChatMessage),
    [messages]
  );

  // Handle send - Chat expects (content, attachments?) but we just need content
  const handleSend = React.useCallback(
    (content: string) => {
      onSend(content);
    },
    [onSend]
  );

  return (
    <Chat
      messages={chatMessages}
      onSend={handleSend}
      assistant={{
        name: title,
        avatar: <AssistantAvatar />,
        online: true,
      }}
      user={{
        name: 'Você',
      }}
      isTyping={isSending}
      disabled={isSending}
      variant="embedded"
      features={{
        markdown: true,
        codeBlocks: true,
        actions: false,
        reactions: false,
        attachments: false,
        search: false,
        keyboard: true,
      }}
    />
  );
}

WizardChatPanel.displayName = 'WizardChatPanel';
