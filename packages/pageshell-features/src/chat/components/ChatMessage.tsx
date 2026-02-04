'use client';

/**
 * ChatMessage Component
 *
 * Single message with avatar, content, actions, and reactions.
 *
 * @module chat/components/ChatMessage
 */

import { useState, useCallback } from 'react';
import { cn } from '@pageshell/core';
import { ChatMarkdown } from './ChatMarkdown';
import { ChatActions } from './ChatActions';
import { ChatReactions } from './ChatReactions';
import { ChatCursor } from './ChatCursor';
import { CSS, DEFAULT_ASSISTANT_NAME, DEFAULT_USER_NAME } from '../constants';
import type { ChatMessage as ChatMessageType, ChatFeatures, ChatReaction } from '../types';
import type { ReactNode } from 'react';

// =============================================================================
// Component
// =============================================================================

interface ChatMessageProps {
  message: ChatMessageType;
  avatar?: ReactNode;
  authorName?: string;
  isStreaming?: boolean;
  features: Required<ChatFeatures>;
  onRetry?: () => void;
  onEdit?: (content: string) => void;
  onDelete?: () => void;
  onReaction?: (reaction: ChatReaction) => void;
  onCopy?: () => void;
}

export function ChatMessage({
  message,
  avatar,
  authorName,
  isStreaming = false,
  features,
  onRetry,
  onEdit,
  onDelete,
  onReaction,
  onCopy,
}: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const roleClass = {
    assistant: CSS.messageAssistant,
    user: CSS.messageUser,
    system: CSS.messageSystem,
  }[message.role];

  const displayName =
    authorName ??
    (message.role === 'assistant' ? DEFAULT_ASSISTANT_NAME : DEFAULT_USER_NAME);

  const formattedTimestamp =
    message.timestamp instanceof Date
      ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : message.timestamp;

  const handleEditSubmit = useCallback(() => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(editContent.trim());
    }
    setIsEditing(false);
  }, [editContent, message.content, onEdit]);

  const handleEditCancel = useCallback(() => {
    setEditContent(message.content);
    setIsEditing(false);
  }, [message.content]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    onCopy?.();
  }, [message.content, onCopy]);

  return (
    <article
      className={cn(
        CSS.message,
        roleClass,
        isStreaming && CSS.messageStreaming,
        message.status === 'error' && CSS.messageError
      )}
      data-message-id={message.id}
    >
      {/* Header: Avatar + Name + Timestamp */}
      <header className="chat-message-header">
        {avatar && <div className="chat-message-avatar">{avatar}</div>}
        <span className="chat-message-author">{displayName}</span>
        {formattedTimestamp && (
          <time className="chat-message-timestamp">{formattedTimestamp}</time>
        )}
        {/* Actions (visible on hover) */}
        {features.actions && !isStreaming && !isEditing && (
          <ChatActions
            messageId={message.id}
            role={message.role}
            content={message.content}
            onRetry={onRetry}
            onEdit={() => setIsEditing(true)}
            onDelete={onDelete}
            onCopy={handleCopy}
          />
        )}
      </header>

      {/* Content */}
      <div className="chat-message-content">
        {isEditing ? (
          <div className="chat-message-edit">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="chat-message-edit-textarea"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleEditSubmit();
                } else if (e.key === 'Escape') {
                  handleEditCancel();
                }
              }}
            />
            <div className="chat-message-edit-actions">
              <button
                type="button"
                onClick={handleEditCancel}
                className="chat-message-edit-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSubmit}
                className="chat-message-edit-save"
              >
                Save
              </button>
            </div>
          </div>
        ) : features.markdown ? (
          <ChatMarkdown content={message.content} />
        ) : (
          <p className="chat-message-text">{message.content}</p>
        )}

        {/* Streaming cursor */}
        {isStreaming && <ChatCursor />}
      </div>

      {/* Status indicator */}
      {message.status === 'sending' && (
        <div className="chat-message-status">
          <span className="chat-message-status-spinner" />
          Sending...
        </div>
      )}
      {message.status === 'error' && (
        <div className="chat-message-status chat-message-status--error">
          Failed to send.{' '}
          <button type="button" onClick={onRetry} className="chat-message-retry-link">
            Retry?
          </button>
        </div>
      )}

      {/* Attachments */}
      {message.attachments && message.attachments.length > 0 && (
        <div className="chat-message-attachments">
          {message.attachments.map((attachment) => (
            <div key={attachment.id} className="chat-message-attachment">
              {attachment.preview ? (
                <img
                  src={attachment.preview}
                  alt={attachment.name}
                  className="chat-message-attachment-image"
                />
              ) : (
                <div className="chat-message-attachment-file">
                  <span className="chat-message-attachment-icon">📎</span>
                  <span className="chat-message-attachment-name">{attachment.name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reactions */}
      {features.reactions && !isStreaming && (
        <ChatReactions reactions={message.reactions} onReaction={onReaction} />
      )}
    </article>
  );
}
