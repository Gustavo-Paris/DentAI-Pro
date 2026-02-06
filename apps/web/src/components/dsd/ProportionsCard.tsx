import { Check, X, AlertCircle, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface DSDAnalysis {
  facial_midline: "centrada" | "desviada_esquerda" | "desviada_direita";
  dental_midline: "alinhada" | "desviada_esquerda" | "desviada_direita";
  smile_line: "alta" | "média" | "baixa";
  buccal_corridor: "adequado" | "excessivo" | "ausente";
  occlusal_plane: "nivelado" | "inclinado_esquerda" | "inclinado_direita";
  golden_ratio_compliance: number;
  symmetry_score: number;
}

interface ProportionsCardProps {
  analysis: DSDAnalysis;
}

const StatusIcon = ({ status }: { status: 'good' | 'warning' | 'bad' | 'neutral' }) => {
  switch (status) {
    case 'good':
      return <Check className="w-4 h-4 text-emerald-500" />;
    case 'warning':
      return <AlertCircle className="w-4 h-4 text-amber-500" />;
    case 'bad':
      return <X className="w-4 h-4 text-destructive" />;
    default:
      return <Minus className="w-4 h-4 text-muted-foreground" />;
  }
};

const getStatus = (value: string, goodValues: string[]): 'good' | 'warning' | 'bad' => {
  if (goodValues.includes(value)) return 'good';
  return 'warning';
};

const translateValue = (key: string, value: string): string => {
  const translations: Record<string, Record<string, string>> = {
    facial_midline: {
      centrada: 'Centrada',
      desviada_esquerda: 'Desviada à esquerda',
      desviada_direita: 'Desviada à direita',
    },
    dental_midline: {
      alinhada: 'Alinhada',
      desviada_esquerda: 'Desviada à esquerda',
      desviada_direita: 'Desviada à direita',
    },
    smile_line: {
      alta: 'Alta (gengival)',
      média: 'Média (ideal)',
      baixa: 'Baixa',
    },
    buccal_corridor: {
      adequado: 'Adequado',
      excessivo: 'Excessivo',
      ausente: 'Ausente',
    },
    occlusal_plane: {
      nivelado: 'Nivelado',
      inclinado_esquerda: 'Inclinado à esquerda',
      inclinado_direita: 'Inclinado à direita',
    },
  };

  return translations[key]?.[value] || value;
};

export function ProportionsCard({ analysis }: ProportionsCardProps) {
  const proportionItems = [
    {
      label: 'Linha Média Facial',
      value: analysis.facial_midline,
      status: getStatus(analysis.facial_midline, ['centrada']),
    },
    {
      label: 'Linha Média Dental',
      value: analysis.dental_midline,
      status: getStatus(analysis.dental_midline, ['alinhada']),
    },
    {
      label: 'Linha do Sorriso',
      value: analysis.smile_line,
      status: getStatus(analysis.smile_line, ['média']),
    },
    {
      label: 'Corredor Bucal',
      value: analysis.buccal_corridor,
      status: getStatus(analysis.buccal_corridor, ['adequado']),
    },
    {
      label: 'Plano Oclusal',
      value: analysis.occlusal_plane,
      status: getStatus(analysis.occlusal_plane, ['nivelado']),
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-destructive';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          📐 Análise de Proporções
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score indicators */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Proporção Dourada</span>
              <span className={cn('font-semibold', getScoreColor(analysis.golden_ratio_compliance))}>
                {analysis.golden_ratio_compliance}%
              </span>
            </div>
            <Progress value={analysis.golden_ratio_compliance} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Simetria</span>
              <span className={cn('font-semibold', getScoreColor(analysis.symmetry_score))}>
                {analysis.symmetry_score}%
              </span>
            </div>
            <Progress value={analysis.symmetry_score} className="h-2" />
          </div>
        </div>
        {(analysis.golden_ratio_compliance < 60 || analysis.symmetry_score < 60) && (
          <p className="text-xs text-muted-foreground">
            Valores pré-tratamento. O planejamento proposto visa melhorar proporção e simetria.
          </p>
        )}

        {/* Proportion items */}
        <div className="space-y-2 pt-2 border-t border-border">
          {proportionItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-1.5"
            >
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {translateValue(item.label === 'Linha Média Facial' ? 'facial_midline' :
                    item.label === 'Linha Média Dental' ? 'dental_midline' :
                    item.label === 'Linha do Sorriso' ? 'smile_line' :
                    item.label === 'Corredor Bucal' ? 'buccal_corridor' : 'occlusal_plane', item.value)}
                </span>
                <StatusIcon status={item.status} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
