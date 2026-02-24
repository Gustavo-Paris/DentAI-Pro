import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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

const VALUE_KEY_MAP: Record<string, Record<string, string>> = {
  facial_midline: {
    centrada: 'components.dsd.proportions.facialMidlineCentered',
    desviada_esquerda: 'components.dsd.proportions.facialMidlineDeviatedLeft',
    desviada_direita: 'components.dsd.proportions.facialMidlineDeviatedRight',
  },
  dental_midline: {
    alinhada: 'components.dsd.proportions.dentalMidlineAligned',
    desviada_esquerda: 'components.dsd.proportions.dentalMidlineDeviatedLeft',
    desviada_direita: 'components.dsd.proportions.dentalMidlineDeviatedRight',
  },
  smile_line: {
    alta: 'components.dsd.proportions.smileLineHigh',
    média: 'components.dsd.proportions.smileLineMedium',
    baixa: 'components.dsd.proportions.smileLineLow',
  },
  buccal_corridor: {
    adequado: 'components.dsd.proportions.buccalCorridorAdequate',
    excessivo: 'components.dsd.proportions.buccalCorridorExcessive',
    ausente: 'components.dsd.proportions.buccalCorridorAbsent',
  },
  occlusal_plane: {
    nivelado: 'components.dsd.proportions.occlusalPlaneLeveled',
    inclinado_esquerda: 'components.dsd.proportions.occlusalPlaneInclinedLeft',
    inclinado_direita: 'components.dsd.proportions.occlusalPlaneInclinedRight',
  },
  lip_thickness: {
    fino: 'components.dsd.proportions.lipThicknessThin',
    médio: 'components.dsd.proportions.lipThicknessMedium',
    volumoso: 'components.dsd.proportions.lipThicknessThick',
  },
  overbite_suspicion: {
    sim: 'components.dsd.proportions.overbiteSuspected',
    não: 'components.dsd.proportions.overbiteNone',
    indeterminado: 'components.dsd.proportions.overbiteIndeterminate',
  },
};

const DESC_KEY_MAP: Record<string, Record<string, string>> = {
  buccal_corridor: {
    excessivo: 'components.dsd.proportions.buccalCorridorExcessiveDesc',
    ausente: 'components.dsd.proportions.buccalCorridorAbsentDesc',
  },
  smile_line: {
    alta: 'components.dsd.proportions.smileLineHighDesc',
    baixa: 'components.dsd.proportions.smileLineLowDesc',
  },
  facial_midline: {
    desviada_esquerda: 'components.dsd.proportions.midlineDeviatedDesc',
    desviada_direita: 'components.dsd.proportions.midlineDeviatedDesc',
  },
  dental_midline: {
    desviada_esquerda: 'components.dsd.proportions.dentalMidlineDeviatedDesc',
    desviada_direita: 'components.dsd.proportions.dentalMidlineDeviatedDesc',
  },
  occlusal_plane: {
    inclinado_esquerda: 'components.dsd.proportions.occlusalPlaneInclinedDesc',
    inclinado_direita: 'components.dsd.proportions.occlusalPlaneInclinedDesc',
  },
  lip_thickness: {
    fino: 'components.dsd.proportions.lipThicknessThinDesc',
  },
};

const REFERENCE_VALUE_KEYS = [
  { labelKey: 'components.dsd.proportions.refGoldenRatio', rangeKey: 'components.dsd.proportions.refGoldenRatioRange' },
  { labelKey: 'components.dsd.proportions.refSymmetry', rangeKey: 'components.dsd.proportions.refSymmetryRange' },
  { labelKey: 'components.dsd.proportions.refSmileLine', rangeKey: 'components.dsd.proportions.refSmileLineRange' },
  { labelKey: 'components.dsd.proportions.refBuccalCorridor', rangeKey: 'components.dsd.proportions.refBuccalCorridorRange' },
  { labelKey: 'components.dsd.proportions.refICRatio', rangeKey: 'components.dsd.proportions.refICRatioRange' },
];

// Proportion items are now built with API keys directly — no label-to-key lookup needed

