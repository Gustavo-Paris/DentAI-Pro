/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReviewFormData, PhotoAnalysisResult, TreatmentType } from '@/types/wizard';
import type { DSDResult } from '@/types/dsd';
import type { AdditionalPhotos, WizardDraft } from '@/hooks/useWizardDraft';
import type { PatientPreferences } from '@/types/dsd';

import { useWizardAutoSave } from '../domain/wizard/useWizardAutoSave';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFormData(overrides: Partial<ReviewFormData> = {}): ReviewFormData {
  return {
    patientName: 'Test Patient',
    patientAge: '30',
    patientGender: 'masculino',
    tooth: '21',
    treatmentType: 'resina',
    notes: '',
    budgetLevel: 'standard',
    ...overrides,
  } as ReviewFormData;
}

function makePatientPreferences(): PatientPreferences {
  return {
    whitening_level: 'none',
    smile_style: 'natural',
  } as PatientPreferences;
}

function makeAdditionalPhotos(): AdditionalPhotos {
  return {} as AdditionalPhotos;
}

function makeParams(overrides: Partial<Parameters<typeof useWizardAutoSave>[0]> = {}) {
  return {
    step: 1,
    imageBase64: 'data:image/jpeg;base64,abc123',
    formData: makeFormData(),
    selectedTeeth: ['21'],
    toothTreatments: { '21': 'resina' as TreatmentType },
    analysisResult: null as PhotoAnalysisResult | null,
    dsdResult: null as DSDResult | null,
    uploadedPhotoPath: null as string | null,
    additionalPhotos: makeAdditionalPhotos(),
    patientPreferences: makePatientPreferences(),
    anamnesis: '',
    vitaShadeManuallySet: false,
    saveDraft: vi.fn(),
    userId: 'user-1',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useWizardAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Auto-save on state change (debounced 2s)
  // -------------------------------------------------------------------------

  describe('debounced auto-save', () => {
    it('does not call saveDraft immediately', () => {
      const saveDraft = vi.fn();
      renderHook(() => useWizardAutoSave(makeParams({ saveDraft, step: 1, imageBase64: 'img' })));

      expect(saveDraft).not.toHaveBeenCalled();
    });

    it('calls saveDraft after 2000ms debounce', () => {
      const saveDraft = vi.fn();
      renderHook(() => useWizardAutoSave(makeParams({ saveDraft, step: 1, imageBase64: 'img' })));

      act(() => { vi.advanceTimersByTime(2000); });

      expect(saveDraft).toHaveBeenCalledTimes(1);
    });

    it('does not call saveDraft before 2000ms has elapsed', () => {
      const saveDraft = vi.fn();
      renderHook(() => useWizardAutoSave(makeParams({ saveDraft, step: 1, imageBase64: 'img' })));

      act(() => { vi.advanceTimersByTime(1999); });

      expect(saveDraft).not.toHaveBeenCalled();
    });

    it('does not call saveDraft when imageBase64 is null', () => {
      const saveDraft = vi.fn();
      renderHook(() => useWizardAutoSave(makeParams({ saveDraft, step: 1, imageBase64: null })));

      act(() => { vi.advanceTimersByTime(2000); });

      expect(saveDraft).not.toHaveBeenCalled();
    });

    it('does not call saveDraft when userId is undefined', () => {
      const saveDraft = vi.fn();
      renderHook(() =>
        useWizardAutoSave(makeParams({ saveDraft, step: 1, imageBase64: 'img', userId: undefined }))
      );

      act(() => { vi.advanceTimersByTime(2000); });

      expect(saveDraft).not.toHaveBeenCalled();
    });

    it('does not auto-save when step is 0', () => {
      const saveDraft = vi.fn();
      renderHook(() => useWizardAutoSave(makeParams({ saveDraft, step: 0, imageBase64: 'img' })));

      act(() => { vi.advanceTimersByTime(2000); });

      expect(saveDraft).not.toHaveBeenCalled();
    });

    it('does not auto-save when step is 6 (completion)', () => {
      const saveDraft = vi.fn();
      renderHook(() => useWizardAutoSave(makeParams({ saveDraft, step: 6, imageBase64: 'img' })));

      act(() => { vi.advanceTimersByTime(2000); });

      expect(saveDraft).not.toHaveBeenCalled();
    });

    it('auto-saves at step 5 (last valid step)', () => {
      const saveDraft = vi.fn();
      renderHook(() => useWizardAutoSave(makeParams({ saveDraft, step: 5, imageBase64: 'img' })));

      act(() => { vi.advanceTimersByTime(2000); });

      expect(saveDraft).toHaveBeenCalledTimes(1);
    });

    it('passes correct draft shape to saveDraft', () => {
      const saveDraft = vi.fn();
      const formData = makeFormData({ patientName: 'Alice' });
      const selectedTeeth = ['11', '21'];
      const anamnesis = 'No issues';

      renderHook(() =>
        useWizardAutoSave(makeParams({ saveDraft, step: 2, imageBase64: 'img', formData, selectedTeeth, anamnesis }))
      );

      act(() => { vi.advanceTimersByTime(2000); });

      expect(saveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          step: 2,
          formData,
          selectedTeeth,
          anamnesis,
        })
      );
    });

    it('draft does not include lastSavedAt (that is added by saveDraft)', () => {
      const saveDraft = vi.fn();
      renderHook(() => useWizardAutoSave(makeParams({ saveDraft, step: 1, imageBase64: 'img' })));

      act(() => { vi.advanceTimersByTime(2000); });

      const draft = saveDraft.mock.calls[0][0] as Omit<WizardDraft, 'lastSavedAt'>;
      expect((draft as any).lastSavedAt).toBeUndefined();
    });

    it('re-renders with new state reset debounce (only fires once per 2s window)', () => {
      const saveDraft = vi.fn();
      const params = makeParams({ saveDraft, step: 1, imageBase64: 'img' });
      const { rerender } = renderHook((p) => useWizardAutoSave(p), { initialProps: params });

      // Advance 1s — no save yet
      act(() => { vi.advanceTimersByTime(1000); });
      expect(saveDraft).not.toHaveBeenCalled();

      // Re-render with updated anamnesis — resets the debounce
      rerender({ ...params, anamnesis: 'new note' });

      act(() => { vi.advanceTimersByTime(1000); });
      // Still under 2s from the last change
      expect(saveDraft).not.toHaveBeenCalled();

      act(() => { vi.advanceTimersByTime(1000); });
      expect(saveDraft).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Visibility change auto-save
  // -------------------------------------------------------------------------

  describe('visibilitychange auto-save', () => {
    afterEach(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      });
    });

    it('calls saveDraft immediately when document becomes hidden at step 2+', () => {
      const saveDraft = vi.fn();
      renderHook(() => useWizardAutoSave(makeParams({ saveDraft, step: 2, imageBase64: 'img' })));

      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'hidden',
          writable: true,
          configurable: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(saveDraft).toHaveBeenCalledTimes(1);
    });

    it('does not call saveDraft on visibility hidden when step is 1', () => {
      const saveDraft = vi.fn();
      // Auto-save fires after debounce for step 1, but visibility save needs step >= 2
      renderHook(() => useWizardAutoSave(makeParams({ saveDraft, step: 1, imageBase64: 'img' })));

      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'hidden',
          writable: true,
          configurable: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // No visibility save for step 1 — only debounce applies
      // (debounce hasn't fired yet either since we didn't advance timers)
      expect(saveDraft).not.toHaveBeenCalled();
    });

    it('does not call saveDraft when document becomes visible', () => {
      const saveDraft = vi.fn();
      renderHook(() => useWizardAutoSave(makeParams({ saveDraft, step: 3, imageBase64: 'img' })));

      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'visible',
          writable: true,
          configurable: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(saveDraft).not.toHaveBeenCalled();
    });

    it('does not call saveDraft on hidden when imageBase64 is null', () => {
      const saveDraft = vi.fn();
      renderHook(() =>
        useWizardAutoSave(makeParams({ saveDraft, step: 3, imageBase64: null }))
      );

      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'hidden',
          writable: true,
          configurable: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(saveDraft).not.toHaveBeenCalled();
    });

    it('does not call saveDraft on hidden when userId is undefined', () => {
      const saveDraft = vi.fn();
      renderHook(() =>
        useWizardAutoSave(makeParams({ saveDraft, step: 3, imageBase64: 'img', userId: undefined }))
      );

      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'hidden',
          writable: true,
          configurable: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(saveDraft).not.toHaveBeenCalled();
    });

    it('removes visibilitychange listener on unmount', () => {
      const saveDraft = vi.fn();
      const { unmount } = renderHook(() =>
        useWizardAutoSave(makeParams({ saveDraft, step: 3, imageBase64: 'img' }))
      );

      unmount();

      act(() => {
        Object.defineProperty(document, 'visibilityState', {
          value: 'hidden',
          writable: true,
          configurable: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // saveDraft should NOT be called after unmount
      expect(saveDraft).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // beforeunload warning
  // -------------------------------------------------------------------------

  describe('beforeunload warning', () => {
    // NOTE: These tests spy on window.addEventListener and filter for
    // 'beforeunload' calls rather than dispatching an actual beforeunload event.
    // Dispatching a real 'beforeunload' event in jsdom does not reliably invoke
    // the returnValue setter (the mechanism used to show the browser dialog),
    // so the spy-and-filter approach is necessary to verify registration without
    // a major refactor of the hook or the test environment.

    it('adds beforeunload listener when step >= 2 and image is present', () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      renderHook(() => useWizardAutoSave(makeParams({ step: 2, imageBase64: 'img' })));

      expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
      addSpy.mockRestore();
    });

    it('does not add beforeunload listener when step is 1', () => {
      // Filter for 'beforeunload' specifically because React and jsdom register
      // other listeners (e.g., 'storage', 'popstate') during the render cycle.
      const addSpy = vi.spyOn(window, 'addEventListener');
      renderHook(() => useWizardAutoSave(makeParams({ step: 1, imageBase64: 'img' })));

      const beforeunloadCalls = addSpy.mock.calls.filter((c) => c[0] === 'beforeunload');
      expect(beforeunloadCalls).toHaveLength(0);
      addSpy.mockRestore();
    });

    it('does not add beforeunload listener when imageBase64 is null', () => {
      // Filter for 'beforeunload' specifically — see note above.
      const addSpy = vi.spyOn(window, 'addEventListener');
      renderHook(() => useWizardAutoSave(makeParams({ step: 3, imageBase64: null })));

      const beforeunloadCalls = addSpy.mock.calls.filter((c) => c[0] === 'beforeunload');
      expect(beforeunloadCalls).toHaveLength(0);
      addSpy.mockRestore();
    });

    it('removes beforeunload listener on unmount', () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = renderHook(() =>
        useWizardAutoSave(makeParams({ step: 2, imageBase64: 'img' }))
      );

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
      removeSpy.mockRestore();
    });
  });
});
