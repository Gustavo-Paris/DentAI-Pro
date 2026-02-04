import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWizardLogic } from '../wizard';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useWizardLogic', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should start at step 1 by default', () => {
      const { result } = renderHook(() =>
        useWizardLogic({ totalSteps: 5 })
      );

      expect(result.current.currentStep).toBe(1);
      expect(result.current.totalSteps).toBe(5);
    });

    it('should use initialStep', () => {
      const { result } = renderHook(() =>
        useWizardLogic({ totalSteps: 5, initialStep: 3 })
      );

      expect(result.current.currentStep).toBe(3);
    });

    it('should have correct initial flags', () => {
      const { result } = renderHook(() =>
        useWizardLogic({ totalSteps: 3 })
      );

      expect(result.current.isFirstStep).toBe(true);
      expect(result.current.isFinalStep).toBe(false);
      expect(result.current.isValidating).toBe(false);
      expect(result.current.isNavigating).toBe(false);
      expect(result.current.validationError).toBeNull();
    });
  });

  describe('computed properties', () => {
    it('should identify first step', () => {
      const { result } = renderHook(() =>
        useWizardLogic({ totalSteps: 3 })
      );

      expect(result.current.isFirstStep).toBe(true);
    });

    it('should identify final step', () => {
      const { result } = renderHook(() =>
        useWizardLogic({ totalSteps: 3, initialStep: 3 })
      );

      expect(result.current.isFinalStep).toBe(true);
    });

    it('should calculate progress percent', () => {
      const { result } = renderHook(() =>
        useWizardLogic({ totalSteps: 4, initialStep: 2 })
      );

      expect(result.current.progressPercent).toBe(50);
    });

    it('should calculate 100% for final step', () => {
      const { result } = renderHook(() =>
        useWizardLogic({ totalSteps: 4, initialStep: 4 })
      );

      expect(result.current.progressPercent).toBe(100);
    });

    it('should handle canGoNext', () => {
      const { result } = renderHook(() =>
        useWizardLogic({ totalSteps: 3 })
      );

      expect(result.current.canGoNext).toBe(true);
    });

    it('should handle canGoBack', () => {
      const { result } = renderHook(() =>
        useWizardLogic({ totalSteps: 3 })
      );

      expect(result.current.canGoBack).toBe(false);

      act(() => {
        result.current.setStep(2);
      });

      expect(result.current.canGoBack).toBe(true);
    });

    it('should handle canSkip', () => {
      const { result: result1 } = renderHook(() =>
        useWizardLogic({ totalSteps: 3, canSkip: false })
      );
      expect(result1.current.canSkip).toBe(false);

      const { result: result2 } = renderHook(() =>
        useWizardLogic({ totalSteps: 3, canSkip: true })
      );
      expect(result2.current.canSkip).toBe(true);

      // Can't skip on final step
      const { result: result3 } = renderHook(() =>
        useWizardLogic({ totalSteps: 3, canSkip: true, initialStep: 3 })
      );
      expect(result3.current.canSkip).toBe(false);
    });
  });

  describe('navigation', () => {
    it('should go to next step', async () => {
      const onNext = vi.fn();
      const { result } = renderHook(() =>
        useWizardLogic({ totalSteps: 3, onNext })
      );

      await act(async () => {
        await result.current.goNext();
      });

      expect(result.current.currentStep).toBe(2);
      expect(onNext).toHaveBeenCalled();
    });

    it('should go back', () => {
      const onBack = vi.fn();
      const { result } = renderHook(() =>
        useWizardLogic({ totalSteps: 3, initialStep: 2, onBack })
      );

      act(() => {
        result.current.goBack();
      });

      expect(result.current.currentStep).toBe(1);
      expect(onBack).toHaveBeenCalled();
    });

    it('should not go back from first step', () => {
      const { result } = renderHook(() =>
        useWizardLogic({ totalSteps: 3 })
      );

      act(() => {
        result.current.goBack();
      });

      expect(result.current.currentStep).toBe(1);
    });

    it('should skip step', () => {
      const onSkip = vi.fn();
      const { result } = renderHook(() =>
        useWizardLogic({ totalSteps: 3, canSkip: true, onSkip })
      );

      act(() => {
        result.current.skip();
      });

      expect(result.current.currentStep).toBe(2);
      expect(onSkip).toHaveBeenCalled();
    });

    it('should call onComplete on final step', async () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useWizardLogic({ totalSteps: 2, initialStep: 2, onComplete })
      );

      await act(async () => {
        await result.current.goNext();
      });

      expect(onComplete).toHaveBeenCalled();
    });

    it('should set step directly', () => {
      const { result } = renderHook(() =>
        useWizardLogic({ totalSteps: 5 })
      );

      act(() => {
        result.current.setStep(4);
      });

      expect(result.current.currentStep).toBe(4);
    });

    it('should not set step outside bounds', () => {
      const { result } = renderHook(() =>
        useWizardLogic({ totalSteps: 3, initialStep: 2 })
      );

      act(() => {
        result.current.setStep(0);
      });
      expect(result.current.currentStep).toBe(2);

      act(() => {
        result.current.setStep(10);
      });
      expect(result.current.currentStep).toBe(2);
    });
  });

  describe('jumpToStep', () => {
    it('should jump to previous step when allowed', () => {
      const onJumpToStep = vi.fn();
      const { result } = renderHook(() =>
        useWizardLogic({
          totalSteps: 5,
          initialStep: 4,
          allowJumpToStep: true,
          onJumpToStep,
        })
      );

      act(() => {
        result.current.jumpToStep(2);
      });

      expect(result.current.currentStep).toBe(2);
      expect(onJumpToStep).toHaveBeenCalledWith(2);
    });

    it('should not jump when not allowed', () => {
      const { result } = renderHook(() =>
        useWizardLogic({
          totalSteps: 5,
          initialStep: 4,
          allowJumpToStep: false,
        })
      );

      act(() => {
        result.current.jumpToStep(2);
      });

      expect(result.current.currentStep).toBe(4);
    });

    it('should not jump to future steps', () => {
      const { result } = renderHook(() =>
        useWizardLogic({
          totalSteps: 5,
          initialStep: 2,
          allowJumpToStep: true,
        })
      );

      act(() => {
        result.current.jumpToStep(4);
      });

      expect(result.current.currentStep).toBe(2);
    });
  });

  describe('validation', () => {
    it('should validate before going next', async () => {
      const validateStep = vi.fn().mockResolvedValue(true);
      const { result } = renderHook(() =>
        useWizardLogic({ totalSteps: 3, validateStep })
      );

      await act(async () => {
        await result.current.goNext();
      });

      expect(validateStep).toHaveBeenCalledWith(1);
      expect(result.current.currentStep).toBe(2);
    });

    it('should block navigation on validation failure (boolean)', async () => {
      const validateStep = vi.fn().mockResolvedValue(false);
      const { result } = renderHook(() =>
        useWizardLogic({ totalSteps: 3, validateStep })
      );

      await act(async () => {
        await result.current.goNext();
      });

      expect(result.current.currentStep).toBe(1);
      expect(result.current.validationError).toBe('Validation failed');
    });

    it('should block navigation on validation failure (object)', async () => {
      const validateStep = vi.fn().mockResolvedValue({
        valid: false,
        error: 'Name is required',
      });
      const { result } = renderHook(() =>
        useWizardLogic({ totalSteps: 3, validateStep })
      );

      await act(async () => {
        await result.current.goNext();
      });

      expect(result.current.currentStep).toBe(1);
      expect(result.current.validationError).toBe('Name is required');
    });

    it('should handle validation exception', async () => {
      const validateStep = vi.fn().mockRejectedValue(new Error('Server error'));
      const { result } = renderHook(() =>
        useWizardLogic({ totalSteps: 3, validateStep })
      );

      await act(async () => {
        await result.current.goNext();
      });

      expect(result.current.currentStep).toBe(1);
      expect(result.current.validationError).toBe('Server error');
    });

    it('should clear validation error', async () => {
      const validateStep = vi.fn().mockResolvedValue(false);
      const { result } = renderHook(() =>
        useWizardLogic({ totalSteps: 3, validateStep })
      );

      await act(async () => {
        await result.current.goNext();
      });

      expect(result.current.validationError).toBe('Validation failed');

      act(() => {
        result.current.clearValidationError();
      });

      expect(result.current.validationError).toBeNull();
    });

    it('should clear validation error on goBack', async () => {
      const validateStep = vi.fn().mockResolvedValue(false);
      const { result } = renderHook(() =>
        useWizardLogic({ totalSteps: 3, initialStep: 2, validateStep })
      );

      await act(async () => {
        await result.current.goNext();
      });

      expect(result.current.validationError).toBe('Validation failed');

      act(() => {
        result.current.goBack();
      });

      expect(result.current.validationError).toBeNull();
    });
  });

  describe('isNavigating state', () => {
    it('should set isNavigating during async onNext', async () => {
      let resolveNext: () => void;
      const onNext = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveNext = resolve;
          })
      );

      const { result } = renderHook(() =>
        useWizardLogic({ totalSteps: 3, onNext })
      );

      // Start navigation and wait for it to begin (after validation microtask)
      let navigatePromise: Promise<void>;
      await act(async () => {
        navigatePromise = result.current.goNext();
        // Allow microtask for async validation to complete
        await Promise.resolve();
      });

      // Now isNavigating should be true (onNext is pending)
      expect(result.current.isNavigating).toBe(true);

      // Resolve the onNext promise
      await act(async () => {
        resolveNext!();
        await navigatePromise;
      });

      expect(result.current.isNavigating).toBe(false);
    });
  });

  describe('resumable progress', () => {
    it('should save progress to localStorage', () => {
      const { result } = renderHook(() =>
        useWizardLogic({
          totalSteps: 5,
          resumable: {
            enabled: true,
            storageKey: 'test-wizard',
          },
        })
      );

      act(() => {
        result.current.setStep(3);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(
        mockLocalStorage.setItem.mock.calls[mockLocalStorage.setItem.mock.calls.length - 1]![1]
      );
      expect(savedData.step).toBe(3);
    });

    it('should load progress from localStorage', () => {
      const stored = {
        step: 3,
        data: { name: 'Test' },
        timestamp: Date.now(),
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(stored));

      const onResume = vi.fn();
      const { result } = renderHook(() =>
        useWizardLogic({
          totalSteps: 5,
          resumable: {
            enabled: true,
            storageKey: 'test-wizard',
            onResume,
          },
        })
      );

      expect(result.current.currentStep).toBe(3);
      expect(onResume).toHaveBeenCalledWith(3, { name: 'Test' });
    });

    it('should not load expired progress', () => {
      const stored = {
        step: 3,
        data: {},
        timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(stored));

      const { result } = renderHook(() =>
        useWizardLogic({
          totalSteps: 5,
          resumable: {
            enabled: true,
            storageKey: 'test-wizard',
            expiryDays: 7,
          },
        })
      );

      expect(result.current.currentStep).toBe(1); // Falls back to default
    });

    it('should clear progress on complete', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() =>
        useWizardLogic({
          totalSteps: 2,
          initialStep: 2,
          onComplete: vi.fn(),
          resumable: {
            enabled: true,
            storageKey: 'test-wizard',
          },
        })
      );

      await act(async () => {
        await result.current.goNext();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-wizard');
    });

    it('should clear progress with clearProgress', () => {
      const { result } = renderHook(() =>
        useWizardLogic({
          totalSteps: 5,
          initialStep: 3,
          resumable: {
            enabled: true,
            storageKey: 'test-wizard',
          },
        })
      );

      act(() => {
        result.current.clearProgress();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-wizard');
      expect(result.current.currentStep).toBe(1);
    });
  });
});
