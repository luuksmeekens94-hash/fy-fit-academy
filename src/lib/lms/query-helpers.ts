import type { AttemptResult } from "./types";

export function calculateCourseProgress(params: {
  lessonIds: string[];
  completedLessonIds: string[];
}): number {
  const { lessonIds, completedLessonIds } = params;

  if (lessonIds.length === 0) {
    return 0;
  }

  const completedCount = lessonIds.filter((lessonId) =>
    completedLessonIds.includes(lessonId)
  ).length;

  return Math.round((completedCount / lessonIds.length) * 100);
}

export function selectLatestPassedAttempt(
  attempts: AttemptResult[]
): AttemptResult | null {
  const passedAttempts = attempts.filter((attempt) => attempt.passed === true);

  if (passedAttempts.length === 0) {
    return null;
  }

  return passedAttempts.sort((left, right) => right.attemptNumber - left.attemptNumber)[0];
}
