/**
 * Sidebar Collapse Routes Configuration
 *
 * Defines which routes should have the sidebar collapsed by default.
 * Used for pages that benefit from more screen space (chat, study, etc.)
 *
 * @module config/sidebarCollapseRoutes
 */

// =============================================================================
// Types
// =============================================================================

export interface SidebarCollapseConfig {
  /** Routes that should open with sidebar collapsed */
  defaultCollapsedRoutes?: readonly string[];
  /** localStorage key for persistence (default: 'sidebar-mode') */
  persistKey?: string;
  /** Whether to respect route defaults over user preference (default: true) */
  respectRouteDefault?: boolean;
}

// =============================================================================
// Default Routes
// =============================================================================

/**
 * Routes where sidebar opens collapsed by default.
 * Supports wildcards: * matches any segment, ** matches multiple segments.
 *
 * @example
 * '/student/chat' - exact match
 * '/student/* /chat' - matches /student/123/chat
 * '/student/courses/* /learn/*' - matches /student/courses/123/learn/456
 */
export const DEFAULT_COLLAPSED_ROUTES = [
  // Chat pages - need full screen for conversation
  '/student/chat',
  '/student/*/chat',

  // Study/lesson pages - need full screen for content
  '/student/lessons/*',
  '/student/courses/*/learn/*',
  '/student/courses/*/lessons/*',

  // Creator chat/messaging
  '/creator-portal/*/messages',

  // Admin messaging
  '/admin/messages/*',
] as const;

// =============================================================================
// Route Matching Utility
// =============================================================================

/**
 * Converts a route pattern to a RegExp.
 * Supports * (single segment) and ** (multiple segments).
 */
function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    // Escape special regex chars except *
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    // ** matches multiple segments
    .replace(/\*\*/g, '.*')
    // * matches single segment (no slashes)
    .replace(/\*/g, '[^/]+');

  return new RegExp(`^${escaped}$`);
}

/**
 * Checks if a pathname matches any of the given patterns.
 */
export function matchesAnyPattern(
  pathname: string,
  patterns: readonly string[] | undefined
): boolean {
  if (!patterns || patterns.length === 0) return false;

  return patterns.some((pattern) => {
    const regex = patternToRegex(pattern);
    return regex.test(pathname);
  });
}

// =============================================================================
// Default Config
// =============================================================================

export const DEFAULT_SIDEBAR_COLLAPSE_CONFIG: SidebarCollapseConfig = {
  defaultCollapsedRoutes: DEFAULT_COLLAPSED_ROUTES,
  persistKey: 'sidebar-mode',
  respectRouteDefault: true,
};
