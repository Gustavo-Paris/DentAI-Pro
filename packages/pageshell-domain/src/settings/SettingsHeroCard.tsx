/**
 * SettingsHeroCard Component
 *
 * A hero section for settings pages displaying user info and stats.
 *
 * @module settings
 *
 * @example
 * ```tsx
 * <SettingsHeroCard
 *   user={{
 *     name: "João Silva",
 *     email: "joao@example.com",
 *     image: "/avatar.jpg",
 *   }}
 *   status={{ verified: true, label: "Conta verificada" }}
 *   stats={[
 *     { icon: "calendar", value: 2024, label: "Membro desde" },
 *     { icon: "book-open", value: 5, label: "Cursos" },
 *   ]}
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { PageIcon, resolveIcon } from '@pageshell/primitives';
import type { SettingsHeroCardProps } from './types';

export function SettingsHeroCard({
  user,
  status,
  stats = [],
  animationDelay = 'portal-animate-in-delay-1',
  className,
}: SettingsHeroCardProps) {
  const StatusIcon = status?.icon
    ? resolveIcon(status.icon)
    : resolveIcon('check-circle-2');

  return (
    <div className={cn('portal-settings-hero portal-animate-in', animationDelay, className)}>
      <div className="portal-settings-hero-content">
        {/* Avatar */}
        <div className="portal-settings-hero-avatar">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || 'Avatar'}
              width={80}
              height={80}
              className="portal-settings-hero-avatar-img"
            />
          ) : (
            <div className="portal-settings-hero-avatar-placeholder">
              <PageIcon name="user" className="w-8 h-8" />
            </div>
          )}
          <div className="portal-settings-hero-avatar-glow" />
        </div>

        {/* User Info */}
        <div className="portal-settings-hero-info">
          <h2 className="portal-settings-hero-name">
            {user.name || 'User'}
          </h2>
          <p className="portal-settings-hero-email">
            {user.email || 'email@example.com'}
          </p>
          {status && (
            <div className="portal-settings-hero-status">
              {StatusIcon && <StatusIcon className="w-4 h-4" />}
              <span>{status.label || 'Verified'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats.length > 0 && (
        <div className="portal-settings-hero-stats">
          {stats.map((stat, index) => {
            const StatIcon = resolveIcon(stat.icon);
            return (
              <React.Fragment key={stat.label}>
                {index > 0 && <div className="portal-settings-hero-stat-divider" />}
                <div className="portal-settings-hero-stat">
                  {StatIcon && <StatIcon className="w-4 h-4" />}
                  <span className="portal-settings-hero-stat-value">{stat.value}</span>
                  <span className="portal-settings-hero-stat-label">{stat.label}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

SettingsHeroCard.displayName = 'SettingsHeroCard';
