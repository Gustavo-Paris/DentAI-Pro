import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
} from '@parisgroup-ai/pageshell/primitives';
import { BRAND_NAME } from '@/lib/branding';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ComparisonSlider } from '@/components/dsd/ComparisonSlider';
import { ProportionsCard } from '@/components/dsd/ProportionsCard';
import type { DSDAnalysis, SimulationLayer } from '@/types/dsd';
import { LAYER_LABELS } from '@/types/dsd';
import { useSharedEvaluation } from '@/hooks/domain/useSharedEvaluation';
import {
  CheckCircle,
  Calendar,
  Layers,
  Crown,
  Stethoscope,
  ArrowUpRight,
  CircleX,
  AlertTriangle,
  Clock,
} from 'lucide-react';

const treatmentIcons: Record<string, typeof Layers> = {
  resina: Layers,
  porcelana: Crown,
  coroa: Crown,
  implante: CircleX,
  endodontia: Stethoscope,
  encaminhamento: ArrowUpRight,
};

const treatmentLabelKeys: Record<string, string> = {
  resina: 'pages.treatmentResina',
  porcelana: 'pages.treatmentPorcelana',
  coroa: 'pages.treatmentCoroa',
  implante: 'pages.treatmentImplante',
  endodontia: 'pages.treatmentEndodontia',
  encaminhamento: 'pages.treatmentEncaminhamento',
};

export default function SharedEvaluation() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const { loading, expired, evaluations, dsdData, beforeImageUrl, simulationUrl, layerUrls } = useSharedEvaluation(token);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
          <h1 className="text-xl font-semibold font-display mb-2">{t('pages.sharedExpiredTitle')}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {t('pages.sharedExpiredDescription')}
          </p>
          <Button asChild>
            <Link to="/">{t('pages.goTo', { name: BRAND_NAME })}</Link>
          </Button>
        </div>
      </main>
    );
  }

  const completedCount = evaluations.filter((e) => e.status === 'completed').length;
  const evalDate = evaluations[0]?.created_at
    ? format(new Date(evaluations[0].created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-lg font-semibold tracking-[0.2em] font-display text-primary">{BRAND_NAME}</span>
          <Badge variant="outline" className="gap-1 text-xs">
            <Clock className="w-3 h-3" />
            {t('pages.sharedView')}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="mb-6 shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-xl font-display">{t('evaluation.dental')}</CardTitle>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {evalDate}
              </div>
              <span>
                {t('pages.teethEvaluated', { count: evaluations.length })}
              </span>
              <span>
                {completedCount}/{evaluations.length} {t('pages.completed', { count: completedCount })}
              </span>
            </div>
          </CardHeader>
        </Card>

        {/* DSD Simulation Section */}
        {dsdData?.dsd_analysis && beforeImageUrl && simulationUrl && (() => {
          const analysis = dsdData.dsd_analysis as unknown as DSDAnalysis;
          const layers = (dsdData.dsd_simulation_layers || []) as unknown as SimulationLayer[];
          const activeLayer = layers[activeLayerIndex];
          const activeAfterImage = activeLayer?.type && layerUrls[activeLayer.type]
            ? layerUrls[activeLayer.type]
            : simulationUrl;

          return (
            <Card className="mb-6 shadow-sm rounded-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-display">{t('pages.dsdSimulation')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {layers.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {layers.map((layer, idx) => (
                      <Button
                        key={layer.type}
                        variant={idx === activeLayerIndex ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs"
                        onClick={() => setActiveLayerIndex(idx)}
                      >
                        {LAYER_LABELS[layer.type as keyof typeof LAYER_LABELS] || layer.label}
                        {layer.includes_gengivoplasty && (
                          <Badge variant="secondary" className="ml-1 text-[10px] px-1">{t('components.evaluationDetail.gingiva')}</Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
                <ComparisonSlider
                  beforeImage={beforeImageUrl}
                  afterImage={activeAfterImage}
                  afterLabel={activeLayer?.label || t('dsd.simulation')}
                />
                <ProportionsCard analysis={analysis} />
              </CardContent>
            </Card>
          );
        })()}

        <div className="space-y-3">
          {evaluations.map((evaluation, index) => {
            const treatmentType = evaluation.treatment_type || 'resina';
            const TreatmentIcon = treatmentIcons[treatmentType] || Layers;
            const treatmentLabel = treatmentLabelKeys[treatmentType]
              ? t(treatmentLabelKeys[treatmentType])
              : t('pages.treatmentDefault');

            return (
              <Card key={index} className="shadow-sm rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-sm font-mono">
                        {evaluation.tooth}
                      </Badge>
                      <div>
                        <div className="flex items-center gap-2">
                          <TreatmentIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {treatmentLabel}
                          </span>
                        </div>
                        {evaluation.ai_treatment_indication && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {evaluation.ai_treatment_indication}
                          </p>
                        )}
                      </div>
                    </div>
                    {evaluation.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        <CheckCircle className="w-3 h-3" />
                        {t('evaluation.completed')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                        {t('evaluation.planned')}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          {evaluations[0]?.clinic_name && (
            <>
              {evaluations[0].clinic_name}
              {' '}&middot;{' '}
            </>
          )}
          {t('pages.generatedBy')} {BRAND_NAME} &middot; {t('pages.clinicalDecisionSupport')}
        </p>
      </main>
    </div>
  );
}
