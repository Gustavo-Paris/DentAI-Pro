import { useTranslation } from 'react-i18next';
import { Button } from '@parisgroup-ai/pageshell/primitives';
import { Camera, ChevronRight, Play, AlertTriangle } from 'lucide-react';

interface DSDPhotoQualityGateProps {
  onGenerateAnyway: () => void;
  onSkip: () => void;
  /** When true, the photo is too poor for any simulation — bypass is not offered */
  hardBlock?: boolean;
}

export function DSDPhotoQualityGate({ onGenerateAnyway, onSkip, hardBlock }: DSDPhotoQualityGateProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center glow-icon ${hardBlock ? 'bg-destructive/10' : 'bg-warning/10'}`}>
          <Camera className={`w-8 h-8 ${hardBlock ? 'text-destructive' : 'text-warning'}`} />
        </div>
        <h2 className="text-2xl font-semibold font-display mb-2 neon-text">
          {t(hardBlock ? 'components.wizard.dsd.qualityGate.hardBlockTitle' : 'components.wizard.dsd.qualityGate.title')}
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          {t(hardBlock ? 'components.wizard.dsd.qualityGate.hardBlockDescription' : 'components.wizard.dsd.qualityGate.description')}
        </p>
      </div>

      {/* Tips */}
      <div className={`border-l-4 rounded-r-lg p-4 max-w-lg mx-auto ${hardBlock ? 'border-destructive bg-destructive/5' : 'border-warning bg-warning/5'}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${hardBlock ? 'text-destructive' : 'text-warning'}`} />
          <div className={`space-y-2 text-sm ${hardBlock ? 'text-destructive-foreground' : 'text-warning-foreground dark:text-warning'}`}>
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
        {t(hardBlock ? 'components.wizard.dsd.qualityGate.hardBlockNote' : 'components.wizard.dsd.qualityGate.note')}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        {!hardBlock && (
          <Button variant="outline" onClick={onGenerateAnyway} className="btn-press border-primary/30 hover:border-primary/50">
            <Play className="w-4 h-4 mr-2" />
            {t('components.wizard.dsd.qualityGate.generateAnyway')}
          </Button>
        )}
        <Button variant={hardBlock ? 'default' : 'ghost'} onClick={onSkip} className="btn-press">
          {t('components.wizard.dsd.qualityGate.skipDSD')}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
