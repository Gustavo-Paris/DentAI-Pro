'use client';

/**
 * ChatHeader Component
 *
 * Displays assistant info with online status and optional menu.
 *
 * @module chat/components/ChatHeader
 */

import { MoreVertical } from 'lucide-react';
import { cn } from '@pageshell/core';
import { useChatContext } from '../context';
import { CSS, DEFAULT_ASSISTANT_NAME } from '../constants';

// =============================================================================
// Component
// =============================================================================

export function ChatHeader() {
  const { assistant, features, setSearchOpen } = useChatContext();

  const name = assistant?.name ?? DEFAULT_ASSISTANT_NAME;
  const isOnline = assistant?.online ?? false;

  return (
    <header className={CSS.header}>
      <div className="chat-header-main">
        {assistant?.avatar && (
          <div className="chat-header-avatar">{assistant.avatar}</div>
        )}
        <div className="chat-header-info">
          <h1 className="chat-header-name">{name}</h1>
          <span className={cn('chat-header-status', isOnline && 'chat-header-status--online')}>
            <span className="chat-header-status-dot" />
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
      <div className="chat-header-actions">
        {features.search && (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="chat-header-action"
            aria-label="Search messages"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        )}
        <button
          type="button"
          className="chat-header-action"
          aria-label="More options"
        >
          <MoreVertical size={20} />
        </button>
      </div>
    </header>
  );
}
