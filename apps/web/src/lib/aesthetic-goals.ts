/**
 * Maps aesthetic goal enum codes (stored in DB) back to PT prompt text
 * for AI edge function consumption. Legacy PT text is passed through as-is.
 */

const GOAL_TO_PROMPT: Record<string, string> = {
  whitening_hollywood:
    'Paciente deseja clareamento INTENSO - nível Hollywood (BL1). Ajustar todas as camadas 2-3 tons mais claras que a cor detectada.',
  whitening_natural:
    'Paciente prefere aparência NATURAL (A1/A2). Manter tons naturais.',
};

export function resolveAestheticGoalsForAI(
  dbValue: string | null | undefined,
): string | undefined {
  if (!dbValue) return undefined;
  return GOAL_TO_PROMPT[dbValue] ?? dbValue;
}
