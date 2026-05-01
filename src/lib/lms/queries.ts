"server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { calculateCourseProgress, selectLatestPassedAttempt } from "./query-helpers";
import { buildParticipantCompletionReport } from "./participant-report";
import type { CertificateEvidenceInput } from "./certificate-evidence";
import type { ParticipantCompletionReport } from "./participant-report";
import type { WorkForm } from "@prisma/client";
import type {
  AssessmentDetail,
  AttemptResult,
  CertificateSummary,
  CourseDetail,
  CourseSummary,
  EnrollmentDetail,
  EnrollmentSummary,
  LessonDetail,
  LessonProgressInfo,
  TeamMemberProgress,
  CourseAuthorExpert,
} from "./types";


function mapAuthorExperts(value: unknown): CourseAuthorExpert[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is CourseAuthorExpert => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const candidate = item as Record<string, unknown>;
    return typeof candidate.name === "string" && typeof candidate.role === "string";
  });
}

function mapLearnerOutcomes(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function mapAttemptResult(attempt: {
  id: string;
  attemptNumber: number;
  startedAt: Date;
  submittedAt: Date | null;
  scoreRaw: number | null;
  scorePercentage: number | null;
  passed: boolean | null;
}): AttemptResult {
  return {
    id: attempt.id,
    attemptNumber: attempt.attemptNumber,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    scoreRaw: attempt.scoreRaw,
    scorePercentage: attempt.scorePercentage,
    passed: attempt.passed,
  };
}

function mapCertificateSummary(certificate: {
  id: string;
  courseId: string;
  issuedAt: Date;
  scorePercentage: number | null;
  studyLoadMinutes: number | null;
  certificateCode: string;
  participantName: string | null;
  registrationNumber: string | null;
  courseTitle: string | null;
  completedAt: Date | null;
  attemptCount: number | null;
  evaluationCompleted: boolean;
  courseVersionNumber: string | null;
  accreditationRegisterSnapshot: string | null;
  course: { title: string; accreditationRegister: string | null };
  courseVersion: { versionNumber: string };
}): CertificateSummary {
  return {
    id: certificate.id,
    courseId: certificate.courseId,
    courseTitle: certificate.courseTitle ?? certificate.course.title,
    participantName: certificate.participantName,
    registrationNumber: certificate.registrationNumber,
    completedAt: certificate.completedAt,
    issuedAt: certificate.issuedAt,
    scorePercentage: certificate.scorePercentage,
    studyLoadMinutes: certificate.studyLoadMinutes,
    attemptCount: certificate.attemptCount,
    evaluationCompleted: certificate.evaluationCompleted,
    certificateCode: certificate.certificateCode,
    versionNumber: certificate.courseVersionNumber ?? certificate.courseVersion.versionNumber,
    accreditationRegister: certificate.accreditationRegisterSnapshot ?? certificate.course.accreditationRegister,
  };
}

function mapCourseDetail(course: {
  id: string;
  title: string;
  slug: string;
  description: string;
  audience: string | null;
  learningObjectives: string | null;
  goal: string | null;
  focus: string | null;
  learnerOutcomes: unknown;
  accreditationRegister: string | null;
  accreditationKind: CourseDetail["accreditationKind"];
  versionDate: Date | null;
  authorExperts: unknown;
  requiredQuestionCount: number | null;
  studyLoadMinutes: number;
  status: CourseDetail["status"];
  isMandatory: boolean;
  authorId: string;
  reviewerId: string | null;
  publishedAt: Date | null;
  revisionDueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: { name: string };
  reviewer: { name: string } | null;
  versions: {
    id: string;
    courseId: string;
    versionNumber: string;
    changeSummary: string | null;
    isActive: boolean;
    createdAt: Date;
    modules: {
      id: string;
      title: string;
      description: string | null;
      introduction: string | null;
      summary: string | null;
      order: number;
      estimatedMinutes: number;
      workForms: WorkForm[];
    }[];
    objectives: {
      id: string;
      moduleId: string | null;
      code: string;
      text: string;
      order: number;
    }[];
    literature: {
      id: string;
      moduleId: string | null;
      title: string;
      source: string | null;
      url: string | null;
      guideline: string | null;
      year: number | null;
      order: number;
    }[];
    competencies: {
      id: string;
      moduleId: string | null;
      name: string;
      framework: string | null;
      description: string | null;
    }[];
    evaluationForms: {
      id: string;
      title: string;
      isRequired: boolean;
      questions: {
        id: string;
        label: string;
        type: "SCALE_1_5" | "TEXT" | "YES_NO";
        order: number;
        isRequired: boolean;
      }[];
    }[];
    changeLogs: {
      id: string;
      changedAt: Date;
      changeType: string;
      summary: string;
      changedBy: { name: string };
    }[];
    lessons: {
      id: string;
      moduleId: string | null;
      title: string;
      slug: string;
      type: LessonDetail["type"];
      order: number;
      isRequired: boolean;
      estimatedMinutes: number;
    }[];
    assessments: {
      id: string;
      lessonId: string | null;
      title: string;
      passPercentage: number;
      maxAttempts: number;
      shuffleQuestions: boolean;
      shuffleOptions: boolean;
      isRequiredForCompletion: boolean;
      questions: { objectives: { learningObjectiveId: string }[] }[];
    }[];
  }[];
}): CourseDetail {
  const activeVersion = course.versions[0] ?? null;

  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    audience: course.audience,
    learningObjectives: course.learningObjectives,
    goal: course.goal,
    focus: course.focus,
    learnerOutcomes: mapLearnerOutcomes(course.learnerOutcomes),
    accreditationRegister: course.accreditationRegister,
    accreditationKind: course.accreditationKind,
    versionDate: course.versionDate,
    authorExperts: mapAuthorExperts(course.authorExperts),
    requiredQuestionCount: course.requiredQuestionCount,
    studyLoadMinutes: course.studyLoadMinutes,
    status: course.status,
    isMandatory: course.isMandatory,
    authorId: course.authorId,
    authorName: course.author.name,
    reviewerId: course.reviewerId,
    reviewerName: course.reviewer?.name ?? null,
    publishedAt: course.publishedAt,
    revisionDueAt: course.revisionDueAt,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    activeVersion: activeVersion
      ? {
          id: activeVersion.id,
          courseId: activeVersion.courseId,
          versionNumber: activeVersion.versionNumber,
          changeSummary: activeVersion.changeSummary,
          isActive: activeVersion.isActive,
          createdAt: activeVersion.createdAt,
          modules: activeVersion.modules.map((module) => ({
            id: module.id,
            title: module.title,
            description: module.description,
            introduction: module.introduction,
            summary: module.summary,
            order: module.order,
            estimatedMinutes: module.estimatedMinutes,
            workForms: module.workForms,
          })),
          objectives: activeVersion.objectives.map((objective) => ({
            id: objective.id,
            moduleId: objective.moduleId,
            code: objective.code,
            text: objective.text,
            order: objective.order,
          })),
          literature: activeVersion.literature.map((reference) => ({
            id: reference.id,
            moduleId: reference.moduleId,
            title: reference.title,
            source: reference.source,
            url: reference.url,
            guideline: reference.guideline,
            year: reference.year,
            order: reference.order,
          })),
          competencies: activeVersion.competencies.map((reference) => ({
            id: reference.id,
            moduleId: reference.moduleId,
            name: reference.name,
            framework: reference.framework,
            description: reference.description,
          })),
          evaluationForms: activeVersion.evaluationForms.map((form) => ({
            id: form.id,
            title: form.title,
            isRequired: form.isRequired,
            questionCount: form.questions.length,
            questions: [...form.questions]
              .sort((left, right) => left.order - right.order)
              .map((question) => ({
                id: question.id,
                label: question.label,
                type: question.type,
                order: question.order,
                isRequired: question.isRequired,
              })),
          })),
          changeLogs: activeVersion.changeLogs.map((entry) => ({
            id: entry.id,
            changedAt: entry.changedAt,
            changeType: entry.changeType,
            summary: entry.summary,
            changedByName: entry.changedBy.name,
          })),
          lessons: activeVersion.lessons.map((lesson) => ({
            id: lesson.id,
            moduleId: lesson.moduleId,
            title: lesson.title,
            slug: lesson.slug,
            type: lesson.type,
            order: lesson.order,
            isRequired: lesson.isRequired,
            estimatedMinutes: lesson.estimatedMinutes,
          })),
          assessments: activeVersion.assessments.map((assessment) => ({
            id: assessment.id,
            lessonId: assessment.lessonId,
            title: assessment.title,
            passPercentage: assessment.passPercentage,
            maxAttempts: assessment.maxAttempts,
            shuffleQuestions: assessment.shuffleQuestions,
            shuffleOptions: assessment.shuffleOptions,
            questionCount: assessment.questions.length,
            allQuestionsLinkedToObjectives: assessment.questions.every(
              (question) => question.objectives.length > 0
            ),
            isRequiredForCompletion: assessment.isRequiredForCompletion,
          })),
        }
      : null,
  };
}

