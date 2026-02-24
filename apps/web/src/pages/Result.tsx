import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@parisgroup-ai/pageshell/primitives';
import { PageConfirmDialog } from '@parisgroup-ai/pageshell/interactions';
import { Download, Plus, CheckCircle, Package, Sparkles, Loader2, Heart, AlertTriangle, RefreshCw } from 'lucide-react';
import { ProtocolUnavailableAlert } from '@/components/ProtocolUnavailableAlert';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Protocol components
import CaseSummaryBox from '@/components/protocol/CaseSummaryBox';
import WhiteningPreferenceAlert from '@/components/protocol/WhiteningPreferenceAlert';
import { BruxismAlert } from '@/components/protocol/BruxismAlert';
import { ProtocolSections } from '@/components/protocol/ProtocolSections';
import { CollapsibleDSD } from '@/components/dsd/CollapsibleDSD';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { DetailPage, GenericErrorState } from '@parisgroup-ai/pageshell/composites';

import { useTranslation } from 'react-i18next';
import { useResult } from '@/hooks/domain/useResult';
import { BRAND_NAME } from '@/lib/branding';
import { formatToothLabel } from '@/lib/treatment-config';


// =============================================================================
// Page Adapter
// =============================================================================

export default function Result() {
  const { t } = useTranslation();
  const r = useResult();
  const navigate = useNavigate();

  if ((!r.evaluation && !r.isLoading) || r.isError) {
    return (
      <div className="flex items-center justify-center py-20 bg-background">
        <GenericErrorState
          title={t('result.notFound')}
          description={r.isError
            ? t('errors.loadFailed', { defaultValue: 'Erro ao carregar dados. Tente novamente.' })
            : t('result.notFoundDescription', { defaultValue: 'O resultado solicitado nao foi encontrado.' })
          }
          action={{ label: t('common.back', { defaultValue: 'Voltar' }), onClick: () => window.history.back() }}
        />
      </div>
    );
  }

  const evaluation = r.evaluation;
  const TreatmentIcon = r.currentTreatmentStyle.icon;

  return (
    <>
      <LoadingOverlay isLoading={r.generatingPDF} message={t('result.generatingPDF')} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <DetailPage
        title={r.currentTreatmentStyle.label}
        breadcrumbs={[
          { label: t('result.home'), href: '/dashboard' },
          { label: t('result.evaluation'), href: evaluation ? `/evaluation/${evaluation.session_id}` : undefined },
          { label: evaluation ? formatToothLabel(evaluation.tooth) : '...' },
        ]}
        backHref={evaluation ? `/evaluation/${evaluation.session_id}` : '/dashboard'}
        query={{ data: evaluation, isLoading: r.isLoading }}
        footerActions={[
          {
            label: t('wizard.recalculate'),
            icon: RefreshCw,
            onClick: () => { navigate('/new-case'); },
            variant: 'outline',
          },
          {
            label: t('result.downloadPDF'),
            icon: r.generatingPDF ? Loader2 : Download,
            onClick: r.handlePdfButtonClick,
            disabled: r.generatingPDF,
            variant: 'outline',
          },
          {
            label: t('result.newCase'),
            icon: Plus,
            onClick: () => { navigate('/new-case'); },
            variant: 'default',
          },
        ]}
        slots={{
          beforeContent: evaluation && (
            <>
              {/* Print header */}
              <div className="hidden print:block mb-8">
                <h1 className="text-2xl font-semibold">{BRAND_NAME}</h1>
                <p className="text-sm text-muted-foreground">
                  {t('result.reportTitle')} • {format(new Date(evaluation.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>

              {/* Treatment Type Header */}
              <Card className={`mb-6 grain-overlay shadow-md rounded-xl ${r.currentTreatmentStyle.bgClass} ${r.currentTreatmentStyle.borderClass}`}>
                <CardContent className="py-4">
                  <div className="relative flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${r.currentTreatmentStyle.bgClass}`}>
                      <TreatmentIcon className={`w-8 h-8 ${r.currentTreatmentStyle.iconClass}`} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl sm:text-2xl font-semibold font-display">{r.currentTreatmentStyle.label}</h2>
                      <p className="text-sm text-muted-foreground">
                        {formatToothLabel(evaluation.tooth)} • {evaluation.region.replace('-', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 print:hidden">
                        {format(new Date(evaluation.created_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    {['resina', 'porcelana', 'coroa'].includes(r.treatmentType) && (
                      <Badge variant={r.currentTreatmentStyle.badgeVariant}>
                        {r.treatmentType === 'resina' ? t('result.direct') : t('result.indirect')}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ),
        }}
      >
        {(evaluation) => {
          if (!evaluation) return null;
          return (
          <>
            {/* Inventory Banner */}
            {r.treatmentType === 'resina' && !evaluation.has_inventory_at_creation && (
              <Card className="mb-6 border-primary/20 bg-primary/5 dark:bg-primary/10 print:hidden">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t('result.customizeRecommendations')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('result.customizeRecommendationsDesc')}
                      </p>
                    </div>
                    <Link to="/inventory">
                      <Button size="sm" variant="outline">{t('inventory.goToInventory')}</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Special Treatment Recommendations */}
            {r.isSpecialTreatment && r.genericProtocol?.recommendations && (
              <Card className="mb-6 border-muted">
                <CardContent className="py-4">
                  <p className="text-sm font-medium mb-2">{t('result.patientRecommendations')}</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {r.genericProtocol.recommendations.map((rec, i) => (
                      <li key={i}>• {rec}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Protocol unavailable fallback */}
            {!r.hasProtocol && !r.isSpecialTreatment && r.treatmentType === 'resina' && (
              <ProtocolUnavailableAlert
                onReprocess={() => r.evaluation?.session_id && navigate(`/evaluation/${r.evaluation.session_id}`)}
              />
            )}

            {/* Main Recommendation */}
            {r.resin && (
              <section className="mb-8">
                <Card className="shadow-sm hover:shadow-md rounded-xl transition-shadow duration-300 ai-glow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl font-display flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-foreground" />
                          {r.resin.name}
                        </CardTitle>
                        <p className="text-muted-foreground mt-1">{r.resin.manufacturer}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="secondary">{r.resin.type}</Badge>
                        {evaluation.is_from_inventory && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 animate-[badge-pulse-ring_3s_ease-in-out_infinite]">
                            <Package className="w-3 h-3 mr-1" />
                            {t('result.inYourStock')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="bg-secondary/30 rounded-xl p-3">
                        <span className="text-muted-foreground">{t('result.opacity')}</span>
                        <p className="font-medium">{r.resin.opacity}</p>
                      </div>
                      <div className="bg-secondary/30 rounded-xl p-3">
                        <span className="text-muted-foreground">{t('result.resistance')}</span>
                        <p className="font-medium">{r.resin.resistance}</p>
                      </div>
                      <div className="bg-secondary/30 rounded-xl p-3">
                        <span className="text-muted-foreground">{t('result.polishing')}</span>
                        <p className="font-medium">{r.resin.polishing}</p>
                      </div>
                      <div className="bg-secondary/30 rounded-xl p-3">
                        <span className="text-muted-foreground">{t('result.aesthetics')}</span>
                        <p className="font-medium">{r.resin.aesthetics}</p>
                      </div>
                    </div>
                    {evaluation.recommendation_text && (
                      <div className="pt-4 border-t border-border">
                        <h4 className="font-medium mb-2">{t('result.justification')}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {evaluation.recommendation_text}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Protocol sections */}
            <ProtocolSections
              treatmentType={r.treatmentType}
              hasProtocol={r.hasProtocol}
              isPorcelain={r.isPorcelain}
              isSpecialTreatment={r.isSpecialTreatment}
              layers={r.layers}
              finishingProtocol={evaluation.stratification_protocol?.finishing}
              genericProtocol={r.genericProtocol}
              cementationProtocol={r.cementationProtocol}
              protocolAlternative={r.protocolAlternative}
              checklist={r.checklist}
              alerts={r.treatmentType === 'resina' ? r.alerts : []}
              warnings={r.treatmentType === 'resina' ? r.warnings : []}
              confidence={r.confidence}
              checkedIndices={evaluation.checklist_progress || []}
              onProgressChange={r.handleChecklistChange}
              t={t}
              printHideStepByStep
            />

            {/* Whitening Preference Alert */}
            {r.treatmentType === 'resina' && (
              <section className="mb-8">
                <WhiteningPreferenceAlert
                  originalColor={evaluation.tooth_color}
                  aestheticGoals={evaluation.patient_aesthetic_goals}
                  protocolLayers={r.layers}
                />
              </section>
            )}

            {/* Bruxism Alert */}
            {evaluation.bruxism && (
              <section className="mb-8">
                <BruxismAlert show={true} treatmentType={r.treatmentType} />
              </section>
            )}

            {/* Ideal Resin */}
            {r.showIdealResin && r.idealResin && (
              <section className="mb-8">
                <Card className="border-muted-foreground/20 bg-secondary/50 ai-glow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
                      <Sparkles className="w-4 h-4 ai-dot" />
                      {t('result.idealOption')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-medium">{r.idealResin.name}</p>
                      <p className="text-sm text-muted-foreground">{r.idealResin.manufacturer}</p>
                    </div>
                    {evaluation.ideal_reason && (
                      <p className="text-sm text-muted-foreground">{evaluation.ideal_reason}</p>
                    )}
                    <p className="text-xs text-muted-foreground/70">
                      {t('result.considerAcquiring')}
                    </p>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Alternatives */}
            {r.alternatives && r.alternatives.length > 0 && (
              <section className="mb-8">
                <h3 className="font-semibold font-display mb-3">{t('result.otherAlternatives')}</h3>
                <div className="space-y-3">
                  {r.alternatives.map((alt, index) => (
                    <Card key={index} className="p-4 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{alt.name}</span>
                        <span className="text-sm text-muted-foreground">{alt.manufacturer}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{alt.reason}</p>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Case Summary */}
            <section className="mb-8">
              <CaseSummaryBox
                treatmentType={r.treatmentType}
                patientAge={evaluation.patient_age}
                tooth={evaluation.tooth}
                region={evaluation.region}
                cavityClass={evaluation.cavity_class}
                restorationSize={evaluation.restoration_size}
                toothColor={evaluation.tooth_color}
                aestheticLevel={evaluation.aesthetic_level}
                bruxism={evaluation.bruxism}
                stratificationNeeded={evaluation.stratification_needed}
                indicationReason={evaluation.ai_indication_reason || r.genericProtocol?.ai_reason}
                whiteningGoal={evaluation.patient_aesthetic_goals}
                secondaryPhotos={{ angle45: r.photoUrls.angle45, face: r.photoUrls.face }}
              />
            </section>

            {/* DSD Section */}
            {evaluation.dsd_analysis && (
              <section className="mb-8">
                <CollapsibleDSD
                  analysis={evaluation.dsd_analysis}
                  beforeImage={r.photoUrls.frontal}
                  afterImage={r.dsdSimulationUrl}
                  defaultOpen={true}
                  layers={r.dsdSimulationLayers}
                  layerUrls={r.dsdLayerUrls}
                />
              </section>
            )}

            {/* Patient Preferences */}
            {evaluation.patient_aesthetic_goals && (
              <section className="mb-8">
                <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Heart className="w-4 h-4 text-primary" />
                      {t('result.patientPreferences')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground italic">
                      "{evaluation.patient_aesthetic_goals}"
                    </p>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Disclaimer */}
            <div className="mt-8 p-4 rounded-xl shadow-sm border border-warning/20 bg-warning/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <p className="text-sm text-warning-foreground dark:text-warning">
                  {t('result.disclaimer')}
                </p>
              </div>
            </div>
          </>
          );
        }}
      </DetailPage>
      </div>

      {/* PDF Confirmation Dialog */}
      <PageConfirmDialog
        open={r.showPdfConfirmDialog}
        onOpenChange={r.setShowPdfConfirmDialog}
        title={t('evaluation.incompleteChecklistTitle')}
        description={t('result.pdfChecklistIncomplete')}
        confirmText={t('result.generatePDF')}
        cancelText={t('common.cancel')}
        onConfirm={r.handleExportPDF}
        variant="warning"
      />
    </>
  );
}
