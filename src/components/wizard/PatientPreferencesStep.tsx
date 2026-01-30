import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Heart, Sparkles, ArrowRight, SkipForward } from 'lucide-react';

export interface PatientPreferences {
  aestheticGoals: string;
}

interface PatientPreferencesStepProps {
  preferences: PatientPreferences;
  onPreferencesChange: (preferences: PatientPreferences) => void;
  onContinue: () => void;
  onSkip: () => void;
}

const PLACEHOLDER_TEXT = `Exemplo: "Gostaria de dentes mais brancos e naturais, sem parecer artificial. Tenho sensibilidade."

Descreva o que o paciente deseja em suas próprias palavras...`;

const MAX_CHARS = 500;

export function PatientPreferencesStep({
  preferences,
  onPreferencesChange,
  onContinue,
  onSkip,
}: PatientPreferencesStepProps) {
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, MAX_CHARS);
    onPreferencesChange({
      ...preferences,
      aestheticGoals: value,
    });
  };

  const hasText = preferences.aestheticGoals.trim().length > 0;
  const charCount = preferences.aestheticGoals.length;

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
              Opcional — a IA analisará e aplicará clinicamente
            </span>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Textarea for free-text input */}
          <div className="space-y-3">
            <Label htmlFor="aesthetic-goals" className="text-sm font-medium">
              O que o paciente deseja?
            </Label>
            <Textarea
              id="aesthetic-goals"
              value={preferences.aestheticGoals}
              onChange={handleTextChange}
              placeholder={PLACEHOLDER_TEXT}
              className="min-h-[120px] resize-none"
              maxLength={MAX_CHARS}
            />
            <div className="flex justify-end">
              <span className={`text-xs ${charCount >= MAX_CHARS ? 'text-destructive' : 'text-muted-foreground'}`}>
                {charCount}/{MAX_CHARS} caracteres
              </span>
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
              disabled={!hasText}
            >
              Continuar com preferências
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {!hasText && (
            <p className="text-xs text-muted-foreground text-center">
              Descreva as preferências do paciente ou clique em "Pular" para continuar
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
