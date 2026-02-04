'use client';

import { useRef, useCallback } from 'react';
import { useEventCallback } from './useEventCallback';

/**
 * Creates a memoized handler factory for list items, avoiding the common pattern
 * of `onClick={() => handleClick(item.id)}` that creates new functions on every render.
 *
 * This hook returns a stable `getHandler` function that creates and caches handlers
 * for each unique ID. The cached handlers are stable across renders, making them
 * safe to pass to memoized child components without causing unnecessary re-renders.
 *
 * @param handler - The handler function that receives the ID as its first argument
 * @returns An object with:
 *   - `getHandler`: Returns a stable handler for the given ID
 *   - `clearHandler`: Removes a specific handler from the cache
 *   - `clearAllHandlers`: Clears the entire handler cache
 *
 * @example
 * // Instead of creating new functions on each render:
 * // items.map(item => <Button onClick={() => handleClick(item.id)} />)
 *
 * // Use useHandlerMap for stable references:
 * const { getHandler } = useHandlerMap((id: string) => {
 *   setSelected(id);
 *   onSelect?.(id);
 * });
 *
 * // Now each item receives a stable handler reference:
 * items.map(item => <Button onClick={getHandler(item.id)} />)
 *
 * @example
 * // With additional event data:
 * const { getHandler } = useHandlerMap((id: string, event: React.MouseEvent) => {
 *   if (event.ctrlKey) {
 *     handleMultiSelect(id);
 *   } else {
 *     handleSelect(id);
 *   }
 * });
 *
 * items.map(item => <Button onClick={getHandler(item.id)} />)
 *
 * @example
 * // With cleanup for dynamic lists:
 * const { getHandler, clearHandler } = useHandlerMap(handleItemClick);
 *
 * // When items are removed, optionally clean up their handlers:
 * useEffect(() => {
 *   return () => clearHandler(removedItemId);
 * }, [removedItemId, clearHandler]);
 */
export function useHandlerMap<TId, TArgs extends unknown[] = [], TReturn = void>(
  handler: (id: TId, ...args: TArgs) => TReturn
): UseHandlerMapReturn<TId, TArgs, TReturn> {
  // Store cached handlers in a ref to persist across renders
  const handlersRef = useRef<Map<TId, (...args: TArgs) => TReturn>>(new Map());

  // Use useEventCallback to ensure the handler always uses the latest values
  const stableHandler = useEventCallback(handler);

  // Get or create a stable handler for a specific ID
  const getHandler = useCallback(
    (id: TId): ((...args: TArgs) => TReturn) => {
      // Return cached handler if it exists
      const cachedHandler = handlersRef.current.get(id);
      if (cachedHandler) {
        return cachedHandler;
      }

      // Create and cache a new handler for this ID
      const newHandler = (...args: TArgs): TReturn => {
        return stableHandler(id, ...args);
      };
      handlersRef.current.set(id, newHandler);
      return newHandler;
    },
    [stableHandler]
  );

  // Clear a specific handler from the cache
  const clearHandler = useCallback((id: TId): void => {
    handlersRef.current.delete(id);
  }, []);

  // Clear all handlers from the cache
  const clearAllHandlers = useCallback((): void => {
    handlersRef.current.clear();
  }, []);

  return {
    getHandler,
    clearHandler,
    clearAllHandlers,
  };
}

/**
 * Return type for useHandlerMap
 */
export interface UseHandlerMapReturn<TId, TArgs extends unknown[], TReturn> {
  /**
   * Gets a stable handler for the given ID.
   * Returns the same function reference for the same ID across renders.
   */
  getHandler: (id: TId) => (...args: TArgs) => TReturn;

  /**
   * Removes a specific handler from the cache.
   * Useful for cleaning up when items are removed from a list.
   */
  clearHandler: (id: TId) => void;

  /**
   * Clears all handlers from the cache.
   * Useful for resetting state when the list changes entirely.
   */
  clearAllHandlers: () => void;
}
