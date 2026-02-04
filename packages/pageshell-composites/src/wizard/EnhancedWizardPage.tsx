/**
 * EnhancedWizardPage Component
 *
 * Full-featured wizard composite for AI-powered, form-heavy creation flows.
 * Integrates react-hook-form, tRPC queries, AI chat, and theme context.
 *
 * ## When to Use EnhancedWizardPage
 *
 * - AI-assisted creation flows (course creation, brainstorms)
 * - Complex forms with validation per step
 * - Need declarative field definitions
 * - Integrating with tRPC queries
 * - Theme context required
 *
 * ## When to Use WizardPage Instead
 *
 * - Simple onboarding flows
 * - Configuration wizards without complex forms
 * - Surveys or multi-step questionnaires
 * - No AI assistance needed
 * - Lightweight dependency footprint required
 *
 * ## Key Features
 *
 * - **AI Chat Integration**: Step-aware chat panel for guidance
 * - **Declarative Fields**: Define form fields per step via config
 * - **Query Integration**: First-class tRPC/React Query support
 * - **Theme Context**: Inherits from PageShell theme provider
 * - **Side Panel**: Context/preview panel with collapse support
 * - **Keyboard Navigation**: Arrow keys and Enter for step navigation
 *
 * ## Key Differences from WizardPage
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
 * @example AI-powered course creation
 * ```tsx
 * <EnhancedWizardPage
 *   theme="creator"
 *   title="Create Course"
 *   currentStep={step}
 *   totalSteps={3}
 *   onStepChange={setStep}
 *   steps={[
 *     { id: 'identity', label: 'Identity', fields: [...] },
 *     { id: 'direction', label: 'Direction', fields: [...] },
 *     { id: 'review', label: 'Review' },
 *   ]}
 *   chat={{
 *     messages,
 *     onSendMessage: handleSend,
 *     placeholder: 'Ask the AI assistant...',
 *   }}
 *   form={form}
 *   onComplete={handleComplete}
 * />
 * ```
 *
 * @see WizardPage for simple, lightweight wizards
 * @module wizard/EnhancedWizardPage
 */

'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { FieldValues } from 'react-hook-form';
import { cn } from '@pageshell/core';
import { Button, QueryError, resolveIcon } from '@pageshell/primitives';
import { WizardProgress, WizardBackground, WizardSkeleton } from '@pageshell/interactions';
import type { EnhancedWizardPageProps } from './enhanced-types';
import { FormFieldsRenderer } from './FormFieldsRenderer';
import { enhancedWizardPageDefaults } from './defaults';
import { WizardChatPanel, EnhancedWizardSidePanel } from './components';
import { useWizardPageLogic } from './hooks';

// =============================================================================
// EnhancedWizardPage Component
// =============================================================================

export function EnhancedWizardPage<
  TData = unknown,
  TFieldValues extends FieldValues = FieldValues,
