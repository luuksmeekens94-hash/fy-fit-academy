import type {
  AssessmentDetail,
  AttemptResult,
  CourseDetail,
  EnrollmentDetail,
  LessonDetail,
  LessonProgressInfo,
} from "../lms/types.ts";
import type {
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
    assessment: params.assessment ?? null,
    attempts: params.attempts ?? [],
    sidebar: buildAcademyLessonSidebarView({
      course: params.course,
      enrollment: params.enrollment,
      currentLesson: params.lesson,
    }),
  };
}
