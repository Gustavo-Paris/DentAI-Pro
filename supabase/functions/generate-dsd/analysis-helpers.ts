import type { DSDAnalysis } from "./types.ts";

// Check if case has severe destruction that limits DSD
export function hasSevereDestruction(analysis: DSDAnalysis): { isLimited: boolean; reason: string | null } {
  const destructionKeywords = [
    'ausente', 'destruição', 'raiz residual', 'implante', 'extração',
    'fratura extensa', 'destruído', 'coroa total', 'prótese', 'sem coroa',
    // Avulsion / tooth loss
    'avulsionado', 'avulsão',
    // Edentulism
    'edêntulo', 'edentulo', 'edentulous',
    'missing', 'tooth loss',
    // Root surgery / sectioning
    'rizectomia', 'hemissecção', 'hemisseccao',
    // Indicated extraction / residual root variants
    'extração indicada',
    'remanescente radicular',
    // Hopeless prognosis
    'hopeless',
  ];

  const hasDestructionInSuggestions = analysis.suggestions.some(s =>
    destructionKeywords.some(keyword =>
      s.current_issue.toLowerCase().includes(keyword) ||
      s.proposed_change.toLowerCase().includes(keyword)
    )
  );

  const hasDestructionInObservations = analysis.observations?.some(obs =>
    destructionKeywords.some(keyword => obs.toLowerCase().includes(keyword))
  );

  if (hasDestructionInSuggestions || hasDestructionInObservations) {
    return {
      isLimited: true,
      reason: "Caso apresenta destruição dental significativa (dente ausente, fratura extensa ou necessidade de implante/coroa). A simulação visual pode não representar o resultado final com precisão."
    };
  }

  // Check if confidence is low due to photo quality or case complexity
  if (analysis.confidence === 'baixa') {
    const hasTrueIntraoralIssue = analysis.observations?.some(obs => {
      const lower = obs.toLowerCase();
      return (lower.includes('afastador') ||
              (lower.includes('intraoral') && (lower.includes('interna') || lower.includes('sem lábio') || lower.includes('retrator'))) ||
              lower.includes('close-up extremo'));
    });

    if (hasTrueIntraoralIssue) {
      return {
        isLimited: true,
        reason: "Foto intraoral com afastador detectada. Recomenda-se foto do sorriso completo para simulação mais precisa."
      };
    }
  }

  return { isLimited: false, reason: null };
}
