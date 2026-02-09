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
  icon: ComponentType<{ className?: string }>;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  showCavityInfo: boolean;
}

export const treatmentConfig: Record<TreatmentType, TreatmentTypeConfig> = {
  resina: { label: 'Resina Composta', shortLabel: 'Resina', icon: Layers, variant: 'default', showCavityInfo: true },
  porcelana: { label: 'Faceta de Porcelana', shortLabel: 'Faceta', icon: Crown, variant: 'secondary', showCavityInfo: false },
  coroa: { label: 'Coroa Total', shortLabel: 'Coroa', icon: Crown, variant: 'secondary', showCavityInfo: false },
  implante: { label: 'Implante', shortLabel: 'Implante', icon: CircleX, variant: 'outline', showCavityInfo: false },
  endodontia: { label: 'Endodontia', shortLabel: 'Endo', icon: Stethoscope, variant: 'outline', showCavityInfo: false },
  encaminhamento: { label: 'Encaminhamento', shortLabel: 'Encaminhar', icon: ArrowUpRight, variant: 'outline', showCavityInfo: false },
  gengivoplastia: { label: 'Gengivoplastia Estética', shortLabel: 'Gengivo', icon: Smile, variant: 'secondary', showCavityInfo: false },
  recobrimento_radicular: { label: 'Recobrimento Radicular', shortLabel: 'Recobr.', icon: HeartPulse, variant: 'secondary', showCavityInfo: false },
};

export function getTreatmentConfig(type: string | null | undefined): TreatmentTypeConfig {
  return treatmentConfig[(type || 'resina') as TreatmentType] || treatmentConfig.resina;
}
