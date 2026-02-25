import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@parisgroup-ai/pageshell/primitives';
import { PageConfirmDialog } from '@parisgroup-ai/pageshell/interactions';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { ProtocolUnavailableAlert } from '@/components/ProtocolUnavailableAlert';

import { ProtocolSections } from '@/components/protocol/ProtocolSections';
import { CollapsibleDSD } from '@/components/dsd/CollapsibleDSD';
import { DetailPage, GenericErrorState } from '@parisgroup-ai/pageshell/composites';

import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useGroupResult } from '@/hooks/domain/useGroupResult';
import { formatToothLabel } from '@/lib/treatment-config';

export default function GroupResult() {
  const { t } = useTranslation();
  useDocumentTitle(t('pageTitle.groupResult', { defaultValue: 'Resultado do Grupo' }));
  const g = useGroupResult();
  const navigate = useNavigate();
  const [showMarkAllConfirm, setShowMarkAllConfirm] = useState(false);

  if ((!g.primaryEval && !g.isLoading) || g.isError) {
    return (
      <div className="flex items-center justify-center py-20 bg-background">
        <GenericErrorState
          title={t('result.notFound')}
          description={g.isError
            ? t('errors.loadFailed', { defaultValue: 'Erro ao carregar dados. Tente novamente.' })
            : t('result.notFoundDescription', { defaultValue: 'O resultado solicitado nao foi encontrado.' })
          }
          action={{ label: t('common.back', { defaultValue: 'Voltar' }), onClick: () => window.history.back() }}
        />
      </div>
    );
  }

  const evaluation = g.primaryEval;
  const TreatmentIcon = g.currentTreatmentStyle.icon;
  const teethLabel = g.groupTeeth.join(', ');

  return (
    <>
      <DetailPage
        className="max-w-5xl mx-auto py-6 sm:py-8"
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
            onClick: () => setShowMarkAllConfirm(true),
            variant: 'outline',
          },
        ]}
        footerActions={[
          {
            label: t('wizard.recalculate'),
            icon: RefreshCw,
            onClick: () => { navigate('/new-case'); },
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
                <ProtocolUnavailableAlert
                  onReprocess={() => navigate(`/evaluation/${g.sessionId}`)}
                />
              )}

              {/* Resin recommendation */}
              {g.resin && (
                <section className="mb-8">
                  <Card className="shadow-sm rounded-xl hover:shadow-md transition-shadow duration-300 ai-glow">
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
                    defaultOpen={true}
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

    {/* Confirm mark all as completed */}
    <PageConfirmDialog
      open={showMarkAllConfirm}
      onOpenChange={setShowMarkAllConfirm}
      title={t('evaluation.markAllCompletedTitle', { defaultValue: 'Marcar todas como concluídas?' })}
      description={t('evaluation.markAllCompletedDescription', { defaultValue: 'Esta ação marcará todas as avaliações pendentes como concluídas.' })}
      confirmText={t('common.confirm', { defaultValue: 'Confirmar' })}
      cancelText={t('common.cancel')}
      onConfirm={() => {
        setShowMarkAllConfirm(false);
        g.handleMarkAllCompleted();
      }}
      variant="warning"
    />
    </>
  );
}
