/**
 * Admin Theme Preset
 *
 * A professional dark theme with cyan accent for admin interfaces.
 *
 * @module presets/admin
 */

import { createTheme } from '../createTheme';
import type { ThemePreset } from '../types';

export const adminThemeConfig: ThemePreset = {
  id: 'admin',
  name: 'admin',
  label: 'Admin',
  description: 'Professional dark theme with cyan accent for admin dashboards',
  mode: 'dark',
  colors: {
    // Primary - Cyan
    primary: '#06b6d4',
    primaryForeground: '#ffffff',

    // Secondary - Slate
    secondary: '#334155',
    secondaryForeground: '#f8fafc',

    // Accent - Cyan lighter
    accent: '#22d3ee',
    accentForeground: '#0c4a6e',

    // Muted
    muted: '#1e293b',
    mutedForeground: '#94a3b8',

    // States
    success: '#10b981',
    successForeground: '#ffffff',
    warning: '#f59e0b',
    warningForeground: '#ffffff',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    info: '#3b82f6',
    infoForeground: '#ffffff',

    // Backgrounds
    background: '#0f172a',
    foreground: '#f8fafc',
    card: '#1e293b',
    cardForeground: '#f8fafc',
    popover: '#1e293b',
    popoverForeground: '#f8fafc',

    // Borders
    border: '#334155',
    input: '#334155',
    ring: '#06b6d4',
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
    // Admin-specific variables
    '--admin-primary': '#06b6d4',
    '--admin-primary-muted': 'rgba(6, 182, 212, 0.1)',
    '--admin-accent': '#22d3ee',
    '--admin-success': '#10b981',
    '--admin-warning': '#f59e0b',
    '--admin-destructive': '#ef4444',
    '--admin-text': '#f8fafc',
    '--admin-text-muted': '#94a3b8',
    '--admin-surface': '#1e293b',
    '--admin-surface-elevated': '#334155',
    // Glass modal variables
    '--glass-modal-bg': 'rgba(10, 20, 30, 0.85)',
    '--glass-modal-glow': 'rgba(6, 182, 212, 0.15)',
    // Sidebar variables
    '--sidebar': '#0c1222',
    '--sidebar-foreground': '#f8fafc',
    '--sidebar-border': '#1e293b',
    '--sidebar-accent': '#1e293b',
    '--sidebar-accent-foreground': '#f8fafc',
    '--sidebar-primary': '#06b6d4',
    '--sidebar-primary-foreground': '#ffffff',
  },
};

export const adminTheme = createTheme(adminThemeConfig);
