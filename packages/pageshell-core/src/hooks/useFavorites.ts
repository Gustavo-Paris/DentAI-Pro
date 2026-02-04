/**
 * useFavorites - Manage favorite/pinned navigation items
 *
 * Features:
 * - Pin/unpin navigation items
 * - Reorder favorites via drag
 * - Persist in localStorage
 * - Sync across tabs
 *
 * @module hooks/useFavorites
 */

'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';

// =============================================================================
// Types
// =============================================================================

export interface FavoriteItem {
  /** Navigation href (unique identifier) */
  href: string;
  /** Display title */
  title: string;
  /** Icon identifier (PageIconVariant) */
  icon?: string;
  /** When the item was added */
  addedAt: number;
  /** Order index for sorting */
  order: number;
}

export interface UseFavoritesOptions {
  /** Maximum number of favorites (default: 10) */
  maxItems?: number;
  /** localStorage key for persistence (default: 'sidebar-favorites') */
  storageKey?: string;
  /** Enable localStorage persistence (default: true) */
  persist?: boolean;
  /** Callback when favorites change */
  onChange?: (favorites: FavoriteItem[]) => void;
}

export interface UseFavoritesReturn {
  /** List of favorite items (sorted by order) */
  favorites: FavoriteItem[];
  /** Check if an item is a favorite */
  isFavorite: (href: string) => boolean;
  /** Toggle favorite status for an item */
  toggleFavorite: (item: Omit<FavoriteItem, 'addedAt' | 'order'>) => void;
  /** Add a favorite */
  addFavorite: (item: Omit<FavoriteItem, 'addedAt' | 'order'>) => void;
  /** Remove a favorite */
  removeFavorite: (href: string) => void;
  /** Reorder favorites (move from one index to another) */
  reorder: (fromIndex: number, toIndex: number) => void;
  /** Clear all favorites */
  clearFavorites: () => void;
  /** Number of favorites */
  count: number;
  /** Whether max favorites reached */
  isMaxReached: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_MAX_ITEMS = 10;
const DEFAULT_STORAGE_KEY = 'sidebar-favorites';

/**
 * Validates and deserializes FavoriteItem[] from storage.
 */
function deserializeFavorites(value: string): FavoriteItem[] {
  try {
    const parsed = JSON.parse(value) as FavoriteItem[];
    if (!Array.isArray(parsed)) return [];

    // Validate structure and sort by order
    return parsed
      .filter(
        (item) =>
          typeof item.href === 'string' &&
          typeof item.title === 'string' &&
          typeof item.addedAt === 'number' &&
          typeof item.order === 'number'
      )
      .sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to manage favorite/pinned navigation items.
 *
 * @example
 * ```tsx
 * function SidebarFavorites() {
 *   const { favorites, toggleFavorite, isFavorite, reorder } = useFavorites();
 *
 *   return (
 *     <nav>
 *       {favorites.map((item, index) => (
 *         <div
 *           key={item.href}
 *           draggable
 *           onDragStart={(e) => e.dataTransfer.setData('index', String(index))}
 *           onDrop={(e) => {
 *             const fromIndex = Number(e.dataTransfer.getData('index'));
 *             reorder(fromIndex, index);
 *           }}
 *         >
 *           <Link href={item.href}>{item.title}</Link>
 *           <button onClick={() => toggleFavorite(item)}>
 *             {isFavorite(item.href) ? 'Unpin' : 'Pin'}
 *           </button>
 *         </div>
 *       ))}
 *     </nav>
 *   );
 * }
 * ```
 */
export function useFavorites(
  options: UseFavoritesOptions = {}
): UseFavoritesReturn {
  const {
    maxItems = DEFAULT_MAX_ITEMS,
    storageKey = DEFAULT_STORAGE_KEY,
    persist = true,
    onChange,
  } = options;

  // =============================================================================
  // State
  // =============================================================================

  const [favorites, setFavorites, clearStorage] = useLocalStorage<FavoriteItem[]>(
    storageKey,
    [],
    {
      syncTabs: persist,
      deserializer: deserializeFavorites,
    }
  );

  // Notify on change
  useEffect(() => {
    onChange?.(favorites);
  }, [favorites, onChange]);

  // =============================================================================
  // Actions
  // =============================================================================

  const isFavorite = useCallback(
    (href: string) => favorites.some((item) => item.href === href),
    [favorites]
  );

  const addFavorite = useCallback(
    (item: Omit<FavoriteItem, 'addedAt' | 'order'>) => {
      setFavorites((current) => {
        // Check if already favorite
        if (current.some((f) => f.href === item.href)) {
          return current;
        }

        // Check max limit
        if (current.length >= maxItems) {
          return current;
        }

        // Add with next order
        const maxOrder = current.reduce(
          (max, f) => Math.max(max, f.order),
          -1
        );

        return [
          ...current,
          {
            ...item,
            addedAt: Date.now(),
            order: maxOrder + 1,
          },
        ];
      });
    },
    [maxItems]
  );

  const removeFavorite = useCallback((href: string) => {
    setFavorites((current) => {
      const filtered = current.filter((item) => item.href !== href);
      // Re-normalize order
      return filtered.map((item, index) => ({
        ...item,
        order: index,
      }));
    });
  }, []);

  const toggleFavorite = useCallback(
    (item: Omit<FavoriteItem, 'addedAt' | 'order'>) => {
      if (isFavorite(item.href)) {
        removeFavorite(item.href);
      } else {
        addFavorite(item);
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    setFavorites((current) => {
      if (
        fromIndex < 0 ||
        fromIndex >= current.length ||
        toIndex < 0 ||
        toIndex >= current.length ||
        fromIndex === toIndex
      ) {
        return current;
      }

      const result = [...current];
      const [removed] = result.splice(fromIndex, 1);
      if (removed) {
        result.splice(toIndex, 0, removed);
      }

      // Re-normalize order
      return result.map((item, index) => ({
        ...item,
        order: index,
      }));
    });
  }, []);

  const clearFavorites = useCallback(() => {
    clearStorage();
  }, [clearStorage]);

  // =============================================================================
  // Return
  // =============================================================================

  const count = useMemo(() => favorites.length, [favorites]);
  const isMaxReached = useMemo(() => favorites.length >= maxItems, [favorites, maxItems]);

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    reorder,
    clearFavorites,
    count,
    isMaxReached,
  };
}
