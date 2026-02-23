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

/** Visual styling fields used by Result and GroupResult pages. */
export interface TreatmentStyle {
  label: string;
  /** i18n key for label — use t(labelKey) when available */
  labelKey: string;
  icon: ComponentType<{ className?: string }>;
  bgClass: string;
  borderClass: string;
  iconClass: string;
  badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
  ringClass: string;
  solidBgClass: string;
  glowClass: string;
  overlayColor: string;
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

/** Visual/styling config for each treatment type — used by Result and GroupResult pages. */
export const treatmentStyles: Record<TreatmentType, TreatmentStyle> = {
  resina: {
    label: 'Restauração em Resina',
    labelKey: 'treatmentStyles.resina',
    icon: Layers,
    bgClass: 'bg-primary/5 dark:bg-primary/10',
    borderClass: 'border-primary/20 dark:border-primary/30',
    iconClass: 'text-primary',
    badgeVariant: 'default',
    ringClass: 'ring-blue-500',
    solidBgClass: 'bg-blue-600',
    glowClass: 'bg-blue-400',
    overlayColor: 'rgba(59, 130, 246, 0.45)',
  },
  porcelana: {
    label: 'Faceta de Porcelana',
    labelKey: 'treatmentStyles.porcelana',
    icon: Crown,
    bgClass: 'bg-amber-50 dark:bg-amber-950/20',
    borderClass: 'border-amber-200 dark:border-amber-800',
    iconClass: 'text-amber-600 dark:text-amber-400',
    badgeVariant: 'secondary',
    ringClass: 'ring-amber-500',
    solidBgClass: 'bg-amber-600',
    glowClass: 'bg-amber-400',
    overlayColor: 'rgba(249, 115, 22, 0.45)',
  },
  coroa: {
    label: 'Coroa Protética',
    labelKey: 'treatmentStyles.coroa',
    icon: Crown,
    bgClass: 'bg-purple-50 dark:bg-purple-950/20',
    borderClass: 'border-purple-200 dark:border-purple-800',
    iconClass: 'text-purple-600 dark:text-purple-400',
    badgeVariant: 'secondary',
    ringClass: 'ring-purple-500',
    solidBgClass: 'bg-purple-600',
    glowClass: 'bg-purple-400',
    overlayColor: 'rgba(147, 51, 234, 0.45)',
  },
  implante: {
    label: 'Indicação de Implante',
    labelKey: 'treatmentStyles.implante',
    icon: CircleX,
    bgClass: 'bg-orange-50 dark:bg-orange-950/20',
    borderClass: 'border-orange-200 dark:border-orange-800',
    iconClass: 'text-orange-600 dark:text-orange-400',
    badgeVariant: 'secondary',
    ringClass: 'ring-orange-500',
    solidBgClass: 'bg-orange-600',
    glowClass: 'bg-orange-400',
    overlayColor: 'rgba(239, 68, 68, 0.45)',
  },
  endodontia: {
    label: 'Tratamento de Canal',
    labelKey: 'treatmentStyles.endodontia',
    icon: Stethoscope,
    bgClass: 'bg-rose-50 dark:bg-rose-950/20',
    borderClass: 'border-rose-200 dark:border-rose-800',
    iconClass: 'text-rose-600 dark:text-rose-400',
    badgeVariant: 'destructive',
    ringClass: 'ring-rose-500',
    solidBgClass: 'bg-rose-600',
    glowClass: 'bg-rose-400',
    overlayColor: 'rgba(244, 63, 94, 0.45)',
  },
  encaminhamento: {
    label: 'Encaminhamento',
    labelKey: 'treatmentStyles.encaminhamento',
    icon: ArrowUpRight,
    bgClass: 'bg-muted/50',
    borderClass: 'border-border',
    iconClass: 'text-muted-foreground',
    badgeVariant: 'outline',
    ringClass: 'ring-gray-400',
    solidBgClass: 'bg-gray-600',
    glowClass: 'bg-gray-400',
    overlayColor: 'rgba(107, 114, 128, 0.45)',
  },
  gengivoplastia: {
    label: 'Gengivoplastia Estética',
    labelKey: 'treatmentStyles.gengivoplastia',
    icon: Smile,
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/20',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    badgeVariant: 'secondary',
    ringClass: 'ring-emerald-500',
    solidBgClass: 'bg-emerald-600',
    glowClass: 'bg-emerald-400',
    overlayColor: 'rgba(16, 185, 129, 0.45)',
  },
  recobrimento_radicular: {
    label: 'Recobrimento Radicular',
    labelKey: 'treatmentStyles.recobrimento_radicular',
    icon: HeartPulse,
    bgClass: 'bg-teal-50 dark:bg-teal-950/20',
    borderClass: 'border-teal-200 dark:border-teal-800',
    iconClass: 'text-teal-600 dark:text-teal-400',
    badgeVariant: 'secondary',
    ringClass: 'ring-teal-500',
    solidBgClass: 'bg-teal-600',
    glowClass: 'bg-teal-400',
    overlayColor: 'rgba(20, 184, 166, 0.45)',
  },
};

/** Get treatment style for a given type, falling back to resina. */
export function getTreatmentStyle(type: string | null | undefined): TreatmentStyle {
  return treatmentStyles[(type || 'resina') as TreatmentType] || treatmentStyles.resina;
}

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
