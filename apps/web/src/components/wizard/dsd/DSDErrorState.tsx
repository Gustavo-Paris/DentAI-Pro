import { Button } from '@/components/ui/button';
import { ChevronRight, Lightbulb, AlertCircle, Zap, RefreshCw } from 'lucide-react';

interface DSDErrorStateProps {
  error: string;
  onRetry: () => void;
  onSkip: () => void;
}

export function DSDErrorState({ error, onRetry, onSkip }: DSDErrorStateProps) {
  const isCreditError = error.includes('Créditos insuficientes');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
          {isCreditError ? (
            <Zap className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          ) : (
            <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          )}
        </div>
        <h2 className="text-xl font-semibold font-display mb-2">
          {isCreditError ? 'Créditos Insuficientes' : 'Erro na Análise DSD'}
        </h2>
        <p className="text-muted-foreground">{error}</p>
      </div>

      {/* Contextual hint */}
      {!isCreditError && (
        <div className="border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 rounded-r-lg p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Fotos frontais com boa iluminação e sorriso aberto geram melhores resultados na análise de proporções.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {isCreditError ? (
          <Button onClick={() => window.location.href = '/pricing'} className="btn-glow-gold btn-press font-semibold">
            <Zap className="w-4 h-4 mr-2" />
            Ver Planos
          </Button>
        ) : (
          <Button onClick={onRetry} className="gap-2 btn-glow-gold btn-press font-semibold">
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
            <span className="inline-flex items-center gap-0.5 text-xs opacity-60 ml-1">
              <Zap className="w-3 h-3" />2
            </span>
          </Button>
        )}
        <Button variant="outline" onClick={onSkip} className="btn-press border-primary/30 hover:border-primary/50">
          Pular DSD
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
