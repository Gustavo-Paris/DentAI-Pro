'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Options for useAutoResizeTextarea hook
 */
export interface UseAutoResizeTextareaOptions {
  /** Maximum height in pixels (default: 120) */
  maxHeight?: number;
  /** Minimum height in pixels */
  minHeight?: number;
}

/**
 * Hook to auto-resize a textarea based on its content.
 *
 * Eliminates the repetitive pattern:
 * ```tsx
 * useEffect(() => {
 *   if (textareaRef.current) {
 *     textareaRef.current.style.height = "auto";
 *     textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
 *   }
 * }, [value]);
 * ```
 *
 * @param ref - Ref to the textarea element
 * @param value - Current textarea value (triggers resize on change)
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * function ChatInput() {
 *   const [message, setMessage] = useState('');
 *   const textareaRef = useRef<HTMLTextAreaElement>(null);
 *
 *   useAutoResizeTextarea(textareaRef, message, { maxHeight: 200 });
 *
 *   return (
 *     <textarea
 *       ref={textareaRef}
 *       value={message}
 *       onChange={(e) => setMessage(e.target.value)}
 *       className="resize-none overflow-hidden"
 *     />
 *   );
 * }
 * ```
 */
export function useAutoResizeTextarea(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
  options: UseAutoResizeTextareaOptions = {}
): void {
  const { maxHeight = 120, minHeight } = options;

  useEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;

    // Reset height to auto to get correct scrollHeight
    textarea.style.height = 'auto';

    // Calculate new height
    let newHeight = textarea.scrollHeight;

    // Apply min/max constraints
    if (minHeight !== undefined) {
      newHeight = Math.max(newHeight, minHeight);
    }
    newHeight = Math.min(newHeight, maxHeight);

    // Set the final height
    textarea.style.height = `${newHeight}px`;
  }, [ref, value, maxHeight, minHeight]);
}
