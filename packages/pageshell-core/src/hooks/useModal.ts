'use client';

import { useState, useCallback } from 'react';
import type { ModalState } from '../types';

/**
 * Hook for managing modal state with optional data payload
 *
 * @example
 * const { isOpen, data, open, close, toggle } = useModal<User>();
 *
 * // Open modal with data
 * <button onClick={() => open(user)}>Edit User</button>
 *
 * // In modal
 * {isOpen && <EditUserModal user={data} onClose={close} />}
 */
export function useModal<TData = undefined>() {
  const [state, setState] = useState<ModalState<TData>>({
    isOpen: false,
    data: undefined,
  });

  const open = useCallback((data?: TData) => {
    setState({ isOpen: true, data });
  }, []);

  const close = useCallback(() => {
    setState({ isOpen: false, data: undefined });
  }, []);

  const toggle = useCallback((data?: TData) => {
    setState((prev) =>
      prev.isOpen ? { isOpen: false, data: undefined } : { isOpen: true, data }
    );
  }, []);

  const setData = useCallback((data: TData) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  return {
    isOpen: state.isOpen,
    data: state.data,
    open,
    close,
    toggle,
    setData,
  };
}

/**
 * Return type of useModal hook
 */
export type UseModalReturn<TData = undefined> = ReturnType<typeof useModal<TData>>;
