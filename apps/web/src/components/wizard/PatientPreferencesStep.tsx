import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Sun, Zap, Star, Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';

export type WhiteningLevel = 'natural' | 'white' | 'hollywood';

export interface PatientPreferences {
  whiteningLevel: WhiteningLevel;
}

interface PatientPreferencesStepProps {
  preferences: PatientPreferences;
  onPreferencesChange: (preferences: PatientPreferences) => void;
  onContinue: () => void;
}

const WHITENING_OPTIONS: {
  value: WhiteningLevel;
  label: string;
  description: string;
  shade: string;
  icon: typeof Sun;
}[] = [
  {
    value: 'natural',
    label: 'Natural',
    description: 'Clareamento sutil, aparência discreta',
    shade: 'A1 / A2',
    icon: Sun,
  },
  {
    value: 'white',
    label: 'Branco',
    description: 'Clareamento notável, resultado evidente',
    shade: 'BL1 / BL2',
    icon: Zap,
  },
  {
    value: 'hollywood',
    label: 'Hollywood',
    description: 'Clareamento intenso, sorriso de celebridade',
    shade: 'BL1',
    icon: Star,
  },
];

export function PatientPreferencesStep({
  preferences,
  onPreferencesChange,
  onContinue,
}: PatientPreferencesStepProps) {
  const { creditsRemaining, getCreditCost } = useSubscription();
  const totalCost = getCreditCost('case_analysis') + getCreditCost('dsd_simulation');
  const hasEnoughCredits = creditsRemaining >= totalCost;

  const handleSelect = (level: WhiteningLevel) => {
    onPreferencesChange({ whiteningLevel: level });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="border-primary/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Nível de Clareamento</CardTitle>
          <CardDescription className="text-base">
            Escolha o tom desejado para a simulação do sorriso
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Whitening Level Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {WHITENING_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = preferences.whiteningLevel === option.value;
              
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200",
                    "hover:border-primary/50 hover:bg-primary/5",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isSelected 
                      ? "border-primary bg-primary/10 shadow-md" 
                      : "border-border bg-card"
                  )}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  
                  {/* Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  {/* Label */}
                  <h3 className={cn(
                    "font-semibold text-base mb-1",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {option.label}
                  </h3>
                  
                  {/* Shade badge */}
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full mb-2",
                    isSelected 
                      ? "bg-primary/20 text-primary" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {option.shade}
                  </span>
                  
                  {/* Description */}
                  <p className="text-xs text-muted-foreground text-center">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Credit cost disclosure */}
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-primary shrink-0" />
              <span>
                As próximas etapas consumirão <strong className="text-foreground">{totalCost} créditos</strong> (análise + DSD)
              </span>
            </div>
            {!hasEnoughCredits && (
              <div className="flex items-center gap-2 mt-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Você tem apenas {creditsRemaining} crédito{creditsRemaining !== 1 ? 's' : ''}. Créditos insuficientes para o fluxo completo.</span>
              </div>
            )}
          </div>

          {/* Continue button */}
          <div className="pt-2">
            <Button
              onClick={onContinue}
              disabled={creditsRemaining === 0}
              className="w-full gap-2"
              size="lg"
            >
              Continuar com simulação
              <span className="inline-flex items-center gap-0.5 text-xs opacity-80 ml-1">
                <Zap className="w-3 h-3" />{totalCost}
              </span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
