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
import { Download, Plus, CheckCircle, Image, Package, Sparkles, Layers, Loader2, Crown, Stethoscope, ArrowUpRight, CircleX, Heart, Palette, AlertTriangle } from 'lucide-react';
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

import { useResult } from '@/hooks/domain/useResult';
import { BRAND_NAME } from '@/lib/branding';

// =============================================================================
// Page Adapter
// =============================================================================

export default function Result() {
  const r = useResult();

  if (!r.evaluation && !r.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Avaliação não encontrada</p>
      </div>
    );
  }

  const evaluation = r.evaluation;
  const TreatmentIcon = r.currentTreatmentStyle.icon;

  return (
    <>
      <LoadingOverlay isLoading={r.generatingPDF} message="Gerando PDF..." />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <DetailPage
        title={r.currentTreatmentStyle.label}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Avaliação', href: evaluation ? `/evaluation/${evaluation.session_id}` : undefined },
          { label: evaluation ? `Dente ${evaluation.tooth}` : '...' },
        ]}
        backHref={evaluation ? `/evaluation/${evaluation.session_id}` : '/dashboard'}
        query={{ data: evaluation, isLoading: r.isLoading }}
        footerActions={[
          {
            label: 'Baixar PDF',
            icon: r.generatingPDF ? Loader2 : Download,
            onClick: r.handlePdfButtonClick,
            disabled: r.generatingPDF,
            variant: 'outline',
          },
          {
            label: 'Novo Caso',
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
                  Relatório de Recomendação • {format(new Date(evaluation.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>

              {/* Date */}
              <p className="text-sm text-muted-foreground mb-4 print:hidden">
                {format(new Date(evaluation.created_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
              </p>

              {/* Treatment Type Header */}
              <Card className={`mb-6 ${r.currentTreatmentStyle.bgClass} ${r.currentTreatmentStyle.borderClass}`}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${r.currentTreatmentStyle.bgClass}`}>
                      <TreatmentIcon className={`w-6 h-6 ${r.currentTreatmentStyle.iconClass}`} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold">{r.currentTreatmentStyle.label}</h2>
                      <p className="text-sm text-muted-foreground">
                        Dente {evaluation.tooth} • {evaluation.region.replace('-', ' ')}
                      </p>
                    </div>
                    {r.treatmentType !== 'encaminhamento' && (
                      <Badge variant={r.currentTreatmentStyle.badgeVariant}>
                        {r.treatmentType === 'resina' ? 'Direta' : 'Indireta'}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ),
        }}
      >
        {(evaluation) => (
          <>
            {/* Inventory Banner */}
            {r.treatmentType === 'resina' && !evaluation.has_inventory_at_creation && (
              <Card className="mb-6 border-primary/20 bg-primary/5 dark:bg-primary/10 print:hidden">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Personalize suas recomendações</p>
                      <p className="text-xs text-muted-foreground">
                        Cadastre as resinas do seu consultório para receber sugestões baseadas no seu estoque.
                      </p>
                    </div>
                    <Link to="/inventory">
                      <Button size="sm" variant="outline">Ir para Inventário</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Special Treatment Recommendations */}
            {r.isSpecialTreatment && r.genericProtocol?.recommendations && (
              <Card className="mb-6 border-muted">
                <CardContent className="py-4">
                  <p className="text-sm font-medium mb-2">Recomendações ao paciente:</p>
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
                indicationReason={evaluation.ai_treatment_indication || r.genericProtocol?.ai_reason}
                whiteningGoal={evaluation.patient_aesthetic_goals}
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
                      Preferências do Paciente
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

            {/* Clinical Photos */}
            {r.hasPhotos && (
              <section className="mb-8">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Fotos Clínicas
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {r.photoUrls.frontal && (
                    <div className="relative">
                      <div className={`absolute -inset-1 rounded-xl ${r.currentTreatmentStyle.glowClass} opacity-60`} />
                      <div className={`relative aspect-square rounded-lg overflow-hidden bg-secondary ring-4 ${r.currentTreatmentStyle.ringClass} ring-offset-4 ring-offset-background shadow-xl`}>
                        <img src={r.photoUrls.frontal} alt="Foto Clínica" className="w-full h-full object-cover" />
                        {evaluation.tooth_bounds && (
                          <div
                            className="absolute rounded-full pointer-events-none"
                            style={{
                              left: `${evaluation.tooth_bounds.x - evaluation.tooth_bounds.width / 2}%`,
                              top: `${evaluation.tooth_bounds.y - evaluation.tooth_bounds.height / 2}%`,
                              width: `${evaluation.tooth_bounds.width}%`,
                              height: `${evaluation.tooth_bounds.height}%`,
                              backgroundColor: r.currentTreatmentStyle.overlayColor,
                              mixBlendMode: 'multiply',
                              boxShadow: `0 0 20px 8px ${r.currentTreatmentStyle.overlayColor}`,
                            }}
                          />
                        )}
                        <div className="absolute bottom-2 left-2">
                          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-lg ${r.currentTreatmentStyle.solidBgClass} text-white`}>
                            <span>Dente {evaluation.tooth}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {r.photoUrls.angle45 && (
                    <div className="aspect-square rounded-lg overflow-hidden bg-secondary">
                      <img src={r.photoUrls.angle45} alt="Sorriso 45°" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {r.photoUrls.face && (
                    <div className="aspect-square rounded-lg overflow-hidden bg-secondary">
                      <img src={r.photoUrls.face} alt="Rosto" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Main Recommendation */}
            {r.resin && (
              <section className="mb-8">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-foreground" />
                          {r.resin.name}
                        </CardTitle>
                        <p className="text-muted-foreground mt-1">{r.resin.manufacturer}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="secondary">{r.resin.type}</Badge>
                        {evaluation.is_from_inventory && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            <Package className="w-3 h-3 mr-1" />
                            No seu estoque
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Opacidade</span>
                        <p className="font-medium">{r.resin.opacity}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Resistência</span>
                        <p className="font-medium">{r.resin.resistance}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Polimento</span>
                        <p className="font-medium">{r.resin.polishing}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Estética</span>
                        <p className="font-medium">{r.resin.aesthetics}</p>
                      </div>
                    </div>
                    {evaluation.recommendation_text && (
                      <div className="pt-4 border-t border-border">
                        <h4 className="font-medium mb-2">Justificativa</h4>
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
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Protocolo de Estratificação
                    </h3>
                    <ProtocolTable layers={r.layers} />
                    {r.layers.length > 0 && (
                      <Card className="mt-4 border-primary/20">
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Palette className="w-4 h-4" />
                            Resinas Utilizadas
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
                          {r.treatmentType === 'coroa' && 'Planejamento Protético'}
                          {r.treatmentType === 'implante' && 'Planejamento Cirúrgico'}
                          {r.treatmentType === 'endodontia' && 'Protocolo Endodôntico'}
                          {r.treatmentType === 'encaminhamento' && 'Orientações de Encaminhamento'}
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
                    <CardTitle className="text-base">Passo a Passo</CardTitle>
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
                      Opção Ideal (fora do estoque)
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
                      Considere adquirir para casos futuros similares
                    </p>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Alternatives */}
            {r.alternatives && r.alternatives.length > 0 && (
              <section className="mb-8">
                <h3 className="font-medium mb-3">Outras Alternativas</h3>
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
            <div className="mt-8 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  Este planejamento foi gerado por Inteligência Artificial e serve como ferramenta de apoio à decisão clínica. Não substitui uma avaliação clínica criteriosa realizada por Cirurgião-Dentista.
                </p>
              </div>
            </div>
          </>
        )}
      </DetailPage>
      </div>

      {/* PDF Confirmation Dialog */}
      <AlertDialog open={r.showPdfConfirmDialog} onOpenChange={r.setShowPdfConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Checklist incompleto</AlertDialogTitle>
            <AlertDialogDescription>
              O checklist do protocolo ainda não está 100% concluído.
              Deseja gerar o PDF mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={r.handleExportPDF}>
              Gerar PDF
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
