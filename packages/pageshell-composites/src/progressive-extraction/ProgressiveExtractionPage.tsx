/**
 * ProgressiveExtractionPage Composite
 *
 * Two-phase extraction flow for content creation with AI-powered extraction.
 * Framework-agnostic implementation.
 *
 * Features:
 * - Two-phase flow: Input → Extraction
 * - Progressive field rendering with skeletons
 * - Automatic polling during extraction
 * - Smart defaults for extraction status
 * - Field variants for automatic styling
 *
 * @module progressive-extraction/ProgressiveExtractionPage
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { Button } from '@pageshell/primitives';
import { ArrowLeft } from 'lucide-react';

import type { ProgressiveExtractionPageProps } from './types';
import { LoadingSkeleton, InputPhase, ExtractionPhase } from './components';
import { progressiveExtractionPageDefaults } from './utils';

// Re-export defaults for external use
export { progressiveExtractionPageDefaults };

// =============================================================================
// ProgressiveExtractionPage Component
// =============================================================================

function ProgressiveExtractionPageInner<TData, TStatus = string>(
  props: ProgressiveExtractionPageProps<TData, TStatus>,
  ref: React.ForwardedRef<HTMLElement>
) {
  const {
    // Base
    theme = progressiveExtractionPageDefaults.theme,
    containerVariant = progressiveExtractionPageDefaults.containerVariant,
    title,
    backHref,
    onBack,
    onCancel,
    className,
    // Phases
    inputPhase,
    extractionPhase,
    // Slots
    slots,
    // Entity
    entityId: externalEntityId,
    onEntityCreated,
  } = props;

  // Container classes based on variant
  const containerClasses = containerVariant === 'shell' ? '' : 'max-w-4xl mx-auto';

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [internalEntityId, setInternalEntityId] = React.useState<string | null>(
    null
  );
  const entityId = externalEntityId ?? internalEntityId;

  // Ref for focus management on phase transition
  const phaseContentRef = React.useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleInputComplete = React.useCallback(
    (id: string) => {
      setInternalEntityId(id);
      onEntityCreated?.(id);
    },
    [onEntityCreated]
  );

  const handleBack = React.useCallback(() => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      window.location.href = backHref;
    }
  }, [onBack, backHref]);

  // ---------------------------------------------------------------------------
  // Focus Management
  // ---------------------------------------------------------------------------

  // Focus the phase content when transitioning to extraction phase
  React.useEffect(() => {
    if (entityId && !extractionPhase.query.isLoading && phaseContentRef.current) {
      // Use requestAnimationFrame + short delay to ensure child components are rendered
      requestAnimationFrame(() => {
        setTimeout(() => {
          phaseContentRef.current?.focus();
        }, 50);
      });
    }
  }, [entityId, extractionPhase.query.isLoading]);

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (entityId && extractionPhase.query.isLoading) {
    return (
      <main
        ref={ref}
        className={cn('min-h-dvh md:min-h-screen flex flex-col', className)}
        data-theme={theme}
        aria-busy="true"
      >
        <div className={cn(containerClasses, 'w-full px-4 md:px-8 py-4 md:py-8 flex flex-col flex-1 min-h-0')}>
          <LoadingSkeleton />
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <main
      ref={ref}
      className={cn('min-h-dvh md:min-h-screen flex flex-col', className)}
      data-theme={theme}
    >
      <div className={cn(containerClasses, 'w-full px-4 md:px-8 py-4 md:py-8 flex flex-col flex-1 min-h-0')}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-muted-foreground/25" />
          <h1 className="text-lg md:text-xl font-semibold">{title}</h1>
        </div>

        {/* Phase Content */}
        <div
          ref={phaseContentRef}
          className="flex-1 flex flex-col min-h-0"
          tabIndex={-1}
        >
          {!entityId ? (
            <InputPhase
              config={inputPhase}
              onComplete={handleInputComplete}
              onCancel={onCancel}
              slots={slots}
            />
          ) : (
            <ExtractionPhase
              config={extractionPhase}
              onBack={handleBack}
              slots={slots}
            />
          )}
        </div>
      </div>
    </main>
  );
}

/**
 * ProgressiveExtractionPage with forwardRef support.
 * Generic types are preserved through the wrapper.
 */
export const ProgressiveExtractionPage = React.forwardRef(
  ProgressiveExtractionPageInner
) as <TData, TStatus = string>(
  props: ProgressiveExtractionPageProps<TData, TStatus> & {
    ref?: React.ForwardedRef<HTMLElement>;
  }
) => React.ReactElement | null;

(ProgressiveExtractionPage as React.FC).displayName = 'ProgressiveExtractionPage';
