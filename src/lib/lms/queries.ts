"server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type {
  CourseSummary,
  CourseDetail,
  EnrollmentSummary,
  LessonProgressInfo,
  AssessmentDetail,
  AttemptResult,
  CertificateSummary,
  TeamMemberProgress,
} from "./types";

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

  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    status: c.status,
    isMandatory: c.isMandatory,
    studyLoadMinutes: c.studyLoadMinutes,
    authorName: c.author.name,
    publishedAt: c.publishedAt,
    versionCount: c.versions.length,
    enrollmentCount: c.enrollments.length,
  }));
});

// ─── Cursusdetail ──────────────────────────────────────────────────────────────

export const getCourseDetail = cache(
  async (courseId: string): Promise<CourseDetail | null> => {
    const c = await prisma.course.findUnique({
      where: { id: courseId },
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

    if (!c) return null;

    const activeVersion = c.versions[0] ?? null;

    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      description: c.description,
      audience: c.audience,
      learningObjectives: c.learningObjectives,
      studyLoadMinutes: c.studyLoadMinutes,
      status: c.status,
      isMandatory: c.isMandatory,
      authorId: c.authorId,
      authorName: c.author.name,
      reviewerId: c.reviewerId,
      reviewerName: c.reviewer?.name ?? null,
      publishedAt: c.publishedAt,
      revisionDueAt: c.revisionDueAt,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      activeVersion: activeVersion
        ? {
            id: activeVersion.id,
            courseId: activeVersion.courseId,
            versionNumber: activeVersion.versionNumber,
            changeSummary: activeVersion.changeSummary,
            isActive: activeVersion.isActive,
            createdAt: activeVersion.createdAt,
            lessons: activeVersion.lessons.map((l) => ({
              id: l.id,
              title: l.title,
              type: l.type,
              order: l.order,
              isRequired: l.isRequired,
              estimatedMinutes: l.estimatedMinutes,
            })),
            assessments: activeVersion.assessments.map((a) => ({
              id: a.id,
              title: a.title,
              passPercentage: a.passPercentage,
              maxAttempts: a.maxAttempts,
              isRequiredForCompletion: a.isRequiredForCompletion,
            })),
          }
        : null,
    };
  }
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
      where: { userId },
    });

    return enrollments.map((e) => {
      const activeVersion = e.course.versions[0];
      const totalLessons = activeVersion?.lessons.length ?? 0;
      const completedLessons = progressRecords.filter(
        (p) =>
          p.status === "COMPLETED" &&
          activeVersion?.lessons.some((l) => l.id === p.lessonId)
      ).length;
      const progress =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

      return {
        id: e.id,
        courseId: e.courseId,
        courseTitle: e.course.title,
        courseSlug: e.course.slug,
        status: e.status,
        assignmentType: e.assignmentType,
        deadlineAt: e.deadlineAt,
        startedAt: e.startedAt,
        completedAt: e.completedAt,
        progress,
      };
    });
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
        lessonId: { in: lessons.map((l) => l.id) },
      },
    });

    return lessons.map((l) => {
      const p = progress.find((pr) => pr.lessonId === l.id);
      return {
        lessonId: l.id,
        status: p?.status ?? "NOT_STARTED",
        completedAt: p?.completedAt ?? null,
      };
    });
  }
);

// ─── Toetsdetail met vragen ───────────────────────────────────────────────────

export const getAssessmentDetail = cache(
  async (assessmentId: string): Promise<AssessmentDetail | null> => {
    const a = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: { options: { orderBy: { order: "asc" } } },
        },
      },
    });

    if (!a) return null;

    return {
      id: a.id,
      title: a.title,
      description: a.description,
      passPercentage: a.passPercentage,
      maxAttempts: a.maxAttempts,
      timeLimitMinutes: a.timeLimitMinutes,
      shuffleQuestions: a.shuffleQuestions,
      shuffleOptions: a.shuffleOptions,
      showFeedbackImmediately: a.showFeedbackImmediately,
      isRequiredForCompletion: a.isRequiredForCompletion,
      questions: a.questions.map((q) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        explanation: q.explanation,
        order: q.order,
        points: q.points,
        options: q.options.map((o) => ({
          id: o.id,
          label: o.label,
          isCorrect: o.isCorrect,
          order: o.order,
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

    return attempts.map((a) => ({
      id: a.id,
      attemptNumber: a.attemptNumber,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
      scoreRaw: a.scoreRaw,
      scorePercentage: a.scorePercentage,
      passed: a.passed,
    }));
  }
);

// ─── Certificaten (medewerker) ────────────────────────────────────────────────

export const getMyCertificates = cache(
  async (userId: string): Promise<CertificateSummary[]> => {
    const certs = await prisma.certificate.findMany({
      where: { userId },
      include: {
        course: true,
        courseVersion: true,
      },
      orderBy: { issuedAt: "desc" },
    });

    return certs.map((c) => ({
      id: c.id,
      courseId: c.courseId,
      courseTitle: c.course.title,
      issuedAt: c.issuedAt,
      scorePercentage: c.scorePercentage,
      studyLoadMinutes: c.studyLoadMinutes,
      certificateCode: c.certificateCode,
      versionNumber: c.courseVersion.versionNumber,
    }));
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
      enrollments: member.enrollments.map((e) => ({
        courseTitle: e.course.title,
        status: e.status,
        completedAt: e.completedAt,
        deadlineAt: e.deadlineAt,
      })),
    }));
  }
);
