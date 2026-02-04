'use client';

/**
 * PageShellWizard Component
 *
 * Main wizard shell for multi-step wizard flows.
 * Handles loading states, progress indicators, navigation, validation, and completion.
 *
 * @module wizard/PageShellWizard
 *
 * @example Basic usage
 * <PageShellWizard
 *   theme="student"
 *   currentStep={currentStep}
 *   totalSteps={6}
 *   stepLabels={['Welcome', 'Setup', 'Configure', ...]}
 *   title="Onboarding"
 *   description="Configure your environment"
 *   onBack={() => setStep(s => s - 1)}
 *   onNext={() => setStep(s => s + 1)}
 *   showProgress
 *   query={api.onboarding.getData.useQuery()}
 *   skeleton={<WizardSkeleton />}
 * >
 *   {(data) => <StepContent step={currentStep} data={data} />}
 * </PageShellWizard>
 *
 * @example With validation
 * <PageShellWizard
 *   theme="creator"
 *   currentStep={step}
 *   totalSteps={3}
 *   validateStep={async () => {
 *     const valid = await validateCurrentStep();
 *     return valid;
 *   }}
 *   validationError={error}
 *   onBack={() => setStep(s => s - 1)}
 *   onNext={() => setStep(s => s + 1)}
 *   ...
 * >
 *   {(data) => <StepContent />}
 * </PageShellWizard>
 */

import { useEffect, useCallback, useRef } from 'react';
import { cn } from '@pageshell/core';
import { logger } from '@repo/logger';
import { Card, CardContent, resolveIcon, QueryError } from '@pageshell/primitives';
import { AlertCircle } from 'lucide-react';
import {
  PageShellProvider,
  WizardStepProvider,
  usePageShellContext,
} from '@pageshell/theme';
import { WizardProgress } from './WizardProgress';
import { WizardNavigation } from './WizardNavigation';
import { WizardBackground } from './WizardBackground';
import { WIZARD_TRANSITION_CLASSES } from './constants';
import type { PageShellWizardProps } from './types';

// =============================================================================
// PageShellWizard Component
// =============================================================================

/**
 * PageShellWizardInner - Internal component
 *
 * Separated from outer component to avoid duplicate getThemeConfig calls.
 * Uses context to get config instead of calling getThemeConfig directly.
 */
