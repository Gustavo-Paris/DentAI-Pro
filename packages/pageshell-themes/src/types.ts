/**
 * Theme System Types
 *
 * Type definitions for the PageShell theming system.
 *
 * @module types
 */

/**
 * CSS color value - can be any valid CSS color
 */
export type CSSColor = string;

/**
 * Theme color palette
 */
export interface ThemeColors {
  /** Primary brand color */
  primary: CSSColor;
  /** Primary color for text on primary background */
  primaryForeground: CSSColor;

  /** Secondary/accent color */
  secondary: CSSColor;
  /** Secondary color for text on secondary background */
  secondaryForeground: CSSColor;

  /** Accent color for highlights */
  accent: CSSColor;
  /** Accent color for text on accent background */
  accentForeground: CSSColor;

  /** Muted/subtle backgrounds */
  muted: CSSColor;
  /** Muted foreground for subtle text */
  mutedForeground: CSSColor;

  /** Success state color */
  success: CSSColor;
  /** Success foreground */
  successForeground: CSSColor;

  /** Warning state color */
  warning: CSSColor;
  /** Warning foreground */
  warningForeground: CSSColor;

  /** Destructive/error state color */
  destructive: CSSColor;
  /** Destructive foreground */
  destructiveForeground: CSSColor;

  /** Info/informational state color */
  info: CSSColor;
  /** Info foreground */
  infoForeground: CSSColor;

  /** Page background */
  background: CSSColor;
  /** Default text color */
  foreground: CSSColor;

  /** Card/surface background */
  card: CSSColor;
  /** Card text color */
  cardForeground: CSSColor;

  /** Popover/dropdown background */
  popover: CSSColor;
  /** Popover text color */
  popoverForeground: CSSColor;

  /** Border color */
  border: CSSColor;
  /** Input border color */
  input: CSSColor;
  /** Focus ring color */
  ring: CSSColor;
}

/**
 * Theme spacing scale
 */
export interface ThemeSpacing {
  /** Extra small spacing (default: 0.25rem) */
  xs: string;
  /** Small spacing (default: 0.5rem) */
  sm: string;
  /** Medium spacing (default: 1rem) */
  md: string;
  /** Large spacing (default: 1.5rem) */
  lg: string;
  /** Extra large spacing (default: 2rem) */
  xl: string;
  /** 2x extra large spacing (default: 3rem) */
  '2xl': string;
}

/**
 * Theme border radius scale
 */
export interface ThemeRadius {
  /** No radius */
  none: string;
  /** Small radius (default: 0.25rem) */
  sm: string;
  /** Medium radius (default: 0.375rem) */
  md: string;
  /** Large radius (default: 0.5rem) */
  lg: string;
  /** Extra large radius (default: 0.75rem) */
  xl: string;
  /** 2x extra large radius (default: 1rem) */
  '2xl': string;
  /** Full/pill radius */
  full: string;
}

/**
 * Theme typography settings
 */
export interface ThemeTypography {
  /** Font family for body text */
  fontFamily: string;
  /** Font family for headings (optional, defaults to fontFamily) */
  fontFamilyHeading?: string;
  /** Font family for monospace/code */
  fontFamilyMono: string;
  /** Base font size */
  fontSize: string;
  /** Base line height */
  lineHeight: string;
}

/**
 * Theme shadow definitions
 */
export interface ThemeShadows {
  /** Small shadow */
  sm: string;
  /** Default shadow */
  default: string;
  /** Medium shadow */
  md: string;
  /** Large shadow */
  lg: string;
  /** Extra large shadow */
  xl: string;
  /** 2x extra large shadow */
  '2xl': string;
  /** Inner shadow */
  inner: string;
  /** No shadow */
  none: string;
}

/**
 * Theme animation/transition settings
 */
export interface ThemeAnimations {
  /** Fast transition duration */
  fast: string;
  /** Normal transition duration */
  normal: string;
  /** Slow transition duration */
  slow: string;
  /** Default easing function */
  easing: string;
}

/**
 * Complete theme configuration
 */
export interface ThemeConfig {
  /** Theme name identifier */
  name: string;
  /** Theme display label */
  label?: string;
  /** Theme description */
  description?: string;
  /** Color mode: light or dark */
  mode: 'light' | 'dark';
  /** Color palette */
  colors: ThemeColors;
  /** Spacing scale (optional, uses defaults) */
  spacing?: Partial<ThemeSpacing>;
  /** Border radius scale (optional, uses defaults) */
  radius?: Partial<ThemeRadius>;
  /** Typography settings (optional, uses defaults) */
  typography?: Partial<ThemeTypography>;
  /** Shadow definitions (optional, uses defaults) */
  shadows?: Partial<ThemeShadows>;
  /** Animation settings (optional, uses defaults) */
  animations?: Partial<ThemeAnimations>;
  /** Additional custom CSS variables */
  extend?: Record<string, string>;
}

/**
 * Resolved theme with all defaults applied
 */
export interface ResolvedTheme {
  name: string;
  label: string;
  description: string;
  mode: 'light' | 'dark';
  colors: ThemeColors;
  spacing: ThemeSpacing;
  radius: ThemeRadius;
  typography: ThemeTypography;
  shadows: ThemeShadows;
  animations: ThemeAnimations;
  extend: Record<string, string>;
  /** Generated CSS variables */
  cssVars: Record<string, string>;
  /** CSS string for injection */
  css: string;
}

/**
 * Theme preset - a pre-configured theme
 */
export interface ThemePreset extends ThemeConfig {
  /** Preset identifier */
  id: string;
}
