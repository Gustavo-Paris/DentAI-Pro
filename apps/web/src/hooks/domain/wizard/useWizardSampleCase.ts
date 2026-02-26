import { useState, useEffect, useRef } from 'react';
import type { PhotoAnalysisResult, ReviewFormData, TreatmentType } from '@/types/wizard';
import { SAMPLE_CASE } from '@/data/sample-case';

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export interface UseWizardSampleCaseParams {
  searchParams: URLSearchParams;
  setAnalysisResult: React.Dispatch<React.SetStateAction<PhotoAnalysisResult | null>>;
  setFormData: React.Dispatch<React.SetStateAction<ReviewFormData>>;
  setSelectedTeeth: React.Dispatch<React.SetStateAction<string[]>>;
  setToothTreatments: React.Dispatch<React.SetStateAction<Record<string, TreatmentType>>>;
  setStep: React.Dispatch<React.SetStateAction<number>>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Detects the `?sample=true` URL param and pre-fills wizard state
 * with sample case data, jumping directly to the review step.
 */
export function useWizardSampleCase({
  searchParams,
  setAnalysisResult,
  setFormData,
  setSelectedTeeth,
  setToothTreatments,
  setStep,
}: UseWizardSampleCaseParams) {
  const [isSampleCase, setIsSampleCase] = useState(false);
  const hasCheckedSampleRef = useRef(false);

  useEffect(() => {
    if (hasCheckedSampleRef.current) return;
    hasCheckedSampleRef.current = true;

    if (searchParams.get('sample') === 'true') {
      setIsSampleCase(true);
      setAnalysisResult(SAMPLE_CASE.analysisResult);
      setFormData(SAMPLE_CASE.formData);
      setSelectedTeeth([...SAMPLE_CASE.selectedTeeth]);
      setToothTreatments({ ...SAMPLE_CASE.toothTreatments });
      setStep(5);
    }
  }, [searchParams, setAnalysisResult, setFormData, setSelectedTeeth, setToothTreatments, setStep]);

  return { isSampleCase };
}
