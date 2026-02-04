/**
 * useWizardPageLogic Hook
 *
 * Extracted logic from EnhancedWizardPage for better separation of concerns.
 * Handles navigation, keyboard shortcuts, resumable progress, and AI chat.
 *
 * @module wizard/hooks/useWizardPageLogic
 */

'use client';

import * as React from 'react';
import {
  loadWizardProgress,
  saveWizardProgress,
  clearWizardProgress,
} from '../defaults';
import { interpolateHref, useWizardKeyboardNav } from '@pageshell/core';
import type {
  WizardAIChatConfig,
  WizardChatMessage,
  WizardEnhancedResumableConfig,
  WizardEnhancedSidePanelConfig,
} from '../enhanced-types';

export interface UseWizardPageLogicOptions<TData = unknown> {
  // Step configuration
  currentStep: number;
  totalSteps: number;
  // Navigation
  onBack?: () => void;
  onNext?: () => Promise<void> | void;
  onComplete?: () => Promise<void> | void;
  completionRedirect?: string;
  router?: { push: (url: string) => void };
  queryData?: TData;
  // Validation
  validateStep?: () => Promise<boolean> | boolean;
  // Features
  resumable?: WizardEnhancedResumableConfig<TData>;
  aiChat?: WizardAIChatConfig;
  sidePanel?: WizardEnhancedSidePanelConfig<TData>;
  // Behavior
  enableKeyboardNav?: boolean;
  scrollToTop?: boolean;
  allowJumpToStep?: boolean;
  onJumpToStep?: (step: number) => void;
  // Disabled states
  backDisabled?: boolean;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  isCompleting?: boolean;
}

export interface UseWizardPageLogicReturn {
  // State
  isFinalStep: boolean;
  // Navigation handlers
  handleNext: () => Promise<void>;
  handleBack: () => void;
  handleJumpToStep: (step: number) => void;
  // AI Chat
  showChat: boolean;
  chatMessages: WizardChatMessage[];
  chatTitle: string | undefined;
  chatDescription: string | undefined;
  chatPlaceholder: string | undefined;
  handleChatSend: (message: string) => Promise<void>;
  // Side Panel
  showSidePanel: boolean;
}

// =============================================================================
// Hook
// =============================================================================

export function useWizardPageLogic<TData = unknown>(
  options: UseWizardPageLogicOptions<TData>
): UseWizardPageLogicReturn {
  const {
    // Step configuration
    currentStep,
    totalSteps,
    // Navigation
    onBack,
    onNext,
    onComplete,
    completionRedirect,
    router,
    queryData,
    // Validation
    validateStep,
    // Features
    resumable,
    aiChat,
    sidePanel,
    // Behavior
    enableKeyboardNav = true,
    scrollToTop = true,
    allowJumpToStep = false,
    onJumpToStep,
    // Disabled states
    backDisabled = false,
    nextDisabled = false,
    nextLoading = false,
    isCompleting = false,
  } = options;

  const prevStepRef = React.useRef(currentStep);
  const hasResumedRef = React.useRef(false);

  const isFinalStep = currentStep === totalSteps;

  // ===========================================================================
  // Resumable Progress
  // ===========================================================================

  React.useEffect(() => {
    if (!resumable?.enabled || hasResumedRef.current) return;
    hasResumedRef.current = true;

    const stored = loadWizardProgress<Partial<TData>>(resumable.storageKey);
    if (stored && stored.step > 1) {
      if (stored.data && resumable.setData) {
        resumable.setData(stored.data);
      }
      if (resumable.onResume) {
        resumable.onResume(stored.step, stored.data || {});
      }
    }
  }, [resumable]);

  // Save progress on step change
  React.useEffect(() => {
    if (!resumable?.enabled) return;

    const data = resumable.saveData && resumable.getData ? resumable.getData() : undefined;
    saveWizardProgress(resumable.storageKey, currentStep, data);
  }, [currentStep, resumable]);

  // Scroll to top on step change
  React.useEffect(() => {
    if (scrollToTop && prevStepRef.current !== currentStep) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    prevStepRef.current = currentStep;
  }, [currentStep, scrollToTop]);

  // ===========================================================================
  // Navigation Handlers
  // ===========================================================================

  const handleNext = React.useCallback(async () => {
    if (validateStep) {
      try {
        const isValid = await validateStep();
        if (!isValid) return;
      } catch {
        return;
      }
    }

    if (isFinalStep && (onComplete || completionRedirect)) {
      if (onComplete) {
        await onComplete();
      }
      // Clear progress on complete
      if (resumable?.enabled) {
        clearWizardProgress(resumable.storageKey);
      }
      // Redirect with pattern interpolation using query data
      if (completionRedirect && router) {
        const resolvedHref = queryData
          ? interpolateHref(completionRedirect, queryData as Record<string, unknown>)
          : completionRedirect;
        router.push(resolvedHref);
      }
    } else if (onNext) {
      await onNext();
    }
  }, [validateStep, isFinalStep, onComplete, onNext, resumable, completionRedirect, queryData, router]);

  const handleBack = React.useCallback(() => {
    if (onBack && currentStep > 1) {
      onBack();
    }
  }, [onBack, currentStep]);

  const handleJumpToStep = React.useCallback(
    (targetStep: number) => {
      if (!allowJumpToStep || !onJumpToStep) return;
      if (targetStep < currentStep) {
        onJumpToStep(targetStep);
      }
    },
    [allowJumpToStep, onJumpToStep, currentStep]
  );

  // ===========================================================================
  // Keyboard Navigation (using shared hook from @pageshell/core)
  // ===========================================================================

  useWizardKeyboardNav({
    onNext: handleNext,
    onPrevious: handleBack,
    canGoNext: !nextDisabled && !nextLoading && !isCompleting,
    canGoPrevious: !backDisabled && currentStep > 1,
    enabled: enableKeyboardNav,
  });

  // ===========================================================================
  // AI Chat
  // ===========================================================================

  const showChat = aiChat?.enabled && (
    !aiChat.showInSteps || aiChat.showInSteps.includes(currentStep)
  );

  const chatMessages = showChat && aiChat ? aiChat.getMessages(currentStep) : [];
  const chatTitle = showChat && aiChat?.getTitle ? aiChat.getTitle(currentStep) : undefined;
  const chatDescription = showChat && aiChat?.getDescription ? aiChat.getDescription(currentStep) : undefined;
  const chatPlaceholder = showChat && aiChat?.getPlaceholder ? aiChat.getPlaceholder(currentStep) : undefined;

  const handleChatSend = React.useCallback(
    async (msg: string): Promise<void> => {
      if (aiChat?.onSendMessage) {
        await aiChat.onSendMessage(msg, currentStep);
      }
    },
    [aiChat, currentStep]
  );

  // ===========================================================================
  // Side Panel
  // ===========================================================================

  const showSidePanel = sidePanel?.enabled && (
    !sidePanel.showInSteps || sidePanel.showInSteps.includes(currentStep)
  );

  return {
    // State
    isFinalStep,
    // Navigation handlers
    handleNext,
    handleBack,
    handleJumpToStep,
    // AI Chat
    showChat: !!showChat,
    chatMessages,
    chatTitle,
    chatDescription,
    chatPlaceholder,
    handleChatSend,
    // Side Panel
    showSidePanel: !!showSidePanel,
  };
}
