import { normalizeTreatmentIndication } from "../_shared/treatment-normalization.ts";
import { logger } from "../_shared/logger.ts";
import type { DetectedTooth, PhotoAnalysisResult } from "./types.ts";

/**
 * Post-processes the raw AI analysis result:
 * - Normalizes tooth fields with defaults
 * - Uses global treatment_indication as fallback for individual teeth
 * - Deduplicates teeth by tooth number
 * - Filters out lower teeth when photo predominantly shows upper arch
 * - Removes Black classification for aesthetic cases
 * - Sorts by priority
 * - Fixes primary_tooth if it was filtered out
 * - Adds contextual warnings
 */
export function processAnalysisResult(analysisResult: PhotoAnalysisResult): PhotoAnalysisResult {
  // Ensure required fields have defaults and normalize detected_teeth
  // Use the global treatment_indication as fallback instead of always defaulting to "resina"
  // This prevents the inconsistency where the case-level banner says "Facetas de Porcelana"
  // but every individual tooth shows "Resina Composta"
  const globalIndication = normalizeTreatmentIndication(analysisResult.treatment_indication);
  const rawTeeth: DetectedTooth[] = (analysisResult.detected_teeth || []).map((tooth: Partial<DetectedTooth>) => ({
    tooth: String(tooth.tooth || "desconhecido"),
    tooth_region: tooth.tooth_region ?? null,
    cavity_class: tooth.cavity_class ?? null,
    restoration_size: tooth.restoration_size ?? null,
    substrate: tooth.substrate ?? null,
    substrate_condition: tooth.substrate_condition ?? null,
    enamel_condition: tooth.enamel_condition ?? null,
    depth: tooth.depth ?? null,
    priority: tooth.priority || "média",
    notes: tooth.notes ?? null,
    treatment_indication: normalizeTreatmentIndication(tooth.treatment_indication) || globalIndication,
    indication_reason: tooth.indication_reason ?? undefined,
    tooth_bounds: tooth.tooth_bounds ?? undefined,
  }));

  // Deduplicate: the AI model can return the same tooth number multiple times
  // (e.g., once for mesial diastema and once for distal). Keep the first occurrence
  // which has the highest priority since the AI orders by urgency.
  const seenToothNumbers = new Set<string>();
  const detectedTeeth: DetectedTooth[] = rawTeeth.filter(t => {
    if (seenToothNumbers.has(t.tooth)) return false;
    seenToothNumbers.add(t.tooth);
    return true;
  });

  // Filter out lower teeth when photo predominantly shows upper arch
  // This is a backend guardrail because the AI sometimes ignores prompt rules
  const upperTeeth = detectedTeeth.filter(t => {
    const num = parseInt(t.tooth);
    return num >= 11 && num <= 28;
  });
  const lowerTeeth = detectedTeeth.filter(t => {
    const num = parseInt(t.tooth);
    return num >= 31 && num <= 48;
  });

  // If majority of detected teeth are upper arch, remove lower teeth
  let filteredLowerWarning: string | null = null;
  if (upperTeeth.length > 0 && lowerTeeth.length > 0 && upperTeeth.length >= lowerTeeth.length) {
    const removedNumbers = lowerTeeth.map(t => t.tooth);
    logger.warn(`Removing lower teeth ${removedNumbers.join(', ')} — photo predominantly shows upper arch (${upperTeeth.length} upper vs ${lowerTeeth.length} lower)`);
    filteredLowerWarning = `Dentes inferiores (${removedNumbers.join(', ')}) removidos da análise — foto mostra predominantemente a arcada superior.`;
    // Keep only upper teeth
    detectedTeeth.splice(0, detectedTeeth.length, ...upperTeeth);
  }

  // Post-processing: Remove Black classification for non-applicable treatments
  // Aesthetic procedures (facetas, lentes, recontornos, acréscimos) should NOT have Classe I-VI
  const blackClassPattern = /^Classe\s+(I{1,3}V?|IV|V|VI)$/i;
  const aestheticTreatments = ['porcelana', 'encaminhamento', 'gengivoplastia', 'recobrimento_radicular'];
  for (const tooth of detectedTeeth) {
    if (!tooth.cavity_class || !blackClassPattern.test(tooth.cavity_class)) continue;
    const reason = (tooth.indication_reason || '').toLowerCase();
    const treatment = (tooth.treatment_indication || '').toLowerCase();
    const notes = (tooth.notes || '').toLowerCase();
    const isAestheticCase =
      aestheticTreatments.includes(treatment) ||
      reason.includes('faceta') ||
      reason.includes('lente') ||
      reason.includes('laminado') ||
      reason.includes('recontorno') ||
      reason.includes('acréscimo') ||
      reason.includes('acrescimo') ||
      reason.includes('diastema') ||
      reason.includes('microdontia') ||
      reason.includes('conoide') ||
      reason.includes('harmoniz') ||
      reason.includes('volume') ||
      reason.includes('reanatomiz') ||
      reason.includes('gengivoplastia') ||
      reason.includes('recobrimento') ||
      reason.includes('desgaste seletivo') ||
      reason.includes('ortodont') ||
      notes.includes('gengivoplastia') ||
      notes.includes('recobrimento') ||
      notes.includes('faceta') ||
      notes.includes('lente') ||
      notes.includes('desgaste seletivo') ||
      notes.includes('ortodont');
    if (isAestheticCase) {
      logger.log(`Post-processing: removing Black classification '${tooth.cavity_class}' for aesthetic tooth ${tooth.tooth} (reason: ${reason.substring(0, 50)})`);
      tooth.cavity_class = null;
    }
  }

  // Sort by priority: alta > média > baixa
  const priorityOrder = { alta: 0, média: 1, baixa: 2 };
  detectedTeeth.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Fix primary_tooth if it was a filtered-out lower tooth
  let primaryTooth = analysisResult.primary_tooth ?? (detectedTeeth.length > 0 ? detectedTeeth[0].tooth : null);
  if (primaryTooth && !detectedTeeth.some(t => t.tooth === primaryTooth)) {
    primaryTooth = detectedTeeth.length > 0 ? detectedTeeth[0].tooth : null;
  }

  const result: PhotoAnalysisResult = {
    detected: analysisResult.detected ?? detectedTeeth.length > 0,
    confidence: analysisResult.confidence ?? 0,
    detected_teeth: detectedTeeth,
    primary_tooth: primaryTooth,
    vita_shade: analysisResult.vita_shade ?? null,
    observations: analysisResult.observations ?? [],
    warnings: analysisResult.warnings ?? [],
    treatment_indication: normalizeTreatmentIndication(analysisResult.treatment_indication),
    indication_reason: analysisResult.indication_reason ?? undefined,
  };

  // Log detection results for debugging
  logger.log(`Multi-tooth detection complete: ${detectedTeeth.length} teeth found`);
  logger.log(`Primary tooth: ${result.primary_tooth}, Confidence: ${result.confidence}%`);

  // Add warning about filtered lower teeth
  if (filteredLowerWarning) {
    result.warnings.push(filteredLowerWarning);
  }

  // Add warning if multiple teeth detected
  if (detectedTeeth.length > 1) {
    result.warnings.unshift(`Detectados ${detectedTeeth.length} dentes com necessidade de tratamento. Selecione qual deseja tratar primeiro.`);
  }

  // Add warning if only 1 tooth detected with low confidence (might be missing teeth)
  if (detectedTeeth.length === 1 && result.confidence < 85) {
    result.warnings.push("Apenas 1 dente detectado. Se houver mais dentes com problema na foto, use 'Reanalisar' ou adicione manualmente.");
  }

  return result;
}
