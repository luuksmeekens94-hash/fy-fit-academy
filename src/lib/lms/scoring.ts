"server-only";

/**
 * Berekent de score van een toetspoging.
 * Geeft scoreRaw (behaalde punten), scorePct (0–100) en passed terug.
 */
export function calculateScore(
  answers: { isCorrect: boolean | null; awardedPoints: number | null }[],
  totalPoints: number,
  passPercentage: number
): { scoreRaw: number; scorePercentage: number; passed: boolean } {
  const scoreRaw = answers.reduce(
    (sum, a) => sum + (a.awardedPoints ?? 0),
    0
  );
  const scorePercentage =
    totalPoints > 0 ? Math.round((scoreRaw / totalPoints) * 100) : 0;
  const passed = scorePercentage >= passPercentage;

  return { scoreRaw, scorePercentage, passed };
}

/**
 * Controleer of een antwoord op een MULTIPLE_CHOICE / TRUE_FALSE vraag correct is.
 */
export function checkSingleChoice(
  selectedOptionId: string,
  correctOptionId: string
): boolean {
  return selectedOptionId === correctOptionId;
}

/**
 * Controleer of een antwoord op een MULTIPLE_RESPONSE vraag correct is.
 * Alle correcte opties moeten geselecteerd zijn, geen incorrecte.
 */
export function checkMultipleResponse(
  selectedIds: string[],
  allOptions: { id: string; isCorrect: boolean }[]
): boolean {
  const correctIds = allOptions
    .filter((o) => o.isCorrect)
    .map((o) => o.id)
    .sort();
  const selected = [...selectedIds].sort();
  return (
    correctIds.length === selected.length &&
    correctIds.every((id, i) => id === selected[i])
  );
}
