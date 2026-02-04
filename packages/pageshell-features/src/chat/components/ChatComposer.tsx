'use client';

/**
 * ChatComposer Component
 *
 * Input area with auto-growing textarea, attachment support, and send button.
 * Enter sends, Shift+Enter adds new line.
 *
 * @module chat/components/ChatComposer
 */

import { useState, useRef, useCallback, type KeyboardEvent, type ChangeEvent } from 'react';
import { Paperclip, Send, X } from 'lucide-react';
import { cn } from '@pageshell/core';
import { Textarea } from '@pageshell/primitives';
import { useChatContext } from '../context';
import { CSS, DEFAULT_PLACEHOLDER, LAYOUT, ATTACHMENTS } from '../constants';

// =============================================================================
// Component
// =============================================================================

export function ChatComposer() {
  const { onSend, disabled, features } = useChatContext();
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSend = content.trim().length > 0 || attachments.length > 0;

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, LAYOUT.maxComposerHeight)}px`;
  }, []);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    adjustHeight();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!features.keyboard) return;

    // Enter without Shift sends message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = useCallback(() => {
    if (!canSend || disabled) return;

    onSend(content.trim(), attachments.length > 0 ? attachments : undefined);
    setContent('');
    setAttachments([]);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [canSend, disabled, content, attachments, onSend]);

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const validFiles = files.filter((file) => {
      if (file.size > ATTACHMENTS.maxFileSize) return false;
      return true;
    });

    setAttachments((prev) => {
      const combined = [...prev, ...validFiles];
      return combined.slice(0, ATTACHMENTS.maxFiles);
    });

    // Reset input
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={CSS.composer}>
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="chat-composer-attachments">
          {attachments.map((file, index) => (
            <div key={`${file.name}-${index}`} className="chat-composer-attachment">
              <span className="chat-composer-attachment-name">{file.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="chat-composer-attachment-remove"
                aria-label={`Remove ${file.name}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="chat-composer-input-row">
        {features.attachments && (
          <>
            <button
              type="button"
              onClick={handleAttachClick}
              disabled={disabled || attachments.length >= ATTACHMENTS.maxFiles}
              className="chat-composer-attach"
              aria-label="Attach file"
            >
              <Paperclip size={20} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="sr-only"
              accept={[...ATTACHMENTS.imageTypes, ...ATTACHMENTS.documentTypes].join(',')}
            />
          </>
        )}

        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={DEFAULT_PLACEHOLDER}
          disabled={disabled}
          rows={1}
          className="chat-composer-textarea !min-h-0"
          aria-label="Message input"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend || disabled}
          className={cn('chat-composer-send', canSend && 'chat-composer-send--active')}
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
