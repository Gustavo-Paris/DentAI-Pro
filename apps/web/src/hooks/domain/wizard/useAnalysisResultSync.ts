import { useEffect } from 'react';
import type {
  PhotoAnalysisResult,
  ReviewFormData,
  TreatmentType,
} from '@/types/wizard';

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export interface UseAnalysisResultSyncParams {
  analysisResult: PhotoAnalysisResult | null;
  setSelectedTeeth: React.Dispatch<React.SetStateAction<string[]>>;
  setToothTreatments: React.Dispatch<React.SetStateAction<Record<string, TreatmentType>>>;
  setOriginalToothTreatments: React.Dispatch<React.SetStateAction<Record<string, TreatmentType>>>;
  setFormData: React.Dispatch<React.SetStateAction<ReviewFormData>>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Synchronizes wizard state when `analysisResult` changes.
 *
 * Responsibilities:
 * - Auto-selects detected teeth (preserving virtual entries like GENGIVO)
 * - Initializes per-tooth treatments from AI indications
 * - Snapshots original treatments for "restore AI suggestion" feature
 * - Sets the default `treatmentType` in formData from analysis
 */
export function useAnalysisResultSync({
  analysisResult,
  setSelectedTeeth,
  setToothTreatments,
  setOriginalToothTreatments,
  setFormData,
}: UseAnalysisResultSyncParams) {
  useEffect(() => {
    if (analysisResult?.detected_teeth && analysisResult.detected_teeth.length > 0) {
      const allTeeth = analysisResult.detected_teeth.map((dt) => dt.tooth);
      // Preserve virtual entries (e.g. GENGIVO for gengivoplasty) that are not
      // part of detected_teeth but were added by DSD integration.
      setSelectedTeeth((prev) => {
        const virtual = prev.filter((tooth) => !tooth.match(/^\d+$/));
        return [...allTeeth, ...virtual];
      });

      setToothTreatments((prev) => {
        const merged: Record<string, TreatmentType> = {};
        analysisResult.detected_teeth.forEach((dt) => {
          merged[dt.tooth] = prev[dt.tooth] || dt.treatment_indication || 'resina';
        });
        // Preserve virtual entries (e.g. GENGIVO)
        for (const [key, val] of Object.entries(prev)) {
          if (!key.match(/^\d+$/)) merged[key] = val;
        }
        return merged;
      });

      setOriginalToothTreatments((prev) => {
        if (Object.keys(prev).length === 0) {
          const original: Record<string, TreatmentType> = {};
          analysisResult.detected_teeth.forEach((dt) => {
            original[dt.tooth] = dt.treatment_indication || 'resina';
          });
          return original;
        }
        return prev;
      });
    }

    if (analysisResult?.treatment_indication) {
      setFormData((prev) => ({
        ...prev,
        treatmentType: analysisResult.treatment_indication as TreatmentType,
      }));
    }
  }, [analysisResult]); // eslint-disable-line react-hooks/exhaustive-deps
}
