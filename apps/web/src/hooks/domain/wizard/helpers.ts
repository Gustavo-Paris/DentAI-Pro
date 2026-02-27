import type { DetectedTooth } from '@/types/wizard';
import { ANTERIOR_TEETH } from './constants';

// Re-export from canonical location for backward compatibility
export { getGenericProtocol } from '@/lib/generic-protocol';

export function isAnterior(tooth: string): boolean {
  return ANTERIOR_TEETH.includes(tooth);
}

/**
 * Infer the aesthetic cavity class when cavity_class is null.
 * Microdontia, diastema closure, and other aesthetic procedures don't have
 * a traditional Black's classification — but the recommend-resin edge function
 * requires a valid cavityClass string. This maps indication_reason → aesthetic class.
 */
export function inferCavityClass(
  toothData: DetectedTooth | undefined,
  fallback: string,
  treatmentType?: string,
): string {
  if (toothData?.cavity_class) return toothData.cavity_class;

  const reason = (toothData?.indication_reason || '').toLowerCase();
  if (reason.includes('lente') || reason.includes('contato')) {
    return 'Lente de Contato';
  }
  if (reason.includes('reanatomização') || reason.includes('microdontia') || reason.includes('volume') || reason.includes('conoide')) {
    return 'Recontorno Estético';
  }
  if (reason.includes('diastema') || reason.includes('espaçamento')) {
    return 'Fechamento de Diastema';
  }
  if (reason.includes('faceta')) {
    return 'Faceta Direta';
  }
  if (reason.includes('reparo') || reason.includes('substituição')) {
    return 'Reparo de Restauração';
  }
  if (reason.includes('desgaste') || reason.includes('incisal') || reason.includes('recontorno')) {
    return 'Recontorno Estético';
  }

  // When treatment is porcelana and fallback would be a Black's class, use Faceta Direta
  if (treatmentType === 'porcelana' && /^Classe\s/i.test(fallback)) {
    return 'Faceta Direta';
  }

  return fallback;
}

export function getFullRegion(tooth: string): string {
  const toothNum = parseInt(tooth);
  const isUpper = toothNum >= 10 && toothNum <= 28;
  if (isAnterior(tooth)) {
    return isUpper ? 'anterior-superior' : 'anterior-inferior';
  }
  return isUpper ? 'posterior-superior' : 'posterior-inferior';
}

