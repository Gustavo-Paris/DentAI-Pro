import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export interface UseWizardCreditsParams {
  getCreditCost: (operation: string) => number;
  creditsRemaining: number;
  navigate: (path: string) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manages the credit confirmation dialog state and low-credit warnings.
 *
 * Responsibilities:
 * - Credit confirmation promise-based flow (confirmCreditUse / handleCreditConfirm)
 * - Low-credit warning toast on mount
 */
export function useWizardCredits({
  getCreditCost,
  creditsRemaining,
  navigate,
}: UseWizardCreditsParams) {
  const { t } = useTranslation();

  const [creditConfirmData, setCreditConfirmData] = useState<{
    operation: string;
    operationLabel: string;
    cost: number;
    remaining: number;
  } | null>(null);

  const creditConfirmResolveRef = useRef<((confirmed: boolean) => void) | null>(null);
  const hasShownCreditWarningRef = useRef(false);

  // -------------------------------------------------------------------------
  // Credit confirmation
  // -------------------------------------------------------------------------

  const confirmCreditUse = useCallback(
    (operation: string, operationLabel: string, costOverride?: number): Promise<boolean> => {
      const cost = costOverride ?? getCreditCost(operation);
      return new Promise((resolve) => {
        creditConfirmResolveRef.current = resolve;
        setCreditConfirmData({ operation, operationLabel, cost, remaining: creditsRemaining });
      });
    },
    [getCreditCost, creditsRemaining],
  );

  const handleCreditConfirm = useCallback((confirmed: boolean) => {
    creditConfirmResolveRef.current?.(confirmed);
    creditConfirmResolveRef.current = null;
    setCreditConfirmData(null);
  }, []);

  // -------------------------------------------------------------------------
  // Low-credit warning on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (hasShownCreditWarningRef.current) return;

    const fullWorkflowCost = getCreditCost('case_analysis') + getCreditCost('dsd_simulation');
    if (creditsRemaining < fullWorkflowCost && creditsRemaining > 0) {
      hasShownCreditWarningRef.current = true;
      toast.warning(
        t('toasts.wizard.lowCreditsWarning', { remaining: creditsRemaining, required: fullWorkflowCost }),
        { duration: 6000, description: t('toasts.wizard.lowCreditsDescription') },
      );
    } else if (creditsRemaining === 0) {
      hasShownCreditWarningRef.current = true;
      toast.error(t('toasts.wizard.noCredits'), {
        description: t('toasts.wizard.noCreditsDescription'),
        action: { label: t('common.viewPlans'), onClick: () => navigate('/pricing') },
        duration: 8000,
      });
    }
  }, [creditsRemaining, getCreditCost, navigate, t]);

  return {
    creditConfirmData,
    confirmCreditUse,
    handleCreditConfirm,
  };
}
