'use client';

import { useCallback, useRef, useLayoutEffect, useEffect } from 'react';

// Use useLayoutEffect on client, useEffect on server (SSR-safe)
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Creates a stable function reference that always calls the latest callback.
 *
 * This hook is useful for event handlers that need access to the latest props/state
 * without triggering re-renders in child components. The returned function reference
 * is stable across renders, making it safe to pass to memoized children or include
 * in dependency arrays without causing unnecessary re-renders.
 *
 * @param callback - The callback function to stabilize
 * @returns A stable function reference that always calls the latest callback
 *
 * @example
 * // Instead of creating new functions on each render:
 * // <Button onClick={() => handleClick(item.id)} />
 *
 * // Use useEventCallback for a stable reference:
 * const handleItemClick = useEventCallback((id: string) => {
 *   // This always has access to the latest state/props
 *   setSelected(id);
 *   onSelect?.(id);
 * });
 *
 * // Now the reference is stable across renders:
 * <Button onClick={() => handleItemClick(item.id)} />
 *
 * @example
 * // With dependencies that frequently change:
 * const [count, setCount] = useState(0);
 *
 * const handleLog = useEventCallback(() => {
 *   console.log('Current count:', count); // Always has latest count
 * });
 *
 * // handleLog reference never changes, but always logs current count
 * useEffect(() => {
 *   window.addEventListener('click', handleLog);
 *   return () => window.removeEventListener('click', handleLog);
 * }, [handleLog]); // Safe: handleLog is stable
 */
export function useEventCallback<TArgs extends unknown[], TReturn>(
  callback: (...args: TArgs) => TReturn
): (...args: TArgs) => TReturn {
  // Store the latest callback in a ref
  const callbackRef = useRef(callback);

  // Update the ref synchronously after each render, but before effects run
  // This ensures the callback always has access to latest props/state
  useIsomorphicLayoutEffect(() => {
    callbackRef.current = callback;
  });

  // Return a stable callback that delegates to the ref
  // This function reference never changes, but always calls the latest callback
  return useCallback((...args: TArgs) => {
    return callbackRef.current(...args);
  }, []);
}

/**
 * Return type utility for useEventCallback
 */
export type UseEventCallbackReturn<TArgs extends unknown[], TReturn> = (
  ...args: TArgs
) => TReturn;
