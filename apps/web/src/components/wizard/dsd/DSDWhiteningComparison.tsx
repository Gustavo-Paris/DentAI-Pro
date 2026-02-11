import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Loader2, Palette } from 'lucide-react';
import { ComparisonSlider } from '@/components/dsd/ComparisonSlider';
import type { PatientPreferences } from '@/types/dsd';

interface DSDWhiteningComparisonProps {
  imageBase64: string;
  showWhiteningComparison: boolean;
  whiteningComparison: Record<string, string>;
  isComparingWhitening: boolean;
  patientPreferences?: PatientPreferences;
  onGenerateComparison: () => void;
  onCloseComparison: () => void;
  onSelectLevel: (level: 'natural' | 'hollywood', url: string) => void;
}

const WHITENING_LABELS: Record<string, string> = {
  natural: 'Natural (A1/A2)',
  hollywood: 'Hollywood (BL1)',
};

export function DSDWhiteningComparison({
  imageBase64,
  showWhiteningComparison,
  whiteningComparison,
  isComparingWhitening,
  patientPreferences,
  onGenerateComparison,
  onCloseComparison,
  onSelectLevel,
}: DSDWhiteningComparisonProps) {
  const { t } = useTranslation();
  return (
    <>
      {/* E4: Whitening comparison button */}
      {!showWhiteningComparison && (
        <Button
          variant="outline"
          size="sm"
          onClick={onGenerateComparison}
          disabled={isComparingWhitening}
          className="w-full"
        >
          {isComparingWhitening ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              {t('components.wizard.dsd.whiteningComparison.generating')}
            </>
          ) : (
            <>
              <Palette className="w-3 h-3 mr-1" />
              {t('components.wizard.dsd.whiteningComparison.compareTitle')}
              <span className="text-xs opacity-60 ml-1">{t('components.wizard.dsd.whiteningComparison.free')}</span>
            </>
          )}
        </Button>
      )}

      {/* E4: Whitening comparison grid */}
      {showWhiteningComparison && Object.keys(whiteningComparison).length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">{t('components.wizard.dsd.whiteningComparison.title')}</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCloseComparison}
              className="text-xs"
            >
              {t('components.wizard.dsd.whiteningComparison.close')}
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['natural', 'hollywood'] as const).map(level => {
              const url = whiteningComparison[level];
              if (!url) return (
                <div key={level} className="aspect-[4/3] rounded-lg bg-secondary/50 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              );
              const isActive = patientPreferences?.whiteningLevel === level;
              return (
                <div
                  key={level}
                  className={`rounded-lg overflow-hidden border-2 cursor-pointer transition-colors ${isActive ? 'border-primary' : 'border-transparent hover:border-primary/40'}`}
                  onClick={() => {
                    if (isActive) return;
                    onSelectLevel(level, url);
                  }}
                >
                  <ComparisonSlider
                    beforeImage={imageBase64}
                    afterImage={url}
                    afterLabel={WHITENING_LABELS[level]}
                  />
                  {isActive ? (
                    <div className="text-center py-1 bg-primary/10">
                      <span className="text-xs font-medium text-primary">{t('components.wizard.dsd.whiteningComparison.selected')}</span>
                    </div>
                  ) : (
                    <div className="text-center py-1 bg-secondary/30">
                      <span className="text-xs font-medium text-muted-foreground">{t('components.wizard.dsd.whiteningComparison.clickToSelect')}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
