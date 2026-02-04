/**
 * Theme Presets
 *
 * Pre-configured themes for common use cases.
 *
 * @module presets
 */

export { defaultTheme, defaultThemeConfig } from './default';
export { adminTheme, adminThemeConfig } from './admin';
export { creatorTheme, creatorThemeConfig } from './creator';
export { studentTheme, studentThemeConfig } from './student';

// Re-export all themes as an array for convenience
import { defaultTheme } from './default';
import { adminTheme } from './admin';
import { creatorTheme } from './creator';
import { studentTheme } from './student';

/**
 * All available preset themes
 */
export const presetThemes = [
  defaultTheme,
  adminTheme,
  creatorTheme,
  studentTheme,
] as const;

/**
 * Theme names for type safety
 */
export type PresetThemeName = 'default' | 'admin' | 'creator' | 'student';

/**
 * Get a preset theme by name
 */
export function getPresetTheme(name: PresetThemeName) {
  const themeMap = {
    default: defaultTheme,
    admin: adminTheme,
    creator: creatorTheme,
    student: studentTheme,
  } as const;

  return themeMap[name];
}
