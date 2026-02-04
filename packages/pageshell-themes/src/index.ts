/**
 * @pageshell/themes
 *
 * Theme system and presets for PageShell.
 *
 * @packageDocumentation
 */

// Types
export type {
  CSSColor,
  ThemeColors,
  ThemeSpacing,
  ThemeRadius,
  ThemeTypography,
  ThemeShadows,
  ThemeAnimations,
  ThemeConfig,
  ResolvedTheme,
  ThemePreset,
} from './types';

// Theme creation utilities
export {
  createTheme,
  generateThemeCSS,
  applyTheme,
  removeTheme,
} from './createTheme';

// Re-export presets for convenience (but recommend importing from ./presets)
export {
  defaultTheme,
  adminTheme,
  creatorTheme,
  studentTheme,
  presetThemes,
  getPresetTheme,
  type PresetThemeName,
} from './presets';

// React hooks
export {
  ThemeProvider,
  useTheme,
  usePresetTheme,
  type ThemeContextValue,
  type ThemeProviderProps,
} from './hooks';

// CSS generation utilities
export { generateAllThemesCSS } from './generate-css';
