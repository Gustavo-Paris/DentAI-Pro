import { useCallback, useRef, useState, useEffect } from 'react';
import type { PhotoAnalysisResult, ReviewFormData, TreatmentType } from '@/types/wizard';
import type { DSDResult } from '@/types/dsd';
import { PatientPreferences } from '@/components/wizard/PatientPreferencesStep';
import { logger } from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';
import { drafts } from '@/data';

export interface AdditionalPhotos {
  smile45: string | null;
  face: string | null;
}

export interface WizardDraft {
  step: number;
  formData: ReviewFormData;
  selectedTeeth: string[];
  toothTreatments: Record<string, TreatmentType>;
  analysisResult: PhotoAnalysisResult | null;
  dsdResult: DSDResult | null;
  uploadedPhotoPath: string | null;
  additionalPhotos?: AdditionalPhotos;
  patientPreferences?: PatientPreferences;
  vitaShadeManuallySet?: boolean;
  lastSavedAt: string;
}

const DEBOUNCE_MS = 2000;
const DRAFT_EXPIRY_DAYS = 7;

export function useWizardDraft(userId: string | undefined) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const cachedDraftRef = useRef<WizardDraft | null>(null);
  const lastDraftRef = useRef<WizardDraft | null>(null);

  // Check if draft is expired
  const isDraftExpired = useCallback((draft: WizardDraft): boolean => {
    const savedDate = new Date(draft.lastSavedAt);
    const now = new Date();
    const diffDays = (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > DRAFT_EXPIRY_DAYS;
  }, []);

  // Load draft from Supabase
  const loadDraft = useCallback(async (): Promise<WizardDraft | null> => {
    if (!userId) return null;

    // Return cached draft if available
    if (cachedDraftRef.current) {
      return cachedDraftRef.current;
    }

    try {
      const data = await drafts.load(userId);

      if (!data) return null;

      const draft = data.draft_data as WizardDraft;

      // Check expiry
      if (isDraftExpired(draft)) {
        // Delete expired draft
        await drafts.remove(userId);
        return null;
      }

      cachedDraftRef.current = draft;
      setLastSavedAt(draft.lastSavedAt);
      return draft;
    } catch (error) {
      logger.error('Error loading draft:', error);
      return null;
    }
  }, [userId, isDraftExpired]);


  // Save draft with debounce
  const saveDraft = useCallback((draft: Omit<WizardDraft, 'lastSavedAt'>) => {
    if (!userId) return;

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setIsSaving(true);

    // Capture latest draft data for flush-on-unmount
    const draftWithTimestamp: WizardDraft = {
      ...draft,
      lastSavedAt: new Date().toISOString(),
    };
    lastDraftRef.current = draftWithTimestamp;

    debounceRef.current = setTimeout(async () => {
      try {
        await drafts.save(userId, draftWithTimestamp);
        cachedDraftRef.current = draftWithTimestamp;
        lastDraftRef.current = null; // Clear — save completed, no flush needed
        setLastSavedAt(draftWithTimestamp.lastSavedAt);
        trackEvent('draft_saved');
      } catch (error) {
        logger.error('Error saving draft:', error);
      } finally {
        setIsSaving(false);
      }
    }, DEBOUNCE_MS);
  }, [userId]);

  // Clear draft
  const clearDraft = useCallback(async () => {
    if (!userId) return;

    try {
      await drafts.remove(userId);
      cachedDraftRef.current = null;
      setLastSavedAt(null);
    } catch (error) {
      logger.error('Error clearing draft:', error);
    }
  }, [userId]);


  // Cleanup timeout on unmount — flush pending save immediately
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        // Flush pending save immediately on unmount
        if (lastDraftRef.current && userId) {
          drafts.save(userId, lastDraftRef.current).catch((err) =>
            logger.error('Error flushing draft on unmount:', err)
          );
        }
      }
    };
  }, []);

  return {
    loadDraft,
    saveDraft,
    clearDraft,
    isSaving,
    lastSavedAt,
  };
}
