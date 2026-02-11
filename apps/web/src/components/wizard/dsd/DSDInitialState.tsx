import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smile, Loader2, ChevronRight, Zap } from 'lucide-react';

interface DSDInitialStateProps {
  onSkip: () => void;
}

export function DSDInitialState({ onSkip }: DSDInitialStateProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Smile className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold font-display mb-2 text-primary">Simulação de Sorriso (DSD)</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          O Digital Smile Design analisa as proporções faciais e dentárias do paciente, gerando uma simulação visual do resultado final antes de iniciar o tratamento.
        </p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="py-5">
          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="secondary" className="gap-1.5">
              <Zap className="w-3 h-3" />
              2 créditos
            </Badge>
            <Badge variant="secondary" className="gap-1.5">
              <Loader2 className="w-3 h-3" />
              ~30 segundos
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Button variant="outline" onClick={onSkip} className="btn-press">
          Pular DSD
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
