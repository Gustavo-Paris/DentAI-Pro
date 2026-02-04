/**
 * React Hooks for Theme Management
 *
 * Provides hooks for using themes in React applications.
 *
 * @module hooks
 */

'use client';

import * as React from 'react';
import type { ResolvedTheme, ThemeConfig } from './types';
import { createTheme, applyTheme, removeTheme } from './createTheme';
import { presetThemes, getPresetTheme, type PresetThemeName } from './presets';

// =============================================================================
// Types
// =============================================================================

export interface ThemeContextValue {
  /** Current active theme */
  theme: ResolvedTheme;
  /** Set theme by resolved theme */
  setTheme: (theme: ResolvedTheme) => void;
  /** Set theme by preset name */
  setThemeByName: (name: PresetThemeName) => void;
  /** Available preset themes */
  presets: readonly ResolvedTheme[];
  /** Create and apply a custom theme */
  applyCustomTheme: (config: ThemeConfig) => void;
  /** Is dark mode */
  isDark: boolean;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Default theme (preset name or resolved theme) */
  defaultTheme?: PresetThemeName | ResolvedTheme;
  /** Storage key for persisting theme preference */
  storageKey?: string;
  /** Target element for applying theme (defaults to documentElement) */
  target?: HTMLElement;
}

// =============================================================================
// Context
// =============================================================================

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

/**
 * Theme provider component for React applications.
 *
 * @example
 * ```tsx
 * import { ThemeProvider } from '@pageshell/themes';
 *
 * function App() {
 *   return (
 *     <ThemeProvider defaultTheme="admin" storageKey="pageshell-theme">
 *       <YourApp />
 *     </ThemeProvider>
 *   );
 * }
 * ```
 */
export function ThemeProvider({
  children,
  defaultTheme = 'default',
  storageKey = 'pageshell-theme',
  target,
}: ThemeProviderProps) {
  // Resolve default theme
  const initialTheme = React.useMemo(() => {
    if (typeof defaultTheme === 'string') {
      return getPresetTheme(defaultTheme);
    }
    return defaultTheme;
  }, [defaultTheme]);

  const [theme, setThemeState] = React.useState<ResolvedTheme>(initialTheme);

  // Load persisted theme on mount
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'string') {
          // It's a preset name
          const preset = presetThemes.find((t) => t.name === parsed);
          if (preset) {
            setThemeState(preset);
          }
        } else if (parsed.name && parsed.cssVars) {
          // It's a resolved theme
          setThemeState(parsed);
        }
      } catch {
        // Invalid stored value, use default
      }
    }
  }, [storageKey]);

  // Apply theme to DOM
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const targetElement = target || document.documentElement;
    applyTheme(theme, targetElement);

    return () => {
      removeTheme(theme, targetElement);
    };
  }, [theme, target]);

  // Persist theme preference
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    // Store just the name for preset themes
    const isPreset = presetThemes.some((t) => t.name === theme.name);
    localStorage.setItem(
      storageKey,
      isPreset ? JSON.stringify(theme.name) : JSON.stringify(theme)
    );
  }, [theme, storageKey]);

  const setTheme = React.useCallback((newTheme: ResolvedTheme) => {
    setThemeState(newTheme);
  }, []);

  const setThemeByName = React.useCallback((name: PresetThemeName) => {
    const preset = getPresetTheme(name);
    setThemeState(preset);
  }, []);

  const applyCustomTheme = React.useCallback((config: ThemeConfig) => {
    const custom = createTheme(config);
    setThemeState(custom);
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      setThemeByName,
      presets: presetThemes,
      applyCustomTheme,
      isDark: theme.mode === 'dark',
    }),
    [theme, setTheme, setThemeByName, applyCustomTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access theme context.
 *
 * @example
 * ```tsx
 * function ThemeSwitcher() {
 *   const { theme, setThemeByName, presets } = useTheme();
 *
 *   return (
 *     <select
 *       value={theme.name}
 *       onChange={(e) => setThemeByName(e.target.value as PresetThemeName)}
 *     >
 *       {presets.map((preset) => (
 *         <option key={preset.name} value={preset.name}>
 *           {preset.label}
 *         </option>
 *       ))}
 *     </select>
 *   );
 * }
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

/**
 * Hook to access just the current theme without context requirement.
 * Useful for server components or non-React contexts.
 *
 * @param themeName - Theme preset name
 * @returns The resolved theme
 */
export function usePresetTheme(themeName: PresetThemeName): ResolvedTheme {
  return React.useMemo(() => getPresetTheme(themeName), [themeName]);
}
