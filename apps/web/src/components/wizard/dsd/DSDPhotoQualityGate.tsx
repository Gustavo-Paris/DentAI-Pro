import { useTranslation } from 'react-i18next';
import { Button } from '@parisgroup-ai/pageshell/primitives';
import { Camera, ChevronRight, Play, AlertTriangle } from 'lucide-react';

interface DSDPhotoQualityGateProps {
  onGenerateAnyway: () => void;
  onSkip: () => void;
}

export function DSDPhotoQualityGate({ onGenerateAnyway, onSkip }: DSDPhotoQualityGateProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warning/10 flex items-center justify-center glow-icon">
          <Camera className="w-8 h-8 text-warning" />
        </div>
        <h2 className="text-2xl font-semibold font-display mb-2 neon-text">
          {t('components.wizard.dsd.qualityGate.title')}
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          {t('components.wizard.dsd.qualityGate.description')}
        </p>
      </div>

      {/* Tips */}
      <div className="border-l-4 border-warning bg-warning/5 rounded-r-lg p-4 max-w-lg mx-auto">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
          <div className="space-y-2 text-sm text-warning-foreground dark:text-warning">
            <p className="font-medium">{t('components.wizard.dsd.qualityGate.tipsTitle')}</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>{t('components.wizard.dsd.qualityGate.tip1')}</li>
              <li>{t('components.wizard.dsd.qualityGate.tip2')}</li>
              <li>{t('components.wizard.dsd.qualityGate.tip3')}</li>
            </ul>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center max-w-md mx-auto">
        {t('components.wizard.dsd.qualityGate.note')}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Button variant="outline" onClick={onGenerateAnyway} className="btn-press border-primary/30 hover:border-primary/50">
          <Play className="w-4 h-4 mr-2" />
          {t('components.wizard.dsd.qualityGate.generateAnyway')}
        </Button>
        <Button variant="ghost" onClick={onSkip} className="btn-press">
          {t('components.wizard.dsd.qualityGate.skipDSD')}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
