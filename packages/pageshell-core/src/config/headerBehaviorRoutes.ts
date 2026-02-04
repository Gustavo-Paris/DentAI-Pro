/**
 * Header Behavior Routes Configuration
 *
 * Defines which routes should have headers always visible (no hide on scroll).
 * Used for pages where context is critical (chat, messaging, etc.)
 *
 * @module config/headerBehaviorRoutes
 */

// =============================================================================
// Types
// =============================================================================

export interface HeaderBehaviorConfig {
  /** Routes where header should always be visible */
  alwaysVisibleRoutes?: readonly string[];
}

// =============================================================================
// Default Routes
// =============================================================================

/**
 * Routes where mobile header is always visible (no hide on scroll).
 * Used for chat/messaging where user needs to see who they're talking to.
 *
 * @example
 * '/student/chat' - exact match
 * '/student/* /chat' - matches /student/123/chat
 */
export const ALWAYS_VISIBLE_HEADER_ROUTES = [
  // Student chat - need to see conversation context
  '/student/chat',
  '/student/*/chat',

  // Creator messaging
  '/creator-portal/*/messages',
  '/creator-portal/messages/*',

  // Admin messaging
  '/admin/messages/*',
  '/admin/*/messages',
] as const;

// =============================================================================
// Route Matching (reuse from sidebarCollapseRoutes)
// =============================================================================

// Import from sibling config to avoid duplication
export { matchesAnyPattern } from './sidebarCollapseRoutes';

// =============================================================================
// Default Config
// =============================================================================

export const DEFAULT_HEADER_BEHAVIOR_CONFIG: HeaderBehaviorConfig = {
  alwaysVisibleRoutes: ALWAYS_VISIBLE_HEADER_ROUTES,
};
