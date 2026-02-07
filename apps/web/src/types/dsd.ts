/**
 * Shared DSD types for multi-layer simulation support.
 *
 * Each SimulationLayer represents one progressive treatment visualization:
 *   Layer 1: restorations-only (structural corrections at natural tooth color)
 *   Layer 2: whitening-restorations (corrections + whitening)
 *   Layer 3: complete-treatment (with gengivoplasty, conditional)
 *
 * This progression helps the dentist sell each additional procedure:
 *   "See what restorations alone do" → "Now add whitening" → "Plus gum recontouring"
 */

export type SimulationLayerType =
  | 'restorations-only'
  | 'whitening-restorations'
  | 'complete-treatment';

export interface SimulationLayer {
  /** Layer type identifier */
  type: SimulationLayerType;
  /** User-facing label in PT-BR */
  label: string;
  /** Storage path (not signed URL) */
  simulation_url: string | null;
  /** Whitening level used for this layer */
  whitening_level: 'natural' | 'white' | 'hollywood';
  /** Whether gengivoplasty recontouring is included */
  includes_gengivoplasty: boolean;
}

/** Layer labels (PT-BR) */
export const LAYER_LABELS: Record<SimulationLayerType, string> = {
  'restorations-only': 'Apenas Restaurações',
  'whitening-restorations': 'Restaurações + Clareamento',
  'complete-treatment': 'Tratamento Completo',
};
