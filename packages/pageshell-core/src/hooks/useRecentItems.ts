/**
 * useRecentItems - Tracks recently visited navigation items
 *
 * Features:
 * - Stores last N visited pages
 * - Persists in localStorage
 * - Auto-removes duplicates (moves to top)
 * - Optional TTL for automatic expiration
 * - Syncs across tabs
 *
 * @module hooks/useRecentItems
 */

'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';

// =============================================================================
// Types
// =============================================================================

export interface RecentItem {
  /** Navigation href */
  href: string;
  /** Display title */
  title: string;
  /** Icon identifier (PageIconVariant string) */
  icon?: string;
  /** Timestamp when visited */
  visitedAt: number;
}

export interface UseRecentItemsOptions {
  /** Maximum number of items to keep (default: 5) */
  maxItems?: number;
  /** localStorage key for persistence (default: 'recent-nav-items') */
  storageKey?: string;
  /** Time-to-live in milliseconds for each item (default: 7 days) */
  ttl?: number;
  /** Enable localStorage persistence (default: true) */
  persist?: boolean;
  /** Paths to exclude from tracking (e.g., ['/login', '/logout']) */
  excludePaths?: string[];
}

export interface UseRecentItemsReturn {
  /** List of recent items (sorted by most recent first) */
  items: RecentItem[];
  /** Add or update an item (moves to top if exists) */
  addItem: (item: Omit<RecentItem, 'visitedAt'>) => void;
  /** Remove a specific item by href */
  removeItem: (href: string) => void;
  /** Clear all recent items */
  clearItems: () => void;
  /** Check if an item exists in recents */
  hasItem: (href: string) => boolean;
  /** Number of recent items */
  count: number;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_MAX_ITEMS = 5;
const DEFAULT_STORAGE_KEY = 'recent-nav-items';
const DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// =============================================================================
// Helper Functions
// =============================================================================

function isExpired(item: RecentItem, ttl: number): boolean {
  return Date.now() - item.visitedAt > ttl;
}

function filterExpired(items: RecentItem[], ttl: number): RecentItem[] {
  return items.filter((item) => !isExpired(item, ttl));
}

/**
 * Creates a deserializer for RecentItem[] that filters expired items.
 */
function createDeserializer(ttl: number) {
  return (value: string): RecentItem[] => {
    try {
      const parsed = JSON.parse(value) as RecentItem[];
      if (!Array.isArray(parsed)) return [];

      // Filter out expired items and validate structure
      return filterExpired(parsed, ttl).filter(
        (item) =>
          typeof item.href === 'string' &&
          typeof item.title === 'string' &&
          typeof item.visitedAt === 'number'
      );
    } catch {
      return [];
    }
  };
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to track recently visited navigation items.
 *
 * @example
 * ```tsx
 * function SidebarRecent() {
 *   const { items, addItem } = useRecentItems({ maxItems: 5 });
 *
 *   // Track navigation
 *   useEffect(() => {
 *     addItem({ href: pathname, title: pageTitle, icon: 'home' });
 *   }, [pathname, pageTitle, addItem]);
 *
 *   return (
 *     <nav>
 *       {items.map((item) => (
 *         <Link key={item.href} href={item.href}>
 *           {item.title}
 *         </Link>
 *       ))}
 *     </nav>
 *   );
 * }
 * ```
 */
export function useRecentItems(
  options: UseRecentItemsOptions = {}
): UseRecentItemsReturn {
  const {
    maxItems = DEFAULT_MAX_ITEMS,
    storageKey = DEFAULT_STORAGE_KEY,
    ttl = DEFAULT_TTL,
    persist = true,
    excludePaths = [],
  } = options;

  // Memoize deserializer to avoid recreation on every render
  const deserializer = useMemo(() => createDeserializer(ttl), [ttl]);

  // =============================================================================
  // State
  // =============================================================================

  const [items, setItems, clearStorage] = useLocalStorage<RecentItem[]>(
    storageKey,
    [],
    {
      syncTabs: persist,
      deserializer,
    }
  );

  // =============================================================================
  // Actions
  // =============================================================================

  const addItem = useCallback(
    (newItem: Omit<RecentItem, 'visitedAt'>) => {
      // Skip excluded paths
      if (excludePaths.some((path) => newItem.href.startsWith(path))) {
        return;
      }

      setItems((current) => {
        // Remove existing item if present (to move to top)
        const filtered = current.filter((item) => item.href !== newItem.href);

        // Add new item at the beginning
        const updated: RecentItem[] = [
          { ...newItem, visitedAt: Date.now() },
          ...filtered,
        ];

        // Trim to max items
        return updated.slice(0, maxItems);
      });
    },
    [maxItems, excludePaths]
  );

  const removeItem = useCallback((href: string) => {
    setItems((current) => current.filter((item) => item.href !== href));
  }, []);

  const clearItems = useCallback(() => {
    clearStorage();
  }, [clearStorage]);

  const hasItem = useCallback(
    (href: string) => items.some((item) => item.href === href),
    [items]
  );

  // =============================================================================
  // Cleanup expired items periodically
  // =============================================================================

  useEffect(() => {
    // Clean up expired items on mount and every hour
    const cleanup = () => {
      setItems((current) => {
        const filtered = filterExpired(current, ttl);
        return filtered.length !== current.length ? filtered : current;
      });
    };

    cleanup();
    const interval = setInterval(cleanup, 60 * 60 * 1000); // Every hour

    return () => clearInterval(interval);
  }, [ttl]);

  // =============================================================================
  // Return
  // =============================================================================

  const count = useMemo(() => items.length, [items]);

  return {
    items,
    addItem,
    removeItem,
    clearItems,
    hasItem,
    count,
  };
}
