import type { ComponentType } from 'react';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

// =============================================================================
// Unified confidence configuration
// Merges fields from ConfidenceIndicator and generatePDF
// =============================================================================

export type ConfidenceLevel = 'alta' | 'media' | 'baixa';

export interface ConfidenceConfig {
  icon: ComponentType<{ className?: string }>;
  label: string;
  pdfLabel: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  bars: number;
  pdfColor: [number, number, number];
  pdfBgColor: [number, number, number];
}

export const confidenceConfig: Record<ConfidenceLevel, ConfidenceConfig> = {
  alta: {
    icon: ShieldCheck,
    label: 'Alta Confiança',
    pdfLabel: 'ALTA',
    description: 'Caso bem documentado, protocolo recomendado com segurança',
    color: 'text-success',
    bg: 'bg-success/10 dark:bg-success/10',
    border: 'border-success/20 dark:border-success/30',
    bars: 3,
    pdfColor: [22, 163, 74],
    pdfBgColor: [220, 252, 231],
  },
  media: {
    icon: Shield,
    label: 'Confiança Média',
    pdfLabel: 'MEDIA',
    description: 'Considere validar detalhes clínicos adicionais',
    color: 'text-warning',
    bg: 'bg-warning/10 dark:bg-warning/10',
    border: 'border-warning/20 dark:border-warning/30',
    bars: 2,
    pdfColor: [202, 138, 4],
    pdfBgColor: [254, 249, 195],
  },
  baixa: {
    icon: ShieldAlert,
    label: 'Baixa Confiança',
    pdfLabel: 'BAIXA',
    description: 'Dados insuficientes, revise antes de aplicar',
    color: 'text-destructive',
    bg: 'bg-destructive/10 dark:bg-destructive/10',
    border: 'border-destructive/20 dark:border-destructive/30',
    bars: 1,
    pdfColor: [220, 38, 38],
    pdfBgColor: [254, 226, 226],
  },
};

/**
 * Normalize confidence key: handles 'média' → 'media' accent alias
 */
export function normalizeConfidenceKey(raw: string): ConfidenceLevel {
  const key = raw.toLowerCase().replace('é', 'e') as ConfidenceLevel;
  return confidenceConfig[key] ? key : 'media';
}

export function getConfidenceConfig(raw: string): ConfidenceConfig {
  return confidenceConfig[normalizeConfidenceKey(raw)];
}