async function getCourseDetailRecord(where: { id?: string; slug?: string }) {
  const course = where.id
    ? await prisma.course.findUnique({
        where: { id: where.id },
        include: {
          author: true,
          reviewer: true,
          versions: {
            where: { isActive: true },
            include: {
              modules: { orderBy: { order: "asc" } },
              objectives: { orderBy: { order: "asc" } },
              literature: { orderBy: { order: "asc" } },
              competencies: true,
              evaluationForms: {
                include: { questions: true },
              },
              changeLogs: {
                include: { changedBy: true },
                orderBy: { changedAt: "desc" },
              },
              lessons: { orderBy: { order: "asc" } },
              assessments: {
                include: {
                  questions: { include: { objectives: true } },
                },
              },
            },
          },
        },
      })
    : await prisma.course.findUnique({
        where: { slug: where.slug },
        include: {
          author: true,
          reviewer: true,
          versions: {
            where: { isActive: true },
            include: {
              modules: { orderBy: { order: "asc" } },
              objectives: { orderBy: { order: "asc" } },
              literature: { orderBy: { order: "asc" } },
              competencies: true,
              evaluationForms: {
                include: { questions: true },
              },
              changeLogs: {
                include: { changedBy: true },
                orderBy: { changedAt: "desc" },
              },
              lessons: { orderBy: { order: "asc" } },
              assessments: {
                include: {
                  questions: { include: { objectives: true } },
                },
              },
            },
          },
        },
      });

  return course ? mapCourseDetail(course) : null;
}

