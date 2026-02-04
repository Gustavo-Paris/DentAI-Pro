/**
 * SettingsNavigationCard Component
 *
 * A themed navigation card for settings pages.
 *
 * @module settings
 *
 * @example
 * ```tsx
 * <SettingsNavigationCard
 *   title="Notifications"
 *   description="Manage your notification preferences"
 *   href="/settings/notifications"
 *   icon="bell"
 *   theme="creator"
 *   iconColor="amber"
 * />
 * ```
 *
 * @example Disabled/coming soon
 * ```tsx
 * <SettingsNavigationCard
 *   title="Payments"
 *   description="Payment methods and history"
 *   icon="credit-card"
 *   theme="dash"
 *   iconColor="emerald"
 *   disabled
 *   disabledText="Coming soon"
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { PageIcon, resolveIcon } from '@pageshell/primitives';
import type { SettingsNavigationCardProps, SettingsIconColor, SettingsTheme } from './types';

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

// Theme variable getters
const getThemeVars = (_theme: SettingsTheme) => ({
  text: 'var(--color-foreground)',
  textMuted: 'var(--color-muted-foreground)',
  textSubtle: 'oklch(from var(--color-muted-foreground) l c h / 0.7)',
  primary: 'var(--color-primary)',
  border: 'var(--color-border)',
  surface: 'var(--color-muted)',
});

export function SettingsNavigationCard({
  title,
  description,
  href,
  icon,
  theme,
  iconColor = 'violet',
  disabled = false,
  disabledText = 'Coming soon',
  linkText,
  statusText,
  className,
}: SettingsNavigationCardProps) {
  const vars = getThemeVars(theme);
  const colorClasses = iconColorClasses[iconColor];
  const Icon = resolveIcon(icon);

  const CardContent = (
    <div
      className={cn(
        'relative p-4 rounded-xl transition-all duration-200',
        disabled ? 'opacity-60' : 'hover:shadow-md',
        className
      )}
      style={{
        backgroundColor: vars.surface,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: vars.border,
      }}
    >
      {/* Disabled overlay */}
      {disabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-xl z-10">
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: vars.textMuted }}>
            <PageIcon name="lock" className="w-4 h-4" />
            <span>{disabledText}</span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        {Icon && (
          <div
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0',
              colorClasses,
              disabled && 'opacity-50'
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              'text-base font-semibold',
              disabled && 'opacity-70'
            )}
            style={{ color: disabled ? vars.textMuted : vars.text }}
          >
            {title}
          </h3>
          <p
            className="text-sm mt-1"
            style={{ color: vars.textMuted }}
          >
            {description}
          </p>

          {/* Link text or status */}
          {(linkText || statusText) && (
            <span
              className="text-xs mt-2 inline-block font-medium"
              style={{ color: disabled ? vars.textSubtle : vars.primary }}
            >
              {disabled ? statusText || disabledText : linkText}
            </span>
          )}
        </div>

        {/* Arrow for enabled cards */}
        {!disabled && (
          <div className="flex-shrink-0 self-center">
            <PageIcon
              name="chevron-right"
              className="w-5 h-5 transition-transform group-hover:translate-x-1 text-muted-foreground"
            />
          </div>
        )}
      </div>
    </div>
  );

  if (disabled || !href) {
    return CardContent;
  }

  return (
    <a href={href} className="group block">
      {CardContent}
    </a>
  );
}

SettingsNavigationCard.displayName = 'SettingsNavigationCard';
