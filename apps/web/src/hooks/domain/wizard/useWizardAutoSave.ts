import { useEffect } from 'react';
import type { ReviewFormData, PhotoAnalysisResult, TreatmentType } from '@/types/wizard';
import type { DSDResult } from '@/types/dsd';
import type { AdditionalPhotos, WizardDraft } from '@/hooks/useWizardDraft';
import type { PatientPreferences } from '@/components/wizard/PatientPreferencesStep';

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export interface UseWizardAutoSaveParams {
  step: number;
  imageBase64: string | null;
  formData: ReviewFormData;
  selectedTeeth: string[];
  toothTreatments: Record<string, TreatmentType>;
  analysisResult: PhotoAnalysisResult | null;
  dsdResult: DSDResult | null;
  uploadedPhotoPath: string | null;
  additionalPhotos: AdditionalPhotos;
  patientPreferences: PatientPreferences;
  vitaShadeManuallySet: boolean;
  saveDraft: (draft: Omit<WizardDraft, 'lastSavedAt'>) => void;
  userId: string | undefined;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manages auto-saving wizard state to draft storage.
 *
 * Responsibilities:
 * - Auto-save when state changes (from step 1 with image)
 * - Auto-save on visibility change (mobile tab switch / app switch)
 * - Beforeunload warning for unsaved work
 */
export function useWizardAutoSave({
  step,
  imageBase64,
  formData,
  selectedTeeth,
  toothTreatments,
  analysisResult,
  dsdResult,
  uploadedPhotoPath,
  additionalPhotos,
  patientPreferences,
  vitaShadeManuallySet,
  saveDraft,
  userId,
}: UseWizardAutoSaveParams) {
  // -------------------------------------------------------------------------
  // Auto-save when state changes (from step 1 with image)
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (step >= 1 && step < 6 && imageBase64 !== null && userId) {
      saveDraft({
        step,
        formData,
        selectedTeeth,
        toothTreatments,
        analysisResult,
        dsdResult,
        uploadedPhotoPath,
        additionalPhotos,
        patientPreferences,
        vitaShadeManuallySet,
      });
    }
  }, [
    step,
    imageBase64,
    formData,
    selectedTeeth,
    toothTreatments,
    analysisResult,
    dsdResult,
    uploadedPhotoPath,
    additionalPhotos,
    patientPreferences,
    saveDraft,
    userId,
  ]);

  // -------------------------------------------------------------------------
  // Beforeunload warning — only fire after meaningful input (photo uploaded)
  // -------------------------------------------------------------------------

  useEffect(() => {
    const hasInput = step >= 2 && step <= 5 && imageBase64 !== null;
    if (!hasInput) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [step, imageBase64]);

  // -------------------------------------------------------------------------
  // Auto-save on visibilitychange (mobile tab switch, app switch)
  // Complements beforeunload which is unreliable on iOS Safari / Android WebView
  // -------------------------------------------------------------------------

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && step >= 2 && imageBase64 !== null && userId) {
        saveDraft({
          step,
          formData,
          selectedTeeth,
          toothTreatments,
          analysisResult,
          dsdResult,
          uploadedPhotoPath,
          additionalPhotos,
          patientPreferences,
          vitaShadeManuallySet,
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [
    step,
    imageBase64,
    formData,
    selectedTeeth,
    toothTreatments,
    analysisResult,
    dsdResult,
    uploadedPhotoPath,
    additionalPhotos,
    patientPreferences,
    saveDraft,
    userId,
  ]);
}