// ─── Cursusoverzicht (admin) ───────────────────────────────────────────────────

export const getAllCourses = cache(async (): Promise<CourseSummary[]> => {
  const courses = await prisma.course.findMany({
    include: {
      author: true,
      versions: { where: { isActive: true } },
      enrollments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    status: course.status,
    isMandatory: course.isMandatory,
    studyLoadMinutes: course.studyLoadMinutes,
    accreditationRegister: course.accreditationRegister,
    accreditationKind: course.accreditationKind,
    versionDate: course.versionDate,
    requiredQuestionCount: course.requiredQuestionCount,
    authorName: course.author.name,
    publishedAt: course.publishedAt,
    versionCount: course.versions.length,
    enrollmentCount: course.enrollments.length,
  }));
});

// ─── Cursusdetail ──────────────────────────────────────────────────────────────

export const getCourseDetail = cache(
  async (courseId: string): Promise<CourseDetail | null> =>
    getCourseDetailRecord({ id: courseId })
);

export const getCourseBySlug = cache(
  async (slug: string): Promise<CourseDetail | null> =>
    getCourseDetailRecord({ slug })
);

// ─── Eigen inschrijvingen (medewerker) ────────────────────────────────────────

export const getMyEnrollments = cache(
  async (userId: string): Promise<EnrollmentSummary[]> => {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            versions: {
              where: { isActive: true },
              include: { lessons: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const progressRecords = await prisma.lessonProgress.findMany({
      where: { userId, status: "COMPLETED" },
    });
    const completedLessonIds = progressRecords.map((progress) => progress.lessonId);

    return enrollments.map((enrollment) => {
      const activeVersion = enrollment.course.versions[0];
      const lessonIds = activeVersion?.lessons.map((lesson) => lesson.id) ?? [];
      const progress = calculateCourseProgress({
        lessonIds,
        completedLessonIds,
      });

      return {
        id: enrollment.id,
        courseId: enrollment.courseId,
        courseTitle: enrollment.course.title,
        courseSlug: enrollment.course.slug,
        status: enrollment.status,
        assignmentType: enrollment.assignmentType,
        deadlineAt: enrollment.deadlineAt,
        startedAt: enrollment.startedAt,
        completedAt: enrollment.completedAt,
        progress,
      };
    });
  }
);

export const getEnrollmentDetailForUser = cache(
  async (userId: string, courseId: string): Promise<EnrollmentDetail | null> => {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: {
        course: {
          include: {
            versions: {
              where: { isActive: true },
              include: {
                lessons: true,
                assessments: true,
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      return null;
    }

    const activeVersion = enrollment.course.versions[0] ?? null;
    const lessonIds = activeVersion?.lessons.map((lesson) => lesson.id) ?? [];
    const requiredAssessmentIds =
      activeVersion?.assessments
        .filter((assessment) => assessment.isRequiredForCompletion)
        .map((assessment) => assessment.id) ?? [];

    const [progressRecords, assessmentAttempts, certificate] = await Promise.all([
      prisma.lessonProgress.findMany({
        where: { userId, lessonId: { in: lessonIds } },
      }),
      prisma.assessmentAttempt.findMany({
        where: { userId, assessmentId: { in: requiredAssessmentIds } },
        orderBy: { attemptNumber: "asc" },
      }),
      prisma.certificate.findFirst({
        where: { userId, courseId },
        orderBy: { issuedAt: "desc" },
      }),
    ]);

    const completedLessonIds = progressRecords
      .filter((progress) => progress.status === "COMPLETED")
      .map((progress) => progress.lessonId);

    const passedRequiredAssessmentCount = requiredAssessmentIds.filter((assessmentId) => {
      const attemptsForAssessment = assessmentAttempts
        .filter((attempt) => attempt.assessmentId === assessmentId)
        .map(mapAttemptResult);

      return selectLatestPassedAttempt(attemptsForAssessment) !== null;
    }).length;

    return {
      id: enrollment.id,
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      courseTitle: enrollment.course.title,
      courseSlug: enrollment.course.slug,
      status: enrollment.status,
      assignmentType: enrollment.assignmentType,
      deadlineAt: enrollment.deadlineAt,
      startedAt: enrollment.startedAt,
      completedAt: enrollment.completedAt,
      progress: calculateCourseProgress({
        lessonIds,
        completedLessonIds,
      }),
      activeVersionId: activeVersion?.id ?? null,
      lessonCount: lessonIds.length,
      completedLessonCount: completedLessonIds.length,
      requiredAssessmentCount: requiredAssessmentIds.length,
      passedRequiredAssessmentCount,
      certificateId: certificate?.id ?? null,
    };
  }
);

// ─── Lesvoortgang per gebruiker ───────────────────────────────────────────────

export const getLessonProgressForVersion = cache(
  async (userId: string, courseVersionId: string): Promise<LessonProgressInfo[]> => {
    const lessons = await prisma.lesson.findMany({
      where: { courseVersionId },
      select: { id: true },
    });

    const progress = await prisma.lessonProgress.findMany({
      where: {
        userId,
        lessonId: { in: lessons.map((lesson) => lesson.id) },
      },
    });

    return lessons.map((lesson) => {
      const lessonProgress = progress.find((item) => item.lessonId === lesson.id);
      return {
        lessonId: lesson.id,
        status: lessonProgress?.status ?? "NOT_STARTED",
        completedAt: lessonProgress?.completedAt ?? null,
      };
    });
  }
);

export const getLessonDetail = cache(
  async (lessonId: string): Promise<LessonDetail | null> => {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return null;
    }

    return {
      id: lesson.id,
      courseVersionId: lesson.courseVersionId,
      moduleId: lesson.moduleId,
      title: lesson.title,
      slug: lesson.slug,
      description: lesson.description,
      type: lesson.type,
      content: lesson.content,
      order: lesson.order,
      isRequired: lesson.isRequired,
      estimatedMinutes: lesson.estimatedMinutes,
    };
  }
);

// ─── Toetsdetail met vragen ───────────────────────────────────────────────────

export const getAssessmentDetail = cache(
  async (assessmentId: string): Promise<AssessmentDetail | null> => {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: {
            objectives: { include: { learningObjective: true } },
            options: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    if (!assessment) return null;

    return {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      passPercentage: assessment.passPercentage,
      maxAttempts: assessment.maxAttempts,
      timeLimitMinutes: assessment.timeLimitMinutes,
      shuffleQuestions: assessment.shuffleQuestions,
      shuffleOptions: assessment.shuffleOptions,
      showFeedbackImmediately: assessment.showFeedbackImmediately,
      isRequiredForCompletion: assessment.isRequiredForCompletion,
      questions: assessment.questions.map((question) => ({
        id: question.id,
        type: question.type,
        prompt: question.prompt,
        order: question.order,
        points: question.points,
        objectiveCodes: question.objectives.map(
          (objective) => objective.learningObjective.code
        ),
        options: question.options.map((option) => ({
          id: option.id,
          label: option.label,
          order: option.order,
        })),
      })),
    };
  }
);

// ─── Pogingen per gebruiker per toets ────────────────────────────────────────

export const getMyAttempts = cache(
  async (userId: string, assessmentId: string): Promise<AttemptResult[]> => {
    const attempts = await prisma.assessmentAttempt.findMany({
      where: { userId, assessmentId },
      orderBy: { attemptNumber: "asc" },
    });

    return attempts.map(mapAttemptResult);
  }
);

export const getLatestPassedAttemptForAssessment = cache(
  async (userId: string, assessmentId: string): Promise<AttemptResult | null> => {
    const attempts = await prisma.assessmentAttempt.findMany({
      where: { userId, assessmentId },
      orderBy: { attemptNumber: "asc" },
    });

    return selectLatestPassedAttempt(attempts.map(mapAttemptResult));
  }
);

// ─── Certificaten (medewerker) ────────────────────────────────────────────────

export const getMyCertificates = cache(
  async (userId: string): Promise<CertificateSummary[]> => {
    const certificates = await prisma.certificate.findMany({
      where: { userId },
      include: {
        course: true,
        courseVersion: true,
      },
      orderBy: { issuedAt: "desc" },
    });

    return certificates.map(mapCertificateSummary);
  }
);

export const getCertificateForCourseAndUser = cache(
  async (userId: string, courseId: string): Promise<CertificateSummary | null> => {
    const certificate = await prisma.certificate.findFirst({
      where: { userId, courseId },
      include: {
        course: true,
        courseVersion: true,
      },
      orderBy: { issuedAt: "desc" },
    });

    return certificate ? mapCertificateSummary(certificate) : null;
  }
);

export const getCertificateEvidence = cache(
  async (certificateId: string): Promise<CertificateEvidenceInput | null> => {
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        user: true,
        course: true,
        courseVersion: {
          include: {
            assessments: true,
            evaluationForms: true,
          },
        },
      },
    });

    if (!certificate) {
      return null;
    }

    const [enrollment, attempts, evaluationSubmission] = await Promise.all([
      prisma.enrollment.findFirst({
        where: {
          userId: certificate.userId,
          courseId: certificate.courseId,
        },
        orderBy: { completedAt: "desc" },
      }),
      prisma.assessmentAttempt.findMany({
        where: {
          userId: certificate.userId,
          courseVersionId: certificate.courseVersionId,
          assessmentId: { in: certificate.courseVersion.assessments.map((assessment) => assessment.id) },
          submittedAt: { not: null },
        },
        orderBy: { attemptNumber: "asc" },
      }),
      prisma.evaluationSubmission.findFirst({
        where: {
          userId: certificate.userId,
          evaluationFormId: { in: certificate.courseVersion.evaluationForms.map((form) => form.id) },
        },
      }),
    ]);

    return {
      certificateId: certificate.id,
      userId: certificate.userId,
      courseId: certificate.courseId,
      certificateCode: certificate.certificateCode,
      participantName: certificate.participantName ?? certificate.user.name,
      professionalRegistrationNumber:
        certificate.registrationNumber ?? certificate.user.professionalRegistrationNumber,
      courseTitle: certificate.courseTitle ?? certificate.course.title,
      completedAt: certificate.completedAt ?? enrollment?.completedAt ?? certificate.issuedAt,
      issuedAt: certificate.issuedAt,
      scorePercentage: certificate.scorePercentage,
      attemptCount: certificate.attemptCount ?? attempts.length,
      evaluationCompleted: certificate.evaluationCompleted || evaluationSubmission !== null,
      studyLoadMinutes: certificate.studyLoadMinutes ?? certificate.course.studyLoadMinutes,
      versionNumber: certificate.courseVersionNumber ?? certificate.courseVersion.versionNumber,
      accreditationRegister:
        certificate.accreditationRegisterSnapshot ?? certificate.course.accreditationRegister,
      accreditationKind: certificate.accreditationKindSnapshot ?? certificate.course.accreditationKind,
    };
  }
);

export const getCourseParticipantCompletionReport = cache(
  async (courseId: string): Promise<ParticipantCompletionReport[]> => {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        versions: {
          where: { isActive: true },
          include: {
            assessments: true,
            evaluationForms: true,
          },
        },
        enrollments: {
          include: { user: true },
          orderBy: { createdAt: "asc" },
        },
        certificates: true,
      },
    });

    if (!course) {
      return [];
    }

    const activeVersion = course.versions[0] ?? null;
    if (!activeVersion) {
      return [];
    }

    const [assessmentAttempts, evaluationSubmissions] = await Promise.all([
      prisma.assessmentAttempt.findMany({
        where: {
          courseVersionId: activeVersion.id,
          userId: { in: course.enrollments.map((enrollment) => enrollment.userId) },
        },
        include: { assessment: true },
        orderBy: [{ userId: "asc" }, { attemptNumber: "asc" }],
      }),
      prisma.evaluationSubmission.findMany({
        where: {
          userId: { in: course.enrollments.map((enrollment) => enrollment.userId) },
          evaluationFormId: { in: activeVersion.evaluationForms.map((form) => form.id) },
        },
      }),
    ]);

    return course.enrollments.map((enrollment) => {
      const certificate = course.certificates
        .filter((entry) => entry.userId === enrollment.userId && entry.courseVersionId === activeVersion.id)
        .sort((left, right) => right.issuedAt.getTime() - left.issuedAt.getTime())[0] ?? null;

      return buildParticipantCompletionReport({
        courseTitle: course.title,
        participantName: enrollment.user.name,
        professionalRegistrationNumber: enrollment.user.professionalRegistrationNumber,
        completedAt: enrollment.completedAt,
        enrollmentStatus: enrollment.status,
        assessmentAttempts: assessmentAttempts
          .filter((attempt) => attempt.userId === enrollment.userId)
          .map((attempt) => ({
            assessmentTitle: attempt.assessment.title,
            attemptNumber: attempt.attemptNumber,
            scorePercentage: attempt.scorePercentage,
            passed: attempt.passed,
            submittedAt: attempt.submittedAt,
          })),
        certificate: certificate
          ? {
              id: certificate.id,
              certificateCode: certificate.certificateCode,
              issuedAt: certificate.issuedAt,
            }
          : null,
        evaluationCompleted: evaluationSubmissions.some((submission) => submission.userId === enrollment.userId),
      });
    });
  }
);

// ─── Teamvoortgang (teamleider) ───────────────────────────────────────────────

export const getTeamLmsProgress = cache(
  async (teamleaderId: string): Promise<TeamMemberProgress[]> => {
    const teamMembers = await prisma.user.findMany({
      where: { teamleaderId },
      include: {
        enrollments: {
          include: { course: true },
        },
      },
    });

    return teamMembers.map((member) => ({
      userId: member.id,
      userName: member.name,
      enrollments: member.enrollments.map((enrollment) => ({
        courseTitle: enrollment.course.title,
        status: enrollment.status,
        completedAt: enrollment.completedAt,
        deadlineAt: enrollment.deadlineAt,
      })),
    }));
  }
);
