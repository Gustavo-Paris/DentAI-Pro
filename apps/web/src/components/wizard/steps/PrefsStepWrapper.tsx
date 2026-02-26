import { memo } from 'react';
import type { PatientPreferences } from '@/components/wizard/PatientPreferencesStep';
import { PatientPreferencesStep } from '@/components/wizard/PatientPreferencesStep';

interface PrefsStepWrapperProps {
  stepDirection: 'forward' | 'backward';
  patientPreferences: PatientPreferences;
  setPatientPreferences: (prefs: PatientPreferences) => void;
  handlePreferencesContinue: () => void;
}

export const PrefsStepWrapper = memo(function PrefsStepWrapper({
  stepDirection,
  patientPreferences,
  setPatientPreferences,
  handlePreferencesContinue,
}: PrefsStepWrapperProps) {
  return (
    <div className={`wizard-step-${stepDirection}`}>
      <div className="wizard-stage">
        <PatientPreferencesStep
          preferences={patientPreferences}
          onPreferencesChange={setPatientPreferences}
          onContinue={handlePreferencesContinue}
        />
      </div>
    </div>
  );
});
