import { useCallback, useRef, useState, useEffect } from 'react';
import { PhotoAnalysisResult, ReviewFormData, TreatmentType } from '@/components/wizard/ReviewAnalysisStep';
import { DSDResult } from '@/components/wizard/DSDStep';

export interface WizardDraft {
  step: number;
  formData: ReviewFormData;
  selectedTeeth: string[];
  toothTreatments: Record<string, TreatmentType>;
  analysisResult: PhotoAnalysisResult | null;
  dsdResult: DSDResult | null;
  uploadedPhotoPath: string | null;
  lastSavedAt: string;
}

const STORAGE_KEY_PREFIX = 'wizard_draft_';
const DEBOUNCE_MS = 2000;
const DRAFT_EXPIRY_DAYS = 7;

export function useWizardDraft(userId: string | undefined) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const storageKey = userId ? `${STORAGE_KEY_PREFIX}${userId}` : null;

  // Check if draft is expired
  const isDraftExpired = useCallback((draft: WizardDraft): boolean => {
    const savedDate = new Date(draft.lastSavedAt);
    const now = new Date();
    const diffDays = (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > DRAFT_EXPIRY_DAYS;
  }, []);

  // Load draft from localStorage
  const loadDraft = useCallback((): WizardDraft | null => {
    if (!storageKey) return null;

    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const draft = JSON.parse(stored) as WizardDraft;
      
      // Check expiry
      if (isDraftExpired(draft)) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return draft;
    } catch (error) {
      console.error('Error loading draft:', error);
      return null;
    }
  }, [storageKey, isDraftExpired]);

  // Save draft with debounce
  const saveDraft = useCallback((draft: Omit<WizardDraft, 'lastSavedAt'>) => {
    if (!storageKey) return;

    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setIsSaving(true);

    debounceRef.current = setTimeout(() => {
      try {
        const draftWithTimestamp: WizardDraft = {
          ...draft,
          lastSavedAt: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(draftWithTimestamp));
        setLastSavedAt(draftWithTimestamp.lastSavedAt);
        setIsSaving(false);
      } catch (error) {
        console.error('Error saving draft:', error);
        setIsSaving(false);
      }
    }, DEBOUNCE_MS);
  }, [storageKey]);

  // Clear draft
  const clearDraft = useCallback(() => {
    if (!storageKey) return;

    try {
      localStorage.removeItem(storageKey);
      setLastSavedAt(null);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  }, [storageKey]);

  // Check if draft exists
  const hasDraft = useCallback((): boolean => {
    return loadDraft() !== null;
  }, [loadDraft]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    loadDraft,
    saveDraft,
    clearDraft,
    hasDraft,
    isSaving,
    lastSavedAt,
  };
}
