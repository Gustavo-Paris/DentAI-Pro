import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getSignedDSDUrl } from '@/data/storage';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/hooks/useSubscription';
import { logger } from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';
import { classifyEdgeFunctionError } from '@/lib/edge-function-errors';
import { TIMING } from '@/lib/constants';
import { useDSDFaceMockup } from './useDSDFaceMockup';
import { useDSDLayerGeneration } from './useDSDLayerGeneration';
import { useDSDGingivoplasty } from './useDSDGingivoplasty';
import { useDSDWhitening } from './useDSDWhitening';
import type {
  DSDResult,
  ToothBoundsPct,
  AdditionalPhotos,
  PatientPreferences,
  DetectedToothForMask,
  ClinicalToothFinding,
} from '@/types/dsd';

export interface DSDStepProps {
  imageBase64: string | null;
  onComplete: (result: DSDResult | null) => void;
  onSkip: () => void;
  additionalPhotos?: AdditionalPhotos;
  patientPreferences?: PatientPreferences;
  detectedTeeth?: DetectedToothForMask[];
  initialResult?: DSDResult | null;
  clinicalObservations?: string[];
  clinicalTeethFindings?: ClinicalToothFinding[];
  photoQualityScore?: number;
  onResultChange?: (result: DSDResult | null) => void;
  onPreferencesChange?: (prefs: PatientPreferences) => void;
}

