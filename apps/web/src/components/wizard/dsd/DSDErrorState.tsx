import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronRight, Lightbulb, AlertCircle, Zap, RefreshCw } from 'lucide-react';

interface DSDErrorStateProps {
  error: string;
  onRetry: () => void;
  onSkip: () => void;
}

export function DSDErrorState({ error, onRetry, onSkip }: DSDErrorStateProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isCreditError = error.includes('Créditos insuficientes');

  return (
    <div className="space-y-6" role="alert">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warning/10 flex items-center justify-center glow-icon">
          {isCreditError ? (
            <Zap className="w-8 h-8 text-warning" />
          ) : (
            <AlertCircle className="w-8 h-8 text-warning" />
          )}
        </div>
        <h2 className="text-2xl font-semibold font-display mb-2 neon-text">
          {isCreditError ? t('components.wizard.dsd.errorState.insufficientCredits') : t('components.wizard.dsd.errorState.analysisError')}
        </h2>
        <p className="text-muted-foreground">{error}</p>
      </div>

      {/* Contextual hint */}
      {!isCreditError && (
        <div className="border-l-4 border-warning bg-warning/5 rounded-r-lg p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <p className="text-sm text-warning-foreground dark:text-warning">
              {t('components.wizard.dsd.errorState.hintText')}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {isCreditError ? (
          <Button onClick={() => navigate('/pricing')} className="btn-glow-gold btn-press font-semibold">
            <Zap className="w-4 h-4 mr-2" />
            {t('components.wizard.dsd.errorState.viewPlans')}
          </Button>
        ) : (
          <Button onClick={onRetry} className="gap-2 btn-glow-gold btn-press font-semibold">
            <RefreshCw className="w-4 h-4" />
            {t('components.wizard.dsd.errorState.retry')}
            <span className="inline-flex items-center gap-0.5 text-xs opacity-60 ml-1">
              <Zap className="w-3 h-3" />2
            </span>
          </Button>
        )}
        <Button variant="outline" onClick={onSkip} className="btn-press border-primary/30 hover:border-primary/50">
          {t('components.wizard.dsd.errorState.skipDSD')}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
