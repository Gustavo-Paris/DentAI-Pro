/**
 * GridStats Component
 *
 * Grid variant for PageStats.
 *
 * @module page-stats
 */

'use client';

import { cn } from '@pageshell/core';
import { resolveIcon } from '@pageshell/primitives';
import { gridVariantClasses, columnClasses } from '../constants';
import type { VariantProps } from '../types';

// =============================================================================
// Component
// =============================================================================

export function GridStats({
  stats,
  columns = 2,
  animationDelay = 2,
  className,
  testId,
}: VariantProps) {
  return (
    <div
      className={cn(
        'portal-credits-stats portal-animate-in',
        columnClasses[columns],
        `portal-animate-in-delay-${animationDelay}`,
        className
      )}
      data-testid={testId}
    >
      {stats.map((stat, index) => {
        const Icon = resolveIcon(stat.icon);
        const variantClass = gridVariantClasses[stat.gridVariant ?? 'primary'];
        const isWarning = stat.gridVariant === 'warning';

        return (
          <div
            key={`${stat.label}-${index}`}
            className={cn('portal-credits-stat-card', variantClass)}
          >
            {Icon && (
              <div className="portal-credits-stat-icon">
                <Icon className="w-6 h-6" />
              </div>
            )}
            <div className="portal-credits-stat-content">
              <span className="portal-credits-stat-value">{stat.value}</span>
              <span className="portal-credits-stat-label">{stat.label}</span>
            </div>
            {stat.hint && <p className="portal-credits-stat-hint">{stat.hint}</p>}
            {isWarning && <div className="portal-credits-stat-pulse" />}
          </div>
        );
      })}
    </div>
  );
}
