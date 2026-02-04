/**
 * Creator Theme Preset
 *
 * A creative dark theme with violet accent for content creators.
 *
 * @module presets/creator
 */

import { createTheme } from '../createTheme';
import type { ThemePreset } from '../types';

export const creatorThemeConfig: ThemePreset = {
  id: 'creator',
  name: 'creator',
  label: 'Creator',
  description: 'Creative dark theme with violet accent for content creators',
  mode: 'dark',
  colors: {
    // Primary - Violet
    primary: '#8b5cf6',
    primaryForeground: '#ffffff',

    // Secondary - Slate
    secondary: '#334155',
    secondaryForeground: '#f8fafc',

    // Accent - Violet lighter
    accent: '#a78bfa',
    accentForeground: '#1e1b4b',

    // Muted
    muted: '#1e1b4b',
    mutedForeground: '#a5b4fc',

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
    background: '#0c0a1d',
    foreground: '#f8fafc',
    card: '#1a1744',
    cardForeground: '#f8fafc',
    popover: '#1a1744',
    popoverForeground: '#f8fafc',

    // Borders
    border: '#312e81',
    input: '#312e81',
    ring: '#8b5cf6',
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
    // Creator-specific variables
    '--creator-primary': '#8b5cf6',
    '--creator-primary-muted': 'rgba(139, 92, 246, 0.1)',
    '--creator-accent': '#a78bfa',
    '--creator-success': '#10b981',
    '--creator-warning': '#f59e0b',
    '--creator-destructive': '#ef4444',
    '--creator-text': '#f8fafc',
    '--creator-text-muted': '#a5b4fc',
    '--creator-surface': '#1a1744',
    '--creator-surface-elevated': '#252052',
    // Glass modal variables
    '--glass-modal-bg': 'rgba(20, 10, 35, 0.85)',
    '--glass-modal-glow': 'rgba(139, 92, 246, 0.15)',
    // Sidebar variables
    '--sidebar': '#0a0816',
    '--sidebar-foreground': '#f8fafc',
    '--sidebar-border': '#1e1b4b',
    '--sidebar-accent': '#1e1b4b',
    '--sidebar-accent-foreground': '#f8fafc',
    '--sidebar-primary': '#8b5cf6',
    '--sidebar-primary-foreground': '#ffffff',
  },
};

export const creatorTheme = createTheme(creatorThemeConfig);
