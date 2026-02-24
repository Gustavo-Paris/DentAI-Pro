import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smile, Loader2, ChevronRight, Zap, Play } from 'lucide-react';

interface DSDInitialStateProps {
  onSkip: () => void;
  /** Whether an image is available for analysis */
  hasImage?: boolean;
  /** Callback to confirm and start DSD analysis */
  onConfirmDSD?: () => void;
}

export function DSDInitialState({ onSkip, hasImage, onConfirmDSD }: DSDInitialStateProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Smile className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold font-display mb-2 text-primary">{t('components.wizard.dsd.initialState.title')}</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {t('components.wizard.dsd.initialState.description')}
        </p>
      </div>

      {hasImage && (
        <p className="text-sm text-center text-muted-foreground max-w-md mx-auto">
          {t('components.wizard.dsd.initialState.confirmHint', { defaultValue: 'A an\u00e1lise DSD vai processar a foto e gerar sugest\u00f5es de design do sorriso.' })}
        </p>
      )}

      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="py-5">
          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="secondary" className="gap-1.5">
              <Zap className="w-3 h-3" />
              {t('components.wizard.dsd.initialState.credits')}
            </Badge>
            <Badge variant="secondary" className="gap-1.5">
              <Loader2 className="w-3 h-3" />
              {t('components.wizard.dsd.initialState.duration')}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        {hasImage && onConfirmDSD && (
          <Button onClick={onConfirmDSD} className="btn-press">
            <Play className="w-4 h-4 mr-2" />
            {t('components.wizard.dsd.initialState.startAnalysis', { defaultValue: 'Iniciar An\u00e1lise DSD' })}
          </Button>
        )}
        <Button variant="outline" onClick={onSkip} className="btn-press">
          {t('components.wizard.dsd.initialState.skipDSD')}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
