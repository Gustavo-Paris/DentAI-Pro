'use client';

/**
 * WizardNavigation Component
 *
 * Navigation footer for wizard pages with back/next/skip/complete buttons.
 * Now supports completion state and validation error display.
 *
 * @module wizard/WizardNavigation
 *
 * @example Basic
 * <WizardNavigation
 *   onBack={() => setStep(s => s - 1)}
 *   onNext={() => setStep(s => s + 1)}
 * />
 *
 * @example Final step with completion
 * <WizardNavigation
 *   onBack={() => setStep(s => s - 1)}
 *   onComplete={handleComplete}
 *   isFinalStep
 *   isCompleting={isSubmitting}
 *   completeLabel="Finish"
 * />
 *
 * @example With validation error
 * <WizardNavigation
 *   onBack={() => setStep(s => s - 1)}
 *   onNext={() => setStep(s => s + 1)}
 *   validationError="Please fill in all required fields."
 * />
 */

import { cn } from '@pageshell/core';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  SkipForward,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@pageshell/primitives';
import { usePageShellContext } from '@pageshell/theme';
import type { WizardNavigationProps } from './types';

export function WizardNavigation({
  onBack,
  onNext,
  onSkip,
  onComplete,
  backLabel = 'Back',
  nextLabel = 'Continue',
  skipLabel = 'Skip',
  completeLabel = 'Complete',
  showSkip = false,
  backDisabled = false,
  nextDisabled = false,
  nextLoading = false,
  isFinalStep = false,
  isCompleting = false,
  validationError,
  className,
}: WizardNavigationProps) {
  const { theme, config } = usePageShellContext();

  // Theme-specific class prefixes
  const themePrefix = theme === 'student' ? 'dash' : theme;

  // Determine if we should show the complete button
  const showCompleteButton = isFinalStep && onComplete;
  const isLoading = nextLoading || isCompleting;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Validation error message (inline) */}
      {validationError && (
        <div
          className={cn(
            `${themePrefix}-section-card`,
            'flex items-center gap-3 p-3',
            'bg-destructive/5 border-destructive/20'
          )}
          role="alert"
        >
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{validationError}</p>
        </div>
      )}

      {/* Navigation buttons */}
      <div
        className={cn(
          `${themePrefix}-section-card`,
          'flex items-center justify-between p-4'
        )}
      >
        {/* Back button */}
        <div>
          {onBack && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={backDisabled || isLoading}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Button>
          )}
        </div>

        {/* Right side: Skip and Next/Complete */}
        <div className="flex items-center gap-3">
          {showSkip && onSkip && !isFinalStep && (
            <Button
              type="button"
              variant="ghost"
              onClick={onSkip}
              disabled={isLoading}
              className="gap-2"
              style={{ color: config.textMuted }}
            >
              {skipLabel}
              <SkipForward className="h-4 w-4" />
            </Button>
          )}

          {/* Next button (non-final steps) */}
          {onNext && !showCompleteButton && (
            <Button
              type="button"
              variant="default"
              onClick={onNext}
              disabled={nextDisabled || isLoading}
              className="gap-2"
            >
              {nextLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Aguarde...
                </>
              ) : (
                <>
                  {nextLabel}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          )}

          {/* Complete button (final step) */}
          {showCompleteButton && (
            <Button
              type="button"
              variant="default"
              onClick={onComplete}
              disabled={nextDisabled || isLoading}
              className={cn(
                'gap-2',
                !isCompleting && 'bg-emerald-600 hover:bg-emerald-700'
              )}
            >
              {isCompleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finalizando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {completeLabel}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
