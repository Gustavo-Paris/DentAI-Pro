/**
 * ProgressiveExtractionPage Extraction Phase
 *
 * Extraction phase component with progressive field rendering.
 *
 * @module progressive-extraction/components/ExtractionPhase
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { Button, Label, resolveIcon } from '@pageshell/primitives';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

import type {
  ExtractionPhaseConfig,
  ExtractionField,
  ExtractionFieldVariant,
  ProgressiveExtractionPageSlots,
} from '../types';
import {
  progressiveExtractionPageDefaults,
  inferVariant,
  inferSkeletonSize,
  getNestedValue,
} from '../utils';
import { FieldSkeleton, TagsSkeleton } from './ProgressiveExtractionSkeletons';

// =============================================================================
// Types
// =============================================================================

export interface ExtractionPhaseProps<TData, TStatus> {
  /** Extraction phase configuration */
  config: ExtractionPhaseConfig<TData, TStatus>;
  /** Callback when user goes back */
  onBack: () => void;
  /** Optional slots */
  slots?: ProgressiveExtractionPageSlots;
}

// =============================================================================
// Field Content Renderer
// =============================================================================

function renderFieldContent<TData>(
  data: TData,
  field: ExtractionField<TData>,
  variant: ExtractionFieldVariant
): React.ReactNode {
  // Custom render takes precedence
  if (field.render) {
    return field.render(data);
  }

  const value = getNestedValue(data, field.key);
  const emptyText = field.emptyText ?? 'Não disponível';

  switch (variant) {
    case 'title':
      return value ? (
        <p className="text-lg font-medium">{String(value)}</p>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      );

    case 'text':
      return value ? (
        <p className="text-muted-foreground">{String(value)}</p>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      );

    case 'multiline':
      return value ? (
        <p className="text-muted-foreground whitespace-pre-line">
          {String(value)}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      );

    case 'tags':
      if (Array.isArray(value) && value.length > 0) {
        return (
          <div className="flex flex-wrap gap-2">
            {value.map((tag: string) => (
              <span key={tag} className="px-2 py-1 text-sm bg-muted rounded-md">
                {tag}
              </span>
            ))}
          </div>
        );
      }
      return <p className="text-sm text-muted-foreground">{emptyText}</p>;

    case 'badges':
      if (Array.isArray(value) && value.length > 0) {
        return (
          <div className="flex flex-wrap gap-2">
            {value.map((item: string) => (
              <span
                key={item}
                className="px-2 py-1 text-sm bg-primary/10 text-primary rounded-md"
              >
                {item}
              </span>
            ))}
          </div>
        );
      }
      return <p className="text-sm text-muted-foreground">{emptyText}</p>;

    case 'score': {
      if (!field.scoreConfig) {
        return <p className="text-sm text-muted-foreground">{emptyText}</p>;
      }

      const scoreValue = String(value);
      const config = field.scoreConfig[scoreValue];

      if (!config) {
        return <p className="text-sm text-muted-foreground">{emptyText}</p>;
      }

      const reasoning = field.reasoningKey
        ? getNestedValue(data, field.reasoningKey)
        : null;

      const reasoningText = reasoning ? String(reasoning) : null;

      return (
        <div className={cn('p-4 rounded-lg border', config.bgClass)}>
          <div className={cn('font-medium', config.textClass)}>
            {config.icon} {config.label}
          </div>
          {reasoningText && (
            <p className="mt-2 text-sm text-muted-foreground">{reasoningText}</p>
          )}
        </div>
      );
    }

    case 'custom':
    default:
      return value ? (
        <p className="text-muted-foreground">{String(value)}</p>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      );
  }
}

// =============================================================================
// Component
// =============================================================================

