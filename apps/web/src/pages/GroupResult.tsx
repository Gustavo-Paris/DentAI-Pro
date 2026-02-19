import { Card, CardContent, CardHeader, CardTitle, Badge } from '@parisgroup-ai/pageshell/primitives';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { ErrorState } from '@/components/ui/error-state';

import { ProtocolSections } from '@/components/protocol/ProtocolSections';
import { CollapsibleDSD } from '@/components/dsd/CollapsibleDSD';
import { DetailPage } from '@parisgroup-ai/pageshell/composites';

import { useTranslation } from 'react-i18next';
import { useGroupResult } from '@/hooks/domain/useGroupResult';
import { formatToothLabel } from '@/lib/treatment-config';

export default function GroupResult() {
  const { t } = useTranslation();
  const g = useGroupResult();

  if (!g.primaryEval && !g.isLoading) {
    return (
      <ErrorState
        variant="fullscreen"
        title={t('result.notFound')}
        description={t('result.notFoundDescription', { defaultValue: 'O resultado solicitado nao foi encontrado.' })}
        action={{ label: t('common.back', { defaultValue: 'Voltar' }), onClick: () => window.history.back() }}
      />
    );
  }

  const evaluation = g.primaryEval;
  const TreatmentIcon = g.currentTreatmentStyle.icon;
  const teethLabel = g.groupTeeth.join(', ');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <DetailPage
        title={`${g.currentTreatmentStyle.label} — ${t('components.groupResult.unifiedProtocol')}`}
        breadcrumbs={[
          { label: t('result.home'), href: '/dashboard' },
          { label: t('result.evaluation'), href: `/evaluation/${g.sessionId}` },
          { label: t('components.groupResult.unifiedProtocolBreadcrumb', { count: g.groupTeeth.length }) },
        ]}
        backHref={`/evaluation/${g.sessionId}`}
        query={{ data: evaluation, isLoading: g.isLoading }}
        headerActions={[
          {
            label: t('evaluation.markAllCompleted'),
            icon: CheckCircle,
            onClick: g.handleMarkAllCompleted,
            variant: 'outline',
          },
        ]}
        slots={{
          beforeContent: evaluation && (
            <Card className={`mb-6 shadow-md rounded-xl ${g.currentTreatmentStyle.bgClass} ${g.currentTreatmentStyle.borderClass}`}>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${g.currentTreatmentStyle.bgClass}`}>
                    <TreatmentIcon className={`w-8 h-8 ${g.currentTreatmentStyle.iconClass}`} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl sm:text-2xl font-semibold font-display">
                      {t('components.groupResult.unifiedProtocol')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {g.currentTreatmentStyle.label}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {g.groupTeeth.map((tooth) => (
                        <Badge key={tooth} variant="outline" className="text-xs">
                          {formatToothLabel(tooth)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {g.groupTeeth.length} {t('components.groupResult.teeth')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ),
        }}
      >
        {(evaluation) => {
          if (!evaluation) return null;
          return (
            <>
              {/* Protocol unavailable fallback */}
              {!g.hasProtocol && !g.isSpecialTreatment && g.treatmentType === 'resina' && (
                <section className="mb-8">
                  <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{t('result.protocolUnavailable', { defaultValue: 'Protocolo não disponível' })}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('result.protocolUnavailableDesc', { defaultValue: 'A geração do protocolo de resina não foi concluída. Tente reprocessar este caso.' })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* Resin recommendation */}
              {g.resin && (
                <section className="mb-8">
                  <Card className="shadow-sm rounded-xl">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl font-display flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-foreground" />
                            {g.resin.name}
                          </CardTitle>
                          <p className="text-muted-foreground mt-1">{g.resin.manufacturer}</p>
                        </div>
                        <Badge variant="secondary">{g.resin.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        {t('components.groupResult.applyIdenticalProtocol')} <strong>{teethLabel}</strong>
                      </p>
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* DSD Section */}
              {g.dsdAnalysis && (
                <section className="mb-8">
                  <CollapsibleDSD
                    analysis={g.dsdAnalysis}
                    beforeImage={g.photoUrl}
                    afterImage={g.dsdSimulationUrl}
                    defaultOpen={false}
                    layers={g.dsdSimulationLayers}
                    layerUrls={g.dsdLayerUrls}
                  />
                </section>
              )}

              {/* Protocol sections -- porcelain vs resin vs special */}
              <ProtocolSections
                treatmentType={g.treatmentType}
                hasProtocol={g.hasProtocol}
                isPorcelain={g.isPorcelain}
                isSpecialTreatment={g.isSpecialTreatment}
                layers={g.layers}
                finishingProtocol={evaluation.stratification_protocol?.finishing}
                genericProtocol={g.genericProtocol}
                cementationProtocol={g.cementationProtocol}
                protocolAlternative={g.protocolAlternative}
                checklist={g.checklist}
                alerts={g.alerts}
                warnings={g.warnings}
                confidence={g.confidence}
                checkedIndices={evaluation.checklist_progress || []}
                onProgressChange={g.handleChecklistChange}
                t={t}
                treatmentStyleLabel={g.currentTreatmentStyle.label}
              />
            </>
          );
        }}
      </DetailPage>
    </div>
  );
}
