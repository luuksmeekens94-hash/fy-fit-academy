import type {
  AssessmentDetail,
  AttemptResult,
  EnrollmentDetail,
  EnrollmentSummary,
  LessonDetail,
  LessonProgressInfo,
} from "../lms/types.ts";

export type AcademyCourseCardView = {
  id: string;
  slug: string;
  title: string;
  description: string;
  goal: string | null;
  progressPercentage: number;
  progressLabel: string;
  studyLoadMinutes: number;
  assignmentLabel: string;
  deadlineAt: Date | null;
  status: EnrollmentSummary["status"];
  ctaLabel: string;
  href: string;
};

export type AcademyIntroSection = {
  label: string;
  value: string | string[];
};

export type AcademyCompletionState = {
  tone: "success" | "warning" | "neutral";
  title: string;
  message: string;
  isCompleted: boolean;
  isCertificateAvailable: boolean;
};

export type AcademyAssessmentState = {
  tone: "success" | "warning" | "neutral";
  title: string;
  message: string;
  hasPassed: boolean;
  hasActiveAttempt: boolean;
  remainingAttempts: number;
  latestCompletedAttemptNumber: number | null;
  latestCompletedScorePercentage: number | null;
};

export type AcademyLessonListItemView = {
  id: string;
  slug: string;
  title: string;
  type: LessonDetail["type"];
  order: number;
  isRequired: boolean;
  estimatedMinutes: number;
  status: LessonProgressInfo["status"];
  href: string;
};

export type AcademyCourseDetailView = {
  id: string;
  slug: string;
  title: string;
  description: string;
  goal: string | null;
  focus: string | null;
  learnerOutcomes: string[];
  introSections: AcademyIntroSection[];
  progressPercentage: number;
  progressLabel: string;
  studyLoadMinutes: number;
  isMandatory: boolean;
  status: EnrollmentDetail["status"];
  deadlineAt: Date | null;
  startLabel: string;
  completionState: AcademyCompletionState;
  lessons: AcademyLessonListItemView[];
};

export type AcademyLessonNavLink = {
  title: string;
  href: string;
};

export type AcademyLessonSidebarView = {
  courseTitle: string;
  courseHref: string;
  progressPercentage: number;
  progressLabel: string;
  currentLessonLabel: string;
  previousLesson: AcademyLessonNavLink | null;
  nextLesson: AcademyLessonNavLink | null;
};

export type AcademyLessonDetailView = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  type: LessonDetail["type"];
  order: number;
  isRequired: boolean;
  estimatedMinutes: number;
  canCompleteLesson: boolean;
  course: Pick<AcademyCourseDetailView, "id" | "slug" | "title">;
  enrollment: Pick<AcademyCourseDetailView, "progressPercentage" | "progressLabel"> & {
    status: EnrollmentDetail["status"];
  };
  completionState: AcademyCompletionState;
  assessment: AssessmentDetail | null;
  assessmentState: AcademyAssessmentState | null;
  attempts: AttemptResult[];
  sidebar: AcademyLessonSidebarView;
};
