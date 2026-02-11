import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Download, Plus, CheckCircle, Package, Sparkles, Layers, Loader2, Crown, Stethoscope, ArrowUpRight, CircleX, Heart, Palette, AlertTriangle, Smile, HeartPulse } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Protocol components
import ProtocolTable from '@/components/protocol/ProtocolTable';
import ProtocolChecklist from '@/components/protocol/ProtocolChecklist';
import AlertsSection from '@/components/protocol/AlertsSection';
import WarningsSection from '@/components/protocol/WarningsSection';
import ConfidenceIndicator from '@/components/protocol/ConfidenceIndicator';
import AlternativeBox from '@/components/protocol/AlternativeBox';
import CaseSummaryBox from '@/components/protocol/CaseSummaryBox';
import WhiteningPreferenceAlert from '@/components/protocol/WhiteningPreferenceAlert';
import { CementationProtocolCard } from '@/components/protocol/CementationProtocolCard';
import { VeneerPreparationCard } from '@/components/protocol/VeneerPreparationCard';
import { FinishingPolishingCard } from '@/components/protocol/FinishingPolishingCard';
import { BruxismAlert } from '@/components/protocol/BruxismAlert';
import { CollapsibleDSD } from '@/components/dsd/CollapsibleDSD';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { DetailPage } from '@pageshell/composites';

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


  if (!r.evaluation && !r.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('result.notFound')}</p>
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
            label: t('result.downloadPDF'),
            icon: r.generatingPDF ? Loader2 : Download,
            onClick: r.handlePdfButtonClick,
            disabled: r.generatingPDF,
            variant: 'outline',
          },
          {
            label: t('result.newCase'),
            icon: Plus,
            onClick: () => { window.location.href = '/new-case'; },
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
                  defaultOpen={false}
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

            {/* Main Recommendation */}
            {r.resin && (
              <section className="mb-8">
                <Card className="shadow-sm hover:shadow-md rounded-xl transition-shadow duration-300">
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
                      <div className="bg-secondary/30 rounded-lg p-3">
                        <span className="text-muted-foreground">{t('result.opacity')}</span>
                        <p className="font-medium">{r.resin.opacity}</p>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-3">
                        <span className="text-muted-foreground">{t('result.resistance')}</span>
                        <p className="font-medium">{r.resin.resistance}</p>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-3">
                        <span className="text-muted-foreground">{t('result.polishing')}</span>
                        <p className="font-medium">{r.resin.polishing}</p>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-3">
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
            {r.isPorcelain && r.cementationProtocol ? (
              <>
                <section className="mb-8">
                  <VeneerPreparationCard />
                </section>
                <section className="mb-8">
                  <CementationProtocolCard
                    protocol={r.cementationProtocol}
                    checkedIndices={evaluation.checklist_progress || []}
                    onProgressChange={r.handleChecklistChange}
                  />
                </section>
              </>
            ) : (
              <>
                {r.hasProtocol && r.treatmentType === 'resina' && (
                  <section className="mb-8">
                    <h3 className="font-semibold font-display mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      {t('result.stratificationProtocol')}
                    </h3>
                    <ProtocolTable layers={r.layers} />
                    {r.layers.length > 0 && (
                      <Card className="mt-4 border-primary/20">
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Palette className="w-4 h-4" />
                            {t('result.resinsUsed')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                          <div className="flex flex-wrap gap-2">
                            {[...new Set(r.layers.map(l => `${l.resin_brand} ${l.shade}`))].map((resin, i) => (
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

                {r.treatmentType === 'resina' && evaluation.stratification_protocol?.finishing && (
                  <section className="mb-8">
                    <FinishingPolishingCard protocol={evaluation.stratification_protocol.finishing} />
                  </section>
                )}

                {r.isSpecialTreatment && r.genericProtocol && (
                  <section className="mb-8">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          {r.treatmentType === 'coroa' && <Crown className="w-4 h-4" />}
                          {r.treatmentType === 'implante' && <CircleX className="w-4 h-4" />}
                          {r.treatmentType === 'endodontia' && <Stethoscope className="w-4 h-4" />}
                          {r.treatmentType === 'encaminhamento' && <ArrowUpRight className="w-4 h-4" />}
                          {r.treatmentType === 'gengivoplastia' && <Smile className="w-4 h-4" />}
                          {r.treatmentType === 'recobrimento_radicular' && <HeartPulse className="w-4 h-4" />}
                          {r.treatmentType === 'coroa' && t('result.crownPlanning')}
                          {r.treatmentType === 'implante' && t('result.implantPlanning')}
                          {r.treatmentType === 'endodontia' && t('result.endodonticProtocol')}
                          {r.treatmentType === 'encaminhamento' && t('result.referralGuidelines')}
                          {r.treatmentType === 'gengivoplastia' && t('result.gingivoplastyProtocol')}
                          {r.treatmentType === 'recobrimento_radicular' && t('result.rootCoverageProtocol')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {r.genericProtocol.summary && (
                          <p className="text-sm text-muted-foreground mb-4">{r.genericProtocol.summary}</p>
                        )}
                        <ProtocolChecklist
                          items={r.genericProtocol.checklist}
                          checkedIndices={evaluation.checklist_progress || []}
                          onProgressChange={r.handleChecklistChange}
                        />
                      </CardContent>
                    </Card>
                  </section>
                )}

                {r.treatmentType === 'resina' && r.protocolAlternative && (
                  <section className="mb-8">
                    <AlternativeBox alternative={r.protocolAlternative} />
                  </section>
                )}
              </>
            )}

            {/* Step-by-Step Checklist */}
            {r.treatmentType === 'resina' && r.checklist.length > 0 && (
              <section className="mb-8 print:hidden">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{t('result.stepByStep')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProtocolChecklist
                      items={r.checklist}
                      checkedIndices={evaluation.checklist_progress || []}
                      onProgressChange={r.handleChecklistChange}
                    />
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Alerts and Warnings */}
            {r.treatmentType === 'resina' && (r.alerts.length > 0 || r.warnings.length > 0) && (
              <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <AlertsSection alerts={r.alerts} />
                <WarningsSection warnings={r.warnings} />
              </section>
            )}

            {/* Confidence Indicator */}
            {r.treatmentType === 'resina' && r.hasProtocol && (
              <section className="mb-8">
                <ConfidenceIndicator confidence={r.confidence} />
              </section>
            )}

            {/* Ideal Resin */}
            {r.showIdealResin && r.idealResin && (
              <section className="mb-8">
                <Card className="border-muted-foreground/20 bg-secondary/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
                      <Sparkles className="w-4 h-4" />
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
                    <Card key={index} className="p-4">
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

            {/* Disclaimer */}
            <div className="mt-8 p-4 rounded-xl shadow-sm border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-200">
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
      <AlertDialog open={r.showPdfConfirmDialog} onOpenChange={r.setShowPdfConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('evaluation.incompleteChecklistTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('result.pdfChecklistIncomplete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={r.handleExportPDF}>
              {t('result.generatePDF')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