export function ExtractionPhase<TData, TStatus>({
  config,
  onBack,
  slots,
}: ExtractionPhaseProps<TData, TStatus>) {
  const pollInterval =
    config.pollInterval ??
    progressiveExtractionPageDefaults.extractionPhase.pollInterval;
  const backToListLabel =
    config.backToListLabel ??
    progressiveExtractionPageDefaults.extractionPhase.backToListLabel;

  // Smart defaults for extraction status
  const statusKey =
    config.statusKey ??
    progressiveExtractionPageDefaults.extractionPhase.statusKey;
  const extractingStatuses = (config.extractingStatuses ??
    progressiveExtractionPageDefaults.extractionPhase
      .extractingStatuses) as TStatus[];
  const completeStatus = (config.completeStatus ??
    progressiveExtractionPageDefaults.extractionPhase
      .completeStatus) as TStatus;

  const data = config.query.data;
  const refetch = config.query.refetch;

  // Use custom functions if provided, otherwise use smart defaults
  const extractionStatus = config.getExtractionStatus
    ? config.getExtractionStatus(data)
    : data
      ? ((data as Record<string, unknown>)[statusKey] as TStatus)
      : undefined;

  const isExtracting = config.isExtracting
    ? config.isExtracting(extractionStatus)
    : extractionStatus !== undefined &&
      extractingStatuses.includes(extractionStatus);

  const isComplete = config.isComplete
    ? config.isComplete(extractionStatus)
    : extractionStatus === completeStatus;

  // Polling effect
  React.useEffect(() => {
    if (!isExtracting || !refetch) return;

    const interval = setInterval(() => {
      refetch();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [isExtracting, pollInterval, refetch]);

  // Get status label
  const statusLabel = React.useMemo(() => {
    if (!extractionStatus || !config.statusConfig) return null;
    const key = String(extractionStatus);
    return config.statusConfig[key]?.label ?? null;
  }, [extractionStatus, config.statusConfig]);

  // Memoized footer actions
  const renderedActions = React.useMemo(() => {
    // New API: footerActions array
    if (config.footerActions && config.footerActions.length > 0) {
      return config.footerActions.map((action, index) => {
        const Icon = resolveIcon(action.icon);
        const requiresComplete =
          action.requiresComplete ?? action.variant === 'primary';
        const isDisabled =
          action.disabled ||
          action.isLoading ||
          (requiresComplete && !isComplete);

        return (
          <Button
            key={index}
            variant={action.variant ?? 'outline'}
            className="h-11 flex-1 sm:flex-none"
            onClick={action.onClick}
            disabled={isDisabled}
          >
            {action.isLoading ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : Icon ? (
              <Icon className="size-4 mr-2" />
            ) : null}
            {action.isLoading ? 'Please wait...' : action.label}
          </Button>
        );
      });
    }

    // Legacy API: single completeAction
    if (config.completeAction && data) {
      const action = config.completeAction;
      const isPending = action.isLoading ?? false;
      const ActionIcon = resolveIcon(action.icon) ?? ArrowRight;

      return (
        <Button
          className="h-11 flex-1 sm:flex-none"
          onClick={() => action.onClick(data)}
          disabled={!isComplete || action.disabled || isPending}
        >
          {isPending ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <ActionIcon className="size-4 mr-2" />
          )}
          {isPending ? 'Criando...' : action.label}
        </Button>
      );
    }

    return null;
  }, [config.footerActions, config.completeAction, data, isComplete]);

  const stickyFooter = config.stickyFooter ?? false;

  const footerContent = (
    <div
      className={cn(
        'flex gap-3 pt-4 mt-auto border-t border-border',
        'flex-col sm:flex-row sm:justify-between',
        stickyFooter && [
          'fixed bottom-0 left-0 right-0 z-40',
          'bg-background/95 backdrop-blur-sm',
          'px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]',
          'border-t shadow-md',
          'sm:static sm:z-auto sm:bg-transparent sm:backdrop-blur-none',
          'sm:px-0 sm:pb-0 sm:shadow-none',
        ]
      )}
    >
      {/* Back button */}
      <Button variant="outline" className="h-11" onClick={onBack}>
        <ArrowLeft className="size-4 mr-2" />
        {backToListLabel}
      </Button>

      {/* Actions container */}
      <div className="flex gap-3 flex-col sm:flex-row">{renderedActions}</div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto flex flex-col flex-1 min-h-0">
      {/* Status indicator */}
      {statusLabel && isExtracting && (
        <div
          className="flex items-center gap-2 text-sm text-muted-foreground mb-4"
          role="status"
          aria-live="polite"
        >
          <span className="size-2 bg-primary rounded-full animate-pulse" aria-hidden="true" />
          {statusLabel}
        </div>
      )}

      {slots?.beforeFields}

      {/* Fields */}
      <div className="flex-1 space-y-6 overflow-y-auto">
        {config.fields.map((field) => {
          // Check visibility conditions
          if (field.showOnlyWhenComplete && !isComplete) return null;
          if (field.showWhen && data && !field.showWhen(data, isExtracting))
            return null;

          // Determine variant
          const variant =
            field.variant ?? (field.render ? 'custom' : inferVariant(field.key, field));
          const skeletonSize =
            field.skeletonSize ?? inferSkeletonSize(variant);
          const useTagsSkeleton = variant === 'tags' || variant === 'badges';

          return (
            <div key={field.key} className="space-y-2">
              <Label>{field.label}</Label>
              {data && !isExtracting ? (
                renderFieldContent(data, field, variant)
              ) : useTagsSkeleton ? (
                <TagsSkeleton />
              ) : (
                <FieldSkeleton size={skeletonSize} />
              )}
            </div>
          );
        })}
      </div>

      {slots?.afterFields}

      {/* Footer */}
      {slots?.footer ?? (
        <>
          {stickyFooter && (
            <div className="h-64 sm:hidden" aria-hidden="true" />
          )}
          {footerContent}
        </>
      )}
    </div>
  );
}

ExtractionPhase.displayName = 'ExtractionPhase';
