/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks — must be declared before importing the hook
// ---------------------------------------------------------------------------

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// react-i18next is mocked globally in src/test/setup.ts.
// The global mock's useTranslation returns t: (key) => key which is sufficient.

import { toast } from 'sonner';
import { useWizardCredits } from '../domain/wizard/useWizardCredits';

// Typed reference to the mocked toast object
const mockToast = vi.mocked(toast);

// ---------------------------------------------------------------------------
// Default params
// ---------------------------------------------------------------------------

function makeParams(overrides: Partial<Parameters<typeof useWizardCredits>[0]> = {}) {
  return {
    getCreditCost: vi.fn((op: string) => (op === 'case_analysis' ? 3 : 2)),
    creditsRemaining: 100,
    navigate: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Basic structure
// ---------------------------------------------------------------------------

describe('useWizardCredits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('return value', () => {
    it('returns creditConfirmData, confirmCreditUse and handleCreditConfirm', () => {
      const { result } = renderHook(() => useWizardCredits(makeParams()));

      expect(result.current.creditConfirmData).toBeNull();
      expect(typeof result.current.confirmCreditUse).toBe('function');
      expect(typeof result.current.handleCreditConfirm).toBe('function');
    });
  });

  // -------------------------------------------------------------------------
  // Credit confirmation dialog
  // -------------------------------------------------------------------------

  describe('confirmCreditUse', () => {
    it('sets creditConfirmData when called', async () => {
      const params = makeParams();
      const { result } = renderHook(() => useWizardCredits(params));

      act(() => {
        result.current.confirmCreditUse('case_analysis', 'Análise');
      });

      expect(result.current.creditConfirmData).toMatchObject({
        operation: 'case_analysis',
        operationLabel: 'Análise',
        cost: 3, // from getCreditCost mock
        remaining: 100,
      });
    });

    it('uses costOverride when provided', async () => {
      const params = makeParams();
      const { result } = renderHook(() => useWizardCredits(params));

      act(() => {
        result.current.confirmCreditUse('case_analysis', 'Análise', 99);
      });

      expect(result.current.creditConfirmData?.cost).toBe(99);
    });

    it('calls getCreditCost with the operation when no costOverride', () => {
      const params = makeParams();
      const { result } = renderHook(() => useWizardCredits(params));

      act(() => {
        result.current.confirmCreditUse('dsd_simulation', 'DSD');
      });

      expect(params.getCreditCost).toHaveBeenCalledWith('dsd_simulation');
    });

    it('returns a Promise that resolves with true when confirmed', async () => {
      const params = makeParams();
      const { result } = renderHook(() => useWizardCredits(params));

      let resolved: boolean | undefined;
      act(() => {
        result.current.confirmCreditUse('case_analysis', 'Análise').then((v) => {
          resolved = v;
        });
      });

      // Confirm
      act(() => {
        result.current.handleCreditConfirm(true);
      });

      await vi.waitFor(() => expect(resolved).toBe(true));
    });

    it('returns a Promise that resolves with false when cancelled', async () => {
      const params = makeParams();
      const { result } = renderHook(() => useWizardCredits(params));

      let resolved: boolean | undefined;
      act(() => {
        result.current.confirmCreditUse('case_analysis', 'Análise').then((v) => {
          resolved = v;
        });
      });

      act(() => {
        result.current.handleCreditConfirm(false);
      });

      await vi.waitFor(() => expect(resolved).toBe(false));
    });

    it('stores creditsRemaining in creditConfirmData', async () => {
      const params = makeParams({ creditsRemaining: 7 });
      const { result } = renderHook(() => useWizardCredits(params));

      act(() => {
        result.current.confirmCreditUse('case_analysis', 'Test');
      });

      expect(result.current.creditConfirmData?.remaining).toBe(7);
    });
  });

  // -------------------------------------------------------------------------
  // handleCreditConfirm
  // -------------------------------------------------------------------------

  describe('handleCreditConfirm', () => {
    it('clears creditConfirmData after confirm', async () => {
      const params = makeParams();
      const { result } = renderHook(() => useWizardCredits(params));

      act(() => {
        result.current.confirmCreditUse('case_analysis', 'Test');
      });

      expect(result.current.creditConfirmData).not.toBeNull();

      act(() => {
        result.current.handleCreditConfirm(true);
      });

      expect(result.current.creditConfirmData).toBeNull();
    });

    it('clears creditConfirmData after cancel', async () => {
      const params = makeParams();
      const { result } = renderHook(() => useWizardCredits(params));

      act(() => {
        result.current.confirmCreditUse('case_analysis', 'Test');
      });

      act(() => {
        result.current.handleCreditConfirm(false);
      });

      expect(result.current.creditConfirmData).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Low-credit warning on mount
  // -------------------------------------------------------------------------

  describe('low-credit warning toasts', () => {
    it('shows warning toast when credits are below full workflow cost', () => {
      // case_analysis = 3, dsd_simulation = 2 → fullWorkflowCost = 5
      // creditsRemaining = 4 → 4 < 5 → warning
      const params = makeParams({ creditsRemaining: 4 });
      renderHook(() => useWizardCredits(params));

      expect(mockToast.warning).toHaveBeenCalledTimes(1);
    });

    it('shows error toast when credits are zero', () => {
      const params = makeParams({ creditsRemaining: 0 });
      renderHook(() => useWizardCredits(params));

      expect(mockToast.error).toHaveBeenCalledTimes(1);
    });

    it('does not show any toast when credits are sufficient', () => {
      // case_analysis=3, dsd_simulation=2 → fullWorkflowCost=5
      // creditsRemaining=10 → 10 >= 5 → no toast
      const params = makeParams({ creditsRemaining: 10 });
      renderHook(() => useWizardCredits(params));

      expect(mockToast.warning).not.toHaveBeenCalled();
      expect(mockToast.error).not.toHaveBeenCalled();
    });

    it('does not show toast twice on re-render', () => {
      const params = makeParams({ creditsRemaining: 4 });
      const { rerender } = renderHook(() => useWizardCredits(params));

      rerender();
      rerender();

      expect(mockToast.warning).toHaveBeenCalledTimes(1);
    });

    it('zero-credit toast includes action with navigate to /pricing', () => {
      const navigate = vi.fn();
      renderHook(() => useWizardCredits(makeParams({ creditsRemaining: 0, navigate })));

      const call = mockToast.error.mock.calls[0];
      // The second argument has the action object
      const options = call[1] as any;
      expect(options?.action?.label).toBeDefined();

      // Trigger the action click
      options.action.onClick();
      expect(navigate).toHaveBeenCalledWith('/pricing');
    });

    it('warning toast receives remaining and required in translation params', () => {
      // This test validates the key is called with the right params.
      // The global mock t: (key, params) => `${key}:${JSON.stringify(params)}`
      const params = makeParams({ creditsRemaining: 4 });
      renderHook(() => useWizardCredits(params));

      const call = mockToast.warning.mock.calls[0];
      const message = call[0] as string;
      // The message should include the key with params encoded
      expect(message).toContain('toasts.wizard.lowCreditsWarning');
      expect(message).toContain('"remaining":4');
      expect(message).toContain('"required":5');
    });
  });
});
