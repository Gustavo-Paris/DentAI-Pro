/**
 * CardFieldRenderer Component
 *
 * Renders field values based on FieldConfig.
 * Supports tags, badges, progress, skeletons, and custom renders.
 *
 * @module list/components/card/CardFieldRenderer
 * @see ADR-0058 - ListPageCard Feature Evolution
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import {
  StatusBadge,
  Badge,
  Progress,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@pageshell/primitives';
import type { FieldConfig, CardSlot } from '../../../shared/types';
import {
  getNestedValue,
  resolveEnumOption,
  mapStatusToVariant,
  formatFieldValue,
  inferSkeletonVariant,
  renderFieldSkeleton,
} from './helpers';

// =============================================================================
// Types
// =============================================================================

export interface CardFieldRendererProps<TRow = Record<string, unknown>> {
  /** Row data */
  item: TRow;
  /** Field configuration */
  field: FieldConfig<TRow>;
  /** Card slot being rendered */
  slot: CardSlot;
}

// =============================================================================
// Component
// =============================================================================

export function CardFieldRenderer<TRow = Record<string, unknown>>({
  item,
  field,
  slot,
}: CardFieldRendererProps<TRow>): React.ReactNode {
  const value = getNestedValue(item, field.key);

  // ADR-0058: Check skeleton condition first
  if (field.showSkeletonWhen?.(item)) {
    return renderFieldSkeleton(inferSkeletonVariant(field));
  }

  // Custom render
  if (field.renderCard) {
    return field.renderCard(item, value) as React.ReactNode;
  }
  if (field.render) {
    return field.render(item, value) as React.ReactNode;
  }

  // ADR-0058: Tags with overflow
  if (field.valueType === 'tags' && field.cardConfig?.tagsOverflow) {
    const { maxVisible, showTooltip = true } = field.cardConfig.tagsOverflow;
    const tags = Array.isArray(value) ? value : [];
    const visibleTags = tags.slice(0, maxVisible);
    const hiddenTags = tags.slice(maxVisible);

    if (tags.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1.5">
        {visibleTags.map((tag: string) => (
          <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
            {tag}
          </Badge>
        ))}
        {hiddenTags.length > 0 && (
          showTooltip ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs px-2 py-0.5 cursor-help">
                    +{hiddenTags.length}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{hiddenTags.join(', ')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              +{hiddenTags.length}
            </Badge>
          )
        )}
      </div>
    );
  }

  // ADR-0058: Badge with custom style
  if (field.valueType === 'badge' && field.cardConfig?.badgeStyle) {
    const customStyle = field.cardConfig.badgeStyle(value, item);
    const enumOption = resolveEnumOption(value, field);
    const text = enumOption?.text ?? (value != null ? String(value) : '-');

    if (customStyle) {
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-sm font-medium',
            customStyle.bgClass,
            customStyle.borderClass
          )}
        >
          {customStyle.icon && <span>{customStyle.icon}</span>}
          <span className={customStyle.textClass}>{text}</span>
        </span>
      );
    }
  }

  // Badge rendering (default StatusBadge)
  if (field.valueType === 'badge' && field.valueEnum) {
    const enumOption = resolveEnumOption(value, field);
    if (enumOption) {
      return (
        <StatusBadge
          variant={mapStatusToVariant(enumOption.status)}
          size="sm"
        >
          {enumOption.text}
        </StatusBadge>
      );
    }
  }

  // ADR-0059: Progress bar rendering
  if (field.valueType === 'progress') {
    const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
    const progressConfig = field.cardConfig?.progress ?? {};
    const { showLabel = true, label, showValue = true, size = 'sm' } = progressConfig;

    const heightClass = {
      xs: 'h-1',
      sm: 'h-1.5',
      md: 'h-2',
    }[size];

    return (
      <div className="space-y-1.5 w-full">
        {(showLabel || showValue) && (
          <div className="flex items-center justify-between text-sm">
            {showLabel && (
              <span className="text-muted-foreground">{label ?? field.label}</span>
            )}
            {showValue && (
              <span className="font-medium">{Math.round(numValue)}%</span>
            )}
          </div>
        )}
        <Progress value={numValue} className={heightClass} />
      </div>
    );
  }

  // Default formatting
  return formatFieldValue(value, field);
}

CardFieldRenderer.displayName = 'CardFieldRenderer';

// =============================================================================
// Helper function for use in ListPageCard
// =============================================================================

/**
 * Render field value with ADR-0058 features
 * Function version for backward compatibility
 */
export function renderCardFieldValue<TRow = Record<string, unknown>>(
  item: TRow,
  field: FieldConfig<TRow>,
  slot: CardSlot
): React.ReactNode {
  return <CardFieldRenderer item={item} field={field} slot={slot} />;
}
