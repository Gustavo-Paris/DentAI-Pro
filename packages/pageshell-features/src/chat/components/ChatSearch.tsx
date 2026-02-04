'use client';

/**
 * ChatSearch Component
 *
 * Search overlay for finding messages (Cmd+F).
 *
 * @module chat/components/ChatSearch
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@pageshell/core';
import { useChatContext } from '../context';
import { CSS } from '../constants';

// =============================================================================
// Component
// =============================================================================

export function ChatSearch() {
  const { messages, searchOpen, setSearchOpen, features } = useChatContext();
  const [query, setQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter messages by query
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return messages.filter((msg) => msg.content.toLowerCase().includes(lowerQuery));
  }, [messages, query]);

  // Focus input when opened
  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  // Reset on close
  useEffect(() => {
    if (!searchOpen) {
      setQuery('');
      setCurrentIndex(0);
    }
  }, [searchOpen]);

  // Navigate to result
  const navigateToResult = (index: number) => {
    if (results.length === 0) return;
    const safeIndex = ((index % results.length) + results.length) % results.length;
    setCurrentIndex(safeIndex);

    const result = results[safeIndex];
    if (!result) return;
    const element = document.querySelector(`[data-message-id="${result.id}"]`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchOpen(false);
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        navigateToResult(currentIndex - 1);
      } else {
        navigateToResult(currentIndex + 1);
      }
    }
  };

  if (!features.search || !searchOpen) return null;

  return (
    <div className={cn(CSS.search)}>
      <div className="chat-search-bar">
        <Search size={16} className="chat-search-icon" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCurrentIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search messages..."
          className="chat-search-input"
          aria-label="Search messages"
        />
        {results.length > 0 && (
          <span className="chat-search-count">
            {currentIndex + 1} of {results.length}
          </span>
        )}
        <div className="chat-search-nav">
          <button
            type="button"
            onClick={() => navigateToResult(currentIndex - 1)}
            disabled={results.length === 0}
            className="chat-search-nav-btn"
            aria-label="Previous result"
          >
            <ChevronUp size={16} />
          </button>
          <button
            type="button"
            onClick={() => navigateToResult(currentIndex + 1)}
            disabled={results.length === 0}
            className="chat-search-nav-btn"
            aria-label="Next result"
          >
            <ChevronDown size={16} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setSearchOpen(false)}
          className="chat-search-close"
          aria-label="Close search"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
