import { useEffect, useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@parisgroup-ai/pageshell/primitives';
import { Sparkles, RefreshCw, ArrowRight, ArrowLeft, Lightbulb, AlertCircle, X, Check } from 'lucide-react';
import { ProgressRing } from '@/components/ProgressRing';
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
  { id: 1, key: 'step1', delay: 0, etaSeconds: 50 },
  { id: 2, key: 'step2', delay: 5000, etaSeconds: 42 },
  { id: 3, key: 'step3', delay: 12000, etaSeconds: 33 },
  { id: 4, key: 'step4', delay: 22000, etaSeconds: 22 },
  { id: 5, key: 'step5', delay: 35000, etaSeconds: 12 },
  { id: 6, key: 'step6', delay: 50000, etaSeconds: 5 },
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

    const startTime = Date.now();

    // Step transitions at realistic intervals matching actual analysis timing
    const stepTimeouts = analysisStepKeys.map((step, index) =>
      setTimeout(() => setCurrentStep(index + 1), step.delay),
    );

    // Asymptotic progress: approaches 95% naturally over ~90 seconds.
    // Formula: 95 * (1 - e^(-t/25)) — fast start, gradual slowdown.
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const newProgress = Math.min(95, Math.floor(95 * (1 - Math.exp(-elapsed / 25))));
      setProgress(newProgress);
    }, 500);

    return () => {
      stepTimeouts.forEach(clearTimeout);
      clearInterval(progressInterval);
    };
  }, [isAnalyzing]);

  // Current label for progress ring area
  const currentLabel = currentStep > 0 && currentStep <= analysisSteps.length
    ? analysisSteps[currentStep - 1].label
    : t('components.wizard.analyzing.defaultStep');

  // Friendly error state
  if (analysisError) {
    return (
      <div className="space-y-6" role="alert">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4 glow-icon">
            <AlertCircle className="w-8 h-8 text-warning" />
          </div>
          <h2 className="text-2xl font-semibold font-display mb-2 neon-text">{t('components.wizard.analyzing.errorTitle')}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {analysisError}
          </p>
        </div>

        {imageBase64 && (
          <div className="flex justify-center">
            <img
              src={imageBase64}
              alt={t('components.wizard.analyzing.photoSent')}
              width={192}
              height={192}
              className="w-48 h-48 object-cover rounded-xl opacity-75 ring-1 ring-border"
            />
          </div>
        )}

        {/* Contextual hint card */}
        <div className="border-l-4 border-warning bg-warning/5 rounded-r-lg p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <p className="text-sm text-warning-foreground dark:text-warning">
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
          <Button onClick={onRetry} className="gap-2 btn-glow btn-press font-semibold">
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

  // Compute ETA based on active step
  const activeEta = currentStep > 0 && currentStep <= analysisSteps.length
    ? analysisStepKeys[currentStep - 1].etaSeconds
    : analysisStepKeys[0].etaSeconds;

  // Loading state with scan-line + ring
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <div className="text-center">
        <h2 className="text-2xl font-semibold font-display mb-2 text-primary">{t('components.wizard.analyzing.analyzingTitle')}</h2>
      </div>

      {/* Smooth progress bar */}
      <div className="w-full max-w-md mx-auto px-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground tabular-nums">{progress}%</span>
          {activeEta > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              ~{activeEta}s {t('components.wizard.analyzing.remaining', { defaultValue: 'restante' })}
            </span>
          )}
        </div>
        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Photo with scan-line animation */}
      <div className="flex justify-center">
        {imageBase64 && (
          <div className="relative w-full max-w-md scan-line-animation vignette-overlay rounded-xl overflow-hidden">
            <img
              src={imageBase64}
              alt={t('components.wizard.analyzing.photoAnalyzing')}
              width={400}
              height={300}
              className="w-full h-auto object-cover rounded-xl"
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

      {/* Vertical sub-step checklist with ETAs */}
      <div className="flex flex-col gap-3 max-w-sm mx-auto text-left px-4" role="list" aria-label={t('components.wizard.analyzing.analyzingTitle')}>
        {analysisSteps.map((step, i) => {
          const stepIndex = i + 1;
          const isCompleted = currentStep > stepIndex;
          const isActive = currentStep === stepIndex;
          const eta = analysisStepKeys[i].etaSeconds;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 transition-all duration-300 ${
                isActive ? 'bg-primary/5 dark:bg-primary/10 -mx-3 px-3 py-2 rounded-lg' : ''
              }`}
              role="listitem"
              aria-current={isActive ? 'step' : undefined}
            >
              {isCompleted ? (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 animate-scale-in">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              ) : isActive ? (
                <div className="w-5 h-5 rounded-full bg-primary shrink-0 pulse-dot flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/20 shrink-0" />
              )}
              <span
                className={
                  isCompleted
                    ? 'text-sm text-muted-foreground line-through decoration-muted-foreground/30'
                    : isActive
                      ? 'text-sm text-foreground font-medium'
                      : 'text-sm text-muted-foreground/70'
                }
              >
                {step.label.replace('...', '')}
              </span>
              {isActive && eta > 0 && (
                <span className="text-xs text-muted-foreground/70 ml-auto tabular-nums">
                  ~{eta}s
                </span>
              )}
            </div>
          );
        })}
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
