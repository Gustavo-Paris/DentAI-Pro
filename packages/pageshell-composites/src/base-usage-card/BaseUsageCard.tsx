'use client';

/**
 * BaseUsageCard Component
 *
 * Shared base component for Usage Analytics cards.
 * Provides consistent structure with header, empty state, and loading handling.
 *
 * @module base-usage-card
 */

import { cn } from '@pageshell/core';
import { Card } from '@pageshell/primitives';
import { UsageCardHeader } from './UsageCardHeader';
import { UsageCardEmpty } from './UsageCardEmpty';
import type { BaseUsageCardProps } from './types';

/**
 * Padding mappings
 */
const PADDING_CLASSES = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/**
 * BaseUsageCard - Container for usage analytics cards
 *
 * Provides:
 * - Card wrapper with optional gradient overlay
 * - Header with icon, title, subtitle, and optional right content
 * - Empty state handling
 * - Loading state handling
 *
 * Used by: UsageStatusCard, ProjectionCard, TopOperationsCard, LimitHistoryCard
 *
 * @example
 * ```tsx
 * <BaseUsageCard
 *   header={{
 *     icon: 'dollar-sign',
 *     title: 'Usage Status',
 *     subtitle: 'Monitor your daily and monthly usage',
 *   }}
 *   showGradient
 *   isEmpty={!hasData}
 *   emptyState={{
 *     icon: 'inbox',
 *     title: 'No usage data',
 *     description: 'Start using the API to see stats',
 *   }}
 * >
 *   <UsageChart data={usageData} />
 * </BaseUsageCard>
 * ```
 */
export function BaseUsageCard({
  header,
  children,
  className,
  showGradient = false,
  emptyState,
  isEmpty = false,
  loadingContent,
  isLoading = false,
  padding = 'md',
}: BaseUsageCardProps) {
  // Determine what content to render
  const renderContent = () => {
    if (isLoading && loadingContent) {
      return loadingContent;
    }
    if (isEmpty && emptyState) {
      return <UsageCardEmpty {...emptyState} />;
    }
    return children;
  };

  return (
    <Card className={cn('relative overflow-hidden', PADDING_CLASSES[padding], className)}>
      {/* Gradient overlay */}
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      )}

      {/* Content container */}
      <div className="relative">
        <UsageCardHeader {...header} />
        <div className="mt-4">{renderContent()}</div>
      </div>
    </Card>
  );
}

BaseUsageCard.displayName = 'BaseUsageCard';

// Attach sub-components
BaseUsageCard.Header = UsageCardHeader;
BaseUsageCard.Empty = UsageCardEmpty;
