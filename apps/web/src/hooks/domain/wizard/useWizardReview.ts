import { useCallback } from 'react';
import type {
  ReviewFormData,
  TreatmentType,
} from '@/components/wizard/ReviewAnalysisStep';

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export interface UseWizardReviewParams {
  setFormData: React.Dispatch<React.SetStateAction<ReviewFormData>>;
  setToothTreatments: React.Dispatch<React.SetStateAction<Record<string, TreatmentType>>>;
  originalToothTreatments: Record<string, TreatmentType>;
  vitaShadeManuallySetRef: React.RefObject<boolean>;
  setSelectedPatientId: React.Dispatch<React.SetStateAction<string | null>>;
  setPatientBirthDate: React.Dispatch<React.SetStateAction<string | null>>;
  setOriginalPatientBirthDate: React.Dispatch<React.SetStateAction<string | null>>;
  setDobValidationError: React.Dispatch<React.SetStateAction<boolean>>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWizardReview({
  setFormData,
  setToothTreatments,
  originalToothTreatments,
  vitaShadeManuallySetRef,
  setSelectedPatientId,
  setPatientBirthDate,
  setOriginalPatientBirthDate,
  setDobValidationError,
}: UseWizardReviewParams) {
  const updateFormData = useCallback((updates: Partial<ReviewFormData>) => {
    // Track manual vitaShade override so AI doesn't reset it
    if ('vitaShade' in updates && updates.vitaShade) {
      vitaShadeManuallySetRef.current = true;
    }
    setFormData((prev) => ({ ...prev, ...updates }));
  }, [vitaShadeManuallySetRef, setFormData]);

  const handleToothTreatmentChange = useCallback((tooth: string, treatment: TreatmentType) => {
    setToothTreatments((prev) => ({ ...prev, [tooth]: treatment }));
  }, [setToothTreatments]);

  const handleRestoreAiSuggestion = useCallback(
    (tooth: string) => {
      const original = originalToothTreatments[tooth];
      if (original) {
        setToothTreatments((prev) => ({ ...prev, [tooth]: original }));
      }
    },
    [originalToothTreatments, setToothTreatments],
  );

  const handlePatientSelect = useCallback(
    (_name: string, patientId?: string, birthDate?: string | null) => {
      setSelectedPatientId(patientId || null);
      setPatientBirthDate(birthDate || null);
      setOriginalPatientBirthDate(birthDate || null);
      if (birthDate) setDobValidationError(false);

      if (birthDate) {
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        setFormData((prev) => ({ ...prev, patientAge: String(age) }));
      } else {
        setFormData((prev) => ({ ...prev, patientAge: '' }));
      }
    },
    [setSelectedPatientId, setPatientBirthDate, setOriginalPatientBirthDate, setDobValidationError, setFormData],
  );

  const handlePatientBirthDateChange = useCallback((date: string | null) => {
    setPatientBirthDate(date);
    if (date) setDobValidationError(false);
  }, [setPatientBirthDate, setDobValidationError]);

  return {
    updateFormData,
    handleToothTreatmentChange,
    handleRestoreAiSuggestion,
    handlePatientSelect,
    handlePatientBirthDateChange,
  };
}
