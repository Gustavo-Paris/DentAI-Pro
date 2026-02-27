import { useState, useCallback, useRef } from 'react';
import type {
  PhotoAnalysisResult,
  ReviewFormData,
} from '@/types/wizard';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import { trackEvent } from '@/lib/analytics';
import { withRetry } from '@/lib/retry';
import { classifyEdgeFunctionError } from '@/lib/edge-function-errors';
import { wizard as wizardData } from '@/data';
import { compressBase64ForAnalysis } from '@/lib/imageUtils';
import { isAnterior } from './helpers';

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export interface UsePhotoAnalysisParams {
  userId: string | undefined;
  imageBase64: string | null;
  formData: ReviewFormData;
  setFormData: React.Dispatch<React.SetStateAction<ReviewFormData>>;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  isQuickCaseRef: React.RefObject<boolean>;
  canUseCredits: (operation: string) => boolean;
  confirmCreditUse: (
    operation: string,
    operationLabel: string,
    costOverride?: number,
  ) => Promise<boolean>;
  fullFlowCreditsConfirmedRef: React.RefObject<boolean>;
  analysisAbortedRef: React.MutableRefObject<boolean>;
  invokeFunction: <T = unknown>(
    functionName: string,
    options?: { body?: Record<string, unknown>; headers?: Record<string, string> },
  ) => Promise<{ data: T | null; error: Error | null }>;
  getCreditCost: (operation: string) => number;
  refreshSubscription: () => void;
  navigate: (path: string) => void;
  setAnalysisResult: React.Dispatch<React.SetStateAction<PhotoAnalysisResult | null>>;
  /** Patient whitening preference — when non-natural, protects vitaShade from AI override */
  patientWhiteningLevel?: 'natural' | 'hollywood';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface PrimaryToothData {
  tooth?: string;
  tooth_region?: string;
  cavity_class?: string;
  restoration_size?: string;
  substrate?: string;
  substrate_condition?: string;
  enamel_condition?: string;
  depth?: string;
}

/**
 * Maps AI-detected primary tooth data into ReviewFormData fields.
 * Shared between initial analysis and re-analysis flows.
 */
function mapAnalysisToFormData(
  primaryToothData: PrimaryToothData,
  vitaShade: string | undefined,
  vitaShadeManuallySet: boolean,
  patientWhiteningLevel: string | undefined,
  prev: ReviewFormData,
): Partial<ReviewFormData> {
  const shouldPreserveShade =
    vitaShadeManuallySet ||
    (patientWhiteningLevel !== undefined && patientWhiteningLevel !== 'natural');

  return {
    tooth: primaryToothData.tooth || prev.tooth,
    toothRegion:
      primaryToothData.tooth_region ||
      (primaryToothData.tooth
        ? isAnterior(primaryToothData.tooth)
          ? 'anterior'
          : 'posterior'
        : prev.toothRegion),
    cavityClass: primaryToothData.cavity_class || prev.cavityClass,
    restorationSize: primaryToothData.restoration_size || prev.restorationSize,
    vitaShade: shouldPreserveShade ? prev.vitaShade : (vitaShade || prev.vitaShade),
    substrate: primaryToothData.substrate || prev.substrate,
    substrateCondition: primaryToothData.substrate_condition || prev.substrateCondition,
    enamelCondition: primaryToothData.enamel_condition || prev.enamelCondition,
    depth: primaryToothData.depth || prev.depth,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePhotoAnalysis({
  userId,
  imageBase64,
  formData,
  setFormData,
  setStep,
  isQuickCaseRef,
  canUseCredits,
  confirmCreditUse,
  fullFlowCreditsConfirmedRef,
  analysisAbortedRef,
  invokeFunction,
  getCreditCost,
  refreshSubscription,
  navigate,
  setAnalysisResult,
  patientWhiteningLevel,
}: UsePhotoAnalysisParams) {
  const { t } = useTranslation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [uploadedPhotoPath, setUploadedPhotoPath] = useState<string | null>(null);

  const vitaShadeManuallySetRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // -------------------------------------------------------------------------
  // Upload
  // -------------------------------------------------------------------------

  const uploadImageToStorage = useCallback(
    async (base64: string): Promise<string | null> => {
      if (!userId) return null;
      try {
        const byteString = atob(base64.split(',')[1]);
        const mimeType = base64.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeType });
        const fileName = await wizardData.uploadPhoto(userId, blob);
        return fileName;
      } catch (error) {
        logger.error('Upload error:', error);
        return null;
      }
    },
    [userId],
  );

  // -------------------------------------------------------------------------
  // Analyze
  // -------------------------------------------------------------------------

  const analyzePhoto = useCallback(async () => {
    if (!imageBase64) return;

    // Full flow credits were already confirmed upfront in goToPreferences
    if (!fullFlowCreditsConfirmedRef.current) {
      if (!canUseCredits('case_analysis')) {
        trackEvent('insufficient_credits', { operation_type: 'case_analysis' });
        toast.error(t('toasts.analysis.insufficientCredits'), {
          action: { label: t('common.viewPlans'), onClick: () => navigate('/pricing') },
        });
        return;
      }

      const confirmed = await confirmCreditUse('case_analysis', t('wizard.creditLabel.photoAnalysis'));
      if (!confirmed) return;
    }

    setStep(3);
    setIsAnalyzing(true);
    setAnalysisError(null);
    analysisAbortedRef.current = false;

    // Create a new AbortController for this analysis run
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const photoPath = await uploadImageToStorage(imageBase64);
      if (photoPath) setUploadedPhotoPath(photoPath);

      // Re-compress for analysis: 1280px/0.80 to keep edge function under memory limits.
      // The original 2048px/0.92 image is preserved for DSD simulation.
      let analysisImage: string;
      try {
        analysisImage = await compressBase64ForAnalysis(imageBase64);
        logger.debug(`Analysis image compressed: ${Math.round(imageBase64.length / 1024)}KB → ${Math.round(analysisImage.length / 1024)}KB`);
      } catch {
        // Fallback to original if compression fails
        analysisImage = imageBase64;
      }

      const { data } = await withRetry(
        async () => {
          // Check if aborted before starting the request
          if (controller.signal.aborted) {
            const abortError = new DOMException('Analysis aborted by user', 'AbortError');
            throw abortError;
          }

          const result = await Promise.race([
            invokeFunction<{ analysis: PhotoAnalysisResult }>(
              'analyze-dental-photo',
              { body: { imageBase64: analysisImage, imageType: 'intraoral' } },
            ),
            new Promise<never>((_, reject) => {
              if (controller.signal.aborted) {
                reject(new DOMException('Analysis aborted by user', 'AbortError'));
                return;
              }
              controller.signal.addEventListener('abort', () => {
                reject(new DOMException('Analysis aborted by user', 'AbortError'));
              }, { once: true });
            }),
          ]);
          if (result.error) throw result.error;
          return result;
        },
        {
          maxRetries: 2,
          baseDelay: 3000,
          onRetry: (attempt) => {
            // Don't retry if aborted
            if (controller.signal.aborted) {
              throw new DOMException('Analysis aborted by user', 'AbortError');
            }
            logger.warn(`Analysis retry attempt ${attempt}`);
            toast.info(t('toasts.analysis.reconnecting'), { duration: 3000 });
          },
        },
      );

      // If user cancelled while request was in-flight, discard result
      if (analysisAbortedRef.current || controller.signal.aborted) {
        analysisAbortedRef.current = false;
        return;
      }

      if (data?.analysis) {
        const analysis = data.analysis as PhotoAnalysisResult;
        setAnalysisResult(analysis);

        const primaryToothData =
          analysis.detected_teeth?.find((dt) => dt.tooth === analysis.primary_tooth) ||
          analysis.detected_teeth?.[0];

        if (primaryToothData) {
          setFormData((prev) => ({
            ...prev,
            ...mapAnalysisToFormData(
              primaryToothData,
              analysis.vita_shade,
              vitaShadeManuallySetRef.current,
              patientWhiteningLevel,
              prev,
            ),
          }));
        } else if (analysis.vita_shade && !vitaShadeManuallySetRef.current && (!patientWhiteningLevel || patientWhiteningLevel === 'natural')) {
          setFormData((prev) => ({ ...prev, vitaShade: analysis.vita_shade || prev.vitaShade }));
        }

        setIsAnalyzing(false);
        const cost = getCreditCost('case_analysis');
        toast.success(t('toasts.analysis.completed'), { description: t('toasts.analysis.creditUsed', { count: cost }) });
        refreshSubscription();

        // Warn if photo quality is insufficient for DSD simulation
        if (typeof analysis.dsd_simulation_suitability === 'number' && analysis.dsd_simulation_suitability < 55) {
          toast.warning(t('toasts.analysis.photoQualityWarning'), { duration: 8000 });
        }

        setStep(isQuickCaseRef.current ? 5 : 4);
      } else {
        throw new Error('Análise não retornou dados');
      }
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string; name?: string; status?: number };

      // User-initiated abort — exit silently without error toast or state change
      if (err.name === 'AbortError' || controller.signal.aborted) {
        logger.debug('Analysis aborted by user');
        return;
      }

      logger.error('Analysis error:', error);

      const errorType = classifyEdgeFunctionError(error);
      let errorMessage: string;

      switch (errorType) {
        case 'rate_limited':
          errorMessage = t('toasts.analysis.rateLimitRetry');
          break;
        case 'insufficient_credits':
          errorMessage = t('toasts.analysis.insufficientCreditsError');
          refreshSubscription();
          break;
        case 'no_data':
          errorMessage = t('toasts.analysis.noDataError');
          break;
        case 'connection':
          errorMessage = t('toasts.analysis.connectionError');
          break;
        case 'resource_limit':
          errorMessage = t('toasts.analysis.resourceError');
          break;
        case 'server':
          errorMessage = t('toasts.analysis.serverError');
          break;
        default:
          errorMessage = t('toasts.analysis.genericError');
      }

      setAnalysisError(errorMessage);
      setIsAnalyzing(false);
    } finally {
      abortControllerRef.current = null;
    }
  }, [
    imageBase64,
    canUseCredits,
    confirmCreditUse,
    navigate,
    uploadImageToStorage,
    invokeFunction,
    getCreditCost,
    refreshSubscription,
    fullFlowCreditsConfirmedRef,
    isQuickCaseRef,
    setStep,
    setFormData,
    setAnalysisResult,
    patientWhiteningLevel,
  ]);

  // -------------------------------------------------------------------------
  // Abort
  // -------------------------------------------------------------------------

  const abortAnalysis = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  // -------------------------------------------------------------------------
  // Reanalyze
  // -------------------------------------------------------------------------

  const handleReanalyze = useCallback(async () => {
    if (!imageBase64) return;

    if (!canUseCredits('case_analysis')) {
      toast.error(t('toasts.analysis.insufficientReanalyze'), {
        action: { label: t('common.viewPlans'), onClick: () => navigate('/pricing') },
      });
      return;
    }

    setIsReanalyzing(true);
    try {
      // Re-compress for analysis (same as analyzePhoto)
      let analysisImage: string;
      try {
        analysisImage = await compressBase64ForAnalysis(imageBase64);
      } catch {
        analysisImage = imageBase64;
      }

      const { data } = await withRetry(
        async () => {
          const result = await invokeFunction<{ analysis: PhotoAnalysisResult }>(
            'analyze-dental-photo',
            { body: { imageBase64: analysisImage, imageType: 'intraoral' } },
          );
          if (result.error) throw result.error;
          return result;
        },
        {
          maxRetries: 2,
          baseDelay: 3000,
          onRetry: (attempt) => {
            logger.warn(`Reanalysis retry attempt ${attempt}`);
            toast.info(t('toasts.analysis.reconnecting'), { duration: 3000 });
          },
        },
      );

      if (data?.analysis) {
        const analysis = data.analysis as PhotoAnalysisResult;
        setAnalysisResult(analysis);

        const primaryToothData =
          analysis.detected_teeth?.find((dt) => dt.tooth === analysis.primary_tooth) ||
          analysis.detected_teeth?.[0];

        if (primaryToothData) {
          setFormData((prev) => ({
            ...prev,
            ...mapAnalysisToFormData(
              primaryToothData,
              analysis.vita_shade,
              vitaShadeManuallySetRef.current,
              patientWhiteningLevel,
              prev,
            ),
          }));
        }

        refreshSubscription();
        toast.success(t('toasts.analysis.reanalysisCompleted'), {
          description: t('toasts.analysis.teethDetected', { count: analysis.detected_teeth?.length || 0 }),
        });
      }
    } catch (error: unknown) {
      logger.error('Reanalysis error:', error);
      const errorType = classifyEdgeFunctionError(error);
      if (errorType === 'rate_limited') {
        toast.error(t('toasts.analysis.rateLimit'));
      } else if (errorType === 'insufficient_credits') {
        toast.error(t('toasts.analysis.insufficientReanalysis'), {
          action: { label: t('common.viewPlans'), onClick: () => navigate('/pricing') },
        });
        refreshSubscription();
      } else {
        toast.error(t('toasts.analysis.reanalysisError'));
      }
    } finally {
      setIsReanalyzing(false);
    }
  }, [imageBase64, canUseCredits, navigate, invokeFunction, refreshSubscription, setFormData, setAnalysisResult, patientWhiteningLevel, t]);

  return {
    isAnalyzing,
    isReanalyzing,
    analysisError,
    uploadedPhotoPath,
    vitaShadeManuallySetRef,
    setAnalysisError,
    setIsAnalyzing,
    setUploadedPhotoPath,
    analyzePhoto,
    abortAnalysis,
    handleReanalyze,
  };
}
