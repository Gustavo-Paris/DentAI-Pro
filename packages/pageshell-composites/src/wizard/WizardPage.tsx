/**
 * WizardPage Composite
 *
 * Lightweight multi-step wizard with progress tracking and keyboard navigation.
 * Best suited for simple flows without complex form validation or AI integration.
 *
 * ## When to Use WizardPage
 *
 * - Simple onboarding flows
 * - Configuration wizards without complex forms
 * - Surveys or multi-step questionnaires
 * - No AI assistance needed
 * - Lightweight dependency footprint required
 *
 * ## When to Use EnhancedWizardPage Instead
 *
 * - AI-assisted creation flows (course creation)
 * - Complex forms with validation per step
 * - Need declarative field definitions
 * - Integrating with tRPC queries
 * - Theme context required
 *
 * ## Key Differences from EnhancedWizardPage
 *
 * | Feature | WizardPage | EnhancedWizardPage |
 * |---------|------------|-------------------|
 * | Step indexing | 0-based | 1-based |
 * | Form library | Optional | react-hook-form required |
 * | AI Chat | No | Yes |
 * | Declarative fields | No | Yes |
 * | Query integration | No | Yes |
 * | State management | Internal | Controlled |
 *
 * @example Simple wizard
 * ```tsx
 * <WizardPage
 *   steps={[
 *     { id: 'welcome', title: 'Welcome' },
 *     { id: 'preferences', title: 'Preferences' },
 *     { id: 'confirm', title: 'Confirm' },
 *   ]}
 *   onComplete={() => router.push('/dashboard')}
 * >
 *   {(step, goNext, goBack) => (
 *     <div>
 *       {step === 0 && <WelcomeStep onNext={goNext} />}
 *       {step === 1 && <PreferencesStep onNext={goNext} onBack={goBack} />}
 *       {step === 2 && <ConfirmStep onBack={goBack} />}
 *     </div>
 *   )}
 * </WizardPage>
 * ```
 *
 * @see EnhancedWizardPage for AI-powered, form-heavy wizards
 * @module wizard/WizardPage
 */

'use client';

import * as React from 'react';
import { cn, useWizardLogic, useHandlerMap } from '@pageshell/core';
import { Button } from '@pageshell/primitives';
import type { WizardPageProps, WizardSidePanelConfig } from './types';
import { resolveDescription } from '../shared/types';
import { WizardBackground } from './WizardBackground';
import { EnhancedWizardSidePanel } from './components';

// =============================================================================
// Step Indicator
// =============================================================================

interface StepIndicatorProps {
  steps: { id: string; title: string; optional?: boolean }[];
  currentStep: number;
  onStepClick?: (index: number) => void;
}

const StepIndicator = React.memo(function StepIndicator({
  steps,
  currentStep,
  onStepClick,
}: StepIndicatorProps) {
  // Memoize step click handlers to prevent unnecessary re-renders
  const { getHandler: getStepClickHandler } = useHandlerMap((index: number) => {
    const isCompleted = index < currentStep;
    if (isCompleted && onStepClick) {
      onStepClick(index);
    }
  });

  return (
    <nav aria-label="Wizard progress" className="mb-8">
      <ol className="flex items-center justify-between" role="list">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isClickable = isCompleted && onStepClick;

          return (
            <li key={step.id} className="flex-1 flex items-center">
              <button
                type="button"
                onClick={getStepClickHandler(index)}
                disabled={!isClickable}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'flex items-center',
                  isClickable && 'cursor-pointer',
                  !isClickable && !isActive && 'cursor-default'
                )}
              >
                <span
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isActive && 'bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary',
                    !isCompleted && !isActive && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span aria-hidden="true">{index + 1}</span>
                  )}
                  <span className="sr-only">
                    {isCompleted ? 'Completed: ' : isActive ? 'Current: ' : 'Upcoming: '}
                    Step {index + 1}, {step.title}
                    {step.optional && ' (optional)'}
                  </span>
                </span>
                <span className="ml-2 hidden sm:block" aria-hidden="true">
                  <span className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {step.title}
                  </span>
                  {step.optional && (
                    <span className="text-xs text-muted-foreground block">Optional</span>
                  )}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    'flex-1 h-px mx-4',
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
});

StepIndicator.displayName = 'StepIndicator';

// =============================================================================
// Wizard Page Component
// =============================================================================

