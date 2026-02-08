import { useState } from 'react';
import { Check, X, AlertCircle, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { DSDAnalysis } from '@/types/dsd';

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
    lip_thickness: {
      fino: 'Fino',
      médio: 'Médio',
      volumoso: 'Volumoso',
    },
    overbite_suspicion: {
      sim: 'Suspeita de sobremordida',
      não: 'Sem sobremordida',
      indeterminado: 'Indeterminado',
    },
  };

  return translations[key]?.[value] || value;
};

const getContextualDescription = (key: string, value: string): string | null => {
  const descriptions: Record<string, Record<string, string>> = {
    buccal_corridor: {
      excessivo: 'Sombras laterais evidentes — possível atresia maxilar',
      ausente: 'Sem espaço lateral — sorriso pode parecer "apertado"',
    },
    smile_line: {
      alta: 'Exposição gengival > 3mm — avaliar gengivoplastia',
      baixa: 'Dentes parcialmente cobertos pelos lábios',
    },
    facial_midline: {
      desviada_esquerda: 'Desvio facial pode afetar percepção de simetria dental',
      desviada_direita: 'Desvio facial pode afetar percepção de simetria dental',
    },
    dental_midline: {
      desviada_esquerda: 'Considerar correção ortodôntica ou compensação restauradora',
      desviada_direita: 'Considerar correção ortodôntica ou compensação restauradora',
    },
    occlusal_plane: {
      inclinado_esquerda: 'Inclinação pode indicar assimetria esquelética',
      inclinado_direita: 'Inclinação pode indicar assimetria esquelética',
    },
    lip_thickness: {
      fino: 'Dentes volumosos podem parecer excessivos — considerar harmonização orofacial',
    },
  };
  return descriptions[key]?.[value] || null;
};

const REFERENCE_VALUES = [
  { label: 'Proporção Dourada', ideal: '62% (proporção de 1:0.618 entre centrais e laterais)', range: '60-80%' },
  { label: 'Simetria', ideal: 'Bilateral simétrica', range: '> 85%' },
  { label: 'Linha do Sorriso', ideal: 'Média (0-3mm exposição gengival)', range: '0-3mm' },
  { label: 'Corredor Bucal', ideal: 'Adequado (leve sombra lateral)', range: 'Presente, não excessivo' },
  { label: 'Proporção IC', ideal: '75-80% (largura/altura dos incisivos centrais)', range: '75-80%' },
];

const LABEL_TO_KEY: Record<string, string> = {
  'Linha Média Facial': 'facial_midline',
  'Linha Média Dental': 'dental_midline',
  'Linha do Sorriso': 'smile_line',
  'Corredor Bucal': 'buccal_corridor',
  'Plano Oclusal': 'occlusal_plane',
  'Espessura Labial': 'lip_thickness',
  'Sobremordida': 'overbite_suspicion',
};

export function ProportionsCard({ analysis }: ProportionsCardProps) {
  const [showReferences, setShowReferences] = useState(false);

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
    // Lip thickness - only show if present
    ...(analysis.lip_thickness ? [{
      label: 'Espessura Labial',
      value: analysis.lip_thickness,
      status: getStatus(analysis.lip_thickness, ['médio', 'volumoso']),
    }] : []),
    // Overbite suspicion - only show if sim or não (hide indeterminado)
    ...(analysis.overbite_suspicion && analysis.overbite_suspicion !== 'indeterminado' ? [{
      label: 'Sobremordida',
      value: analysis.overbite_suspicion,
      status: (analysis.overbite_suspicion === 'sim' ? 'warning' : 'good') as 'good' | 'warning' | 'bad',
    }] : []),
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-destructive';
  };

  return (
    <Card className="shadow-sm">
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
                  {translateValue(LABEL_TO_KEY[item.label] || item.label, item.value)}
                </span>
                <StatusIcon status={item.status} />
              </div>
            </div>
          ))}

          {/* Contextual descriptions for abnormal values */}
          {proportionItems.map((item) => {
            const key = LABEL_TO_KEY[item.label] || item.label;
            const desc = item.status !== 'good' ? getContextualDescription(key, item.value) : null;
            if (!desc) return null;
            return (
              <div key={`desc-${item.label}`} className="flex items-start gap-2 py-1.5 px-3 rounded-md bg-amber-50/50 dark:bg-amber-950/10">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <span className="font-medium">{item.label}:</span> {desc}
                </p>
              </div>
            );
          })}

          {/* Buccal corridor orthodontic note */}
          {analysis.buccal_corridor === 'excessivo' && (
            <div className="flex items-start gap-2 py-2 px-3 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Corredor bucal excessivo pode indicar atresia maxilar. Expansão ortodôntica é uma opção.
              </p>
            </div>
          )}
        </div>

        {/* Measurable data from observations */}
        {(() => {
          const numericPattern = /\d+[.,]?\d*\s*(%|mm|°)/;
          const measurableObs = (analysis.observations || []).filter(obs => numericPattern.test(obs));
          if (measurableObs.length === 0) return null;
          return (
            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dados Mensuráveis</p>
              {measurableObs.map((obs, i) => (
                <p key={i} className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/30">
                  {obs}
                </p>
              ))}
            </div>
          );
        })()}

        {/* Collapsible reference values */}
        <div className="pt-2 border-t border-border">
          <button
            onClick={() => setShowReferences(!showReferences)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            {showReferences ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>Valores de referência ideais</span>
          </button>
          {showReferences && (
            <div className="mt-2 space-y-1.5">
              {REFERENCE_VALUES.map((ref) => (
                <div key={ref.label} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{ref.label}</span>
                  <span className="text-muted-foreground/70">{ref.range}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
