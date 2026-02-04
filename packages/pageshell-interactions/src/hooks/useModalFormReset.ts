'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook to reset form state when a modal opens.
 *
 * Eliminates the repetitive pattern:
 * ```tsx
 * useEffect(() => {
 *   if (isOpen) {
 *     setField1('');
 *     setField2(null);
 *     setError(null);
 *   }
 * }, [isOpen]);
 * ```
 *
 * Only triggers reset when transitioning from closed to open, not on every render.
 *
 * @param isOpen - Modal open state
 * @param resetFn - Function to reset the form state
 *
 * @example
 * ```tsx
 * function MyModal({ isOpen, onClose }) {
 *   const [name, setName] = useState('');
 *   const [error, setError] = useState<string | null>(null);
 *
 *   // Auto-reset when modal opens
 *   useModalFormReset(isOpen, () => {
 *     setName('');
 *     setError(null);
 *   });
 *
 *   return <Dialog open={isOpen}>...</Dialog>;
 * }
 * ```
 *
 * @example With react-hook-form
 * ```tsx
 * function EditModal({ isOpen, defaultValues }) {
 *   const form = useForm({ defaultValues });
 *
 *   useModalFormReset(isOpen, () => {
 *     form.reset(defaultValues);
 *   });
 *
 *   return <Dialog open={isOpen}>...</Dialog>;
 * }
 * ```
 */
export function useModalFormReset(
  isOpen: boolean,
  resetFn: () => void
): void {
  // Track previous isOpen state to detect open transition
  const wasOpenRef = useRef(isOpen);

  useEffect(() => {
    // Only reset when transitioning from closed to open
    if (isOpen && !wasOpenRef.current) {
      resetFn();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, resetFn]);
}
