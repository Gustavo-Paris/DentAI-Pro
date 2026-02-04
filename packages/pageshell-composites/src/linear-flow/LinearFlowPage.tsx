/**
 * LinearFlowPage Composite
 *
 * Multi-step linear workflow with progress tracking.
 * Framework-agnostic implementation.
 *
 * @module linear-flow/LinearFlowPage
 */

'use client';

import * as React from 'react';
import { cn } from '@pageshell/core';
import { Button, resolveIcon } from '@pageshell/primitives';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

import type { LinearFlowPageProps } from './types';
import { linearFlowPageDefaults } from './defaults';
import { getContainerClasses } from '../shared/styles';
import { inferStepStatuses } from './utils';
import {
  LinearFlowSkeleton,
  LinearFlowErrorState,
  StepProgress,
} from './components';

// =============================================================================
// LinearFlowPage Component
// =============================================================================

/**
 * Multi-step linear workflow with progress tracking.
 *
 * @example
 * ```tsx
 * <LinearFlowPage
 *   title="Checkout Process"
 *   steps={[
 *     { id: 'cart', label: 'Cart', icon: 'shopping-cart' },
 *     { id: 'shipping', label: 'Shipping', icon: 'truck' },
 *     { id: 'payment', label: 'Payment', icon: 'credit-card' },
 *     { id: 'confirm', label: 'Confirm', icon: 'check' },
 *   ]}
 *   currentStep="shipping"
 *   onStepClick={(stepId) => setCurrentStep(stepId)}
 *   allowStepNavigation={(stepId, current) => {
 *     const stepIndex = steps.findIndex(s => s.id === stepId);
 *     const currentIndex = steps.findIndex(s => s.id === current);
 *     return stepIndex < currentIndex;
 *   }}
 *   onNext={handleNext}
 *   onBack={handleBack}
 * >
 *   {(data) => <StepContent step={currentStep} data={data} />}
 * </LinearFlowPage>
 * ```
 */
function LinearFlowPageInner<TData = unknown>(
  props: LinearFlowPageProps<TData>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {
    // Base
    theme = linearFlowPageDefaults.theme,
    containerVariant = linearFlowPageDefaults.containerVariant,
    title,
    description,
    icon,
    label,
    className,
    // Steps
    steps,
    currentStep,
    onStepClick,
    allowStepNavigation = false,
    // Data
    query,
    emptyCheck,
    emptyState,
    // Navigation
    backHref,
    backLabel = 'Back',
    onBack,
    // Footer
    showFooter = true,
    onNext,
    nextLabel = 'Continue',
    nextLoading = false,
    nextDisabled = false,
    // Slots
    slots,
    // Skeleton
    skeleton,
    // Content
    children,
  } = props;

  // Resolve icon
  const Icon = resolveIcon(icon);

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [isNavigating, setIsNavigating] = React.useState(false);

  // ---------------------------------------------------------------------------
  // Steps with Status
  // ---------------------------------------------------------------------------

  const stepsWithStatus = React.useMemo(
    () => inferStepStatuses(steps, currentStep),
    [steps, currentStep]
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleBack = React.useCallback(() => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      window.location.href = backHref;
    }
  }, [onBack, backHref]);

  const handleNext = React.useCallback(async () => {
    if (!onNext) return;
    setIsNavigating(true);
    try {
      await onNext();
    } finally {
      setIsNavigating(false);
    }
  }, [onNext]);

  // ---------------------------------------------------------------------------
  // Container Classes
  // ---------------------------------------------------------------------------

  const classes = getContainerClasses(containerVariant);
  const containerClasses = containerVariant === 'shell' ? '' : 'max-w-4xl mx-auto';
  const cardContainerClasses = containerVariant === 'shell' ? '' : 'bg-card rounded-xl border border-border overflow-hidden';
  const headerSectionClasses = classes.header || 'p-4 sm:p-6 border-b border-border bg-muted/30';
  const contentSectionClasses = classes.content || 'p-4 sm:p-6 space-y-5 sm:space-y-6';

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (query?.isLoading) {
    return (
      <div ref={ref} className={cn(containerClasses, className)} data-theme={theme}>
        {skeleton ?? <LinearFlowSkeleton stepCount={steps.length} />}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------

  if (query?.error) {
    return (
      <div ref={ref} className={cn(containerClasses, 'space-y-8', className)} data-theme={theme}>
        {/* Header */}
        <div className="flex items-center gap-4">
          {backHref && (
            <>
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {backLabel}
              </Button>
              <div className="h-6 w-px bg-border" />
            </>
          )}
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              {label && (
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                  {label}
                </p>
              )}
              <h1 className="text-xl font-semibold">{title}</h1>
            </div>
          </div>
        </div>

        <LinearFlowErrorState error={query.error} retry={query.refetch} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty State
  // ---------------------------------------------------------------------------

  const data = query?.data;
  const isEmpty = emptyCheck && data ? emptyCheck(data) : false;

  if (isEmpty && emptyState) {
    return (
      <div ref={ref} className={cn(containerClasses, 'space-y-8', className)} data-theme={theme}>
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">{emptyState.description}</p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div ref={ref} className={cn(containerClasses, className)} data-theme={theme}>
      <div className={cardContainerClasses}>
        {/* Header Section */}
        <div className={headerSectionClasses}>
          <div className="flex items-center gap-4">
            {backHref && (
              <>
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {backLabel}
                </Button>
                <div className="h-6 w-px bg-border" />
              </>
            )}
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
              )}
              <div>
                {label && (
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                    {label}
                  </p>
                )}
                <h1 className="text-xl font-semibold">{title}</h1>
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Step Progress */}
          <div className="mt-6">
            {slots?.beforeProgress}
            {slots?.progress ? (
              typeof slots.progress === 'function' ? (
                slots.progress(stepsWithStatus, currentStep)
              ) : (
                slots.progress
              )
            ) : (
              <StepProgress
                steps={stepsWithStatus}
                currentStep={currentStep}
                onStepClick={onStepClick}
                allowNavigation={allowStepNavigation}
              />
            )}
            {slots?.afterProgress}
          </div>
        </div>

        {/* Content Section */}
        <div className={contentSectionClasses}>
          {/* Main Content */}
          {slots?.beforeContent}
          <div>{data && children(data)}</div>
          {slots?.afterContent}

          {/* Footer Navigation */}
          {slots?.footer
            ? slots.footer
            : showFooter && (onBack || backHref || onNext) && (
                <div className="flex items-center justify-between pt-6 border-t border-border">
                  {/* Back button */}
                  {onBack || backHref ? (
                    <Button variant="outline" onClick={handleBack}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      {backLabel}
                    </Button>
                  ) : (
                    <div />
                  )}

                  {/* Next button */}
                  {onNext && (
                    <Button
                      onClick={handleNext}
                      disabled={nextDisabled || isNavigating || nextLoading}
                    >
                      {nextLoading || isNavigating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Please wait...
                        </>
                      ) : (
                        <>
                          {nextLabel}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
        </div>
      </div>
    </div>
  );
}

// Type-safe forwardRef with generics
export const LinearFlowPage = React.forwardRef(LinearFlowPageInner) as <TData = unknown>(
  props: LinearFlowPageProps<TData> & { ref?: React.Ref<HTMLDivElement> }
) => React.ReactElement;

(LinearFlowPage as React.FC).displayName = 'LinearFlowPage';
