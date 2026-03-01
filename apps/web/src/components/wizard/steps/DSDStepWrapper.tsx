import { memo } from 'react';
import type { AdditionalPhotos } from '@/hooks/useWizardDraft';
import type { PatientPreferences } from '@/types/dsd';
import type { PhotoAnalysisResult } from '@/types/wizard';
import type { DSDResult } from '@/types/dsd';
import { DSDStep } from '@/components/wizard/DSDStep';

interface DSDStepWrapperProps {
  stepDirection: 'forward' | 'backward';
  imageBase64: string | null;
  handleDSDComplete: (result: DSDResult | null) => void;
  handleDSDSkip: () => void;
  additionalPhotos: AdditionalPhotos;
  patientPreferences: PatientPreferences;
  analysisResult: PhotoAnalysisResult | null;
  dsdResult: DSDResult | null;
  handleDSDResultChange: (result: DSDResult | null) => void;
  setPatientPreferences: (prefs: PatientPreferences) => void;
  /** Early quality score from photo upload step (fallback when full analysis score is unavailable) */
  earlyPhotoQualityScore?: number | null;
}

export const DSDStepWrapper = memo(function DSDStepWrapper({
  stepDirection,
  imageBase64,
  handleDSDComplete,
  handleDSDSkip,
  additionalPhotos,
  patientPreferences,
  analysisResult,
  dsdResult,
  handleDSDResultChange,
  setPatientPreferences,
  earlyPhotoQualityScore,
}: DSDStepWrapperProps) {
  // Use full analysis score when available, fall back to early quality check score
  const effectiveQualityScore = analysisResult?.dsd_simulation_suitability ?? earlyPhotoQualityScore ?? undefined;

  return (
    <div className={`wizard-step-${stepDirection}`}>
      <div className="wizard-stage">
        <DSDStep
          imageBase64={imageBase64}
          onComplete={handleDSDComplete}
          onSkip={handleDSDSkip}
          additionalPhotos={additionalPhotos}
          patientPreferences={patientPreferences}
          detectedTeeth={analysisResult?.detected_teeth}
          initialResult={dsdResult}
          clinicalObservations={analysisResult?.observations}
          clinicalTeethFindings={analysisResult?.detected_teeth?.map((t) => ({
            tooth: t.tooth,
            indication_reason: t.indication_reason,
            treatment_indication: t.treatment_indication,
          }))}
          photoQualityScore={effectiveQualityScore}
          onResultChange={handleDSDResultChange}
          onPreferencesChange={setPatientPreferences}
          analysisResult={analysisResult}
        />
      </div>
    </div>
  );
});
