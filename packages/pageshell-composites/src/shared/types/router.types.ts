/**
 * Router Adapter Types
 *
 * Framework-agnostic navigation interfaces.
 *
 * @module shared/types/router
 */

// =============================================================================
// Router Adapter (Framework Agnostic)
// =============================================================================

/**
 * Router adapter interface for framework-agnostic navigation.
 *
 * Implementations provided for:
 * - Next.js App Router
 * - Next.js Pages Router
 * - React Router
 * - Custom routers
 */
export interface RouterAdapter {
  /** Navigate to a URL */
  push(url: string): void;
  /** Replace current URL */
  replace(url: string): void;
  /** Go back */
  back(): void;
  /** Get current pathname */
  pathname: string;
  /** Get current search params */
  searchParams?: URLSearchParams;
}
