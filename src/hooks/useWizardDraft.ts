import { useCallback, useRef, useState, useEffect } from 'react';
import { PhotoAnalysisResult, ReviewFormData, TreatmentType } from '@/components/wizard/ReviewAnalysisStep';
import { DSDResult } from '@/components/wizard/DSDStep';
import { supabase } from '@/integrations/supabase/client';
import { PatientPreferences } from '@/components/wizard/PatientPreferencesStep';

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
  lastSavedAt: string;
}

interface DraftRow {
  id: string;
  user_id: string;
  draft_data: WizardDraft;
  created_at: string;
  updated_at: string;
}

const DEBOUNCE_MS = 2000;
const DRAFT_EXPIRY_DAYS = 7;

export function useWizardDraft(userId: string | undefined) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const cachedDraftRef = useRef<WizardDraft | null>(null);

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
      const { data, error } = await supabase
        .from('evaluation_drafts')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading draft:', error);
        return null;
      }

      if (!data) return null;

      const row = data as unknown as DraftRow;
      const draft = row.draft_data;
      
      // Check expiry
      if (isDraftExpired(draft)) {
        // Delete expired draft
        await supabase
          .from('evaluation_drafts')
          .delete()
          .eq('user_id', userId);
        return null;
      }

      cachedDraftRef.current = draft;
      setLastSavedAt(draft.lastSavedAt);
      return draft;
    } catch (error) {
      console.error('Error loading draft:', error);
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

    debounceRef.current = setTimeout(async () => {
      try {
        const draftWithTimestamp: WizardDraft = {
          ...draft,
          lastSavedAt: new Date().toISOString(),
        };

        // First check if draft exists
        const { data: existingDraft } = await supabase
          .from('evaluation_drafts')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        let error;
        if (existingDraft) {
          // Update existing draft
          const result = await supabase
            .from('evaluation_drafts')
            .update({
              draft_data: JSON.parse(JSON.stringify(draftWithTimestamp)),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);
          error = result.error;
        } else {
          // Insert new draft - use raw query to bypass type checking
          const result = await supabase
            .from('evaluation_drafts')
            .insert([{
              user_id: userId,
              draft_data: JSON.parse(JSON.stringify(draftWithTimestamp)),
            }]);
          error = result.error;
        }

        if (error) {
          console.error('Error saving draft:', error);
        } else {
          cachedDraftRef.current = draftWithTimestamp;
          setLastSavedAt(draftWithTimestamp.lastSavedAt);
        }
      } catch (error) {
        console.error('Error saving draft:', error);
      } finally {
        setIsSaving(false);
      }
    }, DEBOUNCE_MS);
  }, [userId]);

  // Clear draft
  const clearDraft = useCallback(async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('evaluation_drafts')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing draft:', error);
      } else {
        cachedDraftRef.current = null;
        setLastSavedAt(null);
      }
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  }, [userId]);


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
    isSaving,
    lastSavedAt,
  };
}
