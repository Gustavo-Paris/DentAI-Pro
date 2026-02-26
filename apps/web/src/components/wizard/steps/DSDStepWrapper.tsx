import { memo } from 'react';
import type { AdditionalPhotos } from '@/hooks/useWizardDraft';
import type { PatientPreferences } from '@/components/wizard/PatientPreferencesStep';
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
}: DSDStepWrapperProps) {
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
          photoQualityScore={analysisResult?.dsd_simulation_suitability}
          onResultChange={handleDSDResultChange}
          onPreferencesChange={setPatientPreferences}
        />
      </div>
    </div>
  );
});
