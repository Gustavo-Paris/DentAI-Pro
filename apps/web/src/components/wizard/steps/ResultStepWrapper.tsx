import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@parisgroup-ai/pageshell/primitives';
import { ArrowLeft, CheckCircle, Eye, Loader2 } from 'lucide-react';

/** CSS-only confetti particles — subtle floating dots */
const CONFETTI_PARTICLES = [
  { left: '15%', color: 'bg-primary/60', size: 'w-1.5 h-1.5', delay: '0s' },
  { left: '30%', color: 'bg-accent/50', size: 'w-2 h-2', delay: '0.2s' },
  { left: '45%', color: 'bg-primary/40', size: 'w-1 h-1', delay: '0.4s' },
  { left: '60%', color: 'bg-success/50', size: 'w-1.5 h-1.5', delay: '0.1s' },
  { left: '72%', color: 'bg-accent/40', size: 'w-2 h-2', delay: '0.5s' },
  { left: '85%', color: 'bg-primary/50', size: 'w-1 h-1', delay: '0.3s' },
  { left: '25%', color: 'bg-success/40', size: 'w-1.5 h-1.5', delay: '0.6s' },
  { left: '55%', color: 'bg-primary/30', size: 'w-1 h-1', delay: '0.7s' },
] as const;

interface ResultStepWrapperProps {
  stepDirection: 'forward' | 'backward';
  submissionComplete: boolean;
  completedSessionId: string | null;
  isSubmitting: boolean;
  handleBack: () => void;
}

export const ResultStepWrapper = memo(function ResultStepWrapper({
  stepDirection,
  submissionComplete,
  completedSessionId,
  isSubmitting,
  handleBack,
}: ResultStepWrapperProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const confettiElements = useMemo(
    () =>
      CONFETTI_PARTICLES.map((p, i) => (
        <span
          key={i}
          className={`confetti-particle ${p.color} ${p.size}`}
          style={{ left: p.left, top: '50%', animationDelay: p.delay }}
          aria-hidden="true"
        />
      )),
    [],
  );

  return (
    <div className={`wizard-step-${stepDirection}`}>
      <div className="wizard-stage">
        {submissionComplete ? (
          <div className="ai-shimmer-border rounded-xl p-8 relative overflow-hidden">
            {/* Celebration glow orbs */}
            <div className="glow-orb-slow absolute -top-10 -left-10 w-32 h-32 bg-primary/10 dark:bg-primary/20 rounded-full pointer-events-none" aria-hidden="true" />
            <div className="glow-orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-primary/5 dark:bg-primary/10 rounded-full pointer-events-none" aria-hidden="true" />
            <div className="glow-orb-reverse absolute -bottom-10 -right-10 w-28 h-28 bg-accent/8 dark:bg-accent/15 rounded-full pointer-events-none" aria-hidden="true" />

            {/* Confetti particles */}
            {confettiElements}

            <div className="flex flex-col items-center justify-center py-8 sm:py-16 space-y-5 relative z-10">
              {/* Success icon with pulse + bounce */}
              <div
                className="w-20 h-20 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center success-pulse"
              >
                <CheckCircle className="w-12 h-12 text-primary drop-shadow-[0_0_12px_rgb(var(--color-primary-rgb)/0.5)]" />
              </div>

              {/* Title — staggered fade-in */}
              <p
                className="text-xl font-semibold text-foreground neon-text animate-fade-in-up [animation-delay:0.4s]"
              >
                {t('wizard.caseCreated')}
              </p>

              {/* Subtitle */}
              <p
                className="text-sm text-muted-foreground max-w-xs text-center animate-fade-in-up [animation-delay:0.6s]"
              >
                {t('wizard.caseCreatedSubtitle', { defaultValue: 'Seu caso foi processado com sucesso.' })}
              </p>

              {/* Action buttons — staggered */}
              <div
                className="flex flex-col sm:flex-row gap-3 pt-2 animate-fade-in-up [animation-delay:0.8s]"
              >
                <Button
                  onClick={() => navigate(`/evaluation/${completedSessionId}`)}
                  className="btn-press btn-glow"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {t('result.viewCase')}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="print:hidden btn-press"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('result.recalculate')}
                </Button>
              </div>
            </div>
          </div>
        ) : isSubmitting ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 space-y-4 sm:space-y-6" role="status" aria-live="polite">
            <div className="text-center flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('common.processing')}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <p className="text-muted-foreground">{t('wizard.preparingCase')}</p>
            <Button variant="outline" onClick={handleBack} className="btn-press">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});
