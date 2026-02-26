import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@parisgroup-ai/pageshell/primitives';
import { ArrowLeft, Check, Eye, Loader2 } from 'lucide-react';

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

  return (
    <div className={`wizard-step-${stepDirection}`}>
      <div className="wizard-stage">
        {submissionComplete ? (
          <div className="ai-shimmer-border rounded-xl p-8 relative overflow-hidden">
            {/* Celebration glow orbs */}
            <div className="glow-orb-slow absolute -top-10 -left-10 w-32 h-32 bg-primary/10 dark:bg-primary/20 rounded-full pointer-events-none" aria-hidden="true" />
            <div className="glow-orb-reverse absolute -bottom-10 -right-10 w-28 h-28 bg-accent/8 dark:bg-accent/15 rounded-full pointer-events-none" aria-hidden="true" />

            <div className="flex flex-col items-center justify-center py-8 sm:py-16 space-y-4 relative z-10">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center animate-scale-in success-pulse glow-icon dark:shadow-[0_0_30px_rgb(var(--color-primary-rgb)/0.4)]">
                <Check className="w-8 h-8 text-primary-foreground" />
              </div>
              <p className="text-lg font-semibold text-foreground animate-fade-in-up neon-text">
                {t('wizard.caseCreated')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up">
                <Button
                  onClick={() => navigate(`/evaluation/${completedSessionId}`)}
                  className="btn-press"
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
