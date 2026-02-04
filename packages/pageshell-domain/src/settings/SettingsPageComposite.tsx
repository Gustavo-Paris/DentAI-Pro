/**
 * SettingsPageComposite Component
 *
 * A fully declarative settings page that combines all settings components.
 * Encapsulates hero, featured card, navigation grid, quick actions, and footer.
 *
 * @module settings
 *
 * @example
 * ```tsx
 * <SettingsPageComposite
 *   theme="dash"
 *   hero={{
 *     user: { name: "João", email: "joao@email.com", image: "/avatar.jpg" },
 *     status: { verified: true, label: "Verified account" },
 *     stats: [
 *       { icon: "calendar", value: 2024, label: "Member since" },
 *       { icon: "book-open", value: 5, label: "Courses" },
 *     ],
 *   }}
 *   featured={{
 *     badge: { text: "New", icon: "sparkles" },
 *     icon: "plug",
 *     title: "MCP Integrations",
 *     description: "Connect your IDE",
 *     action: { label: "Connect", href: "/settings/mcp" },
 *   }}
 *   categories={{
 *     title: "Categories",
 *     icon: "settings",
 *     cards: settingsCategories,
 *     columns: 4,
 *   }}
 *   quickActions={{
 *     title: "Quick Actions",
 *     icon: "sparkles",
 *     cards: quickActions,
 *     variant: "glow",
 *   }}
 *   footer={{
 *     icon: "shield",
 *     title: "Your account is protected",
 *     description: "Last activity 2 minutes ago",
 *   }}
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { PageSection } from '@pageshell/layouts';
import { resolveIcon } from '@pageshell/primitives';
import { SettingsHeroCard } from './SettingsHeroCard';
import { SettingsFeaturedCard } from './SettingsFeaturedCard';
import { SettingsNavigationGrid } from './SettingsNavigationGrid';
import type { SettingsPageCompositeProps } from './types';

export function SettingsPageComposite({
  theme,
  hero,
  featured,
  categories,
  quickActions,
  footer,
  className,
}: SettingsPageCompositeProps) {
  const FooterIcon = footer?.icon ? resolveIcon(footer.icon) : null;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Hero Section */}
      <SettingsHeroCard
        {...hero}
        animationDelay="portal-animate-in-delay-1"
      />

      {/* Featured Section */}
      {featured && (
        <SettingsFeaturedCard
          {...featured}
          animationDelay="portal-animate-in-delay-2"
        />
      )}

      {/* Categories Section */}
      <PageSection
        title={categories.title}
        icon={categories.icon}
        iconColor="muted"
        className="portal-animate-in portal-animate-in-delay-2"
      >
        <SettingsNavigationGrid
          cards={categories.cards}
          theme={theme}
          columns={categories.columns ?? 4}
        />
      </PageSection>

      {/* Quick Actions Section */}
      {quickActions && (
        <PageSection
          title={quickActions.title}
          icon={quickActions.icon}
          iconColor="violet"
          className="portal-settings-actions portal-animate-in portal-animate-in-delay-3"
        >
          <SettingsNavigationGrid
            variant="action"
            actionVariant={quickActions.variant ?? 'glow'}
            cards={quickActions.cards}
            theme={theme}
            columns={quickActions.columns ?? 4}
          />
        </PageSection>
      )}

      {/* Footer Info Section */}
      {footer && (
        <div className="portal-settings-info portal-animate-in portal-animate-in-delay-4">
          {FooterIcon && (
            <div className="portal-settings-info-icon">
              <FooterIcon className="w-5 h-5" />
            </div>
          )}
          <div className="portal-settings-info-content">
            <h3 className="portal-settings-info-title">{footer.title}</h3>
            <p className="portal-settings-info-description">{footer.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}

SettingsPageComposite.displayName = 'SettingsPageComposite';
