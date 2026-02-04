/**
 * DashboardHero Component
 *
 * Renders a hero section with progress ring for DashboardPage.
 * Integrates PageHero and PageCompletionRing from PageShell packages.
 *
 * @module dashboard/components/DashboardHero
 */

'use client';

import * as React from 'react';
import { PageHero } from '@pageshell/layouts';
import { PageCompletionRing } from '@pageshell/domain';
import type { HeroConfig, HeroInlineStat } from '../types';
import { resolveNestedValue } from '../../shared/utils/resolveNestedValue';

// =============================================================================
// Types
// =============================================================================

export interface DashboardHeroProps {
  /** Hero configuration */
  config: HeroConfig;
  /** Data object to resolve values from */
  data: Record<string, unknown> | undefined;
}

// =============================================================================
// Component
// =============================================================================

/**
 * DashboardHero renders a PageHero with PageCompletionRing.
 * Resolves values from data using dot-notation keys.
 *
 * @example
 * ```tsx
 * <DashboardHero
 *   config={{
 *     variant: "progress",
 *     title: (v, m) => `${v} de ${m}`,
 *     valueKey: "stats.completed",
 *     maxKey: "stats.total",
 *   }}
 *   data={queryData}
 * />
 * ```
 */
export function DashboardHero({ config, data }: DashboardHeroProps) {
  const {
    title,
    subtitle,
    valueKey,
    maxKey,
    inlineStats,
    ringLabel,
    ringSize = 'xl',
    styleVariant = 'achievements',
  } = config;

  // Resolve values from data
  const value = resolveNestedValue<number>(data, valueKey) ?? 0;
  const max = resolveNestedValue<number>(data, maxKey) ?? 0;

  // Resolve title and subtitle
  const resolvedTitle = typeof title === 'function' ? title(value, max) : title;
  const resolvedSubtitle = typeof subtitle === 'function' ? subtitle(value, max) : subtitle;

  // Resolve inline stats
  const resolvedInlineStats = inlineStats?.map((stat: HeroInlineStat) => {
    const statValue = resolveNestedValue(data, stat.valueKey);
    const formattedValue = stat.format ? stat.format(statValue) : statValue;
    // Ensure value is string or number for PageHero compatibility
    const displayValue: string | number =
      typeof formattedValue === 'string' || typeof formattedValue === 'number'
        ? formattedValue
        : formattedValue != null
          ? String(formattedValue)
          : 0;
    return {
      icon: stat.icon,
      value: displayValue,
      label: stat.label,
      variant: stat.variant,
    };
  });

  return (
    <PageHero
      variant="progress"
      value={value}
      max={max}
      title={resolvedTitle}
      subtitle={resolvedSubtitle}
      styleVariant={styleVariant}
      inlineStats={resolvedInlineStats}
      progressIndicator={
        <PageCompletionRing
          value={value}
          max={max}
          size={ringSize}
          label={ringLabel}
          showLabel={!!ringLabel}
        />
      }
    />
  );
}

DashboardHero.displayName = 'DashboardHero';
