/* eslint-disable react-refresh/only-export-components */
import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, ClipboardCheck } from 'lucide-react';
import type { Patient } from '@/components/PatientAutocomplete';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { ComponentSkeleton } from '@/components/ui/skeleton-wrapper';

// Re-export constants for backward compatibility
export { TREATMENT_LABEL_KEYS, TREATMENT_DESC_KEYS } from './review/review-constants';

// Sub-components
import { AiConfidenceBanner } from './review/AiConfidenceBanner';
import { TreatmentBanners } from './review/TreatmentBanners';
import { AnalysisWarnings } from './review/AnalysisWarnings';
const ToothSelectionCard = lazy(() => import('./review/ToothSelectionCard'));
import { PatientDataSection } from './review/PatientDataSection';
import { ReviewFormAccordion } from './review/ReviewFormAccordion';
import { CaseSummaryCard } from './review/CaseSummaryCard';

// Expanded treatment types
export type TreatmentType = 'resina' | 'porcelana' | 'coroa' | 'implante' | 'endodontia' | 'encaminhamento' | 'gengivoplastia' | 'recobrimento_radicular';

// Multi-tooth detection structure
export interface DetectedTooth {
  tooth: string;
  tooth_region: string | null;
  cavity_class: string | null;
  restoration_size: string | null;
  substrate: string | null;
  substrate_condition: string | null;
  enamel_condition: string | null;
  depth: string | null;
  priority: "alta" | "média" | "baixa";
  notes: string | null;
  treatment_indication?: TreatmentType;
  indication_reason?: string;
  tooth_bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PhotoAnalysisResult {
  detected: boolean;
  confidence: number;
  detected_teeth: DetectedTooth[];
  primary_tooth: string | null;
  vita_shade: string | null;
  observations: string[];
  warnings: string[];
  treatment_indication?: TreatmentType;
  indication_reason?: string;
}

export interface ReviewFormData {
  patientName: string;
  patientAge: string;
  tooth: string;
  toothRegion: string;
  cavityClass: string;
  restorationSize: string;
  vitaShade: string;
  substrate: string;
  substrateCondition: string;
  enamelCondition: string;
  depth: string;
  bruxism: boolean;
  aestheticLevel: string;
  budget: string;
  longevityExpectation: string;
  clinicalNotes: string;
  treatmentType: TreatmentType;
}

interface ReviewAnalysisStepProps {
  analysisResult: PhotoAnalysisResult | null;
  formData: ReviewFormData;
  onFormChange: (data: Partial<ReviewFormData>) => void;
  imageBase64: string | null;
  onToothSelect?: (tooth: DetectedTooth) => void;
  onReanalyze?: () => void;
  isReanalyzing?: boolean;
  selectedTeeth?: string[];
  onSelectedTeethChange?: (teeth: string[]) => void;
  toothTreatments?: Record<string, TreatmentType>;
  onToothTreatmentChange?: (tooth: string, treatment: TreatmentType) => void;
  originalToothTreatments?: Record<string, TreatmentType>;
  onRestoreAiSuggestion?: (tooth: string) => void;
  hasInventory?: boolean;
  patients?: Patient[];
  selectedPatientId?: string | null;
  onPatientSelect?: (name: string, patientId?: string, birthDate?: string | null) => void;
  patientBirthDate?: string | null;
  onPatientBirthDateChange?: (date: string | null) => void;
  dobError?: boolean;
  onDobErrorChange?: (hasError: boolean) => void;
  whiteningLevel?: 'natural' | 'white' | 'hollywood';
  dsdObservations?: string[];
  dsdSuggestions?: { tooth: string; current_issue: string; proposed_change: string }[];
}

export function ReviewAnalysisStep({
  analysisResult,
  formData,
  onFormChange,
  imageBase64,
  onReanalyze,
  isReanalyzing = false,
  selectedTeeth = [],
  onSelectedTeethChange,
  toothTreatments = {},
  onToothTreatmentChange,
  originalToothTreatments = {},
  onRestoreAiSuggestion,
  hasInventory = true,
  patients = [],
  selectedPatientId,
  onPatientSelect,
  patientBirthDate,
  onPatientBirthDateChange,
  dobError: externalDobError,
  onDobErrorChange,
  whiteningLevel,
  dsdObservations,
  dsdSuggestions,
}: Omit<ReviewAnalysisStepProps, 'onToothSelect'>) {
  const { t } = useTranslation();
  const [internalDobError, setInternalDobError] = useState(false);
  const speech = useSpeechToText('pt-BR');

  // Append transcript to clinical notes when user stops recording
  const prevListeningRef = useRef(false);
  useEffect(() => {
    if (prevListeningRef.current && !speech.isListening && speech.transcript) {
      const existing = formData.clinicalNotes;
      const separator = existing ? '\n' : '';
      onFormChange({ clinicalNotes: existing + separator + speech.transcript });
    }
    prevListeningRef.current = speech.isListening;
  }, [speech.isListening, speech.transcript, formData.clinicalNotes, onFormChange]);

  // Use external dobError if provided, otherwise use internal state
  const dobError = externalDobError ?? internalDobError;
  const setDobError = (value: boolean) => {
    setInternalDobError(value);
    onDobErrorChange?.(value);
  };

  const detectedTeeth = analysisResult?.detected_teeth || [];
  const hasMultipleTeeth = detectedTeeth.length > 1;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center glow-icon">
          <ClipboardCheck className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold font-display mb-2 neon-text">{t('components.wizard.review.title')}</h2>
        <p className="text-muted-foreground">
          {hasMultipleTeeth
            ? t('components.wizard.review.multiTeethSubtitle', { count: detectedTeeth.length })
            : t('components.wizard.review.singleToothSubtitle')
          }
        </p>
      </div>

      {/* 1. AI Confidence Banner */}
      {analysisResult && (
        <AiConfidenceBanner
          analysisResult={analysisResult}
          onReanalyze={onReanalyze}
          isReanalyzing={isReanalyzing}
        />
      )}

      {/* Treatment banners: whitening, gengivoplasty, inventory, porcelain */}
      <TreatmentBanners
        analysisResult={analysisResult}
        selectedTeeth={selectedTeeth}
        hasInventory={hasInventory}
        whiteningLevel={whiteningLevel}
        dsdSuggestions={dsdSuggestions}
      />

      {/* Warnings */}
      {analysisResult && (
        <AnalysisWarnings analysisResult={analysisResult} />
      )}

      {/* 2. Tooth Selection Cards */}
      {hasMultipleTeeth && (
        <Suspense fallback={<ComponentSkeleton height="280px" />}>
          <ToothSelectionCard
            analysisResult={analysisResult!}
            selectedTeeth={selectedTeeth}
            onSelectedTeethChange={onSelectedTeethChange}
            toothTreatments={toothTreatments}
            onToothTreatmentChange={onToothTreatmentChange}
            originalToothTreatments={originalToothTreatments}
            onRestoreAiSuggestion={onRestoreAiSuggestion}
          />
        </Suspense>
      )}

      {/* 3. Observations */}
      {analysisResult?.observations && analysisResult.observations.length > 0 && (
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-primary/50 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">{t('components.wizard.review.aiObservations')}</p>
              <ul className="space-y-1">
                {analysisResult.observations.map((obs, i) => (
                  <li key={i} className="text-xs text-muted-foreground">• {obs}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 4. Patient Data Card */}
      <PatientDataSection
        formData={formData}
        onFormChange={onFormChange}
        patients={patients}
        selectedPatientId={selectedPatientId}
        onPatientSelect={onPatientSelect}
        patientBirthDate={patientBirthDate}
        onPatientBirthDateChange={onPatientBirthDateChange}
        dobError={dobError}
        setDobError={setDobError}
      />

      {/* 5-7. Collapsible sections */}
      <ReviewFormAccordion
        imageBase64={imageBase64}
        formData={formData}
        onFormChange={onFormChange}
        dsdObservations={dsdObservations}
        dsdSuggestions={dsdSuggestions}
        speech={speech}
      />

      {/* 8. Summary Card */}
      <CaseSummaryCard
        selectedTeeth={selectedTeeth}
        toothTreatments={toothTreatments}
        detectedTeeth={detectedTeeth}
        formData={formData}
        patientBirthDate={patientBirthDate}
      />
    </div>
  );
}
