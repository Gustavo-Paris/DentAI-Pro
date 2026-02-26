import { normalizeTreatmentIndication, UnknownTreatmentError } from "../_shared/treatment-normalization.ts";
import type { TreatmentIndication } from "../_shared/treatment-normalization.ts";
import { logger } from "../_shared/logger.ts";
import type { DetectedTooth, PhotoAnalysisResult } from "./types.ts";

/**
 * Safe wrapper: normalizes treatment indication, logging a warning and returning
 * the fallback on unknown values instead of crashing the entire analysis pipeline.
 */
function safeNormalizeTreatment(
  value: string | undefined | null,
  fallback: TreatmentIndication = "resina",
): TreatmentIndication {
  try {
    return normalizeTreatmentIndication(value, fallback);
  } catch (e) {
    if (e instanceof UnknownTreatmentError) {
      logger.warn(`Post-processing: unknown treatment "${e.rawValue}", using fallback "${fallback}"`);
      return fallback;
    }
    throw e;
  }
}

/**
 * Post-processes the raw AI analysis result:
 * - Normalizes tooth fields with defaults
 * - Uses global treatment_indication as fallback for individual teeth
 * - Deduplicates teeth by tooth number
 * - Strips suspected false-positive diastema diagnoses
 * - Filters out lower teeth when photo predominantly shows upper arch
 * - Removes Black classification for aesthetic cases
 * - Sorts by priority
 * - Fixes primary_tooth if it was filtered out
 * - Adds contextual warnings
 *
 * TODO [P1-29]: The DSD analysis prompt requires 2+ visual signs to diagnose
 * an existing restoration, but the analyze-dental-photo prompt only lists signs
 * without an explicit 2+ threshold. Align the analyze-dental-photo prompt
 * to also require 2+ signs for restoration detection (prompt agent task).
 */
export function processAnalysisResult(analysisResult: PhotoAnalysisResult): PhotoAnalysisResult {
  // Ensure required fields have defaults and normalize detected_teeth
  // Use the global treatment_indication as fallback instead of always defaulting to "resina"
  // This prevents the inconsistency where the case-level banner says "Facetas de Porcelana"
  // but every individual tooth shows "Resina Composta"
  const globalIndication = safeNormalizeTreatment(analysisResult.treatment_indication);
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
    treatment_indication: safeNormalizeTreatment(tooth.treatment_indication, globalIndication),
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

  // Safety net: Strip suspected false-positive diastema diagnoses.
  // The AI sometimes hallucinates diastemas from interproximal shadows or lighting artifacts.
  // Apply stricter validation since diastema requires high-confidence visual evidence.
  const diastemaTeetIdx: number[] = [];
  for (let i = 0; i < detectedTeeth.length; i++) {
    const t = detectedTeeth[i];
    const reason = (t.indication_reason || '').toLowerCase();
    const notes = (t.notes || '').toLowerCase();
    const cavClass = (t.cavity_class || '').toLowerCase();
    if (reason.includes('diastema') || notes.includes('diastema') || cavClass.includes('diastema')) {
      diastemaTeetIdx.push(i);
    }
  }

  let filteredDiastemaWarning: string | null = null;

  if (diastemaTeetIdx.length > 0) {
    const analysisConfidence = analysisResult.confidence ?? 0;
    const removedDiastemaTeeth: string[] = [];

    // Rule 0: Multiple diastema diagnoses (≥3 teeth) = overwhelming evidence.
    // When the AI detects gaps across multiple teeth, it's almost certainly real
    // (e.g., generalized spacing between centrals, laterals, and canines).
    // Skip ALL stripping rules — trust the diagnosis.
    if (diastemaTeetIdx.length >= 3) {
      logger.log(`Post-processing: ${diastemaTeetIdx.length} teeth with diastema — overwhelming evidence, skipping safety net`);
    } else if (analysisConfidence < 65) {
      // Rule 1: Very low confidence — strip diastema diagnoses.
      // Threshold lowered from 80 to 65: the case-level confidence is often
      // dragged down by other findings, not by the diastema detection itself.
      // EXCEPTION 1: bilateral central diastema (11+21 both diagnosed) is reliable even at low confidence
      const hasBilateralCentral = diastemaTeetIdx.some(i => detectedTeeth[i]?.tooth === '11')
        && diastemaTeetIdx.some(i => detectedTeeth[i]?.tooth === '21');
      // EXCEPTION 2: adjacent non-central diastemas (e.g. 12+13, 22+23) are anatomically specific
      // and unlikely to be false positives — preserve them even at low confidence
      const adjacentPairs: [string, string][] = [['11','12'],['12','13'],['21','22'],['22','23']];
      const hasAdjacentPair = adjacentPairs.some(([a, b]) =>
        diastemaTeetIdx.some(i => detectedTeeth[i]?.tooth === a) &&
        diastemaTeetIdx.some(i => detectedTeeth[i]?.tooth === b)
      );
      if (hasBilateralCentral || hasAdjacentPair) {
        const reason = hasBilateralCentral ? 'bilateral central (11+21)' : 'adjacent pair';
        logger.log(`Post-processing: diastema preserved (${reason}) despite low confidence ${analysisConfidence}%`);
      } else {
        for (const idx of diastemaTeetIdx.reverse()) {
          const tooth = detectedTeeth[idx];
          logger.warn(`Post-processing: removing diastema diagnosis for tooth ${tooth.tooth} — overall confidence ${analysisConfidence}% < 65% threshold`);
          removedDiastemaTeeth.push(tooth.tooth);
          detectedTeeth.splice(idx, 1);
        }
      }
    } else {
      // Rule 2: Central incisors (11/21) — require BOTH to mention diastema.
      // A diastema between 11 and 21 MUST be detected on BOTH teeth.
      // If only one mentions it, it's likely a shadow/artifact.
      const centralDiastema = diastemaTeetIdx.filter(i => {
        const num = detectedTeeth[i]?.tooth;
        return num === '11' || num === '21';
      });

      if (centralDiastema.length === 1) {
        const idx = centralDiastema[0];
        const tooth = detectedTeeth[idx];
        logger.warn(`Post-processing: removing suspected false diastema for tooth ${tooth.tooth} — contralateral central incisor not diagnosed with diastema`);
        removedDiastemaTeeth.push(tooth.tooth);
        detectedTeeth.splice(idx, 1);
      }
    }

    if (removedDiastemaTeeth.length > 0) {
      filteredDiastemaWarning = `Diastema em dente(s) ${removedDiastemaTeeth.join(', ')} removido da análise — confiança insuficiente para diagnóstico. Verifique manualmente.`;
    }
  }

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
  if (upperTeeth.length > 0 && lowerTeeth.length > 0 && upperTeeth.length > lowerTeeth.length) {
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
    treatment_indication: safeNormalizeTreatment(analysisResult.treatment_indication),
    indication_reason: analysisResult.indication_reason ?? undefined,
    dsd_simulation_suitability: analysisResult.dsd_simulation_suitability,
  };

  // Log detection results for debugging
  logger.log(`Multi-tooth detection complete: ${detectedTeeth.length} teeth found`);
  logger.log(`Primary tooth: ${result.primary_tooth}, Confidence: ${result.confidence}%, DSD suitability: ${result.dsd_simulation_suitability ?? 'N/A'}`);

  // Add warning about filtered lower teeth
  if (filteredLowerWarning) {
    result.warnings.push(filteredLowerWarning);
  }

  // Add warning about stripped diastema false positives
  if (filteredDiastemaWarning) {
    result.warnings.push(filteredDiastemaWarning);
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
