import { logger } from "../_shared/logger.ts";
import type { DSDAnalysis, AdditionalPhotos } from "./types.ts";

// Apply all post-processing safety nets to the analysis
export function applyPostProcessingSafetyNets(
  analysis: DSDAnalysis,
  additionalPhotos?: AdditionalPhotos,
): void {
  // Safety net #1: Strip visagismo if no face photo was provided
  // The AI prompt already instructs to skip visagismo without full face,
  // but this ensures it deterministically even if the model ignores the instruction.
  if (!additionalPhotos?.face) {
    // Check if the AI returned any visagismo data (field exists and is set)
    const hadVisagism = analysis.face_shape !== undefined && analysis.face_shape !== null;
    if (hadVisagism) {
      logger.log("Post-processing: resetting visagismo to neutral defaults (no face photo provided)");
      analysis.face_shape = 'oval'; // neutral default
      analysis.perceived_temperament = 'fleumático'; // neutral default
      analysis.recommended_tooth_shape = 'natural';
      analysis.visagism_notes = "Análise de visagismo requer foto da face completa para determinação precisa de formato facial e temperamento.";
      // Replace visagism-specific observations (pattern: "Formato facial: X" or "Temperamento: X")
      analysis.observations = (analysis.observations || []).map(obs => {
        const lower = obs.toLowerCase();
        // Only replace observations that ARE visagismo analysis results
        if (lower.startsWith('formato facial') || lower.startsWith('temperamento percebido') ||
            lower.startsWith('análise de visagismo') || lower.startsWith('visagismo:')) {
          return null; // mark for removal
        }
        return obs;
      }).filter((obs): obs is string => obs !== null);
      analysis.observations.push("Análise de visagismo não realizada — foto da face completa não fornecida.");
    }
  }

  // Safety net #2: Strip gengivoplastia for low smile line AND for média without gingival evidence.
  // "alta" always has sufficient visibility. "média" CAN have 0mm exposure (lip tangent) —
  // only allow gengivoplasty for média if observations mention visible gingiva or asymmetry.
  const smileLine = (analysis.smile_line || '').toLowerCase();
  const shouldStripGingivo = smileLine === 'baixa' || (
    smileLine === 'média' && !analysis.observations?.some(obs => {
      const lower = obs.toLowerCase();
      return lower.includes('assimetria gengival') ||
             lower.includes('coroa clínica curta') ||
             (lower.includes('gengiva') && lower.includes('visível'));
    })
  );
  if (shouldStripGingivo) {
    const before = analysis.suggestions.length;
    analysis.suggestions = analysis.suggestions.filter(s => {
      // Only filter suggestions that are specifically about gengivoplastia treatment
      const proposed = s.proposed_change.toLowerCase();
      return !proposed.includes('gengivoplastia');
    });
    const removed = before - analysis.suggestions.length;
    if (removed > 0) {
      logger.log(`Post-processing: removed ${removed} gengivoplastia suggestion(s) (smile_line=${analysis.smile_line})`);
    }
  }

  // Safety net #3: WARN (don't remove) about gengivoplastia when overbite suspected.
  // Overbite classification from a single photo is inherently uncertain — the dentist
  // should see the suggestion with a warning and decide, rather than having it silently stripped.
  if (analysis.overbite_suspicion === 'sim') {
    const hasGingivo = analysis.suggestions.some(s =>
      s.proposed_change.toLowerCase().includes('gengivoplastia'),
    );
    if (hasGingivo) {
      logger.log(`Post-processing: overbite_suspicion=sim with gengivoplastia suggestion(s) — adding warning (not removing)`);
      const hasWarning = analysis.observations?.some(o => o.toLowerCase().includes('sobremordida'));
      if (!hasWarning) {
        analysis.observations = analysis.observations || [];
        analysis.observations.push('ATENÇÃO: Suspeita de sobremordida profunda — confirmar com avaliação ortodôntica antes de gengivoplastia.');
      }
    }
  }

  // Safety net #4: Validate treatment suggestion consistency (inverted logic detection)
  // If a suggestion proposes "aumento incisal" (making tooth bigger) but treatment is gengivoplastia → fix it
  for (const suggestion of analysis.suggestions) {
    const proposed = suggestion.proposed_change.toLowerCase();
    const issue = suggestion.current_issue.toLowerCase();
    const treatment = (suggestion.treatment_indication || '').toLowerCase();

    // Case 1: Proposed change is about increasing incisal edge (tooth gets bigger)
    // but treatment says gengivoplastia → should be resina
    const proposesIncisalIncrease = proposed.includes('aument') && (proposed.includes('incisal') || proposed.includes('bordo'));
    if (proposesIncisalIncrease && treatment === 'gengivoplastia') {
      logger.log(`Post-processing: fixing inverted logic for tooth ${suggestion.tooth} — incisal increase should be resina, not gengivoplastia`);
      (suggestion as { treatment_indication: string }).treatment_indication = 'resina';
    }

    // Case 2: Issue mentions desgaste/recontorno (tooth gets smaller) but treatment is resina acréscimo
    const proposesIncisalDecrease = proposed.includes('recontorno') || proposed.includes('desgast') || proposed.includes('diminu');
    const issueIsDecrease = issue.includes('desgast') || issue.includes('recontorno') || issue.includes('diminui');
    if ((proposesIncisalDecrease || issueIsDecrease) && proposed.includes('acréscimo')) {
      logger.log(`Post-processing: fixing contradictory suggestion for tooth ${suggestion.tooth} — recontorno/desgaste proposed but acréscimo mentioned`);
      // Keep as resina but the proposed_change already describes the correct action
    }

    // Case 3: Normalize gengivoplastia/recobrimento_radicular treatment_indication
    // (in case AI used "encaminhamento" for gengivoplastia)
    if (treatment === 'encaminhamento' && (proposed.includes('gengivoplastia') || issue.includes('gengivoplastia'))) {
      (suggestion as { treatment_indication: string }).treatment_indication = 'gengivoplastia';
    }
    if (treatment === 'encaminhamento' && (proposed.includes('recobrimento') || issue.includes('recobrimento radicular'))) {
      (suggestion as { treatment_indication: string }).treatment_indication = 'recobrimento_radicular';
    }

    // Case 4: Gum removal (issue mentions recessão/raiz exposta) + recobrimento → fix if treatment is gengivoplastia
    const hasRootExposure = issue.includes('recessão') || issue.includes('raiz exposta') || issue.includes('recobrimento') || proposed.includes('cobrir raiz');
    if (hasRootExposure && treatment === 'gengivoplastia') {
      logger.log(`Post-processing: fixing inverted gum logic for tooth ${suggestion.tooth} — root exposure should be recobrimento_radicular, not gengivoplastia`);
      (suggestion as { treatment_indication: string }).treatment_indication = 'recobrimento_radicular';
    }

    // Case 5: Root coverage (proposed mentions recobrimento) but treatment is gengivoplastia → fix
    if (proposed.includes('recobrimento') && treatment === 'gengivoplastia') {
      logger.log(`Post-processing: fixing inverted gum logic for tooth ${suggestion.tooth} — recobrimento proposed but gengivoplastia indicated`);
      (suggestion as { treatment_indication: string }).treatment_indication = 'recobrimento_radicular';
    }

    // Case 6: Tooth bigger (proposed mentions aumento/acréscimo/maior/alongar) but treatment is gengivoplastia → fix to resina
    const proposesToothBigger = proposed.includes('aument') || proposed.includes('acréscimo') || proposed.includes('acrescimo') || proposed.includes('alongar') || proposed.includes('maior');
    if (proposesToothBigger && treatment === 'gengivoplastia' && !proposed.includes('gengivoplastia')) {
      logger.log(`Post-processing: fixing inverted logic for tooth ${suggestion.tooth} — tooth increase should be resina, not gengivoplastia`);
      (suggestion as { treatment_indication: string }).treatment_indication = 'resina';
    }
  }

  // Safety net #5 (replaced by dual-pass classifier): observability log
  logger.log(`Post-processing: smile_line="${analysis.smile_line}" (dual-pass applied in analyzeProportions)`);
}
