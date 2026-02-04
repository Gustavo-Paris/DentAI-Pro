/**
 * Theme Creation Utility
 *
 * Creates resolved themes with CSS variable generation.
 *
 * @module createTheme
 */

import type {
  ThemeConfig,
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeTypography,
  ThemeShadows,
  ThemeAnimations,
  ResolvedTheme,
} from './types';

// =============================================================================
// Default Values
// =============================================================================

const DEFAULT_SPACING: ThemeSpacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
};

const DEFAULT_RADIUS: ThemeRadius = {
  none: '0',
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  full: '9999px',
};

const DEFAULT_TYPOGRAPHY: ThemeTypography = {
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontFamilyMono:
    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  fontSize: '16px',
  lineHeight: '1.5',
};

const DEFAULT_SHADOWS: ThemeShadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
};

const DEFAULT_ANIMATIONS: ThemeAnimations = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

// =============================================================================
// CSS Variable Generation
// =============================================================================

function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function generateColorVars(colors: ThemeColors): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const [key, value] of Object.entries(colors)) {
    vars[`--color-${toKebabCase(key)}`] = value;
  }

  return vars;
}

function generateSpacingVars(spacing: ThemeSpacing): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const [key, value] of Object.entries(spacing)) {
    vars[`--spacing-${key}`] = value;
  }

  return vars;
}

function generateRadiusVars(radius: ThemeRadius): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const [key, value] of Object.entries(radius)) {
    vars[`--radius-${key}`] = value;
  }

  // Also set the default --radius for Tailwind compatibility
  vars['--radius'] = radius.md;

  return vars;
}

function generateTypographyVars(
  typography: ThemeTypography
): Record<string, string> {
  return {
    '--font-family': typography.fontFamily,
    '--font-family-heading': typography.fontFamilyHeading || typography.fontFamily,
    '--font-family-mono': typography.fontFamilyMono,
    '--font-size-base': typography.fontSize,
    '--line-height-base': typography.lineHeight,
  };
}

function generateShadowVars(shadows: ThemeShadows): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const [key, value] of Object.entries(shadows)) {
    vars[`--shadow-${key}`] = value;
  }

  return vars;
}

function generateAnimationVars(
  animations: ThemeAnimations
): Record<string, string> {
  return {
    '--duration-fast': animations.fast,
    '--duration-normal': animations.normal,
    '--duration-slow': animations.slow,
    '--easing-default': animations.easing,
  };
}

function varsToCSS(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
}

// =============================================================================
// Theme Creation
// =============================================================================

/**
 * Creates a resolved theme from a configuration.
 *
 * @param config - Theme configuration
 * @returns Resolved theme with defaults applied and CSS generated
 *
 * @example
 * ```ts
 * const myTheme = createTheme({
 *   name: 'my-theme',
 *   mode: 'dark',
 *   colors: {
 *     primary: '#8b5cf6',
 *     primaryForeground: '#ffffff',
 *     // ... other colors
 *   },
 * });
 *
 * // Use the CSS string
 * console.log(myTheme.css);
 *
 * // Or inject CSS variables
 * Object.entries(myTheme.cssVars).forEach(([key, value]) => {
 *   document.documentElement.style.setProperty(key, value);
 * });
 * ```
 */
export function createTheme(config: ThemeConfig): ResolvedTheme {
  // Merge with defaults
  const spacing: ThemeSpacing = { ...DEFAULT_SPACING, ...config.spacing };
  const radius: ThemeRadius = { ...DEFAULT_RADIUS, ...config.radius };
  const typography: ThemeTypography = {
    ...DEFAULT_TYPOGRAPHY,
    ...config.typography,
  };
  const shadows: ThemeShadows = { ...DEFAULT_SHADOWS, ...config.shadows };
  const animations: ThemeAnimations = {
    ...DEFAULT_ANIMATIONS,
    ...config.animations,
  };
  const extend = config.extend || {};

  // Generate CSS variables
  const cssVars: Record<string, string> = {
    ...generateColorVars(config.colors),
    ...generateSpacingVars(spacing),
    ...generateRadiusVars(radius),
    ...generateTypographyVars(typography),
    ...generateShadowVars(shadows),
    ...generateAnimationVars(animations),
    ...extend,
  };

  // Generate CSS string
  const selector =
    config.mode === 'dark'
      ? `[data-theme="${config.name}"], .${config.name}`
      : `:root[data-theme="${config.name}"], .${config.name}`;

  const css = `${selector} {\n${varsToCSS(cssVars)}\n}`;

  return {
    name: config.name,
    label: config.label || config.name,
    description: config.description || '',
    mode: config.mode,
    colors: config.colors,
    spacing,
    radius,
    typography,
    shadows,
    animations,
    extend,
    cssVars,
    css,
  };
}

/**
 * Generates CSS for multiple themes.
 *
 * @param themes - Array of resolved themes
 * @returns Combined CSS string
 *
 * @example
 * ```ts
 * const allThemesCSS = generateThemeCSS([adminTheme, creatorTheme, studentTheme]);
 * ```
 */
export function generateThemeCSS(themes: ResolvedTheme[]): string {
  return themes.map((theme) => theme.css).join('\n\n');
}

/**
 * Applies a theme to the document.
 *
 * @param theme - The resolved theme to apply
 * @param target - Target element (defaults to document.documentElement)
 *
 * @example
 * ```ts
 * applyTheme(adminTheme);
 * ```
 */
export function applyTheme(
  theme: ResolvedTheme,
  target: HTMLElement = typeof document !== 'undefined'
    ? document.documentElement
    : (null as unknown as HTMLElement)
): void {
  if (!target) return;

  // Set data-theme attribute
  target.setAttribute('data-theme', theme.name);

  // Apply CSS variables
  for (const [key, value] of Object.entries(theme.cssVars)) {
    target.style.setProperty(key, value);
  }
}

/**
 * Removes theme from an element.
 *
 * @param theme - The theme to remove
 * @param target - Target element
 */
export function removeTheme(
  theme: ResolvedTheme,
  target: HTMLElement = typeof document !== 'undefined'
    ? document.documentElement
    : (null as unknown as HTMLElement)
): void {
  if (!target) return;

  // Remove data-theme attribute
  if (target.getAttribute('data-theme') === theme.name) {
    target.removeAttribute('data-theme');
  }

  // Remove CSS variables
  for (const key of Object.keys(theme.cssVars)) {
    target.style.removeProperty(key);
  }
}
