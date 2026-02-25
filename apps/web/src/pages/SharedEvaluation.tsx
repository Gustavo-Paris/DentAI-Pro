import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@parisgroup-ai/pageshell/primitives';
import { SharedDetailPage } from '@/components/evaluation/SharedDetailPage';
import { EvaluationToothCard as PageEvaluationToothCard } from '@/components/evaluation/EvaluationToothCard';
import { PageImageCompare } from '@parisgroup-ai/domain-odonto-ai/imaging';
import { BRAND_NAME } from '@/lib/branding';
import { EVALUATION_STATUS } from '@/lib/evaluation-status';
import { getTreatmentConfig } from '@/lib/treatment-config';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ComparisonSlider } from '@/components/dsd/ComparisonSlider';
import { ProportionsCard } from '@/components/dsd/ProportionsCard';
import type { DSDAnalysis, SimulationLayer, SimulationLayerType } from '@/types/dsd';
import { getLayerLabel } from '@/types/dsd';
import { useSharedEvaluation } from '@/hooks/domain/useSharedEvaluation';
import { Calendar } from 'lucide-react';

export default function SharedEvaluation() {
  const { t } = useTranslation();
  useDocumentTitle(t('pageTitle.sharedEvaluation', { defaultValue: 'Avaliação Compartilhada' }));
  const { token } = useParams<{ token: string }>();
  const { loading, expired, errorReason, evaluations, dsdData, beforeImageUrl, simulationUrl, layerUrls } = useSharedEvaluation(token);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [dsdImageError, setDsdImageError] = useState(false);

  const pageState = loading ? 'loading' : expired ? 'expired' : 'data';
  const isNotFound = errorReason === 'not_found';

  const completedCount = !loading && !expired
    ? evaluations.filter((e) => e.status === EVALUATION_STATUS.COMPLETED).length
    : 0;
  const evalDate = !loading && !expired && evaluations[0]?.created_at
    ? format(new Date(evaluations[0].created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '';

  return (
    <SharedDetailPage
      brandName={BRAND_NAME}
      badgeText={t('pages.sharedView')}
      state={pageState}
      expiredConfig={{
        title: isNotFound ? t('pages.sharedNotFoundTitle') : t('pages.sharedExpiredTitle'),
        description: isNotFound ? t('pages.sharedNotFoundDescription') : t('pages.sharedExpiredDescription'),
        cta: { label: t('pages.goTo', { name: BRAND_NAME }), href: '/' },
      }}
      footer={{
        clinicName: evaluations[0]?.clinic_name,
        attribution: `${t('pages.generatedBy')} ${BRAND_NAME} \u00B7 ${t('pages.clinicalDecisionSupport')}`,
      }}
    >
      {/* Summary Card */}
      <Card className="mb-6 shadow-sm rounded-xl animate-[fade-in-up_0.6s_ease-out_both]">
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

        if (dsdImageError) {
          return (
            <Card className="mb-6 shadow-sm rounded-xl overflow-hidden animate-[fade-in-up_0.6s_ease-out_0.1s_both]">
              <CardHeader>
                <CardTitle className="text-lg font-display">{t('pages.dsdSimulation')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('pages.dsdImageLoadError', { defaultValue: 'Nao foi possivel carregar as imagens da simulacao DSD.' })}
                </p>
              </CardContent>
            </Card>
          );
        }

        return (
          <Card className="mb-6 shadow-sm rounded-xl overflow-hidden animate-[fade-in-up_0.6s_ease-out_0.1s_both]">
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
                      className="text-xs transition-all duration-150"
                      aria-pressed={idx === activeLayerIndex}
                      onClick={() => setActiveLayerIndex(idx)}
                    >
                      {getLayerLabel(layer.type as SimulationLayerType, t)}
                      {layer.includes_gengivoplasty && (
                        <Badge variant="secondary" className="ml-1 text-[10px] px-1">{t('components.evaluationDetail.gingiva')}</Badge>
                      )}
                    </Button>
                  ))}
                </div>
              )}
              <div className="print:hidden" aria-live="polite">
                {/* Hidden probes to detect image load failures */}
                <img src={beforeImageUrl} alt="" className="hidden" onError={() => setDsdImageError(true)} />
                <img src={activeAfterImage} alt="" className="hidden" onError={() => setDsdImageError(true)} />
                <ComparisonSlider
                  beforeImage={beforeImageUrl}
                  afterImage={activeAfterImage}
                  afterLabel={activeLayer?.label || t('dsd.simulation')}
                />
              </div>
              <ProportionsCard analysis={analysis} />
              <PageImageCompare
                pair={{
                  before: {
                    id: 'original',
                    url: beforeImageUrl,
                    type: 'intraoral-photo',
                    patientId: '',
                    patientName: evaluations[0]?.patient_name || '',
                    capturedDate: evalDate,
                    createdAt: evaluations[0]?.created_at || '',
                    updatedAt: evaluations[0]?.created_at || '',
                  },
                  after: {
                    id: 'simulation',
                    url: activeAfterImage,
                    type: 'intraoral-photo',
                    patientId: '',
                    patientName: evaluations[0]?.patient_name || '',
                    capturedDate: evalDate,
                    createdAt: evaluations[0]?.created_at || '',
                    updatedAt: evaluations[0]?.created_at || '',
                  },
                  label: t('pages.dsdComparison', { defaultValue: 'Comparação DSD' }),
                }}
                beforeLabel={t('dsd.original', { defaultValue: 'Original' })}
                afterLabel={t('dsd.simulation', { defaultValue: 'Simulação' })}
                className="mt-4 hidden print:block"
              />
            </CardContent>
          </Card>
        );
      })()}

      {/* Tooth Cards */}
      <div className="space-y-4 animate-[fade-in-up_0.6s_ease-out_0.2s_both]">
        {evaluations.map((evaluation, index) => {
          const treatmentType = evaluation.treatment_type || 'resina';
          const config = getTreatmentConfig(treatmentType);

          return (
            <PageEvaluationToothCard
              key={evaluation.tooth ?? index}
              evaluation={{
                tooth: evaluation.tooth,
                treatmentType,
                treatmentLabel: t(config.shortLabelKey),
                treatmentIcon: config.icon,
                status: evaluation.status as 'completed' | 'planned',
                aiIndication: evaluation.ai_treatment_indication,
              }}
              completedLabel={t('evaluation.completed')}
              plannedLabel={t('evaluation.planned')}
            />
          );
        })}
      </div>
    </SharedDetailPage>
  );
}
