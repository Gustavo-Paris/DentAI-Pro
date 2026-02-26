import { memo } from 'react';
import type { PhotoAnalysisResult, ReviewFormData, TreatmentType } from '@/types/wizard';
import type { DSDResult } from '@/types/dsd';
import type { Patient } from '@/types/patient';
import type { PatientPreferences } from '@/components/wizard/PatientPreferencesStep';
import { ReviewAnalysisStep } from '@/components/wizard/ReviewAnalysisStep';

interface ReviewStepWrapperProps {
  stepDirection: 'forward' | 'backward';
  analysisResult: PhotoAnalysisResult | null;
  formData: ReviewFormData;
  updateFormData: (updates: Partial<ReviewFormData>) => void;
  imageBase64: string | null;
  handleReanalyze: () => void;
  isReanalyzing: boolean;
  selectedTeeth: string[];
  setSelectedTeeth: (teeth: string[]) => void;
  toothTreatments: Record<string, TreatmentType>;
  handleToothTreatmentChange: (tooth: string, treatment: TreatmentType) => void;
  originalToothTreatments: Record<string, TreatmentType>;
  handleRestoreAiSuggestion: (tooth: string) => void;
  hasInventory: boolean;
  patients: Patient[];
  dsdResult: DSDResult | null;
  selectedPatientId: string | null;
  patientBirthDate: string | null;
  handlePatientBirthDateChange: (date: string | null) => void;
  dobValidationError: boolean;
  setDobValidationError: (v: boolean) => void;
  patientPreferences: PatientPreferences;
  handlePatientSelect: (name: string, patientId?: string, birthDate?: string | null) => void;
}

export const ReviewStepWrapper = memo(function ReviewStepWrapper({
  stepDirection,
  analysisResult,
  formData,
  updateFormData,
  imageBase64,
  handleReanalyze,
  isReanalyzing,
  selectedTeeth,
  setSelectedTeeth,
  toothTreatments,
  handleToothTreatmentChange,
  originalToothTreatments,
  handleRestoreAiSuggestion,
  hasInventory,
  patients,
  dsdResult,
  selectedPatientId,
  patientBirthDate,
  handlePatientBirthDateChange,
  dobValidationError,
  setDobValidationError,
  patientPreferences,
  handlePatientSelect,
}: ReviewStepWrapperProps) {
  return (
    <div className={`wizard-step-${stepDirection}`}>
      <div className="wizard-stage">
        <ReviewAnalysisStep
          analysisResult={analysisResult}
          formData={formData}
          onFormChange={updateFormData}
          imageBase64={imageBase64}
          onReanalyze={handleReanalyze}
          isReanalyzing={isReanalyzing}
          selectedTeeth={selectedTeeth}
          onSelectedTeethChange={setSelectedTeeth}
          toothTreatments={toothTreatments}
          onToothTreatmentChange={handleToothTreatmentChange}
          originalToothTreatments={originalToothTreatments}
          onRestoreAiSuggestion={handleRestoreAiSuggestion}
          hasInventory={hasInventory}
          patients={patients}
          dsdObservations={dsdResult?.analysis?.observations}
          dsdSuggestions={dsdResult?.analysis?.suggestions}
          selectedPatientId={selectedPatientId}
          patientBirthDate={patientBirthDate}
          onPatientBirthDateChange={handlePatientBirthDateChange}
          dobError={dobValidationError}
          onDobErrorChange={setDobValidationError}
          whiteningLevel={patientPreferences.whiteningLevel}
          onPatientSelect={handlePatientSelect}
        />
      </div>
    </div>
  );
});
