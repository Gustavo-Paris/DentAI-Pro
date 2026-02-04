import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFormLogic } from '../useFormLogic';

describe('useFormLogic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should have correct initial state with no options', () => {
      const { result } = renderHook(() => useFormLogic());

      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.isValid).toBe(true);
      expect(result.current.isDirty).toBe(false);
      expect(result.current.hasErrors).toBe(false);
      expect(result.current.errorMessages).toEqual([]);
      expect(result.current.autoSaveStatus).toBe('idle');
    });

    it('should use provided isSubmitting prop', () => {
      const { result } = renderHook(() => useFormLogic({ isSubmitting: true }));
      expect(result.current.isSubmitting).toBe(true);
    });

    it('should use provided isValid prop', () => {
      const { result } = renderHook(() => useFormLogic({ isValid: false }));
      expect(result.current.isValid).toBe(false);
    });

    it('should use provided isDirty prop', () => {
      const { result } = renderHook(() => useFormLogic({ isDirty: true }));
      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('formState integration', () => {
    it('should use formState.isSubmitting', () => {
      const { result } = renderHook(() =>
        useFormLogic({ formState: { isSubmitting: true } })
      );
      expect(result.current.isSubmitting).toBe(true);
    });

    it('should use formState.isValid', () => {
      const { result } = renderHook(() =>
        useFormLogic({ formState: { isValid: false } })
      );
      expect(result.current.isValid).toBe(false);
    });

    it('should use formState.isDirty', () => {
      const { result } = renderHook(() =>
        useFormLogic({ formState: { isDirty: true } })
      );
      expect(result.current.isDirty).toBe(true);
    });

    it('should extract errors from formState', () => {
      const { result } = renderHook(() =>
        useFormLogic({
          formState: {
            errors: {
              email: { message: 'Invalid email', type: 'pattern' },
            },
          },
        })
      );
      expect(result.current.hasErrors).toBe(true);
      expect(result.current.errorMessages).toHaveLength(1);
      expect(result.current.errorMessages[0]).toMatchObject({
        field: 'email',
      });
    });

    it('should prioritize props over formState', () => {
      const { result } = renderHook(() =>
        useFormLogic({
          formState: { isSubmitting: false },
          isSubmitting: true,
        })
      );
      expect(result.current.isSubmitting).toBe(true);
    });
  });

  describe('markDirty and markClean', () => {
    it('should mark form as dirty', () => {
      const { result } = renderHook(() => useFormLogic());

      act(() => {
        result.current.markDirty();
      });

      expect(result.current.isDirty).toBe(true);
    });

    it('should mark form as clean', () => {
      const { result } = renderHook(() => useFormLogic());

      act(() => {
        result.current.markDirty();
      });
      expect(result.current.isDirty).toBe(true);

      act(() => {
        result.current.markClean();
      });
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('submit', () => {
    it('should call onSubmit', async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() => useFormLogic({ onSubmit }));

      await act(async () => {
        await result.current.submit();
      });

      expect(onSubmit).toHaveBeenCalled();
    });

    it('should set isSubmitting during submission', async () => {
      let resolveSubmit: () => void;
      const onSubmit = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveSubmit = resolve;
          })
      );
      const { result } = renderHook(() => useFormLogic({ onSubmit }));

      let submitPromise: Promise<void>;
      act(() => {
        submitPromise = result.current.submit();
      });

      // Check isSubmitting is true during submission
      expect(result.current.isSubmitting).toBe(true);

      await act(async () => {
        resolveSubmit!();
        await submitPromise;
      });

      expect(result.current.isSubmitting).toBe(false);
    });

    it('should call onSubmitSuccess after successful submit', async () => {
      const onSubmitSuccess = vi.fn();
      const { result } = renderHook(() =>
        useFormLogic({
          onSubmit: async () => {},
          onSubmitSuccess,
        })
      );

      await act(async () => {
        await result.current.submit();
      });

      expect(onSubmitSuccess).toHaveBeenCalled();
    });

    it('should call onSubmitError after failed submit', async () => {
      const error = new Error('Submit failed');
      const onSubmitError = vi.fn();
      const { result } = renderHook(() =>
        useFormLogic({
          onSubmit: async () => {
            throw error;
          },
          onSubmitError,
        })
      );

      await expect(
        act(async () => {
          await result.current.submit();
        })
      ).rejects.toThrow('Submit failed');

      expect(onSubmitError).toHaveBeenCalledWith(error);
    });

    it('should reset isDirty after successful submit', async () => {
      const { result } = renderHook(() =>
        useFormLogic({ onSubmit: async () => {} })
      );

      act(() => {
        result.current.markDirty();
      });
      expect(result.current.isDirty).toBe(true);

      await act(async () => {
        await result.current.submit();
      });

      expect(result.current.isDirty).toBe(false);
    });

    it('should do nothing if onSubmit is not provided', async () => {
      const { result } = renderHook(() => useFormLogic());

      await act(async () => {
        await result.current.submit();
      });

      // Should not throw
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset internal state', () => {
      const { result } = renderHook(() => useFormLogic());

      act(() => {
        result.current.markDirty();
      });
      expect(result.current.isDirty).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isDirty).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.autoSaveStatus).toBe('idle');
    });

    it('should call onReset callback', () => {
      const onReset = vi.fn();
      const { result } = renderHook(() => useFormLogic({ onReset }));

      act(() => {
        result.current.reset();
      });

      expect(onReset).toHaveBeenCalled();
    });
  });

  describe('navigation guard', () => {
    it('should have closed navigation guard initially', () => {
      const { result } = renderHook(() => useFormLogic());
      expect(result.current.navigationGuard.isOpen).toBe(false);
      expect(result.current.navigationGuard.pendingHref).toBeNull();
    });

    it('should open navigation guard when navigating with unsaved changes', () => {
      const { result } = renderHook(() =>
        useFormLogic({ warnOnUnsavedChanges: true, onNavigate: vi.fn() })
      );

      act(() => {
        result.current.markDirty();
      });

      act(() => {
        result.current.handleNavigate('/other-page');
      });

      expect(result.current.navigationGuard.isOpen).toBe(true);
      expect(result.current.navigationGuard.pendingHref).toBe('/other-page');
    });

    it('should navigate directly when not dirty', () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        useFormLogic({ warnOnUnsavedChanges: true, onNavigate })
      );

      act(() => {
        result.current.handleNavigate('/other-page');
      });

      expect(result.current.navigationGuard.isOpen).toBe(false);
      expect(onNavigate).toHaveBeenCalledWith('/other-page');
    });

    it('should navigate directly when warnOnUnsavedChanges is false', () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        useFormLogic({ warnOnUnsavedChanges: false, onNavigate })
      );

      act(() => {
        result.current.markDirty();
        result.current.handleNavigate('/other-page');
      });

      expect(result.current.navigationGuard.isOpen).toBe(false);
      expect(onNavigate).toHaveBeenCalledWith('/other-page');
    });

    it('should confirm navigation', () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        useFormLogic({ warnOnUnsavedChanges: true, onNavigate })
      );

      act(() => {
        result.current.markDirty();
        result.current.handleNavigate('/other-page');
      });

      act(() => {
        result.current.confirmNavigation();
      });

      expect(result.current.navigationGuard.isOpen).toBe(false);
      expect(onNavigate).toHaveBeenCalledWith('/other-page');
    });

    it('should cancel navigation', () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() =>
        useFormLogic({ warnOnUnsavedChanges: true, onNavigate, isDirty: true })
      );

      act(() => {
        result.current.handleNavigate('/other-page');
      });

      expect(result.current.navigationGuard.isOpen).toBe(true);

      act(() => {
        result.current.cancelNavigation();
      });

      expect(result.current.navigationGuard.isOpen).toBe(false);
      expect(result.current.navigationGuard.pendingHref).toBeNull();
      expect(onNavigate).not.toHaveBeenCalled();
    });
  });

  describe('auto-save', () => {
    it('should not auto-save when disabled', () => {
      const onAutoSave = vi.fn();
      renderHook(() =>
        useFormLogic({
          autoSave: { enabled: false, onAutoSave },
        })
      );

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(onAutoSave).not.toHaveBeenCalled();
    });

    it('should auto-save when dirty', async () => {
      const onAutoSave = vi.fn();
      const { result } = renderHook(() =>
        useFormLogic({
          autoSave: { enabled: true, onAutoSave, debounceMs: 1000 },
        })
      );

      act(() => {
        result.current.markDirty();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(onAutoSave).toHaveBeenCalled();
    });

    it('should set autoSaveStatus to saving during auto-save', async () => {
      let resolveAutoSave: () => void;
      const onAutoSave = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveAutoSave = resolve;
          })
      );

      const { result } = renderHook(() =>
        useFormLogic({
          autoSave: { enabled: true, onAutoSave, debounceMs: 1000 },
        })
      );

      act(() => {
        result.current.markDirty();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.autoSaveStatus).toBe('saving');

      await act(async () => {
        resolveAutoSave!();
      });

      expect(result.current.autoSaveStatus).toBe('saved');
    });

    it('should set autoSaveStatus to error on failure', async () => {
      const onAutoSave = vi.fn().mockRejectedValue(new Error('Save failed'));

      const { result } = renderHook(() =>
        useFormLogic({
          autoSave: { enabled: true, onAutoSave, debounceMs: 1000 },
        })
      );

      act(() => {
        result.current.markDirty();
      });

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.autoSaveStatus).toBe('error');
    });

    it('should use default debounce time', () => {
      const onAutoSave = vi.fn();
      const { result } = renderHook(() =>
        useFormLogic({
          autoSave: { enabled: true, onAutoSave },
        })
      );

      act(() => {
        result.current.markDirty();
      });

      act(() => {
        vi.advanceTimersByTime(1999);
      });
      expect(onAutoSave).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(onAutoSave).toHaveBeenCalled();
    });
  });

  describe('error formatting', () => {
    it('should format errors with default formatter', () => {
      const { result } = renderHook(() =>
        useFormLogic({
          formState: {
            errors: {
              firstName: { message: 'Required', type: 'required' },
            },
          },
        })
      );

      expect(result.current.errorMessages[0]!.message).toContain('First Name');
      expect(result.current.errorMessages[0]!.message).toContain('Required');
    });

    it('should use custom error formatter', () => {
      const formatError = (field: string, error: { message?: string }) =>
        `Error in ${field}: ${error.message}`;

      const { result } = renderHook(() =>
        useFormLogic({
          formState: {
            errors: {
              email: { message: 'Invalid' },
            },
          },
          formatError,
        })
      );

      expect(result.current.errorMessages[0]!.message).toBe('Error in email: Invalid');
    });

    it('should handle missing error message', () => {
      const { result } = renderHook(() =>
        useFormLogic({
          formState: {
            errors: {
              field: { type: 'required' },
            },
          },
        })
      );

      expect(result.current.errorMessages[0]!.message).toContain('Campo inválido');
    });
  });

  describe('formatError utility', () => {
    it('should expose formatError function', () => {
      const { result } = renderHook(() => useFormLogic());

      const formatted = result.current.formatError('userName', {
        message: 'Too short',
      });

      expect(formatted).toContain('User Name');
      expect(formatted).toContain('Too short');
    });
  });
});
