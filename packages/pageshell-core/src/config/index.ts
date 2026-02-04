/**
 * @pageshell/core/config
 *
 * Configuration exports for PageShell behavior.
 */

// Sidebar Collapse Routes
export {
  type SidebarCollapseConfig,
  DEFAULT_COLLAPSED_ROUTES,
  DEFAULT_SIDEBAR_COLLAPSE_CONFIG,
  matchesAnyPattern,
} from './sidebarCollapseRoutes';

// Header Behavior Routes
export {
  type HeaderBehaviorConfig,
  ALWAYS_VISIBLE_HEADER_ROUTES,
  DEFAULT_HEADER_BEHAVIOR_CONFIG,
} from './headerBehaviorRoutes';
