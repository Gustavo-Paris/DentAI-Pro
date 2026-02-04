/**
 * SettingsActionCard Component
 *
 * A compact action card for quick actions in settings pages.
 *
 * Supports visual variants:
 * - "card" (default): Bordered card with background
 * - "flat": Transparent background, subtle hover
 * - "glow": Icon with glow effect, minimal background
 *
 * @module settings
 *
 * @example
 * ```tsx
 * <SettingsActionCard
 *   label="View Profile"
 *   href="/profile"
 *   icon="user"
 *   theme="dash"
 *   variant="glow"
 *   iconColor="violet"
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { PageIcon, resolveIcon } from '@pageshell/primitives';
import type { SettingsActionCardProps, SettingsIconColor, SettingsTheme } from './types';

// Icon color mappings
const iconColorClasses: Record<SettingsIconColor, string> = {
  violet: 'text-violet-500 bg-violet-500/10',
  emerald: 'text-emerald-500 bg-emerald-500/10',
  amber: 'text-amber-500 bg-amber-500/10',
  blue: 'text-info bg-info/10',
  cyan: 'text-cyan-500 bg-cyan-500/10',
  red: 'text-red-500 bg-red-500/10',
  green: 'text-green-500 bg-green-500/10',
};

// Glow color mappings for the "glow" variant
const iconGlowClasses: Record<SettingsIconColor, string> = {
  violet: 'text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.4)]',
  emerald: 'text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]',
  amber: 'text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)]',
  blue: 'text-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.4)]',
  cyan: 'text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]',
  red: 'text-red-400 shadow-[0_0_20px_rgba(248,113,113,0.4)]',
  green: 'text-green-400 shadow-[0_0_20px_rgba(74,222,128,0.4)]',
};

// Theme variable getters
const getThemeVars = (_theme: SettingsTheme) => ({
  text: 'var(--color-foreground)',
  textMuted: 'var(--color-muted-foreground)',
  border: 'var(--color-border)',
  surface: 'var(--color-muted)',
});

export function SettingsActionCard({
  label,
  href,
  icon,
  theme,
  variant = 'card',
  iconColor = 'violet',
  iconClassName,
  className,
}: SettingsActionCardProps) {
  const vars = getThemeVars(theme);
  const Icon = resolveIcon(icon);

  // Variant-specific styles
  const containerStyles = {
    card: {
      className: 'p-3 rounded-lg hover:shadow-sm',
      style: {
        backgroundColor: vars.surface,
        borderWidth: '1px',
        borderStyle: 'solid' as const,
        borderColor: vars.border,
      },
    },
    flat: {
      className: 'p-3 rounded-lg hover:bg-muted/50',
      style: {},
    },
    glow: {
      className: 'p-2 rounded-lg hover:bg-muted/30',
      style: {},
    },
  };

  const iconStyles = {
    card: iconColorClasses[iconColor],
    flat: iconColorClasses[iconColor],
    glow: cn(
      'bg-muted/50 rounded-xl',
      iconGlowClasses[iconColor]
    ),
  };

  const currentContainer = containerStyles[variant];
  const currentIconStyle = iconStyles[variant];

  return (
    <a
      href={href}
      className={cn(
        'group flex items-center gap-3 transition-all duration-200',
        currentContainer.className,
        className
      )}
      style={currentContainer.style}
    >
      {/* Icon */}
      {Icon && (
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0',
            currentIconStyle,
            iconClassName
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
      )}

      {/* Label */}
      <span
        className="flex-1 text-sm font-medium"
        style={{ color: vars.text }}
      >
        {label}
      </span>

      {/* Arrow */}
      <PageIcon
        name="chevron-right"
        className="w-4 h-4 transition-transform group-hover:translate-x-1 text-muted-foreground"
      />
    </a>
  );
}

SettingsActionCard.displayName = 'SettingsActionCard';
