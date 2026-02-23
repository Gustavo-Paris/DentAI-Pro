import { Card, CardContent, CardHeader, CardTitle, Badge } from '@parisgroup-ai/pageshell/primitives';
import { Layers, Crown, Stethoscope, ArrowUpRight, CircleX, Smile, HeartPulse, Palette } from 'lucide-react';

import ProtocolTable from '@/components/protocol/ProtocolTable';
import ProtocolChecklist from '@/components/protocol/ProtocolChecklist';
import AlertsSection from '@/components/protocol/AlertsSection';
import WarningsSection from '@/components/protocol/WarningsSection';
import ConfidenceIndicator from '@/components/protocol/ConfidenceIndicator';
import AlternativeBox from '@/components/protocol/AlternativeBox';
import { CementationProtocolCard } from '@/components/protocol/CementationProtocolCard';
import { VeneerPreparationCard } from '@/components/protocol/VeneerPreparationCard';
import { FinishingPolishingCard } from '@/components/protocol/FinishingPolishingCard';
import type { ProtocolLayer, ProtocolAlternative, CementationProtocol, FinishingProtocol } from '@/types/protocol';

// =============================================================================
// Types
// =============================================================================

interface GenericProtocol {
  summary?: string;
  checklist: string[];
  [key: string]: unknown;
}

export interface ProtocolSectionsProps {
  /** Treatment type identifier */
  treatmentType: string;
  /** Whether the treatment has a resin protocol */
  hasProtocol: boolean;
  /** Whether this is a porcelain/cementation treatment */
  isPorcelain: boolean;
  /** Whether this is a special treatment (coroa, implante, endodontia, etc.) */
  isSpecialTreatment: boolean;
  /** Stratification layers for resin protocols */
  layers: ProtocolLayer[];
  /** Finishing protocol from stratification_protocol */
  finishingProtocol?: FinishingProtocol | null;
  /** Generic protocol for special treatments */
  genericProtocol?: GenericProtocol | null;
  /** Cementation protocol for porcelain treatments */
  cementationProtocol?: CementationProtocol | null;
  /** Alternative material data */
  protocolAlternative?: ProtocolAlternative | null;
  /** Step-by-step checklist items */
  checklist: string[];
  /** Alert messages */
  alerts: string[];
  /** Warning messages */
  warnings: string[];
  /** AI confidence data */
  confidence: unknown;
  /** Current checked indices for checklists */
  checkedIndices: number[];
  /** Handler for checklist progress changes */
  onProgressChange: (indices: number[]) => void;
  /** Translation function */
  t: (key: string, opts?: Record<string, unknown>) => string;
  /** Treatment style label for special treatment card title */
  treatmentStyleLabel?: string;
  /** Whether the step-by-step section should be hidden from print */
  printHideStepByStep?: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

function SpecialTreatmentIcon({ treatmentType }: { treatmentType: string }) {
  switch (treatmentType) {
    case 'coroa': return <Crown className="w-4 h-4" />;
    case 'implante': return <CircleX className="w-4 h-4" />;
    case 'endodontia': return <Stethoscope className="w-4 h-4" />;
    case 'encaminhamento': return <ArrowUpRight className="w-4 h-4" />;
    case 'gengivoplastia': return <Smile className="w-4 h-4" />;
    case 'recobrimento_radicular': return <HeartPulse className="w-4 h-4" />;
    default: return null;
  }
}

function getSpecialTreatmentTitle(treatmentType: string, t: ProtocolSectionsProps['t'], treatmentStyleLabel?: string): string {
  // In GroupResult, we use the treatment style label directly
  if (treatmentStyleLabel !== undefined) return treatmentStyleLabel;

  // In Result, we use specific translation keys
  const titleMap: Record<string, string> = {
    coroa: t('result.crownPlanning'),
    implante: t('result.implantPlanning'),
    endodontia: t('result.endodonticProtocol'),
    encaminhamento: t('result.referralGuidelines'),
    gengivoplastia: t('result.gingivoplastyProtocol'),
    recobrimento_radicular: t('result.rootCoverageProtocol'),
  };
  return titleMap[treatmentType] || treatmentType;
}

// =============================================================================
// Component
// =============================================================================

export function ProtocolSections({
  treatmentType,
  hasProtocol,
  isPorcelain,
  isSpecialTreatment,
  layers,
  finishingProtocol,
  genericProtocol,
  cementationProtocol,
  protocolAlternative,
  checklist,
  alerts,
  warnings,
  confidence,
  checkedIndices,
  onProgressChange,
  t,
  treatmentStyleLabel,
  printHideStepByStep = false,
}: ProtocolSectionsProps) {
  return (
    <>
      {/* Protocol sections -- porcelain vs resin vs special */}
      {isPorcelain && cementationProtocol ? (
        <>
          <section className="mb-8">
            <VeneerPreparationCard />
          </section>
          <section className="mb-8">
            <CementationProtocolCard
              protocol={cementationProtocol}
              checkedIndices={checkedIndices}
              onProgressChange={onProgressChange}
            />
          </section>
        </>
      ) : (
        <>
          {hasProtocol && treatmentType === 'resina' && (
            <section className="mb-8">
              <h3 className="font-semibold font-display mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>{t('result.stratificationProtocol')}</span>
              </h3>
              <ProtocolTable layers={layers} />
              {layers.length > 0 && (
                <Card className="mt-4 border-primary/20">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      {t('result.resinsUsed')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="flex flex-wrap gap-2">
                      {[...new Set(layers.map(l => `${l.resin_brand} ${l.shade}`))].map((resin, i) => (
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

          {treatmentType === 'resina' && finishingProtocol && (
            <section className="mb-8">
              <FinishingPolishingCard protocol={finishingProtocol} />
            </section>
          )}

          {isSpecialTreatment && genericProtocol && (
            <section className="mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <SpecialTreatmentIcon treatmentType={treatmentType} />
                    {getSpecialTreatmentTitle(treatmentType, t, treatmentStyleLabel)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {genericProtocol.summary && (
                    <p className="text-sm text-muted-foreground mb-4">{genericProtocol.summary}</p>
                  )}
                  <ProtocolChecklist
                    items={genericProtocol.checklist}
                    checkedIndices={checkedIndices}
                    onProgressChange={onProgressChange}
                  />
                </CardContent>
              </Card>
            </section>
          )}

          {treatmentType === 'resina' && protocolAlternative && (
            <section className="mb-8">
              <AlternativeBox alternative={protocolAlternative} />
            </section>
          )}
        </>
      )}

      {/* Step-by-Step Checklist */}
      {treatmentType === 'resina' && checklist.length > 0 && (
        <section className={`mb-8 ${printHideStepByStep ? 'print:hidden' : ''}`}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('result.stepByStep')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ProtocolChecklist
                items={checklist}
                checkedIndices={checkedIndices}
                onProgressChange={onProgressChange}
              />
            </CardContent>
          </Card>
        </section>
      )}

      {/* Alerts and Warnings */}
      {(alerts.length > 0 || warnings.length > 0) && (
        <section className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AlertsSection alerts={alerts} />
          <WarningsSection warnings={warnings} />
        </section>
      )}

      {/* Confidence Indicator */}
      {treatmentType === 'resina' && hasProtocol && (
        <section className="mb-8">
          <ConfidenceIndicator confidence={confidence} />
        </section>
      )}
    </>
  );
}
