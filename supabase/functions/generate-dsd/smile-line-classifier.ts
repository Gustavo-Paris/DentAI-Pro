import { logger } from "../_shared/logger.ts";
import type { DSDAnalysis, SmileLineClassifierResult } from "./types.ts";

// Parse the smile line classifier plain-text response into structured result
export function parseSmileLineClassifierResponse(text: string): SmileLineClassifierResult | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const raw = JSON.parse(jsonMatch[0]);

    // Normalize "media" → "média" (classifier prompt uses unaccented)
    let smileLine = (raw.smile_line || '').toLowerCase().trim();
    if (smileLine === 'media') smileLine = 'média';
    if (!['alta', 'média', 'baixa'].includes(smileLine)) return null;

    let confidence = (raw.confidence || '').toLowerCase().trim();
    if (confidence === 'media') confidence = 'média';
    if (!['alta', 'média', 'baixa'].includes(confidence)) confidence = 'média';

    const mm = typeof raw.gingival_exposure_mm === 'number' ? raw.gingival_exposure_mm : 0;
    const justification = typeof raw.justification === 'string' ? raw.justification : '';

    return {
      smile_line: smileLine as SmileLineClassifierResult['smile_line'],
      gingival_exposure_mm: mm,
      confidence: confidence as SmileLineClassifierResult['confidence'],
      justification,
    };
  } catch {
    return null;
  }
}

// Apply smile line override: classifier can both upgrade AND downgrade, but only
// when confidence is sufficient. Low-confidence results should not override Sonnet.
// The dedicated classifier uses a calibrated prompt focused solely on smile line,
// making it more accurate than the general-purpose DSD analysis when confident.
export function applySmileLineOverride(
  analysis: DSDAnalysis,
  classifierResult: SmileLineClassifierResult | null,
): void {
  if (!classifierResult) {
    logger.log("Smile line classifier: no result (failed or skipped) — keeping original");
  } else {
    const severityMap: Record<string, number> = { baixa: 0, 'média': 1, alta: 2 };
    const mainSeverity = severityMap[analysis.smile_line] ?? 1;
    const classifierSeverity = severityMap[classifierResult.smile_line] ?? 1;

    if (classifierSeverity !== mainSeverity) {
      // Text-based override: only apply when classifier confidence is alta or média
      if (classifierResult.confidence === 'baixa') {
        logger.log(
          `Smile line classifier: would ${classifierSeverity > mainSeverity ? 'UPGRADE' : 'DOWNGRADE'} ` +
          `"${analysis.smile_line}" → "${classifierResult.smile_line}" but confidence is "baixa" — ` +
          `keeping main analysis result (exposure=${classifierResult.gingival_exposure_mm}mm, ` +
          `reason="${classifierResult.justification}")`
        );
      } else {
        const direction = classifierSeverity > mainSeverity ? 'UPGRADE' : 'DOWNGRADE';
        logger.log(
          `Smile line classifier ${direction}: "${analysis.smile_line}" → "${classifierResult.smile_line}" ` +
          `(exposure=${classifierResult.gingival_exposure_mm}mm, confidence=${classifierResult.confidence}, ` +
          `reason="${classifierResult.justification}")`
        );
        analysis.smile_line = classifierResult.smile_line;
        analysis.observations = analysis.observations || [];
        analysis.observations.push(
          `Classificação da linha do sorriso ajustada para "${classifierResult.smile_line}" pelo classificador dedicado ` +
          `(exposição gengival estimada: ${classifierResult.gingival_exposure_mm}mm).`
        );
      }
    } else {
      logger.log(
        `Smile line classifier: agrees with main analysis (both="${analysis.smile_line}")`
      );
    }
  }

  // Quantitative override: if classifier reports ≥3mm exposure but classified as
  // non-alta, force "alta" since ≥3mm is the clinical threshold for gummy smile.
  // This ALWAYS applies regardless of confidence — quantitative threshold is reliable.
  if (classifierResult && classifierResult.gingival_exposure_mm >= 3 && analysis.smile_line !== 'alta') {
    logger.log(
      `Smile line NUMERIC OVERRIDE: classifier reported ${classifierResult.gingival_exposure_mm}mm ` +
      `gingival exposure (≥3mm threshold) but smile_line="${analysis.smile_line}" → forcing "alta"`
    );
    analysis.smile_line = 'alta';
    analysis.observations = analysis.observations || [];
    analysis.observations.push(
      `Linha do sorriso reclassificada para "alta": exposição gengival estimada de ` +
      `${classifierResult.gingival_exposure_mm}mm (≥3mm = sorriso gengival).`
    );
  }

  // Note: keyword-based safety net was removed — it caused false positives
  // when observations contained negated phrases (e.g., "Não há gengiva rosa acima").
  // The classifier + numeric override (≥3mm) are sufficient and more reliable.
}
