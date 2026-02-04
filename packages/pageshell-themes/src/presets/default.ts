/**
 * Default Theme Preset
 *
 * A neutral dark theme suitable for most applications.
 *
 * @module presets/default
 */

import { createTheme } from '../createTheme';
import type { ThemePreset } from '../types';

export const defaultThemeConfig: ThemePreset = {
  id: 'default',
  name: 'default',
  label: 'Default',
  description: 'A neutral dark theme with balanced colors',
  mode: 'dark',
  colors: {
    // Primary - Neutral blue
    primary: '#3b82f6',
    primaryForeground: '#ffffff',

    // Secondary - Slate
    secondary: '#475569',
    secondaryForeground: '#f8fafc',

    // Accent - Sky
    accent: '#0ea5e9',
    accentForeground: '#ffffff',

    // Muted
    muted: '#27272a',
    mutedForeground: '#a1a1aa',

    // States
    success: '#22c55e',
    successForeground: '#ffffff',
    warning: '#f59e0b',
    warningForeground: '#ffffff',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    info: '#3b82f6',
    infoForeground: '#ffffff',

    // Backgrounds
    background: '#09090b',
    foreground: '#fafafa',
    card: '#18181b',
    cardForeground: '#fafafa',
    popover: '#18181b',
    popoverForeground: '#fafafa',

    // Borders
    border: '#27272a',
    input: '#27272a',
    ring: '#3b82f6',
  },
  typography: {
    fontFamily:
      'Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontFamilyMono: 'Geist Mono, ui-monospace, SFMono-Regular, monospace',
    fontSize: '16px',
    lineHeight: '1.5',
  },
  radius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
  },
  extend: {
    // Glass modal variables
    '--glass-modal-bg': 'rgba(15, 15, 20, 0.85)',
    '--glass-modal-glow': 'rgba(59, 130, 246, 0.15)',
    // Sidebar variables
    '--sidebar': '#0a0a0b',
    '--sidebar-foreground': '#fafafa',
    '--sidebar-border': '#27272a',
    '--sidebar-accent': '#27272a',
    '--sidebar-accent-foreground': '#fafafa',
    '--sidebar-primary': '#3b82f6',
    '--sidebar-primary-foreground': '#ffffff',
  },
};

export const defaultTheme = createTheme(defaultThemeConfig);
