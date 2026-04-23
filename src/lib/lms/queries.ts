"server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { calculateCourseProgress, selectLatestPassedAttempt } from "./query-helpers";
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
} from "./types";

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
  course: { title: string };
  courseVersion: { versionNumber: string };
}): CertificateSummary {
  return {
    id: certificate.id,
    courseId: certificate.courseId,
    courseTitle: certificate.course.title,
    issuedAt: certificate.issuedAt,
    scorePercentage: certificate.scorePercentage,
    studyLoadMinutes: certificate.studyLoadMinutes,
    certificateCode: certificate.certificateCode,
    versionNumber: certificate.courseVersion.versionNumber,
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
    lessons: {
      id: string;
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
      isRequiredForCompletion: boolean;
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
          lessons: activeVersion.lessons.map((lesson) => ({
            id: lesson.id,
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
              lessons: { orderBy: { order: "asc" } },
              assessments: true,
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
              lessons: { orderBy: { order: "asc" } },
              assessments: true,
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
          include: { options: { orderBy: { order: "asc" } } },
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