export function ProportionsCard({ analysis }: ProportionsCardProps) {
  const { t } = useTranslation();
  const [showReferences, setShowReferences] = useState(false);

  const proportionItems = useMemo(() => [
    {
      label: t('components.dsd.proportions.facialMidline'),
      apiKey: 'facial_midline',
      value: analysis.facial_midline,
      status: getStatus(analysis.facial_midline, ['centrada']),
    },
    {
      label: t('components.dsd.proportions.dentalMidline'),
      apiKey: 'dental_midline',
      value: analysis.dental_midline,
      status: getStatus(analysis.dental_midline, ['alinhada']),
    },
    {
      label: t('components.dsd.proportions.smileLine'),
      apiKey: 'smile_line',
      value: analysis.smile_line,
      status: getStatus(analysis.smile_line, ['média']),
    },
    {
      label: t('components.dsd.proportions.buccalCorridor'),
      apiKey: 'buccal_corridor',
      value: analysis.buccal_corridor,
      status: getStatus(analysis.buccal_corridor, ['adequado']),
    },
    {
      label: t('components.dsd.proportions.occlusalPlane'),
      apiKey: 'occlusal_plane',
      value: analysis.occlusal_plane,
      status: getStatus(analysis.occlusal_plane, ['nivelado']),
    },
    // Lip thickness - only show if present
    ...(analysis.lip_thickness ? [{
      label: t('components.dsd.proportions.lipThickness'),
      apiKey: 'lip_thickness',
      value: analysis.lip_thickness,
      status: getStatus(analysis.lip_thickness, ['médio', 'volumoso']),
    }] : []),
    // Overbite suspicion - only show if sim or não (hide indeterminado)
    ...(analysis.overbite_suspicion && analysis.overbite_suspicion !== 'indeterminado' ? [{
      label: t('components.dsd.proportions.overbite'),
      apiKey: 'overbite_suspicion',
      value: analysis.overbite_suspicion,
      status: (analysis.overbite_suspicion === 'sim' ? 'warning' : 'good') as 'good' | 'warning' | 'bad',
    }] : []),
  ], [analysis, t]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-destructive';
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {t('components.dsd.proportions.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score indicators */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('components.dsd.proportions.goldenRatio')}</span>
              <span className={cn('font-semibold', getScoreColor(analysis.golden_ratio_compliance))}>
                {analysis.golden_ratio_compliance}%
              </span>
            </div>
            <Progress value={analysis.golden_ratio_compliance} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('components.dsd.proportions.symmetry')}</span>
              <span className={cn('font-semibold', getScoreColor(analysis.symmetry_score))}>
                {analysis.symmetry_score}%
              </span>
            </div>
            <Progress value={analysis.symmetry_score} className="h-2" />
          </div>
        </div>
        {(analysis.golden_ratio_compliance < 60 || analysis.symmetry_score < 60) && (
          <p className="text-xs text-muted-foreground">
            {t('components.dsd.proportions.preTreatmentNote')}
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
                  {VALUE_KEY_MAP[item.apiKey]?.[item.value] ? t(VALUE_KEY_MAP[item.apiKey][item.value]) : item.value}
                </span>
                <StatusIcon status={item.status} />
              </div>
            </div>
          ))}

          {/* Contextual descriptions for abnormal values */}
          {proportionItems.map((item) => {
            const descKey = item.status !== 'good' ? DESC_KEY_MAP[item.apiKey]?.[item.value] : null;
            if (!descKey) return null;
            const desc = t(descKey);
            return (
              <div key={`desc-${item.label}`} className="flex items-start gap-2 py-1.5 px-3 rounded-md bg-warning/10">
                <AlertCircle className="w-3.5 h-3.5 text-warning mt-0.5 shrink-0" />
                <p className="text-xs text-warning/80">
                  <span className="font-medium">{item.label}:</span> {desc}
                </p>
              </div>
            );
          })}

          {/* Buccal corridor orthodontic note */}
          {analysis.buccal_corridor === 'excessivo' && (
            <div className="flex items-start gap-2 py-2 px-3 rounded-md bg-warning/10 border border-warning/30">
              <AlertCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
              <p className="text-xs text-warning/80">
                {t('components.dsd.proportions.buccalCorridorOrthoNote')}
              </p>
            </div>
          )}
        </div>

        {/* Gingival zenith patterns (shown when gengivoplasty is suggested) */}
        {analysis.suggestions?.some(s =>
          s.treatment_indication === 'gengivoplastia' ||
          s.proposed_change?.toLowerCase().includes('gengivoplastia')
        ) && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('components.dsd.proportions.gingivalZenithTitle')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800">
                <p className="text-xs font-semibold text-pink-700 dark:text-pink-300 mb-1">{t('components.dsd.proportions.zenithInvertedTriangle')}</p>
                <div className="flex items-end justify-center gap-1 h-8">
                  <div className="w-3 bg-pink-300 dark:bg-pink-600 rounded-t" style={{ height: '100%' }} />
                  <div className="w-2 bg-pink-200 dark:bg-pink-700 rounded-t" style={{ height: '70%' }} />
                  <div className="w-3 bg-pink-300 dark:bg-pink-600 rounded-t" style={{ height: '100%' }} />
                </div>
                <p className="text-[10px] text-pink-600 dark:text-pink-400 mt-1 text-center">{t('components.dsd.proportions.zenithInvertedTriangleDesc')}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">{t('components.dsd.proportions.zenithAligned')}</p>
                <div className="flex items-end justify-center gap-1 h-8">
                  <div className="w-3 bg-blue-300 dark:bg-blue-600 rounded-t" style={{ height: '100%' }} />
                  <div className="w-2 bg-blue-200 dark:bg-blue-700 rounded-t" style={{ height: '100%' }} />
                  <div className="w-3 bg-blue-300 dark:bg-blue-600 rounded-t" style={{ height: '100%' }} />
                </div>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 text-center">{t('components.dsd.proportions.zenithAlignedDesc')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Measurable data from observations */}
        {(() => {
          const numericPattern = /\d+[.,]?\d*\s*(%|mm|°)/;
          const measurableObs = (analysis.observations || []).filter(obs => numericPattern.test(obs));
          if (measurableObs.length === 0) return null;
          return (
            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('components.dsd.proportions.measurableData')}</p>
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
            <span>{t('components.dsd.proportions.referenceValues')}</span>
          </button>
          {showReferences && (
            <div className="mt-2 space-y-1.5">
              {REFERENCE_VALUE_KEYS.map((ref) => (
                <div key={ref.labelKey} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t(ref.labelKey)}</span>
                  <span className="text-muted-foreground/70">{t(ref.rangeKey)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
