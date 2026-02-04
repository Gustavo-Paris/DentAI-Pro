/**
 * Theme System Types
 *
 * Theme configuration and presets for PageShell composites.
 *
 * @module shared/types/theme
 */

// =============================================================================
// Theme System
// =============================================================================

/**
 * Available theme presets
 */
export type PageShellTheme = 'admin' | 'creator' | 'student' | 'default';

/**
 * Theme configuration
 */
export interface ThemeConfig {
  /** Theme name */
  name: string;
  /** Primary color CSS variable */
  primaryColor: string;
  /** Primary muted color */
  primaryMuted: string;
  /** Accent color */
  accentColor: string;
  /** Custom class name to add to root */
  className?: string;
}
