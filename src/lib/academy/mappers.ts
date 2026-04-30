import type {
  AssessmentDetail,
  AttemptResult,
  CourseDetail,
  EnrollmentDetail,
  LessonDetail,
  LessonProgressInfo,
} from "../lms/types.ts";
import type {
  AcademyAssessmentState,
  AcademyCompletionState,
  AcademyCourseCardView,
  AcademyCourseDetailView,
  AcademyLessonDetailView,
  AcademyLessonListItemView,
  AcademyLessonNavLink,
  AcademyLessonSidebarView,
} from "./types.ts";

function buildAcademyCourseHref(courseSlug: string) {
  return `/academy/${courseSlug}`;
}

function buildAcademyLessonHref(courseSlug: string, lessonSlug: string) {
  return `/academy/${courseSlug}/lessons/${lessonSlug}`;
}

function getProgressLabel(progressPercentage: number) {
  return `${progressPercentage}% afgerond`;
}

function getCourseCtaLabel(status: EnrollmentDetail["status"] | AcademyCourseCardView["status"]) {
  if (status === "NOT_STARTED") {
    return "Start e-learning";
  }

  if (status === "COMPLETED") {
    return "Bekijk opnieuw";
  }

  return "Ga verder";
}

function getLessonStatus(progressEntries: LessonProgressInfo[], lessonId: string) {
  return progressEntries.find((entry) => entry.lessonId === lessonId)?.status ?? "NOT_STARTED";
}

function buildAcademyCompletionState(enrollment: EnrollmentDetail): AcademyCompletionState {
  if (enrollment.status === "COMPLETED") {
    return {
      tone: "success",
      title: "E-learning afgerond",
      message: enrollment.certificateId
        ? "Je hebt deze e-learning afgerond en het certificaat staat gekoppeld aan je voortgang."
        : "Je hebt deze e-learning afgerond. Mooi werk.",
      isCompleted: true,
      isCertificateAvailable: enrollment.certificateId !== null,
    };
  }

  if (
    enrollment.requiredAssessmentCount > 0 &&
    enrollment.completedLessonCount >= enrollment.lessonCount &&
    enrollment.passedRequiredAssessmentCount < enrollment.requiredAssessmentCount
  ) {
    return {
      tone: "warning",
      title: "Afronding nog niet compleet",
      message: "Je lessen zijn doorlopen. Rond nu de toets af om deze e-learning volledig af te ronden.",
      isCompleted: false,
      isCertificateAvailable: false,
    };
  }

  if (enrollment.status === "IN_PROGRESS") {
    return {
      tone: "warning",
      title: "Je bent onderweg",
      message: "Werk de resterende lessen stap voor stap af om deze e-learning te voltooien.",
      isCompleted: false,
      isCertificateAvailable: false,
    };
  }

  return {
    tone: "neutral",
    title: "Klaar om te starten",
    message: "Start met de eerste les om deze e-learning in beweging te zetten.",
    isCompleted: false,
    isCertificateAvailable: false,
  };
}

