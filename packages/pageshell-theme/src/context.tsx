'use client';

/**
 * @pageshell/theme - Context
 *
 * Provides theme configuration to child components without prop drilling.
 *
 * @module context
 */

import {
  createContext,
  useContext,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { TooltipProvider } from '@pageshell/primitives';
import type {
  PageShellTheme,
  ThemeConfig,
  PageShellContextValue,
  PageShellProviderProps,
  WizardStepContextValue,
  WizardStepProviderProps,
} from './types';
import { getThemeConfig } from './theme-config';

// =============================================================================
// Constants
// =============================================================================

/** Maximum animation delay index (matches portal-animate-in-delay-8) */
const MAX_ANIMATION_DELAY = 8;

// =============================================================================
// PageShell Context
// =============================================================================

const PageShellContext = createContext<PageShellContextValue | null>(null);

/**
 * PageShell theme provider
 *
 * Automatically applies theme classes (ui-theme ui-theme-{theme}) to enable
 * CSS variable cascading for the selected theme.
 *
 * @example
 * ```tsx
 * <PageShellProvider theme="creator">
 *   <MyPage />
 * </PageShellProvider>
 * ```
 */
export function PageShellProvider({ theme, children }: PageShellProviderProps) {
  // Track animation delay counter with useRef to persist across renders
  const delayCounterRef = useRef(0);

  // Memoize config to avoid unnecessary re-renders
  const config = useMemo(() => getThemeConfig(theme), [theme]);

  // Stable callback for getting next delay
  const getNextDelay = useCallback(() => {
    const current = delayCounterRef.current;
    delayCounterRef.current = Math.min(current + 1, MAX_ANIMATION_DELAY);
    return current;
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<PageShellContextValue>(
    () => ({
      theme,
      config,
      currentDelay: delayCounterRef.current,
      getNextDelay,
    }),
    [theme, config, getNextDelay]
  );

  // Theme classes for CSS variable cascading
  const themeClasses = `ui-theme ui-theme-${theme}`;

  return (
    <PageShellContext.Provider value={value}>
      <TooltipProvider>
        <div className={themeClasses}>{children}</div>
      </TooltipProvider>
    </PageShellContext.Provider>
  );
}

/**
 * Hook to access PageShell theme context
 *
 * @throws Error if used outside of PageShellProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, config } = usePageShellContext();
 *   return <div className={config.animate}>...</div>;
 * }
 * ```
 */
export function usePageShellContext(): PageShellContextValue {
  const context = useContext(PageShellContext);

  if (!context) {
    throw new Error(
      'usePageShellContext must be used within a PageShellProvider. ' +
        'Wrap your component with <PageShellProvider theme="...">.'
    );
  }

  return context;
}

/**
 * Hook to access PageShell theme context (optional version)
 *
 * Returns null if used outside of PageShellProvider instead of throwing.
 * Useful for components that can work both inside and outside PageShell.
 *
 * @example
 * ```tsx
 * function FlexibleComponent() {
 *   const context = usePageShellContextOptional();
 *   const animateClass = context?.config.animate ?? 'animate-fade-in';
 *   return <div className={animateClass}>...</div>;
 * }
 * ```
 */
export function usePageShellContextOptional(): PageShellContextValue | null {
  return useContext(PageShellContext);
}

// =============================================================================
// Wizard Step Context
// =============================================================================

const WizardStepContext = createContext<WizardStepContextValue | null>(null);

/**
 * Wizard step provider
 *
 * Used internally by PageShell.Wizard to provide step context to children.
 */
export function WizardStepProvider({
  currentStep,
  totalSteps,
  children,
}: WizardStepProviderProps) {
  const value = useMemo(
    () => ({ currentStep, totalSteps }),
    [currentStep, totalSteps]
  );

  return (
    <WizardStepContext.Provider value={value}>
      {children}
    </WizardStepContext.Provider>
  );
}

/**
 * Hook to access wizard step context
 *
 * @returns Current step info or null if not in a wizard
 *
 * @example
 * ```tsx
 * function StepContent() {
 *   const wizard = useWizardStepContext();
 *   if (!wizard) return null;
 *   return <div>Step {wizard.currentStep} of {wizard.totalSteps}</div>;
 * }
 * ```
 */
export function useWizardStepContext(): WizardStepContextValue | null {
  return useContext(WizardStepContext);
}
