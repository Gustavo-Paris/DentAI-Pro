import { useState, useCallback, useRef } from 'react';
import type {
  PhotoAnalysisResult,
  ReviewFormData,
} from '@/components/wizard/ReviewAnalysisStep';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import { withRetry } from '@/lib/retry';
import { wizard as wizardData } from '@/data';
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
        toast.error(t('toasts.analysis.insufficientCredits'), {
          action: { label: t('common.viewPlans'), onClick: () => navigate('/pricing') },
        });
        return;
      }

      const confirmed = await confirmCreditUse('case_analysis', 'Análise com IA');
      if (!confirmed) return;
    }

    setStep(3);
    setIsAnalyzing(true);
    setAnalysisError(null);
    analysisAbortedRef.current = false;

    try {
      const photoPath = await uploadImageToStorage(imageBase64);
      if (photoPath) setUploadedPhotoPath(photoPath);

      const { data } = await withRetry(
        async () => {
          const result = await invokeFunction<{ analysis: PhotoAnalysisResult }>(
            'analyze-dental-photo',
            { body: { imageBase64, imageType: 'intraoral' } },
          );
          if (result.error) throw result.error;
          return result;
        },
        {
          maxRetries: 2,
          baseDelay: 3000,
          onRetry: (attempt) => {
            logger.warn(`Analysis retry attempt ${attempt}`);
            toast.info(t('toasts.analysis.reconnecting'), { duration: 3000 });
          },
        },
      );

      // If user cancelled while request was in-flight, discard result
      if (analysisAbortedRef.current) {
        analysisAbortedRef.current = false;
        return;
      }

      if (data?.analysis) {
        const analysis = data.analysis as PhotoAnalysisResult;
        setAnalysisResult(analysis);

        const primaryToothData =
          analysis.detected_teeth?.find((t) => t.tooth === analysis.primary_tooth) ||
          analysis.detected_teeth?.[0];

        if (primaryToothData) {
          setFormData((prev) => ({
            ...prev,
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
            // Only update vitaShade from AI if user hasn't manually overridden it
            // and whitening preference is 'natural' (non-natural implies specific shade target)
            vitaShade: (vitaShadeManuallySetRef.current || (patientWhiteningLevel && patientWhiteningLevel !== 'natural'))
              ? prev.vitaShade
              : (analysis.vita_shade || prev.vitaShade),
            substrate: primaryToothData.substrate || prev.substrate,
            substrateCondition: primaryToothData.substrate_condition || prev.substrateCondition,
            enamelCondition: primaryToothData.enamel_condition || prev.enamelCondition,
            depth: primaryToothData.depth || prev.depth,
          }));
        } else if (analysis.vita_shade && !vitaShadeManuallySetRef.current && (!patientWhiteningLevel || patientWhiteningLevel === 'natural')) {
          setFormData((prev) => ({ ...prev, vitaShade: analysis.vita_shade || prev.vitaShade }));
        }

        setIsAnalyzing(false);
        const cost = getCreditCost('case_analysis');
        toast.success(t('toasts.analysis.completed'), { description: t('toasts.analysis.creditUsed', { count: cost }) });
        refreshSubscription();
        setStep(isQuickCaseRef.current ? 5 : 4);
      } else {
        throw new Error('Análise não retornou dados');
      }
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string; name?: string; debug?: string; status?: number };
      logger.error('Analysis error:', error);
      console.error('[ANALYSIS DEBUG]', {
        message: err.message,
        code: err.code,
        name: err.name,
        status: err.status,
        debug: err.debug,
      });

      let errorMessage: string;
      const isNetwork =
        err.name === 'AbortError' ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('network') ||
        err.message?.includes('timeout');

      if (err.message?.includes('429') || err.code === 'RATE_LIMITED') {
        errorMessage = t('toasts.analysis.rateLimitRetry');
      } else if (
        err.message?.includes('402') ||
        err.code === 'INSUFFICIENT_CREDITS' ||
        err.code === 'PAYMENT_REQUIRED'
      ) {
        errorMessage = t('toasts.analysis.insufficientCreditsError');
        refreshSubscription();
      } else if (err.message?.includes('não retornou dados')) {
        errorMessage = t('toasts.analysis.noDataError');
      } else if (isNetwork) {
        errorMessage = t('toasts.analysis.connectionError');
      } else if (err.message?.includes('500') || err.message?.includes('edge function')) {
        errorMessage = t('toasts.analysis.serverError');
      } else {
        errorMessage = t('toasts.analysis.genericError');
      }

      // Append debug info for diagnosis (temporary)
      const debugInfo = err.debug || err.message || err.name || '';
      if (debugInfo) {
        errorMessage += `\n\n[Debug: ${debugInfo}]`;
      }

      setAnalysisError(errorMessage);
      setIsAnalyzing(false);
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
      const { data } = await withRetry(
        async () => {
          const result = await invokeFunction<{ analysis: PhotoAnalysisResult }>(
            'analyze-dental-photo',
            { body: { imageBase64, imageType: 'intraoral' } },
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
          analysis.detected_teeth?.find((t) => t.tooth === analysis.primary_tooth) ||
          analysis.detected_teeth?.[0];

        if (primaryToothData) {
          setFormData((prev) => ({
            ...prev,
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
            // Only update vitaShade from AI if user hasn't manually overridden it
            // and whitening preference is 'natural' (non-natural implies specific shade target)
            vitaShade: (vitaShadeManuallySetRef.current || (patientWhiteningLevel && patientWhiteningLevel !== 'natural'))
              ? prev.vitaShade
              : (analysis.vita_shade || prev.vitaShade),
            substrate: primaryToothData.substrate || prev.substrate,
            substrateCondition: primaryToothData.substrate_condition || prev.substrateCondition,
            enamelCondition: primaryToothData.enamel_condition || prev.enamelCondition,
            depth: primaryToothData.depth || prev.depth,
          }));
        }

        refreshSubscription();
        toast.success(t('toasts.analysis.reanalysisCompleted'), {
          description: t('toasts.analysis.teethDetected', { count: analysis.detected_teeth?.length || 0 }),
        });
      }
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      logger.error('Reanalysis error:', error);
      if (err.message?.includes('429') || err.code === 'RATE_LIMITED') {
        toast.error(t('toasts.analysis.rateLimit'));
      } else if (
        err.message?.includes('402') ||
        err.code === 'INSUFFICIENT_CREDITS' ||
        err.code === 'PAYMENT_REQUIRED'
      ) {
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
  }, [imageBase64, canUseCredits, navigate, invokeFunction, refreshSubscription, setFormData, setAnalysisResult]);

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
    handleReanalyze,
  };
}
