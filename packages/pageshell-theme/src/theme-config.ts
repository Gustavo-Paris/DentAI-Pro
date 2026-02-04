/**
 * @pageshell/theme - Theme Configuration
 *
 * All themes use unified portal-* CSS classes from:
 * - @pageshell/themes/base (shared classes)
 * - @pageshell/themes/presets (theme colors only)
 *
 * @module theme-config
 */

import type { PageShellTheme, ThemeConfig } from './types';

// =============================================================================
// Constants
// =============================================================================

/** Maximum animation delay index (matches portal-animate-in-delay-8 in CSS) */
const MAX_ANIMATION_DELAY = 8;

// =============================================================================
// Theme Configuration
// =============================================================================

/**
 * Shared portal configuration (same classes for all themes)
 * Colors are handled by CSS variables in each theme preset
 */
const portalConfig: ThemeConfig = {
  container: 'max-w-7xl mx-auto px-4 sm:px-6',
  animate: 'portal-animate-in',
  animateDelay: (n: number) => `portal-animate-in-delay-${Math.min(n, MAX_ANIMATION_DELAY)}`,
  heading: 'portal-heading',
  headingXl: 'portal-heading-xl',
  headingLg: 'portal-heading-lg',
  headingMd: 'portal-heading-md',
  label: 'portal-label',
  sectionIcon: 'portal-section-icon',
  quickAction: 'portal-quick-action',
  quickActionIcon: 'portal-quick-action-icon',
  textMuted: 'var(--color-muted-foreground, #a1a1aa)',
  primary: 'var(--color-primary, #8b5cf6)',
  accent: 'var(--color-accent, #06b6d4)',
};

/**
 * Theme configuration mapping
 * All themes share the same portal-* classes
 *
 * @example
 * const config = themeConfigs.creator;
 * // config.animate = "portal-animate-in"
 * // config.animateDelay(1) = "portal-animate-in-delay-1"
 */
export const themeConfigs: Record<PageShellTheme, ThemeConfig> = {
  admin: portalConfig,
  creator: portalConfig,
  student: portalConfig,
  default: portalConfig,
};

/**
 * Get theme configuration by name
 *
 * @param theme - Theme name
 * @returns Theme configuration object
 *
 * @example
 * const config = getThemeConfig('creator');
 * // config.animate === "portal-animate-in"
 */
export function getThemeConfig(theme: PageShellTheme): ThemeConfig {
  return themeConfigs[theme];
}

// =============================================================================
// Icon Color Mapping
// =============================================================================

/**
 * Icon color to CSS class mapping
 * Unified across all themes using semantic color names
 */
const iconColors: Record<string, string> = {
  cyan: 'cyan',
  violet: 'violet',
  emerald: 'emerald',
  amber: 'amber',
  blue: 'blue',
  rose: 'rose',
  primary: 'primary',
  secondary: 'secondary',
  accent: 'accent',
  muted: 'muted',
};

/**
 * Icon color classes by theme
 * Currently identical for all themes
 */
export const iconColorClasses: Record<PageShellTheme, Record<string, string>> = {
  admin: iconColors,
  creator: iconColors,
  student: iconColors,
  default: iconColors,
};
