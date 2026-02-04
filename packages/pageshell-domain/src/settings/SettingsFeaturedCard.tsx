/**
 * SettingsFeaturedCard Component
 *
 * A prominent featured card for highlighting new features or integrations.
 * Includes glow effect, badge, icon, and action button.
 *
 * @module settings
 *
 * @example
 * ```tsx
 * <SettingsFeaturedCard
 *   badge={{ text: "New", icon: "sparkles" }}
 *   icon="plug"
 *   title="MCP Integrations"
 *   description="Connect your IDE to sync courses"
 *   action={{ label: "Connect IDE", href: "/settings/mcp" }}
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { resolveIcon } from '@pageshell/primitives';
import type { SettingsFeaturedCardProps } from './types';

export function SettingsFeaturedCard({
  badge,
  icon,
  title,
  description,
  action,
  animationDelay = 'portal-animate-in-delay-2',
  className,
}: SettingsFeaturedCardProps) {
  const Icon = resolveIcon(icon);
  const BadgeIcon = badge?.icon ? resolveIcon(badge.icon) : null;
  const ActionIcon = action.icon ? resolveIcon(action.icon) : resolveIcon('external-link');

  return (
    <div className={cn('portal-settings-featured portal-animate-in', animationDelay, className)}>
      <div className="portal-settings-featured-glow" />

      {badge && (
        <div className="portal-settings-featured-badge">
          {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
          {badge.text}
        </div>
      )}

      <div className="portal-settings-featured-content">
        {Icon && (
          <div className="portal-settings-featured-icon">
            <Icon className="w-6 h-6" />
          </div>
        )}

        <div className="portal-settings-featured-info">
          <h3 className="portal-settings-featured-title">{title}</h3>
          <p className="portal-settings-featured-description">{description}</p>
        </div>

        <a href={action.href} className="portal-settings-featured-btn">
          <span>{action.label}</span>
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
        </a>
      </div>
    </div>
  );
}

SettingsFeaturedCard.displayName = 'SettingsFeaturedCard';
