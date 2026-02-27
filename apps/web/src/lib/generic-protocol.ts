/**
 * Generic protocol generation for non-resin treatment types.
 *
 * Moved from hooks/domain/wizard/helpers.ts to fix the architectural
 * layer inversion (lib/protocol-dispatch.ts was importing from hooks/).
 */

import type { TreatmentType } from '@/lib/treatment-config';
import i18n from '@/lib/i18n';

export function getGenericProtocol(
  treatmentType: TreatmentType,
  tooth: string,
  toothData: { indication_reason?: string | null } | undefined,
) {
  const t = (key: string, opts?: Record<string, unknown>) => i18n.t(key, opts);
  const tArr = (key: string) => i18n.t(key, { returnObjects: true }) as string[];

  // Simple protocols — all content from i18n
  if (['implante', 'coroa', 'endodontia', 'gengivoplastia', 'recobrimento_radicular'].includes(treatmentType)) {
    return {
      treatment_type: treatmentType,
      tooth,
      ai_reason: toothData?.indication_reason || null,
      summary: t(`protocols.${treatmentType}.summary`, { tooth }),
      checklist: tArr(`protocols.${treatmentType}.checklist`),
      alerts: tArr(`protocols.${treatmentType}.alerts`),
      recommendations: tArr(`protocols.${treatmentType}.recommendations`),
    };
  }

  // Encaminhamento — specialty detection + dynamic referral items
  const reason = (toothData?.indication_reason || '').toLowerCase();
  let specialty = '';
  let specialtyKey = '';

  if (reason.includes('apinhamento') || reason.includes('ortodon') || reason.includes('maloclusão') || reason.includes('alinhamento')) {
    specialty = t('specialties.ortodontia');
    specialtyKey = 'ortodontia';
  } else if (reason.includes('canal') || reason.includes('pulp') || reason.includes('periapical') || reason.includes('endodon')) {
    specialty = t('specialties.endodontia');
    specialtyKey = 'endodontiaRef';
  } else if (reason.includes('perio') || reason.includes('gengiv') || reason.includes('bolsa') || reason.includes('retração')) {
    specialty = t('specialties.periodontia');
    specialtyKey = 'periodontia';
  } else if (reason.includes('implante') || reason.includes('cirurg') || reason.includes('extração') || reason.includes('terceiro molar')) {
    specialty = t('specialties.cirurgiaBucomaxilofacial');
  } else if (reason.includes('dtm') || reason.includes('atm') || reason.includes('articulação')) {
    specialty = t('specialties.dtmDorOrofacial');
  }

  let checklist: string[];
  let recommendations: string[];

  if (specialtyKey) {
    const baseChecklist = tArr(`protocols.encaminhamento.${specialtyKey}.checklist`);
    const defaultReason = t(`protocols.encaminhamento.${specialtyKey}.defaultReason`);
    const referToItem = t('protocols.encaminhamento.referTo', {
      specialty,
      reason: toothData?.indication_reason || defaultReason,
    });
    const insertPos = specialtyKey === 'ortodontia' ? 3 : 2;
    checklist = [...baseChecklist.slice(0, insertPos), referToItem, ...baseChecklist.slice(insertPos)];
    recommendations = tArr(`protocols.encaminhamento.${specialtyKey}.recommendations`);
  } else {
    const baseChecklist = tArr('protocols.encaminhamento.defaultChecklist');
    const referToFull = t('protocols.encaminhamento.referTo', { specialty, reason: '' });
    const referItem = specialty
      ? referToFull.split(' — ')[0]
      : t('protocols.encaminhamento.identifySpecialty');
    checklist = [...baseChecklist.slice(0, 3), referItem, ...baseChecklist.slice(3)];
    recommendations = tArr('protocols.encaminhamento.defaultRecommendations');
  }

  const summaryBase = t('protocols.encaminhamento.summary', { tooth });
  const specialtyText = specialty
    ? t('protocols.encaminhamento.summarySpecialty', { specialty })
    : '';

  return {
    treatment_type: treatmentType,
    tooth,
    ai_reason: toothData?.indication_reason || null,
    summary: summaryBase + specialtyText,
    checklist,
    alerts: tArr('protocols.encaminhamento.alerts'),
    recommendations,
  };
}
