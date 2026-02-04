/**
 * BarStats Component
 *
 * Bar variant for PageStats.
 *
 * @module page-stats
 */

'use client';

import { cn } from '@pageshell/core';
import { resolveIcon } from '@pageshell/primitives';
import { barIconVariantClasses } from '../constants';
import type { VariantProps } from '../types';

// =============================================================================
// Component
// =============================================================================

export function BarStats({
  stats,
  animationDelay = 2,
  className,
  testId,
}: VariantProps) {
  return (
    <div
      className={cn(
        'portal-achievements-stats',
        'portal-animate-in',
        `portal-animate-in-delay-${animationDelay}`,
        className
      )}
      data-testid={testId}
    >
      {stats.map((stat, index) => {
        const Icon = resolveIcon(stat.icon);
        const iconClass = barIconVariantClasses[stat.itemVariant ?? 'default'];
        const isLast = index === stats.length - 1;

        return (
          <div key={`${stat.label}-${index}`} className="contents">
            <div className="portal-achievements-stat">
              {Icon && (
                <div className={cn('portal-achievements-stat-icon', iconClass)}>
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <div className="portal-achievements-stat-content">
                <span className={cn('portal-achievements-stat-value', stat.valueClassName)}>
                  {stat.value}
                </span>
                <span className="portal-achievements-stat-label">{stat.label}</span>
              </div>
            </div>
            {!isLast && <div className="portal-achievements-stat-divider" />}
          </div>
        );
      })}
    </div>
  );
}
