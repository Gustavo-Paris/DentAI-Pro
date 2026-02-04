'use client';

/**
 * useChatKeyboard Hook
 *
 * Handles keyboard shortcuts for the chat component.
 *
 * @module chat/hooks/useChatKeyboard
 */

import { useEffect } from 'react';
import { useChatContext } from '../context';

// =============================================================================
// Hook
// =============================================================================

export function useChatKeyboard() {
  const { features, setSearchOpen, searchOpen } = useChatContext();

  useEffect(() => {
    if (!features.keyboard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + F = Open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f' && features.search) {
        e.preventDefault();
        setSearchOpen(true);
      }

      // Escape = Close search
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [features.keyboard, features.search, searchOpen, setSearchOpen]);
}
