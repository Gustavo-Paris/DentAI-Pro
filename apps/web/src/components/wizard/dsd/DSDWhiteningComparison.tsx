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
  onSelectLevel: (level: 'natural' | 'white' | 'hollywood', url: string) => void;
}

const WHITENING_LABELS: Record<string, string> = {
  natural: 'Natural (A1/A2)',
  white: 'Branco (BL2/BL3)',
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
              Gerando comparação...
            </>
          ) : (
            <>
              <Palette className="w-3 h-3 mr-1" />
              Comparar Níveis de Clareamento
              <span className="text-xs opacity-60 ml-1">(grátis)</span>
            </>
          )}
        </Button>
      )}

      {/* E4: Whitening comparison grid */}
      {showWhiteningComparison && Object.keys(whiteningComparison).length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Comparação de Clareamento</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCloseComparison}
              className="text-xs"
            >
              Fechar
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['natural', 'white', 'hollywood'] as const).map(level => {
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
                      <span className="text-xs font-medium text-primary">Selecionado</span>
                    </div>
                  ) : (
                    <div className="text-center py-1 bg-secondary/30">
                      <span className="text-xs font-medium text-muted-foreground">Clique para selecionar</span>
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