function WizardPageInner<TValues extends Record<string, unknown> = Record<string, unknown>>(
  props: WizardPageProps<TValues>,
  ref: React.ForwardedRef<HTMLElement>
) {
  const {
    // Base
    theme = 'default',
    title,
    description,
    className,
    background = 'none',
    // Steps
    steps,
    currentStep: controlledStep,
    onStepChange,
    // Values
    values: controlledValues,
    onValuesChange,
    // Callbacks
    onComplete,
    onCancel,
    // Features
    resumable,
    keyboardNavigation = true,
    showKeyboardHints = true,
    scrollToTop = false,
    showStepIndicator = true,
    // Labels
    labels = {},
    // Side Panel
    sidePanel: sidePanelConfig,
    // Slots
    slots,
  } = props;

  const {
    next: nextLabel = 'Next',
    previous: previousLabel = 'Previous',
    complete: completeLabel = 'Complete',
    cancel: cancelLabel = 'Cancel',
  } = labels;

  const {
    skeleton,
    header: headerSlot,
    beforeProgress,
    stepIndicator: stepIndicatorSlot,
    betweenHeaderAndContent,
    beforeContent,
    afterContent,
    sidePanel,
    navigation: navigationSlot,
  } = slots ?? {};

  // Normalize resumable config
  const resumableConfig = React.useMemo(() => {
    if (!resumable) return undefined;
    if (typeof resumable === 'boolean') {
      return { enabled: true, storageKey: 'pageshell-wizard' };
    }
    return {
      enabled: true,
      storageKey: resumable.storageKey,
      getData: resumable.getData,
      setData: resumable.setData,
      onResume: resumable.onResume,
      expiryDays: resumable.expiryDays,
    };
  }, [resumable]);

  // Use hook for state management
  const wizardLogic = useWizardLogic({
    totalSteps: steps.length,
    initialStep: controlledStep !== undefined ? controlledStep + 1 : 1, // Hook uses 1-indexed
    resumable: resumableConfig,
    enableKeyboardNav: keyboardNavigation,
    scrollToTop,
  });

  // Controlled mode sync
  React.useEffect(() => {
    if (controlledStep !== undefined) {
      wizardLogic.setStep(controlledStep + 1); // Hook uses 1-indexed
    }
  }, [controlledStep]);

  // Notify on step change (convert to 0-indexed for external API)
  React.useEffect(() => {
    onStepChange?.(wizardLogic.currentStep - 1);
  }, [wizardLogic.currentStep, onStepChange]);

  // Current step index (0-indexed for internal use)
  const currentStepIndex = wizardLogic.currentStep - 1;

  // Internal values state
  const [internalValues, setInternalValues] = React.useState<TValues>({} as TValues);
  const values = controlledValues ?? internalValues;

  const handleValuesChange = React.useCallback((newValues: TValues) => {
    if (controlledValues) {
      onValuesChange?.(newValues);
    } else {
      setInternalValues(newValues);
    }
  }, [controlledValues, onValuesChange]);

  // Navigation handlers
  const handleNext = React.useCallback(async () => {
    const step = steps[currentStepIndex];
    if (step?.validate) {
      const isValid = await step.validate();
      if (!isValid) return;
    }

    if (wizardLogic.isFinalStep) {
      await onComplete?.(values);
    } else {
      wizardLogic.goNext();
    }
  }, [steps, currentStepIndex, wizardLogic, values, onComplete]);

  const handlePrevious = React.useCallback(() => {
    wizardLogic.goBack();
  }, [wizardLogic]);

  const currentStepConfig = React.useMemo(
    () => steps[currentStepIndex],
    [steps, currentStepIndex]
  );

  // Memoize step click handler for StepIndicator
  const handleStepClick = React.useCallback(
    (index: number) => {
      if (index < currentStepIndex) {
        wizardLogic.setStep(index + 1); // Convert to 1-indexed
      }
    },
    [currentStepIndex, wizardLogic]
  );

  // Generate announcement for screen readers
  const stepAnnouncement = React.useMemo(() => {
    const stepTitle = currentStepConfig?.title || `Step ${currentStepIndex + 1}`;
    return `Step ${currentStepIndex + 1} of ${steps.length}: ${stepTitle}`;
  }, [currentStepIndex, steps.length, currentStepConfig?.title]);

  // Determine if side panel should show for current step
  const shouldShowSidePanel = React.useMemo(() => {
    if (!sidePanelConfig?.enabled) return false;
    // If showInSteps is not specified or empty, show in all steps
    if (!sidePanelConfig.showInSteps || sidePanelConfig.showInSteps.length === 0) {
      return true;
    }
    return sidePanelConfig.showInSteps.includes(currentStepIndex);
  }, [sidePanelConfig, currentStepIndex]);

  // Check if we have any side panel content (either from slot or config)
  const hasSidePanel = sidePanel || shouldShowSidePanel;

  return (
    <>
      {/* Background */}
      <WizardBackground variant={background} />

      <main
        ref={ref}
        className={cn('relative z-10 flex flex-col', className)}
        data-theme={theme}
        aria-label={title}
      >
        {/* Header */}
        {headerSlot ?? (
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && <p className="text-muted-foreground mt-1">{resolveDescription(description)}</p>}
          </div>
        )}

        {/* Between Header and Content */}
        {betweenHeaderAndContent}

        {/* Screen reader announcement for step changes */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {stepAnnouncement}
        </div>

        {/* Before Progress */}
        {beforeProgress}

        {/* Step Indicator */}
        {showStepIndicator && (stepIndicatorSlot ?? (
          <StepIndicator
            steps={steps}
            currentStep={currentStepIndex}
            onStepClick={handleStepClick}
          />
        ))}

        {/* Before Content */}
        {beforeContent}

        {/* Main Content Area with optional Side Panel */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            flexDirection: hasSidePanel ? 'row' : undefined,
          }}
        >
          {/* Step Content */}
          <section
            aria-labelledby={`wizard-step-${currentStepIndex}-title`}
            style={{ flex: 1, minHeight: 300 }}
          >
            <h2 id={`wizard-step-${currentStepIndex}-title`} className="sr-only">
              {currentStepConfig?.title || `Step ${currentStepIndex + 1}`}
            </h2>
            {currentStepConfig?.children}
          </section>

          {/* Side Panel from slots (legacy) */}
          {sidePanel && !shouldShowSidePanel && (
            <aside style={{ minWidth: 280, maxWidth: 360 }}>
              {typeof sidePanel === 'function'
                ? sidePanel(currentStepIndex, values)
                : sidePanel}
            </aside>
          )}

          {/* Side Panel from config (new API) */}
          {shouldShowSidePanel && sidePanelConfig && (
            <EnhancedWizardSidePanel
              width={sidePanelConfig.width}
              title={sidePanelConfig.title}
              collapsible={sidePanelConfig.collapsible}
              defaultCollapsed={sidePanelConfig.defaultCollapsed}
            >
              {sidePanelConfig.render(currentStepIndex, values)}
            </EnhancedWizardSidePanel>
          )}
        </div>

        {/* After Content */}
        {afterContent}

        {/* Navigation */}
        {navigationSlot ?? (
          <nav className="pt-6 border-t mt-6">
            <div className="flex items-center justify-between">
              <div>
                {onCancel && (
                  <Button variant="ghost" onClick={onCancel}>
                    {cancelLabel}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!wizardLogic.isFirstStep && (
                  <Button variant="outline" onClick={handlePrevious}>
                    {previousLabel}
                  </Button>
                )}
                <Button onClick={handleNext}>
                  {wizardLogic.isFinalStep ? completeLabel : nextLabel}
                </Button>
              </div>
            </div>
            {keyboardNavigation && showKeyboardHints && (
              <div className="hidden sm:flex items-center justify-center gap-6 text-xs text-muted-foreground mt-4">
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">←</kbd>{' '}
                  {previousLabel}
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">→</kbd>{' '}
                  or{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Enter</kbd>{' '}
                  {nextLabel}
                </span>
              </div>
            )}
          </nav>
        )}
      </main>
    </>
  );
}

/**
 * Declarative wizard page composite.
 *
 * @example
 * ```tsx
 * <WizardPage
 *   title="Setup Wizard"
 *   steps={[
 *     { id: 'info', title: 'Information', children: <InfoStep /> },
 *     { id: 'config', title: 'Configuration', children: <ConfigStep /> },
 *     { id: 'review', title: 'Review', children: <ReviewStep /> },
 *   ]}
 *   onComplete={(values) => console.log('Complete!', values)}
 * />
 * ```
 */
export const WizardPage = React.forwardRef(WizardPageInner) as <
  TValues extends Record<string, unknown> = Record<string, unknown>
>(
  props: WizardPageProps<TValues> & { ref?: React.ForwardedRef<HTMLElement> }
) => React.ReactElement;

(WizardPage as React.FC).displayName = 'WizardPage';
