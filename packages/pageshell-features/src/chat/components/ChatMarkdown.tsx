'use client';

/**
 * ChatMarkdown Component
 *
 * Renders markdown content with syntax highlighting for code blocks.
 * Uses safe React rendering instead of innerHTML.
 *
 * @module chat/components/ChatMarkdown
 */

import { memo, useMemo, useCallback, type ReactNode } from 'react';
import { cn } from '@pageshell/core';
import { CSS } from '../constants';

// =============================================================================
// Types
// =============================================================================

interface ChatMarkdownProps {
  content: string;
  className?: string;
}

// =============================================================================
// Code Block with Copy Button
// =============================================================================

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
  }, [code]);

  return (
    <div className="chat-code-wrapper">
      <div className="chat-code-header">
        {language && <span className="chat-code-language">{language}</span>}
        <button
          type="button"
          onClick={handleCopy}
          className="chat-code-copy"
          aria-label="Copy code"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
        </button>
      </div>
      <pre className="chat-code-block">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// =============================================================================
// Safe Markdown Parser
// =============================================================================

/**
 * Parse markdown content into a safe React node array.
 * No innerHTML - uses React elements for XSS safety.
 */
function parseMarkdownSafe(content: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let keyIndex = 0;

  // Helper to generate unique keys
  const getKey = () => `md-${keyIndex++}`;

  // Pattern for code blocks
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const parts: Array<{ type: 'text' | 'codeBlock'; content: string; language?: string }> = [];

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }
    const codeContent = match[2] ?? '';
    const language = match[1] || undefined;
    parts.push({ type: 'codeBlock', content: codeContent.trim(), language });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) });
  }

  // Process each part
  for (const part of parts) {
    if (part.type === 'codeBlock') {
      nodes.push(
        <CodeBlock key={getKey()} code={part.content} language={part.language} />
      );
    } else {
      // Parse inline elements
      nodes.push(...parseInlineMarkdown(part.content, getKey));
    }
  }

  return nodes;
}

/**
 * Parse inline markdown (bold, italic, code, links, line breaks)
 */
function parseInlineMarkdown(text: string, getKey: () => string): ReactNode[] {
  const nodes: ReactNode[] = [];

  // Split by line breaks first
  const lines = text.split('\n');

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      nodes.push(<br key={getKey()} />);
    }

    // Process inline patterns
    const patterns: Array<{
      regex: RegExp;
      render: (m: RegExpMatchArray) => ReactNode;
    }> = [
      // Inline code
      {
        regex: /`([^`]+)`/,
        render: (m) => (
          <code key={getKey()} className="chat-inline-code">
            {m[1]}
          </code>
        ),
      },
      // Bold (asterisks)
      {
        regex: /\*\*([^*]+)\*\*/,
        render: (m) => <strong key={getKey()}>{m[1]}</strong>,
      },
      // Bold (underscores)
      {
        regex: /__([^_]+)__/,
        render: (m) => <strong key={getKey()}>{m[1]}</strong>,
      },
      // Italic (asterisk)
      {
        regex: /\*([^*]+)\*/,
        render: (m) => <em key={getKey()}>{m[1]}</em>,
      },
      // Italic (underscore)
      {
        regex: /_([^_]+)_/,
        render: (m) => <em key={getKey()}>{m[1]}</em>,
      },
      // Links
      {
        regex: /\[([^\]]+)\]\(([^)]+)\)/,
        render: (m) => (
          <a
            key={getKey()}
            href={m[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="chat-link"
          >
            {m[1]}
          </a>
        ),
      },
    ];

    let remaining = line;

    while (remaining.length > 0) {
      let foundMatch = false;

      for (const { regex, render } of patterns) {
        const match = remaining.match(regex);
        if (match && match.index !== undefined) {
          // Add text before match
          if (match.index > 0) {
            nodes.push(remaining.slice(0, match.index));
          }
          // Add matched element
          nodes.push(render(match));
          // Continue with remaining text
          remaining = remaining.slice(match.index + match[0].length);
          foundMatch = true;
          break;
        }
      }

      if (!foundMatch) {
        // No more patterns found, add remaining text
        nodes.push(remaining);
        remaining = '';
      }
    }
  });

  return nodes;
}

// =============================================================================
// Component
// =============================================================================

export const ChatMarkdown = memo(function ChatMarkdown({
  content,
  className,
}: ChatMarkdownProps) {
  const nodes = useMemo(() => parseMarkdownSafe(content), [content]);

  return <div className={cn(CSS.markdown, className)}>{nodes}</div>;
});
