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

// Apply smile line override: classifier is authoritative (can both upgrade AND downgrade)
// The dedicated classifier uses a calibrated prompt focused solely on smile line,
// making it more accurate than the general-purpose DSD analysis.
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
    } else {
      logger.log(
        `Smile line classifier: agrees with main analysis (both="${analysis.smile_line}")`
      );
    }
  }

  // Safety net: keyword-based cross-validation of observations vs smile_line
  // Only upgrade to "alta" if observations describe TRUE gummy smile indicators
  // (continuous band of gum, >3mm exposure), NOT normal anatomy (visible papillae, contour)
  if (analysis.smile_line === 'média' || analysis.smile_line === 'media') {
    const allText = [
      ...(analysis.observations || []),
      ...(analysis.suggestions || []).map((s: { description?: string; notes?: string }) => `${s.description || ''} ${s.notes || ''}`),
    ].join(' ').toLowerCase();

    // Only keywords that indicate TRUE gummy smile (not normal anatomy)
    const gummySmileKeywords = [
      'sorriso gengival', 'excesso gengival', 'excesso de gengiva',
      'faixa de gengiva', 'banda de gengiva', 'gengiva rosa acima',
      'exposição gengival significativa', 'exposicao gengival significativa',
      '>3mm',
    ];

    const matched = gummySmileKeywords.filter(kw => allText.includes(kw));
    if (matched.length >= 1) {
      logger.log(
        `Smile line SAFETY NET: observations mention gummy smile indicators (${matched.join(', ')}) ` +
        `but smile_line="${analysis.smile_line}" — upgrading to "alta"`
      );
      analysis.smile_line = 'alta';
      analysis.observations = analysis.observations || [];
      analysis.observations.push(
        `Linha do sorriso reclassificada para "alta" por cross-validação: ` +
        `observações indicam exposição gengival (${matched.join(', ')}) incompatível com classificação "média".`
      );
    }
  }
}
