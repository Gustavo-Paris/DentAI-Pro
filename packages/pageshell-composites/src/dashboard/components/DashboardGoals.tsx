/**
 * DashboardGoals Component
 *
 * Renders a goals/milestones section with progress bars for DashboardPage.
 *
 * @module dashboard/components/DashboardGoals
 */

'use client';

import * as React from 'react';
import { resolveIcon } from '@pageshell/primitives';
import type { GoalsConfig, GoalConfig } from '../types';
import { resolveNestedValue } from '../../shared/utils/resolveNestedValue';

// =============================================================================
// Types
// =============================================================================

export interface DashboardGoalsProps {
  /** Goals configuration */
  config: GoalsConfig;
  /** Data object to resolve values from */
  data: Record<string, unknown> | undefined;
}

// =============================================================================
// Helper Functions
// =============================================================================

function getProgressVariantClass(variant: GoalConfig['variant']): string {
  switch (variant) {
    case 'secondary':
      return 'portal-progress-secondary';
    case 'streak':
      return 'portal-progress-streak';
    case 'accent':
      return 'portal-progress-accent';
    default:
      return '';
  }
}

function getValueColorClass(variant: GoalConfig['variant']): string {
  switch (variant) {
    case 'streak':
      return 'text-warning';
    case 'secondary':
      return 'text-secondary';
    case 'accent':
      return 'text-accent';
    default:
      return 'text-primary';
  }
}

// =============================================================================
// Component
// =============================================================================

/**
 * DashboardGoals renders a grid of goal cards with progress bars.
 * Resolves values from the provided data object using dot-notation keys.
 *
 * @example
 * ```tsx
 * <DashboardGoals
 *   config={{
 *     title: "Learning Goals",
 *     items: [
 *       { id: "weekly", title: "Weekly Hours", valueKey: "stats.totalHours", maxKey: "10" },
 *     ],
 *   }}
 *   data={queryData}
 * />
 * ```
 */
export function DashboardGoals({ config, data }: DashboardGoalsProps) {
  const { title, icon = 'target', items, columns } = config;

  // Resolve icon
  const IconComponent = resolveIcon(icon);

  // Build responsive grid classes
  const smCols = columns?.sm ?? 1;
  const mdCols = columns?.md ?? 3;
  const lgCols = columns?.lg ?? mdCols;

  const gridClasses = `grid gap-4 grid-cols-${smCols} md:grid-cols-${mdCols} lg:grid-cols-${lgCols}`;

  return (
    <div className="portal-section-card">
      {/* Header */}
      {title && (
        <h2 className="portal-heading portal-heading-sm mb-4 flex items-center gap-2">
          {IconComponent && <IconComponent className="w-5 h-5 text-info" />}
          {title}
        </h2>
      )}

      {/* Goals Grid */}
      <div className={gridClasses}>
        {items.map((goal, index) => {
          // Resolve values
          const value = resolveNestedValue<number>(data, goal.valueKey) ?? 0;
          const max = resolveNestedValue<number>(data, goal.maxKey ?? '0') ?? 0;

          // Calculate progress
          const progress = max > 0 ? Math.min((value / max) * 100, 100) : 0;
          const isComplete = max > 0 && value >= max;

          // Format display value
          const displayValue = goal.format
            ? goal.format(value, max)
            : max > 0
              ? `${value} / ${max}`
              : String(value);

          // Resolve status text
          const status =
            typeof goal.status === 'function'
              ? goal.status(value, max)
              : goal.status;

          return (
            <div
              key={goal.id}
              className={`portal-goal-card portal-goal-card-${goal.variant ?? 'primary'}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="portal-goal-header">
                <span className="portal-goal-title">{goal.title}</span>
                <span className={`portal-goal-value ${getValueColorClass(goal.variant)}`}>
                  {displayValue}
                </span>
              </div>
              <div
                className="portal-progress"
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={goal.title}
              >
                <div
                  className={`portal-progress-bar ${getProgressVariantClass(goal.variant)}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {status && (
                <span
                  className={`portal-goal-status ${isComplete ? 'portal-goal-status-success' : 'portal-goal-status-muted'}`}
                >
                  {status}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

DashboardGoals.displayName = 'DashboardGoals';
