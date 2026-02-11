import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWizardReview } from '../domain/wizard/useWizardReview';
import type { UseWizardReviewParams } from '../domain/wizard/useWizardReview';
import type { ReviewFormData, TreatmentType } from '@/components/wizard/ReviewAnalysisStep';
import { INITIAL_FORM_DATA } from '../domain/wizard/constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createParams(overrides?: Partial<UseWizardReviewParams>): UseWizardReviewParams {
  return {
    setFormData: vi.fn(),
    setToothTreatments: vi.fn(),
    originalToothTreatments: {},
    vitaShadeManuallySetRef: { current: false },
    setSelectedPatientId: vi.fn(),
    setPatientBirthDate: vi.fn(),
    setOriginalPatientBirthDate: vi.fn(),
    setDobValidationError: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useWizardReview', () => {
  describe('updateFormData', () => {
    it('should merge partial updates into form data', () => {
      const setFormData = vi.fn();
      const { result } = renderHook(() =>
        useWizardReview(createParams({ setFormData })),
      );

      act(() => result.current.updateFormData({ patientName: 'João' }));

      expect(setFormData).toHaveBeenCalled();
      // The setter is called with a function — invoke it to check the merge
      const setterFn = setFormData.mock.calls[0][0];
      const merged = setterFn(INITIAL_FORM_DATA);
      expect(merged.patientName).toBe('João');
      // Other fields should remain unchanged
      expect(merged.tooth).toBe(INITIAL_FORM_DATA.tooth);
      expect(merged.vitaShade).toBe(INITIAL_FORM_DATA.vitaShade);
    });

    it('should set vitaShadeManuallySetRef when updating vitaShade', () => {
      const vitaShadeManuallySetRef = { current: false };
      const { result } = renderHook(() =>
        useWizardReview(createParams({ vitaShadeManuallySetRef })),
      );

      act(() => result.current.updateFormData({ vitaShade: 'B3' }));
      expect(vitaShadeManuallySetRef.current).toBe(true);
    });

    it('should not set vitaShadeManuallySetRef when updating other fields', () => {
      const vitaShadeManuallySetRef = { current: false };
      const { result } = renderHook(() =>
        useWizardReview(createParams({ vitaShadeManuallySetRef })),
      );

      act(() => result.current.updateFormData({ patientName: 'Test' }));
      expect(vitaShadeManuallySetRef.current).toBe(false);
    });

    it('should not set vitaShadeManuallySetRef when vitaShade is empty', () => {
      const vitaShadeManuallySetRef = { current: false };
      const { result } = renderHook(() =>
        useWizardReview(createParams({ vitaShadeManuallySetRef })),
      );

      act(() => result.current.updateFormData({ vitaShade: '' }));
      expect(vitaShadeManuallySetRef.current).toBe(false);
    });

    it('should handle multiple field updates at once', () => {
      const setFormData = vi.fn();
      const { result } = renderHook(() =>
        useWizardReview(createParams({ setFormData })),
      );

      act(() =>
        result.current.updateFormData({
          patientName: 'Maria',
          patientAge: '30',
          tooth: '21',
        }),
      );

      const setterFn = setFormData.mock.calls[0][0];
      const merged = setterFn(INITIAL_FORM_DATA);
      expect(merged.patientName).toBe('Maria');
      expect(merged.patientAge).toBe('30');
      expect(merged.tooth).toBe('21');
    });
  });

  describe('handleToothTreatmentChange', () => {
    it('should set treatment for a specific tooth', () => {
      const setToothTreatments = vi.fn();
      const { result } = renderHook(() =>
        useWizardReview(createParams({ setToothTreatments })),
      );

      act(() =>
        result.current.handleToothTreatmentChange('11', 'porcelana'),
      );

      const setterFn = setToothTreatments.mock.calls[0][0];
      const updated = setterFn({ '11': 'resina', '12': 'resina' });
      expect(updated['11']).toBe('porcelana');
      expect(updated['12']).toBe('resina');
    });

    it('should add treatment for a new tooth', () => {
      const setToothTreatments = vi.fn();
      const { result } = renderHook(() =>
        useWizardReview(createParams({ setToothTreatments })),
      );

      act(() =>
        result.current.handleToothTreatmentChange('21', 'coroa'),
      );

      const setterFn = setToothTreatments.mock.calls[0][0];
      const updated = setterFn({});
      expect(updated['21']).toBe('coroa');
    });
  });

  describe('handleRestoreAiSuggestion', () => {
    it('should restore original AI suggestion for a tooth', () => {
      const setToothTreatments = vi.fn();
      const originalToothTreatments: Record<string, TreatmentType> = {
        '11': 'resina',
        '12': 'porcelana',
      };
      const { result } = renderHook(() =>
        useWizardReview(
          createParams({ setToothTreatments, originalToothTreatments }),
        ),
      );

      act(() => result.current.handleRestoreAiSuggestion('11'));

      const setterFn = setToothTreatments.mock.calls[0][0];
      const updated = setterFn({ '11': 'coroa' });
      expect(updated['11']).toBe('resina');
    });

    it('should not change anything when tooth has no original suggestion', () => {
      const setToothTreatments = vi.fn();
      const { result } = renderHook(() =>
        useWizardReview(
          createParams({ setToothTreatments, originalToothTreatments: {} }),
        ),
      );

      act(() => result.current.handleRestoreAiSuggestion('99'));
      // setToothTreatments should not be called when there is no original
      expect(setToothTreatments).not.toHaveBeenCalled();
    });
  });

  describe('handlePatientSelect', () => {
    it('should set patient info with birth date', () => {
      const setSelectedPatientId = vi.fn();
      const setPatientBirthDate = vi.fn();
      const setOriginalPatientBirthDate = vi.fn();
      const setDobValidationError = vi.fn();
      const setFormData = vi.fn();

      const { result } = renderHook(() =>
        useWizardReview(
          createParams({
            setSelectedPatientId,
            setPatientBirthDate,
            setOriginalPatientBirthDate,
            setDobValidationError,
            setFormData,
          }),
        ),
      );

      act(() =>
        result.current.handlePatientSelect('João', 'patient-1', '1990-05-15'),
      );

      expect(setSelectedPatientId).toHaveBeenCalledWith('patient-1');
      expect(setPatientBirthDate).toHaveBeenCalledWith('1990-05-15');
      expect(setOriginalPatientBirthDate).toHaveBeenCalledWith('1990-05-15');
      expect(setDobValidationError).toHaveBeenCalledWith(false);
    });

    it('should calculate age from birth date', () => {
      const setFormData = vi.fn();
      const { result } = renderHook(() =>
        useWizardReview(createParams({ setFormData })),
      );

      // Use a date that results in a deterministic age
      const testBirthDate = '2000-01-01';
      act(() =>
        result.current.handlePatientSelect('Maria', 'p1', testBirthDate),
      );

      const setterFn = setFormData.mock.calls[0][0];
      const updated = setterFn(INITIAL_FORM_DATA);

      const expectedAge = new Date().getFullYear() - 2000 -
        (new Date().getMonth() < 0 || (new Date().getMonth() === 0 && new Date().getDate() < 1) ? 1 : 0);
      expect(updated.patientAge).toBe(String(expectedAge));
    });

    it('should clear age when no birth date', () => {
      const setFormData = vi.fn();
      const { result } = renderHook(() =>
        useWizardReview(createParams({ setFormData })),
      );

      act(() =>
        result.current.handlePatientSelect('Pedro', 'p2', null),
      );

      const setterFn = setFormData.mock.calls[0][0];
      const updated = setterFn(INITIAL_FORM_DATA);
      expect(updated.patientAge).toBe('');
    });

    it('should set patient id to null when no id provided', () => {
      const setSelectedPatientId = vi.fn();
      const { result } = renderHook(() =>
        useWizardReview(createParams({ setSelectedPatientId })),
      );

      act(() => result.current.handlePatientSelect('Novo Paciente'));

      expect(setSelectedPatientId).toHaveBeenCalledWith(null);
    });

    it('should set birth date to null when undefined', () => {
      const setPatientBirthDate = vi.fn();
      const setOriginalPatientBirthDate = vi.fn();
      const { result } = renderHook(() =>
        useWizardReview(
          createParams({ setPatientBirthDate, setOriginalPatientBirthDate }),
        ),
      );

      act(() => result.current.handlePatientSelect('Test', undefined, undefined));

      expect(setPatientBirthDate).toHaveBeenCalledWith(null);
      expect(setOriginalPatientBirthDate).toHaveBeenCalledWith(null);
    });
  });

  describe('handlePatientBirthDateChange', () => {
    it('should set birth date and clear validation error', () => {
      const setPatientBirthDate = vi.fn();
      const setDobValidationError = vi.fn();
      const { result } = renderHook(() =>
        useWizardReview(
          createParams({ setPatientBirthDate, setDobValidationError }),
        ),
      );

      act(() => result.current.handlePatientBirthDateChange('1995-03-20'));

      expect(setPatientBirthDate).toHaveBeenCalledWith('1995-03-20');
      expect(setDobValidationError).toHaveBeenCalledWith(false);
    });

    it('should not clear validation error when date is null', () => {
      const setPatientBirthDate = vi.fn();
      const setDobValidationError = vi.fn();
      const { result } = renderHook(() =>
        useWizardReview(
          createParams({ setPatientBirthDate, setDobValidationError }),
        ),
      );

      act(() => result.current.handlePatientBirthDateChange(null));

      expect(setPatientBirthDate).toHaveBeenCalledWith(null);
      expect(setDobValidationError).not.toHaveBeenCalled();
    });
  });
});
