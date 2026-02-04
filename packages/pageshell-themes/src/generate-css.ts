/**
 * CSS Generation Script
 *
 * Generates a CSS file with all theme variables.
 * This is called during build to produce themes.css
 *
 * @module generate-css
 */

import { presetThemes } from './presets';
import { generateThemeCSS } from './createTheme';

/**
 * Generate CSS content for all preset themes
 */
export function generateAllThemesCSS(): string {
  const header = `/**
 * PageShell Themes
 *
 * Auto-generated theme CSS variables.
 * Import this file to get all preset theme styles.
 *
 * Usage:
 *   <html data-theme="admin">
 *   <html data-theme="creator">
 *   <html data-theme="student">
 *   <html data-theme="default">
 *
 * @generated
 */

`;

  // Generate base CSS reset/defaults
  const baseCSS = `/* Base defaults */
:root {
  color-scheme: dark;
}

`;

  // Generate all theme CSS
  const themesCSS = generateThemeCSS([...presetThemes]);

  return header + baseCSS + themesCSS;
}

// Export for programmatic use
export { generateThemeCSS };
