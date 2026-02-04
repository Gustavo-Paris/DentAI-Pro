import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Moon } from 'lucide-react';

interface BruxismAlertProps {
  show: boolean;
  treatmentType?: string;
}

export function BruxismAlert({ show, treatmentType = 'resina' }: BruxismAlertProps) {
  if (!show) return null;

  const isPorcelain = treatmentType === 'porcelana';

  return (
    <Alert className="border-warning/50 bg-warning/10">
      <AlertTriangle className="h-5 w-5 text-warning" />
      <AlertTitle className="text-warning flex items-center gap-2">
        Paciente com Bruxismo
        <Badge variant="outline" className="text-xs border-warning/50 text-warning">
          Atenção Redobrada
        </Badge>
      </AlertTitle>
      <AlertDescription className="text-warning/90 mt-3 space-y-3">
        {/* Key Recommendations */}
        <div className="grid gap-2">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <span className="text-sm">
              <strong>Priorize resinas de alta resistência</strong> 
              {isPorcelain 
                ? ' e cerâmicas monolíticas (dissilicato de lítio ou zircônia)'
                : ' (nano-híbridas ou micro-híbridas com carga reforçada)'
              }
            </span>
          </div>
          
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <span className="text-sm">
              <strong>Reduza espessura da camada de esmalte</strong> para minimizar 
              pontos de tensão e desgaste prematuro
            </span>
          </div>
          
          <div className="flex items-start gap-2">
            <Moon className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <span className="text-sm">
              <strong>Placa de proteção noturna é OBRIGATÓRIA</strong> — 
              oriente e documente prescrição
            </span>
          </div>
        </div>

        {/* Warning Box */}
        <div className="p-2.5 bg-warning/20 rounded-md">
          <p className="text-xs font-medium text-warning">
            ⚠️ Sem proteção noturna, a longevidade da restauração pode ser 
            reduzida em até 50%. Documente a orientação no prontuário.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}

export default BruxismAlert;
