'use client';

import { useEffect } from 'react';

/**
 * Sets the document title (browser tab title).
 *
 * @param title - The title to set, or undefined to skip
 *
 * @example
 * useDocumentTitle('Settings - My App');
 * useDocumentTitle(user?.name ? `${user.name} - Profile` : undefined);
 */
export function useDocumentTitle(title: string | undefined): void {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);
}
