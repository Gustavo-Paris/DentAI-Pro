/**
 * AURIA Theme Preset
 *
 * Warm champagne gold with clinical neutrals.
 * Premium aesthetic for dental intelligence platform.
 *
 * @module presets/default
 */

import { createTheme } from '../createTheme';
import type { ThemePreset } from '../types';

export const defaultThemeConfig: ThemePreset = {
  id: 'default',
  name: 'default',
  label: 'AURIA',
  description: 'Warm champagne gold with clinical neutrals',
  mode: 'dark',
  colors: {
    // Primary - Champagne Gold
    primary: '#D4AF5C',
    primaryForeground: '#1A1814',

    // Secondary - Warm Slate
    secondary: '#3A3530',
    secondaryForeground: '#F5F3EF',

    // Accent - Deep Gold
    accent: '#9A7B2E',
    accentForeground: '#F5F3EF',

    // Muted
    muted: '#2A2722',
    mutedForeground: '#9C9689',

    // States
    success: '#48BB78',
    successForeground: '#1A1814',
    warning: '#ECC94B',
    warningForeground: '#1A1814',
    destructive: '#E05252',
    destructiveForeground: '#ffffff',
    info: '#63B3ED',
    infoForeground: '#1A1814',

    // Backgrounds
    background: '#141210',
    foreground: '#F5F3EF',
    card: '#1C1A16',
    cardForeground: '#F5F3EF',
    popover: '#1C1A16',
    popoverForeground: '#F5F3EF',

    // Borders
    border: '#3A3530',
    input: '#3A3530',
    ring: '#D4AF5C',
  },
  typography: {
    fontFamily:
      'DM Sans, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontFamilyMono: 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace',
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
    '--glass-modal-bg': 'rgba(20, 18, 16, 0.85)',
    '--glass-modal-glow': 'rgba(184, 150, 62, 0.15)',
    // Sidebar variables
    '--sidebar': '#100E0C',
    '--sidebar-foreground': '#F5F3EF',
    '--sidebar-border': '#3A3530',
    '--sidebar-accent': '#2A2722',
    '--sidebar-accent-foreground': '#F5F3EF',
    '--sidebar-primary': '#D4AF5C',
    '--sidebar-primary-foreground': '#1A1814',
  },
};

export const defaultTheme = createTheme(defaultThemeConfig);
