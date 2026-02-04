/**
 * PageAlert Utilities
 *
 * @module page-alert
 */

// =============================================================================
// Default Link Component
// =============================================================================

/**
 * Default link component that renders a plain anchor tag.
 * Used as fallback when no custom LinkComponent is provided.
 */
export function DefaultLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

// =============================================================================
// Persistence Utilities
// =============================================================================

const STORAGE_PREFIX = 'page-alert-dismissed:';

/**
 * Check if alert was dismissed (from localStorage)
 */
export function isDismissedPersisted(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${key}`) === 'true';
  } catch {
    return false;
  }
}

/**
 * Persist dismissed state to localStorage
 */
export function persistDismissed(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, 'true');
  } catch {
    // Ignore localStorage errors
  }
}
