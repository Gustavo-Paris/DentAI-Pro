import type {
  DSDAnalysis,
  DSDResult,
  DSDSuggestion,
  TreatmentIndication,
  AdditionalPhotos,
  PatientPreferences,
  DetectedToothForMask,
  ClinicalToothFinding,
} from '@/types/dsd';
import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';
import { useDSDStep } from './dsd/useDSDStep';
import { DSDLoadingState } from './dsd/DSDLoadingState';
import { DSDErrorState } from './dsd/DSDErrorState';
import { DSDAnalysisView } from './dsd/DSDAnalysisView';
import { DSDInitialState } from './dsd/DSDInitialState';

// Re-export types for backward compatibility with existing importers
export type { TreatmentIndication, DSDSuggestion, DSDAnalysis, DSDResult };

interface DSDStepProps {
  imageBase64: string | null;
  onComplete: (result: DSDResult | null) => void;
  onSkip: () => void;
  additionalPhotos?: AdditionalPhotos;
  patientPreferences?: PatientPreferences;
  /** Optional: used to post-process the simulation by compositing ONLY the teeth onto the original photo */
  detectedTeeth?: DetectedToothForMask[];
  initialResult?: DSDResult | null; // For restoring from draft
  /** Clinical observations from analyze-dental-photo, passed as context to prevent contradictions */
  clinicalObservations?: string[];
  /** Per-tooth clinical findings to prevent DSD from inventing restorations */
  clinicalTeethFindings?: ClinicalToothFinding[];
  /** Called whenever the DSD result changes (analysis complete, simulation ready, etc.) so the parent can persist it in drafts */
  onResultChange?: (result: DSDResult | null) => void;
  /** Called when user changes whitening level in E4 comparison */
  onPreferencesChange?: (prefs: PatientPreferences) => void;
}

export function DSDStep(props: DSDStepProps) {
  const state = useDSDStep(props);
  const hasFiredStartRef = useRef(false);

  // Track dsd_started once
  useEffect(() => {
    if (!hasFiredStartRef.current) {
      trackEvent('dsd_started');
      hasFiredStartRef.current = true;
    }
  }, []);

  // Loading state
  if (state.isAnalyzing) {
    return (
      <DSDLoadingState
        imageBase64={state.imageBase64}
        currentStep={state.currentStep}
        analysisSteps={state.analysisSteps}
      />
    );
  }

  // Error state
  if (state.error) {
    return (
      <DSDErrorState
        error={state.error}
        onRetry={state.handleRetry}
        onSkip={state.onSkip}
      />
    );
  }

  // Result state
  if (state.result) {
    return (
      <DSDAnalysisView
        result={state.result}
        imageBase64={state.imageBase64}
        simulationImageUrl={state.simulationImageUrl}
        isSimulationGenerating={state.isSimulationGenerating}
        simulationError={state.simulationError}
        layers={state.layers}
        layerUrls={state.layerUrls}
        activeLayerIndex={state.activeLayerIndex}
        layersGenerating={state.layersGenerating}
        layerGenerationProgress={state.layerGenerationProgress}
        failedLayers={state.failedLayers}
        retryingLayer={state.retryingLayer}
        isRegeneratingSimulation={state.isRegeneratingSimulation}
        isCompositing={state.isCompositing}
        showAnnotations={state.showAnnotations}
        toothBounds={state.toothBounds}
        annotationContainerRef={state.annotationContainerRef}
        annotationDimensions={state.annotationDimensions}
        showWhiteningComparison={state.showWhiteningComparison}
        whiteningComparison={state.whiteningComparison}
        isComparingWhitening={state.isComparingWhitening}
        patientPreferences={state.patientPreferences}
        determineLayersNeeded={state.determineLayersNeeded}
        onSelectLayer={state.handleSelectLayer}
        onRetryFailedLayer={state.retryFailedLayer}
        onRegenerateSimulation={state.handleRegenerateSimulation}
        onToggleAnnotations={() => state.setShowAnnotations(prev => !prev)}
        onGenerateWhiteningComparison={state.generateWhiteningComparison}
        onCloseWhiteningComparison={() => state.setShowWhiteningComparison(false)}
        onSelectWhiteningLevel={state.handleSelectWhiteningLevel}
        onGenerateAllLayers={() => state.generateAllLayers()}
        onRetry={state.handleRetry}
        onContinue={state.handleContinue}
        gingivoplastyApproved={state.gingivoplastyApproved}
        hasGingivoSuggestion={state.result?.analysis ? state.hasGingivoSuggestion(state.result.analysis) : false}
        onApproveGingivoplasty={state.handleApproveGingivoplasty}
        onDiscardGingivoplasty={state.handleDiscardGingivoplasty}
      />
    );
  }

  // Initial state
  return <DSDInitialState onSkip={state.onSkip} />;
}
