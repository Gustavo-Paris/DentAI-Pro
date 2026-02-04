/**
 * SettingsNavigationGrid Component
 *
 * A grid wrapper for settings navigation cards.
 * Supports two variants:
 * - "card" (default): Full navigation cards with title, description, icon
 * - "action": Compact action links with icon and label
 *
 * @module settings
 *
 * @example Card variant (default)
 * ```tsx
 * <SettingsNavigationGrid
 *   cards={[
 *     { title: "Security", description: "...", href: "/settings/security", icon: "shield" },
 *   ]}
 *   theme="dash"
 * />
 * ```
 *
 * @example Action variant
 * ```tsx
 * <SettingsNavigationGrid
 *   variant="action"
 *   cards={[
 *     { label: "View Profile", href: "/profile", icon: "user" },
 *   ]}
 *   theme="dash"
 * />
 * ```
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { PageGrid } from '@pageshell/layouts';
import type { PageGridResponsive } from '@pageshell/layouts';
import { SettingsNavigationCard } from './SettingsNavigationCard';
import { SettingsActionCard } from './SettingsActionCard';
import type {
  SettingsNavigationGridProps,
  SettingsCardItem,
  SettingsActionItem,
} from './types';

export function SettingsNavigationGrid({
  variant = 'card',
  cards,
  theme,
  actionVariant = 'card',
  columns,
  className,
}: SettingsNavigationGridProps) {
  // Default columns based on variant
  const effectiveColumns = columns ?? (variant === 'action' ? 4 : 2);

  const responsive: PageGridResponsive | undefined =
    effectiveColumns === 1
      ? undefined
      : effectiveColumns === 2
        ? { md: 2 }
        : effectiveColumns === 3
          ? { md: 2, lg: 3 }
          : { md: 2, lg: 4 };

  if (variant === 'action') {
    return (
      <PageGrid
        items={cards as SettingsActionItem[]}
        columns={effectiveColumns === 1 ? 1 : undefined}
        responsive={responsive}
        gap={4}
        animated={false}
        className={className}
        keyExtractor={(item) => item.href}
        renderItem={(item) => (
          <SettingsActionCard
            {...item}
            theme={theme}
            variant={actionVariant}
          />
        )}
      />
    );
  }

  return (
    <PageGrid
      items={cards as SettingsCardItem[]}
      columns={effectiveColumns === 1 ? 1 : undefined}
      responsive={responsive}
      gap={4}
      animated={false}
      className={className}
      keyExtractor={(card) => card.title}
      renderItem={(card) => (
        <SettingsNavigationCard
          {...card}
          theme={theme}
        />
      )}
    />
  );
}

SettingsNavigationGrid.displayName = 'SettingsNavigationGrid';
