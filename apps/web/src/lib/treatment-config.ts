import type { ComponentType } from 'react';
import { Layers, Crown, Stethoscope, ArrowUpRight, CircleX, Smile, HeartPulse } from 'lucide-react';

// =============================================================================
// Unified treatment type configuration
// Merges fields from EvaluationDetails, CaseSummaryBox, and Result
// =============================================================================

export type TreatmentType = 'resina' | 'porcelana' | 'coroa' | 'implante' | 'endodontia' | 'encaminhamento' | 'gengivoplastia' | 'recobrimento_radicular';

export interface TreatmentTypeConfig {
  label: string;
  shortLabel: string;
  /** i18n key for label — use t(labelKey) when available */
  labelKey: string;
  /** i18n key for shortLabel — use t(shortLabelKey) when available */
  shortLabelKey: string;
  icon: ComponentType<{ className?: string }>;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  showCavityInfo: boolean;
}

export const treatmentConfig: Record<TreatmentType, TreatmentTypeConfig> = {
  resina: { label: 'Resina Composta', shortLabel: 'Resina', labelKey: 'treatments.resina.label', shortLabelKey: 'treatments.resina.shortLabel', icon: Layers, variant: 'default', showCavityInfo: true },
  porcelana: { label: 'Faceta de Porcelana', shortLabel: 'Faceta', labelKey: 'treatments.porcelana.label', shortLabelKey: 'treatments.porcelana.shortLabel', icon: Crown, variant: 'secondary', showCavityInfo: false },
  coroa: { label: 'Coroa Total', shortLabel: 'Coroa', labelKey: 'treatments.coroa.label', shortLabelKey: 'treatments.coroa.shortLabel', icon: Crown, variant: 'secondary', showCavityInfo: false },
  implante: { label: 'Implante', shortLabel: 'Implante', labelKey: 'treatments.implante.label', shortLabelKey: 'treatments.implante.shortLabel', icon: CircleX, variant: 'outline', showCavityInfo: false },
  endodontia: { label: 'Endodontia', shortLabel: 'Endo', labelKey: 'treatments.endodontia.label', shortLabelKey: 'treatments.endodontia.shortLabel', icon: Stethoscope, variant: 'outline', showCavityInfo: false },
  encaminhamento: { label: 'Encaminhamento', shortLabel: 'Encaminhar', labelKey: 'treatments.encaminhamento.label', shortLabelKey: 'treatments.encaminhamento.shortLabel', icon: ArrowUpRight, variant: 'outline', showCavityInfo: false },
  gengivoplastia: { label: 'Gengivoplastia Estética', shortLabel: 'Gengivoplastia', labelKey: 'treatments.gengivoplastia.label', shortLabelKey: 'treatments.gengivoplastia.shortLabel', icon: Smile, variant: 'secondary', showCavityInfo: false },
  recobrimento_radicular: { label: 'Recobrimento Radicular', shortLabel: 'Recobr.', labelKey: 'treatments.recobrimento_radicular.label', shortLabelKey: 'treatments.recobrimento_radicular.shortLabel', icon: HeartPulse, variant: 'secondary', showCavityInfo: false },
};

export function getTreatmentConfig(type: string | null | undefined): TreatmentTypeConfig {
  return treatmentConfig[(type || 'resina') as TreatmentType] || treatmentConfig.resina;
}

/**
 * Normalize treatment type strings from AI (English or mixed-case) to
 * canonical Portuguese keys used throughout the app.
 */
const TREATMENT_NORMALIZE: Record<string, TreatmentType> = {
  // English → Portuguese
  porcelain: 'porcelana',
  resin: 'resina',
  crown: 'coroa',
  implant: 'implante',
  endodontics: 'endodontia',
  referral: 'encaminhamento',
  gingivoplasty: 'gengivoplastia',
  'root_coverage': 'recobrimento_radicular',
  // Portuguese identity (lowercase)
  porcelana: 'porcelana',
  resina: 'resina',
  coroa: 'coroa',
  implante: 'implante',
  endodontia: 'endodontia',
  encaminhamento: 'encaminhamento',
  gengivoplastia: 'gengivoplastia',
  recobrimento_radicular: 'recobrimento_radicular',
};

export function normalizeTreatmentType(raw: string): TreatmentType {
  return TREATMENT_NORMALIZE[raw.toLowerCase()] || (raw.toLowerCase() as TreatmentType);
}

export function formatToothLabel(tooth: string, t?: (key: string, opts?: Record<string, unknown>) => string): string {
  if (tooth === 'GENGIVO') return t ? t('toothLabel.gingiva') : 'Gengiva';
  return t ? t('toothLabel.tooth', { number: tooth }) : `Dente ${tooth}`;
}
