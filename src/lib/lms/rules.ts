"server-only";

/**
 * Completion rules: bepaalt of een cursus als afgerond beschouwd kan worden.
 *
 * Criteria (MVP):
 * 1. Alle verplichte lessen zijn COMPLETED
 * 2. Alle verplichte assessments zijn gehaald (passed = true)
 */
export function isCourseCompleted(params: {
  requiredLessonIds: string[];
  completedLessonIds: string[];
  requiredAssessmentIds: string[];
  passedAssessmentIds: string[];
}): boolean {
  const {
    requiredLessonIds,
    completedLessonIds,
    requiredAssessmentIds,
    passedAssessmentIds,
  } = params;

  const allLessonsDone = requiredLessonIds.every((id) =>
    completedLessonIds.includes(id)
  );

  const allAssessmentsPassed = requiredAssessmentIds.every((id) =>
    passedAssessmentIds.includes(id)
  );

  return allLessonsDone && allAssessmentsPassed;
}