function buildAcademyAssessmentState(
  assessment: AssessmentDetail | null | undefined,
  attempts: AttemptResult[],
): AcademyAssessmentState | null {
  if (!assessment) {
    return null;
  }

  const sortedAttempts = [...attempts].sort((left, right) => right.attemptNumber - left.attemptNumber);
  const latestCompletedAttempt = sortedAttempts.find((attempt) => attempt.submittedAt !== null) ?? null;
  const hasActiveAttempt = sortedAttempts.some((attempt) => attempt.submittedAt === null);
  const latestPassedAttempt = sortedAttempts.find((attempt) => attempt.passed === true) ?? null;
  const remainingAttempts = Math.max(assessment.maxAttempts - attempts.length, 0);

  if (latestPassedAttempt) {
    return {
      tone: "success",
      title: "Toets behaald",
      message:
        latestPassedAttempt.scorePercentage !== null
          ? `Je hebt deze toets behaald met ${latestPassedAttempt.scorePercentage}%.`
          : "Je hebt deze toets behaald.",
      hasPassed: true,
      hasActiveAttempt,
      remainingAttempts,
      latestCompletedAttemptNumber: latestCompletedAttempt?.attemptNumber ?? null,
      latestCompletedScorePercentage: latestCompletedAttempt?.scorePercentage ?? null,
    };
  }

  if (hasActiveAttempt) {
    return {
      tone: "warning",
      title: "Actieve toetspoging",
      message: "Je hebt al een actieve poging openstaan. Rond alle vragen af en lever de toets daarna in.",
      hasPassed: false,
      hasActiveAttempt,
      remainingAttempts,
      latestCompletedAttemptNumber: latestCompletedAttempt?.attemptNumber ?? null,
      latestCompletedScorePercentage: latestCompletedAttempt?.scorePercentage ?? null,
    };
  }

  if (latestCompletedAttempt && remainingAttempts > 0) {
    return {
      tone: "warning",
      title: "Nieuwe poging mogelijk",
      message: `Je kunt opnieuw proberen. Je hebt nog ${remainingAttempts} poging${remainingAttempts === 1 ? "" : "en"} over.`,
      hasPassed: false,
      hasActiveAttempt,
      remainingAttempts,
      latestCompletedAttemptNumber: latestCompletedAttempt.attemptNumber,
      latestCompletedScorePercentage: latestCompletedAttempt.scorePercentage,
    };
  }

  return {
    tone: "neutral",
    title: "Toets nog starten",
    message: `Je hebt ${remainingAttempts} poging${remainingAttempts === 1 ? "" : "en"} beschikbaar om deze toets af te ronden.`,
    hasPassed: false,
    hasActiveAttempt,
    remainingAttempts,
    latestCompletedAttemptNumber: latestCompletedAttempt?.attemptNumber ?? null,
    latestCompletedScorePercentage: latestCompletedAttempt?.scorePercentage ?? null,
  };
}

function buildLessonItems(course: CourseDetail, progressEntries: LessonProgressInfo[]): AcademyLessonListItemView[] {
  const lessons = course.activeVersion?.lessons ?? [];

  return lessons.map((lesson) => ({
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    type: lesson.type,
    order: lesson.order,
    isRequired: lesson.isRequired,
    estimatedMinutes: lesson.estimatedMinutes,
    status: getLessonStatus(progressEntries, lesson.id),
    href: buildAcademyLessonHref(course.slug, lesson.slug),
  }));
}

function buildLessonNavLink(courseSlug: string, lesson?: { title: string; slug: string }): AcademyLessonNavLink | null {
  if (!lesson) {
    return null;
  }

  return {
    title: lesson.title,
    href: buildAcademyLessonHref(courseSlug, lesson.slug),
  };
}

export function buildAcademyCourseCardView(params: {
  course: CourseDetail;
  enrollment: EnrollmentDetail;
}): AcademyCourseCardView {
  return {
    id: params.course.id,
    slug: params.course.slug,
    title: params.course.title,
    description: params.course.description,
    goal: params.course.goal,
    progressPercentage: params.enrollment.progress,
    progressLabel: getProgressLabel(params.enrollment.progress),
    studyLoadMinutes: params.course.studyLoadMinutes,
    assignmentLabel: params.enrollment.assignmentType === "REQUIRED" ? "Verplicht" : "Aanbevolen",
    deadlineAt: params.enrollment.deadlineAt,
    status: params.enrollment.status,
    ctaLabel: getCourseCtaLabel(params.enrollment.status),
    href: buildAcademyCourseHref(params.course.slug),
  };
}

