import { lazy } from 'react';

/**
 * Retry lazy imports on chunk loading failure (stale deploy).
 * After a new Vercel deploy, old chunk hashes become 404.
 * This auto-reloads the page once to fetch fresh assets.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyRetry<T extends { default: React.ComponentType<any> }>(
  importFn: () => Promise<T>,
): React.LazyExoticComponent<T['default']> {
  return lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      const isChunkError =
        error instanceof TypeError &&
        error.message.includes('dynamically imported module');
      if (isChunkError) {
        const key = 'chunk-retry-' + window.location.pathname;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          window.location.reload();
          return new Promise(() => {}); // never resolves — reload takes over
        }
        sessionStorage.removeItem(key);
      }
      throw error;
    }
  });
}
