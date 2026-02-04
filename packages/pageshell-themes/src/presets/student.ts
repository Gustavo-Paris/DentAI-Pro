/**
 * Student Theme Preset
 *
 * A friendly dark theme with emerald accent for learners.
 *
 * @module presets/student
 */

import { createTheme } from '../createTheme';
import type { ThemePreset } from '../types';

export const studentThemeConfig: ThemePreset = {
  id: 'student',
  name: 'student',
  label: 'Student',
  description: 'Friendly dark theme with emerald accent for learners',
  mode: 'dark',
  colors: {
    // Primary - Emerald
    primary: '#10b981',
    primaryForeground: '#ffffff',

    // Secondary - Slate
    secondary: '#334155',
    secondaryForeground: '#f8fafc',

    // Accent - Emerald lighter
    accent: '#34d399',
    accentForeground: '#064e3b',

    // Muted
    muted: '#0f3d2e',
    mutedForeground: '#6ee7b7',

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
    background: '#0a1f16',
    foreground: '#f8fafc',
    card: '#0f3d2e',
    cardForeground: '#f8fafc',
    popover: '#0f3d2e',
    popoverForeground: '#f8fafc',

    // Borders
    border: '#166534',
    input: '#166534',
    ring: '#10b981',
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
    // Student-specific variables
    '--student-primary': '#10b981',
    '--student-primary-muted': 'rgba(16, 185, 129, 0.1)',
    '--student-accent': '#34d399',
    '--student-success': '#22c55e',
    '--student-warning': '#f59e0b',
    '--student-destructive': '#ef4444',
    '--student-text': '#f8fafc',
    '--student-text-muted': '#6ee7b7',
    '--student-surface': '#0f3d2e',
    '--student-surface-elevated': '#145a41',
    // Glass modal variables
    '--glass-modal-bg': 'rgba(10, 25, 20, 0.85)',
    '--glass-modal-glow': 'rgba(16, 185, 129, 0.15)',
    // Sidebar variables
    '--sidebar': '#071510',
    '--sidebar-foreground': '#f8fafc',
    '--sidebar-border': '#0f3d2e',
    '--sidebar-accent': '#0f3d2e',
    '--sidebar-accent-foreground': '#f8fafc',
    '--sidebar-primary': '#10b981',
    '--sidebar-primary-foreground': '#ffffff',
  },
};

export const studentTheme = createTheme(studentThemeConfig);