export function buildAcademyCourseDetailView(params: {
  course: CourseDetail;
  enrollment: EnrollmentDetail;
  progressEntries: LessonProgressInfo[];
}): AcademyCourseDetailView {
  const introSections = [
    {
      label: "Doel van deze e-learning",
      value: params.course.goal ?? params.course.description,
    },
    {
      label: "Focus",
      value: params.course.focus ?? params.course.audience ?? "Nog niet ingevuld",
    },
    {
      label: "Leerdoelen",
      value:
        params.course.learnerOutcomes.length > 0
          ? params.course.learnerOutcomes
          : [params.course.learningObjectives ?? "Nog niet ingevuld"],
    },
  ];

  return {
    id: params.course.id,
    slug: params.course.slug,
    title: params.course.title,
    description: params.course.description,
    goal: params.course.goal,
    focus: params.course.focus,
    learnerOutcomes: params.course.learnerOutcomes,
    introSections,
    progressPercentage: params.enrollment.progress,
    progressLabel: getProgressLabel(params.enrollment.progress),
    studyLoadMinutes: params.course.studyLoadMinutes,
    isMandatory: params.course.isMandatory,
    status: params.enrollment.status,
    deadlineAt: params.enrollment.deadlineAt,
    startLabel: getCourseCtaLabel(params.enrollment.status),
    completionState: buildAcademyCompletionState(params.enrollment),
    lessons: buildLessonItems(params.course, params.progressEntries),
  };
}

export function buildAcademyLessonSidebarView(params: {
  course: CourseDetail;
  enrollment: EnrollmentDetail;
  currentLesson: LessonDetail;
}): AcademyLessonSidebarView {
  const lessons = params.course.activeVersion?.lessons ?? [];
  const currentIndex = lessons.findIndex((lesson) => lesson.id === params.currentLesson.id);

  return {
    courseTitle: params.course.title,
    courseHref: buildAcademyCourseHref(params.course.slug),
    progressPercentage: params.enrollment.progress,
    progressLabel: getProgressLabel(params.enrollment.progress),
    currentLessonLabel:
      currentIndex >= 0 ? `Les ${currentIndex + 1} van ${lessons.length}` : `Les ${params.currentLesson.order}`,
    previousLesson: buildLessonNavLink(params.course.slug, currentIndex > 0 ? lessons[currentIndex - 1] : undefined),
    nextLesson: buildLessonNavLink(
      params.course.slug,
      currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : undefined,
    ),
  };
}

export function buildAcademyLessonDetailView(params: {
  course: CourseDetail;
  enrollment: EnrollmentDetail;
  lesson: LessonDetail;
  progressEntries: LessonProgressInfo[];
  assessment?: AssessmentDetail | null;
  attempts?: AttemptResult[];
}): AcademyLessonDetailView {
  const lessonStatus = getLessonStatus(params.progressEntries, params.lesson.id);
  const attempts = params.attempts ?? [];
  const assessment = params.assessment ?? null;

  return {
    id: params.lesson.id,
    slug: params.lesson.slug,
    title: params.lesson.title,
    description: params.lesson.description,
    content: params.lesson.content,
    type: params.lesson.type,
    order: params.lesson.order,
    isRequired: params.lesson.isRequired,
    estimatedMinutes: params.lesson.estimatedMinutes,
    canCompleteLesson: params.lesson.type !== "ASSESSMENT" && lessonStatus !== "COMPLETED",
    course: {
      id: params.course.id,
      slug: params.course.slug,
      title: params.course.title,
    },
    enrollment: {
      progressPercentage: params.enrollment.progress,
      progressLabel: getProgressLabel(params.enrollment.progress),
      status: params.enrollment.status,
    },
    completionState: buildAcademyCompletionState(params.enrollment),
    assessment,
    assessmentState: buildAcademyAssessmentState(assessment, attempts),
    attempts,
    sidebar: buildAcademyLessonSidebarView({
      course: params.course,
      enrollment: params.enrollment,
      currentLesson: params.lesson,
    }),
  };
}
