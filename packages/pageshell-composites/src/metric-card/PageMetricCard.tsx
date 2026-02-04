/**
 * PageMetricCard Component
 *
 * A flexible component for displaying key metrics, stats, and KPIs.
 * Supports multiple variants: card, compact, inline, and detailed.
 *
 * @module metric-card
 *
 * @example Basic usage
 * ```tsx
 * <PageMetricCard
 *   icon="cpu"
 *   label="Input Tokens"
 *   value="1.2M"
 *   sublabel="tokens"
 *   color="primary"
 * />
 * ```
 *
 * @example With trend indicator
 * ```tsx
 * <PageMetricCard
 *   icon="activity"
 *   label="Requests"
 *   value={1234}
 *   trend={{ direction: 'up', value: 12, label: 'vs last week' }}
 * />
 * ```
 *
 * @example Detailed variant with progress
 * ```tsx
 * <PageMetricCard
 *   variant="detailed"
 *   icon="check-circle"
 *   label="Course Completeness"
 *   value="85%"
 *   status="success"
 *   progress={85}
 *   items={[
 *     { label: 'Modules', value: 5 },
 *     { label: 'Lessons', value: '12/15' },
 *   ]}
 * />
 * ```
 */

'use client';

import * as React from 'react';
import type { PageMetricCardProps } from './types';
import {
  CardVariant,
  CompactVariant,
  InlineVariant,
  DetailedVariant,
  PageMetricCardSkeleton,
} from './components';

// =============================================================================
// Main Component
// =============================================================================

export function PageMetricCard(props: PageMetricCardProps) {
  const { variant = 'card', isLoading } = props;

  if (isLoading) {
    return (
      <PageMetricCardSkeleton
        variant={variant}
        size={props.size}
        showIcon={!!props.icon}
        showTrend={!!props.trend}
        showProgress={typeof props.progress === 'number'}
        className={props.className}
      />
    );
  }

  switch (variant) {
    case 'compact':
      return <CompactVariant {...props} />;
    case 'inline':
      return <InlineVariant {...props} />;
    case 'detailed':
      return <DetailedVariant {...props} />;
    default:
      return <CardVariant {...props} />;
  }
}

// Attach skeleton as static property
PageMetricCard.Skeleton = PageMetricCardSkeleton;
PageMetricCard.displayName = 'PageMetricCard';
