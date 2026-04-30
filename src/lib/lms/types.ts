import {
  AccreditationKind,
  AssignmentType,
  CourseStatus,
  EnrollmentStatus,
  LessonProgressStatus,
  LessonType,
  QuestionType,
  WorkForm,
} from "@prisma/client";

// ─── Course ───────────────────────────────────────────────────────────────────

export type CourseAuthorExpert = {
  name: string;
  role: string;
  organization?: string;
  registrationNumber?: string;
};

export type CourseSummary = {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: CourseStatus;
  isMandatory: boolean;
  studyLoadMinutes: number;
  accreditationRegister: string | null;
  accreditationKind: AccreditationKind;
  versionDate: Date | null;
  requiredQuestionCount: number | null;
  authorName: string;
  publishedAt: Date | null;
  versionCount: number;
  enrollmentCount: number;
};

export type CourseDetail = {
  id: string;
  title: string;
  slug: string;
  description: string;
  audience: string | null;
  learningObjectives: string | null;
  goal: string | null;
  focus: string | null;
  learnerOutcomes: string[];
  accreditationRegister: string | null;
  accreditationKind: AccreditationKind;
  versionDate: Date | null;
  authorExperts: CourseAuthorExpert[];
  requiredQuestionCount: number | null;
  studyLoadMinutes: number;
  status: CourseStatus;
  isMandatory: boolean;
  authorId: string;
  authorName: string;
  reviewerId: string | null;
  reviewerName: string | null;
  publishedAt: Date | null;
  revisionDueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  activeVersion: CourseVersionDetail | null;
};

// ─── CourseVersion ────────────────────────────────────────────────────────────

export type CourseVersionDetail = {
  id: string;
  courseId: string;
  versionNumber: string;
  changeSummary: string | null;
  isActive: boolean;
  createdAt: Date;
  modules: CourseModuleSummary[];
  objectives: LearningObjectiveSummary[];
  literature: LiteratureReferenceSummary[];
  competencies: CompetencyReferenceSummary[];
  evaluationForms: EvaluationFormSummary[];
  lessons: LessonSummary[];
  assessments: AssessmentSummary[];
};

export type CourseModuleSummary = {
  id: string;
  title: string;
  description: string | null;
  introduction: string | null;
  summary: string | null;
  order: number;
  estimatedMinutes: number;
  workForms: WorkForm[];
};

export type LearningObjectiveSummary = {
  id: string;
  moduleId: string | null;
  code: string;
  text: string;
  order: number;
};

export type LiteratureReferenceSummary = {
  id: string;
  moduleId: string | null;
  title: string;
  source: string | null;
  url: string | null;
  guideline: string | null;
  year: number | null;
  order: number;
};

export type CompetencyReferenceSummary = {
  id: string;
  moduleId: string | null;
  name: string;
  framework: string | null;
  description: string | null;
};

export type EvaluationFormSummary = {
  id: string;
  title: string;
  isRequired: boolean;
  questionCount: number;
};

// ─── Lesson ───────────────────────────────────────────────────────────────────

export type LessonSummary = {
  id: string;
  title: string;
  slug: string;
  type: LessonType;
  order: number;
  isRequired: boolean;
  estimatedMinutes: number;
};

export type LessonDetail = {
  id: string;
  courseVersionId: string;
  moduleId: string | null;
  title: string;
  slug: string;
  description: string | null;
  type: LessonType;
  content: string;
  order: number;
  isRequired: boolean;
  estimatedMinutes: number;
};

// ─── Enrollment ───────────────────────────────────────────────────────────────

export type EnrollmentSummary = {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  status: EnrollmentStatus;
  assignmentType: AssignmentType;
  deadlineAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  progress: number; // 0–100
};

export type EnrollmentDetail = EnrollmentSummary & {
  userId: string;
  activeVersionId: string | null;
  lessonCount: number;
  completedLessonCount: number;
  requiredAssessmentCount: number;
  passedRequiredAssessmentCount: number;
  certificateId: string | null;
};

// ─── LessonProgress ───────────────────────────────────────────────────────────

export type LessonProgressInfo = {
  lessonId: string;
  status: LessonProgressStatus;
  completedAt: Date | null;
};

// ─── Assessment ───────────────────────────────────────────────────────────────

export type AssessmentSummary = {
  id: string;
  lessonId: string | null;
  title: string;
  passPercentage: number;
  maxAttempts: number;
  isRequiredForCompletion: boolean;
};

export type AssessmentDetail = {
  id: string;
  title: string;
  description: string | null;
  passPercentage: number;
  maxAttempts: number;
  timeLimitMinutes: number | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showFeedbackImmediately: boolean;
  isRequiredForCompletion: boolean;
  questions: QuestionDetail[];
};

// ─── Question ────────────────────────────────────────────────────────────────

export type QuestionDetail = {
  id: string;
  type: QuestionType;
  prompt: string;
  order: number;
  points: number;
  objectiveCodes: string[];
  options: QuestionOptionDetail[];
};

export type QuestionOptionDetail = {
  id: string;
  label: string;
  order: number;
};

// ─── AssessmentAttempt ────────────────────────────────────────────────────────

export type AttemptResult = {
  id: string;
  attemptNumber: number;
  startedAt: Date;
  submittedAt: Date | null;
  scoreRaw: number | null;
  scorePercentage: number | null;
  passed: boolean | null;
};

// ─── Certificate ──────────────────────────────────────────────────────────────

export type CertificateSummary = {
  id: string;
  courseId: string;
  courseTitle: string;
  issuedAt: Date;
  scorePercentage: number | null;
  studyLoadMinutes: number | null;
  certificateCode: string;
  versionNumber: string;
};

// ─── Team rapportage ──────────────────────────────────────────────────────────

export type TeamMemberProgress = {
  userId: string;
  userName: string;
  enrollments: {
    courseTitle: string;
    status: EnrollmentStatus;
    completedAt: Date | null;
    deadlineAt: Date | null;
  }[];
};
