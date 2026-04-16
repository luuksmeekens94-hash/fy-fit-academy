import type { AttemptResult } from "./types";

export function getActiveAssessmentAttempt(attempts: AttemptResult[]): AttemptResult | null {
  const activeAttempts = attempts.filter((attempt) => attempt.submittedAt === null);

  if (!activeAttempts.length) {
    return null;
  }

  return [...activeAttempts].sort((left, right) => right.attemptNumber - left.attemptNumber)[0] ?? null;
}

export function getLatestCompletedAssessmentAttempt(attempts: AttemptResult[]): AttemptResult | null {
  const completedAttempts = attempts.filter((attempt) => attempt.submittedAt !== null);

  if (!completedAttempts.length) {
    return null;
  }

  return [...completedAttempts].sort((left, right) => right.attemptNumber - left.attemptNumber)[0] ?? null;
}

export function getRemainingAssessmentAttempts(maxAttempts: number, attempts: AttemptResult[]): number {
  return Math.max(maxAttempts - attempts.length, 0);
}
