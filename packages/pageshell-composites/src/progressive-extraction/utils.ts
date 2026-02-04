/**
 * ProgressiveExtractionPage Utilities
 *
 * Constants and utility functions for ProgressiveExtractionPage.
 *
 * @module progressive-extraction/utils
 */

import { getNestedValue } from '@pageshell/core';
import type { ExtractionField, ExtractionFieldVariant } from './types';

// Re-export for backward compatibility
export { getNestedValue };

// =============================================================================
// Defaults
// =============================================================================

export const progressiveExtractionPageDefaults = {
  theme: 'creator' as const,
  containerVariant: 'shell' as const,
  inputPhase: {
    minLength: 10,
    submitLabel: 'Save and Extract',
    rows: 12,
  },
  extractionPhase: {
    pollInterval: 1000,
    backToListLabel: 'Back to List',
    statusKey: 'extractionStatus',
    extractingStatuses: ['pending', 'extracting', 'enriching'] as string[],
    completeStatus: 'complete' as string,
  },
};

// =============================================================================
// Field Utilities
// =============================================================================

/**
 * Infer variant from field key or config
 */
export function inferVariant<TData>(
  key: string,
  field: ExtractionField<TData>
): ExtractionFieldVariant {
  if (field.scoreConfig) return 'score';
  if (key === 'title') return 'title';
  if (key === 'tags' || key === 'keywords') return 'tags';
  if (key.includes('audience') || key.includes('Audience')) return 'badges';
  if (
    key.includes('Score') ||
    key.includes('score') ||
    key.includes('Rating') ||
    key.includes('rating')
  )
    return 'score';
  if (key === 'context' || key === 'description' || key === 'rawText')
    return 'multiline';
  return 'text';
}

/**
 * Infer skeleton size from variant
 */
export function inferSkeletonSize(
  variant: ExtractionFieldVariant
): 'sm' | 'md' | 'lg' | 'xl' {
  switch (variant) {
    case 'title':
      return 'sm';
    case 'text':
      return 'md';
    case 'multiline':
      return 'lg';
    case 'tags':
    case 'badges':
      return 'sm';
    case 'score':
      return 'lg';
    case 'custom':
    default:
      return 'md';
  }
}