>(props: EnhancedWizardPageProps<TData, TFieldValues>) {
  const {
    // Base
    theme = enhancedWizardPageDefaults.theme,
    containerVariant = enhancedWizardPageDefaults.containerVariant,
    title,
    description,
    icon,
    background = enhancedWizardPageDefaults.background,
    className,
    router,

    // Step configuration
    currentStep,
    totalSteps,
    stepLabels,
    steps,
    allowJumpToStep = false,
    onJumpToStep,

    // Navigation
    onBack,
    onNext,
    onComplete,
    completionRedirect,
    backDisabled = false,
    nextDisabled = false,
    nextLoading = false,
    isCompleting = false,
    backLabel = enhancedWizardPageDefaults.backLabel,
    nextLabel = enhancedWizardPageDefaults.nextLabel,
    completeLabel = enhancedWizardPageDefaults.completeLabel,
    hideNavigation = false,
    showSkip = false,
    onSkip,
    skipLabel = enhancedWizardPageDefaults.skipLabel,

    // Progress
    showProgress = enhancedWizardPageDefaults.showProgress,
    progressVariant = enhancedWizardPageDefaults.progressVariant,
    showStepCount = enhancedWizardPageDefaults.showStepCount,

    // Data
    query,
    skeleton,

    // Enhanced Features
    aiChat,
    resumable,
    sidePanel,

    // Validation
    validateStep,
    validationError,

    // Keyboard
    enableKeyboardNav = enhancedWizardPageDefaults.enableKeyboardNav,
    scrollToTop = enhancedWizardPageDefaults.scrollToTop,

    // Slots
    slots,

    // Declarative Fields API
    form,
    fieldGap = 4,
    columnGap = 4,

    // Content
    children,
  } = props;

  // Derive step labels
  const labels = stepLabels || steps?.map((s) => s.label);

  // Resolve icon
  const IconComponent = icon ? (typeof icon === 'string' ? resolveIcon(icon) : icon) : null;

  // Map theme for WizardBackground (it doesn't support 'default')
  const backgroundTheme = theme === 'default' ? 'student' : theme;

  // Container classes based on variant
  const containerClasses = containerVariant === 'shell' ? '' : 'max-w-4xl mx-auto';

  // ==========================================================================
  // Wizard Logic Hook
  // ==========================================================================

  const wizardLogic = useWizardPageLogic({
    currentStep,
    totalSteps,
    onBack,
    onNext,
    onComplete,
    completionRedirect,
    router,
    queryData: query?.data as TData | undefined,
    validateStep,
    resumable,
    aiChat,
    sidePanel,
    enableKeyboardNav,
    scrollToTop,
    allowJumpToStep,
    onJumpToStep,
    backDisabled,
    nextDisabled,
    nextLoading,
    isCompleting,
  });

  const {
    isFinalStep,
    handleNext,
    handleBack,
    handleJumpToStep,
    showChat,
    chatMessages,
    chatTitle,
    chatDescription,
    chatPlaceholder,
    handleChatSend,
    showSidePanel,
  } = wizardLogic;

  // ==========================================================================
  // Loading State
  // ==========================================================================

  if (query?.isLoading) {
    return (
      <div className={cn('min-h-screen', className)} data-theme={theme}>
        <WizardBackground variant={background} theme={backgroundTheme} />
        <div className={cn('container mx-auto py-8 relative z-10', containerClasses)}>
          {skeleton || <WizardSkeleton steps={totalSteps} contentRows={4} />}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Error State
  // ==========================================================================

  if (query?.error) {
    return (
      <div className={cn('min-h-screen', className)} data-theme={theme}>
        <WizardBackground variant={background} theme={backgroundTheme} />
        <div className={cn('container mx-auto py-8 relative z-10 space-y-6', containerClasses)}>
          <div className="flex items-center gap-4">
            {IconComponent && (
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                <IconComponent className="w-6 h-6" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {description && (
                <p className="text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <QueryError
              error={query.error as Error}
              retry={query.refetch}
            />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // Content Render
  // ==========================================================================

  // Get current step config
  const currentStepConfig = steps?.find((s) => s.step === currentStep);

  const renderContent = () => {
    // If current step has declarative fields, render FormFieldsRenderer
    if (currentStepConfig?.fields && currentStepConfig.fields.length > 0 && form) {
      return (
        <FormFieldsRenderer
          fields={currentStepConfig.fields}
          form={form}
          layout={currentStepConfig.layout}
          gap={fieldGap}
          columnGap={columnGap}
        />
      );
    }

    // Fall back to children (render function or ReactNode)
    if (typeof children === 'function') {
      if (query?.data) {
        return children(query.data);
      }
      return null;
    }
    return children;
  };

  // ==========================================================================
  // Main Render
  // ==========================================================================

  return (
    <div className={cn('min-h-screen', className)} data-theme={theme}>
      <WizardBackground variant={background} theme={backgroundTheme} />

      <div className={cn('container mx-auto py-8 relative z-10 space-y-6', containerClasses)}>
        {/* Header */}
        <div className="flex items-center gap-4">
          {IconComponent && (
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
              <IconComponent className="w-6 h-6" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>

        {/* Before Progress Slot */}
        {slots?.beforeProgress}

        {/* Progress Indicator */}
        {showProgress && !slots?.progress && (
          <div className="rounded-xl border border-border bg-card p-4">
            <WizardProgress
              currentStep={currentStep}
              totalSteps={totalSteps}
              stepLabels={labels}
              steps={steps?.map((s, index) => ({
                id: index + 1,
                label: s.label,
                description: s.description,
                optional: s.optional,
              }))}
              variant={progressVariant}
              allowJump={allowJumpToStep}
              onJumpToStep={handleJumpToStep}
              showStepCount={showStepCount}
            />
          </div>
        )}

        {/* Custom Progress Slot */}
        {slots?.progress}

        {/* After Progress Slot */}
        {slots?.afterProgress}

        {/* Validation Error Banner */}
        {validationError && (
          <div
            className={cn(
              'flex items-center gap-3 p-4 rounded-lg',
              'bg-destructive/10 text-destructive border border-destructive/20'
            )}
            role="alert"
          >
            <p className="text-sm font-medium">{validationError}</p>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex gap-6">
          {/* Main Column */}
          <div className="flex-1 space-y-6">
            {/* Before Content Slot */}
            {slots?.beforeContent}

            {/* AI Chat Panel */}
            {showChat && aiChat && (
              <>
                <WizardChatPanel
                  messages={chatMessages}
                  onSend={handleChatSend}
                  isSending={aiChat.isSending || false}
                  title={chatTitle}
                  description={chatDescription}
                  placeholder={chatPlaceholder}
                />
                {slots?.betweenChatAndForm}
              </>
            )}

            {/* Step Content */}
            <div
              key={`wizard-step-${currentStep}`}
              role="region"
              aria-label={`Passo ${currentStep} de ${totalSteps}${labels?.[currentStep - 1] ? `: ${labels[currentStep - 1]}` : ''}`}
              aria-live="polite"
            >
              {renderContent()}
            </div>

            {/* After Content Slot */}
            {slots?.afterContent}
          </div>

          {/* Side Panel */}
          {showSidePanel && sidePanel && (
            <EnhancedWizardSidePanel
              title={sidePanel.title}
              width={sidePanel.width}
              collapsible={sidePanel.collapsible}
              defaultCollapsed={sidePanel.defaultCollapsed}
            >
              {sidePanel.render(currentStep, query?.data)}
            </EnhancedWizardSidePanel>
          )}

          {/* Side Panel Slot */}
          {slots?.sidePanel && (
            <div className="flex-shrink-0 w-80">
              {typeof slots.sidePanel === 'function'
                ? slots.sidePanel(currentStep, query?.data)
                : slots.sidePanel}
            </div>
          )}
        </div>

        {/* Navigation */}
        {!hideNavigation && !slots?.footer && (onBack || onNext || onComplete) && (
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              {currentStep > 1 && onBack && (
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={backDisabled}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  {backLabel}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {showSkip && onSkip && !isFinalStep && (
                <Button variant="ghost" onClick={onSkip}>
                  {skipLabel}
                </Button>
              )}

              {isFinalStep ? (
                <Button
                  onClick={handleNext}
                  disabled={nextDisabled || isCompleting}
                >
                  {isCompleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {completeLabel}
                </Button>
              ) : (
                onNext && (
                  <Button
                    onClick={handleNext}
                    disabled={nextDisabled || nextLoading}
                  >
                    {nextLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {nextLabel}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )
              )}
            </div>
          </div>
        )}

        {/* Custom Footer Slot */}
        {slots?.footer}

        {/* Keyboard Hints */}
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
