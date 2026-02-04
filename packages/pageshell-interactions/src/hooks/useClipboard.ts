'use client';

import { useState, useCallback } from 'react';

export interface UseClipboardOptions {
  /**
   * Duration in ms to keep the copied state
   * @default 2000
   */
  successDuration?: number;
}

export interface UseClipboardReturn {
  /**
   * Whether content was recently copied successfully
   */
  copied: boolean;
  /**
   * Error from the last copy attempt, if any
   */
  error: Error | null;
  /**
   * Copy text to clipboard
   */
  copy: (text: string) => Promise<boolean>;
  /**
   * Alias for copy (backward compatibility)
   */
  copyToClipboard: (text: string) => Promise<boolean>;
  /**
   * Reset the copied state
   */
  reset: () => void;
}

/**
 * useClipboard - Clipboard Copy Hook
 *
 * Provides clipboard copy functionality with state management.
 * Uses the modern Clipboard API with graceful fallback.
 *
 * @example Basic usage
 * ```tsx
 * const { copied, copy } = useClipboard();
 *
 * return (
 *   <button onClick={() => copy('Hello!')}>
 *     {copied ? 'Copied!' : 'Copy'}
 *   </button>
 * );
 * ```
 *
 * @example With custom duration
 * ```tsx
 * const { copied, copy } = useClipboard({ successDuration: 5000 });
 * ```
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const { successDuration = 2000 } = options;

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      setError(null);

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);

        // Reset after duration
        setTimeout(() => setCopied(false), successDuration);

        return true;
      } catch (err) {
        const copyError =
          err instanceof Error ? err : new Error('Failed to copy to clipboard');
        setError(copyError);
        setCopied(false);
        return false;
      }
    },
    [successDuration]
  );

  return {
    copied,
    error,
    copy,
    copyToClipboard: copy, // Backward compatibility alias
    reset,
  };
}
