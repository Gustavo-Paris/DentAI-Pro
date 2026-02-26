import { useTranslation } from 'react-i18next';
import { Button } from '@parisgroup-ai/pageshell/primitives';
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
  hollywood: 'Diamond (BL1/BL2/BL3)',
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
  const hasResults = showWhiteningComparison && Object.keys(whiteningComparison).length > 0;

  return (
    <>
      {/* Button: visible when no results yet */}
      {!hasResults && (
        <div className="space-y-2">
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
          {/* Progress bar while generating */}
          {isComparingWhitening && (
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-progress-indeterminate" />
            </div>
          )}
        </div>
      )}

      {/* Results grid with fade-in animation */}
      {hasResults && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(['natural', 'hollywood'] as const).map(level => {
              const url = whiteningComparison[level];
              if (!url) return (
                <div key={level} className="aspect-[4/3] rounded-lg bg-secondary/50 flex items-center justify-center animate-pulse">
                  <div className="w-full h-full rounded-lg bg-gradient-to-r from-secondary/50 via-secondary/80 to-secondary/50" />
                </div>
              );
              const isActive = patientPreferences?.whiteningLevel === level;
              return (
                <button
                  type="button"
                  key={level}
                  className={`rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-300 text-left w-full ${isActive ? 'border-primary shadow-md' : 'border-transparent hover:border-primary/40'}`}
                  aria-pressed={isActive}
                  aria-label={`${WHITENING_LABELS[level]}${isActive ? ` - ${t('components.wizard.dsd.whiteningComparison.selected')}` : ''}`}
                  onClick={() => {
                    if (isActive) return;
                    onSelectLevel(level, url);
                  }}
                >
                  {/* TODO: Use lightweight thumbnails instead of full ComparisonSliders for better performance */}
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
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
