import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Heart, Sparkles, ArrowRight, SkipForward } from 'lucide-react';

export interface PatientPreferences {
  aestheticGoals: string;
  desiredChanges: string[];
}

interface PatientPreferencesStepProps {
  preferences: PatientPreferences;
  onPreferencesChange: (preferences: PatientPreferences) => void;
  onContinue: () => void;
  onSkip: () => void;
}

const DESIRED_CHANGES_OPTIONS = [
  { id: 'whiter', label: 'Dentes mais brancos' },
  { id: 'harmonious', label: 'Sorriso mais harmonioso' },
  { id: 'spacing', label: 'Corrigir espaçamentos/diastemas' },
  { id: 'alignment', label: 'Dentes mais alinhados' },
  { id: 'natural', label: 'Formato mais natural' },
  { id: 'asymmetry', label: 'Corrigir assimetrias' },
];

export function PatientPreferencesStep({
  preferences,
  onPreferencesChange,
  onContinue,
  onSkip,
}: PatientPreferencesStepProps) {
  const handleGoalsChange = (value: string) => {
    onPreferencesChange({
      ...preferences,
      aestheticGoals: value.slice(0, 300),
    });
  };

  const handleCheckboxChange = (optionId: string, checked: boolean) => {
    const newChanges = checked
      ? [...preferences.desiredChanges, optionId]
      : preferences.desiredChanges.filter((id) => id !== optionId);
    
    onPreferencesChange({
      ...preferences,
      desiredChanges: newChanges,
    });
  };

  const hasAnyPreference = preferences.aestheticGoals.trim() || preferences.desiredChanges.length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="border-primary/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Preferências do Paciente</CardTitle>
          <CardDescription className="text-base">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Opcional — ajuda a IA a personalizar as sugestões
            </span>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Textarea for free-form goals */}
          <div className="space-y-2">
            <Label htmlFor="aesthetic-goals" className="text-sm font-medium">
              O que você gostaria de mudar no seu sorriso?
            </Label>
            <Textarea
              id="aesthetic-goals"
              placeholder="Ex: Gostaria de ter dentes mais brancos e uniformes, com um formato mais natural..."
              value={preferences.aestheticGoals}
              onChange={(e) => handleGoalsChange(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground text-right">
              {preferences.aestheticGoals.length}/300 caracteres
            </p>
          </div>

          {/* Checkboxes for common desires */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Desejos comuns</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DESIRED_CHANGES_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={option.id}
                    checked={preferences.desiredChanges.includes(option.id)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange(option.id, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={option.id}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={onSkip}
              className="flex-1 gap-2"
            >
              <SkipForward className="w-4 h-4" />
              Pular esta etapa
            </Button>
            <Button
              onClick={onContinue}
              className="flex-1 gap-2"
              disabled={!hasAnyPreference}
            >
              Continuar com preferências
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {!hasAnyPreference && (
            <p className="text-xs text-muted-foreground text-center">
              Preencha pelo menos um campo ou clique em "Pular" para continuar
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
