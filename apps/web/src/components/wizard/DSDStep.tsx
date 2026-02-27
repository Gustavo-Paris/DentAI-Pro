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
import { useEffect, useRef, useCallback, useState, lazy, Suspense } from 'react';
import { trackEvent } from '@/lib/analytics';
import { useDSDStep } from './dsd/useDSDStep';
import { DSDLoadingState } from './dsd/DSDLoadingState';
import { DSDErrorState } from './dsd/DSDErrorState';
import { DSDPhotoQualityGate } from './dsd/DSDPhotoQualityGate';
const DSDAnalysisView = lazy(() => import('./dsd/DSDAnalysisView'));
import { DSDInitialState } from './dsd/DSDInitialState';
import { ComponentSkeleton } from '@/components/ui/skeleton-wrapper';

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
  /** 0-100 score from photo analysis: how suitable the photo is for DSD image editing */
  photoQualityScore?: number;
  /** Called whenever the DSD result changes (analysis complete, simulation ready, etc.) so the parent can persist it in drafts */
  onResultChange?: (result: DSDResult | null) => void;
  /** Called when user changes whitening level in E4 comparison */
  onPreferencesChange?: (prefs: PatientPreferences) => void;
}

const PHOTO_QUALITY_THRESHOLD = 55;

export function DSDStep(props: DSDStepProps) {
  const state = useDSDStep(props);
  const hasFiredStartRef = useRef(false);
  const [qualityBypassed, setQualityBypassed] = useState(false);

  const isLowQuality = typeof props.photoQualityScore === 'number' && props.photoQualityScore < PHOTO_QUALITY_THRESHOLD;

  const handleToggleAnnotations = useCallback(
    () => state.setShowAnnotations(prev => !prev),
    [state.setShowAnnotations]
  );

  const handleCloseWhiteningComparison = useCallback(
    () => state.setShowWhiteningComparison(false),
    [state.setShowWhiteningComparison]
  );

  const handleGenerateAllLayers = useCallback(
    () => state.generateAllLayers(),
    [state.generateAllLayers]
  );

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
        errorCode={state.errorCode ?? undefined}
        onRetry={state.handleRetry}
        onSkip={state.onSkip}
      />
    );
  }

  // Result state
  if (state.result) {
    return (
      <Suspense fallback={<ComponentSkeleton height="600px" />}>
      <DSDAnalysisView
        result={state.result}
        imageBase64={state.imageBase64}
        simulationImageUrl={state.simulationImageUrl}
        isSimulationGenerating={state.isSimulationGenerating}
        simulationError={state.simulationError}
        layers={state.layers}
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
        visibleProportionLayers={state.visibleProportionLayers}
        onToggleProportionLayer={state.toggleProportionLayer}
        showWhiteningComparison={state.showWhiteningComparison}
        whiteningComparison={state.whiteningComparison}
        isComparingWhitening={state.isComparingWhitening}
        patientPreferences={state.patientPreferences}
        determineLayersNeeded={state.determineLayersNeeded}
        onSelectLayer={state.handleSelectLayer}
        onRetryFailedLayer={state.retryFailedLayer}
        onRegenerateSimulation={state.handleRegenerateSimulation}
        onToggleAnnotations={handleToggleAnnotations}
        onGenerateWhiteningComparison={state.generateWhiteningComparison}
        onCloseWhiteningComparison={handleCloseWhiteningComparison}
        onSelectWhiteningLevel={state.handleSelectWhiteningLevel}
        onGenerateAllLayers={handleGenerateAllLayers}
        onRetry={state.handleRetry}
        onContinue={state.handleContinue}
        gingivoplastyApproved={state.gingivoplastyApproved}
        hasGingivoSuggestion={state.result?.analysis ? state.hasGingivoSuggestion(state.result.analysis) : false}
        onApproveGingivoplasty={state.handleApproveGingivoplasty}
        onDiscardGingivoplasty={state.handleDiscardGingivoplasty}
        hasFacePhoto={state.hasFacePhoto}
        isFaceMockupGenerating={state.isFaceMockupGenerating}
        faceMockupError={state.faceMockupError}
        onGenerateFaceMockup={state.generateFaceMockup}
        facePhotoBase64={props.additionalPhotos?.face || null}
      />
      </Suspense>
    );
  }

  // Photo quality gate — show BEFORE initial state when photo is unsuitable for simulation
  if (isLowQuality && !qualityBypassed && !state.result) {
    return (
      <DSDPhotoQualityGate
        onGenerateAnyway={() => {
          setQualityBypassed(true);
          trackEvent('dsd_quality_gate_bypassed', { score: props.photoQualityScore });
        }}
        onSkip={state.onSkip}
      />
    );
  }

  // Initial state — show confirmation button when image is available
  return (
    <DSDInitialState
      onSkip={state.onSkip}
      hasImage={!!state.imageBase64}
      onConfirmDSD={state.confirmDSD}
    />
  );
}
