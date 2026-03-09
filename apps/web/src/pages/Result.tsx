import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@parisgroup-ai/pageshell/primitives';
import { PageConfirmDialog } from '@parisgroup-ai/pageshell/interactions';
import { Download, Plus, CheckCircle, Package, Sparkles, Loader2, Heart, AlertTriangle, RefreshCw } from 'lucide-react';
import { ProtocolUnavailableAlert } from '@/components/ProtocolUnavailableAlert';
import { format } from 'date-fns';
import { getDateLocale, getDateFormat } from '@/lib/date-utils';

// Protocol components
import CaseSummaryBox from '@/components/protocol/CaseSummaryBox';
import WhiteningPreferenceAlert from '@/components/protocol/WhiteningPreferenceAlert';
import { BruxismAlert } from '@/components/protocol/BruxismAlert';
import { ProtocolSections } from '@/components/protocol/ProtocolSections';
import { CollapsibleDSD } from '@/components/dsd/CollapsibleDSD';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { DetailPage, GenericErrorState } from '@parisgroup-ai/pageshell/composites';

import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useResult } from '@/hooks/domain/useResult';
import { BRAND_NAME } from '@/lib/branding';
import { cn } from '@/lib/utils';
import { formatToothLabel } from '@/lib/treatment-config';


// =============================================================================
// Tab navigation (resina only)
// =============================================================================

type ResultTab = 'protocol' | 'finishing' | 'checklist' | 'dsd';

const RESULT_TABS: { key: ResultTab; labelKey: string }[] = [
  { key: 'protocol', labelKey: 'result.tabs.protocol' },
  { key: 'finishing', labelKey: 'result.tabs.finishing' },
  { key: 'checklist', labelKey: 'result.tabs.checklist' },
  { key: 'dsd', labelKey: 'result.tabs.dsd' },
];

// =============================================================================
// Page Adapter
// =============================================================================

export default function Result() {
  const { t } = useTranslation();
  useDocumentTitle(t('pageTitle.result'));
  const r = useResult();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ResultTab>('protocol');

  if ((!r.evaluation && !r.isLoading) || r.isError) {
    return (
      <div className="flex items-center justify-center py-20 bg-background">
        <GenericErrorState
          title={t('result.notFound')}
          description={r.isError
            ? t('errors.loadFailed')
            : t('result.notFoundDescription')
          }
          action={{ label: t('common.back'), onClick: () => navigate(-1) }}
        />
      </div>
    );
  }

  const evaluation = r.evaluation;
  const TreatmentIcon = r.currentTreatmentStyle.icon;

  return (
    <>
      <LoadingOverlay isLoading={r.generatingPDF} message={t('result.generatingPDF')} />

      <DetailPage
        className="relative z-10 max-w-5xl mx-auto py-6 sm:py-8 stagger-enter"
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
            label: t('result.recalculate'),
            icon: RefreshCw,
            onClick: () => { navigate(evaluation ? `/evaluation/${evaluation.session_id}` : '/evaluations'); },
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
                  {t('result.reportTitle')} • {format(new Date(evaluation.created_at), getDateFormat('long'), { locale: getDateLocale() })}
                </p>
              </div>

              {/* Treatment Type Header */}
              <Card className={`mb-6 shadow-md rounded-xl glass-panel ${r.currentTreatmentStyle.bgClass} ${r.currentTreatmentStyle.borderClass}`}>
                <CardContent className="py-4">
                  <div className="relative flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <TreatmentIcon className={`w-8 h-8 ${r.currentTreatmentStyle.iconClass}`} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl sm:text-2xl font-semibold font-display">{r.currentTreatmentStyle.label}</h2>
                      <p className="text-sm text-muted-foreground">
                        {formatToothLabel(evaluation.tooth)} • {evaluation.region.replace('-', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 print:hidden">
                        {format(new Date(evaluation.created_at), `${getDateFormat('long')}, HH:mm`, { locale: getDateLocale() })}
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
                onReprocess={() => r.evaluation?.session_id && navigate(`/evaluation/${r.evaluation.session_id}?retry=${r.evaluation.id}`)}
              />
            )}

            {/* Main Recommendation */}
            {r.resin && (
              <section className="mb-8">
                <div className="ai-shimmer-border rounded-xl">
                <Card className="shadow-sm rounded-xl ai-glow glass-panel">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl font-display flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                            <CheckCircle className="w-5 h-5 text-success" />
                          </div>
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="glass-panel rounded-xl p-4 card-elevated">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('result.opacity')}</p>
                        <p className="text-sm font-semibold mt-1">{r.resin.opacity}</p>
                      </div>
                      <div className="glass-panel rounded-xl p-4 card-elevated">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('result.resistance')}</p>
                        <p className="text-sm font-semibold mt-1">{r.resin.resistance}</p>
                      </div>
                      <div className="glass-panel rounded-xl p-4 card-elevated">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('result.polishing')}</p>
                        <p className="text-sm font-semibold mt-1">{r.resin.polishing}</p>
                      </div>
                      <div className="glass-panel rounded-xl p-4 card-elevated">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('result.aesthetics')}</p>
                        <p className="text-sm font-semibold mt-1">{r.resin.aesthetics}</p>
                      </div>
                    </div>
                    {evaluation.recommendation_text && (
                      <div className="pt-4 border-t border-border">
                        <h4 className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">
                          {t('result.justification')}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {evaluation.recommendation_text}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                </div>
              </section>
            )}

            {/* Tab navigation -- resina only */}
            {r.treatmentType === 'resina' && r.hasProtocol && (
              <div className="glass-panel rounded-xl px-3 py-2 inline-flex gap-1 mb-6">
                {RESULT_TABS
                  .filter(tab => tab.key !== 'dsd' || evaluation.dsd_analysis)
                  .map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        'px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200',
                        activeTab === tab.key
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {t(tab.labelKey)}
                    </button>
                  ))}
              </div>
            )}

            {/* Protocol sections -- tabbed for resina, linear for others */}
            {r.treatmentType === 'resina' && r.hasProtocol ? (
              <>
                {activeTab !== 'dsd' && (
                  <div key={activeTab} className="animate-[fade-in_0.3s_ease-out_both]">
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
                    alerts={r.alerts}
                    warnings={r.warnings}
                    confidence={r.confidence}
                    checkedIndices={evaluation.checklist_progress || []}
                    onProgressChange={r.handleChecklistChange}
                    t={t}
                    printHideStepByStep
                    visibleSection={activeTab as 'protocol' | 'finishing' | 'checklist'}
                  />
                  </div>
                )}
                {activeTab === 'dsd' && evaluation.dsd_analysis && (
                  <section className="mb-8 animate-[fade-in_0.3s_ease-out_both]">
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
              </>
            ) : (
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
            )}

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
                <div className="space-y-4">
                  {r.alternatives.map((alt) => (
                    <Card key={`${alt.name}-${alt.manufacturer}`} className="p-4 rounded-xl hover:shadow-md transition-shadow duration-200">
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

            {/* DSD Section -- only for non-resina or when tabs not active */}
            {evaluation.dsd_analysis && !(r.treatmentType === 'resina' && r.hasProtocol) && (
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
                      "{t(`aestheticGoals.${evaluation.patient_aesthetic_goals}`, { defaultValue: evaluation.patient_aesthetic_goals })}"
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
