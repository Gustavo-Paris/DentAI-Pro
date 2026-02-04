'use client';

/**
 * CardStats Variant
 *
 * @module page-stats/variants/CardStats
 */

import { cn } from '@pageshell/core';
import { Card, resolveIcon } from '@pageshell/primitives';
import { usePageShellContext } from '@pageshell/theme';
import { TrendIndicator } from '../../_internal';
import type { VariantProps } from '../types';
import { gridColumnClasses } from '../constants';

// =============================================================================
// Component
// =============================================================================

export function CardStats({
  stats,
  columns = 4,
  animationDelay = 1,
  className,
  testId,
}: VariantProps) {
  const { config: themeConfig } = usePageShellContext();
  const gridCols = gridColumnClasses[columns];

  return (
    <div
      className={cn(
        'grid gap-4',
        gridCols,
        'portal-animate-in',
        `portal-animate-in-delay-${animationDelay}`,
        className
      )}
      data-testid={testId}
    >
      {stats.map((stat, index) => {
        const Icon = resolveIcon(stat.icon);

        return (
          <Card key={`${stat.label}-${index}`} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">
                  {stat.prefix && (
                    <span className="text-muted-foreground mr-0.5">{stat.prefix}</span>
                  )}
                  {stat.value}
                  {stat.suffix && (
                    <span className="text-muted-foreground ml-0.5">{stat.suffix}</span>
                  )}
                </p>
                {stat.trend && (
                  <div className="mt-2">
                    <TrendIndicator trend={stat.trend} />
                  </div>
                )}
              </div>
              {Icon && (
                <div className="flex-shrink-0" style={{ color: themeConfig.primary }}>
                  <Icon className="h-8 w-8" />
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