export function useDSDStep({
  imageBase64,
  onComplete,
  onSkip,
  additionalPhotos,
  patientPreferences,
  detectedTeeth,
  initialResult,
  clinicalObservations,
  clinicalTeethFindings,
  photoQualityScore,
  onResultChange,
  onPreferencesChange,
}: DSDStepProps) {
  // -------------------------------------------------------------------------
  // Core state
  // -------------------------------------------------------------------------
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<DSDResult | null>(initialResult || null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [dsdConfirmed, setDsdConfirmed] = useState(!!initialResult);
  const [simulationImageUrl, setSimulationImageUrl] = useState<string | null>(null);
  const [isRegeneratingSimulation, setIsRegeneratingSimulation] = useState(false);
  const [isCompositing, setIsCompositing] = useState(false);

  // E5: Annotations
  const [showAnnotations, setShowAnnotations] = useState(false);
  const annotationContainerRef = useRef<HTMLDivElement>(null);
  const [annotationDimensions, setAnnotationDimensions] = useState({ width: 0, height: 0 });

  const { invokeFunction } = useAuthenticatedFetch();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { canUseCredits, refreshSubscription, getCreditCost } = useSubscription();

  const analysisSteps = useMemo(() => [
    { label: t('dsd.detectingLandmarks'), duration: 2000 },
    { label: t('dsd.analyzingProportions'), duration: 3000 },
    { label: t('dsd.calculatingGolden'), duration: 2000 },
    { label: t('dsd.evaluatingSymmetry'), duration: 2000 },
  ], [t]);

  const lastCompositeSourcePathRef = useRef<string | null>(null);
  const analysisStartedRef = useRef(!!initialResult);

  // -------------------------------------------------------------------------
  // Shared state: gingivoplastyApproved (needed by both layer gen and gingivo hooks)
  // -------------------------------------------------------------------------
  const [gingivoplastyApproved, setGingivoplastyApproved] = useState<boolean | null>(
    initialResult?.layers?.some(l => l.type === 'complete-treatment') ? true : null
  );

  // -------------------------------------------------------------------------
  // Sub-hooks: Layer Generation
  // -------------------------------------------------------------------------
  const layerGen = useDSDLayerGeneration({
    imageBase64,
    patientPreferences,
    gingivoplastyApproved,
    initialResult,
    invokeFunction,
    setSimulationImageUrl,
    setResult,
  });

  // -------------------------------------------------------------------------
  // Sub-hooks: Gingivoplasty (approval flow using layer gen primitives)
  // -------------------------------------------------------------------------
  const gingivo = useDSDGingivoplasty({
    imageBase64,
    result,
    gingivoplastyApproved,
    setGingivoplastyApproved,
    layerUrls: layerGen.layerUrls,
    generateSingleLayer: layerGen.generateSingleLayer,
    resolveLayerUrl: layerGen.resolveLayerUrl,
    setLayers: layerGen.setLayers,
    setLayerUrls: layerGen.setLayerUrls,
    setActiveLayerIndex: layerGen.setActiveLayerIndex,
    setFailedLayers: layerGen.setFailedLayers,
    setResult,
    setRetryingLayer: () => {}, // Bridge: layer gen owns retryingLayer state
  });

  // -------------------------------------------------------------------------
  // Sub-hooks: Whitening
  // -------------------------------------------------------------------------
  const whitening = useDSDWhitening({
    imageBase64,
    patientPreferences,
    result,
    layerUrls: layerGen.layerUrls,
    simulationImageUrl,
    invokeFunction,
    setLayers: layerGen.setLayers,
    setLayerUrls: layerGen.setLayerUrls,
    setActiveLayerIndex: layerGen.setActiveLayerIndex,
    setSimulationImageUrl,
    onPreferencesChange,
  });

  // -------------------------------------------------------------------------
  // Sub-hooks: Face Mockup
  // -------------------------------------------------------------------------
  const faceMockup = useDSDFaceMockup({
    additionalPhotos,
    analysis: result?.analysis ?? null,
    patientPreferences,
    invokeFunction,
    resolveLayerUrl: layerGen.resolveLayerUrl,
    setLayers: layerGen.setLayers,
    setLayerUrls: layerGen.setLayerUrls,
    setActiveLayerIndex: layerGen.setActiveLayerIndex,
    setSimulationImageUrl,
    setResult,
  });

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------

  // Propagate result changes to parent for draft auto-save
  useEffect(() => {
    onResultChange?.(result);
  }, [result, onResultChange]);

  // Load signed URL for simulation
  useEffect(() => {
    const loadSimulationUrl = async () => {
      if (result?.simulation_url) {
        const signedUrl = await getSignedDSDUrl(result.simulation_url);
        if (signedUrl) {
          setSimulationImageUrl(signedUrl);
        }
      }
    };
    loadSimulationUrl();
  }, [result?.simulation_url]);

  // Measure annotation container
  useEffect(() => {
    if (!annotationContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setAnnotationDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(annotationContainerRef.current);
    return () => observer.disconnect();
  }, []);

  const toothBounds = useMemo(() => {
    const bounds = (detectedTeeth || [])
      .map((t) => t.tooth_bounds)
      .filter(Boolean) as ToothBoundsPct[];
    return bounds.filter((b) =>
      Number.isFinite(b.x) && Number.isFinite(b.y) && Number.isFinite(b.width) && Number.isFinite(b.height) &&
      b.width > 0 && b.height > 0
    );
  }, [detectedTeeth]);

  // -------------------------------------------------------------------------
  // Core: DSD Analysis
  // -------------------------------------------------------------------------

  const analyzeDSD = useCallback(async (retryCount = 0) => {
    const MAX_RETRIES = 2;
    let didRetry = false;
    let hasError = false;

    if (!imageBase64) {
      setError(t('errors.noImageAvailable'));
      return;
    }

    if (!canUseCredits('dsd_simulation')) {
      setError(t('errors.insufficientCredits'));
      setErrorCode('INSUFFICIENT_CREDITS');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setErrorCode(null);
    setCurrentStep(0);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < analysisSteps.length - 1) return prev + 1;
        return prev;
      });
    }, 2500);

    try {
      const requestBody: Record<string, unknown> = {
        reqId: crypto.randomUUID(),
        imageBase64,
        toothShape: 'natural',
        analysisOnly: true,
      };

      if (additionalPhotos?.smile45 || additionalPhotos?.face) {
        requestBody.additionalPhotos = {
          smile45: additionalPhotos.smile45 || undefined,
          face: additionalPhotos.face || undefined,
        };
      }

      if (patientPreferences?.whiteningLevel) {
        requestBody.patientPreferences = {
          whiteningLevel: patientPreferences.whiteningLevel,
        };
      }

      if (clinicalObservations?.length) {
        requestBody.clinicalObservations = clinicalObservations;
      }

      if (clinicalTeethFindings?.length) {
        requestBody.clinicalTeethFindings = clinicalTeethFindings;
      }

      const { data, error: fnError } = await invokeFunction<DSDResult>('generate-dsd', {
        body: requestBody,
      });

      clearInterval(stepInterval);

      if (fnError) throw fnError;

      if (data?.analysis) {
        setResult(data);
        setIsAnalyzing(false);
        const dsdCost = getCreditCost('dsd_simulation');
        toast.success(t('toasts.dsd.analysisCompleted'), {
          description: t('toasts.dsd.creditsUsed', { count: dsdCost }),
        });
        refreshSubscription();
        layerGen.generateAllLayers(data.analysis);
      } else {
        throw new Error(t('errors.noAnalysisData'));
      }
    } catch (error: unknown) {
      clearInterval(stepInterval);
      logger.error('DSD error:', error);

      const err = error as { name?: string; message?: string; code?: string; status?: number };
      const errorType = classifyEdgeFunctionError(error);

      const isConnectionError = errorType === 'connection' ||
        err.name === 'AbortError' ||
        err.name === 'FunctionsFetchError';

      if (isConnectionError && retryCount < MAX_RETRIES) {
        logger.debug(`DSD retry ${retryCount + 1}/${MAX_RETRIES}...`);
        didRetry = true;
        toast.info(t('toasts.dsd.reconnecting', { count: retryCount + 1 }));
        await new Promise(r => setTimeout(r, TIMING.DSD_RETRY_DELAY));
        return analyzeDSD(retryCount + 1);
      }

      hasError = true;
      switch (errorType) {
        case 'rate_limited':
          setError(t('errors.rateLimitExceeded'));
          setErrorCode('RATE_LIMITED');
          break;
        case 'insufficient_credits':
          setError(t('errors.insufficientCredits'));
          setErrorCode('INSUFFICIENT_CREDITS');
          refreshSubscription();
          break;
        case 'connection':
          setError(t('errors.connectionError'));
          break;
        default: {
          const serverMsg = err.message && !err.message.includes('non-2xx') ? err.message : null;
          setError(serverMsg || t('errors.dsdGenerationFailed'));
        }
      }
      setIsAnalyzing(false);
    } finally {
      clearInterval(stepInterval);
      if (!didRetry && !hasError) {
        setIsAnalyzing(false);
      }
    }
  }, [imageBase64, canUseCredits, invokeFunction, refreshSubscription, getCreditCost, layerGen.generateAllLayers, additionalPhotos, patientPreferences, clinicalObservations, clinicalTeethFindings, analysisSteps.length, t]);

  // Auto-start analysis
  useEffect(() => {
    if (imageBase64 && !analysisStartedRef.current && dsdConfirmed) {
      analysisStartedRef.current = true;
      analyzeDSD();
    }
  }, [imageBase64, dsdConfirmed, analyzeDSD]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleRetry = () => {
    setResult(null);
    setError(null);
    setSimulationImageUrl(null);
    layerGen.setSimulationError(false);
    layerGen.setLayers([]);
    layerGen.setLayerUrls({});
    layerGen.setActiveLayerIndex(0);
    layerGen.setFailedLayers([]);
    whitening.setShowWhiteningComparison(false);
    lastCompositeSourcePathRef.current = null;
    analysisStartedRef.current = false;
    analyzeDSD();
  };

  const handleRegenerateSimulation = async () => {
    if (!imageBase64 || !result?.analysis) return;

    setIsRegeneratingSimulation(true);
    layerGen.setSimulationError(false);
    layerGen.setFailedLayers([]);
    lastCompositeSourcePathRef.current = null;

    try {
      layerGen.setLayers([]);
      layerGen.setLayerUrls({});
      layerGen.setActiveLayerIndex(0);
      await layerGen.generateAllLayers(result.analysis);
      toast.success(t('toasts.dsd.regenerated'));
    } catch (error: unknown) {
      logger.error('Regenerate simulation error:', error);
      toast.error(t('toasts.dsd.regenerateError'));
    } finally {
      setIsRegeneratingSimulation(false);
    }
  };

  const handleContinue = () => {
    const resultWithGingivo = result
      ? { ...result, gingivoplastyApproved: gingivo.gingivoplastyApproved ?? undefined }
      : result;
    onComplete(resultWithGingivo);
  };

  const confirmDSD = useCallback(() => {
    setDsdConfirmed(true);
  }, []);

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    // State
    isAnalyzing,
    currentStep,
    result,
    error,
    errorCode,
    simulationImageUrl,
    isRegeneratingSimulation,
    isCompositing,
    isSimulationGenerating: layerGen.isSimulationGenerating,
    simulationError: layerGen.simulationError,
    layers: layerGen.layers,
    layerUrls: layerGen.layerUrls,
    activeLayerIndex: layerGen.activeLayerIndex,
    layersGenerating: layerGen.layersGenerating,
    layerGenerationProgress: layerGen.layerGenerationProgress,
    failedLayers: layerGen.failedLayers,
    retryingLayer: layerGen.retryingLayer,
    whiteningComparison: whitening.whiteningComparison,
    isComparingWhitening: whitening.isComparingWhitening,
    showWhiteningComparison: whitening.showWhiteningComparison,
    gingivoplastyApproved: gingivo.gingivoplastyApproved,
    dsdConfirmed,
    isFaceMockupGenerating: faceMockup.isFaceMockupGenerating,
    faceMockupError: faceMockup.faceMockupError,
    showAnnotations,
    annotationContainerRef,
    annotationDimensions,
    toothBounds,

    // Derived
    analysisSteps,
    determineLayersNeeded: gingivo.determineLayersNeeded,
    hasGingivoSuggestion: gingivo.hasGingivoSuggestion,
    hasFacePhoto: faceMockup.hasFacePhoto,

    // Actions
    handleRetry,
    handleRegenerateSimulation,
    handleContinue,
    generateWhiteningComparison: whitening.generateWhiteningComparison,
    generateAllLayers: layerGen.generateAllLayers,
    generateFaceMockup: faceMockup.generateFaceMockup,
    retryFailedLayer: (layerType: Parameters<typeof layerGen.retryFailedLayer>[0]) =>
      layerGen.retryFailedLayer(layerType, result?.analysis),
    setShowAnnotations,
    setShowWhiteningComparison: whitening.setShowWhiteningComparison,
    handleSelectWhiteningLevel: whitening.handleSelectWhiteningLevel,
    handleSelectLayer: layerGen.handleSelectLayer,
    handleApproveGingivoplasty: gingivo.handleApproveGingivoplasty,
    handleDiscardGingivoplasty: gingivo.handleDiscardGingivoplasty,
    confirmDSD,

    // Props pass-through needed by sub-components
    imageBase64,
    onSkip,
    patientPreferences,
  };
}

export type UseDSDStepReturn = ReturnType<typeof useDSDStep>;
