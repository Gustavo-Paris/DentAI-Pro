import { useEffect, useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, ArrowRight, ArrowLeft, Lightbulb, AlertCircle, X } from 'lucide-react';
import { ProgressRing } from '@/components/ProgressRing';
import { CompactStepIndicator } from '@/components/CompactStepIndicator';
import { trackEvent } from '@/lib/analytics';

interface AnalyzingStepProps {
  imageBase64: string | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  onRetry: () => void;
  onSkipToReview: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

const analysisStepKeys = [
  { id: 1, key: 'step1', duration: 1500 },
  { id: 2, key: 'step2', duration: 2000 },
  { id: 3, key: 'step3', duration: 2500 },
  { id: 4, key: 'step4', duration: 2000 },
  { id: 5, key: 'step5', duration: 1500 },
  { id: 6, key: 'step6', duration: 1000 },
];

export function AnalyzingStep({
  imageBase64,
  isAnalyzing,
  analysisError,
  onRetry,
  onSkipToReview,
  onBack,
  onCancel,
}: AnalyzingStepProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const analysisSteps = useMemo(() => analysisStepKeys.map(s => ({
    ...s,
    label: t(`components.wizard.analyzing.${s.key}`),
  })), [t]);

  // Track when analysis completes (transitions from analyzing to not-analyzing without error)
  const wasAnalyzingRef = useRef(false);
  useEffect(() => {
    if (isAnalyzing) {
      wasAnalyzingRef.current = true;
    } else if (wasAnalyzingRef.current && !analysisError) {
      trackEvent('analysis_completed', { confidence: 0, teeth_count: 0 });
      wasAnalyzingRef.current = false;
    }
  }, [isAnalyzing, analysisError]);

  // Reset animation when analysis starts
  useEffect(() => {
    if (!isAnalyzing) {
      return;
    }

    // Reset states when analysis starts
    setCurrentStep(0);
    setProgress(0);

    let totalElapsed = 0;
    const totalDuration = analysisStepKeys.reduce((sum, s) => sum + s.duration, 0);

    const intervals: ReturnType<typeof setTimeout>[] = [];

    analysisStepKeys.forEach((step, index) => {
      const timeout = setTimeout(() => {
        setCurrentStep(index + 1);
      }, totalElapsed);
      intervals.push(timeout);
      totalElapsed += step.duration;
    });

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95; // Cap at 95% until actual completion
        return prev + 1;
      });
    }, totalDuration / 95);

    return () => {
      intervals.forEach(clearTimeout);
      clearInterval(progressInterval);
    };
  }, [isAnalyzing]);

  // Build step data for CompactStepIndicator
  const compactSteps = useMemo(() => analysisSteps.map((step, index) => ({
    label: step.label.replace('...', ''),
    completed: currentStep > index + 1,
  })), [analysisSteps, currentStep]);
  const activeIndex = Math.max(0, currentStep - 1);
  const currentLabel = currentStep > 0 && currentStep <= analysisSteps.length
    ? analysisSteps[currentStep - 1].label
    : t('components.wizard.analyzing.defaultStep');

  // Friendly error state
  if (analysisError) {
    return (
      <div className="space-y-6" role="alert">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-2xl font-semibold font-display mb-2">{t('components.wizard.analyzing.errorTitle')}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {analysisError}
          </p>
        </div>

        {imageBase64 && (
          <div className="flex justify-center">
            <img
              src={imageBase64}
              alt={t('components.wizard.analyzing.photoSent')}
              className="w-48 h-48 object-cover rounded-xl opacity-75 ring-1 ring-border"
            />
          </div>
        )}

        {/* Contextual hint card with amber border */}
        <div className="border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 rounded-r-lg p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {t('components.wizard.analyzing.hintText')}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="gap-2 btn-press">
              <ArrowLeft className="w-4 h-4" />
              {t('common.back')}
            </Button>
          )}
          <Button onClick={onRetry} className="gap-2 btn-glow-gold btn-press font-semibold">
            <RefreshCw className="w-4 h-4" />
            {t('components.wizard.analyzing.retry')}
          </Button>
          <Button variant="outline" onClick={onSkipToReview} className="gap-2 btn-press border-primary/30 hover:border-primary/50">
            <ArrowRight className="w-4 h-4" />
            {t('components.wizard.analyzing.skipToManual')}
          </Button>
        </div>
      </div>
    );
  }

  // Loading state with scan-line + ring
  return (
    <div className="space-y-6 ai-shimmer-border rounded-xl p-6" role="status" aria-live="polite">
      <div className="text-center">
        <h2 className="text-2xl font-semibold font-display mb-2 text-primary">{t('components.wizard.analyzing.analyzingTitle')}</h2>
      </div>

      {/* Photo with scan-line animation */}
      <div className="flex justify-center">
        {imageBase64 && (
          <div className="relative w-full max-w-md scan-line-animation vignette-overlay rounded-xl overflow-hidden">
            <img
              src={imageBase64}
              alt={t('components.wizard.analyzing.photoAnalyzing')}
              className="w-full object-cover rounded-xl"
            />
          </div>
        )}
      </div>

      {/* Progress ring + current step label */}
      <div className="flex items-center justify-center gap-4">
        <ProgressRing progress={progress} size={80} />
        <div>
          <p className="text-sm font-medium">{currentLabel}</p>
          <p className="text-xs text-muted-foreground">{t('components.wizard.analyzing.estimatedTime')}</p>
        </div>
      </div>

      {/* Horizontal compact steps */}
      <div className="flex justify-center">
        <CompactStepIndicator
          steps={compactSteps}
          currentIndex={activeIndex}
          variant="horizontal"
        />
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-primary ai-dot" />
          <span className="ai-text">{t('components.wizard.analyzing.poweredBy')}</span>
        </div>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-muted-foreground hover:text-foreground gap-2">
            <X className="w-3.5 h-3.5" />
            {t('components.wizard.analyzing.cancel')}
          </Button>
        )}
      </div>
    </div>
  );
}
