import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Layers, Crown, Stethoscope, ArrowUpRight, Smile, HeartPulse, Palette } from 'lucide-react';

import ProtocolTable from '@/components/protocol/ProtocolTable';
import ProtocolChecklist from '@/components/protocol/ProtocolChecklist';
import AlertsSection from '@/components/protocol/AlertsSection';
import WarningsSection from '@/components/protocol/WarningsSection';
import ConfidenceIndicator from '@/components/protocol/ConfidenceIndicator';
import AlternativeBox from '@/components/protocol/AlternativeBox';
import { CementationProtocolCard } from '@/components/protocol/CementationProtocolCard';
import { VeneerPreparationCard } from '@/components/protocol/VeneerPreparationCard';
import { FinishingPolishingCard } from '@/components/protocol/FinishingPolishingCard';
import { DetailPage } from '@pageshell/composites';

import { useTranslation } from 'react-i18next';
import { useGroupResult } from '@/hooks/domain/useGroupResult';
import { formatToothLabel } from '@/lib/treatment-config';

export default function GroupResult() {
  const { t } = useTranslation();
  const g = useGroupResult();

  if (!g.primaryEval && !g.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('result.notFound')}</p>
      </div>
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

              {/* Protocol sections — porcelain vs resin vs special */}
              {g.isPorcelain && g.cementationProtocol ? (
                <>
                  <section className="mb-8">
                    <VeneerPreparationCard />
                  </section>
                  <section className="mb-8">
                    <CementationProtocolCard
                      protocol={g.cementationProtocol}
                      checkedIndices={evaluation.checklist_progress || []}
                      onProgressChange={g.handleChecklistChange}
                    />
                  </section>
                </>
              ) : (
                <>
                  {g.hasProtocol && g.treatmentType === 'resina' && (
                    <section className="mb-8">
                      <h3 className="font-semibold font-display mb-3 flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        <span>{t('result.stratificationProtocol')}</span>
                      </h3>
                      <ProtocolTable layers={g.layers} />
                      {g.layers.length > 0 && (
                        <Card className="mt-4 border-primary/20">
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Palette className="w-4 h-4" />
                              {t('result.resinsUsed')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="flex flex-wrap gap-2">
                              {[...new Set(g.layers.map(l => `${l.resin_brand} ${l.shade}`))].map((resin, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {resin}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </section>
                  )}

                  {g.treatmentType === 'resina' && evaluation.stratification_protocol?.finishing && (
                    <section className="mb-8">
                      <FinishingPolishingCard protocol={evaluation.stratification_protocol.finishing} />
                    </section>
                  )}

                  {g.isSpecialTreatment && g.genericProtocol && (
                    <section className="mb-8">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            {g.treatmentType === 'coroa' && <Crown className="w-4 h-4" />}
                            {g.treatmentType === 'implante' && <></>}
                            {g.treatmentType === 'endodontia' && <Stethoscope className="w-4 h-4" />}
                            {g.treatmentType === 'encaminhamento' && <ArrowUpRight className="w-4 h-4" />}
                            {g.treatmentType === 'gengivoplastia' && <Smile className="w-4 h-4" />}
                            {g.treatmentType === 'recobrimento_radicular' && <HeartPulse className="w-4 h-4" />}
                            {g.currentTreatmentStyle.label}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {g.genericProtocol.summary && (
                            <p className="text-sm text-muted-foreground mb-4">{g.genericProtocol.summary}</p>
                          )}
                          <ProtocolChecklist
                            items={g.genericProtocol.checklist}
                            checkedIndices={evaluation.checklist_progress || []}
                            onProgressChange={g.handleChecklistChange}
                          />
                        </CardContent>
                      </Card>
                    </section>
                  )}

                  {g.treatmentType === 'resina' && g.protocolAlternative && (
                    <section className="mb-8">
                      <AlternativeBox alternative={g.protocolAlternative} />
                    </section>
                  )}
                </>
              )}

              {/* Checklist */}
              {g.treatmentType === 'resina' && g.checklist.length > 0 && (
                <section className="mb-8">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{t('result.stepByStep')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ProtocolChecklist
                        items={g.checklist}
                        checkedIndices={evaluation.checklist_progress || []}
                        onProgressChange={g.handleChecklistChange}
                      />
                    </CardContent>
                  </Card>
                </section>
              )}

              {/* Alerts and Warnings */}
              {(g.alerts.length > 0 || g.warnings.length > 0) && (
                <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AlertsSection alerts={g.alerts} />
                  <WarningsSection warnings={g.warnings} />
                </section>
              )}

              {/* Confidence */}
              {g.treatmentType === 'resina' && g.hasProtocol && (
                <section className="mb-8">
                  <ConfidenceIndicator confidence={g.confidence} />
                </section>
              )}
            </>
          );
        }}
      </DetailPage>
    </div>
  );
}
