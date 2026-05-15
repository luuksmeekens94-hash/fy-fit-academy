type RequiredLessonForRedo = {
  id: string;
  isRequired: boolean;
  type: string;
};

type ProgressEntryForRedo = {
  lessonId: string;
  completedAt: Date | null;
};

type AssessmentRedoPolicyInput = {
  latestFailedAttemptSubmittedAt: Date | null;
  requiredLessons: RequiredLessonForRedo[];
  progressEntries: ProgressEntryForRedo[];
};

export function canStartAssessmentResitAfterFailedAttempt(input: AssessmentRedoPolicyInput) {
  if (!input.latestFailedAttemptSubmittedAt) {
    return true;
  }

  const progressByLessonId = new Map(input.progressEntries.map((progress) => [progress.lessonId, progress]));
  const requiredLearningLessons = input.requiredLessons.filter(
    (lesson) => lesson.isRequired && lesson.type !== "ASSESSMENT",
  );

  return requiredLearningLessons.every((lesson) => {
    const progress = progressByLessonId.get(lesson.id);
    return Boolean(progress?.completedAt && progress.completedAt > input.latestFailedAttemptSubmittedAt!);
  });
}