function PageShellWizardInner<TData>({
  currentStep,
  totalSteps,
  stepLabels,
  steps,
  stepStatuses,
  title,
  description,
  icon,
  onBack,
  onNext,
  backLabel,
  nextLabel,
  showSkip,
  onSkip,
  skipLabel,
  backDisabled,
  nextDisabled,
  nextLoading,
  hideNavigation,
  // Validation
  validateStep,
  validationError,
  // Completion
  onComplete,
  isCompleting,
  completeLabel = 'Concluir',
  // Jump navigation
  allowJumpToStep = false,
  onJumpToStep,
  // Keyboard
  enableKeyboardNav = false,
  // Scroll
  scrollToTop = false,
  // Transition
  transitionDirection = 'none',
  // Progress
  showProgress = true,
  progressVariant = 'steps',
  showStepCount = true,
  // Background
  background = 'none',
  // Data
  query,
  skeleton,
  // Content
  children,
  className,
  contentClassName,
}: Omit<PageShellWizardProps<TData>, 'theme'>) {
  // Use context to get config (instead of calling getThemeConfig directly)
  const { theme, config } = usePageShellContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const prevStepRef = useRef(currentStep);

  // Theme-specific class prefixes
  const themePrefix = theme === 'student' ? 'dash' : theme;

  // Resolve icon from string variant
  const Icon = resolveIcon(icon);

  // Derive step labels from steps config if provided
  const labels = stepLabels || steps?.map((s) => s.label);

  // Is this the final step?
  const isFinalStep = currentStep === totalSteps;

  // Scroll to top on step change
  useEffect(() => {
    if (scrollToTop && prevStepRef.current !== currentStep) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    prevStepRef.current = currentStep;
  }, [currentStep, scrollToTop]);

  // Handle next with validation
  const handleNext = useCallback(async () => {
    if (validateStep) {
      try {
        const isValid = await validateStep();
        if (!isValid) {
          return;
        }
      } catch (error) {
        logger.error('Wizard validation error', { error });
        return;
      }
    }

    if (isFinalStep && onComplete) {
      await onComplete();
    } else if (onNext) {
      onNext();
    }
  }, [validateStep, isFinalStep, onComplete, onNext]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (onBack && currentStep > 1) {
      onBack();
    }
  }, [onBack, currentStep]);

  // Handle jump to step
  const handleJumpToStep = useCallback(
    (targetStep: number) => {
      if (!allowJumpToStep || !onJumpToStep) return;
      // Only allow jumping to completed steps or previous steps
      if (targetStep < currentStep || stepStatuses?.[targetStep - 1] === 'complete') {
        onJumpToStep(targetStep);
      }
    },
    [allowJumpToStep, onJumpToStep, currentStep, stepStatuses]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboardNav) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          if (!nextDisabled && !nextLoading && !isCompleting) {
            e.preventDefault();
            handleNext();
          }
          break;
        case 'ArrowLeft':
          if (!backDisabled && currentStep > 1) {
            e.preventDefault();
            handleBack();
          }
          break;
        case 'Escape':
          // Could trigger a cancel/exit confirmation
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    enableKeyboardNav,
    nextDisabled,
    nextLoading,
    isCompleting,
    backDisabled,
    currentStep,
    handleNext,
    handleBack,
  ]);

  // Loading state (when query is provided)
  if (query?.isLoading) {
    return (
      <div className={cn(`${themePrefix}-theme`, 'min-h-screen', className)}>
        <WizardBackground variant={background} theme={theme} />
        <div className={cn(config.container, 'py-8 relative z-10')}>
          {skeleton}
        </div>
      </div>
    );
  }

  // Error state (when query is provided)
  if (query?.error) {
    return (
      <div className={cn(`${themePrefix}-theme`, 'min-h-screen', className)}>
        <WizardBackground variant={background} theme={theme} />
        <div className={cn(config.container, 'py-8 relative z-10 space-y-6')}>
          {/* Header */}
          <div className={`${themePrefix}-page-header`}>
            {Icon && (
              <div className={`${themePrefix}-page-header-icon`}>
                <Icon className="w-6 h-6" />
              </div>
            )}
            <div>
              <h1 className={cn(config.heading, config.headingLg)}>{title}</h1>
              {description && (
                <p style={{ color: config.textMuted }} className="mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>

          <Card className={cn('p-5', config.animate)}>
            <CardContent>
              <QueryError error={query.error} retry={query.refetch} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Determine content to render
  const renderContent = () => {
    if (typeof children === 'function') {
      // If query is provided, pass its data
      if (query?.data) {
        return children(query.data);
      }
      // If no query but function children, this is a programming error
      return null;
    }
    // Static children
    return children;
  };

  return (
    <div
      ref={containerRef}
      className={cn(`${themePrefix}-theme`, 'min-h-screen', className)}
    >
        <WizardBackground variant={background} theme={theme} />

        <div className={cn(config.container, 'py-8 relative z-10 space-y-6')}>
          {/* Header */}
          <div className={cn(`${themePrefix}-page-header`, config.animate)}>
            {Icon && (
              <div className={`${themePrefix}-page-header-icon`}>
                <Icon className="w-6 h-6" />
              </div>
            )}
            <div>
              <h1 className={cn(config.heading, config.headingLg)}>{title}</h1>
              {description && (
                <p style={{ color: config.textMuted }} className="mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          {showProgress && (
            <div
              className={cn(
                `${themePrefix}-section-card`,
                config.animate,
                config.animateDelay(1)
              )}
            >
              <WizardProgress
                currentStep={currentStep}
                totalSteps={totalSteps}
                stepLabels={labels}
                steps={steps}
                stepStatuses={stepStatuses}
                variant={progressVariant}
                allowJump={allowJumpToStep}
                onJumpToStep={handleJumpToStep}
                showStepCount={showStepCount}
              />
            </div>
          )}

          {/* Validation Error Banner */}
          {validationError && (
            <div
              className={cn(
                'flex items-center gap-3 p-4 rounded-lg',
                'bg-destructive/10 text-destructive border border-destructive/20'
              )}
              role="alert"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">{validationError}</p>
            </div>
          )}

          {/* Step Content - key forces re-animation on step change */}
          <WizardStepProvider currentStep={currentStep} totalSteps={totalSteps}>
            <div
              key={`wizard-step-${currentStep}`}
              className={cn(
                `${themePrefix}-wizard-content`,
                config.animate,
                config.animateDelay(2),
                WIZARD_TRANSITION_CLASSES[transitionDirection],
                contentClassName
              )}
              role="region"
              aria-label={`Passo ${currentStep} de ${totalSteps}${labels?.[currentStep - 1] ? `: ${labels[currentStep - 1]}` : ''}`}
              aria-live="polite"
            >
              {renderContent()}
            </div>
          </WizardStepProvider>

          {/* Navigation */}
          {!hideNavigation && (onBack || onNext || onComplete) && (
            <div className={cn(config.animate, config.animateDelay(3))}>
              <WizardNavigation
                onBack={currentStep > 1 ? handleBack : undefined}
                onNext={!isFinalStep ? handleNext : undefined}
                onComplete={isFinalStep ? handleNext : undefined}
                onSkip={onSkip}
                backLabel={backLabel}
                nextLabel={nextLabel}
                skipLabel={skipLabel}
                completeLabel={completeLabel}
                showSkip={showSkip}
                backDisabled={backDisabled || currentStep <= 1}
                nextDisabled={nextDisabled}
                nextLoading={nextLoading}
                isFinalStep={isFinalStep}
                isCompleting={isCompleting}
                validationError={validationError}
              />
            </div>
          )}

          {/* Keyboard hints */}
          {enableKeyboardNav && (
            <div className="hidden sm:flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">
                  ←
                </kbd>{' '}
                Back
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">
                  →
                </kbd>{' '}
                or{' '}
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">
                  Enter
                </kbd>{' '}
                Next
              </span>
            </div>
          )}
        </div>
    </div>
  );
}

/**
 * PageShellWizard - Outer wrapper component
 *
 * Wraps PageShellWizardInner with PageShellProvider to provide theme context.
 * This pattern eliminates duplicate getThemeConfig calls.
 */
export function PageShellWizard<TData>(props: PageShellWizardProps<TData>) {
  const { theme, ...innerProps } = props;

  return (
    <PageShellProvider theme={theme}>
      <PageShellWizardInner {...innerProps} />
    </PageShellProvider>
  );
}

PageShellWizard.displayName = 'PageShellWizard';
