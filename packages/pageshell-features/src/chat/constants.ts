/**
 * Chat Component Constants
 *
 * @module chat/constants
 */

import type { ChatFeatures } from './types';

// =============================================================================
// Default Values
// =============================================================================

export const DEFAULT_FEATURES: Required<ChatFeatures> = {
  markdown: true,
  codeBlocks: true,
  actions: true,
  reactions: true,
  attachments: true,
  search: true,
  keyboard: true,
};

export const DEFAULT_PLACEHOLDER = 'Type your message...';
export const DEFAULT_ASSISTANT_NAME = 'Assistant';
export const DEFAULT_USER_NAME = 'You';

// =============================================================================
// Layout Constants
// =============================================================================

export const LAYOUT = {
  /** Max width of chat content on desktop */
  maxWidth: 768,
  /** Side padding on desktop */
  desktopPadding: 24,
  /** Side padding on mobile */
  mobilePadding: 16,
  /** Breakpoint for mobile layout */
  mobileBreakpoint: 768,
  /** Max height of composer textarea */
  maxComposerHeight: 200,
  /** Scroll threshold for auto-scroll */
  scrollThreshold: 100,
  /** Virtualization buffer (overscan) */
  virtualizationOverscan: 5,
  /** Message count threshold for virtualization */
  virtualizationThreshold: 50,
} as const;

// =============================================================================
// Keyboard Shortcuts
// =============================================================================

export const KEYBOARD = {
  /** Send message */
  send: 'Enter',
  /** New line */
  newLine: 'Shift+Enter',
  /** Cancel edit mode */
  cancelEdit: 'Escape',
  /** Open search */
  search: 'Meta+f',
  /** Edit last message (when input is empty) */
  editLast: 'ArrowUp',
} as const;

// =============================================================================
// Attachment Limits
// =============================================================================

export const ATTACHMENTS = {
  /** Max number of files per message */
  maxFiles: 5,
  /** Max file size in bytes (10MB) */
  maxFileSize: 10 * 1024 * 1024,
  /** Accepted image types */
  imageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  /** Accepted document types */
  documentTypes: [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/json',
  ],
} as const;

// =============================================================================
// Animation
// =============================================================================

export const ANIMATION = {
  /** Cursor blink duration in ms */
  cursorBlinkDuration: 530,
  /** Typing indicator dot delay in ms */
  typingDotDelay: 150,
  /** Message fade-in duration in ms */
  messageFadeIn: 200,
} as const;

// =============================================================================
// CSS Classes
// =============================================================================

export const CSS_PREFIX = 'chat';

export const CSS = {
  root: CSS_PREFIX,
  fullscreen: `${CSS_PREFIX}--fullscreen`,
  panel: `${CSS_PREFIX}--panel`,
  embedded: `${CSS_PREFIX}--embedded`,
  header: `${CSS_PREFIX}-header`,
  messages: `${CSS_PREFIX}-messages`,
  message: `${CSS_PREFIX}-message`,
  messageAssistant: `${CSS_PREFIX}-message--assistant`,
  messageUser: `${CSS_PREFIX}-message--user`,
  messageSystem: `${CSS_PREFIX}-message--system`,
  messageStreaming: `${CSS_PREFIX}-message--streaming`,
  messageError: `${CSS_PREFIX}-message--error`,
  composer: `${CSS_PREFIX}-composer`,
  actions: `${CSS_PREFIX}-actions`,
  reactions: `${CSS_PREFIX}-reactions`,
  typing: `${CSS_PREFIX}-typing`,
  cursor: `${CSS_PREFIX}-cursor`,
  search: `${CSS_PREFIX}-search`,
  markdown: `${CSS_PREFIX}-markdown`,
} as const;
