import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@parisgroup-ai/pageshell/primitives';
import { Layers, Crown, Stethoscope, ArrowUpRight, CircleX, Smile, HeartPulse, Palette, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

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
  /** When set, only render the specified section (for tabbed layout). Default: render all. */
  visibleSection?: 'protocol' | 'finishing' | 'checklist';
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

  // In Result, use canonical treatments namespace for protocol titles
  return t(`treatments.${treatmentType}.protocolTitle`, treatmentType);
}

// =============================================================================
// Copy to Clipboard
// =============================================================================

function formatResinProtocolText(
  layers: ProtocolLayer[],
  checklist: string[],
  alerts: string[],
  warnings: string[],
  protocolAlternative?: ProtocolAlternative | null,
  t?: ProtocolSectionsProps['t'],
): string {
  const tFn = t ?? ((k: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : k));
  const lines: string[] = [];

  lines.push(tFn('result.stratificationProtocol', { defaultValue: 'Protocolo de Estratificacao' }));
  lines.push('');

  if (layers.length > 0) {
    lines.push(`${tFn('components.protocol.copy.layers', { defaultValue: 'Camadas' })}:`);
    for (const layer of layers) {
      const optionalTag = layer.optional ? ` (${tFn('components.protocol.table.optional', { defaultValue: 'opcional' })})` : '';
      lines.push(`  ${layer.order}. ${layer.name}: ${layer.shade} (${layer.resin_brand})${optionalTag}`);
      lines.push(`     ${tFn('components.protocol.table.thickness', { defaultValue: 'Espessura' })}: ${layer.thickness}`);
      lines.push(`     ${tFn('components.protocol.table.technique', { defaultValue: 'Tecnica' })}: ${layer.technique}`);
    }
    lines.push('');
  }

  if (protocolAlternative) {
    lines.push(`${tFn('components.protocol.copy.alternative', { defaultValue: 'Alternativa Simplificada' })}:`);
    lines.push(`  ${protocolAlternative.resin} - ${protocolAlternative.shade}`);
    lines.push(`  ${tFn('components.protocol.table.technique', { defaultValue: 'Tecnica' })}: ${protocolAlternative.technique}`);
    lines.push(`  ${tFn('components.protocol.copy.tradeoff', { defaultValue: 'Trade-off' })}: ${protocolAlternative.tradeoff}`);
    lines.push('');
  }

  if (checklist.length > 0) {
    lines.push(`${tFn('result.stepByStep', { defaultValue: 'Passo a Passo' })}:`);
    checklist.forEach((item, i) => {
      lines.push(`  ${i + 1}. ${item}`);
    });
    lines.push('');
  }

  if (alerts.length > 0) {
    lines.push(`${tFn('components.protocol.copy.alerts', { defaultValue: 'Alertas' })}:`);
    alerts.forEach((a) => lines.push(`  - ${a}`));
    lines.push('');
  }

  if (warnings.length > 0) {
    lines.push(`${tFn('components.protocol.copy.warnings', { defaultValue: 'Avisos' })}:`);
    warnings.forEach((w) => lines.push(`  - ${w}`));
  }

  return lines.join('\n').trim();
}

function formatGenericProtocolText(
  genericProtocol: GenericProtocol,
  title: string,
): string {
  const lines: string[] = [];
  lines.push(title);
  lines.push('');

  if (genericProtocol.summary) {
    lines.push(genericProtocol.summary);
    lines.push('');
  }

  if (genericProtocol.checklist.length > 0) {
    genericProtocol.checklist.forEach((item, i) => {
      lines.push(`${i + 1}. ${item}`);
    });
  }

  return lines.join('\n').trim();
}

function CopyProtocolButton({ getText, t }: { getText: () => string; t: ProtocolSectionsProps['t'] }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      const text = getText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(t('toasts.copiedToClipboard', { defaultValue: 'Copiado para a area de transferencia' }));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('toasts.copyFailed', { defaultValue: 'Falha ao copiar' }));
    }
  }, [getText, t]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0"
      onClick={handleCopy}
      aria-label={t('components.protocol.copy.label', { defaultValue: 'Copiar protocolo' })}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
      )}
    </Button>
  );
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
  visibleSection,
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
          {(!visibleSection || visibleSection === 'protocol') && hasProtocol && treatmentType === 'resina' && (
            <section className="mb-8">
              <h3 className="font-semibold font-display mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span className="flex-1">{t('result.stratificationProtocol')}</span>
                <CopyProtocolButton
                  getText={() =>
                    formatResinProtocolText(layers, checklist, alerts, warnings, protocolAlternative, t)
                  }
                  t={t}
                />
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

          {(!visibleSection || visibleSection === 'finishing') && treatmentType === 'resina' && finishingProtocol && (
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
                    <span className="flex-1">{getSpecialTreatmentTitle(treatmentType, t, treatmentStyleLabel)}</span>
                    <CopyProtocolButton
                      getText={() =>
                        formatGenericProtocolText(
                          genericProtocol,
                          getSpecialTreatmentTitle(treatmentType, t, treatmentStyleLabel),
                        )
                      }
                      t={t}
                    />
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

          {(!visibleSection || visibleSection === 'protocol') && treatmentType === 'resina' && protocolAlternative && (
            <section className="mb-8">
              <AlternativeBox alternative={protocolAlternative} />
            </section>
          )}
        </>
      )}

      {/* Step-by-Step Checklist */}
      {(!visibleSection || visibleSection === 'checklist') && treatmentType === 'resina' && checklist.length > 0 && (
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
      {(!visibleSection || visibleSection === 'protocol') && (alerts.length > 0 || warnings.length > 0) && (
        <section className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AlertsSection alerts={alerts} />
          <WarningsSection warnings={warnings} />
        </section>
      )}

      {/* Confidence Indicator */}
      {(!visibleSection || visibleSection === 'protocol') && treatmentType === 'resina' && hasProtocol && (
        <section className="mb-8">
          <ConfidenceIndicator confidence={confidence} />
        </section>
      )}
    </>
  );
}
