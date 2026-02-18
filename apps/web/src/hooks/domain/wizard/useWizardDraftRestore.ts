import { useState, useCallback } from 'react';
import type {
  PhotoAnalysisResult,
  ReviewFormData,
  TreatmentType,
} from '@/components/wizard/ReviewAnalysisStep';
import type { DSDResult } from '@/types/dsd';
import type { WizardDraft, AdditionalPhotos } from '@/hooks/useWizardDraft';
import type { PatientPreferences } from '@/components/wizard/PatientPreferencesStep';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';
import { wizard as wizardData } from '@/data';

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export interface UseWizardDraftRestoreParams {
  setStep: React.Dispatch<React.SetStateAction<number>>;
  setFormData: React.Dispatch<React.SetStateAction<ReviewFormData>>;
  setSelectedTeeth: React.Dispatch<React.SetStateAction<string[]>>;
  setToothTreatments: React.Dispatch<React.SetStateAction<Record<string, TreatmentType>>>;
  setAnalysisResult: React.Dispatch<React.SetStateAction<PhotoAnalysisResult | null>>;
  setDsdResult: React.Dispatch<React.SetStateAction<DSDResult | null>>;
  setUploadedPhotoPath: (path: string | null) => void;
  setAdditionalPhotos: React.Dispatch<React.SetStateAction<AdditionalPhotos>>;
  setPatientPreferences: React.Dispatch<React.SetStateAction<PatientPreferences>>;
  setImageBase64: (base64: string | null) => void;
  clearDraft: () => void;
  vitaShadeManuallySetRef?: React.MutableRefObject<boolean>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWizardDraftRestore({
  setStep,
  setFormData,
  setSelectedTeeth,
  setToothTreatments,
  setAnalysisResult,
  setDsdResult,
  setUploadedPhotoPath,
  setAdditionalPhotos,
  setPatientPreferences,
  setImageBase64,
  clearDraft,
  vitaShadeManuallySetRef,
}: UseWizardDraftRestoreParams) {
  const { t } = useTranslation();
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<WizardDraft | null>(null);

  const handleRestoreDraft = useCallback(async () => {
    if (!pendingDraft) return;

    setStep(pendingDraft.step);
    setFormData(pendingDraft.formData);
    setSelectedTeeth(pendingDraft.selectedTeeth);
    setToothTreatments(pendingDraft.toothTreatments);
    setAnalysisResult(pendingDraft.analysisResult);
    setDsdResult(pendingDraft.dsdResult);
    setUploadedPhotoPath(pendingDraft.uploadedPhotoPath);
    setAdditionalPhotos(pendingDraft.additionalPhotos || { smile45: null, face: null });
    setPatientPreferences(pendingDraft.patientPreferences || { whiteningLevel: 'natural' });
    // Restore manual shade override flag — only sets `true` since `false` is the useRef default
    if (vitaShadeManuallySetRef && pendingDraft.vitaShadeManuallySet) {
      vitaShadeManuallySetRef.current = true;
    }

    if (pendingDraft.uploadedPhotoPath) {
      try {
        const data = await wizardData.downloadPhoto(pendingDraft.uploadedPhotoPath);

        if (data) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setImageBase64(reader.result as string);
          };
          reader.readAsDataURL(data);
        }
      } catch (err) {
        logger.error('Error loading draft image:', err);
      }
    }

    setShowRestoreModal(false);
    setPendingDraft(null);
    trackEvent('draft_restored');
    toast.success(t('toasts.draft.restored'));
  }, [
    pendingDraft,
    setStep,
    setFormData,
    setSelectedTeeth,
    setToothTreatments,
    setAnalysisResult,
    setDsdResult,
    setUploadedPhotoPath,
    setAdditionalPhotos,
    setPatientPreferences,
    setImageBase64,
    clearDraft,
    vitaShadeManuallySetRef,
  ]);

  const handleDiscardDraft = useCallback(() => {
    clearDraft();
    if (vitaShadeManuallySetRef) {
      vitaShadeManuallySetRef.current = false;
    }
    setShowRestoreModal(false);
    setPendingDraft(null);
  }, [clearDraft, vitaShadeManuallySetRef]);

  return {
    showRestoreModal,
    setShowRestoreModal,
    pendingDraft,
    setPendingDraft,
    handleRestoreDraft,
    handleDiscardDraft,
  };
}
